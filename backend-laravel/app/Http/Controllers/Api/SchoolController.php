<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Semester;
use App\Models\Department;
use App\Models\Building;
use App\Models\Room;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SchoolController extends Controller
{
    // ─── Academic Years ─────────────────────────────────────────────────────

    public function academicYears()
    {
        return response()->json(AcademicYear::with('semesters')->orderByDesc('start_date')->get());
    }

    public function storeAcademicYear(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:academic_years',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'nullable|boolean',
        ]);

        if ($request->boolean('is_current')) {
            AcademicYear::where('is_current', true)->update(['is_current' => false]);
        }

        $year = AcademicYear::create($request->all());
        return response()->json($year, 201);
    }

    public function semesters(AcademicYear $academicYear)
    {
        return response()->json($academicYear->semesters);
    }

    public function storeSemester(Request $request, AcademicYear $academicYear)
    {
        $request->validate([
            'name' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_current' => 'nullable|boolean',
        ]);

        if ($request->boolean('is_current')) {
            Semester::where('is_current', true)->update(['is_current' => false]);
        }

        $semester = $academicYear->semesters()->create($request->all());
        return response()->json($semester, 201);
    }

    // ─── Departments ────────────────────────────────────────────────────────

    public function departments()
    {
        return response()->json(Department::with('head')->get());
    }

    public function storeDepartment(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:departments',
            'code' => 'required|string|unique:departments',
            'description' => 'nullable|string',
            'head_id' => 'nullable|exists:teachers,id',
        ]);

        $dept = Department::create($request->all());
        return response()->json($dept, 201);
    }

    public function updateDepartment(Request $request, Department $department)
    {
        $department->update($request->all());
        return response()->json($department);
    }

    // ─── Buildings & Rooms ──────────────────────────────────────────────────

    public function buildings()
    {
        return response()->json(Building::withCount('rooms')->get());
    }

    public function storeBuilding(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'code' => 'required|string|unique:buildings',
            'address' => 'nullable|string',
            'total_floors' => 'nullable|integer|min:1',
        ]);

        $building = Building::create($request->all());
        return response()->json($building, 201);
    }

    public function rooms(Request $request)
    {
        $query = Room::with('building');

        if ($request->has('building_id')) $query->where('building_id', $request->building_id);
        if ($request->has('type')) $query->where('type', $request->type);
        if ($request->has('is_active')) $query->where('is_active', $request->boolean('is_active'));

        return response()->json($query->get());
    }

    public function storeRoom(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'number' => 'required|string',
            'building_id' => 'nullable|exists:buildings,id',
            'floor' => 'nullable|integer',
            'type' => 'required|in:classroom,lab,office,library,hall,other',
            'capacity' => 'nullable|integer|min:1',
        ]);

        $room = Room::create($request->all());
        return response()->json($room, 201);
    }

    // ─── Payroll ────────────────────────────────────────────────────────────

    public function payroll(Request $request)
    {
        $query = Payroll::with('user');

        if ($request->has('month')) $query->where('month', $request->month);
        if ($request->has('status')) $query->where('status', $request->status);

        return response()->json($query->orderByDesc('month')->paginate(25));
    }

    public function storePayroll(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'month' => 'required|string',
            'basic_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'bonuses' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'advances' => 'nullable|numeric|min:0',
        ]);

        $netSalary = ($request->basic_salary + $request->allowances + $request->bonuses + $request->overtime)
            - ($request->deductions + $request->tax + $request->advances);

        $payroll = Payroll::create([
            ...$request->all(),
            'net_salary' => max(0, $netSalary),
        ]);

        return response()->json($payroll->load('user'), 201);
    }

    public function payrollReport(Request $request)
    {
        $month = $request->get('month', now()->format('Y-m'));

        $stats = Payroll::where('month', $month)
            ->selectRaw('COUNT(*) as total_employees')
            ->selectRaw('SUM(basic_salary) as total_basic')
            ->selectRaw('SUM(allowances) as total_allowances')
            ->selectRaw('SUM(bonuses) as total_bonuses')
            ->selectRaw('SUM(deductions) as total_deductions')
            ->selectRaw('SUM(tax) as total_tax')
            ->selectRaw('SUM(net_salary) as total_net')
            ->first();

        return response()->json($stats);
    }
}
