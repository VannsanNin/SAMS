# SAMS — Impeccable Design System Specification

## Overview
This document establishes the **Impeccable Design System** for SAMS (School Attendance Management System). It defines visual guidelines, component tokens, animation standards, and UX principles for building enterprise-grade academic management interfaces.

---

## 🎨 Color Palette & Tokens

### Primary Brand Colors
- **Primary Ink / Navy**: `#0f172a` (Slate 900) - Headers, sidebar backgrounds, high-emphasis text
- **Primary Accent Indigo**: `#4f46e5` (Indigo 600) - Main actions, active menu items, key metrics
- **Vibrant Accent Amber**: `#f59e0b` (Amber 500) - Highlights, status tags, interactive callouts

### Surface & Background Tokens
- **Background Slate**: `#f8fafc` (Slate 50) - App background
- **Surface Pure**: `#ffffff` (White) - Card containers, table wrappers
- **Surface Hover**: `#f1f5f9` (Slate 100) - Dynamic hover states
- **Hairline Border**: `#e2e8f0` (Slate 200) - Divider lines, card borders

### Semantic Feedback Colors
- **Success Sage**: `#10b981` (Emerald 500) - Present status, approved leaves, active courses
- **Warning Amber**: `#f59e0b` (Amber 500) - Late status, pending requests
- **Danger Coral**: `#ef4444` (Red 500) - Absent status, rejected requests, errors
- **Info Sky**: `#3b82f6` (Blue 500) - Excused status, informational banners

---

##  Typography Standards

- **Display Font**: `Plus Jakarta Sans`, `Inter`, sans-serif (Headings, Stat Values, Page Titles)
- **Body Font**: `Inter`, system-ui, sans-serif (Tables, Forms, Paragraphs)
- **Code/ID Font**: `JetBrains Mono`, monospace (Student IDs, Course Codes, Timetable slots)

### Type Scale
| Level | Font Size | Weight | Usage |
|---|---|---|---|
| `h1` | 1.875rem (30px) | Bold (700) | Main Page Titles |
| `h2` | 1.5rem (24px) | SemiBold (600) | Section Headers |
| `h3` | 1.25rem (20px) | Medium (500) | Card Headers / Subsections |
| `body-lg` | 1.0rem (16px) | Regular (400) | Highlight text, subtitles |
| `body` | 0.875rem (14px) | Regular (400) | Standard table text, input labels |
| `caption` | 0.75rem (12px) | Medium (500) | Badges, timestamps, metadata |

---

## ⚡ Interaction & Animation Guidelines

1. **Transitions**: Standard transition speed is `150ms ease-in-out` for hover states and color transitions.
2. **Elevations & Hover**: Cards feature a subtle border by default and smooth translate-y (`-2px`) with shadow on hover.
3. **Glassmorphism**: Modals, filter headers, and sticky navbars use backdrop blur (`backdrop-blur-md bg-white/80`).
4. **Button States**: Buttons include active scale effects (`active:scale-[0.98]`) for tactile feedback.

---

## 🧩 Component Checklist

- [x] **Sidebar & Header**: High-contrast, role-aware navigation bar
- [x] **Stat Cards**: Rich metrics with icons, trend indicators, and subtle gradient backgrounds
- [x] **Data Tables**: Clean row dividers, sticky table headers, status badges, pagination
- [x] **Modal Dialogs**: Backdrop blur overlay, smooth entrance animation, clear action buttons
- [x] **Filters & Search**: Multi-select dropdowns, date pickers, quick-clear search inputs
