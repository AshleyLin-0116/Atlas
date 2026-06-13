# Atlas (Adaptive Study Scheduler)

Atlas is a personalized daily scheduler that learns from your behavior over time. It generates an optimized schedule each day based on your tasks, deadlines, and availability then refines its estimates as it observes how long tasks actually take, when you're most productive, and how your day unfolds in practice.

The core idea: most scheduling tools treat your time as static. Atlas treats it as dynamic, adjusting to what actually happens and getting more accurate with each completed task.

## Why It Exists

Students consistently underestimate how long tasks take, schedule work during low-energy hours, and fail to account for travel time, meals, and transitions. Existing tools (calendars, to-do apps) require manual planning and don't adapt to real behavior. Atlas automates the planning layer and closes the feedback loop between planned and actual.

## What It Does

- **Generates daily schedules** —> fills your available time with tasks, breaks, meals, and commitments automatically
- **Prioritizes tasks dynamically** —> ranks by urgency, importance, personal priority, and difficulty using a weighted scoring formula
- **Classifies deep vs. light work** —> alternates cognitively demanding and lighter tasks to preserve focus
- **Schedules around peak hours** —> places hardest tasks during your self-reported most productive window
- **Handles flexible and fixed commitments** —> meals and commitments can have fixed times or be placed automatically in preferred windows
- **Models commute time** —> blocks travel to and from any commitment requiring transportation, including return trips
- **Adapts to actual behavior** —> uses logged actual wake/sleep times and meal times to adjust the schedule in real time
- **Adjusts duration estimates** —> computes per-category multipliers from history and silently corrects future task durations
- **Collects behavioral feedback** —> after each task, logs actual duration, actual difficulty, and completion status
- **Tracks estimation accuracy** —> compares estimated vs. actual duration per task and by category
- **Identifies productive time patterns** —> analyzes which time periods have the highest task completion rates
- **Surfaces smart suggestions** —> detects overdue tasks, consistent underestimation patterns, and peak productivity windows
- **Weekly analytics** —> summarizes the last 7 days of task activity, time spent, and estimation accuracy by category
- **Schedule notes** —> after generation, flags any duration adjustments, sleep time shifts, or tasks that couldn't fit
- **Persists everything** —> all tasks, history, settings, and schedules saved to a local SQLite database

## How It Works

```
User inputs:
  Tasks (name, deadline, duration estimate, difficulty, importance)
  Availability (sleep schedule, meals, commitments)
  Settings (energy pattern, buffers, max block length)
          │
          ▼
Priority Scoring Engine
  score = 0.35×urgency + 0.25×importance + 0.20×preference + 0.15×difficulty + 0.05×consistency
  consistency = per-category completion rate from history (default 0.5 until 2+ data points)
          │
          ▼
Duration Adjustment Engine
  per-category multiplier = total actual / total estimated (requires 2+ history entries)
  adjusted duration = estimated × multiplier
          │
          ▼
Schedule Generator
  1. Block fixed commitments and meals (+ commute time); use actual times if logged
  2. Place flexible blocks in preferred windows
  3. Add shower, morning routine, wind-down buffers
  4. Interleave deep/light tasks by priority
  5. Insert breaks proportional to block length
  6. Prefer peak-hour windows for deep work
          │
          ▼
Generated daily schedule + schedule notes
          │
          ▼
Feedback Collection (after each task)
  Actual duration, actual difficulty, completion status, start/end time
          │
          ▼
History & Analytics
  Per-category multipliers, weekly stats, productive time analysis,
  completion rates by time of day, smart suggestions
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Create React App) |
| Backend | FastAPI (Python) |
| Database | SQLite via Python `sqlite3` |
| API communication | REST (JSON) |

No ORM — raw SQL for transparency and simplicity. No auth yet (planned for Phase 3 deployment).

## Architecture
┌─────────────────────────────────────────┐

│                  User                   │

│         (Browser / Mobile Web)          │

└─────────────────┬───────────────────────┘

│

▼

┌─────────────────────────────────────────┐

│              Frontend                   │

│         React (Vercel)                  │

│                                         │

│  • Schedule Generator (generateSchedule)│

│  • Priority Scoring Engine              │

│  • Duration Adjustment Engine           │

│  • Analytics Dashboard                  │

└─────────────────┬───────────────────────┘

│ REST API (JSON)

▼

┌─────────────────────────────────────────┐

│               Backend                   │

│           FastAPI (Render)              │

│                                         │

│  • /tasks        • /meals               │

│  • /history      • /commitments         │

│  • /sleep        • /settings            │

└─────────────────┬───────────────────────┘

│ sqlite3

▼

┌─────────────────────────────────────────┐

│              Database                   │

│         SQLite (atlas.db)               │

│                                         │

│  • tasks         • task_history         │

│  • meals         • commitments          │

│  • sleep_schedule• settings             │

└─────────────────────────────────────────┘

### Component Responsibilities

- **Frontend (React)**: All business logic lives here. The schedule generator, priority scoring formula, and duration adjustment engine are pure JavaScript functions that run in the browser. The backend is never called for computation, only for persistence.
- **Backend (FastAPI)**: Stateless REST API. Receives data, writes to SQLite, returns results. No scheduling logic, no business rules.
- **Schedule Generator**: Runs entirely in the browser. Takes tasks, meals, commitments, and sleep schedule as inputs and produces an ordered list of time blocks using a greedy first-fit algorithm with peak-hour awareness and deep/light work alternation.
- **Priority Scoring Engine**: Ranks tasks by a weighted formula: `0.35×urgency + 0.25×importance + 0.20×preference + 0.15×difficulty + 0.05×consistency`. Consistency is derived from per-category completion history.
- **Duration Adjustment Engine**: Computes per-task and per-category multipliers from history (`total actual / total estimated`) and silently adjusts scheduled durations. Requires 2+ history entries to activate.
- **Database (SQLite)**: Six tables storing all user data. Auto-created on first backend run. Note: SQLite on Render uses an ephemeral filesystem — a production deployment would use PostgreSQL.

## Quick Demo

**Input:**
```
Tasks:
  - "Study for Computer Science exam" — due Friday, 3 hours estimated, high difficulty
  - "Review flashcards" — due Thursday, 30 min, low difficulty

Availability:
  - Wake: 8:00 AM, Sleep: 11:00 PM
  - Lunch: 12:00–12:30 PM (fixed)
  - Work shift: 5:00–9:00 PM (fixed, 20 min commute)
  - Energy pattern: morning person

Settings:
  - Morning buffer: 30 min, Max deep work block: 90 min
  - Shower: morning, 15 min
```

**Generated schedule:**
```
8:00 – 8:30   🌅 Morning routine
8:30 – 8:45   🚿 Shower
8:45 – 10:15  ⭐ Study for Computer Science exam (Deep Work — peak hours)
10:15 – 10:30 — Break —
10:30 – 11:00 Review flashcards (Light Work)
11:00 – 12:00 ⭐ Study for Computer Science exam (Deep Work — continued)
12:00 – 12:30 🍽 Lunch
12:30 – 1:30  Study for Computer Science exam (remaining block)
1:30 – 1:45   — Break —
4:40 – 5:00   🚗 Commute to Work shift
5:00 – 9:00   📌 Work shift
9:00 – 9:20   🚗 Commute back from Work shift
10:30 – 11:00 🌙 Wind down
```

**Schedule notes (after 2 weeks of use):**
```
⚠ Study for CS exam: duration adjusted from 180 to 243 min (+35% based on Studying history)
⚠ Review flashcards: duration adjusted from 30 to 25 min (-17% based on Homework history)
```

**Dashboard suggestions:**
```
💡 You tend to underestimate Studying tasks by 35% — try adding 35% more time when estimating.
💡 Your best work happens during Morning (6:00am–12:00pm) (87.5% completion rate) — try scheduling deep work then.
```

## Project Structure

```
Atlas/
├── frontend/
│   └── src/
│       ├── App.js              # All UI components and schedule generation logic
│       ├── Atlas_Logo.png
│       └── index.js
└── backend/
    ├── main.py                 # FastAPI app — all REST endpoints and DB logic
    └── atlas.db                # SQLite database (auto-created on first run)
```

All schedule generation is pure frontend logic (`generateSchedule()` in App.js). The backend is a stateless persistence layer only, no business logic lives there.

## Setup

### Backend
```bash
cd backend
pip install fastapi uvicorn pydantic
python -m uvicorn main:app --reload
```
Runs at `http://localhost:8000`. Interactive API docs at `http://localhost:8000/docs`.

### Frontend
```bash
cd frontend
npm install
npm start
```
Runs at `http://localhost:3000`.

---

## Database Schema

| Table | Purpose |
|---|---|
| `tasks` | Task metadata, estimates, and completion feedback |
| `task_history` | Immutable record of each completed task session |
| `meals` | Meals with fixed or flexible time scheduling |
| `commitments` | Recurring commitments with commute and flex support |
| `sleep_schedule` | Planned and actual wake/sleep times |
| `settings` | User preferences (clock format, buffers, energy pattern, shower, etc.) |

---

## API Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/tasks` | List all / add task |
| PUT | `/tasks/{id}` | Edit task |
| DELETE | `/tasks/{id}` | Delete task |
| PATCH | `/tasks/{id}/feedback` | Submit completion feedback |
| GET | `/history` | Full task history |
| GET/POST | `/meals` | List all / add meal |
| PUT | `/meals/{id}` | Edit meal |
| PATCH | `/meals/{id}/actual` | Log actual meal times |
| GET/POST | `/commitments` | List all / add commitment |
| PUT | `/commitments/{id}` | Edit commitment |
| GET/POST | `/sleep` | Get / save sleep schedule |
| PATCH | `/sleep/actual` | Log actual sleep times |
| GET/POST | `/settings` | Get all / save a setting |

## Current Status

**Phase 1 — Complete:**
- Task input with name, description, deadline, category, difficulty, importance, duration
- Auto deep/light work classification with keyword matching and user override
- Custom keywords in Settings
- Priority scoring: `0.35×urgency + 0.25×importance + 0.20×preference + 0.15×difficulty + 0.05×consistency`
- Daily availability: sleep schedule, fixed and flexible meals and commitments
- Commute time (to and from) for meals and commitments
- Shower scheduling (duration + morning/evening/both preference)
- Schedule generation with morning routine, breaks, peak hours, deep/light alternation
- Full persistence for all data types
- Full CRUD for tasks, meals, commitments
- Settings: clock format, max block length, buffers, transition gap, energy pattern, shower

**Phase 2 — Complete:**
- Task feedback: completion status, actual duration (timer or manual), actual difficulty
- Task timer with Start/Stop
- History system with per-task and overall accuracy
- Category breakdown stats
- Duration adjustment engine: per-category multipliers from history, applied to schedule and task display
- Dynamic scheduling: actual sleep and meal times used in schedule generation
- Personalized priority scoring: consistency factor driven by real completion rate per category
- Weekly analytics dashboard: task counts, time estimated vs actual, accuracy, category breakdown
- Productive time analysis: completion rate, average duration, average accuracy per time period
- Schedule adjustment summary: notes on duration adjustments, sleep shifts, unscheduled tasks
- Smart suggestions: overdue tasks, underestimation patterns, peak productivity nudges
- Environment-aware debug logging: logs only in development, stripped in production builds

**Phase 3 — Planned:**
- UI redesign with Tailwind CSS
- Deploy frontend to Vercel, backend to Render
- User accounts and authentication
- Weekly and semester schedule views
- Per-day availability (different meals/sleep/commitments per day)

## Future Directions

- **ML-based duration prediction**: train a lightweight regression model on task history to predict durations more accurately than simple averages, incorporating task type, category, time of day, and self-reported difficulty
- **Disruption recovery** — detect when the day goes off-plan (late wake, skipped meal) and regenerate the remaining schedule in real time
- **Calendar API integration**: pull commitments directly from Google Calendar instead of manual entry
- **Weekly and semester views**: plan across multiple days with deadline-aware backscheduling
- **User accounts and cloud sync**: multi-device support with authentication (planned for Phase 3 deployment on Vercel + Render)
- **Optimization algorithm research**: the current scheduler is greedy (first-fit). A constraint satisfaction or integer programming approach could find globally better schedules, especially under tight availability constraints
