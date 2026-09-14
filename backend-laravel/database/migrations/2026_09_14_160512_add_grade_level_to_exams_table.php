<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->unsignedTinyInteger('grade_level')->nullable()->after('class_id');
        });

        // Backfill grade_level from classes table
        DB::statement('UPDATE exams e JOIN classes c ON e.class_id = c.id SET e.grade_level = c.grade_level WHERE e.grade_level IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropColumn('grade_level');
        });
    }
};
