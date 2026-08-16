<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('department')->nullable()->after('class_name');
            $table->string('semester')->nullable()->after('academic_year');
            $table->string('room')->nullable()->after('semester');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['department', 'semester', 'room']);
        });
    }
};
