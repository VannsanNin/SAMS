<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('gender');
            $table->date('dob');
            $table->string('phone');
            $table->string('email')->unique();
            $table->text('address');
            $table->foreignId('class_id')->constrained()->onDelete('cascade');
            $table->string('parent_name');
            $table->string('parent_phone');
            $table->string('image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
