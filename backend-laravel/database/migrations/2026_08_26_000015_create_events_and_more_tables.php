<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['sports', 'club', 'competition', 'field_trip', 'ceremony', 'meeting', 'holiday', 'exam', 'other']);
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('location')->nullable();
            $table->foreignId('organizer_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('target_roles')->nullable();
            $table->json('target_classes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('event_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->enum('status', ['registered', 'attended', 'cancelled'])->default('registered');
            $table->timestamps();

            $table->unique(['event_id', 'user_id']);
        });

        Schema::create('discipline_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reported_by')->constrained('users')->cascadeOnDelete();
            $table->enum('severity', ['minor', 'moderate', 'major', 'critical']);
            $table->string('incident_type');
            $table->text('description');
            $table->date('incident_date');
            $table->string('action_taken')->nullable();
            $table->text('action_details')->nullable();
            $table->foreignId('parent_notified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('parent_notified_at')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'incident_date']);
        });

        Schema::create('awards', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['academic', 'sports', 'competition', 'behavior', 'attendance', 'other']);
            $table->enum('level', ['class', 'school', 'district', 'national', 'international']);
            $table->date('date');
            $table->string('certificate_number')->nullable();
            $table->timestamps();
        });

        Schema::create('award_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('award_id')->constrained()->cascadeOnDelete();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['award_id', 'student_id']);
        });

        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type');
            $table->string('documentable_type');
            $table->unsignedBigInteger('documentable_id');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['documentable_type', 'documentable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
        Schema::dropIfExists('award_recipients');
        Schema::dropIfExists('awards');
        Schema::dropIfExists('discipline_records');
        Schema::dropIfExists('event_registrations');
        Schema::dropIfExists('events');
    }
};
