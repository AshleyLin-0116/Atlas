from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("atlas.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            taskName TEXT NOT NULL,
            deadline TEXT NOT NULL,
            difficulty REAL NOT NULL,
            importance REAL NOT NULL,
            userPreference REAL NOT NULL,
            duration INTEGER NOT NULL,
            taskType TEXT NOT NULL,
            actual_duration REAL,
            actual_difficulty REAL,
            completion_status TEXT,
            category TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS task_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id INTEGER,
            taskName TEXT,
            category TEXT,
            estimated_duration REAL,
            actual_duration REAL,
            planned_difficulty REAL,
            actual_difficulty REAL,
            completion_status TEXT,
            start_time TEXT,
            end_time TEXT,
            completed_at TEXT,
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mealName TEXT NOT NULL,
            mealStart TEXT NOT NULL,
            mealEnd TEXT NOT NULL
        )
    """)
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN commuteTime INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS commitments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            commitmentName TEXT NOT NULL,
            commitmentStart TEXT NOT NULL,
            commitmentEnd TEXT NOT NULL,
            commitmentType TEXT
        )
    """)
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN commuteTime INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sleep_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wakeTime TEXT NOT NULL,
            sleepTime TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            taskName TEXT NOT NULL,
            deadline TEXT NOT NULL,
            difficulty REAL NOT NULL,
            importance REAL NOT NULL,
            userPreference REAL NOT NULL,
            duration INTEGER NOT NULL,
            taskType TEXT NOT NULL,
            actual_duration REAL,
            actual_difficulty REAL,
            completion_status TEXT,
            category TEXT
        )
    """)
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN category TEXT")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN workOnDueDate INTEGER DEFAULT 1")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN description TEXT")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN actual_start TEXT")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN actual_end TEXT")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE sleep_schedule ADD COLUMN actual_wake TEXT")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE sleep_schedule ADD COLUMN actual_sleep TEXT")
        conn.commit()
    except:
        pass
    conn.commit()
    conn.close()

init_db()

class Task(BaseModel):
    taskName: str
    deadline: str
    difficulty: float
    importance: float
    userPreference: float
    duration: int
    taskType: str
    actual_duration: Optional[float] = None
    actual_difficulty: Optional[float] = None
    completion_status: Optional[str] = None
    category: Optional[str] = None

class TaskFeedback(BaseModel):
    actual_duration: float
    actual_difficulty: float
    completion_status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class Meal(BaseModel):
    mealName: str
    mealStart: str
    mealEnd: str
    commuteTime: Optional[int] = 0

class Commitment(BaseModel):
    commitmentName: str
    commitmentStart: str
    commitmentEnd: str
    commitmentType: Optional[str] = None
    commuteTime: Optional[int] = 0

class SleepSchedule(BaseModel):
    wakeTime: str
    sleepTime: str

class Setting(BaseModel):
    key: str
    value: str

class Task(BaseModel):
    taskName: str
    deadline: str
    difficulty: float
    importance: float
    userPreference: float
    duration: int
    taskType: str
    actual_duration: Optional[float] = None
    actual_difficulty: Optional[float] = None
    completion_status: Optional[str] = None
    category: Optional[str] = None
    workOnDueDate: Optional[bool] = True

class Task(BaseModel):
    taskName: str
    deadline: str
    difficulty: float
    importance: float
    userPreference: float
    duration: int
    taskType: str
    actual_duration: Optional[float] = None
    actual_difficulty: Optional[float] = None
    completion_status: Optional[str] = None
    category: Optional[str] = None
    workOnDueDate: Optional[bool] = True
    description: Optional[str] = None

class ActualMealTime(BaseModel):
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None

class ActualSleepTime(BaseModel):
    actual_wake: Optional[str] = None
    actual_sleep: Optional[str] = None

@app.get("/")
def read_root():
    return {"message": "Atlas backend is running"}

@app.get("/tasks")
def get_tasks():
    conn = get_db()
    tasks = conn.execute("SELECT * FROM tasks").fetchall()
    conn.close()
    return [dict(task) for task in tasks]

@app.post("/tasks")
def add_task(task: Task):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO tasks 
        (taskName, deadline, difficulty, importance, userPreference, duration, taskType, category, workOnDueDate, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        task.workOnDueDate, task.description)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(result)

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    conn.close()
    return {"message": "Task deleted"}

@app.patch("/tasks/{task_id}/feedback")
def submit_feedback(task_id: int, feedback: TaskFeedback):
    conn = get_db()
    conn.execute(
        """UPDATE tasks 
        SET actual_duration = ?, actual_difficulty = ?, completion_status = ?
        WHERE id = ?""",
        (feedback.actual_duration, feedback.actual_difficulty, feedback.completion_status, task_id)
    )
    task = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if task:
        conn.execute(
            """INSERT INTO task_history 
            (task_id, taskName, category, estimated_duration, actual_duration, 
            planned_difficulty, actual_difficulty, completion_status, 
            start_time, end_time, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
            (task_id, task['taskName'], task['category'], task['duration'],
            feedback.actual_duration, task['difficulty'], feedback.actual_difficulty,
            feedback.completion_status, feedback.start_time, feedback.end_time)
        )
    conn.commit()
    conn.close()
    return {"message": "Feedback saved"}

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: Task):
    conn = get_db()
    try:
        conn.execute(
            """UPDATE tasks SET
            taskName = ?, deadline = ?, difficulty = ?, importance = ?,
            userPreference = ?, duration = ?, taskType = ?, category = ?,
            workOnDueDate = ?, description = ?
            WHERE id = ?""",
            (task.taskName, task.deadline, task.difficulty, task.importance,
            task.userPreference, task.duration, task.taskType, task.category,
            task.workOnDueDate, task.description, task_id)
        )
        conn.commit()
        result = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        conn.close()
        return dict(result)
    except Exception as e:
        conn.close()
        print(f"Error updating task: {e}")
        raise

@app.get("/history")
def get_history():
    conn = get_db()
    history = conn.execute("SELECT * FROM task_history ORDER BY completed_at DESC").fetchall()
    conn.close()
    return [dict(h) for h in history]

@app.get("/meals")
def get_meals():
    conn = get_db()
    meals = conn.execute("SELECT * FROM meals").fetchall()
    conn.close()
    return [dict(m) for m in meals]

@app.post("/meals")
def add_meal(meal: Meal):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO meals (mealName, mealStart, mealEnd, commuteTime) VALUES (?, ?, ?, ?)",
        (meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime)
    )
    conn.commit()
    meal_id = cursor.lastrowid
    conn.close()
    return {"id": meal_id, **meal.model_dump()}

@app.patch("/meals/{meal_id}/actual")
def log_actual_meal(meal_id: int, data: ActualMealTime):
    conn = get_db()
    conn.execute(
        "UPDATE meals SET actual_start = ?, actual_end = ? WHERE id = ?",
        (data.actual_start, data.actual_end, meal_id)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM meals WHERE id = ?", (meal_id,)).fetchone()
    conn.close()
    return dict(result)

@app.put("/meals/{meal_id}")
def update_meal(meal_id: int, meal: Meal):
    conn = get_db()
    conn.execute(
        """UPDATE meals SET mealName = ?, mealStart = ?, mealEnd = ?, commuteTime = ?
        WHERE id = ?""",
        (meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime, meal_id)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM meals WHERE id = ?", (meal_id,)).fetchone()
    conn.close()
    return dict(result)

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int):
    conn = get_db()
    conn.execute("DELETE FROM meals WHERE id = ?", (meal_id,))
    conn.commit()
    conn.close()
    return {"message": "Meal deleted"}

@app.get("/commitments")
def get_commitments():
    conn = get_db()
    commitments = conn.execute("SELECT * FROM commitments").fetchall()
    conn.close()
    return [dict(c) for c in commitments]

@app.post("/commitments")
def add_commitment(commitment: Commitment):
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO commitments (commitmentName, commitmentStart, commitmentEnd, commitmentType, commuteTime) VALUES (?, ?, ?, ?, ?)",
        (commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd, commitment.commitmentType, commitment.commuteTime)
    )
    conn.commit()
    commitment_id = cursor.lastrowid
    conn.close()
    return {"id": commitment_id, **commitment.model_dump()}

@app.put("/commitments/{commitment_id}")
def update_commitment(commitment_id: int, commitment: Commitment):
    conn = get_db()
    conn.execute(
        """UPDATE commitments SET commitmentName = ?, commitmentStart = ?,
        commitmentEnd = ?, commitmentType = ?, commuteTime = ?
        WHERE id = ?""",
        (commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime, commitment_id)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM commitments WHERE id = ?", (commitment_id,)).fetchone()
    conn.close()
    return dict(result)

@app.delete("/commitments/{commitment_id}")
def delete_commitment(commitment_id: int):
    conn = get_db()
    conn.execute("DELETE FROM commitments WHERE id = ?", (commitment_id,))
    conn.commit()
    conn.close()
    return {"message": "Commitment deleted"}

@app.get("/sleep")
def get_sleep():
    conn = get_db()
    sleep = conn.execute("SELECT * FROM sleep_schedule ORDER BY id DESC LIMIT 1").fetchone()
    conn.close()
    if sleep:
        return dict(sleep)
    return None

@app.post("/sleep")
def save_sleep(sleep: SleepSchedule):
    conn = get_db()
    conn.execute("DELETE FROM sleep_schedule")
    conn.execute(
        "INSERT INTO sleep_schedule (wakeTime, sleepTime) VALUES (?, ?)",
        (sleep.wakeTime, sleep.sleepTime)
    )
    conn.commit()
    conn.close()
    return sleep.model_dump()

@app.patch("/sleep/actual")
def log_actual_sleep(data: ActualSleepTime):
    conn = get_db()
    conn.execute(
        """UPDATE sleep_schedule SET actual_wake = ?, actual_sleep = ?
        WHERE id = (SELECT id FROM sleep_schedule ORDER BY id DESC LIMIT 1)""",
        (data.actual_wake, data.actual_sleep)
    )
    conn.commit()
    conn.close()
    return {"message": "Actual sleep logged"}

@app.get("/settings")
def get_settings():
    conn = get_db()
    settings = conn.execute("SELECT * FROM settings").fetchall()
    conn.close()
    return {row['key']: row['value'] for row in settings}

@app.post("/settings")
def save_setting(setting: Setting):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM settings WHERE key = ?", (setting.key,)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE settings SET value = ? WHERE key = ?",
            (setting.value, setting.key)
        )
    else:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?)",
            (setting.key, setting.value)
        )
    conn.commit()
    conn.close()
    return setting.model_dump()