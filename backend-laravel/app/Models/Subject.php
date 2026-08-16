<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $table = 'subjects';

    protected $fillable = [
        'subject_name', 'description',
        'course_code', 'credits', 'department', 'semester', 'academic_year', 'status',
    ];

    protected static function booted()
    {
        static::creating(function (Subject $subject) {
            if (empty($subject->course_code)) {
                $year = now()->format('Y');
                $count = static::whereYear('created_at', $year)->count();
                $subject->course_code = 'CRS-' . $year . '-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
            }
            if (empty($subject->status)) {
                $subject->status = 'active';
            }
        });
    }

    public function setID($id)
    {
        $this->id = $id;
        return $this;
    }

    public function getID()
    {
        return $this->id;
    }

    public function setSubjectName($name)
    {
        $this->subject_name = $name;
        return $this;
    }

    public function getSubjectName()
    {
        return $this->subject_name;
    }

    public function setDescription($description)
    {
        $this->description = $description;
        return $this;
    }

    public function getDescription()
    {
        return $this->description;
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function teachers()
    {
        return $this->belongsToMany(Teacher::class, 'teacher_subject', 'subject_id', 'teacher_id');
    }
}
