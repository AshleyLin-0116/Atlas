import secrets
import threading
import time
import urllib.request
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import httpx
import psycopg2
import psycopg2.extras
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from pydantic import BaseModel
from pywebpush import webpush, WebPushException
import json as jsonlib
from dotenv import load_dotenv
load_dotenv()
import stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.environ.get("STRIPE_PRICE_ID")  # one-time price ID from Stripe dashboard

# ─── CONSTANTS ────────────────────────────────────────────────────────────────

SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://atlas-delta-sable.vercel.app")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://atlas-backend-476l.onrender.com")
BETA_MODE = os.environ.get("BETA_MODE", "false").lower() == "true"
CHAT_DAILY_LIMIT = 50

# ─── APP SETUP ────────────────────────────────────────────────────────────────

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", FRONTEND_URL],
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
        'isrecurring': 'isRecurring',
        'recurringdays': 'recurringDays',
        'recurringtemplateid': 'recurringTemplateId',
        'repeatuntiltype': 'repeatUntilType',
        'repeatuntildate': 'repeatUntilDate',
        'repeatcount': 'repeatCount',
        'startdate': 'startDate',
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
    cur.execute("""
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS isRecurring INTEGER DEFAULT 0
    """)
    cur.execute("""
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurringDays TEXT DEFAULT ''
    """)
    cur.execute("""
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurringTemplateId INTEGER
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS repeatUntilType TEXT DEFAULT 'forever'
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS repeatUntilDate TEXT
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS repeatCount INTEGER
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS startDate TEXT
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notified_blocks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            block_key TEXT NOT NULL,
            notified_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS placeholder_unused TEXT
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS generated_schedules (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            schedule_date TEXT NOT NULL,
            blocks_json TEXT NOT NULL,
            UNIQUE(user_id, schedule_date)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS canvas_credentials (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            canvas_domain TEXT NOT NULL,
            access_token TEXT NOT NULL,
            connected_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        ALTER TABLE tasks ADD COLUMN IF NOT EXISTS externalId TEXT
    """)
    cur.execute("""
        ALTER TABLE commitments ADD COLUMN IF NOT EXISTS externalId TEXT
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS google_calendar_credentials (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            token_expiry TEXT NOT NULL,
            connected_at TEXT DEFAULT (now()::text)
        )
    """)
    cur.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_paid INTEGER DEFAULT 0
    """)
    cur.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_access INTEGER DEFAULT 1
    """)
    cur.execute("""
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_report_day TEXT DEFAULT 'Sunday'
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS chat_usage (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            usage_date TEXT NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            UNIQUE(user_id, usage_date)
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
                urllib.request.urlopen(f'{BACKEND_URL}/')
            except Exception:
                pass
            time.sleep(600)
    t = threading.Thread(target=ping, daemon=True)
    t.start()

keep_alive()

def check_upcoming_blocks():
    while True:
        try:
            conn = get_db()
            cur = conn.cursor()
            now = datetime.now()
            today_str = now.date().isoformat()

            cur.execute(
                "SELECT user_id, blocks_json FROM generated_schedules WHERE schedule_date = %s",
                (today_str,)
            )
            rows = cur.fetchall()

            for row in rows:
                user_id = row['user_id']
                blocks = jsonlib.loads(row['blocks_json'])

                # Load this user's notification preferences
                cur.execute(
                    "SELECT key, value FROM settings WHERE user_id = %s AND key IN (%s, %s)",
                    (user_id, 'notifyLeadMinutes', 'notifyBlockTypes')
                )
                prefs = {r['key']: r['value'] for r in cur.fetchall()}
                lead_minutes = int(prefs.get('notifyLeadMinutes', 10))
                enabled_types = prefs.get('notifyBlockTypes', 'study,peak,meal,commitment').split(',')

                for block in blocks:
                    if block.get('type') not in enabled_types:
                        continue
                    h, m = map(int, block['start'].split(':'))
                    block_time = now.replace(hour=h, minute=m, second=0, microsecond=0)
                    delta = (block_time - now).total_seconds() / 60
                    if 0 <= delta <= lead_minutes:
                        block_key = f"{today_str}-{block['start']}-{block['label']}"
                        cur.execute(
                            "SELECT id FROM notified_blocks WHERE user_id = %s AND block_key = %s",
                            (user_id, block_key)
                        )
                        if cur.fetchone():
                            continue
                        cur.execute(
                            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = %s",
                            (user_id,)
                        )
                        subs = cur.fetchall()
                        for sub in subs:
                            try:
                                webpush(
                                    subscription_info={
                                        "endpoint": sub['endpoint'],
                                        "keys": {"p256dh": sub['p256dh'], "auth": sub['auth']}
                                    },
                                    data=jsonlib.dumps({
                                        "title": "Coming up",
                                        "body": f"{block['label']} starts at {block['start']}"
                                    }),
                                    vapid_private_key=os.environ.get("VAPID_PRIVATE_KEY"),
                                    vapid_claims={"sub": "mailto:you@atlas.app"}
                                )
                            except WebPushException as e:
                                if e.response is not None and e.response.status_code == 410:
                                    cur.execute(
                                        "DELETE FROM push_subscriptions WHERE endpoint = %s",
                                        (sub['endpoint'],)
                                    )
                        cur.execute(
                            "INSERT INTO notified_blocks (user_id, block_key) VALUES (%s, %s)",
                            (user_id, block_key)
                        )
                        conn.commit()
            cur.close()
            conn.close()
        except Exception as err:
            print(f"Push checker error: {err}")
        time.sleep(60)

threading.Thread(target=check_upcoming_blocks, daemon=True).start()

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
    isRecurring: Optional[bool] = False
    recurringDays: Optional[str] = ''

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
    repeatUntilType: Optional[str] = 'forever'
    repeatUntilDate: Optional[str] = None
    repeatCount: Optional[int] = None
    startDate: Optional[str] = None

class SleepSchedule(BaseModel):
    wakeTime: str
    sleepTime: str

class ActualSleepTime(BaseModel):
    actual_wake: Optional[str] = None
    actual_sleep: Optional[str] = None

class Setting(BaseModel):
    key: str
    value: str

class ScheduleSave(BaseModel):
    date: str
    blocks: list

class CanvasCredentials(BaseModel):
    canvas_domain: str
    access_token: str

class GoogleAuthCode(BaseModel):
    code: str

# ─── API HELPERS ───────────────────────────────────────────────────────────────────

async def canvas_get(domain: str, token: str, path: str, params: dict = None):
    """Fetch a single Canvas API page. Canvas paginates — caller handles the Link header if needed."""
    url = f"https://{domain}/api/v1{path}"
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            params=params or {},
            timeout=15.0
        )
        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Canvas token is invalid or expired")
        if not response.is_success:
            raise HTTPException(status_code=502, detail=f"Canvas API error: {response.status_code}")
        return response.json()

def get_canvas_creds(user_id: int, cur):
    cur.execute("SELECT canvas_domain, access_token FROM canvas_credentials WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="Canvas is not connected")
    return row["canvas_domain"], row["access_token"]

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
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user.username,
        "is_paid": False,
        "beta_access": BETA_MODE
    }

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
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user['username'],
        "is_paid": bool(user['is_paid']),
        "beta_access": BETA_MODE or bool(user['beta_access'])
    }

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
    reset_link = f"{FRONTEND_URL}?reset_token={token}"
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

def generate_recurring_instances(user_id, cur):
    day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    cur.execute(
        "SELECT * FROM tasks WHERE user_id = %s AND isRecurring = 1",
        (user_id,)
    )
    templates = cur.fetchall()
    today = datetime.now().date()
    for template in templates:
        days = (template['recurringdays'] or '').split(',')
        days = [d for d in days if d]
        for offset in range(7):
            target_date = today + timedelta(days=offset)
            target_day_name = day_names[(target_date.weekday() + 1) % 7]
            if target_day_name not in days:
                continue
            deadline_str = target_date.isoformat()
            cur.execute(
                "SELECT id FROM tasks WHERE recurringTemplateId = %s AND deadline = %s AND user_id = %s",
                (template['id'], deadline_str, user_id)
            )
            if cur.fetchone():
                continue
            cur.execute(
                """INSERT INTO tasks
                (user_id, taskName, deadline, difficulty, importance, userPreference, duration, taskType, category, workOnDueDate, description, isRecurring, recurringDays, recurringTemplateId)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 0, '', %s)""",
                (user_id, template['taskname'], deadline_str, template['difficulty'], template['importance'],
                template['userpreference'], template['duration'], template['tasktype'], template['category'],
                template['workonduedate'], template['description'], template['id'])
            )

@app.get("/tasks")
def get_tasks(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    generate_recurring_instances(user_id, cur)
    conn.commit()
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
        (user_id, taskName, deadline, difficulty, importance, userPreference, duration, taskType, category, workOnDueDate, description, isRecurring, recurringDays)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (user_id, task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        int(task.workOnDueDate), task.description, int(task.isRecurring), task.recurringDays)
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
        workOnDueDate = %s, description = %s, isRecurring = %s, recurringDays = %s
        WHERE id = %s AND user_id = %s RETURNING *""",
        (task.taskName, task.deadline, task.difficulty, task.importance,
        task.userPreference, task.duration, task.taskType, task.category,
        int(task.workOnDueDate), task.description, int(task.isRecurring), task.recurringDays,
        task_id, user_id)
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
    cur = conn.cursor()
    cc_to = commitment.commuteTimeTo if commitment.commuteTimeTo is not None else commitment.commuteTime
    cc_from = commitment.commuteTimeFrom if commitment.commuteTimeFrom is not None else commitment.commuteTime
    start_date = commitment.startDate or datetime.now().date().isoformat()
    cur.execute(
        """INSERT INTO commitments
        (user_id, commitmentName, commitmentStart, commitmentEnd, commitmentType,
        commuteTime, commuteTimeTo, commuteTimeFrom, timeMode, flexDuration, flexPreference, days, specificDate,
        repeatUntilType, repeatUntilDate, repeatCount, startDate)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
        (user_id, commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime, cc_to, cc_from,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days, commitment.specificDate,
        commitment.repeatUntilType, commitment.repeatUntilDate, commitment.repeatCount, start_date)
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
        specificDate = %s, repeatUntilType = %s, repeatUntilDate = %s, repeatCount = %s
        WHERE id = %s AND user_id = %s RETURNING *""",
        (commitment.commitmentName, commitment.commitmentStart, commitment.commitmentEnd,
        commitment.commitmentType, commitment.commuteTime, c_to, c_from,
        commitment.timeMode, commitment.flexDuration, commitment.flexPreference,
        commitment.days, commitment.specificDate,
        commitment.repeatUntilType, commitment.repeatUntilDate, commitment.repeatCount,
        commitment_id, user_id)
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

def check_and_increment_chat_usage(user_id: int, conn, cur) -> int:
    """Returns current count after increment, raises 429 if over limit."""
    today = datetime.now().date().isoformat()
    cur.execute(
        """INSERT INTO chat_usage (user_id, usage_date, count)
        VALUES (%s, %s, 1)
        ON CONFLICT (user_id, usage_date) DO UPDATE SET count = chat_usage.count + 1
        RETURNING count""",
        (user_id, today)
    )
    count = cur.fetchone()['count']
    conn.commit()
    if count > CHAT_DAILY_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=f"Daily chat limit reached ({CHAT_DAILY_LIMIT} messages). Resets at midnight."
        )
    return count

@app.post("/chat")
async def chat(request: dict, user_id: int = Depends(get_current_user)):
    message = request.get("message", "").strip()
    history = request.get("history", [])
    schedule_context = request.get("schedule_context", {})
    if not message:
        raise HTTPException(status_code=400, detail="Message is required")

    conn = get_db()
    cur = conn.cursor()

    # Rate limit check — raises 429 if exceeded
    check_and_increment_chat_usage(user_id, conn, cur)

    # ── Build schedule context string ──────────────────────────────────────

    cur.execute("""SELECT * FROM tasks WHERE user_id = %s AND (completion_status != 'Completed' OR completion_status IS NULL)""", (user_id,))
    tasks = [normalize(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM sleep_schedule WHERE user_id = %s ORDER BY id DESC LIMIT 1", (user_id,))
    sleep = normalize(cur.fetchone())

    cur.execute("SELECT * FROM meals WHERE user_id = %s", (user_id,))
    meals = [normalize(r) for r in cur.fetchall()]

    cur.execute("SELECT * FROM commitments WHERE user_id = %s", (user_id,))
    commitments = [normalize(r) for r in cur.fetchall()]

    cur.close()
    conn.close()

    from datetime import date
    today = date.today().strftime("%A, %B %d, %Y")

    task_lines = "\n".join(
        f"- {t['taskName']} (due {t['deadline']}, {t['duration']}min, category: {t.get('category','?')})"
        for t in tasks
    ) or "No active tasks."

    meal_lines = "\n".join(
        f"- {m['mealName']}: {m.get('mealStart','flexible')}–{m.get('mealEnd','')}"
        for m in meals
    ) or "No meals set."

    commitment_lines = "\n".join(
        f"- {c['commitmentName']} ({c.get('commitmentType','')}) {c.get('commitmentStart','')}-{c.get('commitmentEnd','')} on {c.get('days','') or c.get('specificDate','')}"
        for c in commitments
    ) or "No commitments."

    sleep_line = f"Wake {sleep['wakeTime']}, sleep {sleep['sleepTime']}" if sleep else "No sleep schedule set."

    today_blocks = schedule_context.get("blocks", [])
    block_lines = "\n".join(
        f"- {b.get('start','')}–{b.get('end','')} {b.get('label','')}"
        for b in today_blocks
        if b.get('type') not in ('sleep', 'buffer')
    ) or "No schedule generated yet for today."

    system_prompt = f"""You are Atlas AI, a friendly and practical scheduling assistant built into the Atlas daily planner app. Today is {today}.

Here is the user's current data:

SLEEP: {sleep_line}

ACTIVE TASKS:
{task_lines}

MEALS:
{meal_lines}

COMMITMENTS:
{commitment_lines}

TODAY'S GENERATED SCHEDULE:
{block_lines}

Use this context to give personalized, specific scheduling advice. Reference their actual tasks and times. Be concise and actionable. If they ask to add or change something, explain what they should do in the app."""

    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": message})

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
                    "system": system_prompt,
                    "messages": messages
                },
                timeout=30.0
            )
            data = response.json()
            return {"reply": data["content"][0]["text"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
    
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

# ── Notification ──

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict

@app.get("/push/vapid-public-key")
def get_vapid_public_key():
    return {"publicKey": os.environ.get("VAPID_PUBLIC_KEY")}

@app.post("/push/subscribe")
def push_subscribe(sub: PushSubscription, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth""",
        (user_id, sub.endpoint, sub.keys.get("p256dh"), sub.keys.get("auth"))
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Subscribed"}

@app.post("/push/unsubscribe")
def push_unsubscribe(body: dict, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM push_subscriptions WHERE endpoint = %s AND user_id = %s",
        (body.get("endpoint"), user_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Unsubscribed"}

@app.post("/schedule/save")
def save_schedule(body: ScheduleSave, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO generated_schedules (user_id, schedule_date, blocks_json)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id, schedule_date) DO UPDATE SET blocks_json = EXCLUDED.blocks_json""",
        (user_id, body.date, jsonlib.dumps(body.blocks))
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Schedule saved"}

# ── Import/Export ──

@app.post("/canvas/connect")
def connect_canvas(creds: CanvasCredentials, user_id: int = Depends(get_current_user)):
    domain = creds.canvas_domain.strip().replace("https://", "").replace("http://", "").rstrip("/")
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO canvas_credentials (user_id, canvas_domain, access_token)
        VALUES (%s, %s, %s)
        ON CONFLICT (user_id) DO UPDATE SET canvas_domain = EXCLUDED.canvas_domain, access_token = EXCLUDED.access_token""",
        (user_id, domain, creds.access_token)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Canvas connected"}

@app.delete("/canvas/disconnect")
def disconnect_canvas(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM canvas_credentials WHERE user_id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Canvas disconnected"}

@app.get("/canvas/status")
def canvas_status(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT canvas_domain, connected_at FROM canvas_credentials WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if not row:
        return {"connected": False}
    return {"connected": True, "domain": row["canvas_domain"], "connected_at": row["connected_at"]}

CANVAS_CATEGORY_MAP_DEFAULT = "Homework"

@app.post("/canvas/sync/assignments")
async def sync_canvas_assignments(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    domain, token = get_canvas_creds(user_id, cur)

    courses = await canvas_get(domain, token, "/courses", {"enrollment_state": "active", "per_page": 100})

    created, updated, skipped = 0, 0, 0

    for course in courses:
        course_id = course.get("id")
        course_name = course.get("name") or f"Course {course_id}"
        try:
            assignments = await canvas_get(
                domain, token, f"/courses/{course_id}/assignments",
                {"per_page": 100, "order_by": "due_at"}
            )
        except HTTPException:
            continue  # some courses restrict assignment access; skip rather than fail the whole sync

        for a in assignments:
            due_at = a.get("due_at")
            if not due_at:
                skipped += 1
                continue  # no deadline — nothing meaningful to schedule against

            deadline = due_at.split("T")[0]
            external_id = f"canvas-assignment-{a['id']}"
            task_name = a.get("name", "Untitled assignment")

            cur.execute(
                "SELECT id FROM tasks WHERE externalId = %s AND user_id = %s",
                (external_id, user_id)
            )
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    "UPDATE tasks SET taskName = %s, deadline = %s WHERE id = %s AND user_id = %s",
                    (task_name, deadline, existing["id"], user_id)
                )
                updated += 1
            else:
                cur.execute(
                    """INSERT INTO tasks
                    (user_id, taskName, deadline, difficulty, importance, userPreference,
                    duration, taskType, category, workOnDueDate, description, externalId)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (user_id, task_name, deadline, 5, 5, 5,
                    60, 'deep', CANVAS_CATEGORY_MAP_DEFAULT, True,
                    f"Imported from {course_name}", external_id)
                )
                created += 1

    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Assignments synced", "created": created, "updated": updated, "skipped": skipped}

@app.post("/canvas/sync/schedule")
async def sync_canvas_schedule(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    domain, token = get_canvas_creds(user_id, cur)

    courses = await canvas_get(domain, token, "/courses", {"enrollment_state": "active", "per_page": 100})

    created, updated, skipped = 0, 0, 0

    for course in courses:
        course_id = course.get("id")
        course_name = course.get("name") or f"Course {course_id}"

        # Canvas exposes recurring meeting info differently per school; the calendar_events
        # feed with type=event catches recurring lecture blocks for most Canvas configs.
        try:
            events = await canvas_get(
                domain, token, "/calendar_events",
                {"type": "event", "context_codes[]": f"course_{course_id}", "per_page": 100}
            )
        except HTTPException:
            continue

        if not events:
            skipped += 1
            continue

        for e in events:
            start_at = e.get("start_at")
            end_at = e.get("end_at")
            if not start_at or not end_at:
                continue

            start_time = start_at.split("T")[1][:5]
            end_time = end_at.split("T")[1][:5]
            weekday_full = datetime.fromisoformat(start_at.replace("Z", "+00:00")).strftime("%A")
            external_id = f"canvas-course-{course_id}-{weekday_full}-{start_time}"

            cur.execute(
                "SELECT id FROM commitments WHERE externalId = %s AND user_id = %s",
                (external_id, user_id)
            )
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    """UPDATE commitments SET commitmentStart = %s, commitmentEnd = %s
                    WHERE id = %s AND user_id = %s""",
                    (start_time, end_time, existing["id"], user_id)
                )
                updated += 1
            else:
                cur.execute(
                    """INSERT INTO commitments
                    (user_id, commitmentName, commitmentStart, commitmentEnd, commitmentType,
                    timeMode, days, repeatUntilType, startDate, externalId)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (user_id, course_name, start_time, end_time, "Lecture / Class",
                    "fixed", weekday_full, "forever",
                    datetime.now().date().isoformat(), external_id)
                )
                created += 1

    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Schedule synced", "created": created, "updated": updated, "skipped_no_events": skipped}

GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.environ.get("GOOGLE_REDIRECT_URI")  # e.g. https://atlas-backend-476l.onrender.com/google/callback

async def get_valid_google_token(user_id: int, cur, conn):
    cur.execute(
        "SELECT access_token, refresh_token, token_expiry FROM google_calendar_credentials WHERE user_id = %s",
        (user_id,)
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=400, detail="Google Calendar is not connected")

    expiry = datetime.fromisoformat(row["token_expiry"])
    if datetime.now(timezone.utc) < expiry - timedelta(minutes=2):
        return row["access_token"]

    # Expired (or about to be) — refresh it
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "refresh_token": row["refresh_token"],
                "grant_type": "refresh_token"
            },
            timeout=15.0
        )
        if not response.is_success:
            raise HTTPException(status_code=401, detail="Google token refresh failed — please reconnect Google Calendar")
        data = response.json()

    new_access_token = data["access_token"]
    new_expiry = (datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])).isoformat()
    cur.execute(
        "UPDATE google_calendar_credentials SET access_token = %s, token_expiry = %s WHERE user_id = %s",
        (new_access_token, new_expiry, user_id)
    )
    conn.commit()
    return new_access_token

@app.get("/google/auth-url")
def get_google_auth_url(user_id: int = Depends(get_current_user)):
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/calendar",
        "access_type": "offline",   # required to get a refresh_token
        "prompt": "consent",        # forces refresh_token on every connect, not just the first
        "state": str(user_id)       # so the callback knows which Atlas user this is
    }
    query = "&".join(f"{k}={httpx.QueryParams({k: v})[k]}" for k, v in params.items())
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{query}"
    return {"url": url}

@app.get("/google/callback")
async def google_callback(code: str, state: str):
    user_id = int(state)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": GOOGLE_REDIRECT_URI
            },
            timeout=15.0
        )
        if not response.is_success:
            raise HTTPException(status_code=400, detail="Google authorization failed")
        data = response.json()

    if "refresh_token" not in data:
        # Happens if the user already granted access before and Google skips issuing a new one.
        # The prompt=consent param above should prevent this, but guard anyway.
        raise HTTPException(status_code=400, detail="No refresh token received — try disconnecting in your Google account permissions and reconnecting")

    expiry = (datetime.now(timezone.utc) + timedelta(seconds=data["expires_in"])).isoformat()
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO google_calendar_credentials (user_id, access_token, refresh_token, token_expiry)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (user_id) DO UPDATE SET access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token, token_expiry = EXCLUDED.token_expiry""",
        (user_id, data["access_token"], data["refresh_token"], expiry)
    )
    conn.commit()
    cur.close()
    conn.close()

    # Redirect back into the app rather than leaving the user on a bare JSON page
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{FRONTEND_URL}?google_connected=true")

@app.delete("/google/disconnect")
def disconnect_google(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("DELETE FROM google_calendar_credentials WHERE user_id = %s", (user_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Google Calendar disconnected"}

@app.get("/google/status")
def google_status(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT connected_at FROM google_calendar_credentials WHERE user_id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return {"connected": bool(row), "connected_at": row["connected_at"] if row else None}

@app.post("/google/sync/import")
async def sync_google_import(user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    access_token = await get_valid_google_token(user_id, cur, conn)

    time_min = datetime.now(timezone.utc).isoformat()
    time_max = (datetime.now(timezone.utc) + timedelta(days=60)).isoformat()

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events",
            headers={"Authorization": f"Bearer {access_token}"},
            params={
                "timeMin": time_min,
                "timeMax": time_max,
                "singleEvents": "true",
                "orderBy": "startTime",
                "maxResults": 250
            },
            timeout=20.0
        )
        if not response.is_success:
            raise HTTPException(status_code=502, detail=f"Google Calendar API error: {response.status_code}")
        events = response.json().get("items", [])

    created, updated, skipped = 0, 0, 0

    for event in events:
        # Skip events Atlas itself created — those get pushed FROM Atlas, not pulled back in
        if event.get("extendedProperties", {}).get("private", {}).get("source") == "atlas":
            continue

        start = event.get("start", {})
        end = event.get("end", {})
        # All-day events use "date" instead of "dateTime" — skip those, they don't fit a time-block schedule
        if "dateTime" not in start or "dateTime" not in end:
            skipped += 1
            continue

        start_dt = datetime.fromisoformat(start["dateTime"])
        end_dt = datetime.fromisoformat(end["dateTime"])
        event_date = start_dt.date().isoformat()
        start_time = start_dt.strftime("%H:%M")
        end_time = end_dt.strftime("%H:%M")
        event_id = event["id"]
        external_id = f"google-{event_id}"
        name = event.get("summary", "Untitled event")

        cur.execute(
            "SELECT id FROM commitments WHERE externalId = %s AND user_id = %s",
            (external_id, user_id)
        )
        existing = cur.fetchone()

        if existing:
            cur.execute(
                """UPDATE commitments SET commitmentName = %s, commitmentStart = %s,
                commitmentEnd = %s, specificDate = %s WHERE id = %s AND user_id = %s""",
                (name, start_time, end_time, event_date, existing["id"], user_id)
            )
            updated += 1
        else:
            cur.execute(
                """INSERT INTO commitments
                (user_id, commitmentName, commitmentStart, commitmentEnd, commitmentType,
                timeMode, specificDate, repeatUntilType, externalId)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (user_id, name, start_time, end_time, "Other",
                "fixed", event_date, "forever", external_id)
            )
            created += 1

    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Google Calendar imported", "created": created, "updated": updated, "skipped_all_day": skipped}

@app.post("/google/sync/export")
async def sync_google_export(body: ScheduleSave, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    access_token = await get_valid_google_token(user_id, cur, conn)

    created, updated, skipped = 0, 0, 0

    async with httpx.AsyncClient() as client:
        for block in body.blocks:
            # Only push meaningful named blocks — skip filler like buffers/transitions/sleep
            if block.get("type") in ("buffer", "sleep", "break"):
                skipped += 1
                continue

            block_key = f"{body.date}-{block['start']}-{block['label']}"
            event_body = {
                "summary": block["label"],
                "start": {"dateTime": f"{body.date}T{block['start']}:00", "timeZone": "America/Chicago"},
                "end": {"dateTime": f"{body.date}T{block['end']}:00", "timeZone": "America/Chicago"},
                "extendedProperties": {"private": {"source": "atlas", "block_key": block_key}}
            }

            # Check if we've already pushed this exact block before (search by our own tag)
            search = await client.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                headers={"Authorization": f"Bearer {access_token}"},
                params={
                    "privateExtendedProperty": f"block_key={block_key}",
                    "timeMin": f"{body.date}T00:00:00Z",
                    "timeMax": f"{body.date}T23:59:59Z"
                },
                timeout=15.0
            )
            existing_events = search.json().get("items", []) if search.is_success else []

            if existing_events:
                event_id = existing_events[0]["id"]
                await client.put(
                    f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{event_id}",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=event_body,
                    timeout=15.0
                )
                updated += 1
            else:
                await client.post(
                    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                    headers={"Authorization": f"Bearer {access_token}"},
                    json=event_body,
                    timeout=15.0
                )
                created += 1

    cur.close()
    conn.close()
    return {"message": "Pushed to Google Calendar", "created": created, "updated": updated, "skipped": skipped}

# ── Weekly Email Report ──

class EmailReportDayBody(BaseModel):
    day: str

class CheckoutSession(BaseModel):
    success_url: str
    cancel_url: str

@app.post("/settings/email-report-day")
def save_email_report_day(body: EmailReportDayBody, user_id: int = Depends(get_current_user)):
    valid_days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    if body.day not in valid_days:
        raise HTTPException(status_code=400, detail="Invalid day")
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET email_report_day = %s WHERE id = %s", (body.day, user_id))
    cur.execute(
        """INSERT INTO settings (user_id, key, value) VALUES (%s, %s, %s)
        ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value""",
        (user_id, 'emailReportDay', body.day)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": "Email report day saved", "day": body.day}

# ── Stripe ──

@app.post("/stripe/create-checkout-session")
async def create_checkout_session(body: CheckoutSession, user_id: int = Depends(get_current_user)):
    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT email, username FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()

    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": STRIPE_PRICE_ID, "quantity": 1}],
        mode="payment",
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        customer_email=user["email"],
        metadata={"user_id": str(user_id)},
    )
    return {"url": session.url}


@app.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    from fastapi import Request
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = int(session["metadata"]["user_id"])
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE users SET is_paid = 1 WHERE id = %s", (user_id,))
        conn.commit()
        cur.close()
        conn.close()

    return {"received": True}

# ─── Weekly Email Cron ────────────────────────────────────────────────────────

CRON_SECRET = os.environ.get("CRON_SECRET", "")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "Atlas <reports@yourdomain.com>")

@app.post("/cron/weekly-email")
async def weekly_email_cron(request: dict = {}):
    secret = request.get("secret", "")
    if CRON_SECRET and secret != CRON_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    conn = get_db()
    cur = conn.cursor()

    today_name = datetime.now().strftime("%A")
    cur.execute(
        "SELECT id, username, email, email_report_day FROM users WHERE email_report_day = %s",
        (today_name,)
    )
    users = cur.fetchall()

    results = []

    for user in users:
        user_id = user['id']

        cur.execute(
            """SELECT taskName, category, estimated_duration, actual_duration, completion_status, completed_at
            FROM task_history
            WHERE user_id = %s AND completed_at >= (now() - interval '7 days')::text
            ORDER BY completed_at DESC""",
            (user_id,)
        )
        history = cur.fetchall()

        total = len(history)
        completed = sum(1 for h in history if h['completion_status'] == 'Completed')
        partial = sum(1 for h in history if h['completion_status'] == 'Partially Completed')
        not_done = sum(1 for h in history if h['completion_status'] == 'Not Completed')
        total_estimated = sum(h['estimated_duration'] or 0 for h in history)
        total_actual = sum(h['actual_duration'] or 0 for h in history)
        accuracy = round((total_estimated / total_actual) * 100, 1) if total_actual > 0 else None

        # Build task summary lines for Claude
        task_lines = "\n".join(
            f"- {h['taskname']} ({h['category'] or 'uncategorized'}): "
            f"{h['completion_status']}, estimated {h['estimated_duration'] or '?'} min, "
            f"actual {h['actual_duration'] or '?'} min"
            for h in history
        ) or "No tasks logged this week."

        stats_block = (
            f"Tasks logged: {total}\n"
            f"Completed: {completed} | Partial: {partial} | Not completed: {not_done}\n"
            f"Total estimated: {int(total_estimated)} min | Total actual: {int(total_actual)} min\n"
            f"Estimation accuracy: {accuracy}%" if accuracy else ""
        )

        # Generate Claude narrative
        narrative = ""
        if RESEND_API_KEY and os.environ.get("ANTHROPIC_API_KEY"):
            try:
                async with httpx.AsyncClient() as client:
                    claude_response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers={
                            "x-api-key": os.environ.get("ANTHROPIC_API_KEY"),
                            "anthropic-version": "2023-06-01",
                            "content-type": "application/json"
                        },
                        json={
                            "model": "claude-sonnet-4-6",
                            "max_tokens": 400,
                            "messages": [{
                                "role": "user",
                                "content": (
                                    f"You are Atlas AI writing a friendly weekly summary email for {user['username']}.\n\n"
                                    f"This week's stats:\n{stats_block}\n\n"
                                    f"Task breakdown:\n{task_lines}\n\n"
                                    "Write 2–3 short, encouraging paragraphs. Mention specific tasks by name where possible. "
                                    "Note patterns (over/underestimation, strong categories). End with one actionable tip. "
                                    "Tone: warm, direct, like a coach. No markdown, plain text only."
                                )
                            }]
                        },
                        timeout=30.0
                    )
                    narrative = claude_response.json()["content"][0]["text"].strip()
            except Exception as e:
                narrative = f"[Narrative generation failed: {e}]"

        # Send via Resend
        sent = False
        if RESEND_API_KEY and user['email']:
            email_body = (
                f"Hi {user['username']},\n\n"
                f"Here's your Atlas weekly report.\n\n"
                f"── THIS WEEK ──\n{stats_block}\n\n"
                + (f"── YOUR WEEK IN REVIEW ──\n{narrative}\n\n" if narrative else "")
                + f"── TASKS LOGGED ──\n{task_lines}\n\n"
                f"Keep it up,\nThe Atlas Team\n"
            )
            try:
                async with httpx.AsyncClient() as client:
                    resend_response = await client.post(
                        "https://api.resend.com/emails",
                        headers={
                            "Authorization": f"Bearer {RESEND_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "from": RESEND_FROM_EMAIL,
                            "to": [user['email']],
                            "subject": f"Your Atlas week in review — {today_name}",
                            "text": email_body
                        },
                        timeout=15.0
                    )
                    sent = resend_response.is_success
            except Exception as e:
                sent = False

        results.append({
            "user_id": user_id,
            "username": user['username'],
            "stats": {"total": total, "completed": completed, "accuracy": accuracy},
            "narrative_chars": len(narrative),
            "email_sent": sent,
        })

    cur.close()
    conn.close()

    return {
        "message": f"Weekly email cron ran for {today_name}",
        "users_matched": len(results),
        "results": results
    }
