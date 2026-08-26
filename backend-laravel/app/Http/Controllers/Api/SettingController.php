<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('group')) {
            $settings = Setting::where('group', $request->group)->get();
        } else {
            $settings = Setting::orderBy('group')->orderBy('key')->get();
        }

        return response()->json($settings);
    }

    public function byGroup(string $group)
    {
        $settings = Setting::where('group', $group)->get();

        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable',
            'settings.*.group' => 'nullable|string',
            'settings.*.type' => 'nullable|string|in:string,integer,boolean,json,array',
        ]);

        $updated = [];
        foreach ($request->settings as $item) {
            $setting = Setting::setValue(
                $item['key'],
                $item['value'],
                $item['group'] ?? 'general',
                $item['type'] ?? 'string'
            );
            $updated[] = $setting;
        }

        return response()->json([
            'message' => 'Settings updated successfully.',
            'settings' => $updated,
        ]);
    }

    public function destroy(Setting $setting)
    {
        $setting->delete();

        return response()->noContent();
    }

    public function getPublic()
    {
        $settings = Setting::whereIn('key', [
            'school_name', 'school_logo', 'school_email', 'school_phone',
            'school_address', 'timezone', 'language', 'currency',
        ])->pluck('value', 'key')->toArray();

        return response()->json($settings);
    }
}
