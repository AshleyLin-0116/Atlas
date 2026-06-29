import secrets
import threading
import urllib.request
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

SECRET_KEY = "atlas-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# ─── APP SETUP ────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://atlas-delta-sable.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# ─── DATABASE ─────────────────────────────────────────────────────────────────

def get_db():
    conn = psycopg2.connect(
        os.environ.get("DATABASE_URL"),
        cursor_factory=psycopg2.extras.RealDictCursor
    )
    return conn

def normalize(row):
    if not row:
        return None
    key_map = {
        'taskname': 'taskName',
        'tasktype': 'taskType',
        'userpreference': 'userPreference',
        'workonduedate': 'workOnDueDate',
        'mealname': 'mealName',
        'mealstart': 'mealStart',
        'mealend': 'mealEnd',
        'commutetime': 'commuteTime',
        'commutetimeto': 'commuteTimeTo',
        'commutetimefrom': 'commuteTimeFrom',
        'timemode': 'timeMode',
        'flexduration': 'flexDuration',
        'flexpreference': 'flexPreference',
        'commitmentname': 'commitmentName',
        'commitmentstart': 'commitmentStart',
        'commitmentend': 'commitmentEnd',
        'commitmenttype': 'commitmentType',
        'waketime': 'wakeTime',
        'sleeptime': 'sleepTime',
        'specificdate': 'specificDate',
        'commutetimeto': 'commuteTimeTo',
        'commutetimefrom': 'commuteTimeFrom',
    }
    return {key_map.get(k, k): v for k, v in dict(row).items()}

def init_db():
    conn = get_db()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
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
            description TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS task_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            task_id INTEGER REFERENCES tasks(id),
            taskName TEXT,
            category TEXT,
            estimated_duration REAL,
            actual_duration REAL,
            planned_difficulty REAL,
            actual_difficulty REAL,
            completion_status TEXT,
            start_time TEXT,
            end_time TEXT,
            completed_at TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS meals (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            mealName TEXT NOT NULL,
            mealStart TEXT,
            mealEnd TEXT,
            commuteTime INTEGER DEFAULT 0,
            actual_start TEXT,
            actual_end TEXT,
            timeMode TEXT DEFAULT 'fixed',
            flexDuration INTEGER DEFAULT 0,
            flexPreference TEXT DEFAULT 'any'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS commitments (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            commitmentName TEXT NOT NULL,
            commitmentStart TEXT,
            commitmentEnd TEXT,
            commitmentType TEXT,
            commuteTime INTEGER DEFAULT 0,
            timeMode TEXT DEFAULT 'fixed',
            flexDuration INTEGER DEFAULT 0,
            flexPreference TEXT DEFAULT 'any',
            days TEXT DEFAULT '',
        specificDate TEXT
        )
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS specificDate TEXT
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS commuteTimeTo INTEGER
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS commuteTimeFrom INTEGER
    """)
    cur.execute("""
        ALTER TABLE meals ADD COLUMN IF NOT EXISTS commuteTimeTo INTEGER
    """)
    cur.execute("""
        ALTER TABLE meals ADD COLUMN IF NOT EXISTS commuteTimeFrom INTEGER
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sleep_schedule (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            wakeTime TEXT NOT NULL,
            sleepTime TEXT NOT NULL,
            actual_wake TEXT,
            actual_sleep TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS settings (
            user_id INTEGER NOT NULL REFERENCES users(id),
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            PRIMARY KEY (user_id, key)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS task_dependencies (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id),
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            depends_on_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            username TEXT NOT NULL,
            category TEXT NOT NULL,
            comment TEXT NOT NULL,
            submitted_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS partial_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            duration REAL NOT NULL,
            logged_at TEXT DEFAULT (now()::text)
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

init_db()

# ─── KEEP-ALIVE ───────────────────────────────────────────────────────────────

def keep_alive():
    def ping():
        while True:
            try:
                urllib.request.urlopen('https://atlas-backend-476l.onrender.com/')
            except Exception:
                pass
            threading.Event().wait(600)
    t = threading.Thread(target=ping, daemon=True)
    t.start()

keep_alive()

# ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

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

# ─── MODELS ───────────────────────────────────────────────────────────────────

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
    commuteTimeTo: Optional[int] = None
    commuteTimeFrom: Optional[int] = None
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
    commuteTimeTo: Optional[int] = None
    commuteTimeFrom: Optional[int] = None
    timeMode: Optional[str] = 'fixed'
    flexDuration: Optional[int] = 0
    flexPreference: Optional[str] = 'any'
    days: Optional[str] = ''
    specificDate: Optional[str] = None

class SleepSchedule(BaseModel):
    wakeTime: str
    sleepTime: str

class ActualSleepTime(BaseModel):
    actual_wake: Optional[str] = None
    actual_sleep: Optional[str] = None

class Setting(BaseModel):
    key: str
    value: str

# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Atlas backend is running"}

# ── Auth ──

@app.post("/auth/register")
def register(user: UserRegister):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM users WHERE username = %s OR email = %s",
        (user.username, user.email)
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")
    password_hash = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cur.execute(
        "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id",
        (user.username, user.email, password_hash)
    )
    user_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    token = create_token(user_id, user.username)
    return {"access_token": token, "token_type": "bearer", "username": user.username}

@app.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (form_data.username,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not bcrypt.checkpw(form_data.password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_token(user['id'], user['username'])
    return {"access_token": token, "token_type": "bearer", "username": user['username']}

@app.post("/auth/forgot-password")
async def forgot_password(body: dict):
    email = body.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id, username FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    if not user:
        cur.close()
        conn.close()
        return {"message": "If that email exists, a reset link has been sent"}
    token = secrets.token_urlsafe(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    cur.execute(
        "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user['id'], token, expires_at)
    )
    conn.commit()
    cur.close()
    conn.close()
    reset_link = f"https://atlas-delta-sable.vercel.app?reset_token={token}"
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {os.environ.get('SENDGRID_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "personalizations": [{"to": [{"email": email}]}],
                "from": {"email": os.environ.get("SENDGRID_FROM_EMAIL")},
                "subject": "Reset your Atlas password",
                "content": [{
                    "type": "text/plain",
                    "value": f"Hi {user['username']},\n\nClick the link below to reset your Atlas password. This link expires in 1 hour.\n\n{reset_link}\n\nIf you didn't request this, you can ignore this email."
                }]
            }
        )
    return {"message": "If that email exists, a reset link has been sent"}

@app.post("/auth/reset-password")
def reset_password(body: dict):
    token = body.get("token", "").strip()
    new_password = body.get("new_password", "").strip()
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM password_reset_tokens WHERE token = %s AND used = 0", (token,))
    record = cur.fetchone()
    if not record:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")
    expires_at = datetime.fromisoformat(record['expires_at'])
    if datetime.now(timezone.utc) > expires_at:
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="Reset link has expired")
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, record['user_id']))
    cur.execute("UPDATE password_reset_tokens SET used = 1 WHERE token = %s", (token,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Password reset successfully"}

@app.post("/auth/forgot-username")
async def forgot_username(body: dict):
    email = body.get("email", "").strip()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT username FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    if not user:
        return {"message": "If that email exists, your username has been sent"}
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {os.environ.get('SENDGRID_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "personalizations": [{"to": [{"email": email}]}],
                "from": {"email": os.environ.get("SENDGRID_FROM_EMAIL")},
                "subject": "Your Atlas username",
                "content": [{
                    "type": "text/plain",
                    "value": f"Hi,\n\nYour Atlas username is: {user['username']}\n\nIf you didn't request this, you can ignore this email."
                }]
            }
        )
    return {"message": "If that email exists, your username has been sent"}

@app.put("/auth/update-account")
def update_account(body: dict, user_id: int = Depends(get_current_user)):
    current_password = body.get("current_password", "").strip()
    new_username = body.get("new_username", "").strip()
    new_email = body.get("new_email", "").strip()
    new_password = body.get("new_password", "").strip()
    if not current_password:
        raise HTTPException(status_code=400, detail="Current password is required")
    if not new_username and not new_email and not new_password:
        raise HTTPException(status_code=400, detail="At least one field to update is required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    if new_username:
        cur.execute("SELECT id FROM users WHERE username = %s AND id != %s", (new_username, user_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Username already taken")
        cur.execute("UPDATE users SET username = %s WHERE id = %s", (new_username, user_id))
    if new_email:
        cur.execute("SELECT id FROM users WHERE email = %s AND id != %s", (new_email, user_id))
        if cur.fetchone():
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Email already in use")
        cur.execute("UPDATE users SET email = %s WHERE id = %s", (new_email, user_id))
    if new_password:
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, user_id))
    conn.commit()
    cur.close()
    conn.close()
    updated_username = new_username if new_username else user['username']
    return {"message": "Account updated successfully", "username": updated_username}

@app.delete("/auth/delete-account")
def delete_account(body: dict, user_id: int = Depends(get_current_user)):
    current_password = body.get("current_password", "").strip()
    if not current_password:
        raise HTTPException(status_code=400, detail="Password is required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        cur.close()
        conn.close()
        raise HTTPException(status_code=401, detail="Incorrect password")
    cur.execute("DELETE FROM partial_sessions WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM task_dependencies WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM task_history WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM tasks WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM meals WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM commitments WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM sleep_schedule WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM settings WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM feedback WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM password_reset_tokens WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Account deleted"}

# ── Tasks ──

@app.get("/tasks")
def get_tasks(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM tasks WHERE user_id = %s", (user_id,))
    tasks = cur.fetchall()
    result = []
    for task in tasks:
        normalized = normalize(task)
        cur.execute(
            "SELECT depends_on_id FROM task_dependencies WHERE task_id = %s AND user_id = %s",
            (task['id'], user_id)
        )
        normalized['dependencies'] = [row['depends_on_id'] for row in cur.fetchall()]
        result.append(normalized)
    cur.close()
    conn.close()
    return result

@app.post("/tasks")
def add_task(task: Task, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO tasks
        (user_id, taskName, deadline, difficulty, importance, userPreference, duration, taskType, category, workOnDueDate, description)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (user_id, task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        int(task.workOnDueDate), task.description)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: Task, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE tasks SET
        taskName = %s, deadline = %s, difficulty = %s, importance = %s,
        userPreference = %s, duration = %s, taskType = %s, category = %s,
        workOnDueDate = %s, description = %s
        WHERE id = %s AND user_id = %s RETURNING *""",
        (task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        int(task.workOnDueDate), task.description, task_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM task_history WHERE task_id = %s AND user_id = %s", (task_id, user_id))
    cur.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Task deleted"}

@app.patch("/tasks/{task_id}/feedback")
def submit_feedback(task_id: int, feedback: TaskFeedback, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM tasks WHERE id = %s AND user_id = %s",
        (task_id, user_id)
    )
    task = cur.fetchone()
    if not task:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    cur.execute(
        "SELECT COALESCE(SUM(duration), 0) FROM partial_sessions WHERE task_id = %s AND user_id = %s",
        (task_id, user_id)
    )
    previous_total = cur.fetchone()['coalesce']
    if feedback.completion_status == 'Partially Completed':
        cur.execute(
            "INSERT INTO partial_sessions (user_id, task_id, duration) VALUES (%s, %s, %s)",
            (user_id, task_id, feedback.actual_duration)
        )
        cumulative = previous_total + feedback.actual_duration
        cur.execute(
            """UPDATE tasks
            SET actual_duration = %s, actual_difficulty = %s, completion_status = %s
            WHERE id = %s AND user_id = %s""",
            (cumulative, feedback.actual_difficulty, feedback.completion_status, task_id, user_id)
        )
    else:
        cumulative = previous_total + feedback.actual_duration
        cur.execute(
            """UPDATE tasks
            SET actual_duration = %s, actual_difficulty = %s, completion_status = %s
            WHERE id = %s AND user_id = %s""",
            (cumulative, feedback.actual_difficulty, feedback.completion_status, task_id, user_id)
        )
        cur.execute(
            """INSERT INTO task_history
            (user_id, task_id, taskName, category, estimated_duration, actual_duration,
            planned_difficulty, actual_difficulty, completion_status,
            start_time, end_time, completed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, now()::text)""",
            (user_id, task_id, task['taskname'], task['category'], task['duration'],
            cumulative, task['difficulty'], feedback.actual_difficulty,
            feedback.completion_status, feedback.start_time, feedback.end_time)
        )
        cur.execute(
            "DELETE FROM partial_sessions WHERE task_id = %s AND user_id = %s",
            (task_id, user_id)
        )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Feedback saved", "cumulative_duration": cumulative}

@app.get("/tasks/{task_id}/partial-total")
def get_partial_total(task_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT COALESCE(SUM(duration), 0) AS total FROM partial_sessions WHERE task_id = %s AND user_id = %s",
        (task_id, user_id)
    )
    result = cur.fetchone()
    cur.close()
    conn.close()
    return {"total": result['total']}

@app.post("/tasks/{task_id}/dependencies")
def add_dependency(task_id: int, body: dict, user_id: int = Depends(get_current_user)):
    depends_on_id = body.get("depends_on_id")
    if not depends_on_id:
        raise HTTPException(status_code=400, detail="depends_on_id is required")
    if task_id == depends_on_id:
        raise HTTPException(status_code=400, detail="A task cannot depend on itself")
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM tasks WHERE id = %s AND user_id = %s", (depends_on_id, user_id)
    )
    if not cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Dependency task not found")
    cur.execute(
        """INSERT INTO task_dependencies (user_id, task_id, depends_on_id)
        VALUES (%s, %s, %s) ON CONFLICT DO NOTHING""",
        (user_id, task_id, depends_on_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Dependency added"}

@app.delete("/tasks/{task_id}/dependencies/{depends_on_id}")
def remove_dependency(task_id: int, depends_on_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM task_dependencies WHERE task_id = %s AND depends_on_id = %s AND user_id = %s",
        (task_id, depends_on_id, user_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Dependency removed"}

@app.get("/history")
def get_history(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM task_history WHERE user_id = %s ORDER BY completed_at DESC",
        (user_id,)
    )
    history = cur.fetchall()
    cur.close()
    conn.close()
    return [normalize(h) for h in history]

# ── Meals ──

@app.get("/meals")
def get_meals(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM meals WHERE user_id = %s", (user_id,))
    meals = cur.fetchall()
    cur.close()
    conn.close()
    return [normalize(m) for m in meals]

@app.post("/meals")
def add_meal(meal: Meal, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    commute_to = meal.commuteTimeTo if meal.commuteTimeTo is not None else meal.commuteTime
    commute_from = meal.commuteTimeFrom if meal.commuteTimeFrom is not None else meal.commuteTime
    cur.execute(
        """INSERT INTO meals
        (user_id, mealName, mealStart, mealEnd, commuteTime, commuteTimeTo, commuteTimeFrom, timeMode, flexDuration, flexPreference)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (user_id, meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime,
        commute_to, commute_from, meal.timeMode, meal.flexDuration, meal.flexPreference)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.put("/meals/{meal_id}")
def update_meal(meal_id: int, meal: Meal, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    commute_to = meal.commuteTimeTo if meal.commuteTimeTo is not None else meal.commuteTime
    commute_from = meal.commuteTimeFrom if meal.commuteTimeFrom is not None else meal.commuteTime
    cur.execute(
        """UPDATE meals SET mealName = %s, mealStart = %s, mealEnd = %s,
        commuteTime = %s, commuteTimeTo = %s, commuteTimeFrom = %s,
        timeMode = %s, flexDuration = %s, flexPreference = %s
        WHERE id = %s AND user_id = %s RETURNING *""",
        (meal.mealName, meal.mealStart, meal.mealEnd, meal.commuteTime,
        commute_to, commute_from, meal.timeMode, meal.flexDuration, meal.flexPreference,
        meal_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.patch("/meals/{meal_id}/actual")
def log_actual_meal(meal_id: int, data: ActualMealTime, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE meals SET actual_start = %s, actual_end = %s WHERE id = %s AND user_id = %s RETURNING *",
        (data.actual_start, data.actual_end, meal_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.delete("/meals/{meal_id}/actual")
def clear_actual_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "UPDATE meals SET actual_start = NULL, actual_end = NULL WHERE id = %s AND user_id = %s RETURNING *",
        (meal_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.delete("/meals/{meal_id}")
def delete_meal(meal_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM meals WHERE id = %s AND user_id = %s", (meal_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Meal deleted"}

# ── Commitments ──

@app.get("/commitments")
def get_commitments(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM commitments WHERE user_id = %s", (user_id,))
    commitments = cur.fetchall()
    cur.close()
    conn.close()
    return [normalize(c) for c in commitments]

@app.post("/commitments")
def add_commitment(commitment: Commitment, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cc_to = commitment.commuteTimeTo if commitment.commuteTimeTo is not None else commitment.commuteTime
    c_from = commitment.commuteTimeFrom if commitment.commuteTimeFrom is not None else commitment.commuteTime
    cur.execute(
        """INSERT INTO commitments
        (user_id, commitmentName, commitmentStart, commitmentEnd, commitmentType,
        commuteTime, commuteTimeTo, commuteTimeFrom, timeMode, flexDuration, flexPreference, days, specificDate)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (user_id, commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime, c_to, c_from,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days, commitment.specificDate)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.put("/commitments/{commitment_id}")
def update_commitment(commitment_id: int, commitment: Commitment, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    c_to = commitment.commuteTimeTo if commitment.commuteTimeTo is not None else commitment.commuteTime
    c_from = commitment.commuteTimeFrom if commitment.commuteTimeFrom is not None else commitment.commuteTime
    cur.execute(
        """UPDATE commitments SET commitmentName = %s, commitmentStart = %s,
        commitmentEnd = %s, commitmentType = %s, commuteTime = %s,
        commuteTimeTo = %s, commuteTimeFrom = %s,
        timeMode = %s, flexDuration = %s, flexPreference = %s, days = %s,
        specificDate = %s
        WHERE id = %s AND user_id = %s RETURNING *""",
        (commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime, c_to, c_from,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days, commitment.specificDate, commitment_id, user_id)
    )
    result = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return normalize(result)

@app.delete("/commitments/{commitment_id}")
def delete_commitment(commitment_id: int, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM commitments WHERE id = %s AND user_id = %s", (commitment_id, user_id))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Commitment deleted"}

# ── Sleep ──

@app.get("/sleep")
def get_sleep(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM sleep_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1",
        (user_id,)
    )
    sleep = cur.fetchone()
    cur.close()
    conn.close()
    if sleep:
        return normalize(sleep)
    return None

@app.post("/sleep")
def save_sleep(sleep: SleepSchedule, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM sleep_schedule WHERE user_id = %s", (user_id,))
    cur.execute(
        "INSERT INTO sleep_schedule (user_id, wakeTime, sleepTime) VALUES (%s, %s, %s)",
        (user_id, sleep.wakeTime, sleep.sleepTime)
    )
    conn.commit()
    cur.close()
    conn.close()
    return sleep.model_dump()

@app.patch("/sleep/actual")
def log_actual_sleep(data: ActualSleepTime, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE sleep_schedule SET actual_wake = %s, actual_sleep = %s
        WHERE user_id = %s AND id = (
            SELECT id FROM sleep_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1
        )""",
        (data.actual_wake, data.actual_sleep, user_id, user_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Actual sleep logged"}

@app.delete("/sleep/actual")
def clear_actual_sleep(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """UPDATE sleep_schedule SET actual_wake = NULL, actual_sleep = NULL
        WHERE user_id = %s AND id = (
            SELECT id FROM sleep_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1
        )""",
        (user_id, user_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Actual sleep times cleared"}

# ── Settings ──

@app.get("/settings")
def get_settings(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT * FROM settings WHERE user_id = %s", (user_id,))
    settings = cur.fetchall()
    cur.close()
    conn.close()
    return {row['key']: row['value'] for row in settings}

@app.post("/settings")
def save_setting(setting: Setting, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO settings (user_id, key, value) VALUES (%s, %s, %s)
        ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value""",
        (user_id, setting.key, setting.value)
    )
    conn.commit()
    cur.close()
    conn.close()
    return setting.model_dump()

# ── AI ──

@app.post("/parse-task")
async def parse_task(request: dict, user_id: int = Depends(get_current_user)):
    import json
    from datetime import date
    today = date.today().isoformat()
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": os.environ.get("ANTHROPIC_API_KEY"),
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-6",
                    "max_tokens": 1000,
                    "messages": [{
                        "role": "user",
                        "content": f"""Today is {today}. Parse this task description into JSON with these fields:
- taskName (string)
- deadline (YYYY-MM-DD string, infer from context like "next Tuesday" or "next week")
- duration (integer, minutes)
- difficulty (number 0-10)
- importance (number 0-10)
- userPreference (number 0-10, default 5)
- category (one of: Coding, Homework, Reading, Studying, Writing, Project Work, Other)
- description (string, empty if none)
- workOnDueDate (boolean, default true)

Return ONLY valid JSON, no markdown, no explanation.

Task: \"{request['text']}\""""
                    }]
                },
                timeout=30.0
            )
            data = response.json()
            text = data["content"][0]["text"].strip()
            return json.loads(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse task: {str(e)}")
    
# ── Feedback ──

@app.post("/feedback")
async def submit_feedback_form(body: dict, user_id: int = Depends(get_current_user)):
    category = body.get("category", "").strip()
    comment = body.get("comment", "").strip()
    if not category or not comment:
        raise HTTPException(status_code=400, detail="Category and comment are required")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.execute(
        "INSERT INTO feedback (user_id, username, category, comment) VALUES (%s, %s, %s, %s)",
        (user_id, user['username'], category, comment)
    )
    conn.commit()
    cur.close()
    conn.close()
    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {os.environ.get('SENDGRID_API_KEY')}",
                "Content-Type": "application/json"
            },
            json={
                "personalizations": [{"to": [{"email": os.environ.get("SENDGRID_FROM_EMAIL")}]}],
                "from": {"email": os.environ.get("SENDGRID_FROM_EMAIL")},
                "subject": f"Atlas Feedback — {category}",
                "content": [{
                    "type": "text/plain",
                    "value": f"New feedback from {user['username']}:\n\nCategory: {category}\n\nComment:\n{comment}"
                }]
            }
        )
    return {"message": "Feedback submitted — thank you!"}