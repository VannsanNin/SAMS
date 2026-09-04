<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->restrictOnDelete();
            $table->string('academic_year', 50)->nullable();
            $table->unsignedTinyInteger('grade_level')->nullable();
            $table->date('enrollment_date')->nullable();
            $table->date('withdrawal_date')->nullable();
            $table->string('status', 20)->default('active');
            $table->string('promotion_status', 20)->default('pending');
            $table->timestamps();
            $table->unique(['student_id', 'academic_year']);
            $table->index(['class_id', 'academic_year']);
        });

        DB::table('students')->orderBy('id')->each(function ($student) {
            DB::table('student_enrollments')->insert([
                'student_id' => $student->id,
                'class_id' => $student->class_id,
                'academic_year' => $student->academic_year,
                'grade_level' => $student->grade_level,
                'enrollment_date' => $student->enrollment_date,
                'status' => $student->status ?: 'active',
                'promotion_status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
