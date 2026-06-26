import React, { useState, useEffect } from 'react';
import logo from './Atlas_Logo.png';
import './App.css';
import { useTheme, getCategoryFromName, getEmojiForCategory } from './ThemeContext';

// ─── TimePicker ───────────────────────────────────────────────────────────────
function TimePicker({ value, onChange, clockFormat }) {
  const hours24 = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const currentHour = value ? parseInt(value.split(':')[0]) : 0;
  const currentMinute = value ? value.split(':')[1] : '00';
  const currentAmPm = currentHour >= 12 ? 'PM' : 'AM';

  function handleHourChange(e) {
    const h = String(e.target.value).padStart(2, '0');
    onChange(`${h}:${currentMinute}`);
  }

  function handleMinuteChange(e) {
    const h = String(currentHour).padStart(2, '0');
    onChange(`${h}:${e.target.value}`);
  }

  function toggleAmPm() {
    let h = currentHour;
    if (currentAmPm === 'AM') {
      h = h + 12;
    } else {
      h = h - 12;
    }
    onChange(`${String(h).padStart(2, '0')}:${currentMinute}`);
  }

  function displayHour(h) {
    if (clockFormat === '24') {
      return String(h).padStart(2, '0');
    }
    const h12 = h % 12 || 12;
    return String(h12);
  }

  return (
    <span>
      <select value={currentHour} onChange={handleHourChange}>
        {hours24.map((h) => (
          <option key={h} value={h}>{displayHour(h)}</option>
        ))}
      </select>
      :
      <select value={currentMinute} onChange={handleMinuteChange}>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      {clockFormat === '12' && (
        <button type="button" onClick={toggleAmPm}>{currentAmPm}</button>
      )}
    </span>
  );
}

// ─── FlexPreferenceSelect ─────────────────────────────────────────────────────
function FlexPreferenceSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="any">Any time</option>
      <option value="early_morning">Early morning (before 9am)</option>
      <option value="morning">Morning (9am–12pm)</option>
      <option value="afternoon">Afternoon (12pm–5pm)</option>
      <option value="evening">Evening (5pm–9pm)</option>
      <option value="night">Night (after 9pm)</option>
    </select>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
function ProgressBar({ estimated, actual }) {
  if (!estimated || !actual) {
    return null;
  }
  const percentage = Math.min((actual / estimated) * 100, 100);
  const over = actual > estimated;
  return (
    <div style={{ margin: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span>Estimated: {estimated} min</span>
        <span>Actual: {actual} min</span>
      </div>
      <div style={{ background: '#eee', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: over ? '#e74c3c' : '#2ecc71',
          borderRadius: '4px'
        }} />
      </div>
      <p style={{ fontSize: '12px', color: over ? '#e74c3c' : '#2ecc71', margin: '2px 0' }}>
        {over
          ? `Took ${actual - estimated} min longer than estimated`
          : `Finished ${estimated - actual} min under estimate`}
      </p>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const { theme, setTheme, THEMES } = useTheme();

  // ── Navigation & view state ──
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleView, setScheduleView] = useState('week');
  const [selectedDay, setSelectedDay] = useState(new Date());

  // eslint-disable-next-line no-unused-vars
  const DEBUG = process.env.NODE_ENV === 'development';
  const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);

  // ── Auth state ──
  const [token, setToken] = useState(localStorage.getItem('atlas_token') || null);
  const [username, setUsername] = useState(localStorage.getItem('atlas_username') || '');
  const [authMode, setAuthMode] = useState('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [forgotMode, setForgotMode] = useState(null);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  // ── Core data ──
  const [tasks, setTasks] = useState([]);
  const [meals, setMeals] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [history, setHistory] = useState([]);
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [sleepScheduleSaved, setSleepScheduleSaved] = useState(false);
  const [actualWakeTime, setActualWakeTime] = useState('');
  const [actualSleepTime, setActualSleepTime] = useState('');
  const [showSleepFeedback, setShowSleepFeedback] = useState(false);

  // ── Task form ──
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('');
  const [difficulty, setDifficulty] = useState(5);
  const [importance, setImportance] = useState(5);
  const [userPreference, setUserPreference] = useState(5);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [workOnDueDate, setWorkOnDueDate] = useState(true);
  const [autoTaskType, setAutoTaskType] = useState('deep');
  const [userOverrideType, setUserOverrideType] = useState(null);
  const [editingDifficulty, setEditingDifficulty] = useState(false);
  const [editingImportance, setEditingImportance] = useState(false);
  const [editingUserPreference, setEditingUserPreference] = useState(false);

  // ── NL input ──
  const [nlInput, setNlInput] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlError, setNlError] = useState('');

  // ── Task editing ──
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(5);
  const [editImportance, setEditImportance] = useState(5);
  const [editUserPreference, setEditUserPreference] = useState(5);
  const [editDuration, setEditDuration] = useState('');
  const [editTaskType, setEditTaskType] = useState('deep');
  const [editWorkOnDueDate, setEditWorkOnDueDate] = useState(true);
  const [editDescription, setEditDescription] = useState('');

  // ── Task feedback ──
  const [feedbackTaskId, setFeedbackTaskId] = useState(null);
  const [previousDuration, setPreviousDuration] = useState(0);
  const [actualDuration, setActualDuration] = useState('');
  const [actualDifficulty, setActualDifficulty] = useState(5);
  const [completionStatus, setCompletionStatus] = useState('');
  const [editingActualDifficulty, setEditingActualDifficulty] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [manualStartTime, setManualStartTime] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // ── Meal form ──
  const [mealName, setMealName] = useState('');
  const [mealStart, setMealStart] = useState('');
  const [mealEnd, setMealEnd] = useState('');
  const [mealCommuteTime, setMealCommuteTime] = useState(0);
  const [mealTimeMode, setMealTimeMode] = useState('fixed');
  const [mealFlexDuration, setMealFlexDuration] = useState(30);
  const [mealFlexPreference, setMealFlexPreference] = useState('any');

  // ── Meal editing ──
  const [editingMealId, setEditingMealId] = useState(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealStart, setEditMealStart] = useState('');
  const [editMealEnd, setEditMealEnd] = useState('');
  const [editMealCommuteTime, setEditMealCommuteTime] = useState(0);
  const [editMealTimeMode, setEditMealTimeMode] = useState('fixed');
  const [editMealFlexDuration, setEditMealFlexDuration] = useState(30);
  const [editMealFlexPreference, setEditMealFlexPreference] = useState('any');

  // ── Meal feedback ──
  const [mealFeedbackId, setMealFeedbackId] = useState(null);
  const [actualMealStart, setActualMealStart] = useState('');
  const [actualMealEnd, setActualMealEnd] = useState('');

  // ── Commitment form ──
  const [commitmentName, setCommitmentName] = useState('');
  const [commitmentStart, setCommitmentStart] = useState('');
  const [commitmentEnd, setCommitmentEnd] = useState('');
  const [commitmentType, setCommitmentType] = useState('');
  const [commuteTime, setCommuteTime] = useState(0);
  const [commitmentTimeMode, setCommitmentTimeMode] = useState('fixed');
  const [commitmentFlexDuration, setCommitmentFlexDuration] = useState(60);
  const [commitmentFlexPreference, setCommitmentFlexPreference] = useState('any');
  const [commitmentDays, setCommitmentDays] = useState([]);

  // ── Commitment editing ──
  const [editingCommitmentId, setEditingCommitmentId] = useState(null);
  const [editCommitmentName, setEditCommitmentName] = useState('');
  const [editCommitmentStart, setEditCommitmentStart] = useState('');
  const [editCommitmentEnd, setEditCommitmentEnd] = useState('');
  const [editCommitmentType, setEditCommitmentType] = useState('');
  const [editCommitmentCommuteTime, setEditCommitmentCommuteTime] = useState(0);
  const [editCommitmentTimeMode, setEditCommitmentTimeMode] = useState('fixed');
  const [editCommitmentFlexDuration, setEditCommitmentFlexDuration] = useState(60);
  const [editCommitmentFlexPreference, setEditCommitmentFlexPreference] = useState('any');
  const [editCommitmentDays, setEditCommitmentDays] = useState([]);

  // ── Settings ──
  const [clockFormat, setClockFormat] = useState('12');
  const [savedClockFormat, setSavedClockFormat] = useState('12');
  const [maxBlockLength, setMaxBlockLength] = useState(120);
  const [savedMaxBlockLength, setSavedMaxBlockLength] = useState(120);
  const [morningBuffer, setMorningBuffer] = useState(30);
  const [savedMorningBuffer, setSavedMorningBuffer] = useState(30);
  const [nightBuffer, setNightBuffer] = useState(30);
  const [savedNightBuffer, setSavedNightBuffer] = useState(30);
  const [transitionGap, setTransitionGap] = useState(5);
  const [savedTransitionGap, setSavedTransitionGap] = useState(5);
  const [energyPattern, setEnergyPattern] = useState('morning');
  const [savedEnergyPattern, setSavedEnergyPattern] = useState('morning');
  const [showerDuration, setShowerDuration] = useState(15);
  const [savedShowerDuration, setSavedShowerDuration] = useState(15);
  const [showerPreference, setShowerPreference] = useState('morning');
  const [savedShowerPreference, setSavedShowerPreference] = useState('morning');
  const [customDeepKeywords, setCustomDeepKeywords] = useState([]);
  const [customLightKeywords, setCustomLightKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState('deep');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updateAccountMessage, setUpdateAccountMessage] = useState('');
  const [updateAccountError, setUpdateAccountError] = useState('');
  const [deleteAccountPassword, setDeleteAccountPassword] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState('');

  // ── Feedback form ──
  const [feedbackCategory, setFeedbackCategory] = useState('');
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  // ── Schedule ──
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [scheduleSummary, setScheduleSummary] = useState([]);
  const [scheduleFeedback, setScheduleFeedback] = useState({});
  const [flagInput, setFlagInput] = useState({});

  // ── Task dependencies ──
  const [taskDependencies, setTaskDependencies] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [editTaskDependencies, setEditTaskDependencies] = useState([]);

  // ── Authenticated fetch ──
  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      }
    });
  };

  // ── Load data on mount ──
  useEffect(() => {
    if (!token) {
      return;
    }
    authFetch(`${process.env.REACT_APP_API_URL}/tasks`)
      .then((res) => res.json()).then(setTasks)
      .catch((err) => console.error('Failed to load tasks:', err));

    authFetch(`${process.env.REACT_APP_API_URL}/history`)
      .then((res) => res.json()).then(setHistory)
      .catch((err) => console.error('Failed to load history:', err));

    authFetch(`${process.env.REACT_APP_API_URL}/meals`)
      .then((res) => res.json()).then(setMeals)
      .catch((err) => console.error('Failed to load meals:', err));

    authFetch(`${process.env.REACT_APP_API_URL}/commitments`)
      .then((res) => res.json()).then(setCommitments)
      .catch((err) => console.error('Failed to load commitments:', err));

    authFetch(`${process.env.REACT_APP_API_URL}/sleep`)
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setWakeTime(data.wakeTime);
          setSleepTime(data.sleepTime);
          setSleepScheduleSaved(true);
          if (data.actual_wake) {
            setActualWakeTime(data.actual_wake);
          }
          if (data.actual_sleep) {
            setActualSleepTime(data.actual_sleep);
          }
        }
      })
      .catch((err) => console.error('Failed to load sleep schedule:', err));

    authFetch(`${process.env.REACT_APP_API_URL}/settings`)
      .then((res) => res.json())
      .then((data) => {
        if (data.clockFormat) { 
          setSavedClockFormat(data.clockFormat); 
          setClockFormat(data.clockFormat); 
        }
        if (data.maxBlockLength) { 
          setSavedMaxBlockLength(Number(data.maxBlockLength)); 
          setMaxBlockLength(Number(data.maxBlockLength)); 
        }
        if (data.morningBuffer) { 
          setSavedMorningBuffer(Number(data.morningBuffer)); 
          setMorningBuffer(Number(data.morningBuffer)); 
        }
        if (data.nightBuffer) { 
          setSavedNightBuffer(Number(data.nightBuffer)); 
          setNightBuffer(Number(data.nightBuffer)); 
        }
        if (data.transitionGap) { 
          setSavedTransitionGap(Number(data.transitionGap)); 
          setTransitionGap(Number(data.transitionGap)); 
        }
        if (data.showerDuration) { 
          setSavedShowerDuration(Number(data.showerDuration)); 
          setShowerDuration(Number(data.showerDuration)); 
        }
        if (data.showerPreference) { 
          setSavedShowerPreference(data.showerPreference); 
          setShowerPreference(data.showerPreference); 
        }
        if (data.energyPattern) { 
          setSavedEnergyPattern(data.energyPattern); 
          setEnergyPattern(data.energyPattern); 
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────────────────────────────────────
  function handleRegister() {
    if (!authUsername.trim() || !authEmail.trim() || !authPassword.trim()) {
      setAuthError('All fields are required.');
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authUsername.trim(), email: authEmail.trim(), password: authPassword })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail); });
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('atlas_token', data.access_token);
        localStorage.setItem('atlas_username', data.username);
        setToken(data.access_token);
        setUsername(data.username);
        setAuthError('');
      })
      .catch((err) => setAuthError(err.message));
  }

  function handleLogin() {
    if (!authUsername.trim() || !authPassword.trim()) { 
      setAuthError('Username and password are required.'); 
      return; 
    }
    const formData = new URLSearchParams();
    formData.append('username', authUsername.trim());
    formData.append('password', authPassword);
    fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail); });
        }
        return res.json();
      })
      .then((data) => {
        localStorage.setItem('atlas_token', data.access_token);
        localStorage.setItem('atlas_username', data.username);
        setToken(data.access_token);
        setUsername(data.username);
        setAuthError('');
      })
      .catch((err) => setAuthError(err.message));
  }

  function handleLogout() {
    localStorage.removeItem('atlas_token');
    localStorage.removeItem('atlas_username');
    setToken(null); setUsername('');
    setTasks([]); setMeals([]); setCommitments([]); setHistory([]);
    setWakeTime(''); setSleepTime(''); setSleepScheduleSaved(false);
    setGeneratedSchedule([]);
  }

  function handleForgotSubmit() {
    if (!forgotEmail.trim()) {
      setForgotMessage('Please enter your email address.');
      return;
    }
    const endpoint = forgotMode === 'password' ? '/auth/forgot-password' : '/auth/forgot-username';
    fetch(`${process.env.REACT_APP_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmail.trim() })
    })
      .then((res) => res.json())
      .then((data) => setForgotMessage(data.message))
      .catch(() => setForgotMessage('Something went wrong — please try again.'));
  }

  function handleResetPassword() {
    if (!resetPassword.trim()) {
      setResetError('Please enter a new password.');
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    fetch(`${process.env.REACT_APP_API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, new_password: resetPassword })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail); });
        }
        return res.json();
      })
      .then(() => {
        setResetMessage('Password reset successfully — you can now log in.');
        setResetToken(null);
        setResetPassword('');
        setResetConfirmPassword('');
      })
      .catch((err) => setResetError(err.message));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────
  function getWeekDays() {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }

  function getMonthLabel() {
    const days = getWeekDays();
    const start = days[0];
    const end = days[6];
    if (start.getMonth() === end.getMonth()) {
      return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return `${start.toLocaleDateString('en-US', { month: 'short' })} – ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }

  function getWeekRangeLabel() {
    const days = getWeekDays();
    const start = days[0];
    const end = days[6];
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  function isSameDay(a, b) {
    return a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear();
  }

  function getBlocksForDay(date) {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const blocks = [];
    meals.forEach((meal) => {
      if (meal.mealStart && meal.mealEnd) {
        blocks.push({
          label: meal.mealName,
          start: meal.actual_start || meal.mealStart,
          end: meal.actual_end || meal.mealEnd,
          category: 'meal',
          location: null,
        });
      }
    });
    commitments.forEach((commitment) => {
      if (commitment.commitmentStart && commitment.commitmentEnd) {
        const days = commitment.days ? commitment.days.split(',').filter(Boolean) : [];
        if (days.length === 0 || days.includes(dayName)) {
          blocks.push({
            label: commitment.commitmentName,
            start: commitment.commitmentStart,
            end: commitment.commitmentEnd,
            category: 'commitment',
            location: null,
          });
        }
      }
    });
    if (wakeTime) {
      blocks.push({ label: 'Sleep', start: '00:00', end: wakeTime, category: 'sleep', location: null });
    }
    if (sleepTime) {
      blocks.push({ label: 'Sleep', start: sleepTime, end: '23:59', category: 'sleep', location: null });
    }
    generatedSchedule.forEach((block) => {
      if (['study', 'peak', 'break', 'buffer', 'shower'].includes(block.type)) {
        blocks.push({
          label: block.label,
          start: block.start,
          end: block.end,
          category: getCategoryFromName(block.label),
          location: null,
        });
      }
    });
    return blocks.sort((a, b) => a.start.localeCompare(b.start));
  }

  function getBlockTopPercent(timeStr, dayStart = '06:00', dayEnd = '23:00') {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const total = toMin(dayEnd) - toMin(dayStart);
    const offset = toMin(timeStr) - toMin(dayStart);
    return Math.max(0, Math.min(100, (offset / total) * 100));
  }

  function getBlockHeightPercent(startStr, endStr, dayStart = '06:00', dayEnd = '23:00') {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const total = toMin(dayEnd) - toMin(dayStart);
    const dur = toMin(endStr) - toMin(startStr);
    return Math.max(2, (dur / total) * 100);
  }

  function getNowPercent(dayStart = '06:00', dayEnd = '23:00') {
    const now = new Date();
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const total = toMin(dayEnd) - toMin(dayStart);
    const offset = now.getHours() * 60 + now.getMinutes() - toMin(dayStart);
    return Math.max(0, Math.min(100, (offset / total) * 100));
  }

  function formatTime(time) {
    if (!time) {
      return '';
    }
    if (savedClockFormat === '24') {
      return time;
    }
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }

  function toggleDay(day, days, setDays) {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    }
    else setDays([...days, day]);
  }

  function saveSetting(key, value) {
    authFetch(`${process.env.REACT_APP_API_URL}/settings`, {
      method: 'POST',
      body: JSON.stringify({ key, value: String(value) })
    })
      .then((res) => res.json())
      .then(() => {})
      .catch((err) => console.error('Failed to save setting:', err));
  }

  function classifyTask(name, diff) {
    const deepKeywords = ['study', 'code', 'write', 'program', 'research', 'homework', 'assignment', 'project', 'exam', 'problem set', 'essay', 'lab report'];
    const lightKeywords = ['review', 'flashcard', 'read', 'watch', 'organize', 'plan', 'email', 'admin', 'quiz recap'];
    const lower = name.toLowerCase();
    if (customDeepKeywords.some((k) => lower.includes(k))) {
      return 'deep';
    }
    if (customLightKeywords.some((k) => lower.includes(k))) {
      return 'light';
    }
    const hasDeep = deepKeywords.some((k) => lower.includes(k));
    const hasLight = lightKeywords.some((k) => lower.includes(k));
    if (hasDeep && hasLight) {
      return 'deep';
    }
    if (hasDeep) {
      return 'deep';
    }
    if (hasLight) {
      return 'light';
    }
    if (Number(diff) >= 5) {
      return 'deep';
    }
    return 'light';
  }

  function getBlockDuration(start, end) {
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let s = toMin(start); let e = toMin(end);
    if (e <= s) {
      e += 1440;
    }
    const diff = e - s;
    const hours = Math.floor(diff / 60); 
    const mins = diff % 60;
    if (hours === 0) {
      return `${mins} minutes`;
    }
    if (mins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minutes`;
  }

  function isBlocked(task) {
    if (!task.dependencies || task.dependencies.length === 0) {
      return false;
    }
    return task.dependencies.some((depId) => {
      const dep = tasks.find((t) => t.id === depId);
      return !dep || !dep.completion_status;
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────────
  function calculatePriorityScore(task) {
    const today = new Date();
    const deadlineDate = new Date(task.deadline);
    const daysUntilDeadline = Math.max(0, (deadlineDate - today) / (1000 * 60 * 60 * 24));
    const effectiveDays = task.workOnDueDate ? daysUntilDeadline : Math.max(0, daysUntilDeadline - 1);
    const urgency = effectiveDays === 0 ? 1 : Math.max(0, 1 - effectiveDays / 30);
    const imp = Number(task.importance) / 10;
    const pref = Number(task.userPreference) / 10;
    const diff = Number(task.difficulty) / 10;
    let consistency = 0.5;
    if (task.category) {
      const catHistory = history.filter((h) => h.category === task.category && h.completion_status);
      if (catHistory.length >= 2) {
        const completed = catHistory.filter((h) => h.completion_status === 'Completed').length;
        consistency = completed / catHistory.length;
      }
    }
    const score = 0.35 * urgency + 0.25 * imp + 0.20 * pref + 0.15 * diff + 0.05 * consistency;
    return (score * 100).toFixed(1);
  }

  function getCategoryMultipliers() {
    const categories = {};
    history.forEach((h) => {
      if (!h.category || !h.estimated_duration || !h.actual_duration || h.actual_duration === 0) {
        return;
      }
      if (!categories[h.category]) {
        categories[h.category] = { totalEstimated: 0, totalActual: 0, count: 0 };
      }
      categories[h.category].totalEstimated += h.estimated_duration;
      categories[h.category].totalActual += h.actual_duration;
      categories[h.category].count++;
    });
    const multipliers = {};
    for (const [cat, data] of Object.entries(categories)) {
      if (data.count >= 2) {
        multipliers[cat] = data.totalActual / data.totalEstimated;
      }
    }
    return multipliers;
  }

  function getTaskKey(task) {
    if (!task.taskName) {
      return task.category || 'uncategorized';
    }
    const stopWords = ['homework', 'assignment', 'project', 'work', 'study', 'for', 'the', 'and', 'a', 'an', 'of', 'to'];
    const words = task.taskName.toLowerCase().split(/\s+/).map((w) => w.replace(/[^a-z]/g, '')).filter((w) => w.length > 2 && !stopWords.includes(w));
    if (words.length === 0) {
      return task.category || 'uncategorized';
    }
    return words[0];
  }

  function getTaskMultiplier(task) {
    const taskKey = getTaskKey(task);
    const taskMatches = history.filter((h) => {
      if (!h.estimated_duration || !h.actual_duration || h.actual_duration === 0) {
        return false;
      }
      return getTaskKey({ taskName: h.taskName, category: h.category }) === taskKey;
    });
    if (taskMatches.length >= 2) {
      const totalEstimated = taskMatches.reduce((sum, h) => sum + h.estimated_duration, 0);
      const totalActual = taskMatches.reduce((sum, h) => sum + h.actual_duration, 0);
      return { multiplier: totalActual / totalEstimated, source: 'task', key: taskKey };
    }
    const categoryMultipliers = getCategoryMultipliers();
    if (task.category && categoryMultipliers[task.category]) {
      return { multiplier: categoryMultipliers[task.category], source: 'category', key: task.category };
    }
    return { multiplier: 1, source: 'none', key: null };
  }

  function calculateAccuracy(estimated, actual) {
    if (!estimated || !actual || actual === 0) {
      return null;
    }
    return Math.min((estimated / actual) * 100, 100).toFixed(1);
  }

  function calculateAvailableTime() {
    if (!wakeTime || !sleepTime) {
      return null;
    }
    const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); const total = h * 60 + m; return total === 0 ? 1440 : total; };
    const effectiveWake = wakeTime;
    const effectiveSleep = sleepTime;
    const wake = toMinutes(effectiveWake) + savedMorningBuffer;
    let sleep = toMinutes(effectiveSleep) - savedNightBuffer;
    if (sleep <= toMinutes(effectiveWake)) {
      sleep += 1440;
    }
    const totalTime = sleep - wake;
    const mealTime = meals.reduce((total, meal) => {
      if (meal.timeMode === 'flexible') {
        return total + (meal.flexDuration || 0);
      }
      if (!meal.mealStart || !meal.mealEnd) {
        return total;
      }
      return total + (toMinutes(meal.mealEnd) - toMinutes(meal.mealStart));
    }, 0);
    const commitmentTime = commitments.reduce((total, commitment) => {
      if (commitment.timeMode === 'flexible') {
        return total + (commitment.flexDuration || 0);
      }
      if (!commitment.commitmentStart || !commitment.commitmentEnd) {
        return total;
      }
      return total + (toMinutes(commitment.commitmentEnd) - toMinutes(commitment.commitmentStart));
    }, 0);
    const taskTime = tasks.reduce((total, task) => total + (task.duration ? Number(task.duration) : 0), 0);
    return { totalTime, mealTime, commitmentTime, taskTime, availableTime: totalTime - mealTime - commitmentTime - taskTime };
  }

  function calculateStreak() {
    if (history.length === 0) {
      return 0;
    }
    const completedDates = [...new Set(
      history.filter((h) => h.completion_status === 'Completed' && h.completed_at).map((h) => h.completed_at.split('T')[0])
    )].sort((a, b) => b.localeCompare(a));
    if (completedDates.length === 0) {
      return 0;
    }
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < completedDates.length; i++) {
      const date = new Date(completedDates[i]);
      date.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (date.getTime() === expectedDate.getTime()) {
        streak++;
      }
      else break;
    }
    return streak;
  }

  function calculateCategoryStats() {
    const categories = {};
    history.forEach((h) => {
      if (!h.category) {
        return;
      }
      if (!categories[h.category]) {
        categories[h.category] = { count: 0, totalEstimated: 0, totalActual: 0, totalAccuracy: 0, completed: 0, notCompleted: 0, partiallyCompleted: 0 };
      }
      const cat = categories[h.category];
      cat.count++;
      cat.totalEstimated += h.estimated_duration || 0;
      cat.totalActual += h.actual_duration || 0;
      if (h.estimated_duration && h.actual_duration) {
        cat.totalAccuracy += Math.min((h.estimated_duration / h.actual_duration) * 100, 100);
      }
      if (h.completion_status === 'Completed') {
        cat.completed++;
      }
      else if (h.completion_status === 'Partially Completed') {
        cat.partiallyCompleted++;
      }
      else if (h.completion_status === 'Not Completed') {
        cat.notCompleted++;
      }
    });
    return categories;
  }

  function calculateWeeklyStats() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekHistory = history.filter((h) => h.completed_at && new Date(h.completed_at) >= oneWeekAgo);
    const totalEstimated = weekHistory.reduce((sum, h) => sum + (h.estimated_duration || 0), 0);
    const totalActual = weekHistory.reduce((sum, h) => sum + (h.actual_duration || 0), 0);
    const completed = weekHistory.filter((h) => h.completion_status === 'Completed').length;
    const partial = weekHistory.filter((h) => h.completion_status === 'Partially Completed').length;
    const notCompleted = weekHistory.filter((h) => h.completion_status === 'Not Completed').length;
    const byCategory = {};
    weekHistory.forEach((h) => {
      if (!h.category) {
        return;
      }
      if (!byCategory[h.category]) {
        byCategory[h.category] = { estimated: 0, actual: 0, count: 0 };
      }
      byCategory[h.category].estimated += h.estimated_duration || 0;
      byCategory[h.category].actual += h.actual_duration || 0;
      byCategory[h.category].count++;
    });
    const validH = weekHistory.filter((h) => h.estimated_duration && h.actual_duration);
    const overallAccuracy = validH.length > 0
      ? (validH.reduce((sum, h) => sum + Math.min((h.estimated_duration / h.actual_duration) * 100, 100), 0) / validH.length).toFixed(1)
      : null;
    return { count: weekHistory.length, totalEstimated, totalActual, completed, partial, notCompleted, byCategory, overallAccuracy };
  }

  function calculateProductiveTime() {
    const periods = {
      'Early Morning (12:00am-6:00am)': { start: 0, end: 6, completed: 0, total: 0 },
      'Morning (6:00am-12:00pm)': { start: 6, end: 12, completed: 0, total: 0 },
      'Afternoon (12:00pm-5:00pm)': { start: 12, end: 17, completed: 0, total: 0 },
      'Evening (5:00pm-10:00pm)': { start: 17, end: 22, completed: 0, total: 0 },
      'Night (10:00pm-12:00am)': { start: 22, end: 24, completed: 0, total: 0 }
    };
    history.forEach((h) => {
      if (!h.start_time) {
        return;
      }
      const startHour = new Date(h.start_time).getHours();
      // eslint-disable-next-line no-unused-vars
      for (const [_period, data] of Object.entries(periods)) {
        if (startHour >= data.start && startHour < data.end) {
          data.total++;
          if (h.completion_status === 'Completed') {
            data.completed++;
          }
          break;
        }
      }
    });
    return periods;
  }

  function getMostProductivePeriod() {
    const periods = calculateProductiveTime();
    let bestPeriod = null; let bestRate = -1;
    for (const [period, data] of Object.entries(periods)) {
      if (data.total === 0) {
        continue;
      }
      const rate = (data.completed / data.total) * 100;
      if (rate > bestRate) { 
        bestRate = rate; 
        bestPeriod = period; 
      }
    }
    return { period: bestPeriod, rate: bestRate.toFixed(1) };
  }

  function generateSuggestions() {
    const suggestions = [];
    const multipliers = getCategoryMultipliers();
    for (const [cat, m] of Object.entries(multipliers)) {
      if (m > 1.3) {
        suggestions.push(`You tend to underestimate ${cat} tasks by ${((m - 1) * 100).toFixed(0)}% — try adding ${Math.round((m - 1) * 100)}% more time when estimating.`);
      }
      else if (m < 0.7) {
        suggestions.push(`You finish ${cat} tasks faster than expected — your estimates may be too conservative.`);
      }
    }
    const best = getMostProductivePeriod();
    if (best.period && parseFloat(best.rate) >= 70) {
      suggestions.push(`Your best work happens during ${best.period} (${best.rate}% completion rate) — try scheduling deep work then.`);
    }
    const dueTodayOrTomorrow = tasks.filter((t) => {
      if (t.completion_status === 'Completed') {
        return false;
      }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const dl = new Date(t.deadline); dl.setHours(0, 0, 0, 0);
      return dl <= tomorrow;
    });
    const overdueTasks = tasks.filter((t) => {
      if (t.completion_status === 'Completed') {
        return false;
      }
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return new Date(t.deadline) < today;
    });
    if (dueTodayOrTomorrow.length > 0 && overdueTasks.length === 0) {
      suggestions.push(`${dueTodayOrTomorrow.map((t) => t.taskName).join(', ')} ${dueTodayOrTomorrow.length > 1 ? 'are' : 'is'} due today or tomorrow — prioritize these.`);
    }
    const week = calculateWeeklyStats();
    if (week.count >= 3 && week.overallAccuracy && parseFloat(week.overallAccuracy) < 60) {
      suggestions.push(`Your estimation accuracy this week is ${week.overallAccuracy}% — try breaking tasks into smaller chunks for better estimates.`);
    }
    return suggestions;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCHEDULE GENERATION
  // ─────────────────────────────────────────────────────────────────────────────
  function generateSchedule() {
    if (!wakeTime || !sleepTime) {
      return [];
    }
    const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); const total = h * 60 + m; return total === 0 ? 1440 : total; };
    const toTimeString = (minutes) => { const wrapped = minutes % 1440; const h = Math.floor(wrapped / 60); const m = wrapped % 60; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
    const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const effectiveWake = wakeTime;
    const effectiveSleep = sleepTime;
    const wake = toMinutes(effectiveWake) + savedMorningBuffer;
    let sleep = toMinutes(effectiveSleep) - savedNightBuffer;
    if (sleep <= toMinutes(effectiveWake)) {
      sleep += 1440;
    }

    const blockedRanges = [
      ...meals.flatMap((meal) => {
        if (meal.timeMode === 'flexible' || !meal.mealStart || !meal.mealEnd) {
          return [];
        }
        const start = meal.actual_start || meal.mealStart;
        const end = meal.actual_end || meal.mealEnd;
        const blocks = [{ start: toMinutes(start), end: toMinutes(end), label: meal.mealName, type: 'meal' }];
        if (meal.commuteTime > 0) {
          blocks.unshift({ start: toMinutes(start) - meal.commuteTime, end: toMinutes(start), label: `Commute to ${meal.mealName}`, type: 'commute' });
          blocks.push({ start: toMinutes(end), end: toMinutes(end) + meal.commuteTime, label: `Commute back from ${meal.mealName}`, type: 'commute' });
        }
        return blocks;
      }),
      ...commitments.flatMap((commitment) => {
        if (commitment.timeMode === 'flexible' || !commitment.commitmentStart || !commitment.commitmentEnd) {
          return [];
        }
        if (commitment.days && commitment.days.length > 0) {
          const dayList = commitment.days.split(',').filter(Boolean);
          if (!dayList.includes(todayName)) {
            return [];
          }
        }
        const blocks = [{ start: toMinutes(commitment.commitmentStart), end: toMinutes(commitment.commitmentEnd), label: commitment.commitmentName, type: 'commitment' }];
        if (commitment.commuteTime > 0) {
          blocks.unshift({ start: toMinutes(commitment.commitmentStart) - commitment.commuteTime, end: toMinutes(commitment.commitmentStart), label: `Commute to ${commitment.commitmentName}`, type: 'commute' });
          blocks.push({ start: toMinutes(commitment.commitmentEnd), end: toMinutes(commitment.commitmentEnd) + commitment.commuteTime, label: `Commute back from ${commitment.commitmentName}`, type: 'commute' });
        }
        return blocks;
      })
    ].sort((a, b) => a.start - b.start);

    if (savedShowerPreference === 'morning' || savedShowerPreference === 'both') {
      blockedRanges.push({ start: wake, end: wake + savedShowerDuration, label: 'Shower', type: 'shower' });
    }
    if (savedShowerPreference === 'evening' || savedShowerPreference === 'both') {
      const eveningShowerStart = toMinutes(effectiveSleep) - savedNightBuffer - savedShowerDuration;
      blockedRanges.push({ start: eveningShowerStart, end: eveningShowerStart + savedShowerDuration, label: 'Shower', type: 'shower' });
    }
    blockedRanges.sort((a, b) => a.start - b.start);

    const schedule = [];
    schedule.push({ start: toTimeString(toMinutes(effectiveWake)), end: toTimeString(wake), label: 'Morning routine', type: 'buffer' });
    for (const range of blockedRanges) schedule.push({ start: toTimeString(range.start), end: toTimeString(range.end), label: range.label, type: range.type });
    schedule.push({ start: toTimeString(toMinutes(effectiveSleep) - savedNightBuffer), end: toTimeString(toMinutes(effectiveSleep)), label: 'Wind down', type: 'buffer' });

    const getPeakHours = () => {
      if (savedEnergyPattern === 'morning') {
        return { start: 6 * 60, end: 12 * 60 };
      }
      if (savedEnergyPattern === 'afternoon') {
        return { start: 12 * 60, end: 17 * 60 };
      }
      if (savedEnergyPattern === 'evening') {
        return { start: 17 * 60, end: 22 * 60 };
      }
      return null;
    };
    const peakHours = getPeakHours();
    const isInPeak = (time) => peakHours ? time >= peakHours.start && time < peakHours.end : false;

    const isOccupied = (start, end) => schedule.some((block) => start < toMinutes(block.end) && end > toMinutes(block.start));
    const getNextFreeStart = (from) => {
      let time = from; let safetyCounter = 0;
      while (safetyCounter < 1000) {
        safetyCounter++;
        if (time >= sleep) {
          return sleep;
        }
        if (!isOccupied(time, time + 1)) {
          return time;
        }
        time++;
      }
      return sleep;
    };

    const getPreferenceWindow = (preference) => {
      if (preference === 'early_morning') {
        return { start: 0, end: 9 * 60 };
      }
      if (preference === 'morning') {
        return { start: 9 * 60, end: 12 * 60 };
      }
      if (preference === 'afternoon') {
        return { start: 12 * 60, end: 17 * 60 };
      }
      if (preference === 'evening') {
        return { start: 17 * 60, end: 21 * 60 };
      }
      if (preference === 'night') {
        return { start: 21 * 60, end: sleep };
      }
      return { start: wake, end: sleep };
    };

    const isTooCloseToMeal = (start, end) => schedule.some((block) => {
      if (block.type !== 'meal') {
        return false;
      }
      const blockStart = toMinutes(block.start); const blockEnd = toMinutes(block.end);
      return start < blockEnd + 300 && end > blockStart - 300;
    });

    const placeFlexBlock = (label, dur, preference, type, commute = 0) => {
      const totalDuration = dur + (commute * 2);
      const window = getPreferenceWindow(preference);
      const windowStart = Math.max(wake, window.start);
      const windowEnd = Math.min(sleep, window.end);
      let start = getNextFreeStart(windowStart);

      const tryPlace = (t) => {
        if (commute > 0) {
          schedule.push({ start: toTimeString(t), end: toTimeString(t + commute), label: `Commute to ${label}`, type: 'commute' });
        }
        schedule.push({ start: toTimeString(t + commute), end: toTimeString(t + commute + dur), label, type });
        if (commute > 0) {
          schedule.push({ start: toTimeString(t + commute + dur), end: toTimeString(t + totalDuration), label: `Commute back from ${label}`, type: 'commute' });
        }
      };

      while (start + totalDuration <= windowEnd) {
        if (!isOccupied(start, start + totalDuration) && (type !== 'meal' || !isTooCloseToMeal(start, start + totalDuration))) {
          tryPlace(start); return true;
        }
        start++;
      }

      // Fallback: try other windows in sensible order
      const fallbackPreferences = ['evening', 'afternoon', 'morning', 'early_morning', 'night'];
      for (const pref of fallbackPreferences) {
        if (pref === preference) {
          continue;
        }
        const w = getPreferenceWindow(pref);
        const wStart = Math.max(wake, w.start); const wEnd = Math.min(sleep, w.end);
        let t = getNextFreeStart(wStart);
        while (t + totalDuration <= wEnd) {
          if (!isOccupied(t, t + totalDuration) && (type !== 'meal' || !isTooCloseToMeal(t, t + totalDuration))) {
            tryPlace(t); 
            return true;
          }
          t++;
        }
      }
      return false;
    };

    // Place flexible meals and commitments
    for (const meal of meals) {
      if (meal.timeMode === 'flexible' && meal.flexDuration > 0) {
        placeFlexBlock(meal.mealName, meal.flexDuration, meal.flexPreference || 'any', 'meal', meal.commuteTime || 0);
      }
    }
    for (const commitment of commitments) {
      if (commitment.timeMode === 'flexible' && commitment.flexDuration > 0) {
        if (commitment.days && commitment.days.length > 0) {
          const dayList = commitment.days.split(',').filter(Boolean);
          if (!dayList.includes(todayName)) {
            continue;
          }
        }
        placeFlexBlock(commitment.commitmentName, commitment.flexDuration, commitment.flexPreference || 'any', 'commitment', commitment.commuteTime || 0);
      }
    }

    // Place tasks (deep/light interleaved, priority sorted)
    const sortedTasks = [...tasks].sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
    const deepTasks = sortedTasks.filter((t) => t.taskType === 'deep' && t.completion_status !== 'Completed' && !isBlocked(t));
    const lightTasks = sortedTasks.filter((t) => t.taskType === 'light' && t.completion_status !== 'Completed' && !isBlocked(t));
    const orderedTasks = [];
    const maxLen = Math.max(deepTasks.length, lightTasks.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < deepTasks.length) {
        orderedTasks.push(deepTasks[i]);
      }
      if (i < lightTasks.length) {
        orderedTasks.push(lightTasks[i]);
      }
    }

    for (const task of orderedTasks) {
      if (!task.duration || Number(task.duration) <= 0) {
        continue;
      }
      const { multiplier } = getTaskMultiplier(task);
      let remaining = Math.round(Number(task.duration) * multiplier);
      const limit = task.taskType === 'deep' ? savedMaxBlockLength : Infinity;
      const isOccupiedAt = (s, e) => schedule.some((b) => s < toMinutes(b.end) && e > toMinutes(b.start));

      const findPeakStart = (duration) => {
        if (!peakHours) {
          return null;
        }
        const peakStart = Math.max(wake, peakHours.start);
        const peakEnd = Math.min(sleep, peakHours.end);
        let t = getNextFreeStart(peakStart);
        while (t + duration <= peakEnd) {
          if (!isOccupiedAt(t, t + duration)) {
            return t;
          }
          t++;
        }
        return null;
      };

      let currentTime = task.taskType === 'deep'
        ? (findPeakStart(Math.min(Number(task.duration), savedMaxBlockLength)) ?? getNextFreeStart(wake))
        : getNextFreeStart(wake);

      let safetyCounter = 0;
      while (remaining > 0 && currentTime < sleep) {
        safetyCounter++;
        if (safetyCounter > 1000) {
          break;
        }
        currentTime = getNextFreeStart(currentTime);
        if (currentTime >= sleep) {
          break;
        }
        let blockEnd = currentTime + Math.min(remaining, limit);
        while (blockEnd > currentTime && isOccupiedAt(currentTime, blockEnd)) blockEnd--;
        const blockSize = blockEnd - currentTime;
        if (blockSize <= 0) { 
          currentTime++; 
          continue; 
        }
        schedule.push({ start: toTimeString(currentTime), end: toTimeString(blockEnd), label: task.taskName, type: isInPeak(currentTime) ? 'peak' : 'study', taskType: task.taskType });
        remaining -= blockSize;
        currentTime = blockEnd;
        if (remaining > 0) {
          const breakLength = Math.max(15, Math.round(blockSize * 0.15));
          const breakEnd = currentTime + breakLength;
          if (!isOccupiedAt(currentTime, breakEnd) && breakEnd <= sleep) {
            schedule.push({ start: toTimeString(currentTime), end: toTimeString(breakEnd), label: 'Break', type: 'break' });
            currentTime = breakEnd + savedTransitionGap;
          } else {
            currentTime = getNextFreeStart(currentTime);
          }
        } else {
          currentTime += savedTransitionGap;
        }
      }
    }

    // Sort and merge consecutive commute blocks
    const sorted = schedule.sort((a, b) => a.start.localeCompare(b.start));
    const merged = [];
    let i = 0;
    while (i < sorted.length) {
      const current = sorted[i];
      const next = sorted[i + 1];
      if (current.type === 'commute' && next && next.type === 'commute' && current.end === next.start && current.label.startsWith('Commute back from') && next.label.startsWith('Commute to')) {
        const from = current.label.replace('Commute back from ', '');
        const to = next.label.replace('Commute to ', '');
        merged.push({ start: current.start, end: next.end, label: `Commute from ${from} to ${to}`, type: 'commute' });
        i += 2;
      } else {
        merged.push(current);
        i++;
      }
    }
    return merged;
  }

  function generateScheduleSummary(schedule) {
    const summary = [];
    tasks.forEach((t) => {
      const { multiplier: m, source, key } = getTaskMultiplier(t);
      if (m === 1 || source === 'none') {
        return;
      }
      const adjusted = Math.round(Number(t.duration) * m);
      const diff = adjusted - Number(t.duration);
      const sourceLabel = source === 'task' ? `your "${key}" task history` : `${key} category history`;
      summary.push(`${t.taskName}: duration adjusted from ${t.duration} to ${adjusted} min (${diff > 0 ? '+' : ''}${diff} min based on ${sourceLabel})`);
    });
    const scheduledTaskNames = schedule.filter((b) => b.type === 'study' || b.type === 'peak').map((b) => b.label);
    tasks.filter((t) => !t.completion_status && !isBlocked(t) && !scheduledTaskNames.includes(t.taskName)).forEach((t) => {
      const blockingNames = (t.dependencies || [])
        .map((depId) => tasks.find((d) => d.id === depId))
        .filter((dep) => dep && !dep.completion_status)
        .map((dep) => dep.taskName);
      summary.push(`${t.taskName} is blocked — waiting on: ${blockingNames.join(', ')}`);
    });
    tasks.filter((t) => t.completion_status !== 'Completed' && !isBlocked(t) && !scheduledTaskNames.includes(t.taskName)).forEach((t) => {
      summary.push(`${t.taskName} could not be fully scheduled — not enough free time today`);
    });
    // Include flagged blocks
    Object.entries(scheduleFeedback).forEach(([index, flag]) => {
      if (!flag) {
        return;
      }
      const block = schedule[Number(index)];
      if (block) {
        const note = flagInput[index] ? `"${flagInput[index]}"` : 'no note left';
        summary.push(`You flagged "${block.label}" at ${formatTime(block.start)} — ${note}`);
      }
    });
    return summary;
  }

  function handleGenerateSchedule() {
    setScheduleFeedback({});
    setFlagInput({});
    const schedule = generateSchedule();
    setGeneratedSchedule(schedule);
    setScheduleSummary(generateScheduleSummary(schedule));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TASK HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  async function handleNaturalLanguageInput() {
    if (!nlInput.trim()) {
      return;
    }
    setNlLoading(true); setNlError('');
    try {
      const response = await authFetch(`${process.env.REACT_APP_API_URL}/parse-task`, {
        method: 'POST',
        body: JSON.stringify({ text: nlInput })
      });
      if (!response.ok) {
        throw new Error('Parse failed');
      }
      const parsed = await response.json();
      setTaskName(parsed.taskName || '');
      setDeadline(parsed.deadline || '');
      setDuration(parsed.duration || '');
      setDifficulty(parsed.difficulty ?? 5);
      setImportance(parsed.importance ?? 5);
      setUserPreference(parsed.userPreference ?? 5);
      setCategory(parsed.category || '');
      setDescription(parsed.description || '');
      setWorkOnDueDate(parsed.workOnDueDate ?? true);
      setAutoTaskType(classifyTask(parsed.taskName || '', parsed.difficulty ?? 5));
      setUserOverrideType(null);
      setNlInput('');
    } catch (err) {
      setNlError('Could not parse that — try being more specific, or fill the form manually.');
    }
    setNlLoading(false);
  }

  function handleAddTask(e) {
    e.preventDefault();
    if (!taskName.trim()) { 
      alert('Task name is required.'); 
      return; 
    }
    if (!deadline) { 
      alert('Deadline is required.'); 
      return; 
    }
    if (!category) { 
      alert('Please select a category.'); 
      return; 
    }
    if (!duration || Number(duration) <= 0) { 
      alert('Duration must be a positive number.'); 
      return; 
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today && !workOnDueDate) { 
      alert('Deadline cannot be in the past.'); 
      return; 
    }
    const finalTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
    authFetch(`${process.env.REACT_APP_API_URL}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ taskName: taskName.trim(), deadline, difficulty: Number(difficulty), importance: Number(importance), userPreference: Number(userPreference), duration: Number(duration), taskType: finalTaskType, category, workOnDueDate, description })
    })
      .then((res) => res.json())
      .then((savedTask) => {
        const newTask = { ...savedTask, dependencies: [] };
        setTasks([...tasks, newTask]);
        taskDependencies.forEach((depId) => handleAddDependency(savedTask.id, depId));
        setTaskDependencies([]);
        setTaskName(''); setDeadline(''); setDifficulty(5); setImportance(5); setUserPreference(5);
        setDuration(''); setAutoTaskType('deep'); setCategory(''); setUserOverrideType(null);
        setWorkOnDueDate(true); setDescription('');
      })
      .catch((err) => console.error('Failed to add task:', err));
  }

  function handleDeleteTask(id) {
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${id}`, { method: 'DELETE' })
      .then(() => setTasks(tasks.filter((task) => task.id !== id)))
      .catch((err) => console.error('Failed to delete task:', err));
  }

  function handleEditTask(task) {
    setEditingTaskId(task.id); setEditTaskName(task.taskName); setEditDeadline(task.deadline);
    setEditCategory(task.category || ''); setEditDifficulty(task.difficulty); setEditImportance(task.importance);
    setEditUserPreference(task.userPreference); setEditDuration(task.duration); setEditTaskType(task.taskType);
    setEditWorkOnDueDate(task.workOnDueDate !== 0); setEditDescription(task.description || '');
  }

  function handleUpdateTask(taskId) {
    if (!editTaskName.trim()) { 
      alert('Task name is required.'); 
      return; 
    }
    if (!editDeadline) { 
      alert('Deadline is required.'); 
      return; 
    }
    if (!editCategory) { 
      alert('Please select a category.'); 
      return; 
    }
    if (!editDuration || Number(editDuration) <= 0) { 
      alert('Duration must be a positive number.'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ taskName: editTaskName.trim(), deadline: editDeadline, difficulty: Number(editDifficulty), importance: Number(editImportance), userPreference: Number(editUserPreference), duration: Number(editDuration), taskType: editTaskType, category: editCategory, workOnDueDate: editWorkOnDueDate, description: editDescription })
    })
      .then((res) => res.json())
      .then((saved) => { setTasks(tasks.map((t) => t.id === taskId ? { ...t, ...saved } : t)); setEditingTaskId(null); })
      .catch((err) => console.error('Failed to update task:', err));
  }

  function handleSubmitFeedback(taskId) {
    if (!completionStatus) { 
      alert('Please select a completion status.'); 
      return; 
    }
    if (!actualDuration || Number(actualDuration) <= 0) { 
      alert('Please enter how long the task took (in minutes).'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/feedback`, {
      method: 'PATCH',
      body: JSON.stringify({ actual_duration: Number(actualDuration), actual_difficulty: Number(actualDifficulty), completion_status: completionStatus, start_time: taskStartTime ? taskStartTime.toISOString() : null, end_time: new Date().toISOString() })
    })
      .then((res) => res.json())
      .then(() => {
        setTasks(tasks.map((task) => task.id === taskId ? { ...task, actual_duration: Number(actualDuration), actual_difficulty: Number(actualDifficulty), completion_status: completionStatus } : task));
        setFeedbackTaskId(null); setActualDuration(''); setActualDifficulty(5); setCompletionStatus(''); setManualStartTime('');
        authFetch(`${process.env.REACT_APP_API_URL}/history`).then((res) => res.json()).then(setHistory).catch((err) => console.error('Failed to reload history:', err));
      })
      .catch((err) => console.error('Fetch failed:', err));
  }

  function handleStartTask(taskId) { 
    setActiveTaskId(taskId); 
    setTaskStartTime(new Date()); 
  }

  function handleStopTask() {
    if (!taskStartTime) {
      return;
    }
    setActualDuration(Math.round((new Date() - taskStartTime) / 60000));
    setTaskStartTime(null);
  }

  function handleOpenFeedback(taskId) {
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/partial-total`)
    .then((res) => res.json())
    .then((data) => setPreviousDuration(data.total || 0))
    .catch(() => setPreviousDuration(0));
    setFeedbackTaskId(taskId);
  }

  function handleAddDependency(taskId, dependsOnId) {
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ depends_on_id: dependsOnId })
    })
      .then((res) => res.json())
      .then(() => {
        setTasks(tasks.map((t) => t.id === taskId
          ? { ...t, dependencies: [...(t.dependencies || []), dependsOnId] }
          : t
        ));
      })
      .catch((err) => console.error('Failed to add dependency:', err));
  }

  function handleRemoveDependency(taskId, dependsOnId) {
    authFetch(`${process.env.REACT_APP_API_URL}/tasks/${taskId}/dependencies/${dependsOnId}`, {
      method: 'DELETE'
    })
      .then(() => {
        setTasks(tasks.map((t) => t.id === taskId
          ? { ...t, dependencies: (t.dependencies || []).filter((id) => id !== dependsOnId) }
          : t
        ));
      })
      .catch((err) => console.error('Failed to remove dependency:', err));
  }

  function handleUpdateAccount() {
    if (!currentPassword.trim()) {
      setUpdateAccountError('Current password is required.');
      return;
    }
    if (!newUsername.trim() && !newEmail.trim() && !newPassword.trim()) {
      setUpdateAccountError('Please fill in at least one field to update.');
      return;
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      setUpdateAccountError('New passwords do not match.');
      return;
    }
    authFetch(`${process.env.REACT_APP_API_URL}/auth/update-account`, {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword,
        new_username: newUsername.trim() || null,
        new_email: newEmail.trim() || null,
        new_password: newPassword || null
      })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail); });
        }
        return res.json();
      })
      .then((data) => {
        if (data.username && data.username !== username) {
          setUsername(data.username);
          localStorage.setItem('atlas_username', data.username);
        }
        setUpdateAccountMessage('Account updated successfully.');
        setUpdateAccountError('');
        setCurrentPassword(''); setNewUsername(''); setNewEmail('');
        setNewPassword(''); setConfirmNewPassword('');
      })
      .catch((err) => { setUpdateAccountError(err.message); setUpdateAccountMessage(''); });
  }

  function handleDeleteAccount() {
    if (!deleteAccountPassword.trim()) {
        setDeleteAccountError('Please enter your password to confirm deletion.');
        return;
    }
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) {
        return;
    }
    authFetch(`${process.env.REACT_APP_API_URL}/auth/delete-account`, {
        method: 'DELETE',
        body: JSON.stringify({ current_password: deleteAccountPassword })
    })
    .then((res) => {
      if (!res.ok) {
        return res.json().then((d) => { throw new Error(d.detail); });
      }
      return res.json();
    })
    .then(() => {
      handleLogout();
    })
    .catch((err) => setDeleteAccountError(err.message));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MEAL HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function handleAddMeal(e) {
    e.preventDefault();
    if (!mealName.trim()) { 
      alert('Meal name is required.'); 
      return; 
    }
    if (mealTimeMode === 'fixed') {
      if (!mealStart || !mealEnd) { 
        alert('Please set both a start and end time for this meal.'); 
        return; 
      }
      const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
      if (toMinutes(mealEnd) <= toMinutes(mealStart)) { 
        alert('Meal end time must be after start time.'); 
        return; 
      }
    }
    if (mealTimeMode === 'flexible' && (!mealFlexDuration || Number(mealFlexDuration) <= 0)) { 
      alert('Please enter a valid duration for this meal.'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/meals`, {
      method: 'POST',
      body: JSON.stringify({ mealName: mealName.trim(), mealStart: mealTimeMode === 'fixed' ? mealStart : null, mealEnd: mealTimeMode === 'fixed' ? mealEnd : null, commuteTime: mealCommuteTime, timeMode: mealTimeMode, flexDuration: mealFlexDuration, flexPreference: mealFlexPreference })
    })
      .then((res) => res.json())
      .then((savedMeal) => {
        setMeals([...meals, savedMeal]);
        setMealName(''); setMealStart(''); setMealEnd(''); setMealCommuteTime(0);
        setMealTimeMode('fixed'); setMealFlexDuration(30); setMealFlexPreference('any');
      })
      .catch((err) => console.error('Failed to add meal:', err));
  }

  function handleDeleteMeal(id) {
    authFetch(`${process.env.REACT_APP_API_URL}/meals/${id}`, { method: 'DELETE' })
      .then(() => setMeals(meals.filter((meal) => meal.id !== id)))
      .catch((err) => console.error('Failed to delete meal:', err));
  }

  function handleEditMeal(meal) {
    setEditingMealId(meal.id); setEditMealName(meal.mealName); setEditMealStart(meal.mealStart || '');
    setEditMealEnd(meal.mealEnd || ''); setEditMealCommuteTime(meal.commuteTime || 0);
    setEditMealTimeMode(meal.timeMode || 'fixed'); setEditMealFlexDuration(meal.flexDuration || 30);
    setEditMealFlexPreference(meal.flexPreference || 'any');
  }

  function handleUpdateMeal(mealId) {
    authFetch(`${process.env.REACT_APP_API_URL}/meals/${mealId}`, {
      method: 'PUT',
      body: JSON.stringify({ mealName: editMealName, mealStart: editMealTimeMode === 'fixed' ? editMealStart : null, mealEnd: editMealTimeMode === 'fixed' ? editMealEnd : null, commuteTime: editMealCommuteTime, timeMode: editMealTimeMode, flexDuration: editMealFlexDuration, flexPreference: editMealFlexPreference })
    })
      .then((res) => res.json())
      .then((saved) => { setMeals(meals.map((meal) => meal.id === mealId ? saved : meal)); setEditingMealId(null); })
      .catch((err) => console.error('Failed to update meal:', err));
  }

  function handleLogActualMeal(mealId) {
    authFetch(`${process.env.REACT_APP_API_URL}/meals/${mealId}/actual`, {
      method: 'PATCH',
      body: JSON.stringify({ actual_start: actualMealStart, actual_end: actualMealEnd })
    })
      .then((res) => res.json())
      .then((saved) => { setMeals(meals.map((meal) => meal.id === mealId ? saved : meal)); setMealFeedbackId(null); setActualMealStart(''); setActualMealEnd(''); })
      .catch((err) => console.error('Failed to log actual meal time:', err));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // COMMITMENT HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function handleAddCommitment(e) {
    e.preventDefault();
    if (!commitmentName.trim()) { 
      alert('Commitment name is required.'); 
      return; 
    }
    if (!commitmentType) { 
      alert('Please select a commitment type.'); 
      return; 
    }
    if (commitmentTimeMode === 'fixed') {
      if (!commitmentStart || !commitmentEnd) { 
        alert('Please set both a start and end time for this commitment.'); 
        return; 
      }
      const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
      if (toMinutes(commitmentEnd) <= toMinutes(commitmentStart)) { 
        alert('Commitment end time must be after start time.'); 
        return; 
      }
    }
    if (commitmentTimeMode === 'flexible' && (!commitmentFlexDuration || Number(commitmentFlexDuration) <= 0)) { 
      alert('Please enter a valid duration for this commitment.'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/commitments`, {
      method: 'POST',
      body: JSON.stringify({ commitmentName: commitmentName.trim(), commitmentStart: commitmentTimeMode === 'fixed' ? commitmentStart : null, commitmentEnd: commitmentTimeMode === 'fixed' ? commitmentEnd : null, commitmentType, commuteTime, timeMode: commitmentTimeMode, flexDuration: commitmentFlexDuration, flexPreference: commitmentFlexPreference, days: commitmentDays.join(',') })
    })
      .then((res) => res.json())
      .then((savedCommitment) => {
        setCommitments([...commitments, savedCommitment]);
        setCommitmentName(''); setCommitmentStart(''); setCommitmentEnd(''); setCommitmentType('');
        setCommuteTime(0); setCommitmentTimeMode('fixed'); setCommitmentFlexDuration(60);
        setCommitmentFlexPreference('any'); setCommitmentDays([]);
      })
      .catch((err) => console.error('Failed to add commitment:', err));
  }

  function handleDeleteCommitment(id) {
    authFetch(`${process.env.REACT_APP_API_URL}/commitments/${id}`, { method: 'DELETE' })
      .then(() => setCommitments(commitments.filter((c) => c.id !== id)))
      .catch((err) => console.error('Failed to delete commitment:', err));
  }

  function handleEditCommitment(commitment) {
    setEditingCommitmentId(commitment.id); setEditCommitmentName(commitment.commitmentName);
    setEditCommitmentStart(commitment.commitmentStart || ''); setEditCommitmentEnd(commitment.commitmentEnd || '');
    setEditCommitmentType(commitment.commitmentType || ''); setEditCommitmentCommuteTime(commitment.commuteTime || 0);
    setEditCommitmentTimeMode(commitment.timeMode || 'fixed'); setEditCommitmentFlexDuration(commitment.flexDuration || 60);
    setEditCommitmentFlexPreference(commitment.flexPreference || 'any');
    setEditCommitmentDays(commitment.days ? commitment.days.split(',').filter(Boolean) : []);
  }

  function handleUpdateCommitment(commitmentId) {
    authFetch(`${process.env.REACT_APP_API_URL}/commitments/${commitmentId}`, {
      method: 'PUT',
      body: JSON.stringify({ commitmentName: editCommitmentName, commitmentStart: editCommitmentTimeMode === 'fixed' ? editCommitmentStart : null, commitmentEnd: editCommitmentTimeMode === 'fixed' ? editCommitmentEnd : null, commitmentType: editCommitmentType, commuteTime: editCommitmentCommuteTime, timeMode: editCommitmentTimeMode, flexDuration: editCommitmentFlexDuration, flexPreference: editCommitmentFlexPreference, days: editCommitmentDays.join(',') })
    })
      .then((res) => res.json())
      .then((saved) => { setCommitments(commitments.map((c) => c.id === commitmentId ? saved : c)); setEditingCommitmentId(null); })
      .catch((err) => console.error('Failed to update commitment:', err));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SLEEP HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function handleSaveSleepSchedule() {
    if (!wakeTime || !sleepTime) { 
      alert('Please set both a wake time and a sleep time.'); 
      return; 
    }
    const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
    const wakeMin = toMinutes(wakeTime); const sleepMin = toMinutes(sleepTime);
    const availableMinutes = sleepMin > wakeMin ? sleepMin - wakeMin : (sleepMin + 1440) - wakeMin;
    if (availableMinutes < 60) { 
      alert('Your wake and sleep times are less than 1 hour apart. Please check your schedule.'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/sleep`, { method: 'POST', body: JSON.stringify({ wakeTime, sleepTime }) })
      .then(() => setSleepScheduleSaved(true))
      .catch((err) => console.error('Failed to save sleep schedule:', err));
  }

  function handleLogActualSleep() {
    if (!actualWakeTime && !actualSleepTime) { 
      alert('Please enter at least one actual time before saving.'); 
      return; 
    }
    authFetch(`${process.env.REACT_APP_API_URL}/sleep/actual`, {
      method: 'PATCH',
      body: JSON.stringify({ actual_wake: actualWakeTime || null, actual_sleep: actualSleepTime || null })
    })
      .then(() => setShowSleepFeedback(false))
      .catch((err) => console.error('Failed to log actual sleep:', err));
  }

  function handleClearActualSleep() {
    authFetch(`${process.env.REACT_APP_API_URL}/sleep/actual`, { method: 'DELETE' })
    .then(() => {
      setActualWakeTime('');
      setActualSleepTime('');
    })
    .catch((err) => console.error('Failed to clear actual sleep:', err));
  }

  function handleClearActualMeal(mealId) {
    authFetch(`${process.env.REACT_APP_API_URL}/meals/${mealId}/actual`, { method: 'DELETE' })
    .then((res) => res.json())
    .then((saved) => setMeals(meals.map((meal) => meal.id === mealId ? saved : meal)))
    .catch((err) => console.error('Failed to clear actual meal time:', err));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // KEYWORD HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function handleAddKeyword() {
    if (!newKeyword.trim()) {
      return;
    }
    const keyword = newKeyword.toLowerCase().trim();
    if (newKeywordType === 'deep') {
      if (customDeepKeywords.includes(keyword)) { 
        alert(`"${keyword}" is already in your deep work keywords.`); 
        return; 
      }
      setCustomDeepKeywords([...customDeepKeywords, keyword]);
    } else {
      if (customLightKeywords.includes(keyword)) { 
        alert(`"${keyword}" is already in your light work keywords.`); 
        return; 
      }
      setCustomLightKeywords([...customLightKeywords, keyword]);
    }
    setNewKeyword('');
  }

  function handleDeleteKeyword(keyword, type) {
    if (type === 'deep') {
      setCustomDeepKeywords(customDeepKeywords.filter((k) => k !== keyword));
    }
    else setCustomLightKeywords(customLightKeywords.filter((k) => k !== keyword));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FEEDBACK HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────
  function handleSubmitFeedbackForm() {
    if (!feedbackCategory) {
      setFeedbackError('Please select a category.');
      return;
    }
    if (!feedbackComment.trim()) {
      setFeedbackError('Please enter a comment.');
      return;
    }
    authFetch(`${process.env.REACT_APP_API_URL}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ category: feedbackCategory, comment: feedbackComment.trim() })
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d) => { throw new Error(d.detail); });
        }
        return res.json();
      })
      .then((data) => {
        setFeedbackMessage(data.message);
        setFeedbackError('');
        setFeedbackCategory('');
        setFeedbackComment('');
      })
      .catch((err) => { setFeedbackError(err.message); setFeedbackMessage(''); });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DERIVED STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const activeTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
  const hasConflict = userOverrideType !== null && userOverrideType !== autoTaskType;

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTH SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (resetToken) {
    return (
      <div>
        <h1>Atlas</h1>
        <h2>Reset Your Password</h2>
        {resetMessage ? (
          <div>
            <p style={{ color: 'green' }}>{resetMessage}</p>
            <button type="button" onClick={() => setResetMessage('')}>Back to Login</button>
          </div>
        ) : (
          <div>
            {resetError && <p style={{ color: 'red' }}>{resetError}</p>}
            <div>
              <label>New Password: </label>
              <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            </div>
            <div>
              <label>Confirm New Password: </label>
              <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
            </div>
            <button type="button" onClick={handleResetPassword}>Reset Password</button>
          </div>
        )}
      </div>
    );
  }

  if (!token) {
    if (forgotMode) {
      return (
        <div>
          <h1>Atlas</h1>
          <h2>{forgotMode === 'password' ? 'Forgot Password' : 'Forgot Username'}</h2>
          {forgotMessage ? (
            <div>
              <p>{forgotMessage}</p>
              <button type="button" onClick={() => { setForgotMode(null); setForgotEmail(''); setForgotMessage(''); }}>Back to Login</button>
            </div>
          ) : (
            <div>
              <p>Enter the email address associated with your account.</p>
              <div>
                <label>Email: </label>
                <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              </div>
              <button type="button" onClick={handleForgotSubmit}>
                {forgotMode === 'password' ? 'Send Reset Link' : 'Send Username'}
              </button>
              <p><button type="button" onClick={() => { setForgotMode(null); setForgotEmail(''); setForgotMessage(''); }}>Back to Login</button></p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div>
        <h1>Atlas</h1>
        <h2>{authMode === 'login' ? 'Log In' : 'Create Account'}</h2>
        {authError && <p style={{ color: 'red' }}>{authError}</p>}
        {authMode === 'register' && (
          <div>
            <label>Email: </label>
            <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} />
          </div>
        )}
        <div>
          <label>Username: </label>
          <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} />
        </div>
        <div>
          <label>Password: </label>
          <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
        </div>
        {authMode === 'login' ? (
          <div>
            <button type="button" onClick={handleLogin}>Log In</button>
            <p>
              <button type="button" onClick={() => { setForgotMode('username'); setAuthError(''); }}>Forgot username?</button>
              {' · '}
              <button type="button" onClick={() => { setForgotMode('password'); setAuthError(''); }}>Forgot password?</button>
            </p>
            <p>Don't have an account? <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }}>Create one</button></p>
          </div>
        ) : (
          <div>
            <button type="button" onClick={handleRegister}>Create Account</button>
            <p>Already have an account? <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }}>Log in</button></p>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN APP
  // ─────────────────────────────────────────────────────────────────────────────
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CATEGORY_OPTIONS = [
    'Homework', 'Reading', 
    'Studying / Exam Prep', 
    'Writing / Essays',
    'Projects', 
    'Group Work', 
    'Career / Applications', 
    'Chores / Errands',
    'Health / Fitness', 
    'Social / Clubs', 
    'Admin (Emails/Forms)', 
    'Other'
  ];
  const COMMITMENT_TYPES = [
    'Lecture / Class', 
    'Lab', 
    'Discussion / Recitation',
    'Seminar (upper-level, discussion-heavy)',
    'Studio (art, architecture, music practice, design)',
    'Office Hours (Professor/TA)',
    'Tutoring (receiving tutoring or being a tutor)',
    'Study Group Session', 
    'Job / Internship (paid professional work)',
    'Campus Job / Shift (e.g., library, café, desk assistant)', 
    'Volunteer',
    'Club Meeting', 
    'Sports Practice / Training',
    'Ensemble / Band / Choir Rehearsal', 
    'Theater / Dance Rehearsal',
    'Gym / Exercise', 
    'Therapy / Counseling', 
    'Other'
  ];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const weekDays = getWeekDays();
  const nowPercent = getNowPercent();

  // ── Reset password screen ──
  if (resetToken) {
    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
        <img src={logo} alt="Atlas logo" style={{ width: 48, marginBottom: 12, borderRadius: 12 }} />
        <h2 style={{ fontWeight: 700, marginBottom: 24 }}>Reset your password</h2>
        {resetMessage ? (
          <div className="card" style={{ width: '100%' }}>
            <p style={{ color: 'var(--brand)', marginBottom: 16 }}>{resetMessage}</p>
            <button className="btn-primary" type="button" onClick={() => setResetMessage('')}>Back to login</button>
          </div>
        ) : (
          <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {resetError && <p style={{ color: '#c0392b', fontSize: 13 }}>{resetError}</p>}
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>New password</label>
            <input type="password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Confirm new password</label>
            <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} />
            <button className="btn-primary" type="button" onClick={handleResetPassword} style={{ marginTop: 8 }}>Reset password</button>
          </div>
        )}
      </div>
    );
  }

  // ── Auth screen ──
  if (!token) {
    if (forgotMode) {
      return (
        <div className="app" style={{ justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
          <img src={logo} alt="Atlas logo" style={{ width: 48, marginBottom: 12, borderRadius: 12 }} />
          <h2 style={{ fontWeight: 700, marginBottom: 24 }}>
            {forgotMode === 'password' ? 'Forgot password' : 'Forgot username'}
          </h2>
          {forgotMessage ? (
            <div className="card" style={{ width: '100%' }}>
              <p style={{ marginBottom: 16 }}>{forgotMessage}</p>
              <button className="btn-primary" type="button" onClick={() => { setForgotMode(null); setForgotEmail(''); setForgotMessage(''); }}>Back to login</button>
            </div>
          ) : (
            <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Enter the email address associated with your account.</p>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
              <button className="btn-primary" type="button" onClick={handleForgotSubmit} style={{ marginTop: 8 }}>
                {forgotMode === 'password' ? 'Send reset link' : 'Send username'}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setForgotMode(null); setForgotEmail(''); setForgotMessage(''); }}>Back to login</button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="app" style={{ justifyContent: 'center', alignItems: 'center', padding: '32px 24px' }}>
        <img src={logo} alt="Atlas logo" style={{ width: 56, marginBottom: 8, borderRadius: 14 }} />
        <h1 style={{ fontWeight: 700, fontSize: 28, marginBottom: 4 }}>Atlas</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Your AI-powered daily planner</p>
        <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          {authError && <p style={{ color: '#c0392b', fontSize: 13 }}>{authError}</p>}
          {authMode === 'register' && (
            <>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@email.com" />
            </>
          )}
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
          <input type="text" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="username" />
          <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
          <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={(e) => { if (e.key === 'Enter') { authMode === 'login' ? handleLogin() : handleRegister(); } }} />
          {authMode === 'login' ? (
            <>
              <button className="btn-primary" type="button" onClick={handleLogin} style={{ marginTop: 8 }}>Log in</button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
                <button type="button" onClick={() => { setForgotMode('username'); setAuthError(''); }}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none' }}>Forgot username?</button>
                <button type="button" onClick={() => { setForgotMode('password'); setAuthError(''); }}
                  style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none' }}>Forgot password?</button>
              </div>
              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                No account?{' '}
                <button type="button" onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  style={{ color: 'var(--brand)', fontWeight: 700, background: 'none', border: 'none', fontSize: 13 }}>Sign up</button>
              </p>
            </>
          ) : (
            <>
              <button className="btn-primary" type="button" onClick={handleRegister} style={{ marginTop: 8 }}>Create account</button>
              <div className="divider" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  style={{ color: 'var(--brand)', fontWeight: 700, background: 'none', border: 'none', fontSize: 13 }}>Log in</button>
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main app ──
  return (
    <div className="app">

      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-left">
          <img src={logo} alt="Atlas logo" className="topbar-logo" />
          <span className="topbar-name">Atlas</span>
        </div>
        <div className="topbar-right">
          <button className="topbar-icon-btn" type="button" onClick={handleLogout} title="Log out">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Out</span>
          </button>
          <div className="topbar-avatar">{username.slice(0, 2).toUpperCase()}</div>
        </div>
      </div>

      {/* ── SCHEDULE TAB ── */}
      {activeTab === 'schedule' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* View toggle */}
          <div className="view-toggle">
            {['day', 'week', 'month'].map((v) => (
              <button key={v} type="button"
                className={`view-toggle-btn${scheduleView === v ? ' active' : ''}`}
                onClick={() => setScheduleView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Week label */}
          <div className="week-label">{getWeekRangeLabel()}</div>

          {/* Day chips */}
          <div className="day-chips-row">
            {weekDays.map((day, i) => (
              <button key={i} type="button"
                className={`day-chip${isToday(day) ? ' today' : ''}${getBlocksForDay(day).length > 0 ? ' has-events' : ''}`}
                onClick={() => { setSelectedDay(day); if (scheduleView !== 'month') { setScheduleView('day'); } }}>
                <span className="day-chip-name">{DAY_NAMES[day.getDay()]}</span>
                <span className="day-chip-num">{day.getDate()}</span>
                <div className="day-chip-dot" />
              </button>
            ))}
          </div>

          {/* ── WEEK VIEW ── */}
          {scheduleView === 'week' && (
            <div className="schedule-area">
              <div className="week-grid">
                <div className="time-gutter">
                  {['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'].map((t) => (
                    <div key={t} className="time-gutter-label">{t}</div>
                  ))}
                </div>
                {weekDays.map((day, di) => {
                  const blocks = getBlocksForDay(day);
                  return (
                    <div key={di} className={`day-column${isToday(day) ? ' today-col' : ''}`}>
                      {isToday(day) && (
                        <div className="now-line" style={{ top: `${nowPercent}%` }} />
                      )}
                      {blocks.map((block, bi) => (
                        <div key={bi}
                          className={`schedule-block cat-${block.category}`}
                          style={{
                            top: `${getBlockTopPercent(block.start)}%`,
                            height: `${getBlockHeightPercent(block.start, block.end)}%`,
                          }}>
                          <div className="block-emoji">{getEmojiForCategory(block.category)}</div>
                          <div className="block-label">{block.category.charAt(0).toUpperCase() + block.category.slice(1)}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DAY VIEW ── */}
          {scheduleView === 'day' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div className="day-detail-header">
                <div className="day-detail-title-row">
                  <button className="back-btn" type="button" onClick={() => setScheduleView('week')}>←</button>
                  <div>
                    <div className="day-detail-title">
                      {selectedDay.toLocaleDateString('en-US', { weekday: 'long' })}
                    </div>
                    <div className="day-detail-subtitle">
                      {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      {isToday(selectedDay) ? ' · Today' : ''}
                    </div>
                  </div>
                </div>
                <div className="day-strip">
                  {weekDays.map((day, i) => (
                    <button key={i} type="button"
                      className={`day-strip-chip${isSameDay(day, selectedDay) ? ' active' : ''}`}
                      onClick={() => setSelectedDay(day)}>
                      <span className="day-strip-chip-name">{DAY_NAMES[day.getDay()]}</span>
                      <span className="day-strip-chip-num">{day.getDate()}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="day-timeline">
                {(() => {
                  const blocks = getBlocksForDay(selectedDay);
                  if (blocks.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', fontSize: 14 }}>
                        No items scheduled for this day.
                      </div>
                    );
                  }
                  const rows = [];
                  blocks.forEach((block, i) => {
                    const showNow = isToday(selectedDay) && i === 0 && nowPercent > 0 && nowPercent < 10;
                    if (showNow) {
                      rows.push(
                        <div key="now-top" className="now-row">
                          <div className="now-tag">now</div>
                          <div className="now-stripe" />
                        </div>
                      );
                    }
                    rows.push(
                      <div key={i} className="tl-row">
                        <div className="tl-time">{formatTime(block.start)}</div>
                        <div className="tl-line" />
                        <div className={`tl-block cat-${block.category}`}>
                          <div className="tl-block-name">
                            {getEmojiForCategory(block.category)} {block.label}
                          </div>
                          {block.location && (
                            <div className="tl-block-location">
                              📍 {block.location}
                            </div>
                          )}
                          <div className="tl-block-time">
                            {formatTime(block.start)} – {formatTime(block.end)}
                          </div>
                        </div>
                      </div>
                    );
                    const nextBlock = blocks[i + 1];
                    const isNowBetween = isToday(selectedDay) && nextBlock &&
                      block.end <= `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}` &&
                      nextBlock.start > `${String(new Date().getHours()).padStart(2,'0')}:${String(new Date().getMinutes()).padStart(2,'0')}`;
                    if (isNowBetween) {
                      rows.push(
                        <div key={`now-${i}`} className="now-row">
                          <div className="now-tag">now</div>
                          <div className="now-stripe" />
                        </div>
                      );
                    }
                  });
                  return rows;
                })()}
              </div>
            </div>
          )}

          {/* ── MONTH VIEW ── */}
          {scheduleView === 'month' && (
            <div className="schedule-area">
              <div style={{ padding: '8px 4px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                  {DAY_NAMES.map((d) => (
                    <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{d}</div>
                  ))}
                </div>
                {(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < firstDay; i++) { cells.push(null); }
                  for (let d = 1; d <= daysInMonth; d++) { cells.push(new Date(year, month, d)); }
                  const weeks = [];
                  for (let i = 0; i < cells.length; i += 7) { weeks.push(cells.slice(i, i + 7)); }
                  return weeks.map((week, wi) => (
                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
                      {week.map((day, di) => (
                        <button key={di} type="button"
                          onClick={() => { if (day) { setSelectedDay(day); setScheduleView('day'); } }}
                          style={{
                            background: day && isToday(day) ? 'var(--brand)' : day && isSameDay(day, selectedDay) ? 'var(--brand-light)' : 'var(--bg-surface)',
                            border: '1.5px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            padding: '6px 2px',
                            minHeight: 52,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 3,
                            cursor: day ? 'pointer' : 'default',
                          }}>
                          {day && (
                            <>
                              <span style={{
                                fontSize: 12, fontWeight: 700,
                                color: isToday(day) ? 'white' : 'var(--text-primary)'
                              }}>{day.getDate()}</span>
                              {getBlocksForDay(day).length > 0 && (
                                <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                                  {[...new Set(getBlocksForDay(day).map((b) => b.category))].slice(0, 3).map((cat) => (
                                    <div key={cat} style={{
                                      width: 6, height: 6, borderRadius: '50%',
                                      background: `var(--cat-${cat}-border)`
                                    }} />
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Generate schedule button */}
          {scheduleView !== 'month' && (
            <div style={{ padding: '10px 14px 0' }}>
              <button className="btn-primary" type="button" onClick={handleGenerateSchedule}>
                Generate today's schedule
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TASKS TAB ── */}
      {activeTab === 'tasks' && (
        <div className="schedule-area" style={{ padding: '16px 14px' }}>
          <div className="section-label">Quick add</div>
          <div className="card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
              Describe your task in plain English — Atlas will fill in the form for you.
            </p>
            <input type="text"
              placeholder='e.g. "Study for stats exam Friday, 2 hours, hard"'
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { handleNaturalLanguageInput(); } }} />
            <button className="btn-primary" type="button" onClick={handleNaturalLanguageInput}
              disabled={nlLoading} style={{ marginTop: 10 }}>
              {nlLoading ? 'Parsing...' : 'Fill form'}
            </button>
            {nlError && <p style={{ color: '#c0392b', fontSize: 12, marginTop: 6 }}>{nlError}</p>}
          </div>

          <div className="section-label">Add task</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Task name</label>
            <input type="text" placeholder="e.g. Study for Math exam" value={taskName}
              onChange={(e) => { setTaskName(e.target.value); setAutoTaskType(classifyTask(e.target.value, difficulty)); setUserOverrideType(null); }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Description (optional)</label>
            <textarea placeholder="e.g. Binary trees chapters 5–7" value={description}
              onChange={(e) => setDescription(e.target.value)} rows={2} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Deadline</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Select category</option>
              {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Estimated duration (minutes)</label>
            <input type="number" min="0" placeholder="e.g. 60" value={duration} onChange={(e) => setDuration(e.target.value)} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Difficulty: {difficulty}
            </label>
            <input type="range" min="0" max="10" step="0.01" value={difficulty}
              onChange={(e) => { setDifficulty(e.target.value); setAutoTaskType(classifyTask(taskName, e.target.value)); setUserOverrideType(null); }} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Importance: {importance}
            </label>
            <input type="range" min="0" max="10" step="0.01" value={importance} onChange={(e) => setImportance(e.target.value)} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Personal priority: {userPreference}
            </label>
            <input type="range" min="0" max="10" step="0.01" value={userPreference} onChange={(e) => setUserPreference(e.target.value)} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="workOnDueDate" checked={workOnDueDate} onChange={(e) => setWorkOnDueDate(e.target.checked)} style={{ width: 'auto' }} />
              <label htmlFor="workOnDueDate" style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Can work on due date</label>
            </div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Depends on</label>
            <select value="" onChange={(e) => {
              const id = Number(e.target.value);
              if (id && !taskDependencies.includes(id)) { setTaskDependencies([...taskDependencies, id]); }
            }}>
              <option value="">Add a dependency...</option>
              {tasks.filter((t) => !t.completion_status).map((t) => (
                <option key={t.id} value={t.id}>{t.taskName}</option>
              ))}
            </select>
            {taskDependencies.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {taskDependencies.map((depId) => {
                  const dep = tasks.find((t) => t.id === depId);
                  return dep ? (
                    <span key={depId} style={{ background: 'var(--cat-task)', color: 'var(--cat-task-text)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {dep.taskName}
                      <button type="button" onClick={() => setTaskDependencies(taskDependencies.filter((id) => id !== depId))}
                        style={{ background: 'none', border: 'none', color: 'var(--cat-task-text)', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Atlas thinks this is: <strong style={{ color: 'var(--text-primary)' }}>{activeTaskType === 'deep' ? 'Deep Work' : 'Light Work'}</strong>
            </p>
            <button type="button" className="btn-secondary"
              onClick={() => setUserOverrideType(activeTaskType === 'deep' ? 'light' : 'deep')}
              style={{ fontSize: 12 }}>
              {userOverrideType === null
                ? `Switch to ${autoTaskType === 'deep' ? 'Light Work' : 'Deep Work'}`
                : `Undo — revert to ${autoTaskType === 'deep' ? 'Deep Work' : 'Light Work'}`}
            </button>
            <button className="btn-primary" type="button" onClick={handleAddTask}>Add task</button>
          </div>

          <div className="section-label">Active tasks</div>
          {(() => {
            const activeTasks = [...tasks].filter((t) => t.completion_status !== 'Completed')
              .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
            if (activeTasks.length === 0) {
              return <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '24px 0' }}>No active tasks.</p>;
            }
            return activeTasks.map((task) => (
              <div key={task.id} className="card" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{task.taskName}</span>
                    {isBlocked(task) && (
                      <p style={{ fontSize: 11, color: '#c0392b', marginTop: 2 }}>
                        🔒 Blocked by: {(task.dependencies || [])
                          .map((depId) => tasks.find((t) => t.id === depId))
                          .filter((dep) => dep && !dep.completion_status)
                          .map((dep) => dep.taskName).join(', ')}
                      </p>
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: 'var(--cat-task)', color: 'var(--cat-task-text)', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}>
                    {calculatePriorityScore(task)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-pill)', padding: '2px 8px' }}>
                    Due {task.deadline}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-pill)', padding: '2px 8px' }}>
                    {task.duration} min
                  </span>
                  {task.category && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface-alt)', borderRadius: 'var(--radius-pill)', padding: '2px 8px' }}>
                      {task.category}
                    </span>
                  )}
                </div>

                {feedbackTaskId === task.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>How did it go?</p>
                    {previousDuration > 0 && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Previously logged: {previousDuration} min</p>
                    )}
                    <select value={completionStatus} onChange={(e) => setCompletionStatus(e.target.value)}>
                      <option value="">Select status...</option>
                      <option value="Completed">Completed</option>
                      <option value="Partially Completed">Partially Completed</option>
                      <option value="Not Completed">Not Completed</option>
                    </select>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Duration (minutes)</label>
                    <input type="number" min="0" value={actualDuration} onChange={(e) => setActualDuration(e.target.value)} />
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Actual difficulty: {actualDifficulty}</label>
                    <input type="range" min="0" max="10" step="0.01" value={actualDifficulty} onChange={(e) => setActualDifficulty(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" type="button" onClick={() => handleSubmitFeedback(task.id)} style={{ flex: 1 }}>Submit</button>
                      <button className="btn-secondary" type="button" onClick={() => { setFeedbackTaskId(null); setPreviousDuration(0); }} style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                ) : editingTaskId === task.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>Edit task</p>
                    <input type="text" value={editTaskName} onChange={(e) => setEditTaskName(e.target.value)} />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2} />
                    <input type="date" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" min="0" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="Duration (min)" />
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Difficulty: {editDifficulty}</label>
                    <input type="range" min="0" max="10" step="0.01" value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value)} />
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Importance: {editImportance}</label>
                    <input type="range" min="0" max="10" step="0.01" value={editImportance} onChange={(e) => setEditImportance(e.target.value)} />
                    <select value={editTaskType} onChange={(e) => setEditTaskType(e.target.value)}>
                      <option value="deep">Deep Work</option>
                      <option value="light">Light Work</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-primary" type="button" onClick={() => handleUpdateTask(task.id)} style={{ flex: 1 }}>Save</button>
                      <button className="btn-secondary" type="button" onClick={() => setEditingTaskId(null)} style={{ flex: 1 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {activeTaskId === task.id ? (
                      <button className="btn-primary" type="button"
                        onClick={() => { handleStopTask(); handleOpenFeedback(task.id); setActiveTaskId(null); }}
                        style={{ flex: 1 }}>Stop timer</button>
                    ) : (
                      <button className="btn-secondary" type="button"
                        onClick={() => handleStartTask(task.id)}
                        disabled={activeTaskId !== null}
                        style={{ flex: 1 }}>Start</button>
                    )}
                    <button className="btn-secondary" type="button" onClick={() => handleOpenFeedback(task.id)} style={{ flex: 1 }}>Done</button>
                    <button className="btn-secondary" type="button" onClick={() => handleEditTask(task)} style={{ flex: 1 }}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => handleDeleteTask(task.id)} style={{ flex: 1 }}>Del</button>
                  </div>
                )}
              </div>
            ));
          })()}

          {(() => {
            const completedTasks = tasks.filter((t) => t.completion_status === 'Completed');
            if (completedTasks.length === 0) { return null; }
            return (
              <div>
                <button className="btn-secondary" type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  style={{ marginBottom: 10 }}>
                  {showHistory ? '▲ Hide' : '▼ Show'} completed ({completedTasks.length})
                </button>
                {showHistory && completedTasks.map((task) => (
                  <div key={task.id} className="card" style={{ marginBottom: 10, opacity: 0.75 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>✓ {task.taskName}</span>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{task.category} · {task.deadline}</p>
                    <ProgressBar estimated={task.duration} actual={task.actual_duration} />
                    <button className="btn-danger" type="button" onClick={() => handleDeleteTask(task.id)} style={{ marginTop: 8 }}>Delete</button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── AVAILABILITY TAB ── */}
      {activeTab === 'availability' && (
        <div className="schedule-area" style={{ padding: '16px 14px' }}>

          <div className="section-label">Sleep schedule</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Wake-up time</label>
            <TimePicker value={wakeTime} onChange={setWakeTime} clockFormat={savedClockFormat} />
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Sleep time</label>
            <TimePicker value={sleepTime} onChange={setSleepTime} clockFormat={savedClockFormat} />
            <button className="btn-primary" type="button" onClick={handleSaveSleepSchedule}>Save</button>
            {sleepScheduleSaved && (
              <p style={{ fontSize: 12, color: 'var(--brand)' }}>
                Wake {formatTime(wakeTime)} · Sleep {formatTime(sleepTime)}
              </p>
            )}
            {showSleepFeedback ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>Log actual sleep times</p>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Actual wake time</label>
                <TimePicker value={actualWakeTime || wakeTime} onChange={setActualWakeTime} clockFormat={savedClockFormat} />
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Actual sleep time</label>
                <TimePicker value={actualSleepTime || sleepTime} onChange={setActualSleepTime} clockFormat={savedClockFormat} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" type="button" onClick={handleLogActualSleep} style={{ flex: 1 }}>Save</button>
                  <button className="btn-secondary" type="button" onClick={() => setShowSleepFeedback(false)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            ) : (
              sleepScheduleSaved && (
                <button className="btn-secondary" type="button" onClick={() => setShowSleepFeedback(true)}>Log actual sleep times</button>
              )
            )}
          </div>

          <div className="section-label">Meals</div>
          <div className="card" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" placeholder="Meal name (e.g. Lunch)" value={mealName} onChange={(e) => setMealName(e.target.value)} />
            <select value={mealTimeMode} onChange={(e) => setMealTimeMode(e.target.value)}>
              <option value="fixed">Fixed time</option>
              <option value="flexible">Flexible time</option>
            </select>
            {mealTimeMode === 'fixed' ? (
              <>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Start</label>
                <TimePicker value={mealStart} onChange={setMealStart} clockFormat={savedClockFormat} />
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>End</label>
                <TimePicker value={mealEnd} onChange={setMealEnd} clockFormat={savedClockFormat} />
              </>
            ) : (
              <>
                <input type="number" min="0" value={mealFlexDuration} onChange={(e) => setMealFlexDuration(Number(e.target.value))} placeholder="Duration (min)" />
                <FlexPreferenceSelect value={mealFlexPreference} onChange={setMealFlexPreference} />
              </>
            )}
            <input type="number" min="0" max="120" value={mealCommuteTime} onChange={(e) => setMealCommuteTime(Number(e.target.value))} placeholder="Commute time (min, optional)" />
            <button className="btn-primary" type="button" onClick={handleAddMeal}>Add meal</button>
          </div>
          {meals.map((meal) => (
            <div key={meal.id} className="card" style={{ marginBottom: 10 }}>
              {editingMealId === meal.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" value={editMealName} onChange={(e) => setEditMealName(e.target.value)} />
                  <select value={editMealTimeMode} onChange={(e) => setEditMealTimeMode(e.target.value)}>
                    <option value="fixed">Fixed time</option>
                    <option value="flexible">Flexible time</option>
                  </select>
                  {editMealTimeMode === 'fixed' ? (
                    <>
                      <TimePicker value={editMealStart} onChange={setEditMealStart} clockFormat={savedClockFormat} />
                      <TimePicker value={editMealEnd} onChange={setEditMealEnd} clockFormat={savedClockFormat} />
                    </>
                  ) : (
                    <>
                      <input type="number" min="0" value={editMealFlexDuration} onChange={(e) => setEditMealFlexDuration(Number(e.target.value))} />
                      <FlexPreferenceSelect value={editMealFlexPreference} onChange={setEditMealFlexPreference} />
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" type="button" onClick={() => handleUpdateMeal(meal.id)} style={{ flex: 1 }}>Save</button>
                    <button className="btn-secondary" type="button" onClick={() => setEditingMealId(null)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>{meal.mealName}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {meal.timeMode === 'flexible'
                      ? `Flexible · ${meal.flexDuration} min`
                      : `${formatTime(meal.mealStart)} – ${formatTime(meal.mealEnd)}`}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button className="btn-secondary" type="button" onClick={() => handleEditMeal(meal)} style={{ flex: 1 }}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => handleDeleteMeal(meal.id)} style={{ flex: 1 }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="section-label" style={{ marginTop: 8 }}>Commitments</div>
          <div className="card" style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" placeholder="Commitment name (e.g. Work shift)" value={commitmentName} onChange={(e) => setCommitmentName(e.target.value)} />
            <select value={commitmentType} onChange={(e) => setCommitmentType(e.target.value)}>
              <option value="">Select type</option>
              {COMMITMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={commitmentTimeMode} onChange={(e) => setCommitmentTimeMode(e.target.value)}>
              <option value="fixed">Fixed time</option>
              <option value="flexible">Flexible time</option>
            </select>
            {commitmentTimeMode === 'fixed' ? (
              <>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Start</label>
                <TimePicker value={commitmentStart} onChange={setCommitmentStart} clockFormat={savedClockFormat} />
                <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>End</label>
                <TimePicker value={commitmentEnd} onChange={setCommitmentEnd} clockFormat={savedClockFormat} />
              </>
            ) : (
              <>
                <input type="number" min="0" value={commitmentFlexDuration} onChange={(e) => setCommitmentFlexDuration(Number(e.target.value))} placeholder="Duration (min)" />
                <FlexPreferenceSelect value={commitmentFlexPreference} onChange={setCommitmentFlexPreference} />
              </>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {DAYS.map((day) => (
                <button key={day} type="button"
                  onClick={() => toggleDay(day, commitmentDays, setCommitmentDays)}
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                    background: commitmentDays.includes(day) ? 'var(--brand)' : 'var(--bg-surface-alt)',
                    color: commitmentDays.includes(day) ? 'white' : 'var(--text-secondary)',
                    border: '1.5px solid var(--border-color)',
                  }}>
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
            <input type="number" min="0" max="120" value={commuteTime} onChange={(e) => setCommuteTime(Number(e.target.value))} placeholder="Commute time (min, optional)" />
            <button className="btn-primary" type="button" onClick={handleAddCommitment}>Add commitment</button>
          </div>
          {commitments.map((commitment) => (
            <div key={commitment.id} className="card" style={{ marginBottom: 10 }}>
              {editingCommitmentId === commitment.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input type="text" value={editCommitmentName} onChange={(e) => setEditCommitmentName(e.target.value)} />
                  <select value={editCommitmentType} onChange={(e) => setEditCommitmentType(e.target.value)}>
                    <option value="">Select type</option>
                    {COMMITMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={editCommitmentTimeMode} onChange={(e) => setEditCommitmentTimeMode(e.target.value)}>
                    <option value="fixed">Fixed time</option>
                    <option value="flexible">Flexible time</option>
                  </select>
                  {editCommitmentTimeMode === 'fixed' ? (
                    <>
                      <TimePicker value={editCommitmentStart} onChange={setEditCommitmentStart} clockFormat={savedClockFormat} />
                      <TimePicker value={editCommitmentEnd} onChange={setEditCommitmentEnd} clockFormat={savedClockFormat} />
                    </>
                  ) : (
                    <>
                      <input type="number" min="0" value={editCommitmentFlexDuration} onChange={(e) => setEditCommitmentFlexDuration(Number(e.target.value))} />
                      <FlexPreferenceSelect value={editCommitmentFlexPreference} onChange={setEditCommitmentFlexPreference} />
                    </>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {DAYS.map((day) => (
                      <button key={day} type="button"
                        onClick={() => toggleDay(day, editCommitmentDays, setEditCommitmentDays)}
                        style={{
                          padding: '4px 10px', borderRadius: 'var(--radius-pill)', fontSize: 12, fontWeight: 600,
                          background: editCommitmentDays.includes(day) ? 'var(--brand)' : 'var(--bg-surface-alt)',
                          color: editCommitmentDays.includes(day) ? 'white' : 'var(--text-secondary)',
                          border: '1.5px solid var(--border-color)',
                        }}>
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-primary" type="button" onClick={() => handleUpdateCommitment(commitment.id)} style={{ flex: 1 }}>Save</button>
                    <button className="btn-secondary" type="button" onClick={() => setEditingCommitmentId(null)} style={{ flex: 1 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{commitment.commitmentName}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                    {commitment.timeMode === 'flexible'
                      ? `Flexible · ${commitment.flexDuration} min`
                      : `${formatTime(commitment.commitmentStart)} – ${formatTime(commitment.commitmentEnd)}`}
                    {commitment.days && commitment.days.length > 0 && ` · ${commitment.days.split(',').filter(Boolean).map((d) => d.slice(0,3)).join(', ')}`}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-secondary" type="button" onClick={() => handleEditCommitment(commitment)} style={{ flex: 1 }}>Edit</button>
                    <button className="btn-danger" type="button" onClick={() => handleDeleteCommitment(commitment.id)} style={{ flex: 1 }}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {activeTab === 'progress' && (
        <div className="schedule-area" style={{ padding: '16px 14px' }}>
          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
              Complete a task to see your progress.
            </p>
          ) : (
            <>
              {(() => {
                const streak = calculateStreak();
                if (streak === 0) { return null; }
                return (
                  <div className="card" style={{ marginBottom: 12, background: 'var(--cat-lemon)', border: '1.5px solid var(--cat-free-border)' }}>
                    <p style={{ fontWeight: 700, color: 'var(--cat-free-text)' }}>🔥 {streak}-day streak!</p>
                    <p style={{ fontSize: 12, color: 'var(--cat-free-text)', marginTop: 4 }}>
                      {streak} day{streak !== 1 ? 's' : ''} of completed tasks in a row.
                    </p>
                  </div>
                );
              })()}

              {(() => {
                const suggestions = generateSuggestions();
                if (suggestions.length === 0) { return null; }
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div className="section-label">Suggestions</div>
                    {suggestions.map((s, i) => (
                      <div key={i} className="card" style={{ marginBottom: 8 }}>
                        <p style={{ fontSize: 13 }}>💡 {s}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="section-label">This week</div>
              {(() => {
                const week = calculateWeeklyStats();
                if (week.count === 0) {
                  return <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>No tasks completed in the last 7 days.</p>;
                }
                return (
                  <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ fontSize: 13 }}><strong>{week.count}</strong> tasks · <strong>{week.completed}</strong> completed · <strong>{week.partial}</strong> partial</p>
                    <p style={{ fontSize: 13 }}>Time estimated: <strong>{week.totalEstimated} min</strong></p>
                    <p style={{ fontSize: 13 }}>Time actual: <strong>{week.totalActual} min</strong></p>
                    {week.overallAccuracy && <p style={{ fontSize: 13 }}>Accuracy: <strong>{week.overallAccuracy}%</strong></p>}
                  </div>
                );
              })()}

              <div className="section-label">Task history</div>
              {history.map((h) => (
                <div key={h.id} className="card" style={{ marginBottom: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 14 }}>{h.taskName}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{h.category} · {h.completion_status}</p>
                  <ProgressBar estimated={h.estimated_duration} actual={h.actual_duration} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Accuracy: {calculateAccuracy(h.estimated_duration, h.actual_duration)}% · Completed {h.completed_at?.split('T')[0]}
                  </p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ── */}
      {activeTab === 'settings' && (
        <div className="schedule-area" style={{ padding: '16px 14px' }}>

          <div className="section-label">Theme</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {THEMES.map((t) => (
              <button key={t.id} type="button"
                onClick={() => setTheme(t.id)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: theme === t.id ? 'var(--brand-light)' : 'var(--bg-surface-alt)',
                  border: `1.5px solid ${theme === t.id ? 'var(--brand)' : 'var(--border-color)'}`,
                  textAlign: 'left',
                }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 13, color: theme === t.id ? 'var(--brand-dark)' : 'var(--text-primary)' }}>{t.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.description}</p>
                </div>
                {theme === t.id && <span style={{ fontSize: 16, color: 'var(--brand)' }}>✓</span>}
              </button>
            ))}
          </div>

          <div className="section-label">Schedule settings</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Clock format</label>
            <select value={clockFormat} onChange={(e) => setClockFormat(e.target.value)}>
              <option value="12">12-hour (AM/PM)</option>
              <option value="24">24-hour</option>
            </select>
            <button className="btn-primary" type="button" onClick={() => { setSavedClockFormat(clockFormat); saveSetting('clockFormat', clockFormat); }}>Save clock format</button>

            <div className="divider" />

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Max deep work block (min): {maxBlockLength}</label>
            <input type="number" min="0" max="180" value={maxBlockLength} onChange={(e) => setMaxBlockLength(clamp(e.target.value, 0, 180))} />
            <button className="btn-primary" type="button" onClick={() => { setSavedMaxBlockLength(maxBlockLength); saveSetting('maxBlockLength', maxBlockLength); }}>Save</button>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Morning buffer (min): {morningBuffer}</label>
            <input type="number" min="0" max="120" value={morningBuffer} onChange={(e) => setMorningBuffer(clamp(e.target.value, 0, 120))} />
            <button className="btn-primary" type="button" onClick={() => { setSavedMorningBuffer(morningBuffer); saveSetting('morningBuffer', morningBuffer); }}>Save</button>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Night buffer (min): {nightBuffer}</label>
            <input type="number" min="0" max="120" value={nightBuffer} onChange={(e) => setNightBuffer(clamp(e.target.value, 0, 120))} />
            <button className="btn-primary" type="button" onClick={() => { setSavedNightBuffer(nightBuffer); saveSetting('nightBuffer', nightBuffer); }}>Save</button>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Transition gap (min): {transitionGap}</label>
            <input type="number" min="0" max="30" value={transitionGap} onChange={(e) => setTransitionGap(clamp(e.target.value, 0, 30))} />
            <button className="btn-primary" type="button" onClick={() => { setSavedTransitionGap(transitionGap); saveSetting('transitionGap', transitionGap); }}>Save</button>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Shower duration (min): {showerDuration}</label>
            <input type="number" min="0" max="60" value={showerDuration} onChange={(e) => setShowerDuration(clamp(e.target.value, 0, 60))} />
            <select value={showerPreference} onChange={(e) => setShowerPreference(e.target.value)}>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="both">Both</option>
            </select>
            <button className="btn-primary" type="button" onClick={() => { setSavedShowerDuration(showerDuration); setSavedShowerPreference(showerPreference); saveSetting('showerDuration', showerDuration); saveSetting('showerPreference', showerPreference); }}>Save shower settings</button>

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>Energy pattern</label>
            <select value={energyPattern} onChange={(e) => setEnergyPattern(e.target.value)}>
              <option value="morning">Morning person (6am–12pm)</option>
              <option value="afternoon">Afternoon person (12pm–5pm)</option>
              <option value="evening">Evening person (5pm–10pm)</option>
              <option value="between">Between classes</option>
            </select>
            <button className="btn-primary" type="button" onClick={() => { setSavedEnergyPattern(energyPattern); saveSetting('energyPattern', energyPattern); }}>Save</button>
          </div>

          <div className="section-label">Custom keywords</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input type="text" placeholder="e.g. chinese" value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)} />
            <select value={newKeywordType} onChange={(e) => setNewKeywordType(e.target.value)}>
              <option value="deep">Deep Work</option>
              <option value="light">Light Work</option>
            </select>
            <button className="btn-primary" type="button" onClick={handleAddKeyword}>Add keyword</button>
            {customDeepKeywords.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Deep Work</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {customDeepKeywords.map((kw) => (
                    <span key={kw} style={{ background: 'var(--cat-task)', color: 'var(--cat-task-text)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {kw}
                      <button type="button" onClick={() => handleDeleteKeyword(kw, 'deep')} style={{ background: 'none', border: 'none', color: 'var(--cat-task-text)', fontSize: 14, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {customLightKeywords.length > 0 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Light Work</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {customLightKeywords.map((kw) => (
                    <span key={kw} style={{ background: 'var(--cat-free)', color: 'var(--cat-free-text)', borderRadius: 'var(--radius-pill)', padding: '3px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {kw}
                      <button type="button" onClick={() => handleDeleteKeyword(kw, 'light')} style={{ background: 'none', border: 'none', color: 'var(--cat-free-text)', fontSize: 14, padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="section-label">Account</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {updateAccountMessage && <p style={{ color: 'var(--brand)', fontSize: 13 }}>{updateAccountMessage}</p>}
            {updateAccountError && <p style={{ color: '#c0392b', fontSize: 13 }}>{updateAccountError}</p>}
            <input type="password" placeholder="Current password (required)" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <input type="text" placeholder="New username (optional)" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
            <input type="email" placeholder="New email (optional)" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <input type="password" placeholder="New password (optional)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <input type="password" placeholder="Confirm new password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} />
            <button className="btn-primary" type="button" onClick={handleUpdateAccount}>Save account changes</button>
          </div>

          <div className="section-label">Send feedback</div>
          <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedbackMessage && <p style={{ color: 'var(--brand)', fontSize: 13 }}>{feedbackMessage}</p>}
            {feedbackError && <p style={{ color: '#c0392b', fontSize: 13 }}>{feedbackError}</p>}
            <select value={feedbackCategory} onChange={(e) => setFeedbackCategory(e.target.value)}>
              <option value="">Select category...</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Request">Feature Request</option>
              <option value="General">General</option>
            </select>
            <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)}
              placeholder="Describe the bug, feature, or share your thoughts..." rows={4} />
            <button className="btn-primary" type="button" onClick={handleSubmitFeedbackForm}>Submit feedback</button>
          </div>

          <div className="section-label">Danger zone</div>
          <div className="card" style={{ marginBottom: 32 }}>
            {deleteAccountError && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 8 }}>{deleteAccountError}</p>}
            <p style={{ fontSize: 12, color: '#c0392b', marginBottom: 10 }}>
              Permanently deletes your account and all data. This cannot be undone.
            </p>
            <input type="password" placeholder="Confirm your password" value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn-danger" type="button" onClick={handleDeleteAccount}>Delete my account</button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <button type="button" className="nav-item" onClick={() => setActiveTab('schedule')}>
          <span className={`nav-item-icon${activeTab === 'schedule' ? ' active' : ''}`}>📅</span>
          <span className={`nav-item-label${activeTab === 'schedule' ? ' active' : ''}`}>Schedule</span>
        </button>
        <button type="button" className="nav-item" onClick={() => setActiveTab('tasks')}>
          <span className={`nav-item-icon${activeTab === 'tasks' ? ' active' : ''}`}>✅</span>
          <span className={`nav-item-label${activeTab === 'tasks' ? ' active' : ''}`}>Tasks</span>
        </button>
        <div className="nav-fab-wrap">
          <button type="button" className="nav-fab"
            onClick={() => setActiveTab(activeTab === 'tasks' ? 'schedule' : 'tasks')}>
            +
          </button>
        </div>
        <button type="button" className="nav-item" onClick={() => setActiveTab('availability')}>
          <span className={`nav-item-icon${activeTab === 'availability' ? ' active' : ''}`}>🗓</span>
          <span className={`nav-item-label${activeTab === 'availability' ? ' active' : ''}`}>Availability</span>
        </button>
        <button type="button" className="nav-item" onClick={() => setActiveTab('settings')}>
          <span className={`nav-item-icon${activeTab === 'settings' ? ' active' : ''}`}>⚙️</span>
          <span className={`nav-item-label${activeTab === 'settings' ? ' active' : ''}`}>Settings</span>
        </button>
      </div>

    </div>
  );
}

export default App;