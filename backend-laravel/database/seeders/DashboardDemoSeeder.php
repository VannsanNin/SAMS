<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Schedule;
use App\Models\Staff;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DashboardDemoSeeder extends Seeder
{
    public function run(): void
    {
        $today = Carbon::today();
        $start = Carbon::today()->subDays(29);

        Attendance::whereDate('date', '>=', $start->toDateString())->delete();

        $staff = Staff::firstOrFail();
        $students = Student::with('class')->orderBy('id')->get();
        $classStudents = $students->groupBy('class_id');
        $schedulesByDay = Schedule::with('class')->get()->groupBy('day');

        $dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

        mt_srand(20260804);

        $perfect = $students->take(10);
        $perfectIds = $perfect->pluck('id')->flip();

        $troubled = collect([5, 20, 35, 50, 65])
            ->map(fn ($i) => $students->get($i))
            ->filter();
        $troubledIds = $troubled->pluck('id')->flip();

        $consecutive = collect([7, 42])
            ->map(fn ($i) => $students->get($i))
            ->filter();
        $lastSchoolDays = [];
        $cursor = $today->copy();
        while (count($lastSchoolDays) < 4) {
            if (! $cursor->isWeekend()) {
                array_unshift($lastSchoolDays, $cursor->toDateString());
            }
            $cursor->subDay();
        }

        $records = [];
        $date = $start->copy();

        while ($date->lte($today)) {
            $schedules = $schedulesByDay[$date->format('l')] ?? collect();

            foreach ($schedules as $schedule) {
                // Leave one class un-recorded today so the "teachers haven't
                // submitted attendance" alert has something to show.
                if ($date->equalTo($today) && $schedule->class->class_name === '11-A') {
                    continue;
                }

                foreach ($classStudents[$schedule->class_id] ?? collect() as $student) {
                    $status = $this->pickStatus(
                        $student,
                        $date->toDateString(),
                        $perfectIds,
                        $troubledIds,
                        $consecutive,
                        $lastSchoolDays
                    );

                    $records[] = [
                        'student_id' => $student->id,
                        'schedule_id' => $schedule->id,
                        'staff_id' => $staff->id,
                        'date' => $date->toDateString(),
                        'status' => $status,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }

            $date->addDay();
        }

        foreach (array_chunk($records, 500) as $chunk) {
            DB::table('attendances')->insert($chunk);
        }

        $this->command->info('Seeded ' . count($records) . ' demo attendance records (last 30 days).');
    }

    private function pickStatus(
        $student,
        string $date,
        $perfectIds,
        $troubledIds,
        $consecutive,
        array $lastSchoolDays
    ): string {
        if ($consecutive->pluck('id')->contains($student->id)
            && in_array($date, $lastSchoolDays, true)) {
            return 'absent';
        }

        if (isset($perfectIds[$student->id])) {
            return 'present';
        }

        if (isset($troubledIds[$student->id])) {
            $roll = mt_rand(1, 100);

            return $roll <= 35 ? 'absent' : ($roll <= 45 ? 'late' : 'present');
        }

        $roll = mt_rand(1, 100);

        return match (true) {
            $roll <= 86 => 'present',
            $roll <= 93 => 'late',
            $roll <= 98 => 'absent',
            default => 'excused',
        };
    }
}
