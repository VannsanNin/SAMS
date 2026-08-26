<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('role');
            $table->boolean('two_factor_enabled')->default(false)->after('is_active');
            $table->string('two_factor_secret')->nullable()->after('two_factor_enabled');
            $table->string('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('last_login_at')->nullable()->after('two_factor_recovery_codes');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            $table->string('login_pin')->nullable()->after('last_login_ip');
            $table->timestamp('pin_changed_at')->nullable()->after('login_pin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_active', 'two_factor_enabled', 'two_factor_secret',
                'two_factor_recovery_codes', 'last_login_at', 'last_login_ip',
                'login_pin', 'pin_changed_at',
            ]);
        });
    }
};
