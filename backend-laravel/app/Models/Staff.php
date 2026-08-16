<?php

namespace App\Models;

use App\Models\Base\Person;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Staff extends Person
{
    use HasFactory;

    protected $table = 'staff';

    protected $fillable = [
        'name', 'gender', 'dob', 'phone', 'email', 'address',
        'position', 'salary', 'hire_date', 'image',
    ];

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

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class);
    }
}
