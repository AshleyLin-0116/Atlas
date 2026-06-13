from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
import sqlite3
from typing import Optional
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta

SECRET_KEY = "atlas-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://atlas-delta-sable.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    conn = sqlite3.connect("atlas.db")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
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
            category TEXT,
            workOnDueDate INTEGER DEFAULT 1,
            description TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN user_id INTEGER")
        conn.commit()
    except:
        pass
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
        conn.execute("ALTER TABLE tasks ADD COLUMN actual_duration REAL")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN actual_difficulty REAL")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE tasks ADD COLUMN completion_status TEXT")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS task_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
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
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (task_id) REFERENCES tasks(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE task_history ADD COLUMN user_id INTEGER")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            mealName TEXT NOT NULL,
            mealStart TEXT,
            mealEnd TEXT,
            commuteTime INTEGER DEFAULT 0,
            actual_start TEXT,
            actual_end TEXT,
            timeMode TEXT DEFAULT 'fixed',
            flexDuration INTEGER DEFAULT 0,
            flexPreference TEXT DEFAULT 'any',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN user_id INTEGER")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN commuteTime INTEGER DEFAULT 0")
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
        conn.execute("ALTER TABLE meals ADD COLUMN timeMode TEXT DEFAULT 'fixed'")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN flexDuration INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE meals ADD COLUMN flexPreference TEXT DEFAULT 'any'")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS commitments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            commitmentName TEXT NOT NULL,
            commitmentStart TEXT,
            commitmentEnd TEXT,
            commitmentType TEXT,
            commuteTime INTEGER DEFAULT 0,
            timeMode TEXT DEFAULT 'fixed',
            flexDuration INTEGER DEFAULT 0,
            flexPreference TEXT DEFAULT 'any',
            days TEXT DEFAULT '',
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN user_id INTEGER")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN commuteTime INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN timeMode TEXT DEFAULT 'fixed'")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN flexDuration INTEGER DEFAULT 0")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN flexPreference TEXT DEFAULT 'any'")
        conn.commit()
    except:
        pass
    try:
        conn.execute("ALTER TABLE commitments ADD COLUMN days TEXT DEFAULT ''")
        conn.commit()
    except:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sleep_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            wakeTime TEXT NOT NULL,
            sleepTime TEXT NOT NULL,
            actual_wake TEXT,
            actual_sleep TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE sleep_schedule ADD COLUMN user_id INTEGER")
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
    conn.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (user_id, key),
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE settings ADD COLUMN user_id INTEGER")
        conn.commit()
    except:
        pass
    conn.commit()
    conn.close()

init_db()

def create_token(user_id: int, username: str):
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "username": username, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

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

class TaskFeedback(BaseModel):
    actual_duration: float
    actual_difficulty: float
    completion_status: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None

class Meal(BaseModel):
    mealName: str
    mealStart: Optional[str] = None
    mealEnd: Optional[str] = None
    commuteTime: Optional[int] = 0
    timeMode: Optional[str] = 'fixed'
    flexDuration: Optional[int] = 0
    flexPreference: Optional[str] = 'any'

class ActualMealTime(BaseModel):
    actual_start: Optional[str] = None
    actual_end: Optional[str] = None

class Commitment(BaseModel):
    commitmentName: str
    commitmentStart: Optional[str] = None
    commitmentEnd: Optional[str] = None
    commitmentType: Optional[str] = None
    commuteTime: Optional[int] = 0
    timeMode: Optional[str] = 'fixed'
    flexDuration: Optional[int] = 0
    flexPreference: Optional[str] = 'any'
    days: Optional[str] = ''

class SleepSchedule(BaseModel):
    wakeTime: str
    sleepTime: str

class ActualSleepTime(BaseModel):
    actual_wake: Optional[str] = None
    actual_sleep: Optional[str] = None

class Setting(BaseModel):
    key: str
    value: str

@app.get("/")
def read_root():
    return {"message": "Atlas backend is running"}

@app.post("/auth/register")
def register(user: UserRegister):
    conn = get_db()
    existing = conn.execute(
        "SELECT id FROM users WHERE username = ? OR email = ?",
        (user.username, user.email)
    ).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cursor = conn.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        (user.username, user.email, password_hash)
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    token = create_token(user_id, user.username)
    return {"access_token": token, "token_type": "bearer", "username": user.username}

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (form_data.username,)
    ).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not bcrypt.checkpw(form_data.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(user['id'], user['username'])
    return {"access_token": token, "token_type": "bearer", "username": user['username']}

@app.get("/tasks")
def get_tasks(user_id: int = Depends(get_current_user)):
    conn = get_db()
    tasks = conn.execute("SELECT * FROM tasks WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(task) for task in tasks]

@app.post("/tasks")
def add_task(task: Task, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO tasks 
        (user_id, taskName, deadline, difficulty, importance, userPreference, duration, taskType, category, workOnDueDate, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user_id, task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        task.workOnDueDate, task.description)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM tasks WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(result)

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: Task, user_id: int = Depends(get_current_user)):
    conn = get_db()
    try:
        conn.execute(
            """UPDATE tasks SET
            taskName = ?, deadline = ?, difficulty = ?, importance = ?,
            userPreference = ?, duration = ?, taskType = ?, category = ?,
            workOnDueDate = ?, description = ?
            WHERE id = ? AND user_id = ?""",
            (task.taskName, task.deadline, task.difficulty, task.importance,
            task.userPreference, task.duration, task.taskType, task.category,
            task.workOnDueDate, task.description, task_id, user_id)
        )
        conn.commit()
        result = conn.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id)).fetchone()
        conn.close()
        return dict(result)
    except Exception as e:
        conn.close()
        print(f"Error updating task: {e}")
        raise

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute("DELETE FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Task deleted"}

@app.patch("/tasks/{task_id}/feedback")
def submit_feedback(task_id: int, feedback: TaskFeedback, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        """UPDATE tasks 
        SET actual_duration = ?, actual_difficulty = ?, completion_status = ?
        WHERE id = ? AND user_id = ?""",
        (feedback.actual_duration, feedback.actual_difficulty, feedback.completion_status, task_id, user_id)
    )
    task = conn.execute("SELECT * FROM tasks WHERE id = ? AND user_id = ?", (task_id, user_id)).fetchone()
    if task:
        conn.execute(
            """INSERT INTO task_history 
            (user_id, task_id, taskName, category, estimated_duration, actual_duration, 
            planned_difficulty, actual_difficulty, completion_status, 
            start_time, end_time, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))""",
            (user_id, task_id, task['taskName'], task['category'], task['duration'],
            feedback.actual_duration, task['difficulty'], feedback.actual_difficulty,
            feedback.completion_status, feedback.start_time, feedback.end_time)
        )
    conn.commit()
    conn.close()
    return {"message": "Feedback saved"}

@app.get("/history")
def get_history(user_id: int = Depends(get_current_user)):
    conn = get_db()
    history = conn.execute(
        "SELECT * FROM task_history WHERE user_id = ? ORDER BY completed_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(h) for h in history]

@app.get("/meals")
def get_meals(user_id: int = Depends(get_current_user)):
    conn = get_db()
    meals = conn.execute("SELECT * FROM meals WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(m) for m in meals]

@app.post("/meals")
def add_meal(meal: Meal, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO meals 
        (user_id, mealName, mealStart, mealEnd, commuteTime, timeMode, flexDuration, flexPreference) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (user_id, meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime,
        meal.timeMode, meal.flexDuration, meal.flexPreference)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM meals WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(result)

@app.put("/meals/{meal_id}")
def update_meal(meal_id: int, meal: Meal, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        """UPDATE meals SET mealName = ?, mealStart = ?, mealEnd = ?, 
        commuteTime = ?, timeMode = ?, flexDuration = ?, flexPreference = ?
        WHERE id = ? AND user_id = ?""",
        (meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime,
        meal.timeMode, meal.flexDuration, meal.flexPreference, meal_id, user_id)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM meals WHERE id = ? AND user_id = ?", (meal_id, user_id)).fetchone()
    conn.close()
    return dict(result)

@app.patch("/meals/{meal_id}/actual")
def log_actual_meal(meal_id: int, data: ActualMealTime, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        "UPDATE meals SET actual_start = ?, actual_end = ? WHERE id = ? AND user_id = ?",
        (data.actual_start, data.actual_end, meal_id, user_id)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM meals WHERE id = ? AND user_id = ?", (meal_id, user_id)).fetchone()
    conn.close()
    return dict(result)

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute("DELETE FROM meals WHERE id = ? AND user_id = ?", (meal_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Meal deleted"}

@app.get("/commitments")
def get_commitments(user_id: int = Depends(get_current_user)):
    conn = get_db()
    commitments = conn.execute("SELECT * FROM commitments WHERE user_id = ?", (user_id,)).fetchall()
    conn.close()
    return [dict(c) for c in commitments]

@app.post("/commitments")
def add_commitment(commitment: Commitment, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cursor = conn.execute(
        """INSERT INTO commitments 
        (user_id, commitmentName, commitmentStart, commitmentEnd, commitmentType, 
        commuteTime, timeMode, flexDuration, flexPreference, days) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (user_id, commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days)
    )
    conn.commit()
    result = conn.execute("SELECT * FROM commitments WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(result)

@app.put("/commitments/{commitment_id}")
def update_commitment(commitment_id: int, commitment: Commitment, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        """UPDATE commitments SET commitmentName = ?, commitmentStart = ?,
        commitmentEnd = ?, commitmentType = ?, commuteTime = ?,
        timeMode = ?, flexDuration = ?, flexPreference = ?, days = ?
        WHERE id = ? AND user_id = ?""",
        (commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days, commitment_id, user_id)
    )
    conn.commit()
    result = conn.execute(
        "SELECT * FROM commitments WHERE id = ? AND user_id = ?",
        (commitment_id, user_id)
    ).fetchone()
    conn.close()
    return dict(result)

@app.delete("/commitments/{commitment_id}")
def delete_commitment(commitment_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute("DELETE FROM commitments WHERE id = ? AND user_id = ?", (commitment_id, user_id))
    conn.commit()
    conn.close()
    return {"message": "Commitment deleted"}

@app.get("/sleep")
def get_sleep(user_id: int = Depends(get_current_user)):
    conn = get_db()
    sleep = conn.execute(
        "SELECT * FROM sleep_schedule WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        (user_id,)
    ).fetchone()
    conn.close()
    if sleep:
        return dict(sleep)
    return None

@app.post("/sleep")
def save_sleep(sleep: SleepSchedule, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute("DELETE FROM sleep_schedule WHERE user_id = ?", (user_id,))
    conn.execute(
        "INSERT INTO sleep_schedule (user_id, wakeTime, sleepTime) VALUES (?, ?, ?)",
        (user_id, sleep.wakeTime, sleep.sleepTime)
    )
    conn.commit()
    conn.close()
    return sleep.model_dump()

@app.patch("/sleep/actual")
def log_actual_sleep(data: ActualSleepTime, user_id: int = Depends(get_current_user)):
    conn = get_db()
    conn.execute(
        """UPDATE sleep_schedule SET actual_wake = ?, actual_sleep = ?
        WHERE user_id = ? AND id = (
            SELECT id FROM sleep_schedule WHERE user_id = ? ORDER BY id DESC LIMIT 1
        )""",
        (data.actual_wake, data.actual_sleep, user_id, user_id)
    )
    conn.commit()
    conn.close()
    return {"message": "Actual sleep logged"}

@app.get("/settings")
def get_settings(user_id: int = Depends(get_current_user)):
    conn = get_db()
    settings = conn.execute(
        "SELECT * FROM settings WHERE user_id = ?",
        (user_id,)
    ).fetchall()
    conn.close()
    return {row['key']: row['value'] for row in settings}

@app.post("/settings")
def save_setting(setting: Setting, user_id: int = Depends(get_current_user)):
    conn = get_db()
    existing = conn.execute(
        "SELECT * FROM settings WHERE user_id = ? AND key = ?",
        (user_id, setting.key)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE settings SET value = ? WHERE user_id = ? AND key = ?",
            (setting.value, user_id, setting.key)
        )
    else:
        conn.execute(
            "INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)",
            (user_id, setting.key, setting.value)
        )
    conn.commit()
    conn.close()
    return setting.model_dump()