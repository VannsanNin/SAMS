<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScale extends Model
{
    protected $fillable = ['name', 'academic_year', 'is_default'];

    protected $casts = [
        'is_default' => 'boolean',
    ];

    public function items()
    {
        return $this->hasMany(GradeScaleItem::class)->orderByDesc('min_percentage');
    }
}
