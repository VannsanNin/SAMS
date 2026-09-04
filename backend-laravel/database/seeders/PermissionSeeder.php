<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Dashboard
            ['name' => 'dashboard.view', 'group' => 'dashboard', 'description' => 'View dashboard'],
            ['name' => 'dashboard.view_all', 'group' => 'dashboard', 'description' => 'View all dashboard data'],

            // Students
            ['name' => 'students.view', 'group' => 'students', 'description' => 'View students'],
            ['name' => 'students.create', 'group' => 'students', 'description' => 'Create students'],
            ['name' => 'students.update', 'group' => 'students', 'description' => 'Update students'],
            ['name' => 'students.delete', 'group' => 'students', 'description' => 'Delete students'],
            ['name' => 'students.import', 'group' => 'students', 'description' => 'Import students'],
            ['name' => 'students.export', 'group' => 'students', 'description' => 'Export students'],

            // Teachers
            ['name' => 'teachers.view', 'group' => 'teachers', 'description' => 'View teachers'],
            ['name' => 'teachers.create', 'group' => 'teachers', 'description' => 'Create teachers'],
            ['name' => 'teachers.update', 'group' => 'teachers', 'description' => 'Update teachers'],
            ['name' => 'teachers.delete', 'group' => 'teachers', 'description' => 'Delete teachers'],
            ['name' => 'teachers.import', 'group' => 'teachers', 'description' => 'Import teachers'],
            ['name' => 'teachers.export', 'group' => 'teachers', 'description' => 'Export teachers'],

            // Staff
            ['name' => 'staff.view', 'group' => 'staff', 'description' => 'View staff'],
            ['name' => 'staff.create', 'group' => 'staff', 'description' => 'Create staff'],
            ['name' => 'staff.update', 'group' => 'staff', 'description' => 'Update staff'],
            ['name' => 'staff.delete', 'group' => 'staff', 'description' => 'Delete staff'],

            // Parents
            ['name' => 'parents.view', 'group' => 'parents', 'description' => 'View parents'],
            ['name' => 'parents.create', 'group' => 'parents', 'description' => 'Create parents'],
            ['name' => 'parents.update', 'group' => 'parents', 'description' => 'Update parents'],
            ['name' => 'parents.delete', 'group' => 'parents', 'description' => 'Delete parents'],

            // Classes
            ['name' => 'classes.view', 'group' => 'classes', 'description' => 'View classes'],
            ['name' => 'classes.create', 'group' => 'classes', 'description' => 'Create classes'],
            ['name' => 'classes.update', 'group' => 'classes', 'description' => 'Update classes'],
            ['name' => 'classes.delete', 'group' => 'classes', 'description' => 'Delete classes'],

            // Subjects
            ['name' => 'subjects.view', 'group' => 'subjects', 'description' => 'View subjects'],
            ['name' => 'subjects.create', 'group' => 'subjects', 'description' => 'Create subjects'],
            ['name' => 'subjects.update', 'group' => 'subjects', 'description' => 'Update subjects'],
            ['name' => 'subjects.delete', 'group' => 'subjects', 'description' => 'Delete subjects'],

            // Schedules
            ['name' => 'schedules.view', 'group' => 'schedules', 'description' => 'View schedules'],
            ['name' => 'schedules.create', 'group' => 'schedules', 'description' => 'Create schedules'],
            ['name' => 'schedules.update', 'group' => 'schedules', 'description' => 'Update schedules'],
            ['name' => 'schedules.delete', 'group' => 'schedules', 'description' => 'Delete schedules'],

            // Attendance
            ['name' => 'attendance.view', 'group' => 'attendance', 'description' => 'View attendance'],
            ['name' => 'attendance.mark', 'group' => 'attendance', 'description' => 'Mark attendance'],
            ['name' => 'attendance.update', 'group' => 'attendance', 'description' => 'Update attendance'],
            ['name' => 'attendance.delete', 'group' => 'attendance', 'description' => 'Delete attendance'],
            ['name' => 'attendance.bulk', 'group' => 'attendance', 'description' => 'Bulk mark attendance'],

            // Exams
            ['name' => 'exams.view', 'group' => 'exams', 'description' => 'View exams'],
            ['name' => 'exams.create', 'group' => 'exams', 'description' => 'Create exams'],
            ['name' => 'exams.update', 'group' => 'exams', 'description' => 'Update exams'],
            ['name' => 'exams.delete', 'group' => 'exams', 'description' => 'Delete exams'],

            // Grades
            ['name' => 'grades.view', 'group' => 'grades', 'description' => 'View grades'],
            ['name' => 'grades.enter', 'group' => 'grades', 'description' => 'Enter grades'],
            ['name' => 'grades.update', 'group' => 'grades', 'description' => 'Update grades'],
            ['name' => 'grades.publish', 'group' => 'grades', 'description' => 'Publish grades'],

            // Fees
            ['name' => 'fees.view', 'group' => 'fees', 'description' => 'View fees'],
            ['name' => 'fees.create', 'group' => 'fees', 'description' => 'Create fees'],
            ['name' => 'fees.collect', 'group' => 'fees', 'description' => 'Collect fees'],
            ['name' => 'fees.reports', 'group' => 'fees', 'description' => 'View fee reports'],
            ['name' => 'fees.scholarships', 'group' => 'fees', 'description' => 'Manage scholarships'],

            // Library
            ['name' => 'library.view', 'group' => 'library', 'description' => 'View library'],
            ['name' => 'library.manage_books', 'group' => 'library', 'description' => 'Manage books'],
            ['name' => 'library.borrow', 'group' => 'library', 'description' => 'Borrow/return books'],
            ['name' => 'library.fines', 'group' => 'library', 'description' => 'Manage fines'],

            // Homework
            ['name' => 'homework.view', 'group' => 'homework', 'description' => 'View homework'],
            ['name' => 'homework.create', 'group' => 'homework', 'description' => 'Create homework'],
            ['name' => 'homework.grade', 'group' => 'homework', 'description' => 'Grade homework'],

            // Reports
            ['name' => 'reports.view', 'group' => 'reports', 'description' => 'View reports'],
            ['name' => 'reports.generate', 'group' => 'reports', 'description' => 'Generate reports'],
            ['name' => 'reports.export', 'group' => 'reports', 'description' => 'Export reports'],

            // Notifications
            ['name' => 'notifications.send', 'group' => 'notifications', 'description' => 'Send notifications'],
            ['name' => 'notifications.broadcast', 'group' => 'notifications', 'description' => 'Broadcast notifications'],

            // Settings
            ['name' => 'settings.view', 'group' => 'settings', 'description' => 'View settings'],
            ['name' => 'settings.update', 'group' => 'settings', 'description' => 'Update settings'],

            // Users
            ['name' => 'users.view', 'group' => 'users', 'description' => 'View users'],
            ['name' => 'users.create', 'group' => 'users', 'description' => 'Create users'],
            ['name' => 'users.update', 'group' => 'users', 'description' => 'Update users'],
            ['name' => 'users.delete', 'group' => 'users', 'description' => 'Delete users'],
            ['name' => 'users.activate', 'group' => 'users', 'description' => 'Activate/deactivate users'],

            // Leave
            ['name' => 'leave.view', 'group' => 'leave', 'description' => 'View leave requests'],
            ['name' => 'leave.approve', 'group' => 'leave', 'description' => 'Approve/reject leave'],

            // Payroll
            ['name' => 'payroll.view', 'group' => 'payroll', 'description' => 'View payroll'],
            ['name' => 'payroll.manage', 'group' => 'payroll', 'description' => 'Manage payroll'],

            // Events
            ['name' => 'events.view', 'group' => 'events', 'description' => 'View events'],
            ['name' => 'events.create', 'group' => 'events', 'description' => 'Create events'],

            // Documents
            ['name' => 'documents.view', 'group' => 'documents', 'description' => 'View documents'],
            ['name' => 'documents.upload', 'group' => 'documents', 'description' => 'Upload documents'],
            ['name' => 'documents.delete', 'group' => 'documents', 'description' => 'Delete documents'],

            // Discipline
            ['name' => 'discipline.view', 'group' => 'discipline', 'description' => 'View discipline records'],
            ['name' => 'discipline.create', 'group' => 'discipline', 'description' => 'Create discipline records'],

            // Transport
            ['name' => 'transport.view', 'group' => 'transport', 'description' => 'View transport'],
            ['name' => 'transport.manage', 'group' => 'transport', 'description' => 'Manage transport'],

            // Health
            ['name' => 'health.view', 'group' => 'health', 'description' => 'View health records'],
            ['name' => 'health.manage', 'group' => 'health', 'description' => 'Manage health records'],

            // Cafeteria
            ['name' => 'cafeteria.view', 'group' => 'cafeteria', 'description' => 'View cafeteria'],
            ['name' => 'cafeteria.manage', 'group' => 'cafeteria', 'description' => 'Manage cafeteria'],

            // ID Cards
            ['name' => 'idcards.generate', 'group' => 'idcards', 'description' => 'Generate ID cards'],
            ['name' => 'idcards.print', 'group' => 'idcards', 'description' => 'Print ID cards'],

            // Graduation
            ['name' => 'graduation.view', 'group' => 'graduation', 'description' => 'View graduation'],
            ['name' => 'graduation.manage', 'group' => 'graduation', 'description' => 'Manage graduation'],
        ];

        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }
        DB::table('role_permissions')->delete();
        DB::table('permissions')->delete();
        if (DB::connection()->getDriverName() === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        foreach ($permissions as $permission) {
            Permission::create($permission);
        }

        // Assign default permissions to roles
        $this->assignDefaultPermissions();
    }

    private function assignDefaultPermissions(): void
    {
        $adminPermissions = Permission::pluck('id')->toArray();
        $this->assignRole('admin', $adminPermissions);

        $principalPermissions = Permission::whereNotIn('group', ['users', 'settings'])->pluck('id')->toArray();
        $this->assignRole('principal', $principalPermissions);

        $teacherPermissions = Permission::whereIn('group', [
            'dashboard', 'students', 'classes', 'subjects', 'schedules',
            'attendance', 'exams', 'grades', 'homework', 'leave', 'reports',
        ])->pluck('id')->toArray();
        $this->assignRole('teacher', $teacherPermissions);

        $studentPermissions = Permission::whereIn('name', [
            'dashboard.view', 'students.view', 'subjects.view', 'classes.view',
            'schedules.view', 'attendance.view', 'exams.view', 'grades.view',
            'homework.view', 'leave.view', 'library.view', 'reports.view',
        ])->pluck('id')->toArray();
        $this->assignRole('student', $studentPermissions);
        $this->assignRole('class_president', $studentPermissions);

        $parentPermissions = Permission::whereIn('name', [
            'dashboard.view', 'students.view', 'subjects.view', 'classes.view',
            'schedules.view', 'attendance.view', 'exams.view', 'grades.view',
            'homework.view', 'fees.view', 'leave.view', 'reports.view',
        ])->pluck('id')->toArray();
        $this->assignRole('parent', $parentPermissions);

        $accountantPermissions = Permission::whereIn('group', [
            'dashboard', 'fees', 'reports',
        ])->pluck('id')->toArray();
        $this->assignRole('accountant', $accountantPermissions);

        $librarianPermissions = Permission::whereIn('group', [
            'dashboard', 'library', 'students',
        ])->pluck('id')->toArray();
        $this->assignRole('librarian', $librarianPermissions);

        $receptionistPermissions = Permission::whereIn('group', [
            'dashboard', 'students', 'parents', 'teachers', 'leave',
        ])->pluck('id')->toArray();
        $this->assignRole('receptionist', $receptionistPermissions);

        $staffPermissions = Permission::whereIn('name', [
            'dashboard.view', 'students.view', 'attendance.view', 'leave.view',
        ])->pluck('id')->toArray();
        $this->assignRole('staff', $staffPermissions);
    }

    private function assignRole(string $role, array $permissionIds): void
    {
        foreach ($permissionIds as $permissionId) {
            DB::table('role_permissions')->insert([
                'role' => $role,
                'permission_id' => $permissionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
