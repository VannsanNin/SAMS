<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('course_code')->nullable()->unique()->after('id');
            $table->integer('credits')->default(3)->after('subject_name');
            $table->string('department')->nullable()->after('description');
            $table->string('semester')->nullable()->after('department');
            $table->string('academic_year')->nullable()->after('semester');
            $table->string('status')->default('active')->after('academic_year');
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn(['course_code', 'credits', 'department', 'semester', 'academic_year', 'status']);
        });
    }
};
