const labels = {
  Dashboard: 'ផ្ទាំងគ្រប់គ្រង', Students: 'សិស្ស', Teachers: 'គ្រូបង្រៀន', Parents: 'អាណាព្យាបាល',
  'User Management': 'គ្រប់គ្រងអ្នកប្រើប្រាស់', Courses: 'មុខវិជ្ជា', Classes: 'ថ្នាក់រៀន', Schedules: 'កាលវិភាគ',
  'Mark Attendance': 'កត់ត្រាវត្តមាន', Attendances: 'វត្តមាន', Exams: 'ការប្រឡង', 'Grades & Results': 'ពិន្ទុ និងលទ្ធផល',
  Homework: 'កិច្ចការផ្ទះ', Library: 'បណ្ណាល័យ', 'Fees & Finance': 'ថ្លៃសិក្សា និងហិរញ្ញវត្ថុ', Payroll: 'បើកប្រាក់ខែ',
  Messages: 'សារ', Events: 'ព្រឹត្តិការណ៍', Discipline: 'វិន័យ', Awards: 'រង្វាន់', Documents: 'ឯកសារ', Notifications: 'ការជូនដំណឹង',
  Reports: 'របាយការណ៍', Warnings: 'ការព្រមាន', Leaves: 'ការសុំច្បាប់', 'School Settings': 'ការកំណត់សាលា',
  'System Settings': 'ការកំណត់ប្រព័ន្ធ', 'Login History': 'ប្រវត្តិចូលប្រើ', 'My Account': 'គណនីរបស់ខ្ញុំ',
  Logout: 'ចាកចេញ', Language: 'ភាសា', Khmer: 'ខ្មែរ', English: 'English',
  'Academic Management Center': 'មជ្ឈមណ្ឌលគ្រប់គ្រងការសិក្សា', Role: 'តួនាទី',
  Theme: 'ប្រធានបទ', Light: 'ពន្លឺ', Dark: 'ងងឹត', System: 'ប្រព័ន្ធ',
};

export function getLanguage() {
  return localStorage.getItem('language') === 'km' ? 'km' : 'en';
}

export function setLanguage(language) {
  const next = language === 'km' ? 'km' : 'en';
  localStorage.setItem('language', next);
  return next;
}

export function translateLabel(label, language = getLanguage()) {
  return language === 'km' ? labels[label] || label : label;
}
