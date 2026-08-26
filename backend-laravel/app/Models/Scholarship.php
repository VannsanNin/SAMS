<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Scholarship extends Model
{
    protected $fillable = [
        'name', 'description', 'type', 'value', 'academic_year',
        'max_recipients', 'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'max_recipients' => 'integer',
        'is_active' => 'boolean',
    ];

    public function applications()
    {
        return $this->hasMany(ScholarshipApplication::class);
    }
}
