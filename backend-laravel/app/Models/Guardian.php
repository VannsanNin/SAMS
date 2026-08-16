<?php

namespace App\Models;

use App\Models\Base\Person;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Guardian extends Person
{
    use HasFactory;

    protected $table = 'guardians';

    protected $fillable = [
        'name', 'gender', 'dob', 'phone', 'email', 'address',
        'relationship', 'emergency_contact', 'image',
    ];

    public function students()
    {
        return $this->hasMany(Student::class, 'guardian_id');
    }

    public function user()
    {
        return $this->hasOne(User::class, 'guardian_id');
    }
}
