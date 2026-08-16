<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('teacher_id')->nullable()->unique()->after('id');
            $table->string('department')->nullable()->after('address');
            $table->string('status')->default('active')->after('hire_date');
            $table->text('image')->nullable()->change();
        });

        DB::table('teachers')->orderBy('id')->get()->each(function ($teacher, $index) {
            DB::table('teachers')
                ->where('id', $teacher->id)
                ->update([
                    'teacher_id' => 'TEA-' . date('Y') . '-' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'status' => 'active',
                ]);
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('image')->nullable()->change();
            $table->dropColumn(['teacher_id', 'department', 'status']);
        });
    }
};
