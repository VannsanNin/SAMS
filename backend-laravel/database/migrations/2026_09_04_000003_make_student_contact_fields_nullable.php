<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('phone')->nullable()->change();
            $table->string('email')->nullable()->change();
            $table->text('address')->nullable()->change();
            $table->string('parent_name')->nullable()->change();
            $table->string('parent_phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Existing NULL values must be resolved by the operator before rollback.
        Schema::table('students', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
            $table->string('email')->nullable(false)->change();
            $table->text('address')->nullable(false)->change();
            $table->string('parent_name')->nullable(false)->change();
            $table->string('parent_phone')->nullable(false)->change();
        });
    }
};
