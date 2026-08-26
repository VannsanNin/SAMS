<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Homework extends Model
{
    protected $fillable = [
        'title', 'description', 'subject_id', 'class_id', 'teacher_id',
        'assigned_date', 'due_date', 'total_marks', 'priority',
        'attachment_path', 'is_active',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'due_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class);
    }

    public function submissions()
    {
        return $this->hasMany(HomeworkSubmission::class);
    }
}
