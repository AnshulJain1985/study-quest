// Settings for the study tracker. Edit this file, then redeploy (firebase deploy).
window.APP_CONFIG = {
  studentName: 'Ashray',
  parentName: 'Parent',

  // Paste the web-app config from Firebase console > Project settings > Your apps.
  // Set it to null to run in demo mode (data stays in this browser only).
  firebase: {
    apiKey: 'AIzaSyABH1AqbGDsWCQymHWkPcKPgVMRthfklN4',
    authDomain: 'study-quest-ashray.firebaseapp.com',
    projectId: 'study-quest-ashray',
    appId: '1:787475825286:web:63d17314c4e2535acb8707'
  },

  // Exam dates drive the whole plan. Change them when the school datesheet arrives.
  dates: {
    start: '2026-10-05',        // first day of the plan (a Monday)
    pt2Start: '2026-11-30',     // Periodic Test II, first paper
    pt2End: '2026-12-04',       // Periodic Test II, last paper
    annualStart: '2027-02-15',  // Annual exam, first paper
    annualEnd: '2027-02-27'     // Annual exam, last paper
  },

  // Days with no study tasks. The parent can add or remove more from the calendar.
  // Festival dates are approximate; check them against the school calendar.
  offDays: {
    '2026-10-20': 'Dussehra',
    '2026-11-07': 'Diwali',
    '2026-11-09': 'Diwali',
    '2026-11-10': 'Diwali',
    '2026-12-05': 'Rest after Periodic Test II',
    '2026-12-07': 'Rest after Periodic Test II'
  },

  // How many days back the student may still tick tasks (0 = today only).
  editWindowDays: 1
};
