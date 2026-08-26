<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LibraryBook extends Model
{
    protected $fillable = [
        'title', 'isbn', 'author', 'publisher', 'category',
        'total_copies', 'available_copies', 'price', 'published_date',
        'description', 'shelf_location', 'is_available',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'published_date' => 'date',
        'is_available' => 'boolean',
    ];

    public function borrowings()
    {
        return $this->hasMany(LibraryBorrowing::class, 'book_id');
    }
}
