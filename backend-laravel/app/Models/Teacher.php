<?php

namespace App\Models;

use App\Models\Base\Person;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Teacher extends Person
{
    use HasFactory;

    protected $table = 'teachers';

    protected $fillable = [
        'name', 'gender', 'dob', 'phone', 'email', 'address',
        'position', 'salary', 'hire_date', 'image',
        'teacher_id', 'department', 'status',
    ];

    protected static function booted()
    {
        static::creating(function (Teacher $teacher) {
            if (empty($teacher->teacher_id)) {
                $year = now()->format('Y');
                $count = static::whereYear('created_at', $year)->count();
                $teacher->teacher_id = 'TEA-' . $year . '-' . str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
            }
            if (empty($teacher->status)) {
                $teacher->status = 'active';
            }
        });
    }

    public function setPosition($position)
    {
        $this->position = $position;
        return $this;
    }

    public function getPosition()
    {
        return $this->position;
    }

    public function setSalary($salary)
    {
        $this->salary = $salary;
        return $this;
    }

    public function getSalary()
    {
        return $this->salary;
    }

    public function setHireDate($date)
    {
        $this->hire_date = $date;
        return $this;
    }

    public function getHireDate()
    {
        return $this->hire_date;
    }

    public function setImage($image)
    {
        $this->image = $image;
        return $this;
    }

    public function getImage()
    {
        return $this->image;
    }

    public function classes()
    {
        return $this->hasMany(SchoolClass::class, 'teacher_id');
    }

    public function assignedClasses()
    {
        return $this->belongsToMany(SchoolClass::class, 'teacher_class', 'teacher_id', 'class_id');
    }

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'teacher_subject', 'teacher_id', 'subject_id');
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }
}
