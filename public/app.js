// app.js: the study tracker. Real logins and shared data through Firebase.
(function () {
  'use strict';
  const CFG = window.APP_CONFIG;
  const { util: U, SUBJECTS } = window.PLAN;
  const app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => U.todayStr();
  const nowIso = () => new Date().toISOString();
  const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const fmtDate = (d, short) => { const x = U.parse(d); return short ? `${x.getDate()} ${MON[x.getMonth()].slice(0, 3)}` : `${WD[x.getDay()]}, ${x.getDate()} ${MON[x.getMonth()]}`; };
  const MILESTONES = [3, 7, 14, 21, 30, 45, 60, 75, 100];
  const RANKS = [[1, 'Rookie'], [3, 'Scout'], [5, 'Ranger'], [8, 'Knight'], [11, 'Paladin'], [14, 'Champion'], [18, 'Legend'], [22, 'Mythic']];
  const BOSSES = ['🐉', '👹', '🦑', '👾', '🤖', '🦖', '🧟', '👻', '🐲', '🦂'];
  const levelOf = xp => Math.floor(Math.sqrt(xp / 50)) + 1;
  const lvlStart = l => 50 * (l - 1) * (l - 1);
  const xpOfTask = t => t.optional ? 5 : 10;

  // ---------- storage ----------
  class FireStore {
    async init(onUser) {
      const base = 'https://www.gstatic.com/firebasejs/10.12.2/';
      const [a, au, fs] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
      this.m = Object.assign({}, au, fs);
      const fbApp = a.initializeApp(CFG.firebase);
      this.auth = au.getAuth(fbApp); this.db = fs.getFirestore(fbApp);
      au.onAuthStateChanged(this.auth, async user => {
        if (!user) { onUser(null); return; }
        try {
          const snap = await fs.getDoc(fs.doc(this.db, 'roles', user.uid));
          onUser(snap.exists() ? Object.assign({ uid: user.uid }, snap.data()) : { uid: user.uid, role: null });
        } catch (e) { onUser({ uid: user.uid, role: null, error: e.message }); }
      });
    }
    signIn(email, pw) { return this.m.signInWithEmailAndPassword(this.auth, email, pw); }
    signOut() { (this.unsubs || []).forEach(u => u()); return this.m.signOut(this.auth); }
    subscribe(cb) {
      const { collection, onSnapshot, doc } = this.m; const data = { days: {}, tests: {}, settings: {} };
      const fail = e => toast('Could not load data: ' + e.message);
      this.unsubs = [
        onSnapshot(collection(this.db, 'days'), s => { data.days = {}; s.forEach(d => { data.days[d.id] = d.data(); }); cb(data); }, fail),
        onSnapshot(collection(this.db, 'tests'), s => { data.tests = {}; s.forEach(d => { data.tests[d.id] = d.data(); }); cb(data); }, fail),
        onSnapshot(doc(this.db, 'settings', 'main'), s => { data.settings = s.exists() ? s.data() : {}; cb(data); }, fail)
      ];
    }
    save(coll, id, patch) {
      const ref = coll === 'settings' ? this.m.doc(this.db, 'settings', 'main') : this.m.doc(this.db, coll, id);
      return this.m.setDoc(ref, patch, { merge: true });
    }
  }

  const store = new FireStore();
  const save = (coll, id, patch) => store.save(coll, id, patch).catch(e => toast('Not saved: ' + e.message));

  // ---------- state ----------
  const state = {
    user: null, view: 'today', sel: today(), month: today().slice(0, 7), testId: null,
    days: {}, tests: {}, settings: {}, plan: null, planKey: '', loaded: false
  };
  const isParent = () => state.user && state.user.role === 'parent';

  function rebuildPlan() {
    const ov = (state.settings && state.settings.offDays) || {};
    const key = JSON.stringify(ov);
    if (state.plan && key === state.planKey) return;
    const extra = {}, removed = [];
    Object.keys(ov).forEach(d => { if (ov[d]) extra[d] = ov[d]; else removed.push(d); });
    state.plan = window.PLAN.build(CFG, extra, removed); state.planKey = key;
  }

  // ---------- status and streaks ----------
  const rec = d => state.days[d] || {};
  const testDone = id => { const r = state.tests[id]; return !!(r && (r.submittedAt || r.externalScore != null)); };
  const isDone = (d, t) => !!((rec(d).done && rec(d).done[t.id]) || (t.testId && testDone(t.testId)));
  function statusOf(d) {
    const p = state.plan.days[d]; if (!p) return 'none';
    if (p.kind === 'sunday' || p.kind === 'off') return 'off';
    const r = rec(d);
    if (r.freePass) return 'pass';
    if (d > today()) return 'upcoming';
    const req = p.tasks.filter(t => !t.optional);
    const done = req.filter(t => isDone(d, t));
    if (req.length && done.length === req.length) return 'done';
    const b1 = req.filter(t => t.block === 1);
    if (b1.length && b1.every(t => isDone(d, t))) return 'min';
    if (d === today()) return done.length ? 'progress' : 'open';
    return done.length ? 'partial' : 'missed';
  }
  const STATUS = {
    done: { label: 'Day cleared', mark: '✓' }, min: { label: 'Minimum clear (Maths done)', mark: '½' },
    partial: { label: 'Partly done', mark: '–' }, missed: { label: 'Missed', mark: '✗' },
    off: { label: 'Rest day', mark: '' }, pass: { label: 'Free pass', mark: 'P' },
    upcoming: { label: 'Coming up', mark: '' }, progress: { label: 'In progress', mark: '…' }, open: { label: 'Not started', mark: '' }, none: { label: '', mark: '' }
  };
  function streaks() {
    const t = today(); let run = 0, best = 0, done = 0, missed = 0, comeback = false, afterMiss = false, sinceMiss = 0;
    for (const d of Object.keys(state.plan.days).sort()) {
      if (d > t) break;
      const s = statusOf(d);
      if (s === 'off' || s === 'pass' || s === 'upcoming') continue;
      if (s === 'done' || s === 'min') { run++; done++; if (run > best) best = run; if (afterMiss && ++sinceMiss >= 3) comeback = true; }
      else if (d === t) { /* today still open: does not break the streak */ }
      else { run = 0; missed++; afterMiss = true; sinceMiss = 0; }
    }
    const next = MILESTONES.find(m => m > run) || (Math.ceil((run + 1) / 50) * 50);
    return { current: run, best, done, missed, next, comeback };
  }

  // ---------- game layer: XP, levels, badges (all derived from the ticks, nothing extra is stored) ----------
  // 10 XP per task (5 if optional), +25 for a cleared day (+10 for a minimum day), +2 per streak day (max 20),
  // and 5 XP per mark scored in a test.
  function xpTotal() {
    const t = today(); let xp = 0, run = 0;
    for (const d of Object.keys(state.plan.days).sort()) {
      if (d > t) break;
      const p = state.plan.days[d], s = statusOf(d);
      p.tasks.forEach(k => { if (isDone(d, k)) xp += xpOfTask(k); });
      if (s === 'done' || s === 'min') { run++; xp += (s === 'done' ? 25 : 10) + 2 * Math.min(run, 10); }
      else if (!['off', 'pass', 'upcoming'].includes(s) && d !== t) run = 0;
    }
    state.plan.tests.forEach(x => { const sc = testScore(x, state.tests[x.id]); if (sc) xp += 5 * (sc.partial ? sc.mcq : sc.got); });
    return xp;
  }
  function levelInfo(xp) {
    const l = levelOf(xp), a = lvlStart(l), b = lvlStart(l + 1);
    return { l, xp, into: xp - a, span: b - a, pct: Math.round(100 * (xp - a) / (b - a)), rank: RANKS.filter(r => r[0] <= l).pop()[1] };
  }
  const letter = p => p >= 90 ? 'S' : p >= 75 ? 'A' : p >= 60 ? 'B' : 'C';
  function badgeList(s, lv) {
    const t = today(); let mathsDone = 0, anyTick = false;
    Object.keys(state.plan.days).forEach(d => { if (d <= t) state.plan.days[d].tasks.forEach(k => { if (isDone(d, k)) { anyTick = true; if (k.subject === 'maths') mathsDone++; } }); });
    const scored = state.plan.tests.map(x => testScore(x, state.tests[x.id])).filter(Boolean);
    const topPct = scored.reduce((m, sc) => Math.max(m, sc.partial ? pct(sc.mcq, sc.mcqMax) : pct(sc.got, sc.max)), 0);
    return [
      ['🩸', 'First Blood', 'Tick your first task', anyTick],
      ['🔥', 'Heating Up', '3-day streak', s.best >= 3],
      ['⚡', 'Week Warrior', '7-day streak', s.best >= 7],
      ['🚀', 'Unstoppable', '14-day streak', s.best >= 14],
      ['👑', 'Streak King', '30-day streak', s.best >= 30],
      ['🔄', 'Comeback Kid', 'Clear 3 days in a row after a miss', s.comeback],
      ['⚔️', 'Boss Slayer', 'Finish a test', scored.length > 0],
      ['🏅', 'S-Rank', 'Score 90% or more in a test', topPct >= 90],
      ['🧙', 'Maths Wizard', 'Finish 25 Maths sessions', mathsDone >= 25],
      ['⭐', 'Rising Star', 'Reach level 5', lv.l >= 5],
      ['💎', 'Diamond', 'Reach level 10', lv.l >= 10]
    ];
  }
  function canEdit(d) {
    if (isParent()) return true;
    return d <= today() && U.diffDays(d, today()) <= (CFG.editWindowDays || 0);
  }
  function passesUsed(month) { return Object.keys(state.days).filter(d => d.startsWith(month) && state.days[d].freePass).length; }

  // ---------- small render helpers ----------
  const chip = s => { const S = SUBJECTS[s] || { name: s, color: '#56607A' }; return `<span class="chip" style="--c:${S.color}">${esc(S.name)}</span>`; };
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
  const scoreText = sc => sc.partial ? `A: ${sc.mcq}/${sc.mcqMax}` : `${sc.got}/${sc.max}`;
  // S/A/B/C badge for a finished test; a plain "A: 5/6" badge while Section B still waits for marks
  const rankBadge = (sc, cls) => `<span class="rank ${sc.partial ? 'r-p' : 'r-' + letter(pct(sc.got, sc.max))} ${cls || ''}"><b>${sc.partial ? '…' : letter(pct(sc.got, sc.max))}</b><i>${esc(scoreText(sc))}</i></span>`;
  const meter = (p, cls) => `<span class="meter ${cls || ''}" role="presentation"><span style="width:${Math.max(0, Math.min(100, p))}%"></span></span>`;

  function weekStrip(anchor) {
    const d0 = U.addDays(anchor, -((U.dow(anchor) + 6) % 7));
    let h = '<ol class="week" aria-label="This week">';
    for (let i = 0; i < 7; i++) {
      const d = U.addDays(d0, i), s = statusOf(d);
      h += `<li><button class="wk s-${s} ${d === today() ? 'is-today' : ''}" data-act="sel" data-date="${d}" title="${esc(fmtDate(d) + ': ' + STATUS[s].label)}">
        <span class="wk-d">${WD[U.dow(d)].slice(0, 2)}</span><span class="wk-m">${STATUS[s].mark || U.parse(d).getDate()}</span></button></li>`;
    }
    return h + '</ol>';
  }

  function streakHero() {
    const s = streaks();
    const toGo = s.next - s.current, st = statusOf(today());
    const nudge = s.current === 0 ? 'Clear today to light the flame!' : st === 'done' || st === 'min' ? 'Today is cleared. Flame is safe!' : 'Clear today’s quests to keep the flame alive.';
    return `<section class="hero">
      <div class="hero-num"><div class="flame ${s.current ? '' : 'cold'}" aria-hidden="true"><span class="flame-emoji">🔥</span><span class="flame-n">${s.current}</span></div>
        <div style="flex:1;min-width:0"><p class="hero-label">${s.current} day${s.current === 1 ? '' : 's'} streak</p>
        <p class="hero-sub">${nudge} Best: ${s.best}.</p>
        <div class="hero-goal">${meter(pct(s.current, s.next), 'tall')}<span class="small muted">Next reward at ${s.next} days, ${toGo} to go</span></div></div></div>
      ${weekStrip(today())}
      <p class="hero-rule">A day counts when every task is ticked, or at least the Maths quest on a tired day. Rest days and holidays never break the streak.</p>
    </section>`;
  }

  // ---------- day panel ----------
  const BLOCKS = [[1, '⚔️ Quest 1', '60 min'], [2, '🛡️ Quest 2', '60 min'], [3, '🧪 Quest 3', '30 min'], ['close', '🏁 Wrap-up', '10 min']];
  function dayPanel(d) {
    const p = state.plan.days[d];
    if (!p) return `<section class="day"><h2>${esc(fmtDate(d))}</h2><p class="muted">This date is outside the plan (${fmtDate(CFG.dates.start, true)} to ${fmtDate(CFG.dates.annualEnd, true)}).</p></section>`;
    const r = rec(d), s = statusOf(d), edit = canEdit(d);
    let h = `<section class="day" aria-labelledby="day-h">
      <header class="day-head"><div><h2 id="day-h">${esc(fmtDate(d))}</h2><p class="muted">${esc(p.phaseName)}</p></div>
      <span class="pill s-${s}">${esc(STATUS[s].label)}</span></header>`;
    if (p.kind === 'sunday' || p.kind === 'off') {
      h += `<div class="sheet"><p class="off-msg">😴 ${p.kind === 'sunday' ? 'Sunday is a full rest day. No quests, no conditions. Recharge!' : 'Rest day: ' + esc(p.reason) + '. Enjoy it!'}</p></div>`;
      if (isParent() && p.kind === 'off') h += `<button class="btn ghost" data-act="offday" data-date="${d}" data-on="0">Make this a quest day</button>`;
      return h + parentBox(d, r) + '</section>';
    }
    if (!edit) h += `<p class="lock">🔒 ${d > today() ? 'These quests unlock on the day.' : 'This day is closed for ticking. Ask a parent if something is wrong.'}</p>`;
    if (r.freePass) h += `<p class="lock">🛡️ Free pass used for this day. It does not break the streak.</p>`;
    const reqAll = p.tasks.filter(t => !t.optional), doneAll = reqAll.filter(t => isDone(d, t)).length;
    if (reqAll.length) h += `<div class="daybar">${meter(pct(doneAll, reqAll.length), 'tall')}<b>${doneAll}/${reqAll.length} quests</b></div>`;
    for (const [b, name, mins] of BLOCKS) {
      const ts = p.tasks.filter(t => t.block === b); if (!ts.length) continue;
      h += `<div class="block"><h3>${name}${p.kind === 'exam' || ts[0].subject === 'test' ? '' : ` <span class="muted">${mins}</span>`}</h3><ul class="sheet tasks">`;
      for (const t of ts) {
        const on = isDone(d, t), auto = on && t.testId && !(r.done && r.done[t.id]);
        h += `<li class="task ${on ? 'on' : ''} ${t.optional ? 'is-opt' : ''}">
          <label><input type="checkbox" data-act="tick" data-date="${d}" data-id="${esc(t.id)}" ${on ? 'checked' : ''} ${edit && !r.freePass && !auto ? '' : 'disabled'}>
          <span class="t-body"><span class="t-chips">${chip(t.subject)}${t.optional ? '<span class="chip opt-chip">Optional</span>' : ''}</span>
            <span class="t-title">${esc(t.title)}</span>${t.ch && t.ch !== t.title ? `<span class="t-ch">${esc(t.ch)}</span>` : ''}
            <span class="t-detail">${esc(t.detail)}</span></span><span class="xp-tag">+${xpOfTask(t)} XP</span></label>
          ${t.testId ? `<button class="btn small" data-act="test" data-id="${t.testId}">⚔️ Fight the boss</button>` : ''}
          ${t.scoreMax ? `<label class="score">Mark <input type="number" min="0" max="${t.scoreMax}" step="0.5" inputmode="decimal" data-act="score" data-date="${d}" data-id="${esc(t.id)}" value="${esc(r.scores && r.scores[t.id] != null ? r.scores[t.id] : '')}" ${edit ? '' : 'disabled'}> / ${t.scoreMax}</label>` : ''}
        </li>`;
      }
      h += '</ul></div>';
    }
    h += `<div class="block"><h3><label for="learned">💎 Loot: five things I learned today</label></h3>
      <textarea id="learned" class="sheet lined" rows="5" data-act="text" data-field="learned" data-date="${d}" ${edit ? '' : 'disabled'} placeholder="1.&#10;2.&#10;3.&#10;4.&#10;5.">${esc(r.learned)}</textarea>
      <h3><label for="note">📜 Note for ${isParent() ? 'the parent' : 'Papa/Mummy'}</label></h3>
      <textarea id="note" class="sheet" rows="2" data-act="text" data-field="note" data-date="${d}" ${edit ? '' : 'disabled'} placeholder="Anything that was hard, or that you need help with">${esc(r.note)}</textarea></div>`;
    if (!isParent() && edit && !r.freePass && s !== 'done' && p.kind !== 'exam') {
      const used = passesUsed(d.slice(0, 7));
      h += used ? `<p class="muted small">Free pass for ${MON[U.parse(d).getMonth()]} already used.</p>`
        : `<button class="btn ghost" data-act="pass" data-date="${d}">🛡️ Use this month\u2019s free pass for this day</button>`;
    }
    if (isParent()) h += `<button class="btn ghost" data-act="offday" data-date="${d}" data-on="1">Mark as a rest day</button>`;
    return h + parentBox(d, r) + '</section>';
  }
  function parentBox(d, r) {
    if (isParent()) return `<div class="block parent-box"><h3><label for="pc">Comment from parent</label></h3>
      <textarea id="pc" class="sheet" rows="2" data-act="text" data-field="parentComment" data-date="${d}" placeholder="Praise one specific thing, or note what to fix">${esc(r.parentComment)}</textarea>
      ${r.updatedAt ? `<p class="muted small">Last ticked ${esc(new Date(r.updatedAt).toLocaleString())}</p>` : ''}</div>`;
    return r.parentComment ? `<div class="block parent-box"><h3>From Papa/Mummy</h3><p class="speech">${esc(r.parentComment)}</p></div>` : '';
  }

  // ---------- calendar ----------
  function calendarView() {
    const [y, m] = state.month.split('-').map(Number);
    const first = `${state.month}-01`, lead = (U.dow(first) + 6) % 7;
    const dim = new Date(y, m, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cal-cell empty"></span>';
    for (let dd = 1; dd <= dim; dd++) {
      const d = `${state.month}-${String(dd).padStart(2, '0')}`, s = statusOf(d), p = state.plan.days[d];
      const tag = p && p.kind === 'test' ? 'Test' : p && p.kind === 'exam' ? 'Exam' : p && p.kind === 'off' ? 'Off' : '';
      cells += `<button class="cal-cell s-${s} ${d === today() ? 'is-today' : ''} ${d === state.sel ? 'is-sel' : ''}" data-act="sel" data-date="${d}" aria-label="${esc(fmtDate(d) + ', ' + STATUS[s].label)}">
        <span class="cal-n">${dd}</span><span class="cal-m">${STATUS[s].mark}</span>${tag ? `<span class="cal-tag">${tag}</span>` : ''}</button>`;
    }
    const prev = new Date(y, m - 2, 1), next = new Date(y, m, 1);
    const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return `<div class="cal-wrap"><section class="cal" aria-label="Calendar">
      <div class="cal-nav"><button class="btn ghost" data-act="month" data-m="${key(prev)}" aria-label="Previous month">‹</button>
        <h2>${MON[m - 1]} ${y}</h2><button class="btn ghost" data-act="month" data-m="${key(next)}" aria-label="Next month">›</button></div>
      <div class="cal-grid">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => `<span class="cal-wd">${w}</span>`).join('')}${cells}</div>
      <ul class="legend">${['done', 'min', 'partial', 'missed', 'pass', 'off'].map(s => `<li><span class="lg s-${s}">${STATUS[s].mark}</span>${STATUS[s].label}</li>`).join('')}</ul>
    </section>${dayPanel(state.sel)}</div>`;
  }

  // ---------- tests ----------
  const testList = () => state.plan.tests;
  const bossOf = t => BOSSES[Math.max(0, state.plan.tests.indexOf(t)) % BOSSES.length];
  function testScore(t, r) {
    if (!r) return null;
    if (t.type === 'external') return r.externalScore != null && r.externalMax ? { got: +r.externalScore, max: +r.externalMax, partial: false } : null;
    if (!r.submittedAt) return null;
    const mq = (t.mcq || []).length, wmax = (t.written || []).reduce((a, w) => a + w.marks, 0);
    const marks = r.marks || {}; const reviewed = !!r.reviewedAt;
    const wgot = (t.written || []).reduce((a, w) => a + (marks[w.id] != null && marks[w.id] !== '' ? +marks[w.id] : 0), 0);
    return { got: (r.mcqScore || 0) + (reviewed ? wgot : 0), max: mq + wmax, partial: !reviewed, mcq: r.mcqScore || 0, mcqMax: mq };
  }
  function testStatus(t) {
    const r = state.tests[t.id];
    if (t.date > today() && !(r && (r.submittedAt || r.externalScore != null))) return 'later';
    if (t.type === 'external') return r && r.externalScore != null ? (r.reviewedAt ? 'reviewed' : 'submitted') : 'open';
    if (!r || !r.submittedAt) return r && r.startedAt ? 'started' : 'open';
    return r.reviewedAt ? 'reviewed' : 'submitted';
  }
  const TS_LABEL = { later: 'Locked', open: 'Ready', started: 'In battle', submitted: isParent => isParent ? 'Needs your marks' : 'Waiting for marks', reviewed: 'Defeated' };
  const tsLabel = s => typeof TS_LABEL[s] === 'function' ? TS_LABEL[s](isParent()) : TS_LABEL[s];

  function testsView() {
    if (state.testId) return testDetail(state.plan.tests.find(t => t.id === state.testId));
    const groups = { now: [], later: [], done: [] };
    testList().forEach(t => { const s = testStatus(t); (s === 'later' ? groups.later : s === 'reviewed' || (s === 'submitted' && !isParent()) ? groups.done : groups.now).push(t); });
    const row = t => {
      const s = testStatus(t), sc = testScore(t, state.tests[t.id]);
      return `<li><button class="test-row ${sc ? 'is-done' : ''}" data-act="test" data-id="${t.id}">
        <span class="boss-ic" aria-hidden="true">${bossOf(t)}</span>
        <span class="tr-main">${chip(t.subject)}<span class="t-title">${esc(t.title)}</span>
        <span class="muted small">${fmtDate(t.date, true)} \u00b7 ${t.minutes} min${t.type === 'external' ? ', enter marks' : ''}</span></span>
        <span class="tr-score">${sc ? rankBadge(sc) : `<span class="pill ts-${s}">${tsLabel(s)}</span>`}</span></button></li>`;
    };
    return `<section class="tests"><h2>${isParent() ? '⚔️ Tests to mark and results' : '⚔️ Boss battles'}</h2>
      <h3>${isParent() ? 'Open now or waiting for your marks' : 'Ready to fight'}</h3>${groups.now.length ? `<ul class="test-list">${groups.now.map(row).join('')}</ul>` : '<p class="muted">No bosses around right now. Back to the quests!</p>'}
      <h3>Defeated</h3>${groups.done.length ? `<ul class="test-list">${groups.done.map(row).join('')}</ul>` : '<p class="muted">No bosses defeated yet.</p>'}
      <h3>Coming up</h3><ul class="test-list">${groups.later.map(row).join('')}</ul></section>`;
  }

  function testDetail(t) {
    if (!t) { state.testId = null; return testsView(); }
    const r = state.tests[t.id] || {}, st = testStatus(t), sc = testScore(t, r);
    let h = `<section class="test"><button class="btn ghost" data-act="back">‹ All bosses</button>
      <header class="day-head"><div><h2>${bossOf(t)} ${esc(t.title)}</h2><p class="muted">${fmtDate(t.date)}, ${t.minutes} minutes</p></div>
      ${sc ? rankBadge(sc, 'mid') : `<span class="pill ts-${st}">${tsLabel(st)}</span>`}</header>
      <p class="intro">${esc(t.intro)}</p>`;
    if (st === 'later' && !isParent()) return h + `<p class="lock">🔒 This boss appears on ${fmtDate(t.date)}.</p></section>`;

    if (t.type === 'external') {
      const locked = !isParent() && r.externalScore != null;
      h += `<div class="sheet ext"><label>Marks scored <input type="number" min="0" step="0.5" id="ext-got" value="${esc(r.externalScore)}" ${locked ? 'disabled' : ''}></label>
        <label>Out of <input type="number" min="1" step="1" id="ext-max" value="${esc(r.externalMax || '')}" ${locked ? 'disabled' : ''}></label>
        <label class="wide">Where the marks went <textarea id="ext-note" rows="3" ${locked ? 'disabled' : ''}>${esc(r.note)}</textarea></label></div>
        ${locked ? '' : `<button class="btn" data-act="ext-save" data-id="${t.id}">Save marks</button>`}`;
      return h + reviewBlock(t, r) + '</section>';
    }

    const submitted = !!r.submittedAt;
    if (!submitted && !isParent()) {
      h += r.startedAt ? `<p class="timer">⏱ Time used: <span id="timer" data-start="${esc(r.startedAt)}">0:00</span> of ${t.minutes}:00</p>`
        : `<button class="btn" data-act="t-start" data-id="${t.id}">⚔️ Start the fight (timer starts)</button>`;
      if (!r.startedAt) return h + '</section>';
    }
    // MCQs
    h += `<h3>Section A: choose one (1 mark each)</h3><ol class="qs">`;
    (t.mcq || []).forEach(q => {
      const ans = r.mcq && r.mcq[q.id];
      h += `<li class="q"><p>${esc(q.q)}</p><div class="opts">`;
      q.options.forEach((o, i) => {
        const sel = ans === i, right = submitted && i === q.answer, wrong = submitted && sel && i !== q.answer;
        h += `<label class="opt ${right ? 'right' : ''} ${wrong ? 'wrong' : ''}"><input type="radio" name="q-${q.id}" data-act="mcq" data-id="${t.id}" data-q="${q.id}" value="${i}" ${sel ? 'checked' : ''} ${submitted || isParent() ? 'disabled' : ''}>${esc(o)}</label>`;
      });
      h += `</div>${submitted && q.explain ? `<p class="explain">${esc(q.explain)}</p>` : ''}</li>`;
    });
    h += '</ol><h3>Section B: write on paper</h3><ol class="qs">';
    (t.written || []).forEach(w => {
      const showKey = submitted || isParent();
      h += `<li class="q"><p>${esc(w.q)} <span class="muted">[${w.marks}]</span></p>
        <textarea rows="3" class="sheet" data-act="written" data-id="${t.id}" data-q="${w.id}" placeholder="Write the answer on paper. You can also type it here." ${submitted || isParent() ? 'disabled' : ''}>${esc(r.written && r.written[w.id])}</textarea>
        ${showKey ? `<details class="key" ${isParent() ? 'open' : ''}><summary>Model answer and marking</summary><p>${esc(w.model)}</p><p class="muted">Marks: ${esc(w.scheme)}</p></details>` : ''}
        ${isParent() && submitted ? `<label class="score">Marks <input type="number" min="0" max="${w.marks}" step="0.5" data-act="mark" data-id="${t.id}" data-q="${w.id}" value="${esc(r.marks && r.marks[w.id] != null ? r.marks[w.id] : '')}"> / ${w.marks}</label>`
          : r.reviewedAt && r.marks && r.marks[w.id] != null ? `<p><span class="rank r-p"><b>★</b><i>${esc(r.marks[w.id])}/${w.marks}</i></span></p>` : ''}
      </li>`;
    });
    h += '</ol>';
    if (!submitted && !isParent()) h += `<button class="btn" data-act="t-submit" data-id="${t.id}">Submit and strike the final blow</button><p class="muted small">After you submit, Section A is marked at once and you see the model answers. A parent marks Section B.</p>`;
    if (isParent() && !submitted) h += '<p class="lock">Not submitted yet. You can read the questions and the marking scheme now.</p>';
    if (submitted) h += `<p class="muted">Section A: ${r.mcqScore || 0} out of ${(t.mcq || []).length}.${sc && sc.partial ? ' Section B is waiting for marks.' : ''}</p>`;
    return h + reviewBlock(t, r) + '</section>';
  }
  function reviewBlock(t, r) {
    if (isParent() && (r.submittedAt || r.externalScore != null))
      return `<div class="block parent-box"><h3><label for="tc">Comment from parent</label></h3><textarea id="tc" class="sheet" rows="2">${esc(r.parentComment)}</textarea>
        <button class="btn" data-act="t-review" data-id="${t.id}">${t.type === 'external' ? 'Save comment' : 'Save marks and comment'}</button>
        ${r.reviewedAt ? `<p class="muted small">Marked ${new Date(r.reviewedAt).toLocaleString()}</p>` : ''}</div>`;
    return r.parentComment ? `<div class="block parent-box"><h3>From Papa/Mummy</h3><p class="speech">${esc(r.parentComment)}</p></div>` : '';
  }

  // ---------- progress ----------
  function progressView() {
    const s = streaks(), t = today();
    const bySub = {}, byCh = {};
    Object.values(state.plan.days).forEach(p => p.tasks.forEach(task => {
      if (task.optional || ['close', 'test', 'buffer'].includes(task.subject)) return;
      const done = isDone(p.date, task);
      const b = bySub[task.subject] = bySub[task.subject] || { due: 0, done: 0, all: 0 };
      b.all++; if (p.date <= t) { b.due++; if (done) b.done++; }
      if (task.ch) { const c = byCh[task.ch] = byCh[task.ch] || { subject: task.subject, first: p.date, all: 0, done: 0, due: 0 }; c.all++; if (p.date <= t) c.due++; if (done) c.done++; }
    }));
    const subjRows = Object.keys(SUBJECTS).filter(k => bySub[k]).map(k => {
      const b = bySub[k];
      return `<li><span class="bar-label">${chip(k)}</span><span class="meter" role="img" aria-label="${pct(b.done, b.due)}% of sessions due so far"><span style="width:${pct(b.done, b.due)}%;background:linear-gradient(90deg, ${SUBJECTS[k].color}, color-mix(in srgb, ${SUBJECTS[k].color} 40%, #fff))"></span></span>
        <span class="bar-num">${b.done} of ${b.due} due<span class="muted"> (${b.all} in plan)</span></span></li>`;
    }).join('');
    const chRows = Object.entries(byCh).filter(([, c]) => c.first <= U.addDays(t, 21)).sort((a, b) => a[1].first < b[1].first ? -1 : 1)
      .map(([name, c]) => `<tr><td>${esc(name)}</td><td>${c.done} / ${c.all}</td><td>${c.done === c.all ? '<span class="pill s-done">Cleared</span>' : c.first > t ? '<span class="muted">Starts ' + fmtDate(c.first, true) + '</span>' : c.done >= c.due ? '<span class="pill s-min">On track</span>' : `<span class="pill s-missed">Behind by ${c.due - c.done}</span>`}</td></tr>`).join('');
    const tRows = testList().filter(x => testScore(x, state.tests[x.id])).map(x => {
      const sc = testScore(x, state.tests[x.id]);
      return `<tr><td>${fmtDate(x.date, true)}</td><td>${esc(x.title)}</td><td>${sc.partial ? `${sc.mcq} / ${sc.mcqMax} <span class="muted">(Section A only, waiting for marks)</span>` : `${sc.got} / ${sc.max}`}</td><td>${sc.partial ? pct(sc.mcq, sc.mcqMax) : pct(sc.got, sc.max)}%${sc.partial ? '' : ' <span class="rank r-' + letter(pct(sc.got, sc.max)) + '"><b>' + letter(pct(sc.got, sc.max)) + '</b></span>'}</td></tr>`;
    }).join('');
    const lv = levelInfo(xpTotal()), bl = badgeList(s, lv);
    const badgeHtml = bl.map(([ic, n, d, on]) => `<li class="badge ${on ? 'on' : 'off'}"><span class="badge-ic" aria-hidden="true">${on ? ic : '🔒'}</span><span class="badge-n">${esc(n)}</span><span class="badge-d">${esc(d)}</span><span class="sr">${on ? 'Unlocked' : 'Locked'}</span></li>`).join('');
    return `<section class="progress"><h2>🏆 ${isParent() ? 'Progress' : 'Stats'}</h2>
      <div class="profile"><span class="lvl-badge" aria-hidden="true">${lv.l}</span><div class="profile-main"><span class="profile-rank">Level ${lv.l} ${esc(lv.rank)}</span>
        ${meter(lv.pct, 'xp tall')}<span class="small muted">${lv.xp} XP total \u00b7 ${lv.span - lv.into} XP to level ${lv.l + 1}</span></div></div>
      <div class="stats">${stat(s.current, 'day streak')}${stat(s.best, 'best streak')}${stat(s.done, 'days cleared')}${stat(s.missed, 'days missed')}</div>
      <h3>Badges <span class="muted small">${bl.filter(b => b[3]).length} of ${bl.length} unlocked</span></h3><ul class="badges">${badgeHtml}</ul>
      <h3>Skill meters</h3><ul class="bars">${subjRows}</ul>
      <h3>Boss results</h3>${tRows ? `<div class="scroll"><table><thead><tr><th>Date</th><th>Test</th><th>Marks</th><th>Per cent</th></tr></thead><tbody>${tRows}</tbody></table></div>` : '<p class="muted">No marks yet. Beat a boss to get your first rank.</p>'}
      <h3>Map: chapters for the next three weeks</h3><div class="scroll"><table><thead><tr><th>Chapter</th><th>Sessions</th><th>Status</th></tr></thead><tbody>${chRows}</tbody></table></div>
      ${isParent() ? '<button class="btn ghost" data-act="csv">⬇ Download everything as a spreadsheet (CSV)</button>' : ''}</section>`;
  }
  const stat = (n, l) => `<div class="stat"><span class="stat-n">${n}</span><span class="stat-l">${l}</span></div>`;

  // ---------- parent overview ----------
  function overviewView() {
    const s = streaks(), t = today();
    const wk0 = U.addDays(t, -((U.dow(t) + 6) % 7));
    let wkDone = 0, wkDays = 0;
    for (let i = 0; i < 7; i++) { const d = U.addDays(wk0, i); const st = statusOf(d); if (!['off', 'pass', 'upcoming'].includes(st)) { wkDays++; if (st === 'done' || st === 'min') wkDone++; } }
    const toMark = testList().filter(x => testStatus(x) === 'submitted').length;
    let log = '';
    for (let i = 0; i < 7; i++) {
      const d = U.addDays(t, -i), p = state.plan.days[d]; if (!p) continue; const st = statusOf(d), r = rec(d);
      const req = p.tasks.filter(x => !x.optional), dn = req.filter(x => isDone(d, x)).length;
      log += `<li><button class="log-row" data-act="cal-go" data-date="${d}"><span class="lg s-${st}">${STATUS[st].mark}</span>
        <span class="log-main"><strong>${fmtDate(d)}</strong> <span class="muted">${p.kind === 'sunday' || p.kind === 'off' ? STATUS.off.label : `${dn} of ${req.length} tasks`}</span>
        ${r.learned ? `<span class="log-note">${esc(r.learned.split('\n').filter(Boolean).slice(0, 2).join('; '))}</span>` : ''}
        ${r.note ? `<span class="log-note red-note">Note: ${esc(r.note)}</span>` : ''}</span></button></li>`;
    }
    return `<section class="overview"><div class="stats">${stat(s.current, 'day streak')}${stat(`${wkDone}/${wkDays}`, 'days done this week')}${stat(toMark, 'tests to mark')}${stat(s.missed, 'days missed in total')}</div>
      ${(() => { const lv = levelInfo(xpTotal()); return `<div class="profile"><span class="lvl-badge" aria-hidden="true">${lv.l}</span><div class="profile-main"><span class="profile-rank">${esc(CFG.studentName)}: Level ${lv.l} ${esc(lv.rank)}</span>${meter(lv.pct, 'xp tall')}<span class="small muted">${lv.xp} XP total</span></div></div>`; })()}
      ${weekStrip(t)}
      <h2>Last 7 days</h2><ul class="log">${log}</ul>
      ${toMark ? '<button class="btn" data-act="nav" data-view="tests">Mark the submitted tests</button>' : ''}
      ${dayPanel(t)}</section>`;
  }

  // ---------- shell ----------
  function loginView(msg) {
    return `<main class="login"><div class="login-logo" aria-hidden="true">🎮</div><h1>${esc(CFG.studentName)}\u2019s Study Quest</h1>
      <form id="login" class="sheet login-form"><label>E-mail <input type="email" name="email" autocomplete="username" required></label>
      <label>Password <input type="password" name="pw" autocomplete="current-password" required></label>
      <button class="btn big" type="submit">▶ Press start</button>${msg ? `<p class="err">${esc(msg)}</p>` : ''}</form></main>`;
  }
  function render() {
    if (!state.user) { app.innerHTML = loginView(state.loginMsg); return; }
    if (!state.user.role) { app.innerHTML = `<main class="login"><h1>Account not set up</h1><p>This login has no role yet. In Firebase, add a document <code>roles/${esc(state.user.uid)}</code> with <code>role: "student"</code> or <code>role: "parent"</code>.</p>${state.user.error ? `<p class="err">${esc(state.user.error)}</p>` : ''}<button class="btn" data-act="signout">Sign out</button></main>`; return; }
    if (!state.loaded) { app.innerHTML = '<main class="login"><div class="login-logo" aria-hidden="true">🎮</div><p>Loading your quests…</p></main>'; return; }
    const tabs = isParent() ? [['today', '👀', 'Overview'], ['calendar', '🗺️', 'Calendar'], ['tests', '⚔️', 'Tests'], ['progress', '🏆', 'Progress']]
      : [['today', '🎯', 'Quests'], ['calendar', '🗺️', 'Map'], ['tests', '⚔️', 'Bosses'], ['progress', '🏆', 'Stats']];
    const s = streaks(), lv = levelInfo(xpTotal());
    let body = '';
    if (state.view === 'today') body = isParent() ? overviewView() : streakHero() + dayPanel(today());
    if (state.view === 'calendar') body = calendarView();
    if (state.view === 'tests') body = testsView();
    if (state.view === 'progress') body = progressView();
    app.innerHTML = `<header class="top"><div class="brand"><span class="brand-logo" aria-hidden="true">🎮</span><span class="brand-text"><span class="brand-name">Study Quest</span>
        <span class="brand-sub">${isParent() ? 'Parent view' : 'Player: ' + esc(CFG.studentName)}</span></span></div>
      <nav aria-label="Sections">${tabs.map(([v, ic, l]) => `<button class="tab ${state.view === v ? 'on' : ''}" data-act="nav" data-view="${v}" ${state.view === v ? 'aria-current="page"' : ''}><span class="tab-ic" aria-hidden="true">${ic}</span><span class="tab-l">${l}</span></button>`).join('')}</nav>
      <div class="lvl" title="${lv.xp} XP, ${lv.span - lv.into} to the next level"><span class="lvl-badge" aria-label="Level ${lv.l}">${lv.l}</span><span class="lvl-info"><span class="lvl-rank">${esc(lv.rank)}</span>${meter(lv.pct, 'xp thin')}</span></div>
      <div class="flame-pill" title="Current streak"><span class="fl" aria-hidden="true">🔥</span>${s.current}<span class="sr">day streak</span></div>
      <button class="btn ghost small" data-act="signout">Exit</button></header>
      <main class="main">${body}</main>`;
    startTimer();
  }
  let timerInt = null;
  function startTimer() {
    clearInterval(timerInt);
    const el = document.getElementById('timer'); if (!el) return;
    const st = new Date(el.dataset.start).getTime();
    const tick = () => { const s = Math.max(0, Math.floor((Date.now() - st) / 1000)); el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    tick(); timerInt = setInterval(tick, 1000);
  }
  let pending = false;
  function scheduleRender() {
    const a = document.activeElement;
    if (a && app.contains(a) && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && /text|number|email|password/.test(a.type)))) { pending = true; return; }
    const y = window.scrollY; render(); window.scrollTo(0, y);
  }
  app.addEventListener('focusout', () => { if (pending) { pending = false; setTimeout(scheduleRender, 0); } });

  function toast(msg) {
    let t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3500);
  }
  function ask(msg, opts) {
    opts = opts || {};
    return new Promise(res => {
      const w = document.createElement('div'); w.className = 'modal-wrap';
      w.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mq"><p id="mq">${esc(msg)}</p>
        ${opts.input != null ? `<input id="mi" value="${esc(opts.input)}" aria-labelledby="mq">` : ''}
        <div class="modal-btns"><button class="btn ghost" data-r="0">Cancel</button><button class="btn" data-r="1">${esc(opts.ok || 'OK')}</button></div></div>`;
      document.body.appendChild(w);
      const inp = w.querySelector('#mi'); (inp || w.querySelector('[data-r="1"]')).focus();
      const done = v => { w.remove(); res(v); };
      w.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b) done(b.dataset.r === '1' ? (inp ? inp.value.trim() : true) : null); else if (e.target === w) done(null); });
      w.addEventListener('keydown', e => { if (e.key === 'Escape') done(null); if (e.key === 'Enter' && inp) done(inp.value.trim()); });
    });
  }
  const CONFETTI = ['#2EE6FF', '#FF4FD8', '#8CFF4F', '#FFC93C', '#9B7BFF', '#FF8A2B'];
  function celebrate(title, sub, xpLine) {
    const rm = n => setTimeout(() => n.remove(), 2400);
    document.querySelectorAll('.banner, .confetti').forEach(n => n.remove());
    const el = document.createElement('div'); el.className = 'banner'; el.setAttribute('role', 'status');
    el.innerHTML = `<div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}${xpLine ? `<p class="xp-line">${esc(xpLine)}</p>` : ''}</div>`;
    document.body.appendChild(el); rm(el);
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('div'); c.className = 'confetti'; c.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.style.cssText = `--x:${Math.random() * 100}%;--s:${6 + Math.random() * 8}px;--c:${CONFETTI[i % CONFETTI.length]};--d:${1.6 + Math.random() * 1.4}s;--t:${Math.random() * .5}s;--dx:${Math.round(Math.random() * 120 - 60)}px;--r:${Math.round(Math.random() * 900 - 450)}deg`;
      c.appendChild(p);
    }
    document.body.appendChild(c); setTimeout(() => c.remove(), 3600);
  }
  function floatXp(el, text) {
    if (!el) return;
    const r = el.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'xp-float'; f.textContent = text; f.style.left = `${r.left}px`; f.style.top = `${r.top}px`;
    document.body.appendChild(f); setTimeout(() => f.remove(), 1200);
  }
  // after a save: show a level-up or day-cleared banner if the new state earned one
  function reward(before, then) {
    const after = levelInfo(xpTotal());
    if (after.l > before.l) celebrate('LEVEL UP!', `Level ${after.l}: ${after.rank}`, then ? `${then.title}  ${then.xp}` : '');
    else if (then) celebrate(then.title, then.sub, then.xp);
  }

  // ---------- events ----------
  app.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (['tick', 'mcq'].includes(act)) return; // handled on change
    if (act === 'nav') { state.view = a.dataset.view; state.testId = null; render(); window.scrollTo(0, 0); }
    else if (act === 'sel') { state.sel = a.dataset.date; state.month = a.dataset.date.slice(0, 7); state.view = 'calendar'; render(); }
    else if (act === 'cal-go') { state.sel = a.dataset.date; state.month = a.dataset.date.slice(0, 7); state.view = 'calendar'; render(); window.scrollTo(0, 0); }
    else if (act === 'month') { state.month = a.dataset.m; render(); }
    else if (act === 'test') { state.testId = a.dataset.id; state.view = 'tests'; render(); window.scrollTo(0, 0); }
    else if (act === 'back') { state.testId = null; render(); }
    else if (act === 'signout') store.signOut();
    else if (act === 'pass') { const d = a.dataset.date; ask('Use your one free pass this month for this day? It keeps your streak safe.', { ok: 'Use the free pass' }).then(ok => { if (ok) save('days', d, { freePass: true, updatedAt: nowIso() }); }); }
    else if (act === 'offday') {
      const d = a.dataset.date, on = a.dataset.on === '1';
      if (!on) { save('settings', null, { offDays: { [d]: null } }); return; }
      ask('Reason for the day off (for example, family function):', { input: 'Day off', ok: 'Mark as day off' }).then(reason => { if (reason) save('settings', null, { offDays: { [d]: reason } }); });
    }
    else if (act === 't-start') save('tests', a.dataset.id, { startedAt: nowIso() });
    else if (act === 't-submit') {
      const t = state.plan.tests.find(x => x.id === a.dataset.id), r = state.tests[t.id] || {};
      const unanswered = (t.mcq || []).filter(q => !(r.mcq && r.mcq[q.id] != null)).length;
      ask(unanswered ? `${unanswered} question(s) in Section A are not answered. Submit anyway?` : 'Submit the test? You cannot change answers after this.', { ok: 'Submit' }).then(ok => {
        if (!ok) return;
        const r2 = state.tests[t.id] || {}, lvBefore = levelInfo(xpTotal());
        const score = (t.mcq || []).reduce((n, q) => n + (r2.mcq && r2.mcq[q.id] === q.answer ? 1 : 0), 0), max = (t.mcq || []).length;
        save('tests', t.id, { submittedAt: nowIso(), mcqScore: score, mcqMax: max }).then(() => reward(lvBefore, { title: `${score}/${max}`, sub: 'Boss battle done! Section A is marked.', xp: `+${score * 5} XP` }));
      });
    }
    else if (act === 'ext-save') {
      const got = document.getElementById('ext-got').value, max = document.getElementById('ext-max').value;
      if (got === '' || !max) { toast('Enter both the marks and the total.'); return; }
      save('tests', a.dataset.id, { externalScore: +got, externalMax: +max, note: document.getElementById('ext-note').value, submittedAt: nowIso() }).then(() => toast('Marks saved.'));
    }
    else if (act === 't-review') {
      const marks = {}; app.querySelectorAll('input[data-act="mark"]').forEach(i => { if (i.value !== '') marks[i.dataset.q] = +i.value; });
      save('tests', a.dataset.id, { marks, parentComment: document.getElementById('tc').value, reviewedAt: nowIso() }).then(() => toast('Marks saved.'));
    }
    else if (act === 'csv') exportCsv();
  });

  app.addEventListener('change', e => {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'tick') {
      const d = a.dataset.date, before = statusOf(d), lvBefore = levelInfo(xpTotal());
      const task = state.plan.days[d].tasks.find(t => t.id === a.dataset.id);
      if (a.checked && task) floatXp(a, `+${xpOfTask(task)} XP`);
      save('days', d, { done: { [a.dataset.id]: a.checked }, updatedAt: nowIso() }).then(() => {
        const cleared = before !== 'done' && statusOf(d) === 'done';
        reward(lvBefore, cleared ? { title: 'DAY CLEARED!', sub: `🔥 ${streaks().current}-day streak`, xp: '+25 XP bonus' } : null);
      });
    } else if (act === 'score') save('days', a.dataset.date, { scores: { [a.dataset.id]: a.value === '' ? null : +a.value }, updatedAt: nowIso() });
    else if (act === 'text') save('days', a.dataset.date, { [a.dataset.field]: a.value, ...(a.dataset.field === 'parentComment' ? {} : { updatedAt: nowIso() }) });
    else if (act === 'mcq') save('tests', a.dataset.id, { mcq: { [a.dataset.q]: +a.value } });
    else if (act === 'written') save('tests', a.dataset.id, { written: { [a.dataset.q]: a.value } });
  });

  app.addEventListener('submit', e => {
    if (e.target.id !== 'login') return;
    e.preventDefault();
    const f = new FormData(e.target);
    store.signIn(f.get('email'), f.get('pw')).catch(() => { state.loginMsg = 'That e-mail and password did not match. Check them and try again.'; render(); });
  });

  function exportCsv() {
    const q = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const rows = [['Date', 'Day type', 'Status', 'Tasks done', 'Tasks required', 'Learned', 'Note', 'Parent comment']];
    Object.keys(state.plan.days).sort().forEach(d => {
      if (d > today()) return;
      const p = state.plan.days[d], r = rec(d), req = p.tasks.filter(x => !x.optional);
      rows.push([d, p.kind, STATUS[statusOf(d)].label, req.filter(x => isDone(d, x)).length, req.length, r.learned, r.note, r.parentComment]);
    });
    rows.push([]); rows.push(['Test date', 'Test', 'Marks', 'Out of', 'Per cent']);
    testList().forEach(t => { const sc = testScore(t, state.tests[t.id]); if (sc) rows.push([t.date, t.title, sc.got, sc.max, pct(sc.got, sc.max)]); });
    const blob = new Blob([rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `study-diary-${today()}.csv`; link.click();
  }

  // ---------- start ----------
  let subscribed = false;
  store.init(user => {
    state.user = user; state.loginMsg = '';
    if (user && user.role && !subscribed) {
      subscribed = true;
      store.subscribe(data => {
        state.days = data.days || {}; state.tests = data.tests || {}; state.settings = data.settings || {};
        rebuildPlan(); state.loaded = true; scheduleRender();
      });
    }
    if (!user) { subscribed = false; state.loaded = false; state.view = 'today'; }
    render();
  }).catch(e => { app.innerHTML = `<main class="login"><p class="err">Could not start: ${esc(e.message)}. Check the Firebase settings in config.js.</p></main>`; });
})();
