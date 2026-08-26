<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HomeworkSubmission extends Model
{
    protected $fillable = [
        'homework_id', 'student_id', 'submission_text', 'attachment_path',
        'marks_obtained', 'feedback', 'status', 'submitted_at', 'graded_at',
    ];

    protected $casts = [
        'marks_obtained' => 'decimal:2',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function homework()
    {
        return $this->belongsTo(Homework::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}
