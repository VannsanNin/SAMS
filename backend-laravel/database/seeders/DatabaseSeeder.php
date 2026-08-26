<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\Teacher;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\SchoolClass;
use App\Models\Schedule;
use App\Models\Attendance;
use App\Models\Leave;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        \App\Models\User::create([
            'name' => 'Admin',
            'email' => 'admin@school.edu',
            'password' => 'admin123',
            'role' => 'admin',
        ]);

        $teacher = Teacher::create([
            'name' => 'Sokha Meas',
            'gender' => 'Male',
            'dob' => '1985-03-15',
            'phone' => '012345678',
            'email' => 'sokha.meas@school.edu',
            'address' => 'Phnom Penh',
            'position' => 'Head Teacher',
            'department' => 'Mathematics',
            'salary' => 1500,
            'hire_date' => '2020-09-01',
            'status' => 'active',
        ]);

        \App\Models\User::create([
            'name' => $teacher->name,
            'email' => 'teacher@school.edu',
            'password' => 'teacher123',
            'role' => 'teacher',
            'teacher_id' => $teacher->id,
        ]);

        $staff = Staff::create([
            'name' => 'Sreyneang Chen',
            'gender' => 'Female',
            'dob' => '1990-07-22',
            'phone' => '098765432',
            'email' => 'sreyneang.chen@school.edu',
            'address' => 'Phnom Penh',
            'position' => 'Administrator',
            'salary' => 1200,
            'hire_date' => '2021-01-15',
        ]);

        $classList = [];
        $departmentsCycle = ['Science', 'Languages', 'Social Science'];
        foreach (range(7, 12) as $grade) {
            foreach (['A', 'B'] as $section) {
                $classList[] = SchoolClass::create([
                    'class_name' => "{$grade}-{$section}",
                    'teacher_id' => $teacher->id,
                    'academic_year' => '2025-2026',
                    'department' => $departmentsCycle[($grade + ($section === 'B' ? 1 : 0)) % 3],
                    'semester' => 'Semester 1',
                    'room' => 'Room ' . (201 + count($classList)),
                ]);
            }
        }

        $math = Subject::create([
            'subject_name' => 'Mathematics',
            'course_code' => 'MATH-101',
            'credits' => 3,
            'description' => 'Advanced Mathematics',
            'department' => 'Mathematics',
            'semester' => 'Semester 1',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $khmer = Subject::create([
            'subject_name' => 'Khmer Literature',
            'course_code' => 'KHM-101',
            'credits' => 3,
            'description' => 'Khmer Language and Literature',
            'department' => 'Languages',
            'semester' => 'Semester 1',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $english = Subject::create([
            'subject_name' => 'English',
            'course_code' => 'ENG-101',
            'credits' => 3,
            'description' => 'English Language',
            'department' => 'Languages',
            'semester' => 'Semester 2',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $physics = Subject::create([
            'subject_name' => 'Physics',
            'course_code' => 'PHY-101',
            'credits' => 2,
            'description' => 'Physics',
            'department' => 'Science',
            'semester' => 'Semester 1',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $chemistry = Subject::create([
            'subject_name' => 'Chemistry',
            'course_code' => 'CHE-101',
            'credits' => 2,
            'description' => 'Chemistry',
            'department' => 'Science',
            'semester' => 'Semester 2',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $history = Subject::create([
            'subject_name' => 'History',
            'course_code' => 'HIS-101',
            'credits' => 2,
            'description' => 'History',
            'department' => 'Social Science',
            'semester' => 'Semester 1',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        $geography = Subject::create([
            'subject_name' => 'Geography',
            'course_code' => 'GEO-101',
            'credits' => 2,
            'description' => 'Geography',
            'department' => 'Social Science',
            'semester' => 'Semester 2',
            'academic_year' => '2024-2025',
            'status' => 'archived',
        ]);

        $computerScience = Subject::create([
            'subject_name' => 'Computer Science',
            'course_code' => 'CS-101',
            'credits' => 3,
            'description' => 'Computer Science',
            'department' => 'Science',
            'semester' => 'Semester 1',
            'academic_year' => '2025-2026',
            'status' => 'active',
        ]);

        foreach ($classList as $ci => $class) {
            $class->courses()->attach([
                $math->id,
                $khmer->id,
                ($ci % 2 === 0) ? $english->id : $physics->id,
            ]);
        }

        $teachers = [
            [
                'name' => 'Borey Kim', 'gender' => 'Male', 'dob' => '1988-06-12',
                'phone' => '017223344', 'email' => 'borey.kim@school.edu',
                'address' => 'Phnom Penh', 'position' => 'Department Head', 'department' => 'Languages',
                'salary' => 1350, 'hire_date' => '2019-08-15', 'status' => 'active',
                'subjects' => [$khmer, $english],
            ],
            [
                'name' => 'Sreymom Ly', 'gender' => 'Female', 'dob' => '1992-02-25',
                'phone' => '016554433', 'email' => 'sreymom.ly@school.edu',
                'address' => 'Phnom Penh', 'position' => 'Teacher', 'department' => 'Science',
                'salary' => 1100, 'hire_date' => '2021-10-01', 'status' => 'active',
                'subjects' => [$physics, $chemistry],
            ],
            [
                'name' => 'Vireak So', 'gender' => 'Male', 'dob' => '1990-09-08',
                'phone' => '015112233', 'email' => 'vireak.so@school.edu',
                'address' => 'Kandal', 'position' => 'Teacher', 'department' => 'Social Science',
                'salary' => 1050, 'hire_date' => '2022-03-01', 'status' => 'on_leave',
                'subjects' => [$history, $geography],
            ],
            [
                'name' => 'Chenda Heng', 'gender' => 'Female', 'dob' => '1995-11-19',
                'phone' => '098877665', 'email' => 'chenda.heng@school.edu',
                'address' => 'Phnom Penh', 'position' => 'Assistant Teacher', 'department' => 'Mathematics',
                'salary' => 950, 'hire_date' => '2023-09-01', 'status' => 'active',
                'subjects' => [$math],
            ],
            [
                'name' => 'Dara Tep', 'gender' => 'Male', 'dob' => '1987-04-30',
                'phone' => '012334455', 'email' => 'dara.tep@school.edu',
                'address' => 'Phnom Penh', 'position' => 'Teacher', 'department' => 'Science',
                'salary' => 1200, 'hire_date' => '2018-07-15', 'status' => 'inactive',
                'subjects' => [$computerScience],
            ],
            [
                'name' => 'Sreynich Ouk', 'gender' => 'Female', 'dob' => '1993-08-05',
                'phone' => '011556677', 'email' => 'sreynich.ouk@school.edu',
                'address' => 'Kandal', 'position' => 'Teacher', 'department' => 'Languages',
                'salary' => 1080, 'hire_date' => '2020-11-01', 'status' => 'active',
                'subjects' => [$khmer],
            ],
        ];

        $createdTeachers = collect([$teacher]);
        foreach ($teachers as $t) {
            $createdTeachers->push(Teacher::create([
                'name' => $t['name'],
                'gender' => $t['gender'],
                'dob' => $t['dob'],
                'phone' => $t['phone'],
                'email' => $t['email'],
                'address' => $t['address'],
                'position' => $t['position'],
                'department' => $t['department'],
                'salary' => $t['salary'],
                'hire_date' => $t['hire_date'],
                'status' => $t['status'],
            ]));
        }

        $teacher->subjects()->attach([$math->id, $khmer->id]);
        $teacher->assignedClasses()->attach(collect($classList)->pluck('id'));

        foreach ($createdTeachers->skip(1)->values() as $ti => $t) {
            $t->subjects()->attach(collect($teachers[$ti]['subjects'])->pluck('id'));
            $t->assignedClasses()->attach($classList[$ti % count($classList)]->id);
        }

        $maleNames = [
            ['Sokha', 'សុខា'], ['Dara', 'ដារា'], ['Vanna', 'វណ្ណា'], ['Visal', 'វិសាល'], ['Rithy', 'រិទ្ធី'],
            ['Sophea', 'សុភា'], ['Piseth', 'ពិសិដ្ឋ'], ['Makara', 'មករា'], ['Veasna', 'វាសនា'], ['Sopheak', 'សុភ័ក្ត្រ'],
            ['Borey', 'បុរី'], ['Chantha', 'ចន្ទា'], ['Vibol', 'វិបុល'], ['Kosal', 'កុសល'], ['Chenda', 'ចិន្តា'],
            ['Dany', 'ដានី'], ['Phirun', 'ភិរុណ'], ['Vuthy', 'វុទ្ធី'], ['Sothea', 'សុធា'], ['Ratanak', 'រតនៈ'],
            ['Mony', 'មុនី'], ['Panha', 'បញ្ញា'], ['Sovan', 'សុវណ្ណ'], ['Chetra', 'ចេត្រា'], ['Rathana', 'រតនា'],
            ['Davin', 'ដាវិន'], ['Narin', 'ណារិន'], ['Vireak', 'វិរៈ'], ['Seyha', 'សីហា'], ['Boreak', 'បូរៈ'],
            ['Sokhom', 'សុខុម'], ['Sophat', 'សុផាត'], ['Savan', 'សាវណ្ណ'], ['Socheat', 'សុជាត'], ['Sovann', 'សុវណ្ណ'],
            ['Monirath', 'មុនីរ័ត្ន'], ['Sokun', 'សុគុន'], ['Sreng', 'ស្រេង'], ['Samnang', 'សំណាង'], ['Sovichea', 'សុវិជ្ជា'],
            ['Bunnath', 'ប៊ុនណាត'], ['Sokleap', 'សុគ្លាប'], ['Sovannarith', 'សុវណ្ណរិទ្ធ'], ['Rin', 'រិន'], ['Seyha', 'សីហា'],
            ['Pheakdey', 'ភក្ដី'], ['Sokly', 'សុគ្លី'], ['Vannak', 'វណ្ណក'], ['Sopheap', 'សុភាព'], ['Monyrath', 'មុនីរ័ត្ន'],
        ];

        $femaleNames = [
            ['Sreypov', 'ស្រីពៅ'], ['Sreymom', 'ស្រីមុំ'], ['Sreyneang', 'ស្រីនាង'], ['Sopheap', 'សុភាព'], ['Davy', 'ដាវី'],
            ['Kanha', 'កញ្ញា'], ['Bopha', 'បុប្ផា'], ['Maly', 'ម៉ាលី'], ['Pich', 'ពេជ្រ'], ['Ravy', 'រ៉ាវី'],
            ['Monika', 'ម៉ូនីកា'], ['Chenda', 'ចិន្តា'], ['Sreynich', 'ស្រីនិច'], ['Nary', 'ណារី'], ['Dalin', 'ដាលីន'],
            ['Chanrith', 'ចាន់រិទ្ធ'], ['Sopheary', 'សុភារី'], ['Romduol', 'រំដួល'], ['Sovannary', 'សុវណ្ណារី'], ['Kunthea', 'គន្ធា'],
            ['Lina', 'លីណា'], ['Panhara', 'បញ្ហារា'], ['Thida', 'ធីតា'], ['Chariya', 'ចរិយា'], ['Sreymao', 'ស្រីម៉ៅ'],
            ['Nita', 'នីតា'], ['Nika', 'នីកា'], ['Chanvika', 'ចាន់វិកា'],
        ];

        $classes = $classList;
        $students = [];

        $departments = ['Science', 'Social Science', 'Languages'];
        $majors = [
            'Science' => ['Mathematics', 'Physics', 'Chemistry'],
            'Social Science' => ['History', 'Geography', 'Economics'],
            'Languages' => ['Khmer Literature', 'English', 'French'],
        ];

        $profileFields = function ($idx) use ($departments, $majors) {
            $department = $departments[$idx % 3];
            return [
                'department' => $department,
                'major' => $majors[$department][$idx % 3],
                'academic_year' => '2025-2026',
                'semester' => ($idx % 2) ? 'Semester 2' : 'Semester 1',
                'enrollment_date' => date('Y-m-d', strtotime("2025-09-01 +{$idx} days")),
                'status' => $idx % 23 === 0 ? 'suspended' : ($idx % 29 === 0 ? 'inactive' : 'active'),
            ];
        };

        $studentIndex = 0;
        foreach ($maleNames as $i => $name) {
            $class = $classes[$i % count($classes)];
            $student = Student::create([
                'name' => $name[0],
                'gender' => 'Male',
                'dob' => date('Y-m-d', strtotime("2008-01-01 +{$i} months")),
                'phone' => '011' . str_pad((string)(100000 + $i), 7, '0', STR_PAD_LEFT),
                'email' => strtolower($name[0]) . ($i + 1) . '@student.edu',
                'address' => 'Phnom Penh',
                'class_id' => $class->id,
                'parent_name' => 'Mr. ' . $name[0] . ' Sr.',
                'parent_phone' => '012' . str_pad((string)(200000 + $i), 7, '0', STR_PAD_LEFT),
                ...$profileFields($i),
            ]);
            $students[] = $student;

            if ($i < 3) {
                \App\Models\User::create([
                    'name' => $name[0],
                    'email' => 'student' . ($i + 1) . '@school.edu',
                    'password' => 'student123',
                    'role' => $i === 0 ? 'class_president' : 'student',
                    'student_id' => $student->id,
                ]);
            }
        }

        foreach ($femaleNames as $i => $name) {
            $class = $classes[($i + count($maleNames)) % count($classes)];
            $student = Student::create([
                'name' => $name[0],
                'gender' => 'Female',
                'dob' => date('Y-m-d', strtotime("2008-06-01 +{$i} months")),
                'phone' => '011' . str_pad((string)(300000 + $i), 7, '0', STR_PAD_LEFT),
                'email' => strtolower($name[0]) . ($i + 1 + count($maleNames)) . '@student.edu',
                'address' => 'Phnom Penh',
                'class_id' => $class->id,
                'parent_name' => 'Mrs. ' . $name[0] . ' Sr.',
                'parent_phone' => '012' . str_pad((string)(400000 + $i), 7, '0', STR_PAD_LEFT),
                ...$profileFields($i + count($maleNames)),
            ]);
            $students[] = $student;

            if ($i < 2) {
                \App\Models\User::create([
                    'name' => $name[0],
                    'email' => 'student' . ($i + 4) . '@school.edu',
                    'password' => 'student123',
                    'role' => 'student',
                    'student_id' => $student->id,
                ]);
            }
        }

        $days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        $rooms = ['Room 101', 'Room 102', 'Lab 1', 'Lab 2', 'Room 201', 'Room 202'];
        $startHours = [8, 10, 13, 15];
        foreach ($classes as $ci => $class) {
            $classCourses = $class->courses()->get();
            foreach ($days as $di => $day) {
                $subject = $classCourses[$di % count($classCourses)];
                $instructor = $subject->teachers()->first() ?? $teacher;
                $start = $startHours[$di % count($startHours)];
                Schedule::create([
                    'class_id' => $class->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $instructor->id,
                    'day' => $day,
                    'time_start' => sprintf('%02d:00', $start),
                    'time_end' => sprintf('%02d:00', $start + 2),
                    'room' => $rooms[($ci + $di) % count($rooms)],
                    'recurrence' => 'weekly',
                ]);
            }
        }

        foreach ($students as $si => $student) {
            if ($si % 3 === 0) continue;
            Attendance::create([
                'student_id' => $student->id,
                'schedule_id' => Schedule::inRandomOrder()->first()->id,
                'staff_id' => $staff->id,
                'date' => '2025-11-10',
                'status' => 'present',
            ]);
        }

        foreach ($students as $si => $student) {
            if ($si % 5 !== 0) continue;
            Leave::create([
                'student_id' => $student->id,
                'staff_id' => $staff->id,
                'date_from' => '2025-12-01',
                'date_to' => '2025-12-03',
                'reason' => 'Family event',
                'status' => 'approved',
            ]);
        }

        $guardianNames = [
            ['Sokha', 'Father', '012111222', 'guardian1@school.edu'],
            ['Sreymom', 'Mother', '012333444', 'guardian2@school.edu'],
        ];

        foreach ($guardianNames as $gi => [$gName, $gRelation, $gPhone, $gEmail]) {
            $guardian = \App\Models\Guardian::create([
                'name' => 'Mr. ' . $gName . ' Sr.',
                'gender' => 'Male',
                'dob' => '1980-01-01',
                'phone' => $gPhone,
                'email' => $gEmail,
                'address' => 'Phnom Penh',
                'relationship' => $gRelation,
                'emergency_contact' => $gPhone,
            ]);

            if (isset($students[$gi])) {
                $students[$gi]->update(['guardian_id' => $guardian->id]);
            }

            \App\Models\User::create([
                'name' => $guardian->name,
                'email' => 'parent' . ($gi + 1) . '@school.edu',
                'password' => 'parent123',
                'role' => 'parent',
                'guardian_id' => $guardian->id,
            ]);
        }

        // Create additional role accounts
        $principal = Teacher::create([
            'name' => 'Bopha Chan',
            'gender' => 'Female',
            'dob' => '1978-05-10',
            'phone' => '012999888',
            'email' => 'bopha.chan@school.edu',
            'address' => 'Phnom Penh',
            'position' => 'Principal',
            'department' => 'Administration',
            'salary' => 2500,
            'hire_date' => '2015-01-01',
            'status' => 'active',
        ]);

        \App\Models\User::create([
            'name' => $principal->name,
            'email' => 'principal@school.edu',
            'password' => 'principal123',
            'role' => 'principal',
            'teacher_id' => $principal->id,
        ]);

        \App\Models\User::create([
            'name' => 'Chantrea Yin',
            'email' => 'accountant@school.edu',
            'password' => 'accountant123',
            'role' => 'accountant',
        ]);

        \App\Models\User::create([
            'name' => 'Dara Kem',
            'email' => 'librarian@school.edu',
            'password' => 'librarian123',
            'role' => 'librarian',
        ]);

        \App\Models\User::create([
            'name' => 'Sokhem Touch',
            'email' => 'receptionist@school.edu',
            'password' => 'receptionist123',
            'role' => 'receptionist',
        ]);

        $this->call(DashboardDemoSeeder::class);
        $this->call(PermissionSeeder::class);
        $this->call(SettingSeeder::class);
        $this->call(ModuleDemoSeeder::class);
    }
}
