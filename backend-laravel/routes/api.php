<?php

use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExamController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\FeeController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\HomeworkController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\LibraryController;
use App\Http\Controllers\Api\LoginHistoryController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SchoolController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Http\Controllers\Api\UserController;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\Route;

Route::model('class', SchoolClass::class);

// ─── Public Routes ────────────────────────────────────────────────────────────
Route::post('login', [AuthController::class, 'login'])->name('login')->middleware('throttle:10,1');
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Profile & Auth ────────────────────────────────────────────────────────
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);

    // ── 2FA ──────────────────────────────────────────────────────────────────
    Route::post('2fa/enable', [AuthController::class, 'enable2FA']);
    Route::post('2fa/confirm', [AuthController::class, 'confirm2FA']);
    Route::post('2fa/disable', [AuthController::class, 'disable2FA']);

    // ── Login History & Sessions ─────────────────────────────────────────────
    Route::get('login-history', [AuthController::class, 'loginHistory']);
    Route::get('sessions', [AuthController::class, 'sessions']);
    Route::post('sessions/revoke-all', [AuthController::class, 'revokeAllSessions']);

    // ── Notifications ────────────────────────────────────────────────────────
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('notifications/{notification}', [NotificationController::class, 'destroy']);

    // ── Dashboard ────────────────────────────────────────────────────────────
    Route::get('dashboard', [DashboardController::class, 'index']);

    // ── Activity Logs (own) ─────────────────────────────────────────────────
    Route::get('activity-logs/my', [ActivityLogController::class, 'myLogs']);

    // ── Attendance Report (any authenticated user) ──────────────────────────
    Route::get('reports/attendance/student', [ReportController::class, 'student']);

    // ── Student-specific Exam/Grade routes ─────────────────────────────────
    Route::get('my/grades', [GradeController::class, 'studentGrades']);
    Route::get('exams/{exam}/my-marks', [ExamController::class, 'studentMarks']);

    // ── Student-specific Fee routes ───────────────────────────────────────
    Route::get('my/fees', [FeeController::class, 'studentFeeStatus']);

    // ── Homework (student submit) ────────────────────────────────────────
    Route::post('homework/{homework}/submit', [HomeworkController::class, 'submitHomework']);

    // ── Library (browse) ────────────────────────────────────────────────
    Route::get('library/books', [LibraryController::class, 'index']);
    Route::get('library/books/{book}', [LibraryController::class, 'show']);

    // ── Messages ───────────────────────────────────────────────────────
    Route::get('messages', [MessageController::class, 'index']);
    Route::get('messages/sent', [MessageController::class, 'sent']);
    Route::post('messages', [MessageController::class, 'store']);
    Route::get('messages/{message}', [MessageController::class, 'show']);
    Route::delete('messages/{message}', [MessageController::class, 'destroy']);
    Route::get('messages/unread-count', [MessageController::class, 'unreadCount']);

    // ── Announcements (anyone can view) ────────────────────────────────
    Route::get('announcements', [MessageController::class, 'announcements']);

    // ── Events (anyone can view/register) ──────────────────────────────
    Route::get('events', [EventController::class, 'index']);
    Route::get('events/{event}', [EventController::class, 'show']);
    Route::post('events/{event}/register', [EventController::class, 'register']);

    // ── Leave (any authenticated user can submit/view own) ──────────────────
    Route::post('leaves', [LeaveController::class, 'store']);
    Route::get('leaves/filters', [LeaveController::class, 'filters']);
    Route::get('leaves', [LeaveController::class, 'index']);
    Route::get('leaves/{leave}', [LeaveController::class, 'show']);

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN ONLY
    // ═══════════════════════════════════════════════════════════════════════════
    Route::middleware('role:admin,principal')->group(function () {

        // ── User Management ─────────────────────────────────────────────────
        Route::get('users', [UserController::class, 'index']);
        Route::post('users', [UserController::class, 'store']);
        Route::get('users/{user}', [UserController::class, 'show']);
        Route::put('users/{user}', [UserController::class, 'update']);
        Route::patch('users/{user}', [UserController::class, 'update']);
        Route::delete('users/{user}', [UserController::class, 'destroy']);
        Route::post('users/{user}/activate', [UserController::class, 'activate']);
        Route::post('users/{user}/deactivate', [UserController::class, 'deactivate']);
        Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);

        // ── Permissions ─────────────────────────────────────────────────────
        Route::get('permissions', [PermissionController::class, 'index']);
        Route::get('permissions/by-group', [PermissionController::class, 'byGroup']);
        Route::post('permissions', [PermissionController::class, 'store']);
        Route::delete('permissions/{permission}', [PermissionController::class, 'destroy']);
        Route::post('permissions/assign', [PermissionController::class, 'assignToRole']);
        Route::get('permissions/role/{role}', [PermissionController::class, 'getRolePermissions']);

        // ── Settings ────────────────────────────────────────────────────────
        Route::get('settings', [SettingController::class, 'index']);
        Route::get('settings/{group}', [SettingController::class, 'byGroup']);
        Route::put('settings', [SettingController::class, 'update']);
        Route::delete('settings/{setting}', [SettingController::class, 'destroy']);

        // ── Login History ───────────────────────────────────────────────────
        Route::get('login-history/all', [LoginHistoryController::class, 'index']);
        Route::get('login-history/stats', [LoginHistoryController::class, 'stats']);
        Route::get('login-history/user/{userId}', [LoginHistoryController::class, 'userHistory']);

        // ── Activity Logs ───────────────────────────────────────────────────
        Route::get('activity-logs', [ActivityLogController::class, 'index']);
        Route::get('activity-logs/recent', [ActivityLogController::class, 'recent']);
        Route::get('activity-logs/actions', [ActivityLogController::class, 'actions']);

        // ── Notifications (broadcast) ───────────────────────────────────────
        Route::post('notifications/broadcast', [NotificationController::class, 'broadcast']);

        // ── Teachers ────────────────────────────────────────────────────────
        Route::get('teachers/filters', [TeacherController::class, 'filters']);
        Route::get('teachers/export', [TeacherController::class, 'export']);
        Route::post('teachers/import', [TeacherController::class, 'import']);
        Route::apiResource('teachers', TeacherController::class);

        // ── Staff ───────────────────────────────────────────────────────────
        Route::get('staff/filters', [StaffController::class, 'filters']);
        Route::get('staff/export', [StaffController::class, 'export']);
        Route::post('staff/import', [StaffController::class, 'import']);
        Route::apiResource('staff', StaffController::class);

        // ── Parents ─────────────────────────────────────────────────────────
        Route::get('parents/filters', [GuardianController::class, 'filters']);
        Route::get('parents/export', [GuardianController::class, 'export']);
        Route::apiResource('parents', GuardianController::class);

        // ── Students (mutations) ────────────────────────────────────────────
        Route::post('students/import', [StudentController::class, 'import']);
        Route::post('students', [StudentController::class, 'store']);
        Route::put('students/{student}', [StudentController::class, 'update']);
        Route::patch('students/{student}', [StudentController::class, 'update']);
        Route::delete('students/{student}', [StudentController::class, 'destroy']);

        // ── Subjects (mutations) ────────────────────────────────────────────
        Route::post('subjects/import', [SubjectController::class, 'import']);
        Route::post('subjects', [SubjectController::class, 'store']);
        Route::put('subjects/{subject}', [SubjectController::class, 'update']);
        Route::patch('subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('subjects/{subject}', [SubjectController::class, 'destroy']);

        // ── Classes (mutations) ─────────────────────────────────────────────
        Route::post('classes/import', [SchoolClassController::class, 'import']);
        Route::post('classes', [SchoolClassController::class, 'store']);
        Route::put('classes/{class}', [SchoolClassController::class, 'update']);
        Route::patch('classes/{class}', [SchoolClassController::class, 'update']);
        Route::delete('classes/{class}', [SchoolClassController::class, 'destroy']);

        // ── Schedules (mutations) ───────────────────────────────────────────
        Route::post('schedules', [ScheduleController::class, 'store']);
        Route::put('schedules/{schedule}', [ScheduleController::class, 'update']);
        Route::patch('schedules/{schedule}', [ScheduleController::class, 'update']);
        Route::delete('schedules/{schedule}', [ScheduleController::class, 'destroy']);

        // ── Leave (mutations) ───────────────────────────────────────────────
        Route::put('leaves/{leave}', [LeaveController::class, 'update']);
        Route::patch('leaves/{leave}', [LeaveController::class, 'update']);
        Route::delete('leaves/{leave}', [LeaveController::class, 'destroy']);

        // ── Exams (mutations) ─────────────────────────────────────────────
        Route::post('exams', [ExamController::class, 'store']);
        Route::put('exams/{exam}', [ExamController::class, 'update']);
        Route::patch('exams/{exam}', [ExamController::class, 'update']);
        Route::delete('exams/{exam}', [ExamController::class, 'destroy']);

        // ── Grade Scales ─────────────────────────────────────────────────
        Route::get('grade-scales', [GradeController::class, 'gradeScales']);
        Route::post('grade-scales', [GradeController::class, 'storeGradeScale']);

        // ── Fees ─────────────────────────────────────────────────────────
        Route::get('fees/structures', [FeeController::class, 'feeStructures']);
        Route::post('fees/structures', [FeeController::class, 'storeFeeStructure']);
        Route::put('fees/structures/{feeStructure}', [FeeController::class, 'updateFeeStructure']);
        Route::delete('fees/structures/{feeStructure}', [FeeController::class, 'deleteFeeStructure']);
        Route::get('fees/invoices', [FeeController::class, 'invoices']);
        Route::post('fees/invoices', [FeeController::class, 'storeInvoice']);
        Route::post('fees/invoices/bulk', [FeeController::class, 'bulkGenerateInvoices']);
        Route::get('fees/payments', [FeeController::class, 'payments']);
        Route::post('fees/payments', [FeeController::class, 'storePayment']);
        Route::get('fees/scholarships', [FeeController::class, 'scholarships']);
        Route::post('fees/scholarships', [FeeController::class, 'storeScholarship']);
        Route::get('fees/scholarships/{scholarship}/applications', [FeeController::class, 'scholarshipApplications']);
        Route::post('fees/scholarships/{scholarship}/apply', [FeeController::class, 'applyScholarship']);
        Route::put('fees/scholarship-applications/{application}', [FeeController::class, 'reviewScholarshipApplication']);
        Route::get('fees/reports/collection', [FeeController::class, 'feeCollectionReport']);

        // ── Library ─────────────────────────────────────────────────────
        Route::post('library/books', [LibraryController::class, 'store']);
        Route::put('library/books/{book}', [LibraryController::class, 'update']);
        Route::delete('library/books/{book}', [LibraryController::class, 'destroy']);
        Route::get('library/borrowings', [LibraryController::class, 'borrowings']);
        Route::post('library/borrow', [LibraryController::class, 'borrowBook']);
        Route::post('library/return/{borrowing}', [LibraryController::class, 'returnBook']);
        Route::get('library/overdue', [LibraryController::class, 'overdueBooks']);
        Route::get('library/stats', [LibraryController::class, 'stats']);

        // ── Homework ────────────────────────────────────────────────────
        Route::get('homework', [HomeworkController::class, 'index']);
        Route::post('homework', [HomeworkController::class, 'store']);
        Route::get('homework/{homework}', [HomeworkController::class, 'show']);
        Route::put('homework/{homework}', [HomeworkController::class, 'update']);
        Route::delete('homework/{homework}', [HomeworkController::class, 'destroy']);
        Route::get('homework/{homework}/submissions', [HomeworkController::class, 'submissions']);
        Route::post('homework/submissions/{submission}/grade', [HomeworkController::class, 'gradeSubmission']);
        Route::get('homework/stats', [HomeworkController::class, 'homeworkStats']);

        // ── Events ──────────────────────────────────────────────────────
        Route::post('events', [EventController::class, 'store']);
        Route::put('events/{event}', [EventController::class, 'update']);
        Route::delete('events/{event}', [EventController::class, 'destroy']);

        // ── Discipline ──────────────────────────────────────────────────
        Route::get('discipline', [EventController::class, 'disciplineRecords']);
        Route::post('discipline', [EventController::class, 'storeDisciplineRecord']);

        // ── Awards ──────────────────────────────────────────────────────
        Route::get('awards', [EventController::class, 'awards']);
        Route::post('awards', [EventController::class, 'storeAward']);

        // ── Documents ───────────────────────────────────────────────────
        Route::get('documents', [EventController::class, 'documents']);
        Route::post('documents', [EventController::class, 'storeDocument']);
        Route::delete('documents/{document}', [EventController::class, 'destroyDocument']);

        // ── Announcements (admin create) ────────────────────────────────
        Route::post('announcements', [MessageController::class, 'storeAnnouncement']);

        // ── School Management ───────────────────────────────────────────
        Route::get('school/academic-years', [SchoolController::class, 'academicYears']);
        Route::post('school/academic-years', [SchoolController::class, 'storeAcademicYear']);
        Route::get('school/academic-years/{academicYear}/semesters', [SchoolController::class, 'semesters']);
        Route::post('school/academic-years/{academicYear}/semesters', [SchoolController::class, 'storeSemester']);
        Route::get('school/departments', [SchoolController::class, 'departments']);
        Route::post('school/departments', [SchoolController::class, 'storeDepartment']);
        Route::put('school/departments/{department}', [SchoolController::class, 'updateDepartment']);
        Route::get('school/buildings', [SchoolController::class, 'buildings']);
        Route::post('school/buildings', [SchoolController::class, 'storeBuilding']);
        Route::get('school/rooms', [SchoolController::class, 'rooms']);
        Route::post('school/rooms', [SchoolController::class, 'storeRoom']);

        // ── Payroll ─────────────────────────────────────────────────────
        Route::get('payroll', [SchoolController::class, 'payroll']);
        Route::post('payroll', [SchoolController::class, 'storePayroll']);
        Route::get('payroll/reports', [SchoolController::class, 'payrollReport']);
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN + TEACHER
    // ═══════════════════════════════════════════════════════════════════════════
    Route::middleware('role:admin,teacher,principal')->group(function () {

        // ── Students (read) ─────────────────────────────────────────────────
        Route::get('students/filters', [StudentController::class, 'filters']);
        Route::get('students/export', [StudentController::class, 'export']);
        Route::get('students', [StudentController::class, 'index']);
        Route::get('students/{student}', [StudentController::class, 'show']);

        // ── Subjects (read) ─────────────────────────────────────────────────
        Route::get('subjects/filters', [SubjectController::class, 'filters']);
        Route::get('subjects/export', [SubjectController::class, 'export']);
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::get('subjects/{subject}', [SubjectController::class, 'show']);

        // ── Classes (read) ──────────────────────────────────────────────────
        Route::get('classes/filters', [SchoolClassController::class, 'filters']);
        Route::get('classes/export', [SchoolClassController::class, 'export']);
        Route::get('classes', [SchoolClassController::class, 'index']);
        Route::get('classes/{class}', [SchoolClassController::class, 'show']);

        // ── Schedules (read) ────────────────────────────────────────────────
        Route::get('schedules/filters', [ScheduleController::class, 'filters']);
        Route::get('schedules/conflicts', [ScheduleController::class, 'conflicts']);
        Route::get('schedules/export', [ScheduleController::class, 'export']);
        Route::get('schedules', [ScheduleController::class, 'index']);
        Route::get('schedules/{schedule}', [ScheduleController::class, 'show']);

        // ── Attendances ─────────────────────────────────────────────────────
        Route::get('attendances/filters', [AttendanceController::class, 'filters']);
        Route::get('attendances/export', [AttendanceController::class, 'export']);
        Route::get('attendances', [AttendanceController::class, 'index']);
        Route::get('attendances/{attendance}', [AttendanceController::class, 'show']);
        Route::post('attendances', [AttendanceController::class, 'store']);
        Route::put('attendances/{attendance}', [AttendanceController::class, 'update']);
        Route::patch('attendances/{attendance}', [AttendanceController::class, 'update']);
        Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy']);
        Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore']);

        // ── Leave (approve/reject) ──────────────────────────────────────────
        Route::get('leaves/export', [LeaveController::class, 'export']);
        Route::post('leaves/{leave}/approve', [LeaveController::class, 'approve']);
        Route::post('leaves/{leave}/reject', [LeaveController::class, 'reject']);

        // ── Exams (read + marks) ─────────────────────────────────────────
        Route::get('exams', [ExamController::class, 'index']);
        Route::get('exams/{exam}', [ExamController::class, 'show']);
        Route::get('exams/{exam}/marks', [ExamController::class, 'marks']);
        Route::post('exams/{exam}/marks', [ExamController::class, 'storeMarks']);
        Route::get('exams/{exam}/results', [ExamController::class, 'classResults']);

        // ── Grades ────────────────────────────────────────────────────────
        Route::get('grades/class/{classId}', [GradeController::class, 'classGrades']);
        Route::get('grades/rankings/{classId}', [GradeController::class, 'classRankings']);
        Route::post('grades/report-card', [GradeController::class, 'generateReportCard']);
        Route::get('result-cards', [GradeController::class, 'resultCards']);

        // ── Reports ─────────────────────────────────────────────────────────
        Route::get('reports/attendance', [ReportController::class, 'attendance']);
        Route::get('reports/attendance/filters', [ReportController::class, 'filters']);
        Route::get('reports/attendance/warnings', [ReportController::class, 'warnings']);
    });
});
