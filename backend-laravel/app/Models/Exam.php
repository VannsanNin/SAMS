<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    protected $fillable = [
        'name', 'type', 'subject_id', 'class_id', 'grade_level', 'date',
        'time_start', 'time_end', 'total_marks', 'passing_marks',
        'room', 'description', 'status', 'academic_year', 'semester',
    ];

    protected $casts = [
        'date' => 'date',
        'total_marks' => 'integer',
        'passing_marks' => 'integer',
    ];

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function marks()
    {
        return $this->hasMany(ExamMark::class);
    }

    public function publishedMarks()
    {
        return $this->hasMany(ExamMark::class)->where('is_absent', false);
    }
}
