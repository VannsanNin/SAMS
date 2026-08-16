<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('student_id', 50)->nullable()->unique()->after('id');
            $table->string('department')->nullable()->after('image');
            $table->string('major')->nullable()->after('department');
            $table->string('academic_year', 50)->nullable()->after('major');
            $table->string('semester', 50)->nullable()->after('academic_year');
            $table->date('enrollment_date')->nullable()->after('semester');
            $table->string('status', 30)->default('active')->after('enrollment_date');
        });

        Schema::table('students', function (Blueprint $table) {
            $table->text('image')->nullable()->change();
        });

        $i = 1;
        foreach (DB::table('students')->whereNull('student_id')->orderBy('id')->get() as $student) {
            DB::table('students')->where('id', $student->id)->update([
                'student_id' => 'STU-' . date('Y') . '-' . str_pad((string) $i++, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropUnique('students_student_id_unique');
            $table->dropColumn([
                'student_id', 'department', 'major', 'academic_year',
                'semester', 'enrollment_date', 'status',
            ]);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
        });
    }
};
