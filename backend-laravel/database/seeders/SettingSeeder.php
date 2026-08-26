<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // School
            ['group' => 'school', 'key' => 'school_name', 'value' => 'SAMS School', 'type' => 'string'],
            ['group' => 'school', 'key' => 'school_email', 'value' => 'info@school.edu', 'type' => 'string'],
            ['group' => 'school', 'key' => 'school_phone', 'value' => '+855 12 345 678', 'type' => 'string'],
            ['group' => 'school', 'key' => 'school_address', 'value' => 'Phnom Penh, Cambodia', 'type' => 'string'],
            ['group' => 'school', 'key' => 'school_website', 'value' => 'https://school.edu', 'type' => 'string'],
            ['group' => 'school', 'key' => 'school_logo', 'value' => null, 'type' => 'string'],

            // Academic
            ['group' => 'academic', 'key' => 'current_academic_year', 'value' => '2025-2026', 'type' => 'string'],
            ['group' => 'academic', 'key' => 'current_semester', 'value' => 'Semester 1', 'type' => 'string'],
            ['group' => 'academic', 'key' => 'grading_system', 'value' => 'letter', 'type' => 'string'],
            ['group' => 'academic', 'key' => 'passing_grade', 'value' => '50', 'type' => 'integer'],

            // Attendance
            ['group' => 'attendance', 'key' => 'auto_absent_after_minutes', 'value' => '30', 'type' => 'integer'],
            ['group' => 'attendance', 'key' => 'notify_parents_on_absence', 'value' => 'true', 'type' => 'boolean'],

            // Fees
            ['group' => 'fees', 'key' => 'currency', 'value' => 'USD', 'type' => 'string'],
            ['group' => 'fees', 'key' => 'currency_symbol', 'value' => '$', 'type' => 'string'],

            // Notifications
            ['group' => 'notifications', 'key' => 'email_enabled', 'value' => 'false', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'sms_enabled', 'value' => 'false', 'type' => 'boolean'],
            ['group' => 'notifications', 'key' => 'push_enabled', 'value' => 'false', 'type' => 'boolean'],

            // System
            ['group' => 'system', 'key' => 'timezone', 'value' => 'Asia/Phnom_Penh', 'type' => 'string'],
            ['group' => 'system', 'key' => 'language', 'value' => 'en', 'type' => 'string'],
            ['group' => 'system', 'key' => 'date_format', 'value' => 'Y-m-d', 'type' => 'string'],
            ['group' => 'system', 'key' => 'time_format', 'value' => 'H:i', 'type' => 'string'],
            ['group' => 'system', 'key' => 'session_timeout_minutes', 'value' => '120', 'type' => 'integer'],
            ['group' => 'system', 'key' => 'max_login_attempts', 'value' => '5', 'type' => 'integer'],
            ['group' => 'system', 'key' => 'backup_enabled', 'value' => 'false', 'type' => 'boolean'],
            ['group' => 'system', 'key' => 'backup_frequency', 'value' => 'daily', 'type' => 'string'],
        ];

        foreach ($settings as $setting) {
            Setting::create($setting);
        }
    }
}
