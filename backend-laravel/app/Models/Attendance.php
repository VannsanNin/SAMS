<?php

namespace App\Models;

use App\Models\Base\Event;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Attendance extends Event
{
    use HasFactory;

    protected $table = 'attendances';

    protected $fillable = [
        'student_id', 'schedule_id', 'staff_id', 'date', 'status',
    ];

    public function setStudentID($id)
    {
        $this->student_id = $id;
        return $this;
    }

    public function getStudentID()
    {
        return $this->student_id;
    }

    public function setScheduleID($id)
    {
        $this->schedule_id = $id;
        return $this;
    }

    public function getScheduleID()
    {
        return $this->schedule_id;
    }

    public function setStatus($status)
    {
        $this->status = $status;
        return $this;
    }

    public function getStatus()
    {
        return $this->status;
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }

    public function staff()
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }
}
