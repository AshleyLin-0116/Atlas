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
        (taskName, deadline, difficulty, importance, userPreference, duration, taskType)
        VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (task.taskName, task.deadline, task.difficulty, task.importance, task.userPreference, task.duration, task.taskType)
    )
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return {"id": task_id, **task.dict()}

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
            planned_difficulty, actual_difficulty, completion_status, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
            (task_id, task['taskName'], task['category'], task['duration'],
            feedback.actual_duration, task['difficulty'], feedback.actual_difficulty,
            feedback.completion_status)
        )
    conn.commit()
    conn.close()
    return {"message": "Feedback saved"}