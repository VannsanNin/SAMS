<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LibraryBook;
use App\Models\LibraryBorrowing;
use Carbon\Carbon;
use Illuminate\Http\Request;

class LibraryController extends Controller
{
    public function index(Request $request)
    {
        $query = LibraryBook::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('author', 'like', "%{$search}%")
                    ->orWhere('isbn', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->has('category')) $query->where('category', $request->category);
        if ($request->has('is_available')) $query->where('is_available', $request->boolean('is_available'));

        return response()->json($query->orderBy('title')->paginate($request->get('per_page', 25)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'isbn' => 'nullable|string|unique:library_books,isbn',
            'author' => 'required|string|max:255',
            'publisher' => 'nullable|string',
            'category' => 'required|string',
            'total_copies' => 'required|integer|min:1',
            'price' => 'nullable|numeric|min:0',
            'published_date' => 'nullable|date',
            'description' => 'nullable|string',
            'shelf_location' => 'nullable|string',
        ]);

        $data['available_copies'] = $request->total_copies;

        $book = LibraryBook::create($data);
        return response()->json($book, 201);
    }

    public function show(LibraryBook $book)
    {
        return response()->json($book);
    }

    public function update(Request $request, LibraryBook $book)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'isbn' => 'nullable|string|unique:library_books,isbn,' . $book->id,
            'author' => 'sometimes|string|max:255',
            'publisher' => 'nullable|string',
            'category' => 'sometimes|string',
            'total_copies' => 'sometimes|integer|min:1',
            'price' => 'nullable|numeric|min:0',
            'published_date' => 'nullable|date',
            'description' => 'nullable|string',
            'shelf_location' => 'nullable|string',
        ]);

        if (array_key_exists('total_copies', $data)) {
            $borrowed = max(0, (int) $book->total_copies - (int) $book->available_copies);
            abort_unless($data['total_copies'] >= $borrowed, 422, 'Total copies cannot be less than borrowed copies.');
            $data['available_copies'] = $data['total_copies'] - $borrowed;
        }

        $book->update($data);
        return response()->json($book);
    }

    public function destroy(LibraryBook $book)
    {
        $book->delete();
        return response()->noContent();
    }

    // ─── Borrowing ──────────────────────────────────────────────────────────

    public function borrowings(Request $request)
    {
        $query = LibraryBorrowing::with(['book', 'user']);

        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('user_id')) $query->where('user_id', $request->user_id);

        return response()->json($query->orderByDesc('borrowed_date')->paginate(25));
    }

    public function borrowBook(Request $request)
    {
        $request->validate([
            'book_id' => 'required|exists:library_books,id',
            'user_id' => 'required|exists:users,id',
            'due_date' => 'required|date|after:today',
        ]);

        $book = LibraryBook::findOrFail($request->book_id);

        if ($book->available_copies <= 0) {
            return response()->json(['message' => 'No copies available.'], 422);
        }

        $borrowing = LibraryBorrowing::create([
            'book_id' => $book->id,
            'user_id' => $request->user_id,
            'borrowed_date' => now()->toDateString(),
            'due_date' => $request->due_date,
        ]);

        $book->decrement('available_copies');
        $book->update(['is_available' => $book->available_copies > 0]);

        return response()->json($borrowing->load(['book', 'user']), 201);
    }

    public function returnBook(Request $request, LibraryBorrowing $borrowing)
    {
        if ($borrowing->status === 'returned') {
            return response()->json(['message' => 'Book already returned.'], 422);
        }

        $fine = 0;
        if (Carbon::parse($borrowing->due_date)->isPast()) {
            $daysLate = Carbon::parse($borrowing->due_date)->diffInDays(now());
            $fine = $daysLate * 0.50; // $0.50 per day
        }

        $borrowing->update([
            'returned_date' => now()->toDateString(),
            'fine' => $fine,
            'status' => 'returned',
        ]);

        $borrowing->book->increment('available_copies');
        $borrowing->book->update(['is_available' => true]);

        return response()->json([
            'message' => 'Book returned successfully.',
            'fine' => $fine,
            'borrowing' => $borrowing->load('book'),
        ]);
    }

    public function overdueBooks()
    {
        $overdue = LibraryBorrowing::where('status', 'borrowed')
            ->where('due_date', '<', now())
            ->with(['book', 'user'])
            ->get();

        return response()->json($overdue);
    }

    public function stats()
    {
        return response()->json([
            'total_books' => LibraryBook::sum('total_copies'),
            'available' => LibraryBook::sum('available_copies'),
            'borrowed' => LibraryBorrowing::where('status', 'borrowed')->count(),
            'overdue' => LibraryBorrowing::where('status', 'borrowed')->where('due_date', '<', now())->count(),
            'total_fines' => LibraryBorrowing::where('status', 'returned')->sum('fine'),
        ]);
    }
}
