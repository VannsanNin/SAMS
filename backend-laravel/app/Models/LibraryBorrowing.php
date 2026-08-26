<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryBorrowing extends Model
{
    protected $fillable = [
        'book_id', 'user_id', 'borrowed_date', 'due_date',
        'returned_date', 'fine', 'notes', 'status',
    ];

    protected $casts = [
        'borrowed_date' => 'date',
        'due_date' => 'date',
        'returned_date' => 'date',
        'fine' => 'decimal:2',
    ];

    public function book()
    {
        return $this->belongsTo(LibraryBook::class, 'book_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
