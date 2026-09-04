<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\Attendance;
use App\Models\Event;
use App\Models\Exam;
use App\Models\ExamMark;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\Leave;
use App\Models\Message;
use App\Models\Schedule;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Department;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();
        $today = $now->toDateString();

        // Admins / principals share the full analytics dashboard
        if ($user && ($user->isAdmin() || $user->isPrincipal())) {
            return $this->adminDashboard($today);
        }

        if ($user && $user->isTeacher()) {
            return $this->teacherDashboard($user, $today);
        }

        if ($user && $user->isStudent()) {
            return $this->studentDashboard($user, $today);
        }

        if ($user && $user->isParent()) {
            return $this->personalDashboard($user, $today);
        }

        // Fallback: staff-like / generic
        $weekday = $now->format('l');

        return [
            'date' => $today,
            'weekday' => $weekday,
            'counts' => $this->counts(),
            'today' => $this->todaySummary($today),
            'trend' => $this->dailyTrend($now),
            'monthly' => $this->monthlyTrend($now),
            'by_class' => $this->byClass(),
            'by_subject' => $this->bySubject(),
            'by_department' => $this->byDepartment(),
            'by_teacher' => $this->byTeacher(),
            'top' => $this->topPerformers(),
            'alerts' => $this->alerts($today, $weekday),
            'schedule' => $this->todaySchedule($weekday, $now),
            'exams_today' => [],
            'events_today' => [],
            'recent' => $this->recentRecords(),
            'reports' => $this->reports(),
        ];
    }

    // ------------------------------------------------------------------
    // Admin dashboard
    // ------------------------------------------------------------------
    private function adminDashboard(string $today): array
    {
        $now = Carbon::now();
        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        // KPIs
        $totalStudents = Student::count();
        $totalTeachers = Teacher::count();
        $totalStaff = Staff::count();
        $totalClasses = SchoolClass::count();

        $attendanceToday = Attendance::where('status', '!=', 'late')
            ->whereDate('date', $today)->count();
        $totalExpectedToday = Student::count();
        $attendanceRateToday = self::rate($attendanceToday, $totalExpectedToday);

        $feeCollectedMonth = (float) FeePayment::whereBetween('payment_date', [$monthStart, $now])->sum('amount');
        $feeTargetMonth = (float) FeeInvoice::whereYear('created_at', $now->year)->sum('amount');

        $pendingApplications = \App\Models\ScholarshipApplication::where('status', 'pending')->count();

        // Enrollment trend: count students by month for the last 12 months
        $enrollmentTrend = collect(range(11, 0))->map(function ($i) use ($now) {
            $month = $now->copy()->subMonths($i);
            $count = Student::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)->count();
            return [
                'label' => $month->format('M'),
                'enrollments' => $count,
            ];
        })->values();

        // Attendance rate trend across the last 6 weeks
        $attendanceTrend = collect(range(5, 0))->map(function ($i) use ($now) {
            $weekStart = $now->copy()->copy()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->addDays(6);
            $present = Attendance::where('status', '!=', 'late')
                ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->distinct('student_id')->count('student_id');
            $expected = Student::count();
            return [
                'label' => 'W' . (6 - $i),
                'rate' => self::rate($present, $expected),
            ];
        })->values();

        // Fee collection vs target by month
        $feeCollection = collect(range(5, 0))->map(function ($i) use ($now) {
            $month = $now->copy()->subMonths($i);
            $collected = (float) FeePayment::whereYear('payment_date', $month->year)
                ->whereMonth('payment_date', $month->month)->sum('amount');
            $invoiced = (float) FeeInvoice::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)->sum('amount');
            return [
                'label' => $month->format('M'),
                'collected' => round($collected, 2),
                'target' => round(max($invoiced, $collected), 2),
            ];
        })->values();

        // Students by class
        $studentsByClass = SchoolClass::withCount('students')->get()
            ->map(fn ($c) => ['label' => $c->class_name, 'value' => $c->students_count]);

        // Gender ratio
        $genderRatio = [
            ['label' => 'Male', 'value' => Student::where('gender', 'male')->count()],
            ['label' => 'Female', 'value' => Student::where('gender', 'female')->count()],
        ];

        // Teacher:student ratio by department
        $departments = Department::all();
        $teacherStudentByDept = $departments->map(function ($d) {
            return [
                'label' => $d->name,
                'teachers' => Teacher::where('department', $d->name)->count(),
                'students' => Student::where('department', $d->name)->count(),
            ];
        });

        // Lists
        $recentAdmissions = Student::orderBy('created_at', 'desc')->take(8)
            ->get(['id', 'name', 'student_id', 'class_id', 'created_at'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'student_id' => $s->student_id,
                'class' => $s->class?->class_name,
                'date' => $s->created_at->format('Y-m-d'),
            ]);

        $upcomingEvents = Event::where('is_active', true)
            ->whereDate('start_date', '>=', $today)
            ->orderBy('start_date')->take(6)
            ->get(['id', 'title', 'type', 'start_date', 'location'])
            ->map(fn ($e) => [
                'id' => $e->id,
                'title' => $e->title,
                'type' => $e->type,
                'date' => $e->start_date->format('Y-m-d'),
                'location' => $e->location,
            ]);

        $lowAttendance = Attendance::whereDate('date', '>=', $now->copy()->subDays(30))
            ->where('status', 'absent')
            ->groupBy('student_id')
            ->select('student_id', DB::raw('COUNT(*) as absences'))
            ->orderByDesc('absences')->take(6)
            ->with('student:id,name,class_id')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->student?->id,
                'name' => $a->student?->name,
                'class' => $a->student?->class?->class_name,
                'absences' => $a->absences,
            ]);

        $overdueFees = FeeInvoice::where('balance', '>', 0)
            ->whereDate('due_date', '<', $today)
            ->orderBy('due_date')->take(8)
            ->with('student:id,name,student_id')
            ->get()
            ->map(fn ($i) => [
                'id' => $i->id,
                'invoice' => $i->invoice_number,
                'student' => $i->student?->name,
                'student_id' => $i->student?->student_id,
                'balance' => (float) $i->balance,
                'due_date' => $i->due_date->format('Y-m-d'),
            ]);

        $staffOnLeave = Leave::where('staff_id', '!=', null)
            ->whereDate('date_from', '<=', $today)
            ->whereDate('date_to', '>=', $today)
            ->where('status', 'approved')
            ->with('staff')
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'name' => $l->staff?->name ?? 'Staff #' . $l->staff_id,
                'date_from' => $l->date_from,
                'date_to' => $l->date_to,
            ]);

        return [
            'role' => 'admin',
            'date' => $today,
            'kpis' => [
                ['label' => 'Total Students', 'value' => $totalStudents, 'icon' => 'users'],
                ['label' => 'Total Teachers', 'value' => $totalTeachers, 'icon' => 'teachers'],
                ['label' => 'Total Staff', 'value' => $totalStaff, 'icon' => 'staff'],
                ['label' => 'Classes / Sections', 'value' => $totalClasses, 'icon' => 'classes'],
                ['label' => 'Attendance Rate Today', 'value' => $attendanceRateToday, 'suffix' => '%', 'icon' => 'attendance'],
                ['label' => 'Fees Collected (Month)', 'value' => round($feeCollectedMonth, 2), 'prefix' => '$', 'icon' => 'fees'],
                ['label' => 'Fee Target (Month)', 'value' => round($feeTargetMonth, 2), 'prefix' => '$', 'icon' => 'target'],
                ['label' => 'Pending Applications', 'value' => $pendingApplications, 'icon' => 'pending'],
            ],
            'graphs' => [
                'enrollment_trend' => $enrollmentTrend,
                'attendance_trend' => $attendanceTrend,
                'fee_collection' => $feeCollection,
                'students_by_class' => $studentsByClass,
                'gender_ratio' => $genderRatio,
                'teacher_student_by_dept' => $teacherStudentByDept,
            ],
            'lists' => [
                'recent_admissions' => $recentAdmissions,
                'upcoming_events' => $upcomingEvents,
                'low_attendance' => $lowAttendance,
                'overdue_fees' => $overdueFees,
                'staff_on_leave' => $staffOnLeave,
            ],
        ];
    }

    // ------------------------------------------------------------------
    // Teacher dashboard
    // ------------------------------------------------------------------
    private function teacherDashboard(\App\Models\User $user, string $today): array
    {
        $now = Carbon::now();
        $weekday = $now->format('l');
        $teacher = $user->teacher;

        $classIds = $teacher
            ? $teacher->classes()->pluck('id')->merge($teacher->assignedClasses()->pluck('classes.id'))
            : collect();

        $studentIds = collect();
        if ($teacher) {
            $studentIds = Student::whereIn('class_id', $classIds)->pluck('id');
        }

        $classesToday = Schedule::whereIn('class_id', $classIds)
            ->where('day', $weekday)->count();

        $totalStudents = $studentIds->unique()->count();

        $pendingGrading = HomeworkSubmission::where('status', 'submitted')
            ->whereIn('homework_id', Homework::whereIn('teacher_id', [$teacher?->id])->pluck('id'))
            ->count();

        $attendanceNotSubmitted = Schedule::whereIn('class_id', $classIds)
            ->where('day', $weekday)
            ->count();

        $classIdsForSubject = $classIds;

        // Class average performance by subject (bar)
        $subjectPerformance = collect();
        if ($teacher) {
            $subjectIds = $teacher->subjects()->pluck('subjects.id')->merge(
                Subject::whereIn('id', Schedule::whereIn('class_id', $classIds)->pluck('subject_id'))->pluck('id')
            )->unique();
            $subjectPerformance = $subjectIds->map(function ($sid) {
                $avg = (float) ExamMark::whereHas('exam', fn ($q) => $q->where('subject_id', $sid))
                    ->avg('marks_obtained') ?? 0;
                return [
                    'label' => Subject::find($sid)?->subject_name ?? 'Subject ' . $sid,
                    'average' => round($avg, 2),
                ];
            })->values();
        }

        // Attendance trend for my classes (last 6 weeks)
        $attendanceTrend = collect(range(5, 0))->map(function ($i) use ($now, $studentIds) {
            $weekStart = $now->copy()->startOfWeek()->subWeeks($i);
            $weekEnd = $weekStart->copy()->addDays(6);
            $present = Attendance::where('status', '!=', 'late')
                ->whereIn('student_id', $studentIds)
                ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
                ->distinct('student_id')->count('student_id');
            return [
                'label' => 'W' . (6 - $i),
                'rate' => self::rate($present, $studentIds->unique()->count()),
            ];
        })->values();

        // Grade distribution for latest exam (histogram)
        $gradeDistribution = collect();
        $latestExam = ExamMark::whereIn('student_id', $studentIds)
            ->latest('id')->first();
        if ($latestExam) {
            $marks = ExamMark::where('exam_id', $latestExam->exam_id)->pluck('marks_obtained');
            $gradeDistribution = collect([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100])->map(function ($lo) use ($marks) {
                $hi = $lo + 10;
                $count = $marks->filter(fn ($m) => $m >= $lo && $m < $hi)->count();
                return ['label' => $lo . '-' . ($hi - 1), 'count' => $count];
            });
        }

        // Assignment submission rate (donut)
        $homeworkIds = $teacher
            ? Homework::where('teacher_id', $teacher->id)->pluck('id')
            : collect();
        $totalSubmissions = HomeworkSubmission::whereIn('homework_id', $homeworkIds)->count();
        $submittedOnTime = HomeworkSubmission::whereIn('homework_id', $homeworkIds)
            ->where('status', 'graded')->orWhere('status', 'submitted')->count();

        // Lists
        $todayTimetable = Schedule::whereIn('class_id', $classIds)
            ->where('day', $weekday)
            ->orderBy('time_start')
            ->with(['subject', 'class'])
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'class' => $s->class?->class_name,
                'subject' => $s->subject?->subject_name,
                'time_start' => $s->time_start,
                'time_end' => $s->time_end,
            ]);

        $lowPerformingStudents = collect();
        $recentSubmissions = HomeworkSubmission::whereIn('homework_id', $homeworkIds)
            ->orderByDesc('submitted_at')->take(8)
            ->with(['student:id,name', 'homework:id,title'])
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'student' => $s->student?->name,
                'homework' => $s->homework?->title,
                'status' => $s->status,
                'submitted_at' => optional($s->submitted_at)->format('Y-m-d H:i'),
            ]);

        $upcomingTests = Exam::whereIn('class_id', $classIds)
            ->whereDate('date', '>=', $today)
            ->orderBy('date')->take(6)
            ->with(['subject', 'schoolClass'])
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'subject' => $e->subject?->subject_name,
                'class' => $e->schoolClass?->class_name,
                'date' => $e->date->format('Y-m-d'),
            ]);

        $lowPerformingStudents = collect();
        $recentMarks = ExamMark::whereIn('student_id', $studentIds)->get();
        if ($recentMarks->count()) {
            $bestExamPerStudent = $recentMarks->groupBy('student_id')->map(function ($marks) {
                return $marks->sortByDesc('marks_obtained')->first();
            });
            $lowPerformingStudents = ExamMark::whereIn('id', $bestExamPerStudent->pluck('id'))
                ->with(['student:id,name,class_id'])
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->student?->id,
                    'name' => $m->student?->name,
                    'class' => $m->student?->class?->class_name,
                    'marks' => (float) $m->marks_obtained,
                ])
                ->sortBy('marks')->take(6)->values();
        }

        $messages = Message::where('recipient_id', $user->id)
            ->orderByDesc('created_at')->take(6)->get();

        return [
            'role' => 'teacher',
            'date' => $today,
            'kpis' => [
                ['label' => 'My Classes Today', 'value' => $classesToday, 'icon' => 'classes'],
                ['label' => 'Students Supervised', 'value' => $totalStudents, 'icon' => 'users'],
                ['label' => 'Assignments to Grade', 'value' => $pendingGrading, 'icon' => 'grading'],
                ['label' => 'Attendance Not Submitted', 'value' => $attendanceNotSubmitted, 'icon' => 'attendance'],
            ],
            'graphs' => [
                'subject_performance' => $subjectPerformance,
                'attendance_trend' => $attendanceTrend,
                'grade_distribution' => $gradeDistribution,
                'submission_rate' => [
                    ['label' => 'Submitted', 'value' => $submittedOnTime],
                    ['label' => 'Pending', 'value' => max(0, $totalSubmissions - $submittedOnTime)],
                ],
            ],
            'lists' => [
                'today_timetable' => $todayTimetable,
                'low_performing' => $lowPerformingStudents,
                'recent_submissions' => $recentSubmissions,
                'upcoming_tests' => $upcomingTests,
                'messages' => $messages->map(fn ($m) => [
                    'id' => $m->id,
                    'subject' => $m->subject,
                    'body' => $m->body,
                    'date' => $m->created_at->format('Y-m-d H:i'),
                    'is_read' => (bool) $m->is_read,
                ]),
            ],
        ];
    }

    // ------------------------------------------------------------------
    // Student dashboard
    // ------------------------------------------------------------------
    private function studentDashboard(\App\Models\User $user, string $today): array
    {
        $now = Carbon::now();
        $weekday = $now->format('l');
        $student = $user->student;

        // KPIs
        $attendance = collect();
        $present = 0;
        $attendanceRate = 0;
        if ($student) {
            $days = Attendance::where('student_id', $student->id)->get();
            $present = $days->where('status', 'present')->count();
            $late = $days->where('status', 'late')->count();
            $absent = $days->where('status', 'absent')->count();
            $attendanceRate = self::rate($present + $late, $days->count());
            $attendance = [
                ['label' => 'Present', 'value' => $present],
                ['label' => 'Late', 'value' => $late],
                ['label' => 'Absent', 'value' => $absent],
            ];
        }

        $examMarks = $student
            ? ExamMark::with('exam.subject')->where('student_id', $student->id)->get()
            : collect();
        $overallAverage = $examMarks->count()
            ? round((float) $examMarks->avg('marks_obtained'), 2)
            : 0;

        $pendingAssignments = $student
            ? Homework::whereIn('class_id', [$student->class_id])
                ->where('due_date', '>=', $today)
                ->whereDoesntHave('submissions', fn ($q) => $q->where('student_id', $student->id))
                ->count()
            : 0;

        $feeDue = 0;
        if ($student) {
            $feeDue = (float) FeeInvoice::where('student_id', $student->id)
                ->where('balance', '>', 0)->sum('balance');
        }

        // Graphs
        $gradeTrend = $examMarks->groupBy(fn ($m) => optional($m->exam?->date)->format('Y-m'))->map(function ($group, $period) {
            return ['label' => $period, 'average' => round((float) $group->avg('marks_obtained'), 2)];
        })->values()->take(8);

        $subjectWise = collect();
        if ($student) {
            $subjectWise = $examMarks->filter(fn ($m) => $m->exam && $m->exam->subject)
                ->groupBy(fn ($m) => $m->exam->subject_id)
                ->map(function ($group, $subjectId) {
                    $subject = Subject::find($subjectId);
                    return [
                        'label' => $subject?->subject_name ?? 'Subject ' . $subjectId,
                        'score' => round((float) $group->avg('marks_obtained'), 2),
                    ];
                })->values();
        }

        // Lists
        $todayTimetable = $student
            ? Schedule::where('class_id', $student->class_id)->where('day', $weekday)
                ->orderBy('time_start')->with('subject')
                ->get()->map(fn ($s) => [
                    'id' => $s->id,
                    'subject' => $s->subject?->subject_name,
                    'time_start' => $s->time_start,
                    'time_end' => $s->time_end,
                ])
            : collect();

        $upcomingAssignments = $student
            ? Homework::where('class_id', $student->class_id)
                ->where('due_date', '>=', $today)->orderBy('due_date')->take(6)
                ->with('subject')->get()
                ->map(fn ($h) => [
                    'id' => $h->id,
                    'title' => $h->title,
                    'subject' => $h->subject?->subject_name,
                    'due_date' => $h->due_date->format('Y-m-d'),
                    'status' => $h->submissions()->where('student_id', $student->id)->exists() ? 'submitted' : 'pending',
                ])
            : collect();

        $upcomingExams = $student
            ? Exam::where('class_id', $student->class_id)
                ->whereDate('date', '>=', $today)->orderBy('date')->take(6)
                ->with('subject')->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'name' => $e->name,
                    'subject' => $e->subject?->subject_name,
                    'date' => $e->date->format('Y-m-d'),
                ])
            : collect();

        $recentGrades = $examMarks->sortByDesc(fn ($m) => $m->updated_at)->take(6)
            ->map(fn ($m) => [
                'id' => $m->id,
                'subject' => $m->exam?->subject?->subject_name ?? 'Exam',
                'marks' => (float) $m->marks_obtained,
                'date' => optional($m->exam?->date)->format('Y-m-d') ?? '—',
            ])->values();

        $announcements = Announcement::where('is_published', true)
            ->whereDate('publish_date', '<=', $today)
            ->orderByDesc('publish_date')->take(5)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'title' => $a->title,
                'body' => $a->body,
                'date' => $a->publish_date->format('Y-m-d'),
            ]);

        return [
            'role' => 'student',
            'date' => $today,
            'kpis' => [
                ['label' => 'Attendance %', 'value' => $attendanceRate, 'suffix' => '%', 'icon' => 'attendance'],
                ['label' => 'Overall Average', 'value' => $overallAverage, 'icon' => 'average'],
                ['label' => 'Pending Assignments', 'value' => $pendingAssignments, 'icon' => 'assignments'],
                ['label' => 'Fee Due', 'value' => round($feeDue, 2), 'prefix' => '$', 'icon' => 'fees'],
            ],
            'graphs' => [
                'grade_trend' => $gradeTrend,
                'subject_wise' => $subjectWise,
                'attendance_breakdown' => $attendance,
            ],
            'lists' => [
                'today_timetable' => $todayTimetable,
                'upcoming_assignments' => $upcomingAssignments,
                'upcoming_exams' => $upcomingExams,
                'recent_grades' => $recentGrades,
                'announcements' => $announcements,
            ],
        ];
    }

    private function personalDashboard(\App\Models\User $user, string $today): array
    {
        $students = collect();

        if ($user->isParent()) {
            $students = $user->guardian
                ? $user->guardian->students()->with('class')->orderBy('name')->get()
                : collect();
        } elseif ($user->student) {
            $students = collect([$user->student->load('class')]);
        }

        $studentIds = $students->pluck('id')->all();

        $children = $students->map(function ($student) use ($today) {
            return [
                'id' => $student->id,
                'name' => $student->name,
                'student_code' => $student->student_id,
                'class' => $student->class?->class_name,
                'stats' => $this->studentStat($student->id),
                'today' => Attendance::where('student_id', $student->id)
                    ->whereDate('date', $today)
                    ->with('schedule.subject')
                    ->orderBy('schedule_id')
                    ->get()
                    ->map(fn ($a) => [
                        'id' => $a->id,
                        'subject' => $a->schedule?->subject?->subject_name,
                        'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                        'status' => $a->status,
                    ]),
            ];
        })->values()->all();

        return [
            'view' => $user->isParent() ? 'parent' : 'student',
            'date' => $today,
            'children' => $children,
            'recent' => $this->recentRecordsFor($studentIds),
        ];
    }

    private function studentStat(int $studentId): array
    {
        $row = DB::table('attendances as a')
            ->where('a.student_id', $studentId)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->first();

        $total = (int) $row->total;

        return [
            'total' => $total,
            'present' => (int) $row->present,
            'absent' => (int) $row->absent,
            'late' => (int) $row->late,
            'excused' => (int) $row->excused,
            'attendance_rate' => self::rate((int) $row->present + (int) $row->late, $total),
        ];
    }

    private function recentRecordsFor(array $studentIds): array
    {
        if (empty($studentIds)) {
            return [];
        }

        return Attendance::with('student.class', 'schedule.subject')
            ->whereIn('student_id', $studentIds)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(15)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'student' => $a->student?->name,
                'class' => $a->student?->class?->class_name,
                'subject' => $a->schedule?->subject?->subject_name,
                'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                'date' => $a->date,
                'status' => $a->status,
            ])
            ->all();
    }

    private function counts(): array
    {
        return [
            'students' => Student::count(),
            'teachers' => Teacher::count(),
            'classes' => SchoolClass::count(),
            'subjects' => Subject::count(),
            'staff' => Staff::count(),
            'schedules' => Schedule::count(),
            'leaves' => Leave::count(),
            'departments' => Student::whereNotNull('department')
                ->where('department', '!=', '')
                ->distinct('department')
                ->count(),
        ];
    }

    private function todaySummary(string $today): array
    {
        $rows = Attendance::whereDate('date', $today)
            ->selectRaw('status, COUNT(*) as c')
            ->groupBy('status')
            ->pluck('c', 'status');

        $summary = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
        foreach ($rows as $status => $count) {
            if (isset($summary[$status])) {
                $summary[$status] = (int) $count;
            }
        }
        $summary['total'] = array_sum($summary);
        $summary['attendance_rate'] = self::rate(
            $summary['present'] + $summary['late'],
            $summary['total']
        );

        return $summary;
    }

    private function dailyTrend(Carbon $now): array
    {
        $from = $now->copy()->subDays(29)->toDateString();
        $rows = Attendance::whereDate('date', '>=', $from)
            ->selectRaw('date, status, COUNT(*) as c')
            ->groupBy('date', 'status')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->date][$row->status] = (int) $row->c;
        }

        $trend = [];
        $day = $now->copy()->subDays(29);
        for ($i = 0; $i < 30; $i++) {
            $key = $day->toDateString();
            $row = $map[$key] ?? [];
            $present = $row['present'] ?? 0;
            $absent = $row['absent'] ?? 0;
            $late = $row['late'] ?? 0;
            $excused = $row['excused'] ?? 0;
            $total = $present + $absent + $late + $excused;

            $trend[] = [
                'date' => $key,
                'label' => $day->format('M j'),
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'total' => $total,
                'attendance_rate' => self::rate($present + $late, $total),
            ];
            $day->addDay();
        }

        return $trend;
    }

    private function monthlyTrend(Carbon $now): array
    {
        $from = $now->copy()->subMonths(5)->startOfMonth()->toDateString();
        $rows = Attendance::whereDate('date', '>=', $from)
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, status, COUNT(*) as c")
            ->groupBy('month', 'status')
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[$row->month][$row->status] = (int) $row->c;
        }

        $monthly = [];
        $month = $now->copy()->startOfMonth()->subMonths(5);
        for ($i = 0; $i < 6; $i++) {
            $key = $month->format('Y-m');
            $row = $map[$key] ?? [];
            $present = $row['present'] ?? 0;
            $absent = $row['absent'] ?? 0;
            $late = $row['late'] ?? 0;
            $excused = $row['excused'] ?? 0;
            $total = $present + $absent + $late + $excused;

            $monthly[] = [
                'month' => $key,
                'label' => $month->format('M'),
                'present' => $present,
                'absent' => $absent,
                'late' => $late,
                'excused' => $excused,
                'total' => $total,
                'attendance_rate' => self::rate($present + $late, $total),
            ];
            $month->addMonth();
        }

        return $monthly;
    }

    private function byClass(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->join('classes as c', 'c.id', '=', 's.class_id')
            ->select('c.id', 'c.class_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('c.id', 'c.class_name')
            ->orderBy('c.class_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function bySubject(): array
    {
        return DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('subjects as su', 'su.id', '=', 'sc.subject_id')
            ->select('su.id', 'su.subject_name as name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('su.id', 'su.subject_name')
            ->orderBy('su.subject_name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function byTeacher(): array
    {
        return DB::table('attendances as a')
            ->join('schedules as sc', 'sc.id', '=', 'a.schedule_id')
            ->join('teachers as t', 't.id', '=', 'sc.teacher_id')
            ->select('t.id', 't.name')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('t.id', 't.name')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function byDepartment(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->selectRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned') as name")
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "present") as present')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupByRaw("COALESCE(NULLIF(s.department, ''), 'Unassigned')")
            ->orderBy('name')
            ->get()
            ->map(fn ($r) => $this->decorate($r))
            ->all();
    }

    private function topPerformers(): array
    {
        $classes = $this->byClass();
        $departments = $this->byDepartment();
        $teachers = $this->byTeacher();

        $studentStats = $this->studentStats();

        $best = function (array $list): ?array {
            $scored = array_filter($list, fn ($r) => $r['total'] > 0);
            if (empty($scored)) {
                return null;
            }
            usort($scored, fn ($a, $b) => $b['attendance_rate'] <=> $a['attendance_rate']);

            return $scored[0];
        };

        $perfect = collect($studentStats)
            ->filter(fn ($s) => $s['total'] > 0 && $s['absent'] === 0 && $s['attendance_rate'] == 100)
            ->sortByDesc('total')
            ->take(10)
            ->map(fn ($s) => [
                'id' => $s['id'],
                'name' => $s['name'],
                'class' => $s['class'],
                'total' => $s['total'],
                'attendance_rate' => $s['attendance_rate'],
            ])
            ->values()
            ->all();

        return [
            'best_class' => $best($classes),
            'best_department' => $best($departments),
            'perfect_students' => $perfect,
            'top_teachers' => array_slice($teachers, 0, 5),
        ];
    }

    private function studentStats(): array
    {
        return DB::table('attendances as a')
            ->join('students as s', 's.id', '=', 'a.student_id')
            ->leftJoin('classes as c', 'c.id', '=', 's.class_id')
            ->select('s.id', 's.name', 'c.class_name as class')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(a.status = "absent") as absent')
            ->selectRaw('SUM(a.status = "late") as late')
            ->selectRaw('SUM(a.status = "excused") as excused')
            ->groupBy('s.id', 's.name', 'c.class_name')
            ->get()
            ->map(function ($r) {
                $total = (int) $r->total;
                $present = $total - (int) $r->absent - (int) $r->late - (int) $r->excused;

                return [
                    'id' => (int) $r->id,
                    'name' => $r->name,
                    'class' => $r->class,
                    'total' => $total,
                    'present' => $present,
                    'absent' => (int) $r->absent,
                    'late' => (int) $r->late,
                    'excused' => (int) $r->excused,
                    'attendance_rate' => self::rate($present + (int) $r->late, $total),
                ];
            })
            ->all();
    }

    private function alerts(string $today, string $weekday): array
    {
        $studentStats = $this->studentStats();
        $statsByStudent = collect($studentStats)->keyBy('id');

        return [
            'consecutive_absent' => $this->consecutiveAbsentStudents(),
            'below_75' => collect($studentStats)
                ->filter(fn ($s) => $s['total'] > 0 && $s['attendance_rate'] < 75)
                ->sortBy('attendance_rate')
                ->take(10)
                ->values()
                ->all(),
            'teachers_no_submission' => $this->teachersWithoutSubmission($today, $weekday),
            'holidays' => [],
        ];
    }

    private function consecutiveAbsentStudents(): array
    {
        $absences = Attendance::where('status', 'absent')
            ->orderBy('student_id')
            ->orderBy('date')
            ->get(['student_id', 'date']);

        $result = [];
        foreach ($absences->groupBy('student_id') as $studentId => $rows) {
            $dates = $rows->pluck('date')->unique()->values()->sort()->values();
            if ($dates->count() < 3) {
                continue;
            }

            $run = 1;
            $maxRun = 0;
            $maxEnd = null;
            for ($i = 1; $i < $dates->count(); $i++) {
                $prev = Carbon::parse($dates[$i - 1]);
                $next = Carbon::parse($dates[$i]);
                if ($this->isNextSchoolDay($prev, $next)) {
                    $run++;
                } else {
                    $run = 1;
                }
                if ($run > $maxRun) {
                    $maxRun = $run;
                    $maxEnd = $i;
                }
            }
            if ($maxRun >= 3) {
                $student = Student::with('class')->find($studentId);
                $result[] = [
                    'student_id' => $studentId,
                    'name' => $student?->name,
                    'class' => $student?->class?->class_name,
                    'days' => $maxRun,
                    'since' => $dates[$maxEnd - $maxRun + 1],
                    'last_date' => $dates[$maxEnd],
                ];
            }
        }

        return $result;
    }

    private function teachersWithoutSubmission(string $today, string $weekday): array
    {
        $schedulesToday = Schedule::where('day', $weekday)
            ->with('teacher')
            ->get();

        $recorded = Attendance::whereDate('date', $today)
            ->pluck('schedule_id')
            ->unique()
            ->flip();

        $pending = [];
        foreach ($schedulesToday as $schedule) {
            if (isset($recorded[$schedule->id]) || ! $schedule->teacher) {
                continue;
            }
            $key = $schedule->teacher->id;
            if (! isset($pending[$key])) {
                $pending[$key] = [
                    'id' => $schedule->teacher->id,
                    'name' => $schedule->teacher->name,
                    'pending_schedules' => 0,
                ];
            }
            $pending[$key]['pending_schedules']++;
        }

        return array_values($pending);
    }

    private function todaySchedule(string $weekday, Carbon $now): array
    {
        $recorded = Attendance::whereDate('date', $now->toDateString())
            ->pluck('schedule_id')
            ->unique()
            ->flip();

        return Schedule::where('day', $weekday)
            ->with('class', 'subject', 'teacher')
            ->orderBy('time_start')
            ->get()
            ->map(function ($schedule) use ($now, $recorded) {
                $start = Carbon::parse($schedule->time_start);
                $end = Carbon::parse($schedule->time_end);

                $status = 'upcoming';
                if ($now->gte($start) && $now->lte($end)) {
                    $status = 'current';
                } elseif ($now->gt($end)) {
                    $status = 'past';
                }

                return [
                    'id' => $schedule->id,
                    'day' => $schedule->day,
                    'time_start' => substr((string) $schedule->time_start, 0, 5),
                    'time_end' => substr((string) $schedule->time_end, 0, 5),
                    'class' => $schedule->class?->class_name,
                    'subject' => $schedule->subject?->subject_name,
                    'teacher' => $schedule->teacher?->name,
                    'status' => $status,
                    'recorded' => isset($recorded[$schedule->id]),
                ];
            })
            ->all();
    }

    private function recentRecords(): array
    {
        return Attendance::with('student.class', 'schedule.subject')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(10)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'student' => $a->student?->name,
                'class' => $a->student?->class?->class_name,
                'subject' => $a->schedule?->subject?->subject_name,
                'time' => substr((string) ($a->schedule?->time_start ?? ''), 0, 5),
                'date' => $a->date,
                'status' => $a->status,
            ])
            ->all();
    }

    private function reports(): array
    {
        $now = Carbon::now();
        $periods = [
            'weekly' => [$now->copy()->subDays(6)->toDateString(), $now->toDateString()],
            'monthly' => [$now->copy()->subDays(29)->toDateString(), $now->toDateString()],
            'yearly' => [$now->copy()->startOfYear()->toDateString(), $now->toDateString()],
        ];

        $rows = Attendance::whereDate('date', '>=', $now->copy()->startOfYear()->toDateString())
            ->selectRaw('date, status, COUNT(*) as c')
            ->groupBy('date', 'status')
            ->get()
            ->groupBy('date');

        $reports = [];
        foreach ($periods as $key => [$from, $to]) {
            $counts = ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0];
            foreach ($rows as $date => $dayRows) {
                if ($date < $from || $date > $to) {
                    continue;
                }
                foreach ($dayRows as $row) {
                    if (isset($counts[$row->status])) {
                        $counts[$row->status] += (int) $row->c;
                    }
                }
            }
            $total = array_sum($counts);
            $reports[$key] = $counts + [
                'total' => $total,
                'attendance_rate' => self::rate($counts['present'] + $counts['late'], $total),
            ];
        }

        $reports['department_comparison'] = $this->byDepartment();

        return $reports;
    }

    private function decorate(object|array $row): array
    {
        $row = (object) $row;
        $total = (int) $row->total;
        $present = (int) $row->present;
        $absent = (int) $row->absent;
        $late = (int) $row->late;
        $excused = (int) $row->excused;

        return [
            'id' => $row->id ?? null,
            'name' => $row->name,
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => $excused,
            'attendance_rate' => self::rate($present + $late, $total),
        ];
    }

    private static function rate(int $attended, int $total): float
    {
        return $total > 0 ? round($attended * 100 / $total, 1) : 0.0;
    }

    private function isNextSchoolDay(Carbon $prev, Carbon $next): bool
    {
        $cursor = $prev->copy()->addDay();
        while ($cursor->isWeekend()) {
            $cursor->addDay();
        }

        return $cursor->equalTo($next);
    }
}
