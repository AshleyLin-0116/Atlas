# Atlas

**An adaptive scheduling assistant that learns how you actually work — and builds your day around it.**

Most planners assume you'll follow the plan perfectly. Atlas doesn't. It generates realistic daily schedules, tracks what actually happened, and gets smarter about your pace over time.

## The Problem

Students consistently:
- Underestimate how long tasks take
- Overpack their schedules and burn out
- Waste time deciding what to do next
- Create plans they can't sustain

Atlas approaches scheduling as a **behavioral adaptation problem**, not a fixed planning problem.

## What It Does

- **Generates personalized daily schedules** based on your tasks, deadlines, and availability
- **Prioritizes tasks dynamically** using urgency, importance, and difficulty scoring
- **Inserts breaks automatically** and respects energy limits (ex. no longer than 3-hour deep work blocks)
- **Learns from your actual pace** — if coding tasks always take longer than expected, future schedules adjust automatically
- **Adapts when life happens** — missed a task? The schedule recalculates around what's left
- **Tracks planned vs. actual** so you can understand your own productivity patterns

## Quick Demo

```
Input:
  Tasks:
    - Computer Science Assignment   | Difficulty: 8 | Importance: 9 | Deadline: Friday | Estimated Duration: 3 hrs
    - Statistics Quiz Prep | Difficulty: 6 | Importance: 7 | Deadline: Thursday | Estimated Duration: 1.5 hrs
    - Chinese Review  | Difficulty: 4 | Importance: 5 | Deadline: Sunday | Estimated Duration: 1 hr

  Availability:
    - Wake: 8:00 AM | Sleep: 11:00 PM
    - Work: 2:00 PM – 7:00 PM
    - Lunch: 12:00 PM – 1:00 PM

Generated Schedule (Monday):
  9:00  – 11:00  → Computer Science Assignment (Deep Work)
  11:00 – 11:20  → Break
  11:20 – 12:00  → Stats Quiz Prep
  12:00 – 1:00   → Lunch
  2:00  – 7:00   → Work
  7:30  – 8:30   → Stats Quiz Prep (continued...)
  9:00  – 9:45   → Chinese Review
  9:45  – 11:00  → Free time / wind down
```

After completing CS Assignment, user reports: *"Took 4.5 hours, not 3."*

Atlas learns: user underestimates coding tasks → future CS tasks get **1.5× time buffer automatically.**

## How It Works

```
User Input
  (tasks, deadlines, difficulty, availability)
        ↓
Priority Scoring Engine
  PriorityScore = 0.5(Urgency) + 0.3(Importance) + 0.2(Difficulty)
        ↓
Time Allocation Engine
  (removes fixed blocks, inserts breaks, avoids overload)
        ↓
Schedule Output
  (exact daily timeline with tasks, breaks, meals)
        ↓
Completion Feedback
  (actual time, completion status, perceived difficulty)
        ↓
Adaptive Engine
  (updates future estimates based on user behavior patterns)
```

**Note**: The scheduling engine currently runs on the frontend. The backend handles 
 - persistence — storing tasks, history, meals, and settings in SQLite. The adaptive 
 - engine (Phase 2) will move scheduling logic to the backend to access historical data.

## Tech Stack

| Layer    | Technology             |
|----------|------------------------|
| Frontend | React, Tailwind CSS    |
| Backend  | FastAPI (Python)       |
| Database | SQLite                 |

## Project Structure

```
Atlas/
├── frontend/
│   └── src/
│       └── App.js        # Full React app (scheduling UI, task input, feedback)
├── backend/
│   └── main.py           # FastAPI server (routes, DB, scheduling logic)
├── docs/
└── README.md
```

## Setup

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### Backend
```bash
cd backend
pip install fastapi uvicorn pydantic
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `localhost:3000`, backend at `localhost:8000`.

## Current Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Core scheduler (input → schedule generation) | ✅ Complete |
| Phase 2 | Adaptive intelligence (feedback loop, behavioral tracking) | 🔄 In Progress |
| Phase 3 | Polish, deployment, analytics dashboard | ⏳ Upcoming |

## Future Improvements

- [ ] ML-based task duration prediction using user history
- [ ] Behavioral pattern detection (e.g., identifying peak productivity windows)
- [ ] Google Calendar and Canvas LMS integration
- [ ] Syllabus PDF parsing to auto-import assignments
- [ ] Mobile-responsive interface
- [ ] Analytics dashboard (planned vs. actual, weekly summaries)
- [ ] Burnout risk detection based on workload trends

## Why This Project

Atlas is designed to treat scheduling as a **human behavioral problem**, not a calendar problem. The core insight: a schedule that learns from failure is more useful than one that assumes perfection.

Built as a foundation for exploring adaptive systems, behavioral modeling, and human-centered product design.



*Built by Ashley Lin*