<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = [
            ['Sovichea', 'សុវីជា', 'Male'],
            ['Chanviro', 'ចាន់វីរ៉ូ', 'Male'],
            ['Pisey', 'ពិសី', 'Female'],
            ['Sreyka', 'ស្រីកា', 'Female'],
            ['Nisay', 'និស្ស័យ', 'Male'],
            ['Thavy', 'ថាវី', 'Female'],
        ];

        foreach ($teachers as $i => $t) {
            $teacher = Teacher::create([
                'name' => $t[0],
                'gender' => $t[2],
                'dob' => date('Y-m-d', strtotime("1985-01-01 +{$i} years")),
                'phone' => '015' . str_pad((string)(100000 + $i), 7, '0', STR_PAD_LEFT),
                'email' => strtolower($t[0]) . '.teacher@school.edu',
                'address' => 'Phnom Penh',
                'position' => 'Teacher',
                'salary' => 1200 + ($i * 50),
                'hire_date' => date('Y-m-d', strtotime("2019-09-01 +{$i} months")),
            ]);

            User::create([
                'name' => $t[0],
                'email' => strtolower($t[0]) . '@school.edu',
                'password' => 'teacher123',
                'role' => 'teacher',
                'teacher_id' => $teacher->id,
            ]);
        }

        $this->command->info('Added ' . count($teachers) . ' teachers with login accounts');
    }
}
