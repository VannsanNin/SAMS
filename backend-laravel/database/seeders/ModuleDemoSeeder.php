<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Announcement;
use App\Models\Award;
use App\Models\AwardRecipient;
use App\Models\Building;
use App\Models\Department;
use App\Models\DisciplineRecord;
use App\Models\Event;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\GradeScale;
use App\Models\GradeScaleItem;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\LibraryBook;
use App\Models\LibraryBorrowing;
use App\Models\Message;
use App\Models\Room;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use App\Models\Semester;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class ModuleDemoSeeder extends Seeder
{
    public function run(): void
    {
        $students = Student::all();
        $teachers = \App\Models\Teacher::all();
        $classes = \App\Models\SchoolClass::all();
        $subjects = \App\Models\Subject::all();
        $admin = User::where('role', 'admin')->first();

        if ($students->isEmpty() || $classes->isEmpty()) {
            return;
        }

        // ── Academic Years ────────────────────────────────────────────────
        $year = AcademicYear::create(['name' => '2025-2026', 'start_date' => '2025-09-01', 'end_date' => '2026-06-30', 'is_current' => true]);
        $semester1 = $year->semesters()->create(['name' => 'Semester 1', 'start_date' => '2025-09-01', 'end_date' => '2026-01-31', 'is_current' => true]);
        $year->semesters()->create(['name' => 'Semester 2', 'start_date' => '2026-02-01', 'end_date' => '2026-06-30']);

        // ── Departments ───────────────────────────────────────────────────
        $mathDept = Department::create(['name' => 'Mathematics', 'code' => 'MATH', 'head_id' => $teachers->first()?->id]);
        $sciDept = Department::create(['name' => 'Science', 'code' => 'SCI']);
        $langDept = Department::create(['name' => 'Languages', 'code' => 'LANG']);
        $socDept = Department::create(['name' => 'Social Science', 'code' => 'SOC']);

        // ── Buildings & Rooms ─────────────────────────────────────────────
        $mainBuilding = Building::create(['name' => 'Main Building', 'code' => 'MB-01', 'total_floors' => 3]);
        $labBuilding = Building::create(['name' => 'Science Lab', 'code' => 'LB-01', 'total_floors' => 2]);

        Room::create(['name' => 'Room 101', 'number' => '101', 'building_id' => $mainBuilding->id, 'floor' => 1, 'type' => 'classroom', 'capacity' => 40]);
        Room::create(['name' => 'Room 102', 'number' => '102', 'building_id' => $mainBuilding->id, 'floor' => 1, 'type' => 'classroom', 'capacity' => 40]);
        Room::create(['name' => 'Lab 1', 'number' => 'L1', 'building_id' => $labBuilding->id, 'floor' => 1, 'type' => 'lab', 'capacity' => 30]);
        Room::create(['name' => 'Lab 2', 'number' => 'L2', 'building_id' => $labBuilding->id, 'floor' => 1, 'type' => 'lab', 'capacity' => 30]);
        Room::create(['name' => 'Library', 'number' => 'LIB', 'building_id' => $mainBuilding->id, 'floor' => 2, 'type' => 'library', 'capacity' => 100]);
        Room::create(['name' => 'Auditorium', 'number' => 'AUD', 'building_id' => $mainBuilding->id, 'floor' => 3, 'type' => 'hall', 'capacity' => 300]);

        // ── Grade Scale ───────────────────────────────────────────────────
        $scale = GradeScale::create(['name' => 'Standard Grading', 'is_default' => true]);
        $grades = [
            ['A+', 90, 100, 4.0], ['A', 80, 89.99, 4.0], ['B+', 75, 79.99, 3.5],
            ['B', 70, 74.99, 3.0], ['C+', 65, 69.99, 2.5], ['C', 60, 64.99, 2.0],
            ['D+', 55, 59.99, 1.5], ['D', 50, 54.99, 1.0], ['F', 0, 49.99, 0.0],
        ];
        foreach ($grades as $i => [$grade, $min, $max, $gpa]) {
            GradeScaleItem::create(['grade_scale_id' => $scale->id, 'grade' => $grade, 'min_percentage' => $min, 'max_percentage' => $max, 'gpa_point' => $gpa, 'sort_order' => $i]);
        }

        // ── Exams ─────────────────────────────────────────────────────────
        $examTypes = ['quiz', 'midterm', 'final', 'monthly'];
        $examCount = 0;
        foreach ($classes->take(4) as $class) {
            $classSubjects = $class->courses()->get();
            foreach ($classSubjects->take(3) as $subject) {
                $type = $examTypes[$examCount % count($examTypes)];
                $exam = Exam::create([
                    'name' => ucfirst($type) . ' - ' . $subject->subject_name,
                    'type' => $type,
                    'subject_id' => $subject->id,
                    'class_id' => $class->id,
                    'grade_level' => $class->grade_level ?? null,
                    'date' => now()->subDays(rand(1, 30))->toDateString(),
                    'total_marks' => 100,
                    'passing_marks' => 50,
                    'status' => 'completed',
                    'academic_year' => '2025-2026',
                    'semester' => 'Semester 1',
                ]);

                $classStudents = $students->where('class_id', $class->id);
                foreach ($classStudents as $student) {
                    ExamMark::create([
                        'exam_id' => $exam->id,
                        'student_id' => $student->id,
                        'marks_obtained' => rand(30, 98),
                        'is_absent' => rand(1, 20) === 1,
                    ]);
                }
                $examCount++;
                if ($examCount >= 12) break 2;
            }
        }

        // ── Fee Structures ────────────────────────────────────────────────
        $tuitionFee = FeeStructure::create(['name' => 'Tuition Fee', 'type' => 'tuition', 'amount' => 200, 'academic_year' => '2025-2026', 'description' => 'Semester 1 tuition']);
        $examFee = FeeStructure::create(['name' => 'Exam Fee', 'type' => 'exam', 'amount' => 30, 'academic_year' => '2025-2026']);
        $libraryFee = FeeStructure::create(['name' => 'Library Fee', 'type' => 'library', 'amount' => 15, 'academic_year' => '2025-2026']);
        $activityFee = FeeStructure::create(['name' => 'Activity Fee', 'type' => 'activity', 'amount' => 25, 'academic_year' => '2025-2026']);

        // ── Fee Invoices & Payments ───────────────────────────────────────
        foreach ($students->take(30) as $student) {
            $invoice = FeeInvoice::create([
                'student_id' => $student->id,
                'fee_structure_id' => $tuitionFee->id,
                'amount' => 200,
                'paid_amount' => rand(0, 1) ? 200 : rand(0, 150),
                'balance' => 0,
                'due_date' => now()->addDays(30)->toDateString(),
            ]);
            $invoice->balance = max(0, $invoice->amount - $invoice->paid_amount);
            $invoice->status = $invoice->balance <= 0 ? 'paid' : ($invoice->paid_amount > 0 ? 'partial' : 'pending');
            $invoice->save();

            if ($invoice->paid_amount > 0) {
                FeePayment::create([
                    'invoice_id' => $invoice->id,
                    'student_id' => $student->id,
                    'amount' => $invoice->paid_amount,
                    'payment_method' => ['cash', 'bank_transfer', 'online'][rand(0, 2)],
                    'payment_date' => now()->subDays(rand(1, 15))->toDateString(),
                    'received_by' => $admin->id,
                ]);
            }
        }

        // ── Scholarships ──────────────────────────────────────────────────
        $scholarship = Scholarship::create(['name' => 'Merit Scholarship', 'type' => 'percentage', 'value' => 25, 'academic_year' => '2025-2026', 'description' => 'For students with excellent academic performance']);
        $scholarship2 = Scholarship::create(['name' => 'Need-Based Aid', 'type' => 'fixed', 'value' => 100, 'academic_year' => '2025-2026', 'description' => 'Financial assistance for students in need']);

        foreach ($students->take(5) as $student) {
            ScholarshipApplication::create([
                'scholarship_id' => $scholarship->id,
                'student_id' => $student->id,
                'status' => 'approved',
                'approved_amount' => 50,
            ]);
        }

        // ── Library Books ─────────────────────────────────────────────────
        $books = [
            ['Mathematics Grade 7', 'MoEYS', '978-001', 'Textbook', 50],
            ['Khmer Literature', 'MoEYS', '978-002', 'Textbook', 40],
            ['English Grammar', 'Oxford', '978-003', 'Textbook', 35],
            ['Physics Fundamentals', 'Pearson', '978-004', 'Textbook', 30],
            ['World History', 'Cambridge', '978-005', 'Reference', 25],
            ['Dictionary Khmer-English', 'Local', '978-006', 'Reference', 60],
            ['Science Experiments', 'MoEYS', '978-007', 'Activity', 20],
            ['Computer Basics', 'Tech Press', '978-008', 'Textbook', 35],
        ];

        foreach ($books as [$title, $author, $isbn, $cat, $copies]) {
            LibraryBook::create(['title' => $title, 'author' => $author, 'isbn' => $isbn, 'category' => $cat, 'total_copies' => $copies, 'available_copies' => $copies - rand(0, 5), 'price' => rand(5, 25)]);
        }

        foreach ($students->take(10) as $student) {
            $book = LibraryBook::inRandomOrder()->first();
            if ($book && $book->available_copies > 0) {
                LibraryBorrowing::create([
                    'book_id' => $book->id,
                    'user_id' => User::where('student_id', $student->id)->first()?->id ?? $admin->id,
                    'borrowed_date' => now()->subDays(rand(5, 20))->toDateString(),
                    'due_date' => now()->addDays(rand(5, 14))->toDateString(),
                    'status' => rand(1, 3) === 1 ? 'returned' : 'borrowed',
                    'returned_date' => rand(1, 3) === 1 ? now()->subDays(rand(1, 5))->toDateString() : null,
                ]);
            }
        }

        // ── Homework ──────────────────────────────────────────────────────
        foreach ($classes->take(4) as $class) {
            $classSubjects = $class->courses()->get();
            $teacher = $class->teacher;
            if (! $teacher) continue;

            foreach ($classSubjects->take(2) as $subject) {
                $hw = Homework::create([
                    'title' => 'Assignment - ' . $subject->subject_name,
                    'description' => 'Complete exercises from chapter ' . rand(1, 5),
                    'subject_id' => $subject->id,
                    'class_id' => $class->id,
                    'teacher_id' => $teacher->id,
                    'assigned_date' => now()->subDays(7)->toDateString(),
                    'due_date' => now()->addDays(rand(3, 7))->toDateString(),
                    'total_marks' => 100,
                    'priority' => ['low', 'medium', 'high'][rand(0, 2)],
                ]);

                $classStudents = $students->where('class_id', $class->id)->take(5);
                foreach ($classStudents as $student) {
                    if (rand(1, 3) !== 3) {
                        HomeworkSubmission::create([
                            'homework_id' => $hw->id,
                            'student_id' => $student->id,
                            'submission_text' => 'Submitted homework for ' . $subject->subject_name,
                            'marks_obtained' => rand(60, 100),
                            'feedback' => 'Good work!',
                            'status' => 'graded',
                            'submitted_at' => now()->subHours(rand(1, 48)),
                            'graded_at' => now(),
                        ]);
                    }
                }
            }
        }

        // ── Messages ──────────────────────────────────────────────────────
        $teacher = $teachers->first();
        if ($teacher) {
            Message::create(['sender_id' => $admin->id, 'recipient_id' => User::where('role', 'teacher')->first()->id, 'subject' => 'Staff Meeting', 'body' => 'Please attend the staff meeting this Friday at 2pm.', 'is_read' => true, 'read_at' => now()->subHours(2)]);
            Message::create(['sender_id' => $admin->id, 'recipient_id' => User::where('role', 'teacher')->first()->id, 'subject' => 'Exam Schedule', 'body' => 'Midterm exams start next week. Please prepare your exam schedules.', 'is_read' => false]);
        }

        // ── Announcements ─────────────────────────────────────────────────
        Announcement::create(['title' => 'Welcome to New Academic Year', 'body' => 'We welcome all students and staff to the new academic year 2025-2026. Let us work together for excellence!', 'author_id' => $admin->id, 'priority' => 'high', 'publish_date' => now()->subDays(5)]);
        Announcement::create(['title' => 'Midterm Exam Schedule', 'body' => 'Midterm examinations will begin on the first week of November. Please review your schedules.', 'author_id' => $admin->id, 'priority' => 'normal', 'target_roles' => ['student', 'teacher'], 'publish_date' => now()->subDays(2)]);
        Announcement::create(['title' => 'School Holiday', 'body' => 'School will be closed on Monday for the Water Festival celebration.', 'author_id' => $admin->id, 'priority' => 'urgent', 'publish_date' => now(), 'expiry_date' => now()->addDays(7)]);

        // ── Events ────────────────────────────────────────────────────────
        Event::create(['title' => 'Annual Sports Day', 'description' => 'Join us for the annual sports day competition.', 'type' => 'sports', 'start_date' => now()->addDays(14)->toDateString(), 'end_date' => now()->addDays(14)->toDateString(), 'location' => 'School Field', 'organizer_id' => $admin->id]);
        Event::create(['title' => 'Science Fair', 'description' => 'Students present their science projects.', 'type' => 'competition', 'start_date' => now()->addDays(30)->toDateString(), 'location' => 'Auditorium', 'organizer_id' => $admin->id]);
        Event::create(['title' => 'Parent-Teacher Meeting', 'description' => 'Quarterly meeting with parents.', 'type' => 'meeting', 'start_date' => now()->addDays(21)->toDateString(), 'start_time' => '14:00', 'end_time' => '16:00', 'organizer_id' => $admin->id]);

        // ── Discipline Records ────────────────────────────────────────────
        $minorTypes = ['Talking in class', 'Late submission', 'Missing homework'];
        $moderateTypes = ['Disrupting class', 'Uniform violation'];
        $majorTypes = ['Fighting', 'Vandalism'];
        foreach ($students->take(8) as $student) {
            $severity = ['minor', 'minor', 'minor', 'moderate', 'moderate', 'major'][rand(0, 5)];
            if ($severity === 'minor') {
                $types = $minorTypes;
            } elseif ($severity === 'moderate') {
                $types = $moderateTypes;
            } else {
                $types = $majorTypes;
            }
            DisciplineRecord::create([
                'student_id' => $student->id,
                'reported_by' => $admin->id,
                'severity' => $severity,
                'incident_type' => $types[array_rand($types)],
                'description' => 'Student was involved in a minor disciplinary incident.',
                'incident_date' => now()->subDays(rand(1, 60))->toDateString(),
                'action_taken' => $severity === 'minor' ? 'Verbal warning' : 'Written warning',
            ]);
        }

        // ── Awards ────────────────────────────────────────────────────────
        $award1 = Award::create(['title' => 'Best Student Award', 'type' => 'academic', 'level' => 'school', 'date' => now()->subDays(30)->toDateString()]);
        foreach ($students->take(3) as $student) {
            AwardRecipient::create(['award_id' => $award1->id, 'student_id' => $student->id, 'remarks' => 'Outstanding academic performance']);
        }

        $award2 = Award::create(['title' => 'Sports Champion', 'type' => 'sports', 'level' => 'school', 'date' => now()->subDays(15)->toDateString()]);
        AwardRecipient::create(['award_id' => $award2->id, 'student_id' => $students[5]->id, 'remarks' => 'Excellence in athletics']);

        // ── Notifications ─────────────────────────────────────────────────
        foreach (User::where('is_active', true)->take(10)->get() as $user) {
            \App\Models\Notification::create([
                'user_id' => $user->id,
                'type' => 'info',
                'title' => 'System Update',
                'message' => 'Welcome to the new SAMS system. Explore all the new features!',
            ]);
        }

        echo "Demo data seeded successfully!\n";
    }
}
