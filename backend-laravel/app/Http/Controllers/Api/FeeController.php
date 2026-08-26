<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Scholarship;
use App\Models\ScholarshipApplication;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeeController extends Controller
{
    // ─── Fee Structures ─────────────────────────────────────────────────────

    public function feeStructures(Request $request)
    {
        $query = FeeStructure::with('schoolClass');

        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('academic_year')) $query->where('academic_year', $request->academic_year);
        if ($request->has('is_active')) $query->where('is_active', $request->boolean('is_active'));

        return response()->json($query->orderBy('type')->get());
    }

    public function storeFeeStructure(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:registration,tuition,exam,library,transport,uniform,activity,lab,other',
            'amount' => 'required|numeric|min:0',
            'class_id' => 'nullable|exists:classes,id',
            'academic_year' => 'required|string',
            'semester' => 'nullable|string',
            'description' => 'nullable|string',
            'is_mandatory' => 'nullable|boolean',
        ]);

        $fee = FeeStructure::create($request->all());
        return response()->json($fee, 201);
    }

    public function updateFeeStructure(Request $request, FeeStructure $feeStructure)
    {
        $feeStructure->update($request->all());
        return response()->json($feeStructure);
    }

    public function deleteFeeStructure(FeeStructure $feeStructure)
    {
        $feeStructure->delete();
        return response()->noContent();
    }

    // ─── Invoices ───────────────────────────────────────────────────────────

    public function invoices(Request $request)
    {
        $query = FeeInvoice::with(['student.class', 'feeStructure', 'payments']);

        if ($request->has('student_id')) $query->where('student_id', $request->student_id);
        if ($request->has('status')) $query->where('status', $request->status);
        if ($request->has('academic_year')) $query->whereHas('feeStructure', fn ($q) => $q->where('academic_year', $request->academic_year));

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function storeInvoice(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'fee_structure_id' => 'required|exists:fee_structures,id',
            'amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'due_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $amount = $request->amount - ($request->discount ?? 0);
        $invoice = FeeInvoice::create([
            'student_id' => $request->student_id,
            'fee_structure_id' => $request->fee_structure_id,
            'amount' => $request->amount,
            'discount' => $request->discount ?? 0,
            'paid_amount' => 0,
            'balance' => $amount,
            'due_date' => $request->due_date,
            'notes' => $request->notes,
        ]);

        return response()->json($invoice->load(['student.class', 'feeStructure']), 201);
    }

    public function bulkGenerateInvoices(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id',
            'fee_structure_id' => 'required|exists:fee_structures,id',
            'due_date' => 'required|date',
        ]);

        $students = Student::where('class_id', $request->class_id)
            ->where('status', 'active')
            ->get();

        $feeStructure = FeeStructure::findOrFail($request->fee_structure_id);
        $created = 0;

        foreach ($students as $student) {
            $exists = FeeInvoice::where('student_id', $student->id)
                ->where('fee_structure_id', $feeStructure->id)
                ->exists();

            if (! $exists) {
                FeeInvoice::create([
                    'student_id' => $student->id,
                    'fee_structure_id' => $feeStructure->id,
                    'amount' => $feeStructure->amount,
                    'paid_amount' => 0,
                    'balance' => $feeStructure->amount,
                    'due_date' => $request->due_date,
                ]);
                $created++;
            }
        }

        return response()->json(['message' => "{$created} invoices generated.", 'count' => $created]);
    }

    // ─── Payments ───────────────────────────────────────────────────────────

    public function payments(Request $request)
    {
        $query = FeePayment::with(['invoice', 'student.class', 'receiver']);

        if ($request->has('student_id')) $query->where('student_id', $request->student_id);
        if ($request->has('payment_method')) $query->where('payment_method', $request->payment_method);
        if ($request->has('date_from')) $query->whereDate('payment_date', '>=', $request->date_from);
        if ($request->has('date_to')) $query->whereDate('payment_date', '<=', $request->date_to);

        return response()->json($query->orderByDesc('payment_date')->paginate(25));
    }

    public function storePayment(Request $request)
    {
        $request->validate([
            'invoice_id' => 'required|exists:fee_invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,online,check,mobile',
            'payment_date' => 'required|date',
            'transaction_reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $invoice = FeeInvoice::findOrFail($request->invoice_id);

        if ($invoice->status === 'paid') {
            return response()->json(['message' => 'Invoice is already fully paid.'], 422);
        }

        $payment = FeePayment::create([
            'invoice_id' => $invoice->id,
            'student_id' => $invoice->student_id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'transaction_reference' => $request->transaction_reference,
            'payment_date' => $request->payment_date,
            'notes' => $request->notes,
            'received_by' => $request->user()->id,
        ]);

        $invoice->paid_amount += $request->amount;
        $invoice->balance = max(0, $invoice->amount - $invoice->discount - $invoice->paid_amount);
        $invoice->status = $invoice->balance <= 0 ? 'paid' : 'partial';
        $invoice->save();

        return response()->json($payment->load(['invoice', 'student.class']), 201);
    }

    // ─── Scholarships ───────────────────────────────────────────────────────

    public function scholarships(Request $request)
    {
        $query = Scholarship::withCount('applications');

        if ($request->has('academic_year')) $query->where('academic_year', $request->academic_year);
        if ($request->has('is_active')) $query->where('is_active', $request->boolean('is_active'));

        return response()->json($query->get());
    }

    public function storeScholarship(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'academic_year' => 'required|string',
            'max_recipients' => 'nullable|integer|min:1',
        ]);

        $scholarship = Scholarship::create($request->all());
        return response()->json($scholarship, 201);
    }

    public function scholarshipApplications(Request $request, Scholarship $scholarship)
    {
        return response()->json(
            $scholarship->applications()->with('student.class')->get()
        );
    }

    public function applyScholarship(Request $request, Scholarship $scholarship)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'reason' => 'nullable|string',
        ]);

        $application = ScholarshipApplication::create([
            'scholarship_id' => $scholarship->id,
            'student_id' => $request->student_id,
            'reason' => $request->reason,
        ]);

        return response()->json($application, 201);
    }

    public function reviewScholarshipApplication(Request $request, ScholarshipApplication $application)
    {
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'approved_amount' => 'nullable|numeric|min:0',
            'admin_remarks' => 'nullable|string',
        ]);

        $application->update($request->only('status', 'approved_amount', 'admin_remarks'));
        return response()->json($application->load(['student.class', 'scholarship']));
    }

    // ─── Reports ────────────────────────────────────────────────────────────

    public function feeCollectionReport(Request $request)
    {
        $request->validate(['academic_year' => 'required|string']);

        $totalCollected = FeePayment::whereHas('invoice.feeStructure', fn ($q) => $q->where('academic_year', $request->academic_year))
            ->sum('amount');

        $totalPending = FeeInvoice::whereHas('feeStructure', fn ($q) => $q->where('academic_year', $request->academic_year))
            ->where('status', '!=', 'paid')
            ->sum('balance');

        $byType = FeeInvoice::whereHas('feeStructure', fn ($q) => $q->where('academic_year', $request->academic_year))
            ->join('fee_structures', 'fee_structures.id', '=', 'fee_invoices.fee_structure_id')
            ->selectRaw('fee_structures.type, SUM(fee_invoices.amount) as total_amount, SUM(fee_invoices.paid_amount) as collected, SUM(fee_invoices.balance) as pending')
            ->groupBy('fee_structures.type')
            ->get();

        return response()->json([
            'total_collected' => $totalCollected,
            'total_pending' => $totalPending,
            'by_type' => $byType,
        ]);
    }

    public function studentFeeStatus(Request $request, Student $student)
    {
        $invoices = FeeInvoice::where('student_id', $student->id)
            ->with('feeStructure', 'payments')
            ->orderByDesc('created_at')
            ->get();

        $totalAmount = $invoices->sum('amount');
        $totalPaid = $invoices->sum('paid_amount');
        $totalDiscount = $invoices->sum('discount');

        return response()->json([
            'student' => $student->load('class'),
            'invoices' => $invoices,
            'summary' => [
                'total_amount' => $totalAmount,
                'total_discount' => $totalDiscount,
                'total_paid' => $totalPaid,
                'total_balance' => $totalAmount - $totalDiscount - $totalPaid,
            ],
        ]);
    }
}
