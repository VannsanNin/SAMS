<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->unsignedTinyInteger('grade_level')->nullable()->after('class_name');
            $table->string('education_level', 30)->nullable()->after('grade_level');
            $table->index(['academic_year', 'grade_level']);
        });

        Schema::table('students', function (Blueprint $table) {
            $table->unsignedTinyInteger('grade_level')->nullable()->after('class_id');
            $table->string('education_level', 30)->nullable()->after('grade_level');
            $table->index(['academic_year', 'grade_level']);
        });

        // Backfill grade_level from classes table
        DB::statement('UPDATE students s JOIN classes c ON s.class_id = c.id SET s.grade_level = c.grade_level WHERE s.grade_level IS NULL');
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['academic_year', 'grade_level']);
            $table->dropColumn(['grade_level', 'education_level']);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->dropIndex(['academic_year', 'grade_level']);
            $table->dropColumn(['grade_level', 'education_level']);
        });
    }
};
