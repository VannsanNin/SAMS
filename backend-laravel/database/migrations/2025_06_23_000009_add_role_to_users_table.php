<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('student')->after('password');
            $table->foreignId('student_id')->nullable()->constrained()->nullOnDelete()->after('role');
            $table->foreignId('teacher_id')->nullable()->constrained()->nullOnDelete()->after('student_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['student_id']);
            $table->dropForeign(['teacher_id']);
            $table->dropColumn(['role', 'student_id', 'teacher_id']);
        });
    }
};
