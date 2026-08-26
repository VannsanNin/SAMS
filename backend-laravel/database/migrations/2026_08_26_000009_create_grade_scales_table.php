<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_scales', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('academic_year')->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });

        Schema::create('grade_scale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('grade_scale_id')->constrained()->cascadeOnDelete();
            $table->string('grade');
            $table->decimal('min_percentage', 5, 2);
            $table->decimal('max_percentage', 5, 2);
            $table->decimal('gpa_point', 3, 1);
            $table->string('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['grade_scale_id', 'min_percentage', 'max_percentage'], 'gsi_range_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_scale_items');
        Schema::dropIfExists('grade_scales');
    }
};
