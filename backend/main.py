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
            taskType TEXT NOT NULL
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