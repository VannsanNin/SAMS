<?php

use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\GuardianController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TeacherController;
use App\Models\SchoolClass;
use Illuminate\Support\Facades\Route;

Route::model('class', SchoolClass::class);

Route::post('login', [AuthController::class, 'login'])->name('login')->middleware('throttle:10,1');
Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('reset-password', [AuthController::class, 'resetPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('me', [AuthController::class, 'me']);
    Route::post('change-password', [AuthController::class, 'changePassword']);
    Route::get('dashboard', [DashboardController::class, 'index']);

    // Any authenticated user may request their own attendance report.
    Route::get('reports/attendance/student', [ReportController::class, 'student']);

    // Any authenticated user (student, parent, teacher, admin) may submit a leave request.
    Route::post('leaves', [LeaveController::class, 'store']);

    // Any authenticated user may view leave requests (scoped to their own).
    Route::get('leaves/filters', [LeaveController::class, 'filters']);
    Route::get('leaves', [LeaveController::class, 'index']);
    Route::get('leaves/{leave}', [LeaveController::class, 'show']);

    // ---- Admin only -------------------------------------------------------
    Route::middleware('role:admin')->group(function () {
        Route::get('teachers/filters', [TeacherController::class, 'filters']);
        Route::get('teachers/export', [TeacherController::class, 'export']);
        Route::post('teachers/import', [TeacherController::class, 'import']);
        Route::apiResource('teachers', TeacherController::class);

        Route::get('staff/filters', [StaffController::class, 'filters']);
        Route::get('staff/export', [StaffController::class, 'export']);
        Route::post('staff/import', [StaffController::class, 'import']);
        Route::apiResource('staff', StaffController::class);

        Route::get('parents/filters', [GuardianController::class, 'filters']);
        Route::get('parents/export', [GuardianController::class, 'export']);
        Route::apiResource('parents', GuardianController::class);

        // Student mutations
        Route::post('students/import', [StudentController::class, 'import']);
        Route::post('students', [StudentController::class, 'store']);
        Route::put('students/{student}', [StudentController::class, 'update']);
        Route::patch('students/{student}', [StudentController::class, 'update']);
        Route::delete('students/{student}', [StudentController::class, 'destroy']);

        // Subject mutations
        Route::post('subjects/import', [SubjectController::class, 'import']);
        Route::post('subjects', [SubjectController::class, 'store']);
        Route::put('subjects/{subject}', [SubjectController::class, 'update']);
        Route::patch('subjects/{subject}', [SubjectController::class, 'update']);
        Route::delete('subjects/{subject}', [SubjectController::class, 'destroy']);

        // Class mutations
        Route::post('classes/import', [SchoolClassController::class, 'import']);
        Route::post('classes', [SchoolClassController::class, 'store']);
        Route::put('classes/{class}', [SchoolClassController::class, 'update']);
        Route::patch('classes/{class}', [SchoolClassController::class, 'update']);
        Route::delete('classes/{class}', [SchoolClassController::class, 'destroy']);

        // Schedule mutations
        Route::post('schedules', [ScheduleController::class, 'store']);
        Route::put('schedules/{schedule}', [ScheduleController::class, 'update']);
        Route::patch('schedules/{schedule}', [ScheduleController::class, 'update']);
        Route::delete('schedules/{schedule}', [ScheduleController::class, 'destroy']);

        // Leave mutations
        Route::put('leaves/{leave}', [LeaveController::class, 'update']);
        Route::patch('leaves/{leave}', [LeaveController::class, 'update']);
        Route::delete('leaves/{leave}', [LeaveController::class, 'destroy']);
    });

    // ---- Admin + Teacher --------------------------------------------------
    Route::middleware('role:admin,teacher')->group(function () {
        Route::get('students/filters', [StudentController::class, 'filters']);
        Route::get('students/export', [StudentController::class, 'export']);
        Route::get('students', [StudentController::class, 'index']);
        Route::get('students/{student}', [StudentController::class, 'show']);

        Route::get('subjects/filters', [SubjectController::class, 'filters']);
        Route::get('subjects/export', [SubjectController::class, 'export']);
        Route::get('subjects', [SubjectController::class, 'index']);
        Route::get('subjects/{subject}', [SubjectController::class, 'show']);

        Route::get('classes/filters', [SchoolClassController::class, 'filters']);
        Route::get('classes/export', [SchoolClassController::class, 'export']);
        Route::get('classes', [SchoolClassController::class, 'index']);
        Route::get('classes/{class}', [SchoolClassController::class, 'show']);

        Route::get('schedules/filters', [ScheduleController::class, 'filters']);
        Route::get('schedules/conflicts', [ScheduleController::class, 'conflicts']);
        Route::get('schedules/export', [ScheduleController::class, 'export']);
        Route::get('schedules', [ScheduleController::class, 'index']);
        Route::get('schedules/{schedule}', [ScheduleController::class, 'show']);

        Route::get('attendances/filters', [AttendanceController::class, 'filters']);
        Route::get('attendances/export', [AttendanceController::class, 'export']);
        Route::get('attendances', [AttendanceController::class, 'index']);
        Route::get('attendances/{attendance}', [AttendanceController::class, 'show']);

        // Teachers may take/edit attendance only for their own schedules.
        Route::post('attendances', [AttendanceController::class, 'store']);
        Route::put('attendances/{attendance}', [AttendanceController::class, 'update']);
        Route::patch('attendances/{attendance}', [AttendanceController::class, 'update']);
        Route::delete('attendances/{attendance}', [AttendanceController::class, 'destroy']);
        Route::post('attendances/bulk', [AttendanceController::class, 'bulkStore']);

        Route::get('leaves/export', [LeaveController::class, 'export']);
        Route::post('leaves/{leave}/approve', [LeaveController::class, 'approve']);
        Route::post('leaves/{leave}/reject', [LeaveController::class, 'reject']);

        Route::get('reports/attendance', [ReportController::class, 'attendance']);
        Route::get('reports/attendance/filters', [ReportController::class, 'filters']);
        Route::get('reports/attendance/warnings', [ReportController::class, 'warnings']);
    });
});
