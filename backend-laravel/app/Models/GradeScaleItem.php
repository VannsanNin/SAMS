<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScaleItem extends Model
{
    protected $fillable = [
        'grade_scale_id', 'grade', 'min_percentage', 'max_percentage',
        'gpa_point', 'description', 'sort_order',
    ];

    protected $casts = [
        'min_percentage' => 'decimal:2',
        'max_percentage' => 'decimal:2',
        'gpa_point' => 'decimal:1',
    ];

    public function gradeScale()
    {
        return $this->belongsTo(GradeScale::class);
    }
}
