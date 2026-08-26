<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeeStructure extends Model
{
    protected $fillable = [
        'name', 'type', 'amount', 'class_id', 'academic_year',
        'semester', 'description', 'is_mandatory', 'is_active',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function invoices()
    {
        return $this->hasMany(FeeInvoice::class);
    }
}
