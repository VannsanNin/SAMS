<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $table = 'schedules';

    protected $fillable = [
        'class_id', 'subject_id', 'teacher_id',
        'day', 'time_start', 'time_end', 'room', 'recurrence',
    ];

    protected static function booted()
    {
        static::creating(function (Schedule $schedule) {
            if (empty($schedule->recurrence)) {
                $schedule->recurrence = 'weekly';
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

    public function setClassID($id)
    {
        $this->class_id = $id;
        return $this;
    }

    public function getClassID()
    {
        return $this->class_id;
    }

    public function setSubjectID($id)
    {
        $this->subject_id = $id;
        return $this;
    }

    public function getSubjectID()
    {
        return $this->subject_id;
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

    public function setDay($day)
    {
        $this->day = $day;
        return $this;
    }

    public function getDay()
    {
        return $this->day;
    }

    public function setTimeStart($time)
    {
        $this->time_start = $time;
        return $this;
    }

    public function getTimeStart()
    {
        return $this->time_start;
    }

    public function setTimeEnd($time)
    {
        $this->time_end = $time;
        return $this;
    }

    public function getTimeEnd()
    {
        return $this->time_end;
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function teacher()
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }
}
