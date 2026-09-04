<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = [
        'class_name', 'grade_level', 'education_level', 'teacher_id', 'academic_year',
        'department', 'semester', 'room',
    ];

    public function setID($id)
    {
        $this->id = $id;
        return $this;
    }

    public function getID()
    {
        return $this->id;
    }

    public function setClassName($name)
    {
        $this->class_name = $name;
        return $this;
    }

    public function getClassName()
    {
        return $this->class_name;
    }

    public function setTeacherID($id)
    {
        $this->teacher_id = $id;
        return $this;
    }

    public function getTeacherID()
    {
        return $this->teacher_id;
    }

    public function setAcademicYear($year)
    {
        $this->academic_year = $year;
        return $this;
    }

    public function getAcademicYear()
    {
        return $this->academic_year;
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class, 'class_id');
    }

    public function courses()
    {
        return $this->belongsToMany(Subject::class, 'class_subject', 'class_id', 'subject_id');
    }
}
