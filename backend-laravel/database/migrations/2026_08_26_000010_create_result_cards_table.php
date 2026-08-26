<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('result_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->string('academic_year');
            $table->string('semester');
            $table->decimal('total_marks', 7, 2)->default(0);
            $table->decimal('obtained_marks', 7, 2)->default(0);
            $table->decimal('percentage', 5, 2)->default(0);
            $table->decimal('gpa', 3, 2)->default(0);
            $table->string('grade')->nullable();
            $table->integer('rank')->nullable();
            $table->string('status')->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['student_id', 'class_id', 'academic_year', 'semester']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('result_cards');
    }
};
