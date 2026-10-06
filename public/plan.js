// plan.js: subjects, chapter sessions and the generator that turns them into a daily plan.
// Chapter names and section numbers follow the 2026-27 NCERT books (Kaveri, Ganita Manjari
// Part II, Exploration) and Beste Freunde B1 (Lektion 39 = school Lesson 3, Lektion 40 = Lesson 4).
(function () {
  'use strict';

  // ---------- dates ----------
  const pad = n => String(n).padStart(2, '0');
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const dow = s => parse(s).getDay(); // 0 Sunday ... 6 Saturday
  const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const todayStr = () => ymd(new Date());

  // ---------- subjects ----------
  const SUBJECTS = {
    maths: { name: 'Maths', color: '#2448B8' },
    adv: { name: 'Advanced Maths', color: '#5B3FB0' },
    science: { name: 'Science', color: '#0F7C8C' },
    physics: { name: 'Physics', color: '#0E6E7D' },
    chemistry: { name: 'Chemistry', color: '#B4530A' },
    biology: { name: 'Biology', color: '#2F7D32' },
    sst: { name: 'Social Science', color: '#8A5A12' },
    english: { name: 'English', color: '#A1287A' },
    german: { name: 'German', color: '#B3261E' },
    test: { name: 'Test', color: '#1B2440' },
    close: { name: 'Daily close', color: '#56607A' },
    buffer: { name: 'Buffer', color: '#7A8095' }
  };

  // A session: [chapter label, title, what to do]
  const S = (ch, title, detail) => ({ ch, title, detail });

  // ---------- Phase 1 and sprint content: Periodic Test II chapters + repair ----------
  const Q = {};

  Q.mathsNew = [
    S('Maths Ch 12 Quadrilaterals', '12.1 What exactly is a quadrilateral?', 'Read 12.1. Write the definition and the difference between convex and concave 4-gons in your notes. Solve Exercise Set 12.1.'),
    S('Maths Ch 12 Quadrilaterals', '12.2 Parallelograms: properties and converses', 'Read 12.2. On the formula sheet, write the four properties of a parallelogram and the four converse statements from the chapter summary.'),
    S('Maths Ch 12 Quadrilaterals', 'Exercise Set 12.2', 'Solve every question. Write each proof as Given / To prove / Proof with a reason on every line.'),
    S('Maths Ch 12 Quadrilaterals', '12.3.1 The Midpoint Theorem and its converse', 'Read 12.3.1. Copy the proof once with the book open, then write it again with the book closed and compare.'),
    S('Maths Ch 12 Quadrilaterals', '12.3.2 Medians and the centroid', 'Read 12.3.2: medians meet at the centroid, which divides each median 2 : 1. Solve the first half of Exercise Set 12.3.'),
    S('Maths Ch 12 Quadrilaterals', 'Exercise Set 12.3 (rest)', 'Finish Exercise Set 12.3. Star every question you could not start.'),
    S('Maths Ch 12 Quadrilaterals', '12.4 Tiling the plane with any 4-gon', 'Read 12.4 and solve Exercise Set 12.4. Add to notes: joining the midpoints of any 4-gon gives a parallelogram.'),
    S('Maths Ch 12 Quadrilaterals', 'Chapter 12 end exercises', 'Solve the odd-numbered end-of-chapter questions. Redo all starred questions from this chapter.'),
    S('Maths Ch 13 Two Variables, One Line', '13.1 Linear equations in two variables', 'Read 13.1 and the standard form ax + by + c = 0. Solve Exercise Set 13.1. Before each word problem write "Let x = ..." first.'),
    S('Maths Ch 13 Two Variables, One Line', '13.2 Solutions: algebra and graph', 'Read 13.2.1 and 13.2.2. Solve the first half of Exercise Set 13.2.'),
    S('Maths Ch 13 Two Variables, One Line', 'Exercise Set 13.2 (rest) on graph paper', 'Finish Exercise Set 13.2. Plot three lines on graph paper with labelled axes and a scale.'),
    S('Maths Ch 13 Two Variables, One Line', '13.3 Slope and slope-intercept form', 'Read 13.3: in y = mx + d, m is the slope and the line cuts the y-axis at (0, d). Solve Exercise Set 13.3.'),
    S('Maths Ch 13 Two Variables, One Line', '13.4 A pair of linear equations', 'Read 13.4 and solve Exercise Set 13.4.'),
    S('Maths Ch 13 Two Variables, One Line', '13.5 Substitution method', 'Work through the substitution examples in 13.5.1, then solve half of Exercise Set 13.5 by substitution.'),
    S('Maths Ch 13 Two Variables, One Line', '13.5 Elimination method and the three cases', 'Solve the rest of Exercise Set 13.5 by elimination. Write the a1/a2, b1/b2, c1/c2 table (unique, none, infinitely many) on the formula sheet.'),
    S('Maths Ch 13 Two Variables, One Line', '13.6 Graphical method', 'Read 13.6. Solve two pairs by drawing both lines on one graph, then check each answer by substitution.'),
    S('Maths Ch 10 Understanding Data', '10.1.1 Average of averages', 'Read 10.1.1 (badminton heights example). Solve Exercise Set 10.1.'),
    S('Maths Ch 10 Understanding Data', '10.1.2-10.1.3 Mixtures and custom weights', 'Write the weighted-mean formula on the formula sheet. Solve Exercise Sets 10.2 and 10.3.'),
    S('Maths Ch 10 Understanding Data', '10.2 Stacked and 100% stacked bar charts', 'Read 10.2.1 and 10.2.2. Solve Exercise Set 10.4. Note: a 100% stacked chart compares proportions, not amounts.'),
    S('Maths Ch 10 Understanding Data', 'Exercise Set 10.5 and chapter summary', 'Solve Exercise Set 10.5 and copy the chapter summary into your notes in your own words.')
  ];

  Q.adv = [
    S('Advanced Maths: Sets', 'Union, intersection and difference', 'Make a one-page sheet: A ∪ B is everything in either set (written once), A ∩ B is only what both share, A − B is in A but not in B. Do 10 drills with small sets.'),
    S('Advanced Maths: Sets', 'Venn diagrams', 'Learn n(A ∪ B) = n(A) + n(B) − n(A ∩ B). Draw a Venn diagram for 6 word problems (cricket and tennis type).'),
    S('Advanced Maths: Sets', 'Subsets and the power set', 'A set with n elements has 2ⁿ subsets. List all subsets of {a, b, c}. Solve 6 questions on the number of subsets.'),
    S('Advanced Maths: Sets', 'Set laws: mixed practice', 'Verify A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C) and A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C) with small sets. Redo mid-term Q9 correctly.')
  ];

  Q.repair = [
    S('Maths repair: Triangles', 'Triangle proofs: the fixed layout', 'Learn the layout: Given, To prove, the two triangles named, three numbered statements each with a reason, the rule (SSS/SAS/ASA/AAS/RHS), then CPCT. Never use the "To prove" line as a statement. Write 3 proofs from NCERT Ch 7.'),
    S('Maths repair: Triangles', 'Isosceles triangles and mixed proofs', 'Write 3 proofs including mid-term Q30 (bisectors in an isosceles triangle) and Q35. Check each against the layout.'),
    S('Maths repair: Identities', 'Identities: a² − b², perfect squares, (a + b + c)²', 'Write the one-page identity sheet. Solve 15 questions. Note: 25y² − 9x² is (5y)² − (3x)², not a square of a bracket.'),
    S('Maths repair: Factorising', 'Splitting the middle term, with the multiply-back check', 'Factorise 15 quadratics. After each one, multiply the brackets back to check the signs (e.g. x² + 2x − 15 = (x + 5)(x − 3)).'),
    S('Maths repair: Coordinate geometry', 'The three distance-formula question types', '"Equidistant" means two distances set equal. "Type of triangle" means find all three sides. "Is it a square?" means four sides and both diagonals. Solve 3 of each.'),
    S('Maths repair: Word problems', 'Words into equations and the proof that √3 is irrational', 'Translate 10 sentences into equations ("x exceeds y by 7" is x − y = 7). Write the √3 proof including "p and q are coprime".')
  ];

  Q.physics = [
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.1 Work done by a constant force', 'Read 7.1 and 7.1.1. Work = force × displacement in the direction of the force. List 3 cases where work done is zero.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.1.2 Positive and negative work', 'Read 7.1.2. Solve 5 numericals in the five-line layout: Given (in SI units), To find, Formula, Substitution, Answer with unit.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.2 Work-energy theorem and 7.3 forms of energy', 'Read 7.2 and 7.3. Write the theorem in one line and list the forms of energy with one example each.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.4 Kinetic and potential energy, conservation', 'Formulas: KE = ½mv², PE = mgh. Read 7.4.3 on conservation. Solve 5 numericals.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.5 Power', 'Power = work / time, unit watt. Solve 5 numericals, including one with kW and one with time in minutes.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', '7.6 Simple machines: pulley, inclined plane, lever', 'Read 7.6.1-7.6.3. Draw each machine and mark load, effort and fulcrum. Solve Revise, Reflect, Refine Q1-5.'),
    S('Physics Ch 7 Work, Energy and Simple Machines', 'Revise, Reflect, Refine Q6-10', 'Solve the remaining end-of-chapter questions. Add every formula of Chapter 7 to the formula sheet.')
  ];

  Q.chemistry = [
    S('Chemistry Ch 8 Journey Inside the Atom', '8.3 What contributes to the mass of an atom', 'From page 147. Read 8.3 and 8.3.1 (discovery of the neutron, Chadwick). Write 3 numbered points.'),
    S('Chemistry Ch 8 Journey Inside the Atom', '8.4 Symbols of elements and 8.5 atomic number', 'Learn the symbols of the first 20 elements. Atomic number = number of protons.'),
    S('Chemistry Ch 8 Journey Inside the Atom', '8.6 Mass number', 'Mass number = protons + neutrons. Make a table of protons, neutrons and electrons for elements 1-20.'),
    S('Chemistry Ch 8 Journey Inside the Atom', '8.7 Electron distribution in shells', 'Read 8.7 and 8.7.1. Write the K, L, M distribution for elements 1-20 from memory, then check.'),
    S('Chemistry Ch 8 Journey Inside the Atom', '8.8 Valency', 'Read 8.8. Find the valency of elements 1-20 from their outer shell. Solve 5 questions.'),
    S('Chemistry Ch 8 Journey Inside the Atom', '8.9 Isotopes and end questions', 'Read 8.9.1. Write carbon-12 and carbon-14 with p, n and e, and two uses of isotopes. Solve Revise, Reflect, Refine.')
  ];

  Q.biology = [
    S('Biology Ch 11 Reproduction', '11.1 Asexual reproduction', 'Read 11.1: fission, budding, fragmentation, regeneration and spores. Draw and label one diagram of each.'),
    S('Biology Ch 11 Reproduction', '11.1.1 Vegetative propagation', 'Read 11.1.1. Write three reasons farmers use vegetative propagation, with one example plant each.'),
    S('Biology Ch 11 Reproduction', '11.2 Sexual reproduction, meiosis and the flower', 'Read 11.2.1 and 11.2.2. Draw and label a flower: sepal, petal, stamen (anther, filament), pistil (stigma, style, ovary).'),
    S('Biology Ch 11 Reproduction', '11.2.4 Pollination and 11.2.5 fertilisation', 'Write the steps from pollen landing on the stigma to seed and fruit. Make a table of self- vs cross-pollination.'),
    S('Biology Ch 11 Reproduction', '11.3 Animals and 11.5.1-11.5.3 reproductive maturity', 'Read 11.3 and 11.5.1-11.5.3. Draw and label the diagrams as in the book.'),
    S('Biology Ch 11 Reproduction', '11.5.5-11.5.10 and end questions', 'Read the rest of 11.5. Solve Revise, Reflect, Refine. Answers in 3 numbered points for 3-mark questions.')
  ];

  const sstSession = (ch, part, of) => S(ch, `${ch.split(': ')[1]} (part ${part} of ${of})`,
    part < of
      ? `Read part ${part} of the chapter (about a third). Close the book, write five points from memory, then check and correct.`
      : 'Read the last part. Make a one-page note for the whole chapter: headings, key terms, dates. Answer the end-of-chapter questions.');

  Q.sstA = [ // Tuesday: History and Political Science
    sstSession('History Part II Ch 3: Building a Resilient India', 1, 3),
    sstSession('Political Science Ch 5: Authority', 1, 3),
    sstSession('History Part II Ch 3: Building a Resilient India', 2, 3),
    sstSession('Political Science Ch 5: Authority', 2, 3),
    sstSession('History Part II Ch 3: Building a Resilient India', 3, 3),
    sstSession('Political Science Ch 5: Authority', 3, 3)
  ];
  Q.sstB = [ // Thursday: Economics and Geography
    sstSession('Economics Ch 6: From Ideas to Startup', 1, 3),
    sstSession('Geography Ch 3: Atmosphere and Climate', 1, 3),
    sstSession('Economics Ch 6: From Ideas to Startup', 2, 3),
    sstSession('Geography Ch 3: Atmosphere and Climate', 2, 3),
    sstSession('Economics Ch 6: From Ideas to Startup', 3, 3),
    sstSession('Geography Ch 3: Atmosphere and Climate', 3, 3)
  ];

  Q.english = [
    S('English Unit 5 The World of Limitless Possibilities', 'Read the prose text', 'Read Reading for Meaning (Paralympics, Sheetal Devi). Answer Check Your Understanding. Write the theme in two lines.'),
    S('English Unit 5 The World of Limitless Possibilities', 'Critical Reflection and vocabulary', 'Answer Critical Reflection in 40-50 words each. Do Vocabulary and Structures (defy the odds, a new lease of life ...).'),
    S('English Poem 5 Nine Gold Medals', 'Read the poem', 'Read the poem twice. Write the theme, the main character, two poetic devices with lines, and answer Check Your Understanding.'),
    S('English Unit 6 Twin Melodies', 'Read the play', 'Read the play. List the characters with one line on each. Answer Check Your Understanding.'),
    S('English Unit 6 Twin Melodies', 'Critical Reflection and vocabulary', 'Answer Critical Reflection. Do the vocabulary on "aside" and the idioms. Note three lines you could quote.')
  ];
  Q.englishW = [
    S('English writing', 'Notice writing', 'Write one notice in about 50 words (Unit 5 Writing Task). Layout: school name, NOTICE, date, heading, body, name and designation. 15 minutes.'),
    S('English writing', 'Article writing (Periodic Test II)', 'Write an article of 120-150 words on "Sport has no limits": title, by-line, introduction, two body paragraphs, conclusion. 20 minutes.'),
    S('English writing', 'Slogans and a poster', 'Write three slogans on the Special Olympics and design one poster (Unit 5 Writing Task 2).'),
    S('English writing', 'Article writing, second try', 'Write an article on "Music in our lives" (120-150 words). Compare with the first article and fix the same mistakes.'),
    S('English writing', 'Invitation letter', 'Unit 6 Writing Task: invite your grandparents to your Sitar recital on World Music Day. Formal layout. 15 minutes.'),
    S('English writing', 'Story completion', 'Unit 6 Writing Task: continue the story of Anuradha, the tabla player, in about 150 words.')
  ];

  Q.germanV = [
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 vocabulary, set 1', 'With Claude: 15 words from the first pages of the lesson, both directions, with articles. Then write five sentences of your own.'),
    S('German Lesson 1-2 vocabulary', 'Lessons 1-2 vocabulary review', 'With Claude: 15 words from Lessons 1-2 that were wrong in the mid-term (verdienen, Nachrichten, sparen ...).'),
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 vocabulary, set 2', 'With Claude: the next 15 words of Lesson 3. Paper flashcards for every word you missed.'),
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 vocabulary, set 3', 'With Claude: the last 15 words of Lesson 3, including the Landeskunde page (Bundesländer).'),
    S('German Lesson 1-2 vocabulary', 'Lessons 1-2 vocabulary, second round', 'With Claude: mixed quiz on Lessons 1-2. Use five words in your own sentences.'),
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 vocabulary, mixed', 'With Claude: mixed quiz on all Lesson 3 words.')
  ];
  Q.germanG = [
    S('German grammar (repair)', 'Wozu? answers with um...zu and damit', 'With Claude: answer 10 Wozu questions in full sentences of your own.'),
    S('German grammar (repair)', 'um ... zu + Infinitiv', 'With Claude: finish 10 sentences freely with um ... zu. Infinitive at the end.'),
    S('German grammar (repair)', 'damit (verb at the end)', 'With Claude: 10 sentences of your own with damit. Check the verb position in each.'),
    S('German grammar (repair)', 'weil (verb at the end)', 'With Claude: answer 10 Warum questions with weil. "weil ich Fußball liebe", not "weil liebe ich".'),
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Konjunktiv II: würde + Infinitiv', 'With Claude: the würde table and 10 sentences: "Das würde ich nie machen."'),
    S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'während + Genitiv, wo(r)- and da(r)- + preposition', 'With Claude: während des Unterrichts; Worüber? Darüber. 10 sentences of your own.')
  ];

  // ---------- revision lists (sprint, Phase 3 second pass, Phase 4) ----------
  Q.mathsSprint = [
    S('Maths Ch 12 Quadrilaterals', 'Parallelogram proofs, mixed', 'Write 4 proofs from Ch 12 in the full layout. Time yourself: 6 minutes each.'),
    S('Maths Ch 12 Quadrilaterals', 'Midpoint theorem and centroid problems', 'Solve 8 numerical and proof questions on the midpoint theorem and medians.'),
    S('Maths Ch 13 Two Variables, One Line', 'Graphs and slope', 'Draw 4 lines, read their slopes and y-intercepts, and find where two of them meet.'),
    S('Maths Ch 13 Two Variables, One Line', 'Substitution and elimination, mixed', 'Solve 10 pairs: 5 by substitution, 5 by elimination. Check each answer in both equations.'),
    S('Maths Ch 10 Understanding Data', 'Weighted mean problems', 'Solve 8 problems: class averages, mixtures, combining marks with weights.'),
    S('Maths Ch 10 Understanding Data', 'Reading and drawing stacked charts', 'Draw one stacked and one 100% stacked bar chart from the same table. Answer 4 questions on each.'),
    S('Maths PT-II revision', 'Starred questions, round 1', 'Redo every starred question from Ch 10, 12 and 13.'),
    S('Maths PT-II revision', 'Mixed paper: Section A and B', 'Write 15 MCQs and 5 two-mark questions from all three chapters in 35 minutes.'),
    S('Maths PT-II revision', 'Mixed paper: Section C and D', 'Write 4 three-mark and 2 five-mark questions in 45 minutes.'),
    S('Maths PT-II revision', 'Formula sheet and mistake notebook', 'Read the formula sheet aloud. Redo the last 10 entries of the mistake notebook.')
  ];
  Q.physicsRev = [S('Physics Ch 7 Work, Energy and Simple Machines', 'Chapter 7 revision', 'Formula sheet from memory, then 10 numericals in the five-line layout.')];
  Q.chemistryRev = [S('Chemistry Ch 8 Journey Inside the Atom', 'Chapter 8 (from 8.3) revision', 'Table of p, n, e, distribution and valency for elements 1-20 from memory. Then the end questions.')];
  Q.biologyRev = [S('Biology Ch 11 Reproduction', 'Chapter 11 revision', 'Draw the flower and the asexual-reproduction diagrams from memory. Answer 5 questions in numbered points.')];
  Q.sstARev = [S('Social Science PT-II revision', 'History Ch 3 and Political Science Ch 5', 'Read your one-page notes. Answer 5 questions from Physics Wallah or the textbook in writing.')];
  Q.sstBRev = [S('Social Science PT-II revision', 'Economics Ch 6 and Geography Ch 3', 'Read your one-page notes. Answer 5 questions in writing; label one map or diagram.')];
  Q.englishRev = [S('English PT-II revision', 'Units 5-6 and Nine Gold Medals', 'For each text: theme in two lines, characters, three quotable lines. Then one extract-based question.')];

  Q.mathsPass2 = [];
  [['Ch 1 Coordinate Geometry', 'Distance formula: the three question types; redo the mid-term questions'],
   ['Ch 2 Introduction to Polynomials', 'Degree, zeroes, value of a polynomial; 15 questions'],
   ['Ch 3 Number System', 'Rational/irrational, p/q form of recurring decimals, √3 proof'],
   ['Ch 5 Lines and Angles', 'Parallel lines and transversals; 10 questions with reasons'],
   ['Ch 6 Sequences and Progressions', 'nth term of an AP and a GP; word problems'],
   ['Ch 7 Triangles', 'Congruence proofs in the full layout; isosceles triangle properties'],
   ['Ch 9 Exploring Algebraic Identities', 'All identities; factorising with the multiply-back check']]
    .forEach(([ch, what]) => {
      Q.mathsPass2.push(S('Maths second pass: ' + ch, ch + ', session 1', what + '. Use NCERT exercises.'));
      Q.mathsPass2.push(S('Maths second pass: ' + ch, ch + ', session 2', 'Redo starred questions and two mid-term questions from this chapter.'));
    });
  Q.mathsMixed = [
    S('Maths mixed practice', 'Mixed: PT-II chapters', '10 questions from Ch 10, 12 and 13 together.'),
    S('Maths mixed practice', 'Mixed: algebra', '10 questions on identities, polynomials and linear equations.'),
    S('Maths mixed practice', 'Mixed: geometry', '4 proofs and 4 angle questions with reasons.'),
    S('Maths mixed practice', 'Mixed: number system and sequences', '10 questions.'),
    S('Maths mixed practice', 'New chapters taught after Periodic Test II', 'Exercises from the chapter the school is teaching now.')
  ];
  Q.physicsPass2 = [
    S('Physics second pass: Ch 4 Describing Motion', 'Motion: equations and numericals', 'v = u + at, s = ut + ½at², v² − u² = 2as. 10 numericals; choose the formula from what is given.'),
    S('Physics second pass: Ch 4 Describing Motion', 'Motion: graphs and definitions', 'Time on the x-axis. Area under a v-t graph = distance. Learn 10 definitions word for word.'),
    S('Physics second pass: Ch 6 How Forces Affect Motion', 'Newton\u2019s laws and momentum', 'Three laws, momentum p = mv, F = ma. 8 numericals and 4 "give reason" questions.'),
    S('Physics second pass: Ch 6 How Forces Affect Motion', 'Friction and action-reaction', 'Mid-term Q32-Q38 redone correctly. 5 "give reason" questions naming the law.'),
    S('Physics second pass: Ch 7 Work, Energy and Simple Machines', 'Work and energy recap', '10 mixed numericals from Ch 7.')
  ];
  Q.chemistryPass2 = [
    S('Chemistry second pass: Ch 1 Introduction to Chemistry', 'Physical and chemical changes', 'Make a table of 10 changes and classify each. Revise the definitions.'),
    S('Chemistry second pass: Ch 5 Exploring Mixtures', 'Solutions, colloids, suspensions', 'One comparison table with examples. Mass-percentage numericals.'),
    S('Chemistry second pass: Ch 5 Exploring Mixtures', 'Separation methods', 'For each method: when to use it, a labelled diagram, one example.'),
    S('Chemistry second pass: Ch 8 Journey Inside the Atom', 'Atomic models', 'Thomson, Rutherford and Bohr: three numbered points each.'),
    S('Chemistry second pass: Ch 8 Journey Inside the Atom', 'Structure of the atom', 'p, n, e, distribution, valency and isotopes for elements 1-20.')
  ];
  Q.biologyPass2 = [
    S('Biology second pass: Ch 1 Cell', 'Cell organelles', 'Draw plant and animal cells. Chloroplast and mitochondria labelled from memory.'),
    S('Biology second pass: Ch 1 Cell', 'Cell: differences', 'Prokaryotic vs eukaryotic, plant vs animal cell, mitosis vs meiosis tables.'),
    S('Biology second pass: Ch 2 Tissues', 'Plant tissues', 'Meristematic and permanent tissues; parenchyma, collenchyma, sclerenchyma, xylem, phloem.'),
    S('Biology second pass: Ch 2 Tissues', 'Animal tissues', 'Epithelial, connective, muscular (striated, smooth, cardiac), nervous; joints.'),
    S('Biology second pass: Ch 11 Reproduction', 'Reproduction recap', 'All diagrams from memory; 5 questions.')
  ];
  Q.sstNewA = [
    sstSession('History Ch 4: India and the World', 1, 3),
    sstSession('History Ch 4: India and the World', 2, 3),
    sstSession('History Ch 4: India and the World', 3, 3),
    S('Social Science revision', 'Political Science Ch 6 Democracy and Ch 7 Elections', 'Read your notes and answer 5 questions in writing.'),
    S('Social Science revision', 'History Ch 4-5 (mid-term)', 'Read your notes and answer 5 questions in writing.')
  ];
  Q.sstNewB = [
    sstSession('Economics Ch 7: Smart Ways to Manage Your Finances', 1, 2),
    sstSession('Economics Ch 7: Smart Ways to Manage Your Finances', 2, 2),
    sstSession('Geography Part II Ch 1: Oceans and Life', 1, 2),
    sstSession('Geography Part II Ch 1: Oceans and Life', 2, 2),
    sstSession('Geography Part II Ch 2: Life on Earth', 1, 2),
    sstSession('Geography Part II Ch 2: Life on Earth', 2, 2)
  ];
  Q.englishNew = [
    S('English Unit 7 Carrier of Words', 'Read the prose text', 'Read the story of Khetaram, the desert postman. Answer Check Your Understanding and fill the fact table.'),
    S('English Unit 7 Carrier of Words', 'Critical Reflection and vocabulary', 'Answer Critical Reflection. Vocabulary: crumbles into sand, a new lease of life, turn into a trickle.'),
    S('English Poem 7 Words', 'Read the poem', 'Theme in two lines, two poetic devices with lines, Check Your Understanding.'),
    S('English Unit 8 Follow That Dream', 'Read the letter', 'Read the letter from "My Daughter, My Friend". Answer Check Your Understanding.'),
    S('English Unit 8 Follow That Dream', 'Critical Reflection and grammar', 'Answer Critical Reflection. Grammar: modals for past possibility and unreal situations; compound words (-scape).'),
    S('English Poem 8 Believe in Yourself', 'Read the poem', 'Theme, tone, two poetic devices, Check Your Understanding.'),
    S('English Poem 6 A Friend Found in Music', 'Read the poem', 'Theme, two poetic devices, Check Your Understanding (Unit 6 poem).')
  ];
  Q.englishNewW = [
    S('English writing', 'E-mail writing', 'Unit 8 Writing Task: e-mail to the Director of a design institute about a summer workshop.'),
    S('English writing', 'Condolence message', 'Unit 7 Writing Task: a short condolence message in the correct tone.'),
    S('English writing', 'Essay on a quotation', 'Unit 7 Writing Task: essay of 200-250 words on one quotation.'),
    S('English writing', 'Narrative essay', '200-250 words: a day that changed how you see something. Beginning, middle, end.'),
    S('English writing', 'Letter to the editor', 'Formal letter, 120-150 words, on a local problem. Layout first, then content.'),
    S('English writing', 'Poster', 'Design one poster with heading, visual, details and organiser.')
  ];
  Q.germanL4V = [
    S('German Lesson 4 (Lektion 40) Hamburg, wir kommen!', 'Lesson 4 vocabulary, set 1', 'With Claude: 15 words (Hafenrundfahrt, Sehenswürdigkeit, Stadtplan ...).'),
    S('German Lesson 4 (Lektion 40) Hamburg, wir kommen!', 'Lesson 4 vocabulary, set 2', 'With Claude: the next 15 words. Five sentences of your own.'),
    S('German Lessons 1-4', 'Mixed vocabulary', 'With Claude: 20 words from all four lessons.')
  ];
  Q.germanL4G = [
    S('German Lesson 4 (Lektion 40) Hamburg, wir kommen!', 'würde gern + Infinitiv (wishes)', 'With Claude: 10 sentences: "Ich würde gern eine Hafenrundfahrt machen."'),
    S('German Lesson 4 (Lektion 40) Hamburg, wir kommen!', 'sollte (advice)', 'With Claude: the sollte table and 10 tips: "Du solltest ..." Useful in the e-mail.'),
    S('German Lesson 4 (Lektion 40) Hamburg, wir kommen!', 'bevor and während (clauses)', 'With Claude: "Bevor ich ins Bett gehe, putze ich meine Zähne." Verb positions in both parts.'),
    S('German Lessons 1-4', 'Mixed grammar', 'With Claude: um...zu, damit, weil, wenn, würde, sollte, bevor, während. 12 sentences.')
  ];
  Q.engAll = ['Unit 1 How I Taught My Grandmother to Read', 'Unit 2 The Pot Maker', 'Unit 3 Winds of Change', 'Unit 4 Vitamin-M',
    'Unit 5 The World of Limitless Possibilities', 'Unit 6 Twin Melodies', 'Unit 7 Carrier of Words', 'Unit 8 Follow That Dream',
    'Poems 1-4 (Bharat Our Land, Gifts of Grace, Canvas of Soil, I Cannot Remember My Mother)', 'Poems 5-8 (Nine Gold Medals, A Friend Found in Music, Words, Believe in Yourself)']
    .map(u => S('English revision', u, 'Theme, characters, three quotable lines; one extract question and one 120-word question.'));
  Q.sciAll = ['Physics Ch 4 Describing Motion', 'Chemistry Ch 1 Introduction to Chemistry', 'Biology Ch 1 Cell', 'Physics Ch 6 How Forces Affect Motion',
    'Chemistry Ch 5 Exploring Mixtures', 'Biology Ch 2 Tissues', 'Physics Ch 7 Work, Energy and Simple Machines', 'Chemistry Ch 8 Journey Inside the Atom',
    'Biology Ch 11 Reproduction', 'Other Science chapters taught after Periodic Test II']
    .map(c => S('Science revision', c, 'Formula sheet or diagrams from memory, then 10 questions from the chapter.'));
  Q.sstAll = ['History: Beginning of Civilization and State and Society', 'History: Building a Resilient India and India and the World',
    'Political Science: Authority, Democracy, Elections', 'Economics: Ideas to Startup, Smart Ways to Manage Finances',
    'Economics: Building Blocks, The Price Puzzle', 'Geography: Understanding Social Science, Shaping the Earth Surface',
    'Geography: Atmosphere and Climate, Oceans and Life, Life on Earth']
    .map(c => S('Social Science revision', c, 'One-page notes, then 6 questions in writing matched to marks.'));
  Q.mathsAll = ['Coordinate Geometry', 'Introduction to Polynomials', 'Number System', 'Lines and Angles', 'Sequences and Progressions',
    'Triangles', 'Exploring Algebraic Identities', 'Understanding Data (Ch 10)', 'Quadrilaterals (Ch 12)', 'Two Variables, One Line (Ch 13)',
    'Other Maths chapters taught after Periodic Test II']
    .map(c => S('Maths revision', c, 'Formula sheet, 3 starred questions, then 8 mixed questions. Start with one triangle proof as a warm-up.'));
  Q.gerAll = ['Lesson 1 Allein zu Hause', 'Lesson 2 Wir kaufen nichts', 'Lesson 3 Das würde ich nicht tun', 'Lesson 4 Hamburg']
    .map(l => S('German revision', l, 'With Claude: 15 words, 10 grammar sentences of your own, one reading text.'));

  const PAPER_ROTATION = ['Maths', 'Science', 'German', 'Social Science', 'English', 'Maths', 'Science', 'Social Science', 'Maths', 'Science'];
  const HALF_ROTATION = ['Maths', 'Science', 'Social Science', 'English'];

  // ---------- tests written from the chapters ----------
  const T = [];
  const mcq = (id, q, options, answer, explain) => ({ id, q, options, answer, explain });
  const wr = (id, q, marks, model, scheme) => ({ id, q, marks, model, scheme });

  T.push({
    id: 'T01', date: '2026-10-10', subject: 'maths', minutes: 50,
    title: 'Maths repair: triangle proofs',
    intro: 'Write the proofs on paper in the full layout: Given, To prove, triangles named, three statements with reasons, rule, CPCT.',
    mcq: [
      mcq('a', 'Which of these is NOT a rule for congruent triangles?', ['SAS', 'ASA', 'SSA', 'RHS'], 2, 'Two sides and an angle that is not between them do not fix a triangle.'),
      mcq('b', 'In △ABC and △PQR, AB = PQ, ∠A = ∠P and AC = PR. Which rule proves them congruent?', ['SSS', 'SAS', 'ASA', 'RHS'], 1, 'The equal angle lies between the two equal sides.'),
      mcq('c', 'If △ABC ≅ △DEF, which of these must be true?', ['AB = EF', '∠B = ∠E', 'BC = DF', '∠A = ∠F'], 1, 'Match the letters in order: A↔D, B↔E, C↔F.'),
      mcq('d', 'In △ABC, AB = AC. Which angles are equal?', ['∠A and ∠B', '∠A and ∠C', '∠B and ∠C', 'All three'], 2, 'Angles opposite equal sides are equal.'),
      mcq('e', 'Which line must never appear among the statements of a proof?', ['A given fact', 'A common side', 'The thing you have to prove', 'Vertically opposite angles'], 2, 'Using the result you want to prove as a step is circular. This cost marks in mid-term Q35.'),
      mcq('f', 'CPCT is used ...', ['before proving the triangles congruent', 'after proving the triangles congruent', 'only with SSS', 'only in right triangles'], 1, 'Corresponding parts are equal only once congruence is proved.')
    ],
    written: [
      wr('w1', 'In △ABC, AB = AC and the bisectors of ∠B and ∠C meet at O. Prove that (i) OB = OC and (ii) AO bisects ∠A.', 3,
        'AB = AC, so ∠ABC = ∠ACB. Their halves are equal: ∠OBC = ∠OCB, so OB = OC (sides opposite equal angles). In △ABO and △ACO: AB = AC (given), OB = OC (proved), AO = AO (common). So △ABO ≅ △ACO by SSS and ∠BAO = ∠CAO by CPCT.',
        '½ for ∠ABC = ∠ACB; 1 for OB = OC with reason; 1 for congruence with three correct pairs; ½ for CPCT.'),
      wr('w2', 'ABCD is a square. X lies on AD and Y on BC so that AY = BX. Prove that BY = AX and ∠BAY = ∠ABX.', 3,
        'In △BAY and △ABX: ∠ABY = ∠BAX = 90° (angles of a square), AY = BX (given, hypotenuses), AB = BA (common). So △BAY ≅ △ABX by RHS. Hence BY = AX and ∠BAY = ∠ABX by CPCT.',
        '1 for choosing the right pair of triangles; 1 for three correct pairs with reasons; ½ for RHS; ½ for CPCT.'),
      wr('w3', 'P is the midpoint of segment AB. Points D and E lie on the same side of AB with ∠BAD = ∠ABE and ∠EPA = ∠DPB. Prove △DAP ≅ △EBP and AD = BE.', 4,
        '∠EPA = ∠DPB. Add ∠DPE to both: ∠DPA = ∠EPB. In △DAP and △EBP: ∠DAP = ∠EBP (given), AP = BP (P is the midpoint), ∠DPA = ∠EPB (shown). So △DAP ≅ △EBP by ASA, and AD = BE by CPCT.',
        '1 for showing ∠DPA = ∠EPB; 2 for the three pairs and ASA; 1 for CPCT.'),
      wr('w4', 'In right △ABC, right-angled at C, M is the midpoint of AB. CM is extended to D so that DM = CM, and D is joined to B. Prove (i) △AMC ≅ △BMD (ii) ∠DBC = 90° (iii) CM = ½ AB.', 4,
        '(i) AM = BM, CM = DM, ∠AMC = ∠BMD (vertically opposite): SAS. (ii) So ∠ACM = ∠BDM (CPCT), which are alternate angles, so DB ∥ AC; then ∠DBC + ∠ACB = 180°, so ∠DBC = 90°. (iii) △DBC ≅ △ACB by SAS (DB = AC, ∠DBC = ∠ACB, BC common), so DC = AB and CM = ½ DC = ½ AB.',
        '1½ for (i); 1 for (ii); 1½ for (iii).')
    ]
  });

  T.push({
    id: 'T02', date: '2026-10-17', subject: 'physics', minutes: 50,
    title: 'Physics: motion numericals and work',
    intro: 'Numericals in the five-line layout: Given (SI units), To find, Formula, Substitution, Answer with unit. Take g = 10 m/s² unless told otherwise.',
    mcq: [
      mcq('a', 'A car starts from rest with an acceleration of 2 m/s². Its velocity after 5 s is', ['2.5 m/s', '7 m/s', '10 m/s', '25 m/s'], 2, 'v = u + at = 0 + 2 × 5 = 10 m/s.'),
      mcq('b', 'Time is not given in a question. Which equation do you use?', ['v = u + at', 's = ut + ½at²', 'v² − u² = 2as', 'a = (v − u)/t'], 2, 'It is the only equation without t.'),
      mcq('c', 'Work done by a force acting at 90° to the displacement is', ['maximum', 'zero', 'negative', 'equal to the force'], 1, 'There is no displacement in the direction of the force.'),
      mcq('d', 'The SI unit of work is', ['newton', 'watt', 'joule', 'pascal'], 2, '1 J = 1 N × 1 m.'),
      mcq('e', 'A body moves in a circle at constant speed. Its acceleration is', ['zero', 'along the path', 'towards the centre', 'away from the centre'], 2, 'Its direction keeps changing, so it accelerates towards the centre.'),
      mcq('f', 'While a ball rises after being thrown up, the work done on it by gravity is', ['positive', 'negative', 'zero', 'first positive, then zero'], 1, 'Gravity acts downwards while the ball moves upwards.')
    ],
    written: [
      wr('w1', 'A bullet of mass 50 g moving at 200 m/s enters a wooden block and stops after 50 cm. Find its retardation and the stopping force (assume constant acceleration).', 3,
        'm = 0.05 kg, u = 200 m/s, v = 0, s = 0.5 m. v² − u² = 2as gives 0 − 40000 = 2 × a × 0.5, so a = −40 000 m/s². F = ma = 0.05 × 40 000 = 2000 N (opposing the motion).',
        '½ unit conversion; 1 correct formula; ½ value of a; ½ F = ma; ½ answer with unit.'),
      wr('w2', 'A boy runs for 10 min at 9 km/h. At what speed must he run for the next 20 min so that his average speed for the 30 min is 12 km/h?', 3,
        'Total time 0.5 h, so total distance = 12 × 0.5 = 6 km. First part: 9 × (10/60) = 1.5 km. Remaining 4.5 km in 20 min = 1/3 h, so speed = 4.5 × 3 = 13.5 km/h.',
        '1 total distance; 1 first distance; 1 final speed with unit.'),
      wr('w3', 'An object\u2019s velocity is 2, 4, 6, 8, 10, 12, 14 m/s at t = 0, 1, 2, 3, 4, 5, 6 s. (a) Which quantity goes on the x-axis of the graph? (b) Find the acceleration. (c) Find the distance covered in the last 4 s.', 3,
        '(a) Time on the x-axis, velocity on the y-axis. (b) a = (14 − 2)/6 = 2 m/s². (c) From t = 2 s to 6 s the area under the graph is a trapezium: ½ × (6 + 14) × 4 = 40 m.',
        '½ for (a); 1 for (b); 1½ for (c).'),
      wr('w4', 'A 10 N force pushes a box 5 m along its direction while friction of 4 N opposes the motion. Find the work done by (a) the push (b) friction (c) the weight of the box.', 3,
        '(a) W = 10 × 5 = 50 J. (b) W = −4 × 5 = −20 J (opposite to motion). (c) Zero, because the weight is perpendicular to the displacement.',
        '1 each.')
    ]
  });

  T.push({
    id: 'T03', date: '2026-10-24', subject: 'sst', minutes: 45, type: 'external',
    title: 'Social Science: chapter test',
    intro: 'Take the Physics Wallah chapter test (or textbook questions) on History Part II Ch 3 Building a Resilient India and Political Science Ch 5 Authority. Then enter your marks here.'
  });

  T.push({
    id: 'T04', date: '2026-10-31', subject: 'maths', minutes: 50,
    title: 'Maths: identities, factorising and quadrilaterals',
    intro: 'After every factorisation, multiply back to check. Proofs in the full layout.',
    mcq: [
      mcq('a', '25y² − 9x² factorises as', ['(5y − 3x)²', '(5y − 3x)(5y + 3x)', '(25y − 9x)²', '(5y + 3x)²'], 1, 'a² − b² = (a − b)(a + b) with a = 5y, b = 3x.'),
      mcq('b', 'If a + b + c = 20 and a² + b² + c² = 90, then ab + bc + ca =', ['150', '155', '160', '310'], 1, '(a + b + c)² = a² + b² + c² + 2(ab + bc + ca), so 400 = 90 + 2(…), giving 155.'),
      mcq('c', 'x² + 2x − 15 =', ['(x − 3)(x − 5)', '(x + 3)(x − 5)', '(x + 5)(x − 3)', '(x − 5)(x + 3)'], 2, 'Numbers with product −15 and sum 2 are +5 and −3.'),
      mcq('d', 'Which is NOT true for every parallelogram?', ['Opposite sides are equal', 'Opposite angles are equal', 'Diagonals bisect each other', 'Diagonals are equal'], 3, 'Equal diagonals hold only for rectangles (and squares).'),
      mcq('e', 'D and E are the midpoints of AB and AC in △ABC, and BC = 14 cm. DE =', ['14 cm', '7 cm', '28 cm', '3.5 cm'], 1, 'Midpoint theorem: DE is half of BC.'),
      mcq('f', 'The centroid divides each median in the ratio', ['1 : 1', '2 : 1', '3 : 1', '1 : 3'], 1, 'From the vertex, 2 : 1.')
    ],
    written: [
      wr('w1', 'Simplify (9x² − 30xy + 25y²) / (25y² − 9x²).', 2,
        'Numerator = (3x − 5y)². Denominator = (5y − 3x)(5y + 3x) = −(3x − 5y)(3x + 5y). Result = −(3x − 5y)/(3x + 5y) = (5y − 3x)/(5y + 3x).',
        '½ numerator; 1 denominator; ½ final form.'),
      wr('w2', 'Evaluate 105 × 95 using an identity.', 2, '(100 + 5)(100 − 5) = 100² − 5² = 10 000 − 25 = 9975.', '1 identity; 1 answer.'),
      wr('w3', 'Factorise (9/4)x² + 6xy + 4y².', 2, '= (3x/2)² + 2(3x/2)(2y) + (2y)² = (3x/2 + 2y)².', '1 showing the three terms; 1 answer.'),
      wr('w4', 'Prove that the diagonals of a parallelogram bisect each other.', 3,
        'Let diagonals AC and BD of parallelogram ABCD meet at O. In △AOB and △COD: AB = CD (opposite sides), ∠OAB = ∠OCD and ∠OBA = ∠ODC (alternate angles, AB ∥ CD). So △AOB ≅ △COD by ASA, and OA = OC, OB = OD by CPCT.',
        '1 figure and To prove; 1½ congruence with reasons; ½ CPCT.'),
      wr('w5', 'In △ABC, D and E are the midpoints of AB and AC. BC = 9 cm and ∠ADE = 70°. Find DE and ∠ABC, giving reasons.', 3,
        'By the midpoint theorem DE ∥ BC and DE = ½ × 9 = 4.5 cm. Since DE ∥ BC, ∠ABC = ∠ADE = 70° (corresponding angles).',
        '1½ each, with the reason.')
    ]
  });

  T.push({
    id: 'T05', date: '2026-11-07', subject: 'science', minutes: 50,
    title: 'Forces and the atom (8.3-8.6)',
    intro: 'Physics "give reason" answers must name the law or the quantity. Chemistry 3-mark answers need 3 numbered points.',
    mcq: [
      mcq('a', 'Action and reaction forces do not cancel each other because they', ['are unequal', 'act on different bodies', 'act in the same direction', 'act at different times'], 1, 'They act on two different objects.'),
      mcq('b', 'The net force on an object moving with constant velocity is', ['zero', 'equal to its weight', 'increasing', 'in the direction of motion'], 0, 'No acceleration means no net force.'),
      mcq('c', 'The momentum of a 2 kg ball moving at 3 m/s is', ['1.5 kg m/s', '5 kg m/s', '6 kg m/s', '9 kg m/s'], 2, 'p = mv = 6 kg m/s.'),
      mcq('d', 'The neutron was discovered by', ['J. J. Thomson', 'Ernest Rutherford', 'James Chadwick', 'Niels Bohr'], 2, 'Chadwick, 1932.'),
      mcq('e', 'An atom has 11 protons and 12 neutrons. Its mass number is', ['11', '12', '23', '1'], 2, 'Mass number = protons + neutrons.'),
      mcq('f', 'Atomic number is the number of', ['neutrons', 'protons', 'protons + neutrons', 'shells'], 1, ''),
      mcq('g', 'The symbol of sodium is', ['S', 'So', 'Na', 'Sd'], 2, 'From its Latin name, natrium.')
    ],
    written: [
      wr('w1', 'Give reason: a karate player can break a pile of tiles with a single blow.', 2,
        'The hand moves fast, so it has large momentum, and it is stopped in a very short time. Force = rate of change of momentum, so a very large force acts on the tiles (second law of motion).',
        '1 momentum and short time; 1 naming the law or F = Δp/t.'),
      wr('w2', 'A stone of mass 20 g falls freely. Find the force acting on it (g = 9.8 m/s²).', 2, 'F = mg = 0.02 × 9.8 = 0.196 N, downwards.', '½ conversion; 1 formula; ½ answer with unit.'),
      wr('w3', 'Write three conclusions Rutherford drew from the gold foil experiment.', 3,
        '1. Most of the atom is empty space, since most alpha particles passed straight through. 2. The positive charge and almost all the mass are in a very small centre, the nucleus, since a few particles were deflected by large angles. 3. The nucleus is very small compared with the atom, since only about 1 in 12 000 bounced back.',
        '1 per point with its observation.'),
      wr('w4', 'For Na (Z = 11, A = 23), Cl (Z = 17, A = 35) and O (Z = 8, A = 16), give protons, neutrons, electrons and the K, L, M distribution.', 3,
        'Na: 11, 12, 11; 2, 8, 1. Cl: 17, 18, 17; 2, 8, 7. O: 8, 8, 8; 2, 6.',
        '1 per element.'),
      wr('w5', 'State two features of Bohr\u2019s model of the atom.', 2,
        'Electrons move only in certain fixed orbits (shells K, L, M, N) with fixed energy. While in these orbits, electrons do not radiate energy.',
        '1 each.')
    ]
  });

  T.push({
    id: 'T06', date: '2026-11-14', subject: 'english', minutes: 50,
    title: 'English Units 5-6 and Biology 11.1-11.2',
    intro: 'Write the notice and the article on paper within the word limits. Biology answers in numbered points.',
    mcq: [
      mcq('a', 'In Unit 5, "resilience" means', ['great speed', 'the ability to recover quickly from difficulties', 'winning many medals', 'fear of failure'], 1, 'It is glossed in the margin of the text.'),
      mcq('b', '"Defy the odds" means', ['give up early', 'overcome challenges', 'make a bet', 'follow the rules'], 1, ''),
      mcq('c', 'In a play like Twin Melodies, an "aside" shows', ['the stage setting', 'what a character thinks or feels', 'the end of a scene', 'a song'], 1, 'The audience hears it; the other characters do not.'),
      mcq('d', 'Amoeba reproduces by', ['budding', 'binary fission', 'spores', 'fragmentation'], 1, ''),
      mcq('e', 'Yeast reproduces mainly by', ['budding', 'regeneration', 'pollination', 'fragmentation'], 0, ''),
      mcq('f', 'Meiosis produces cells with', ['double the chromosome number', 'the same chromosome number', 'half the chromosome number', 'no chromosomes'], 2, 'Gametes carry half the number, restored at fertilisation.')
    ],
    written: [
      wr('w1', 'You are the Sports Secretary. Write a notice (about 50 words) about a Paralympic awareness day in your school.', 3,
        'School name; NOTICE; date; heading; body with what, when, where, who may join and how to register; name and designation.',
        '1 format; 1½ content; ½ language and word limit.'),
      wr('w2', 'Write an article (120-150 words) titled "Sport has no limits", using ideas from Unit 5.', 5,
        'Title and by-line; introduction; examples such as para-athletes and Sheetal Devi; what society should do; conclusion.',
        '1 format; 2 content; 2 organisation and language.'),
      wr('w3', 'Give two reasons why farmers prefer vegetative propagation for some crops.', 2,
        'Plants are identical to the parent, so good qualities are kept. Plants grow and bear fruit faster; it also works for plants that make few or no viable seeds (e.g. banana).',
        '1 each.'),
      wr('w4', 'Draw a labelled diagram of a flower showing sepal, petal, anther, filament, stigma, style and ovary.', 3, 'Diagram with all seven labels.', '1 diagram; 2 for labels (deduct ½ per missing label).'),
      wr('w5', 'Differentiate between self-pollination and cross-pollination.', 2,
        'Self: pollen reaches the stigma of the same flower or another flower on the same plant. Cross: pollen reaches the stigma of a flower on a different plant of the same kind, usually through wind, water or insects.',
        '1 each.')
    ]
  });

  T.push({
    id: 'T07', date: '2026-11-21', subject: 'maths', minutes: 75,
    title: 'Periodic Test II mock: Maths (Ch 10, 12, 13)',
    intro: 'Exam conditions: no book, timer on. Graph on graph paper with labelled axes.',
    mcq: [
      mcq('a', '8 seniors average 165.5 cm and 3 juniors average 149.33 cm. The average for all 11 is about', ['157.4 cm', '161.1 cm', '160.0 cm', '165.5 cm'], 1, '(8 × 165.5 + 3 × 149.33)/11 = 1772/11 ≈ 161.1. The simple average of the two averages (157.4) is wrong.'),
      mcq('b', 'A 100% stacked bar chart compares', ['absolute values', 'proportions', 'only totals', 'changes over time only'], 1, ''),
      mcq('c', 'The slope of y = 3x − 2 is', ['−2', '2', '3', '1/3'], 2, 'In y = mx + d, m is the slope.'),
      mcq('d', 'The line 2x + y = 6 cuts the y-axis at', ['(3, 0)', '(0, 6)', '(6, 0)', '(0, 3)'], 1, 'Put x = 0.'),
      mcq('e', 'The pair x + 2y = 4 and 2x + 4y = 8 has', ['a unique solution', 'no solution', 'infinitely many solutions', 'exactly two solutions'], 2, 'a1/a2 = b1/b2 = c1/c2 = 1/2.'),
      mcq('f', 'The pair x + y = 3 and 2x + 2y = 7 has', ['a unique solution', 'no solution', 'infinitely many solutions', 'exactly two solutions'], 1, '1/2 = 1/2 but 3/7 is different: parallel lines.'),
      mcq('g', 'Joining the midpoints of the sides of any quadrilateral gives a', ['rhombus', 'rectangle', 'parallelogram', 'square'], 2, ''),
      mcq('h', 'Which point is a solution of 2x + 3y = 12?', ['(2, 3)', '(3, 2)', '(0, 3)', '(6, 1)'], 1, '6 + 6 = 12.')
    ],
    written: [
      wr('w1', 'Section A has 30 students with an average of 72 marks; Section B has 20 students with an average of 62. Find the average of all 50 students.', 3,
        '(30 × 72 + 20 × 62)/50 = (2160 + 1240)/50 = 3400/50 = 68.', '1 weighted formula; 1 working; 1 answer.'),
      wr('w2', 'Solve by elimination: 3x + 2y = 11 and 2x − y = 5.', 3,
        'Multiply the second by 2: 4x − 2y = 10. Add to the first: 7x = 21, x = 3. Then y = 2(3) − 5 = 1. Check: 9 + 2 = 11.',
        '1 elimination step; 1 x; ½ y; ½ check.'),
      wr('w3', 'The sum of two numbers is 14 and their difference is 4. Form the equations and solve by substitution.', 3,
        'Let the numbers be x and y. x + y = 14, x − y = 4. From the second, x = y + 4. Substituting: 2y + 4 = 14, y = 5, x = 9.',
        '1 equations; 1 substitution; 1 answer.'),
      wr('w4', 'Draw the graphs of x + y = 5 and x − y = 1 on the same axes and find the solution.', 4,
        'Points for x + y = 5: (0, 5), (5, 0), (2, 3). For x − y = 1: (1, 0), (0, −1), (3, 2). The lines meet at (3, 2), so x = 3, y = 2.',
        '1 each table; 1 graph with labels; 1 solution.'),
      wr('w5', 'Prove: if the diagonals of a quadrilateral bisect each other, it is a parallelogram.', 4,
        'Diagonals AC and BD meet at O with OA = OC and OB = OD. △AOB ≅ △COD by SAS (vertically opposite angles), so ∠OAB = ∠OCD; these are alternate angles, so AB ∥ CD. Similarly △AOD ≅ △COB gives AD ∥ BC. Both pairs of opposite sides are parallel, so ABCD is a parallelogram.',
        '1 figure, given, to prove; 2 two congruences; 1 conclusion.'),
      wr('w6', '2 L of a 30% sugar solution is mixed with 3 L of a 10% sugar solution. Find the concentration of the mixture.', 3,
        'Sugar = 0.3 × 2 + 0.1 × 3 = 0.9 L in 5 L, so 0.9/5 = 18%.', '1 sugar amounts; 1 weighted mean; 1 answer.')
    ]
  });

  T.push({
    id: 'T08', date: '2026-11-28', subject: 'science', minutes: 75,
    title: 'Periodic Test II mock: Science (Ch 7, 8, 11)',
    intro: 'Exam conditions. Take g = 10 m/s². Numericals in the five-line layout; diagrams labelled.',
    mcq: [
      mcq('a', 'The kinetic energy of a 2 kg body moving at 3 m/s is', ['3 J', '6 J', '9 J', '18 J'], 2, '½ × 2 × 3² = 9 J.'),
      mcq('b', 'The potential energy of a 5 kg box on a shelf 4 m high is', ['20 J', '50 J', '200 J', '2000 J'], 2, 'mgh = 5 × 10 × 4.'),
      mcq('c', 'A motor does 600 J of work in 30 s. Its power is', ['20 W', '570 W', '630 W', '18 000 W'], 0, 'P = W/t.'),
      mcq('d', 'In a lever, if the effort arm is longer than the load arm, the effort needed is', ['more than the load', 'less than the load', 'equal to the load', 'zero'], 1, 'Load × load arm = effort × effort arm.'),
      mcq('e', 'Isotopes of an element have the same', ['mass number', 'number of neutrons', 'atomic number', 'mass'], 2, ''),
      mcq('f', 'An element with distribution 2, 8, 7 has valency', ['7', '1', '2', '8'], 1, 'It needs one more electron to complete its octet.'),
      mcq('g', 'In a flower, fertilisation takes place in the', ['anther', 'stigma', 'ovule', 'petal'], 2, 'The ovule then becomes the seed.'),
      mcq('h', 'Budding is a method of reproduction in', ['Amoeba', 'Hydra', 'Spirogyra', 'mango'], 1, '')
    ],
    written: [
      wr('w1', 'A 50 kg student goes to the top of a 72.5 m building, once by lift and once by the stairs. Find the gain in potential energy each time. What do you conclude?', 3,
        'PE = mgh = 50 × 10 × 72.5 = 36 250 J both times. Potential energy depends only on the height, not on the path taken.',
        '1 formula; 1 value; 1 conclusion.'),
      wr('w2', 'A 2 kg ball is thrown up at 20 m/s. Find its kinetic energy at the start, its kinetic energy at the top, and the maximum height (ignore air resistance).', 3,
        'KE = ½ × 2 × 400 = 400 J. At the top KE = 0. All 400 J becomes PE: 2 × 10 × h = 400, so h = 20 m.',
        '1 each.'),
      wr('w3', 'An adult weighing twice as much as a child balances a seesaw. Where must each sit? Explain with the lever rule.', 2,
        'Load × load arm = effort × effort arm. If the adult sits at distance d from the fulcrum, the child must sit at 2d on the other side.',
        '1 rule; 1 answer.'),
      wr('w4', 'Define isotopes. Give protons, neutrons and electrons for carbon-12 and carbon-14, and one use of isotopes.', 3,
        'Atoms of the same element with the same atomic number but different mass numbers. C-12: 6, 6, 6. C-14: 6, 8, 6. Use: carbon-14 for dating, cobalt-60 for cancer treatment, or iodine-131 for thyroid treatment.',
        '1 definition; 1 table; 1 use.'),
      wr('w5', 'Write the electron distribution and valency of sodium (11), magnesium (12) and chlorine (17).', 3,
        'Na 2, 8, 1: valency 1. Mg 2, 8, 2: valency 2. Cl 2, 8, 7: valency 1.', '1 each.'),
      wr('w6', 'Why do offspring from sexual reproduction show variation, while those from asexual reproduction are almost identical?', 3,
        '1. Sexual reproduction joins gametes from two parents. 2. Meiosis mixes the genetic material when gametes form. 3. Asexual reproduction uses one parent and copies its DNA, so offspring are near copies.',
        '1 per point.'),
      wr('w7', 'Describe the steps from pollination to the formation of seed and fruit.', 3,
        'Pollen lands on the stigma. A pollen tube grows down the style into the ovule. The male gamete fuses with the egg to form a zygote. The ovule becomes the seed and the ovary becomes the fruit.',
        '1 pollination and tube; 1 fertilisation; 1 seed and fruit.')
    ]
  });

  // ---------- generator ----------
  function build(cfg, extraOff, removedOff) {
    const D = cfg.dates;
    const off = Object.assign({}, cfg.offDays || {}, extraOff || {});
    (removedOff || []).forEach(d => { delete off[d]; });
    const sprintStart = addDays(D.pt2Start, -14);
    const p4Start = addDays(D.annualStart, -35);
    const ptrs = {};
    const take = (name, wrap) => {
      const list = Q[name]; if (!list || !list.length) return null;
      const i = ptrs[name] || 0;
      if (i >= list.length && !wrap) return null;
      ptrs[name] = i + 1;
      return list[i % list.length];
    };
    const takeAny = (...names) => { for (const n of names) { const r = take(n); if (r) return r; } return take(names[names.length - 1], true); };
    let paperIdx = 0, halfIdx = 0, gerSat = 0;

    const days = {}; const tests = T.map(t => Object.assign({ type: 'quiz' }, t));
    const task = (date, slot, block, subject, s, extra) => {
      const m = /^(Physics|Chemistry|Biology)/.exec(s.title) || /^(Physics|Chemistry|Biology)/.exec(s.ch || '');
      if (m && ['physics', 'chemistry', 'biology'].includes(subject)) subject = m[1].toLowerCase();
      return Object.assign({ id: `${date}:${slot}`, block, subject, ch: s.ch, title: s.title, detail: s.detail }, extra || {});
    };
    const closeTask = date => ({ id: `${date}:close`, block: 'close', subject: 'close', ch: null, title: 'Daily close (10 min)',
      detail: 'Books closed: write five things you learned today below. Tick the tracker and put out tomorrow\u2019s books.' });
    const bufferTask = date => ({ id: `${date}:buffer`, block: 3, subject: 'buffer', ch: null, optional: true,
      title: 'Buffer: catch up', detail: 'Finish any unticked task from this week. If nothing is pending, this time is yours.' });
    const gerSatTask = (date, phase) => {
      gerSat++;
      const email = gerSat % 2 === 1;
      const lessonText = phase === 1 ? 'Lessons 1-2' : phase === 2 ? 'Lesson 3' : 'Lessons 1-4';
      return task(date, 'b3', 3, 'german', email
        ? S('German writing', 'E-mail with Claude', 'Write a 60-80 word advice e-mail on paper using the frame, then let Claude correct it line by line. Record Claude\u2019s mark.')
        : S('German test', `Mock test with Claude: ${lessonText}`, '20-mark paper in the school pattern, 25 minutes, on paper. Type or photograph your answers for Claude to mark. Record the mark.'),
      { scoreMax: email ? 10 : 20 });
    };

    for (let d = D.start; d <= D.annualEnd; d = addDays(d, 1)) {
      const wd = dow(d);
      let phase, phaseName;
      if (d < sprintStart) { phase = 1; phaseName = 'Phase 1: keep pace and repair'; }
      else if (d < D.pt2Start) { phase = 2; phaseName = 'Phase 2: Periodic Test II sprint'; }
      else if (d <= D.pt2End) { phase = 'e1'; phaseName = 'Periodic Test II'; }
      else if (d < p4Start) { phase = 3; phaseName = 'Phase 3: finish and second pass'; }
      else if (d < D.annualStart) { phase = 4; phaseName = 'Phase 4: full revision'; }
      else { phase = 'e2'; phaseName = 'Annual exam'; }

      if (wd === 0) { days[d] = { date: d, kind: 'sunday', phase, phaseName, tasks: [] }; continue; }
      if (off[d]) { days[d] = { date: d, kind: 'off', reason: off[d], phase, phaseName, tasks: [] }; continue; }

      const tasks = [];
      let testId = null, kind = 'study';
      const week = Math.floor(diffDays(D.start, d) / 7);

      if (phase === 'e1' || phase === 'e2') {
        kind = 'exam';
        tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: 'Exam day: revise for the next paper',
          detail: 'Check the datesheet. Revise the next paper from your one-page notes, formula sheet and mistake notebook only. No new topics.' });
        tasks.push({ id: `${d}:close`, block: 'close', subject: 'close', ch: null, title: 'Pack the bag and sleep 8 hours',
          detail: 'Admit card, pens, geometry box. Screens off 45 minutes before bed.' });
      } else if (phase === 1) {
        if (wd >= 1 && wd <= 3) tasks.push(task(d, 'b1', 1, 'maths', takeAny('mathsNew', 'mathsSprint')));
        if (wd === 4) tasks.push(week < 4 ? task(d, 'b1', 1, 'adv', take('adv') || take('mathsNew'))
          : task(d, 'b1', 1, 'maths', takeAny('mathsNew', 'mathsSprint')));
        if (wd === 5) tasks.push(task(d, 'b1', 1, 'maths', take('repair') || take('mathsNew')));
        if (wd === 1) {
          tasks.push({ id: `${d}:warm`, block: 2, subject: 'physics', ch: 'Physics repair: numericals', title: '15 min: 5 old numericals',
            detail: 'Five numericals from Motion and Forces in the five-line layout. This is the habit that fixes mid-term Q35 and Q36.' });
          tasks.push(task(d, 'b2', 2, 'physics', takeAny('physics', 'physicsRev')));
          tasks.push(task(d, 'b3', 3, 'english', takeAny('english', 'englishRev')));
        }
        if (wd === 2) { tasks.push(task(d, 'b2', 2, 'sst', takeAny('sstA', 'sstARev'))); tasks.push(task(d, 'b3', 3, 'german', takeAny('germanV', 'gerAll'))); }
        if (wd === 3) { tasks.push(task(d, 'b2', 2, 'chemistry', takeAny('chemistry', 'chemistryRev'))); tasks.push(bufferTask(d)); }
        if (wd === 4) { tasks.push(task(d, 'b2', 2, 'sst', takeAny('sstB', 'sstBRev'))); tasks.push(task(d, 'b3', 3, 'german', takeAny('germanG', 'gerAll'))); }
        if (wd === 5) { tasks.push(task(d, 'b2', 2, 'biology', takeAny('biology', 'biologyRev'))); tasks.push(task(d, 'b3', 3, 'english', takeAny('englishW', 'englishNewW'))); }
        if (wd === 6) {
          kind = 'test';
          const t = tests.find(x => x.date === d);
          if (t) {
            testId = t.id;
            tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: `Test: ${t.title}`, detail: `${t.minutes} minutes, timed, on paper. Open it from the Tests tab.`, testId: t.id });
          } else {
            tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: 'Test: this week\u2019s chapters', detail: '60 minutes on the questions you got wrong this week.' });
          }
          tasks.push({ id: `${d}:b2`, block: 2, subject: 'test', ch: null, title: 'Corrections and mistake notebook (45 min)',
            detail: 'Every wrong answer: question, what went wrong, the right method. Then redo two of them.' });
          tasks.push(gerSatTask(d, 1));
        }
      } else if (phase === 2) {
        if (wd >= 1 && wd <= 5) tasks.push(task(d, 'b1', 1, 'maths', takeAny('mathsNew', 'mathsSprint')));
        if (wd === 1) { tasks.push(task(d, 'b2', 2, 'physics', takeAny('physics', 'physicsRev'))); tasks.push(task(d, 'b3', 3, 'english', takeAny('english', 'englishRev'))); }
        if (wd === 2) { tasks.push(task(d, 'b2', 2, 'sst', takeAny('sstA', 'sstARev'))); tasks.push(task(d, 'b3', 3, 'german', take('germanV') || S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 vocabulary, mixed', 'With Claude: 20 words from Lesson 3.'))); }
        if (wd === 3) { tasks.push(task(d, 'b2', 2, 'chemistry', takeAny('chemistry', 'chemistryRev'))); tasks.push(bufferTask(d)); }
        if (wd === 4) { tasks.push(task(d, 'b2', 2, 'sst', takeAny('sstB', 'sstBRev'))); tasks.push(task(d, 'b3', 3, 'german', take('germanG') || S('German Lesson 3 (Lektion 39) Das würde ich nie tun!', 'Lesson 3 grammar, mixed', 'With Claude: würde, während, wo(r)/da(r) + preposition. 12 sentences.'))); }
        if (wd === 5) { tasks.push(task(d, 'b2', 2, 'biology', takeAny('biology', 'biologyRev'))); tasks.push(task(d, 'b3', 3, 'english', S('English writing', 'Timed article', 'Write one article (120-150 words) in 20 minutes on a topic from Units 5-6.'))); }
        if (wd === 6) {
          kind = 'test';
          const t = tests.find(x => x.date === d);
          if (t) { testId = t.id; tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: `Test: ${t.title}`, detail: `${t.minutes} minutes under exam conditions. Open it from the Tests tab.`, testId: t.id }); }
          else tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: 'Mixed revision test', detail: '75 minutes on PT-II chapters.' });
          tasks.push({ id: `${d}:b2`, block: 2, subject: 'test', ch: null, title: 'Corrections and mistake notebook (45 min)', detail: 'Every wrong answer into the mistake notebook with the right method.' });
          tasks.push(gerSatTask(d, 2));
        }
      } else if (phase === 3) {
        if (wd >= 1 && wd <= 3) tasks.push(task(d, 'b1', 1, 'maths', take('mathsPass2') || take('mathsMixed', true)));
        if (wd === 4) tasks.push(task(d, 'b1', 1, 'maths', take('mathsMixed', true)));
        if (wd === 5) tasks.push(task(d, 'b1', 1, 'maths', take('mathsAll', true)));
        if (wd === 1) { tasks.push(task(d, 'b2', 2, 'physics', take('physicsPass2') || take('sciAll', true))); tasks.push(task(d, 'b3', 3, 'english', take('englishNew') || take('engAll', true))); }
        if (wd === 2) { tasks.push(task(d, 'b2', 2, 'sst', take('sstNewA') || take('sstAll', true))); tasks.push(task(d, 'b3', 3, 'german', take('germanL4V') || take('gerAll', true))); }
        if (wd === 3) { tasks.push(task(d, 'b2', 2, 'chemistry', take('chemistryPass2') || take('sciAll', true))); tasks.push(bufferTask(d)); }
        if (wd === 4) { tasks.push(task(d, 'b2', 2, 'sst', take('sstNewB') || take('sstAll', true))); tasks.push(task(d, 'b3', 3, 'german', take('germanL4G') || take('gerAll', true))); }
        if (wd === 5) { tasks.push(task(d, 'b2', 2, 'biology', take('biologyPass2') || take('sciAll', true))); tasks.push(task(d, 'b3', 3, 'english', take('englishNewW') || take('englishW', true))); }
        if (wd === 6) {
          kind = 'test';
          const subj = HALF_ROTATION[halfIdx++ % HALF_ROTATION.length];
          const id = 'X' + d.replace(/-/g, '');
          tests.push({ id, date: d, subject: subjKey(subj), minutes: 90, type: 'external', title: `Half-syllabus test: ${subj}`,
            intro: `90 minutes on the mid-term portion of ${subj}. Use a school sample paper or a Physics Wallah test. Enter the marks when you finish.` });
          testId = id;
          tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: `Test: half-syllabus ${subj} (90 min)`, detail: 'Exam conditions. Enter the marks in the Tests tab.', testId: id });
          tasks.push({ id: `${d}:b2`, block: 2, subject: 'test', ch: null, title: 'Corrections and mistake notebook (45 min)', detail: 'Every wrong answer into the mistake notebook.' });
          tasks.push(gerSatTask(d, 3));
        }
      } else if (phase === 4) {
        if (wd === 3 || wd === 6) {
          kind = 'test';
          const subj = PAPER_ROTATION[paperIdx++ % PAPER_ROTATION.length];
          const id = 'P' + d.replace(/-/g, '');
          tests.push({ id, date: d, subject: subjKey(subj), minutes: 180, type: 'external', title: `Sample paper: ${subj}`,
            intro: `Full 3-hour ${subj} sample paper under exam conditions. Enter the marks after checking with the marking scheme.` });
          testId = id;
          tasks.push({ id: `${d}:b1`, block: 1, subject: 'test', ch: null, title: `Sample paper: ${subj} (3 hours)`, detail: 'Replaces all three blocks today. Enter the marks in the Tests tab.', testId: id });
        } else {
          tasks.push(task(d, 'b1', 1, 'maths', wd === 4
            ? S('Correcting the sample paper', 'Correct yesterday\u2019s paper', 'Mark it with the scheme. Every lost mark into the mistake notebook with the right method.')
            : take('mathsAll', true)));
          if (wd === 1) { tasks.push(task(d, 'b2', 2, 'physics', take('sciAll', true))); tasks.push(task(d, 'b3', 3, 'english', take('engAll', true))); }
          if (wd === 2) { tasks.push(task(d, 'b2', 2, 'sst', take('sstAll', true))); tasks.push(task(d, 'b3', 3, 'german', take('gerAll', true))); }
          if (wd === 4) { tasks.push(task(d, 'b2', 2, 'sst', take('sstAll', true))); tasks.push(task(d, 'b3', 3, 'german', take('gerAll', true))); }
          if (wd === 5) { tasks.push(task(d, 'b2', 2, 'biology', take('sciAll', true))); tasks.push(task(d, 'b3', 3, 'english', take('englishNewW', true))); }
        }
      }
      if (kind !== 'exam') tasks.push(closeTask(d));
      days[d] = { date: d, kind, phase, phaseName, tasks, testId };
    }
    tests.sort((a, b) => a.date < b.date ? -1 : 1);
    return { days, tests, off, sprintStart, p4Start };
  }

  function subjKey(name) {
    return { Maths: 'maths', Science: 'science', German: 'german', 'Social Science': 'sst', English: 'english' }[name] || 'test';
  }

  window.PLAN = { build, SUBJECTS, util: { parse, ymd, addDays, dow, diffDays, todayStr } };
})();
