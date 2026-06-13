import React, { useState, useEffect } from 'react';
import logo from './Atlas_Logo.png';

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
          <option key={h} value={h}>
            {displayHour(h)}
          </option>
        ))}
      </select>
      :
      <select value={currentMinute} onChange={handleMinuteChange}>
        {minutes.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      {clockFormat === '12' && (
        <button type="button" onClick={toggleAmPm}>
          {currentAmPm}
        </button>
      )}
    </span>
  );
}

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

function App() {
  const DEBUG = process.env.NODE_ENV === 'development';
  const clamp = (value, min, max) => Math.min(Math.max(Number(value), min), max);
  const [difficulty, setDifficulty] = useState(5);
  const [importance, setImportance] = useState(5);
  const [editingDifficulty, setEditingDifficulty] = useState(false);
  const [editingImportance, setEditingImportance] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('');
  const [wakeTime, setWakeTime] = useState('');
  const [sleepTime, setSleepTime] = useState('');
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [mealStart, setMealStart] = useState('');
  const [mealEnd, setMealEnd] = useState('');
  const [commitments, setCommitments] = useState([]);
  const [commitmentName, setCommitmentName] = useState('');
  const [commitmentStart, setCommitmentStart] = useState('');
  const [commitmentEnd, setCommitmentEnd] = useState('');
  const [commitmentType, setCommitmentType] = useState('');
  const [clockFormat, setClockFormat] = useState('12');
  const [savedClockFormat, setSavedClockFormat] = useState('12');
  const [sleepScheduleSaved, setSleepScheduleSaved] = useState(false);
  const [userPreference, setUserPreference] = useState(5);
  const [editingUserPreference, setEditingUserPreference] = useState(false);
  const [autoTaskType, setAutoTaskType] = useState('deep');
  const [userOverrideType, setUserOverrideType] = useState(null);
  const [customDeepKeywords, setCustomDeepKeywords] = useState([]);
  const [customLightKeywords, setCustomLightKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState('deep');
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
  const [generatedSchedule, setGeneratedSchedule] = useState([]);
  const [category, setCategory] = useState('');
  const [feedbackTaskId, setFeedbackTaskId] = useState(null);
  const [actualDuration, setActualDuration] = useState('');
  const [actualDifficulty, setActualDifficulty] = useState(5);
  const [completionStatus, setCompletionStatus] = useState('');
  const [editingActualDifficulty, setEditingActualDifficulty] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [taskStartTime, setTaskStartTime] = useState(null);
  const [manualStartTime, setManualStartTime] = useState('');
  const [commuteTime, setCommuteTime] = useState(0);
  const [mealCommuteTime, setMealCommuteTime] = useState(0);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(5);
  const [editImportance, setEditImportance] = useState(5);
  const [editUserPreference, setEditUserPreference] = useState(5);
  const [editDuration, setEditDuration] = useState('');
  const [editTaskType, setEditTaskType] = useState('deep');
  const [editingMealId, setEditingMealId] = useState(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealStart, setEditMealStart] = useState('');
  const [editMealEnd, setEditMealEnd] = useState('');
  const [editMealCommuteTime, setEditMealCommuteTime] = useState(0);
  const [editingCommitmentId, setEditingCommitmentId] = useState(null);
  const [editCommitmentName, setEditCommitmentName] = useState('');
  const [editCommitmentStart, setEditCommitmentStart] = useState('');
  const [editCommitmentEnd, setEditCommitmentEnd] = useState('');
  const [editCommitmentType, setEditCommitmentType] = useState('');
  const [editCommitmentCommuteTime, setEditCommitmentCommuteTime] = useState(0);
  const [workOnDueDate, setWorkOnDueDate] = useState(true);
  const [editWorkOnDueDate, setEditWorkOnDueDate] = useState(true);
  const [description, setDescription] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [mealFeedbackId, setMealFeedbackId] = useState(null);
  const [actualMealStart, setActualMealStart] = useState('');
  const [actualMealEnd, setActualMealEnd] = useState('');
  const [showSleepFeedback, setShowSleepFeedback] = useState(false);
  const [actualWakeTime, setActualWakeTime] = useState('');
  const [actualSleepTime, setActualSleepTime] = useState('');
  const [mealTimeMode, setMealTimeMode] = useState('fixed');
  const [mealFlexDuration, setMealFlexDuration] = useState(30);
  const [mealFlexPreference, setMealFlexPreference] = useState('any');
  const [commitmentTimeMode, setCommitmentTimeMode] = useState('fixed');
  const [commitmentFlexDuration, setCommitmentFlexDuration] = useState(60);
  const [commitmentFlexPreference, setCommitmentFlexPreference] = useState('any');
  const [editMealTimeMode, setEditMealTimeMode] = useState('fixed');
  const [editMealFlexDuration, setEditMealFlexDuration] = useState(30);
  const [editMealFlexPreference, setEditMealFlexPreference] = useState('any');
  const [editCommitmentTimeMode, setEditCommitmentTimeMode] = useState('fixed');
  const [editCommitmentFlexDuration, setEditCommitmentFlexDuration] = useState(60);
  const [editCommitmentFlexPreference, setEditCommitmentFlexPreference] = useState('any');
  const [showerDuration, setShowerDuration] = useState(15);
  const [savedShowerDuration, setSavedShowerDuration] = useState(15);
  const [showerPreference, setShowerPreference] = useState('morning');
  const [savedShowerPreference, setSavedShowerPreference] = useState('morning');
  const [scheduleSummary, setScheduleSummary] = useState([]);
  const [commitmentDays, setCommitmentDays] = useState([]);
  const [editCommitmentDays, setEditCommitmentDays] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error('Failed to load tasks:', err));

    fetch('http://localhost:8000/history')
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed to load history:', err));

    fetch('http://localhost:8000/meals')
      .then((res) => res.json())
      .then((data) => setMeals(data))
      .catch((err) => console.error('Failed to load meals:', err));

    fetch('http://localhost:8000/commitments')
      .then((res) => res.json())
      .then((data) => setCommitments(data))
      .catch((err) => console.error('Failed to load commitments:', err));

    fetch('http://localhost:8000/sleep')
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

    fetch('http://localhost:8000/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.clockFormat) { 
          setSavedClockFormat(data.clockFormat); setClockFormat(data.clockFormat); 
        }
        if (data.maxBlockLength) { 
          setSavedMaxBlockLength(Number(data.maxBlockLength)); setMaxBlockLength(Number(data.maxBlockLength)); 
        }
        if (data.morningBuffer) { 
          setSavedMorningBuffer(Number(data.morningBuffer)); setMorningBuffer(Number(data.morningBuffer)); 
        }
        if (data.nightBuffer) { 
          setSavedNightBuffer(Number(data.nightBuffer)); setNightBuffer(Number(data.nightBuffer)); 
        }
        if (data.transitionGap) { 
          setSavedTransitionGap(Number(data.transitionGap)); setTransitionGap(Number(data.transitionGap)); 
        }
        if (data.showerDuration) { 
          setSavedShowerDuration(Number(data.showerDuration)); setShowerDuration(Number(data.showerDuration)); 
        }
        if (data.showerPreference) { 
          setSavedShowerPreference(data.showerPreference); setShowerPreference(data.showerPreference); 
        }
        if (data.energyPattern) { 
          setSavedEnergyPattern(data.energyPattern); setEnergyPattern(data.energyPattern); 
        }
      })
      .catch((err) => console.error('Failed to load settings:', err));
  }, []);

  function classifyTask(name, difficulty) {
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
    if (Number(difficulty) >= 5) {
      return 'deep';
    }
    return 'light';
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today && !workOnDueDate) {
      alert('Deadline cannot be in the past.');
      return;
    }
    const finalTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
    const newTask = {
      taskName: taskName.trim(),
      deadline,
      difficulty: Number(difficulty),
      importance: Number(importance),
      userPreference: Number(userPreference),
      duration: Number(duration),
      taskType: finalTaskType,
      category,
      workOnDueDate,
      description
    };
    fetch('http://localhost:8000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    })
      .then((res) => res.json())
      .then((savedTask) => {
        setTasks([...tasks, savedTask]);
        setTaskName('');
        setDeadline('');
        setDifficulty(5);
        setImportance(5);
        setUserPreference(5);
        setDuration('');
        setAutoTaskType('deep');
        setCategory('');
        setUserOverrideType(null);
        setWorkOnDueDate(true);
        setDescription('');
      })
      .catch((err) => console.error('Failed to add task:', err));
  }

  function handleDeleteTask(id) {
    fetch(`http://localhost:8000/tasks/${id}`, {
      method: 'DELETE'
    })
      .then(() => {
        setTasks(tasks.filter((task) => task.id !== id));
      })
      .catch((err) => console.error('Failed to delete task:', err));
  }

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
      const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      if (toMinutes(mealEnd) <= toMinutes(mealStart)) {
        alert('Meal end time must be after start time.');
        return;
      }
    }
    if (mealTimeMode === 'flexible' && (!mealFlexDuration || Number(mealFlexDuration) <= 0)) {
      alert('Please enter a valid duration for this meal.');
      return;
    }
    const newMeal = {
      mealName: mealName.trim(),
      mealStart: mealTimeMode === 'fixed' ? mealStart : null,
      mealEnd: mealTimeMode === 'fixed' ? mealEnd : null,
      commuteTime: mealCommuteTime,
      timeMode: mealTimeMode,
      flexDuration: mealFlexDuration,
      flexPreference: mealFlexPreference
    };
    fetch('http://localhost:8000/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMeal)
    })
      .then((res) => res.json())
      .then((savedMeal) => {
        setMeals([...meals, savedMeal]);
        setMealName('');
        setMealStart('');
        setMealEnd('');
        setMealCommuteTime(0);
        setMealTimeMode('fixed');
        setMealFlexDuration(30);
        setMealFlexPreference('any');
      })
      .catch((err) => console.error('Failed to add meal:', err));
  }

  function handleDeleteMeal(id) {
    fetch(`http://localhost:8000/meals/${id}`, { method: 'DELETE' })
      .then(() => setMeals(meals.filter((meal) => meal.id !== id)))
      .catch((err) => console.error('Failed to delete meal:', err));
  }

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
      const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      if (toMinutes(commitmentEnd) <= toMinutes(commitmentStart)) {
        alert('Commitment end time must be after start time.');
        return;
      }
    }
    if (commitmentTimeMode === 'flexible' && (!commitmentFlexDuration || Number(commitmentFlexDuration) <= 0)) {
      alert('Please enter a valid duration for this commitment.');
      return;
    }
    const newCommitment = {
      commitmentName: commitmentName.trim(),
      commitmentStart: commitmentTimeMode === 'fixed' ? commitmentStart : null,
      commitmentEnd: commitmentTimeMode === 'fixed' ? commitmentEnd : null,
      commitmentType,
      commuteTime,
      timeMode: commitmentTimeMode,
      flexDuration: commitmentFlexDuration,
      flexPreference: commitmentFlexPreference,
      days: commitmentDays.join(',')
    };
    fetch('http://localhost:8000/commitments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCommitment)
    })
      .then((res) => res.json())
      .then((savedCommitment) => {
        setCommitments([...commitments, savedCommitment]);
        setCommitmentName('');
        setCommitmentStart('');
        setCommitmentEnd('');
        setCommitmentType('');
        setCommuteTime(0);
        setCommitmentTimeMode('fixed');
        setCommitmentFlexDuration(60);
        setCommitmentFlexPreference('any');
        setCommitmentDays([]);
      })
      .catch((err) => console.error('Failed to add commitment:', err));
  }

  function handleDeleteCommitment(id) {
    fetch(`http://localhost:8000/commitments/${id}`, { method: 'DELETE' })
      .then(() => setCommitments(commitments.filter((c) => c.id !== id)))
      .catch((err) => console.error('Failed to delete commitment:', err));
  }

  function handleSaveSleepSchedule() {
    if (!wakeTime || !sleepTime) {
      alert('Please set both a wake time and a sleep time.');
      return;
    }
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const wakeMin = toMinutes(wakeTime);
    const sleepMin = toMinutes(sleepTime);
    const availableMinutes = sleepMin > wakeMin
      ? sleepMin - wakeMin
      : (sleepMin + 1440) - wakeMin;
    if (availableMinutes < 60) {
      alert('Your wake and sleep times are less than 1 hour apart. Please check your schedule.');
      return;
    }
    fetch('http://localhost:8000/sleep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wakeTime, sleepTime })
    })
      .then(() => setSleepScheduleSaved(true))
      .catch((err) => console.error('Failed to save sleep schedule:', err));
  }

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

  function toggleDay(day, days, setDays) {
    if (days.includes(day)) {
      setDays(days.filter((d) => d !== day));
    } else {
      setDays([...days, day]);
    }
  }

  function handleDeleteKeyword(keyword, type) {
    if (type === 'deep') {
      setCustomDeepKeywords(customDeepKeywords.filter((k) => k !== keyword));
    } else {
      setCustomLightKeywords(customLightKeywords.filter((k) => k !== keyword));
    }
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

  function calculatePriorityScore(task) {
    const today = new Date();
    const deadlineDate = new Date(task.deadline);
    const daysUntilDeadline = Math.max(0, (deadlineDate - today) / (1000 * 60 * 60 * 24));
    const effectiveDays = task.workOnDueDate ? daysUntilDeadline : Math.max(0, daysUntilDeadline - 1);
    const urgency = effectiveDays === 0 ? 1 : Math.max(0, 1 - effectiveDays / 30);
    const importance = Number(task.importance) / 10;
    const userPreference = Number(task.userPreference) / 10;
    const difficulty = Number(task.difficulty) / 10;

    let consistency = 0.5;
    if (task.category) {
      const categoryHistory = history.filter(
        (h) => h.category === task.category && h.completion_status
      );
      if (categoryHistory.length >= 2) {
        const completed = categoryHistory.filter(
          (h) => h.completion_status === 'Completed'
        ).length;
        consistency = completed / categoryHistory.length;
      }
    }

    const score =
      0.35 * urgency +
      0.25 * importance +
      0.20 * userPreference +
      0.15 * difficulty +
      0.05 * consistency;
    return (score * 100).toFixed(1);
  }

  function calculateAvailableTime() {
    if (!wakeTime || !sleepTime) {
      return null;
    }
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      const total = h * 60 + m;
      return total === 0 ? 1440 : total;
    };

    const effectiveWake = actualWakeTime || wakeTime;
    const effectiveSleep = actualSleepTime || sleepTime;

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
    const taskTime = tasks.reduce((total, task) => {
      if (!task.duration) {
        return total;
      }
      return total + Number(task.duration);
    }, 0);
    const availableTime = totalTime - mealTime - commitmentTime - taskTime;
    return {
      totalTime,
      mealTime,
      commitmentTime,
      taskTime,
      availableTime
    };
  }

  function generateSchedule() {
    if (!wakeTime || !sleepTime) {
      return [];
    }
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      const total = h * 60 + m;
      return total === 0 ? 1440 : total;
    };
    const toTimeString = (minutes) => {
      const wrapped = minutes % 1440;
      const h = Math.floor(wrapped / 60);
      const m = wrapped % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const todayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

    const effectiveWake = actualWakeTime || wakeTime;
    const effectiveSleep = actualSleepTime || sleepTime;

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
        const blocks = [{
          start: toMinutes(start),
          end: toMinutes(end),
          label: meal.mealName,
          type: 'meal'
        }];
        if (meal.commuteTime > 0) {
          blocks.unshift({
            start: toMinutes(start) - meal.commuteTime,
            end: toMinutes(start),
            label: `Commute to ${meal.mealName}`,
            type: 'commute'
          });
          blocks.push({
            start: toMinutes(end),
            end: toMinutes(end) + meal.commuteTime,
            label: `Commute back from ${meal.mealName}`,
            type: 'commute'
          });
        }
        return blocks;
      }),
      ...commitments.flatMap((commitment) => {
        if (commitment.timeMode === 'flexible' || !commitment.commitmentStart || !commitment.commitmentEnd) {
          return [];
        }
        if (commitment.days && commitment.days.length > 0) {
          const commitmentDayList = commitment.days.split(',').filter(Boolean);
          if (!commitmentDayList.includes(todayName)) {
            return [];
          }
        }
        const blocks = [{
          start: toMinutes(commitment.commitmentStart),
          end: toMinutes(commitment.commitmentEnd),
          label: commitment.commitmentName,
          type: 'commitment'
        }];
        if (commitment.commuteTime > 0) {
          blocks.unshift({
            start: toMinutes(commitment.commitmentStart) - commitment.commuteTime,
            end: toMinutes(commitment.commitmentStart),
            label: `Commute to ${commitment.commitmentName}`,
            type: 'commute'
          });
          blocks.push({
            start: toMinutes(commitment.commitmentEnd),
            end: toMinutes(commitment.commitmentEnd) + commitment.commuteTime,
            label: `Commute back from ${commitment.commitmentName}`,
            type: 'commute'
          });
        }
        return blocks;
      })
    ].sort((a, b) => a.start - b.start);

    const showerBlocks = [];
    if (savedShowerPreference === 'morning' || savedShowerPreference === 'both') {
      showerBlocks.push({
        start: wake,
        end: wake + savedShowerDuration,
        label: 'Shower',
        type: 'shower'
      });
    }
    if (savedShowerPreference === 'evening' || savedShowerPreference === 'both') {
      const eveningShowerStart = toMinutes(effectiveSleep) - savedNightBuffer - savedShowerDuration;
      showerBlocks.push({
        start: eveningShowerStart,
        end: eveningShowerStart + savedShowerDuration,
        label: 'Shower',
        type: 'shower'
      });
    }

    for (const s of showerBlocks) {
      blockedRanges.push(s);
    }
    blockedRanges.sort((a, b) => a.start - b.start);

    const schedule = [];

    schedule.push({
      start: toTimeString(toMinutes(effectiveWake)),
      end: toTimeString(wake),
      label: 'Morning routine',
      type: 'buffer'
    });

    for (const range of blockedRanges) {
      schedule.push({
        start: toTimeString(range.start),
        end: toTimeString(range.end),
        label: range.label,
        type: range.type
      });
    }

    schedule.push({
      start: toTimeString(toMinutes(effectiveSleep) - savedNightBuffer),
      end: toTimeString(toMinutes(effectiveSleep)),
      label: 'Wind down',
      type: 'buffer'
    });

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

    const isInPeak = (time) => {
      if (!peakHours) {
        return false;
      }
      return time >= peakHours.start && time < peakHours.end;
    };

    const isOccupied = (start, end) => {
      return schedule.some(
        (block) => start < toMinutes(block.end) && end > toMinutes(block.start)
      );
    };

    const getNextFreeStart = (from) => {
      let time = from;
      let safetyCounter = 0;
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
      if (preference === 'early_morning') return { start: 0, end: 9 * 60 };
      if (preference === 'morning') return { start: 9 * 60, end: 12 * 60 };
      if (preference === 'afternoon') return { start: 12 * 60, end: 17 * 60 };
      if (preference === 'evening') return { start: 17 * 60, end: 21 * 60 };
      if (preference === 'night') return { start: 21 * 60, end: sleep };
      return { start: wake, end: sleep };
    };

    const placeFlexBlock = (label, duration, preference, type, commuteTime = 0) => {
      const totalDuration = duration + (commuteTime * 2);
      const window = getPreferenceWindow(preference);
      const windowStart = Math.max(wake, window.start);
      const windowEnd = Math.min(sleep, window.end);
      let start = getNextFreeStart(windowStart);
      while (start + totalDuration <= windowEnd) {
        if (!isOccupied(start, start + totalDuration)) {
          if (commuteTime > 0) {
            schedule.push({
              start: toTimeString(start),
              end: toTimeString(start + commuteTime),
              label: `Commute to ${label}`,
              type: 'commute'
            });
          }
          schedule.push({
            start: toTimeString(start + commuteTime),
            end: toTimeString(start + commuteTime + duration),
            label,
            type
          });
          if (commuteTime > 0) {
            schedule.push({
              start: toTimeString(start + commuteTime + duration),
              end: toTimeString(start + totalDuration),
              label: `Commute back from ${label}`,
              type: 'commute'
            });
          }
          return true;
        }
        start++;
      }
      let fallback = getNextFreeStart(wake);
      while (fallback + totalDuration <= sleep) {
        if (!isOccupied(fallback, fallback + totalDuration)) {
          if (commuteTime > 0) {
            schedule.push({
              start: toTimeString(fallback),
              end: toTimeString(fallback + commuteTime),
              label: `Commute to ${label}`,
              type: 'commute'
            });
          }
          schedule.push({
            start: toTimeString(fallback + commuteTime),
            end: toTimeString(fallback + commuteTime + duration),
            label,
            type
          });
          if (commuteTime > 0) {
            schedule.push({
              start: toTimeString(fallback + commuteTime + duration),
              end: toTimeString(fallback + totalDuration),
              label: `Commute back from ${label}`,
              type: 'commute'
            });
          }
          return true;
        }
        fallback++;
      }
      return false;
    };

    for (const meal of meals) {
      if (meal.timeMode === 'flexible' && meal.flexDuration > 0) {
        placeFlexBlock(meal.mealName, meal.flexDuration, meal.flexPreference || 'any', 'meal', meal.commuteTime || 0);
      }
    }

    for (const commitment of commitments) {
      if (commitment.timeMode === 'flexible' && commitment.flexDuration > 0) {
        if (commitment.days && commitment.days.length > 0) {
          const commitmentDayList = commitment.days.split(',').filter(Boolean);
          if (!commitmentDayList.includes(todayName)) {
            continue;
          }
        }
        placeFlexBlock(commitment.commitmentName, commitment.flexDuration, commitment.flexPreference || 'any', 'commitment', commitment.commuteTime || 0);
      }
    }

    const sortedTasks = [...tasks]
      .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a));
    const deepTasks = sortedTasks.filter((t) => t.taskType === 'deep');
    const lightTasks = sortedTasks.filter((t) => t.taskType === 'light');
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
      let remaining = Math.round(Number(task.duration) * multiplier);      const limit = task.taskType === 'deep' ? savedMaxBlockLength : Infinity;
      let currentTime = getNextFreeStart(wake);

      const isOccupiedAt = (start, end) => {
        return schedule.some(
          (b) => start < toMinutes(b.end) && end > toMinutes(b.start)
        );
      };

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
        while (blockEnd > currentTime && isOccupiedAt(currentTime, blockEnd)) {
          blockEnd--;
        }
        const blockSize = blockEnd - currentTime;
        if (blockSize <= 0) {
          currentTime++;
          continue;
        }

        schedule.push({
          start: toTimeString(currentTime),
          end: toTimeString(blockEnd),
          label: task.taskName,
          type: isInPeak(currentTime) ? 'peak' : 'study',
          taskType: task.taskType
        });

        remaining -= blockSize;
        currentTime = blockEnd;

        if (remaining > 0) {
          const breakLength = Math.max(15, Math.round(blockSize * 0.15));
          const breakEnd = currentTime + breakLength;
          if (!isOccupiedAt(currentTime, breakEnd) && breakEnd <= sleep) {
            schedule.push({
              start: toTimeString(currentTime),
              end: toTimeString(breakEnd),
              label: 'Break',
              type: 'break'
            });
            currentTime = breakEnd + savedTransitionGap;
          } else {
            currentTime = getNextFreeStart(currentTime);
          }
        } else {
          currentTime += savedTransitionGap;
        }
      }
    }

    return schedule.sort((a, b) => a.start.localeCompare(b.start));
  }

  const activeTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
  const hasConflict = userOverrideType !== null && userOverrideType !== autoTaskType;

  function handleGenerateSchedule() {
    const schedule = generateSchedule();
    setGeneratedSchedule(schedule);
    setScheduleSummary(generateScheduleSummary(schedule));
  }

  function generateScheduleSummary(schedule) {
    const summary = [];

    if (actualWakeTime || actualSleepTime) {
      const parts = [];
      if (actualWakeTime) {
        parts.push(`wake shifted to ${formatTime(actualWakeTime)}`);
      }
      if (actualSleepTime) {
        parts.push(`sleep shifted to ${formatTime(actualSleepTime)}`);
      }
      summary.push(`Using actual sleep times — ${parts.join(', ')}`);
    }

    tasks.forEach((t) => {
      const { multiplier: m, source, key } = getTaskMultiplier(t);
      if (m === 1 || source === 'none') {
        return;
      }
      const adjusted = Math.round(Number(t.duration) * m);
      const diff = adjusted - Number(t.duration);
      const sourceLabel = source === 'task' ? `your "${key}" task history` : `${key} category history`;
      summary.push(
        `${t.taskName}: duration adjusted from ${t.duration} to ${adjusted} min (${diff > 0 ? '+' : ''}${diff} min based on ${sourceLabel})`
      );
    });

    const scheduledTaskNames = schedule
      .filter((b) => b.type === 'study' || b.type === 'peak')
      .map((b) => b.label);
    const missingTasks = tasks.filter((t) => !scheduledTaskNames.includes(t.taskName));
    missingTasks.forEach((t) => {
      summary.push(`${t.taskName} could not be fully scheduled — not enough free time today`);
    });

    return summary;
  }

  function getBlockDuration(start, end) {
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    let startM = toMinutes(start);
    let endM = toMinutes(end);
    if (endM <= startM) {
      endM += 1440;
    }
    const diff = endM - startM;
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    if (hours === 0) {
      return `${minutes} minutes`;
    }
    if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  }

  function handleSubmitFeedback(taskId) {
    DEBUG && console.log('handleSubmitFeedback called with taskId:', taskId);
    if (!completionStatus) {
      alert('Please select a completion status.');
      return;
    }
    if (!actualDuration || Number(actualDuration) <= 0) {
      alert('Please enter how long the task took (in minutes).');
      return;
    }
    fetch(`http://localhost:8000/tasks/${taskId}/feedback`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actual_duration: Number(actualDuration),
        actual_difficulty: Number(actualDifficulty),
        completion_status: completionStatus,
        start_time: taskStartTime ? taskStartTime.toISOString() : null,
        end_time: new Date().toISOString()
      })
    })
      .then((res) => {
        DEBUG && console.log('Response status:', res.status);
        return res.json();
      })
      .then((data) => {
        DEBUG && console.log('Response data:', data);
        setTasks(tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              actual_duration: Number(actualDuration),
              actual_difficulty: Number(actualDifficulty),
              completion_status: completionStatus
            };
          }
          return task;
        }));
        setFeedbackTaskId(null);
        setActualDuration('');
        setActualDifficulty(5);
        setCompletionStatus('');
        setManualStartTime('');
        fetch('http://localhost:8000/history')
          .then((res) => res.json())
          .then((data) => setHistory(data))
          .catch((err) => console.error('Failed to reload history:', err));
      })
      .catch((err) => console.error('Fetch failed:', err));
  }

  function calculateAccuracy(estimated, actual) {
    if (!estimated || !actual || actual === 0) {
      return null;
    }
    const accuracy = (estimated / actual) * 100;
    return Math.min(accuracy, 100).toFixed(1);
  }

  function calculateCategoryStats() {
    const categories = {};
    history.forEach((h) => {
      if (!h.category) {
        return;
      }
      if (!categories[h.category]) {
        categories[h.category] = {
          count: 0,
          totalEstimated: 0,
          totalActual: 0,
          totalAccuracy: 0,
          completed: 0,
          notCompleted: 0,
          partiallyCompleted: 0
        };
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
      } else if (h.completion_status === 'Partially Completed') {
        cat.partiallyCompleted++;
      } else if (h.completion_status === 'Not Completed') {
        cat.notCompleted++;
      }
    });
    return categories;
  }

  function calculateWeeklyStats() {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekHistory = history.filter((h) => {
      if (!h.completed_at) {
        return false;
      }
      return new Date(h.completed_at) >= oneWeekAgo;
    });

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

    const overallAccuracy = weekHistory.filter((h) => h.estimated_duration && h.actual_duration).length > 0
      ? (weekHistory
          .filter((h) => h.estimated_duration && h.actual_duration)
          .reduce((sum, h) => sum + Math.min((h.estimated_duration / h.actual_duration) * 100, 100), 0)
        / weekHistory.filter((h) => h.estimated_duration && h.actual_duration).length
        ).toFixed(1)
      : null;

    return {
      count: weekHistory.length,
      totalEstimated,
      totalActual,
      completed,
      partial,
      notCompleted,
      byCategory,
      overallAccuracy
    };
  }

  function generateSuggestions() {
    const suggestions = [];

    const multipliers = getCategoryMultipliers();
    for (const [cat, m] of Object.entries(multipliers)) {
      if (m > 1.3) {
        suggestions.push(`You tend to underestimate ${cat} tasks by ${((m - 1) * 100).toFixed(0)}% — try adding ${Math.round((m - 1) * 100)}% more time when estimating.`);
      } else if (m < 0.7) {
        suggestions.push(`You finish ${cat} tasks faster than expected — your estimates may be too conservative.`);
      }
    }

    const best = getMostProductivePeriod();
    if (best.period && parseFloat(best.rate) >= 70) {
      suggestions.push(`Your best work happens during ${best.period} (${best.rate}% completion rate) — try scheduling deep work then.`);
    }

    const overdueTasks = tasks.filter((t) => {
      if (t.completion_status) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.deadline) < today;
    });
    if (overdueTasks.length > 0) {
      suggestions.push(`You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}: ${overdueTasks.map((t) => t.taskName).join(', ')}.`);
    }

    const dueTodayOrTomorrow = tasks.filter((t) => {
      if (t.completion_status) {
        return false;
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const deadline = new Date(t.deadline);
      deadline.setHours(0, 0, 0, 0);
      return deadline <= tomorrow;
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

  function getCategoryMultipliers() {
    const categories = {};
    history.forEach((h) => {
      if (!h.category || !h.estimated_duration || !h.actual_duration || h.actual_duration === 0) return;
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
    const nameLower = task.taskName.toLowerCase();
    const stopWords = ['homework', 'assignment', 'project', 'work', 'study', 'for', 'the', 'and', 'a', 'an', 'of', 'to'];
    const words = nameLower
      .split(/\s+/)
      .map((w) => w.replace(/[^a-z]/g, ''))
      .filter((w) => w.length > 2 && !stopWords.includes(w));
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

  function handleStartTask(taskId) {
    setActiveTaskId(taskId);
    setTaskStartTime(new Date());
  }

  function handleStopTask() {
    if (!taskStartTime) {
      return;
    }
    const endTime = new Date();
    const elapsedMinutes = Math.round((endTime - taskStartTime) / 60000);
    setActualDuration(elapsedMinutes);
    setTaskStartTime(null);
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
    let bestPeriod = null;
    let bestRate = -1;

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

  function saveSetting(key, value) {
    fetch('http://localhost:8000/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: String(value) })
    })
      .then((res) => res.json())
      .then((data) => { DEBUG && console.log('Setting saved:', data); })
      .catch((err) => console.error('Failed to save setting:', err));
  }

  function handleEditTask(task) {
    setEditingTaskId(task.id);
    setEditTaskName(task.taskName);
    setEditDeadline(task.deadline);
    setEditCategory(task.category || '');
    setEditDifficulty(task.difficulty);
    setEditImportance(task.importance);
    setEditUserPreference(task.userPreference);
    setEditDuration(task.duration);
    setEditTaskType(task.taskType);
    setEditWorkOnDueDate(task.workOnDueDate !== 0);
    setEditDescription(task.description || '');
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
    DEBUG && console.log('Updating task:', taskId);
    const updatedTask = {
      taskName: editTaskName.trim(),
      deadline: editDeadline,
      difficulty: Number(editDifficulty),
      importance: Number(editImportance),
      userPreference: Number(editUserPreference),
      duration: Number(editDuration),
      taskType: editTaskType,
      category: editCategory,
      workOnDueDate: editWorkOnDueDate,
      description: editDescription
    };
    fetch(`http://localhost:8000/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTask)
    })
      .then((res) => res.json())
      .then((saved) => {
        setTasks(tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, ...saved };
          }
          return task;
        }));
        setEditingTaskId(null);
      })
      .catch((err) => console.error('Failed to update task:', err));
  }

  function handleEditMeal(meal) {
    setEditingMealId(meal.id);
    setEditMealName(meal.mealName);
    setEditMealStart(meal.mealStart || '');
    setEditMealEnd(meal.mealEnd || '');
    setEditMealCommuteTime(meal.commuteTime || 0);
    setEditMealTimeMode(meal.timeMode || 'fixed');
    setEditMealFlexDuration(meal.flexDuration || 30);
    setEditMealFlexPreference(meal.flexPreference || 'any');
  }

  function handleUpdateMeal(mealId) {
    const updatedMeal = {
      mealName: editMealName,
      mealStart: editMealTimeMode === 'fixed' ? editMealStart : null,
      mealEnd: editMealTimeMode === 'fixed' ? editMealEnd : null,
      commuteTime: editMealCommuteTime,
      timeMode: editMealTimeMode,
      flexDuration: editMealFlexDuration,
      flexPreference: editMealFlexPreference
    };
    fetch(`http://localhost:8000/meals/${mealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMeal)
    })
      .then((res) => res.json())
      .then((saved) => {
        setMeals(meals.map((meal) => meal.id === mealId ? saved : meal));
        setEditingMealId(null);
      })
      .catch((err) => console.error('Failed to update meal:', err));
  }

  function handleEditCommitment(commitment) {
    setEditingCommitmentId(commitment.id);
    setEditCommitmentName(commitment.commitmentName);
    setEditCommitmentStart(commitment.commitmentStart || '');
    setEditCommitmentEnd(commitment.commitmentEnd || '');
    setEditCommitmentType(commitment.commitmentType || '');
    setEditCommitmentCommuteTime(commitment.commuteTime || 0);
    setEditCommitmentTimeMode(commitment.timeMode || 'fixed');
    setEditCommitmentFlexDuration(commitment.flexDuration || 60);
    setEditCommitmentFlexPreference(commitment.flexPreference || 'any');
    setEditCommitmentDays(commitment.days ? commitment.days.split(',').filter(Boolean) : []);
  }

  function handleUpdateCommitment(commitmentId) {
    const updatedCommitment = {
      commitmentName: editCommitmentName,
      commitmentStart: editCommitmentTimeMode === 'fixed' ? editCommitmentStart : null,
      commitmentEnd: editCommitmentTimeMode === 'fixed' ? editCommitmentEnd : null,
      commitmentType: editCommitmentType,
      commuteTime: editCommitmentCommuteTime,
      timeMode: editCommitmentTimeMode,
      flexDuration: editCommitmentFlexDuration,
      flexPreference: editCommitmentFlexPreference,
      days: editCommitmentDays.join(',')
    };
    fetch(`http://localhost:8000/commitments/${commitmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCommitment)
    })
      .then((res) => res.json())
      .then((saved) => {
        setCommitments(commitments.map((c) => c.id === commitmentId ? saved : c));
        setEditingCommitmentId(null);
      })
      .catch((err) => console.error('Failed to update commitment:', err));
  }

  function handleLogActualMeal(mealId) {
    fetch(`http://localhost:8000/meals/${mealId}/actual`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actual_start: actualMealStart,
        actual_end: actualMealEnd
      })
    })
      .then((res) => res.json())
      .then((saved) => {
        setMeals(meals.map((meal) => meal.id === mealId ? saved : meal));
        setMealFeedbackId(null);
        setActualMealStart('');
        setActualMealEnd('');
      })
      .catch((err) => console.error('Failed to log actual meal time:', err));
  }

  function handleLogActualSleep() {
    if (!actualWakeTime && !actualSleepTime) {
      alert('Please enter at least one actual time before saving.');
      return;
    }
    const payload = {};
    if (actualWakeTime) {
      payload.actual_wake = actualWakeTime;
    }
    if (actualSleepTime) {
      payload.actual_sleep = actualSleepTime;
    }
    fetch('http://localhost:8000/sleep/actual', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actual_wake: actualWakeTime || null,
        actual_sleep: actualSleepTime || null
      })
    })
      .then(() => {
        setShowSleepFeedback(false);
      })
      .catch((err) => console.error('Failed to log actual sleep:', err));
  }

  return (
    <div>
      <nav>
        <img src={logo} alt="Atlas logo" />
        <h1>Atlas</h1>
        <ul>
          <li>Dashboard</li>
          <li>Schedule</li>
          <li>Tasks</li>
          <li>Availability</li>
          <li>Progress</li>
          <li>Settings</li>
        </ul>
      </nav>
      <main>
        <section id="dashboard">
          <h2>Dashboard</h2>
          {(() => {
            const suggestions = generateSuggestions();
            if (suggestions.length > 0) {
              return (
                <div>
                  <h3>Suggestions</h3>
                  {suggestions.map((s, i) => (
                    <p key={i}>💡 {s}</p>
                  ))}
                </div>
              );
            }
            return null;
          })()}
          {(() => {
            const result = calculateAvailableTime();
            if (!result) {
              return <p>Set your wake and sleep times in Availability to see your schedule breakdown.</p>;
            }
            return (
              <div>
                <p>Total time: {result.totalTime} minutes ({(result.totalTime / 60).toFixed(1)} hours)</p>
                <p>Meals: -{result.mealTime} minutes ({(result.mealTime / 60).toFixed(1)} hours)</p>
                <p>Commitments: -{result.commitmentTime} minutes ({(result.commitmentTime / 60).toFixed(1)} hours)</p>
                <p>Tasks: -{result.taskTime} minutes ({(result.taskTime / 60).toFixed(1)} hours)</p>
                <hr />
                <p>Available study time: {result.availableTime} minutes ({(result.availableTime / 60).toFixed(1)} hours)</p>
              </div>
            );
          })()}
        </section>

        <section id="schedule">
          <h2>Schedule</h2>
          {!wakeTime || !sleepTime ? (
            <p>Set your wake and sleep times in Availability to generate a schedule.</p>
          ) : tasks.length === 0 ? (
            <p>Add tasks to generate a schedule.</p>
          ) : (
            <div>
              <button type="button" onClick={handleGenerateSchedule}>Generate Schedule</button>
              {(actualWakeTime || actualSleepTime) && (
                <p>Using actual sleep times: {actualWakeTime ? `woke at ${formatTime(actualWakeTime)}` : ''}{actualWakeTime && actualSleepTime ? ', ' : ''}{actualSleepTime ? `slept at ${formatTime(actualSleepTime)}` : ''}</p>
              )}
              {scheduleSummary.length > 0 && (
                <div>
                  <h4>Schedule Notes</h4>
                  {scheduleSummary.map((note, i) => (
                    <p key={i}>⚠ {note}</p>
                  ))}
                </div>
              )}
              {generatedSchedule.length === 0 ? (
                <p>Click Generate Schedule to see your day.</p>
              ) : (
                generatedSchedule.map((block, index) => (
                  <div key={index}>
                    {block.type === 'break' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>— Break —</p>
                      </div>
                    ) : block.type === 'meal' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>🍽 {block.label}</p>
                      </div>
                    ) : block.type === 'commitment' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>📌 {block.label}</p>
                      </div>
                    ) : block.type === 'commute' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>🚗 {block.label}</p>
                      </div>
                    ) : block.type === 'buffer' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>🌅 {block.label}</p>
                      </div>
                    ) : block.type === 'shower' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>🚿 {block.label}</p>
                      </div>
                    ) : (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>
                          {block.label}
                          {block.type === 'peak' ? ' ⭐' : ''}
                          {block.taskType === 'deep' ? ' — Deep Work' : ' — Light Work'}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section id="tasks">
          <h2>Tasks</h2>
          <form onSubmit={handleAddTask}>
            <div>
              <label>Task Name: </label>
              <input
                type="text"
                placeholder="e.g. Study for Math exam"
                value={taskName}
                onChange={(e) => {
                  setTaskName(e.target.value);
                  setAutoTaskType(classifyTask(e.target.value, difficulty));
                  setUserOverrideType(null);
                }}
                required
              />
            </div>
            <div>
              <label>Description (optional): </label>
              <textarea
                placeholder="e.g. Binary trees assignment covering chapters 5-7"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="2"
              />
            </div>
            <div>
              <label>Deadline: </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Category: </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                <option value="Coding">Coding</option>
                <option value="Homework">Homework</option>
                <option value="Reading">Reading</option>
                <option value="Studying">Studying</option>
                <option value="Writing">Writing</option>
                <option value="Project Work">Project Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label>Difficulty (1-10): </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.01"
                value={difficulty}
                onChange={(e) => {
                  setDifficulty(e.target.value);
                  setAutoTaskType(classifyTask(taskName, e.target.value));
                  setUserOverrideType(null);
                }}
              />
              {editingDifficulty ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  value={difficulty}
                  onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                  onBlur={() => setEditingDifficulty(false)}
                  autoFocus
                />
              ) : (
                <span onClick={() => setEditingDifficulty(true)}>
                  {difficulty}
                </span>
              )}
            </div>
            <div>
              <label>Importance (1-10): </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.01"
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
              />
              {editingImportance ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  value={importance}
                  onChange={(e) => setImportance(parseFloat(e.target.value))}
                  onBlur={() => setEditingImportance(false)}
                  autoFocus
                />
              ) : (
                <span onClick={() => setEditingImportance(true)}>
                  {importance}
                </span>
              )}
            </div>
            <div>
              <label>Personal Priority (1-10): </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.01"
                value={userPreference}
                onChange={(e) => setUserPreference(e.target.value)}
              />
              {editingUserPreference ? (
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.01"
                  value={userPreference}
                  onChange={(e) => setUserPreference(parseFloat(e.target.value))}
                  onBlur={() => setEditingUserPreference(false)}
                  autoFocus
                />
              ) : (
                <span onClick={() => setEditingUserPreference(true)}>
                  {userPreference}
                </span>
              )}
            </div>
            <div>
              <label>Estimated Duration (minutes): </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Can you work on this task on the due date? </label>
              <input
                type="checkbox"
                checked={workOnDueDate}
                onChange={(e) => setWorkOnDueDate(e.target.checked)}
              />
              <span>{workOnDueDate ? 'Yes' : 'No'}</span>
            </div>
            <div>
              <p>Atlas thinks this is: <strong>{activeTaskType === 'deep' ? 'Deep Work' : 'Light Work'}</strong></p>
              {hasConflict && (
                <p>You changed this to: <strong>{userOverrideType === 'deep' ? 'Deep Work' : 'Light Work'}</strong></p>
              )}
              <button
                type="button"
                onClick={() => setUserOverrideType(activeTaskType === 'deep' ? 'light' : 'deep')}
              >
                {userOverrideType === null
                  ? `Disagree? Switch to ${autoTaskType === 'deep' ? 'Light Work' : 'Deep Work'}`
                  : hasConflict
                  ? `Undo — switch back to ${autoTaskType === 'deep' ? 'Deep Work' : 'Light Work'}`
                  : `Disagree? Switch to ${autoTaskType === 'deep' ? 'Light Work' : 'Deep Work'}`
                }
              </button>
            </div>
            <button type="submit">Add Task</button>
          </form>

          <h3>Task List</h3>
          {tasks.length === 0 ? (
            <p>No tasks added yet.</p>
          ) : (
            [...tasks]
              .sort((a, b) => calculatePriorityScore(b) - calculatePriorityScore(a))
              .map((task) => (
                <div key={task.id}>
                  <strong>{task.taskName}</strong>
                  {task.description && (
                    <p>Description: {task.description}</p>
                  )}
                  <p>Category: {task.category}</p>
                  <p>Deadline: {task.deadline}</p>
                  <p>Difficulty: {task.difficulty}</p>
                  <p>Importance: {task.importance}</p>
                  <p>Personal Priority: {task.userPreference}</p>
                  {(() => {
                    const { multiplier, source, key } = getTaskMultiplier(task);
                    const adjusted = Math.round(Number(task.duration) * multiplier);
                    const sourceLabel = source === 'task'
                      ? `your "${key}" task history`
                      : source === 'category'
                      ? `your ${key} history`
                      : null;
                    return (
                      <div>
                        <p>Duration: {task.duration} minutes (estimated)</p>
                        {multiplier !== 1 && sourceLabel && (
                          <p>Adjusted duration: {adjusted} minutes
                            ({multiplier > 1 ? '+' : ''}{((multiplier - 1) * 100).toFixed(0)}% based on {sourceLabel})
                          </p>
                        )}
                      </div>
                    );
                  })()}
                  <p>Work on due date: {task.workOnDueDate ? 'Yes' : 'No'}</p>
                  <p>Task Type: {task.taskType === 'deep' ? 'Deep Work' : 'Light Work'}</p>
                  {task.completion_status ? (
                    <div>
                      <p>Completion: {task.completion_status}</p>
                      <p>Actual Duration: {task.actual_duration} minutes</p>
                      <p>Actual Difficulty: {task.actual_difficulty}</p>
                    </div>
                  ) : (
                    <div>
                      {feedbackTaskId === task.id ? (
                        <div>
                          <h4>How did it go?</h4>
                          <div>
                            <label>Did you complete this task? </label>
                            <select
                              value={completionStatus}
                              onChange={(e) => setCompletionStatus(e.target.value)}
                            >
                              <option value="">Select...</option>
                              <option value="Completed">Completed</option>
                              <option value="Partially Completed">Partially Completed</option>
                              <option value="Not Completed">Not Completed</option>
                            </select>
                          </div>
                          <div>
                            {taskStartTime ? (
                              <p>Timer recorded — actual duration: {actualDuration} minutes (you can adjust if needed)</p>
                            ) : (
                              <div>
                                <p>Did you use the timer? If not, either enter when you started or how long it took.</p>
                                <div>
                                  <label>When did you start? </label>
                                  <TimePicker
                                    value={manualStartTime}
                                    onChange={(time) => {
                                      setManualStartTime(time);
                                      if (time) {
                                        const toMinutes = (t) => {
                                          const [h, m] = t.split(':').map(Number);
                                          return h * 60 + m;
                                        };
                                        const now = new Date();
                                        const currentMinutes = now.getHours() * 60 + now.getMinutes();
                                        const startMinutes = toMinutes(time);
                                        const elapsed = Math.max(1, currentMinutes - startMinutes);
                                        setActualDuration(elapsed);
                                      }
                                    }}
                                    clockFormat={savedClockFormat}
                                  />
                                </div>
                                <div>
                                  <label>Or enter duration manually (minutes): </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={actualDuration}
                                    onChange={(e) => setActualDuration(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label>How difficult was it actually? (1-10): </label>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.01"
                              value={actualDifficulty}
                              onChange={(e) => setActualDifficulty(e.target.value)}
                            />
                            {editingActualDifficulty ? (
                              <input
                                type="number"
                                min="1"
                                max="10"
                                step="0.01"
                                value={actualDifficulty}
                                onChange={(e) => setActualDifficulty(parseFloat(e.target.value))}
                                onBlur={() => setEditingActualDifficulty(false)}
                                autoFocus
                              />
                            ) : (
                              <span onClick={() => setEditingActualDifficulty(true)}>
                                {actualDifficulty}
                              </span>
                            )}
                          </div>
                          <button type="button" onClick={() => handleSubmitFeedback(task.id)}>Submit Feedback</button>
                          <button type="button" onClick={() => setFeedbackTaskId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <div>
                          {activeTaskId === task.id ? (
                            <div>
                              <p>⏱ Task in progress...</p>
                              <button
                                type="button"
                                onClick={() => {
                                  handleStopTask();
                                  setFeedbackTaskId(task.id);
                                  setActiveTaskId(null);
                                }}
                              >
                                Stop Timer
                              </button>
                            </div>
                          ) : (
                            <div>
                              <button
                                type="button"
                                onClick={() => handleStartTask(task.id)}
                                disabled={activeTaskId !== null}
                              >
                                Start Task
                              </button>
                              <button
                                type="button"
                                onClick={() => setFeedbackTaskId(task.id)}
                              >
                                Mark as Done
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {editingTaskId === task.id ? (
                    <div>
                      <h4>Edit Task</h4>
                      <div>
                        <label>Task Name: </label>
                        <input
                          type="text"
                          value={editTaskName}
                          onChange={(e) => setEditTaskName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Description (optional): </label>
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          rows="2"
                        />
                      </div>
                      <div>
                        <label>Deadline: </label>
                        <input
                          type="date"
                          value={editDeadline}
                          onChange={(e) => setEditDeadline(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Category: </label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                        >
                          <option value="">Select category</option>
                          <option value="Coding">Coding</option>
                          <option value="Homework">Homework</option>
                          <option value="Reading">Reading</option>
                          <option value="Studying">Studying</option>
                          <option value="Writing">Writing</option>
                          <option value="Project Work">Project Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label>Difficulty (1-10): </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.01"
                          value={editDifficulty}
                          onChange={(e) => setEditDifficulty(e.target.value)}
                        />
                        <span>{editDifficulty}</span>
                      </div>
                      <div>
                        <label>Importance (1-10): </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.01"
                          value={editImportance}
                          onChange={(e) => setEditImportance(e.target.value)}
                        />
                        <span>{editImportance}</span>
                      </div>
                      <div>
                        <label>Personal Priority (1-10): </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          step="0.01"
                          value={editUserPreference}
                          onChange={(e) => setEditUserPreference(e.target.value)}
                        />
                        <span>{editUserPreference}</span>
                      </div>
                      <div>
                        <label>Estimated Duration (minutes): </label>
                        <input
                          type="number"
                          min="1"
                          value={editDuration}
                          onChange={(e) => setEditDuration(e.target.value)}
                        />
                      </div>
                      <div>
                        <label>Can you work on this task on the due date? </label>
                        <input
                          type="checkbox"
                          checked={editWorkOnDueDate}
                          onChange={(e) => setEditWorkOnDueDate(e.target.checked)}
                        />
                        <span>{editWorkOnDueDate ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <label>Task Type: </label>
                        <select
                          value={editTaskType}
                          onChange={(e) => setEditTaskType(e.target.value)}
                        >
                          <option value="deep">Deep Work</option>
                          <option value="light">Light Work</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => handleUpdateTask(task.id)}>Save Changes</button>
                      <button type="button" onClick={() => setEditingTaskId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div>
                      <button type="button" onClick={() => handleEditTask(task)}>Edit</button>
                      <button type="button" onClick={() => handleDeleteTask(task.id)}>Delete</button>
                    </div>
                  )}
                </div>
              ))
          )}
        </section>

        <section id="availability">
          <h2>Availability</h2>

          <h3>Sleep Schedule</h3>
          <div>
            <label>Wake-up time: </label>
            <TimePicker
              value={wakeTime}
              onChange={setWakeTime}
              clockFormat={savedClockFormat}
            />
          </div>
          <div>
            <label>Sleep time: </label>
            <TimePicker
              value={sleepTime}
              onChange={setSleepTime}
              clockFormat={savedClockFormat}
            />
          </div>
          <button type="button" onClick={handleSaveSleepSchedule}>Confirm</button>
          {sleepScheduleSaved && (
            <div>
              <p>Sleep schedule saved — wake up at {formatTime(wakeTime)}, sleep at {formatTime(sleepTime)}.</p>
              {actualWakeTime && (
                <p>Actually woke up at {formatTime(actualWakeTime)}</p>
              )}
              {actualSleepTime && (
                <p>Actually slept at {formatTime(actualSleepTime)}</p>
              )}
              {showSleepFeedback ? (
                <div>
                  <h4>Log Actual Sleep Times</h4>
                  <p>Leave either field unchanged if you woke up / slept at the planned time.</p>
                  <div>
                    <label>Actual wake-up time: </label>
                    <TimePicker
                      value={actualWakeTime || wakeTime}
                      onChange={setActualWakeTime}
                      clockFormat={savedClockFormat}
                    />
                  </div>
                  <div>
                    <label>Actual sleep time: </label>
                    <TimePicker
                      value={actualSleepTime || sleepTime}
                      onChange={setActualSleepTime}
                      clockFormat={savedClockFormat}
                    />
                  </div>
                  <button type="button" onClick={handleLogActualSleep}>Save</button>
                  <button type="button" onClick={() => setShowSleepFeedback(false)}>Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowSleepFeedback(true)}>
                  Log Actual Sleep Times
                </button>
              )}
            </div>
          )}

          <h3>Meals</h3>
          <form onSubmit={handleAddMeal}>
            <div>
              <label>Meal name: </label>
              <input
                type="text"
                placeholder="e.g. Lunch"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Time mode: </label>
              <select value={mealTimeMode} onChange={(e) => setMealTimeMode(e.target.value)}>
                <option value="fixed">Fixed time</option>
                <option value="flexible">Flexible time</option>
              </select>
            </div>
            {mealTimeMode === 'fixed' ? (
              <div>
                <div>
                  <label>Start time: </label>
                  <TimePicker value={mealStart} onChange={setMealStart} clockFormat={savedClockFormat} />
                </div>
                <div>
                  <label>End time: </label>
                  <TimePicker value={mealEnd} onChange={setMealEnd} clockFormat={savedClockFormat} />
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <label>Duration (minutes): </label>
                  <input
                    type="number"
                    min="1"
                    value={mealFlexDuration}
                    onChange={(e) => setMealFlexDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Preferred time: </label>
                  <FlexPreferenceSelect value={mealFlexPreference} onChange={setMealFlexPreference} />
                </div>
              </div>
            )}
            <div>
              <label>Commute time (minutes, optional): </label>
              <input
                type="number"
                min="0"
                max="120"
                value={mealCommuteTime}
                onChange={(e) => setMealCommuteTime(Number(e.target.value))}
              />
            </div>
            <button type="submit">Add Meal</button>
          </form>

          <h4>Meal List</h4>
          {meals.length === 0 ? (
            <p>No meals added yet.</p>
          ) : (
            meals.map((meal) => (
              <div key={meal.id}>
                {editingMealId === meal.id ? (
                  <div>
                    <h4>Edit Meal</h4>
                    <div>
                      <label>Meal name: </label>
                      <input
                        type="text"
                        value={editMealName}
                        onChange={(e) => setEditMealName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Time mode: </label>
                      <select value={editMealTimeMode} onChange={(e) => setEditMealTimeMode(e.target.value)}>
                        <option value="fixed">Fixed time</option>
                        <option value="flexible">Flexible time</option>
                      </select>
                    </div>
                    {editMealTimeMode === 'fixed' ? (
                      <div>
                        <div>
                          <label>Start time: </label>
                          <TimePicker value={editMealStart} onChange={setEditMealStart} clockFormat={savedClockFormat} />
                        </div>
                        <div>
                          <label>End time: </label>
                          <TimePicker value={editMealEnd} onChange={setEditMealEnd} clockFormat={savedClockFormat} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <label>Duration (minutes): </label>
                          <input
                            type="number"
                            min="1"
                            value={editMealFlexDuration}
                            onChange={(e) => setEditMealFlexDuration(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label>Preferred time: </label>
                          <FlexPreferenceSelect value={editMealFlexPreference} onChange={setEditMealFlexPreference} />
                        </div>
                      </div>
                    )}
                    <div>
                      <label>Commute time (minutes): </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editMealCommuteTime}
                        onChange={(e) => setEditMealCommuteTime(Number(e.target.value))}
                      />
                    </div>
                    <button type="button" onClick={() => handleUpdateMeal(meal.id)}>Save Changes</button>
                    <button type="button" onClick={() => setEditingMealId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <strong>{meal.mealName}</strong>
                    {meal.timeMode === 'flexible' ? (
                      <p>Flexible — {meal.flexDuration} minutes — {meal.flexPreference === 'any' ? 'any time' : meal.flexPreference.replace('_', ' ')}</p>
                    ) : (
                      <p>Planned: {formatTime(meal.mealStart)} — {formatTime(meal.mealEnd)}</p>
                    )}
                    {meal.commuteTime > 0 && (
                      <p>Commute: {meal.commuteTime} minutes</p>
                    )}
                    {meal.actual_start && (
                      <p>Actual: {formatTime(meal.actual_start)} — {formatTime(meal.actual_end)}</p>
                    )}
                    {mealFeedbackId === meal.id ? (
                      <div>
                        <h4>What actually happened?</h4>
                        <div>
                          <label>Actual start time: </label>
                          <TimePicker
                            value={actualMealStart}
                            onChange={setActualMealStart}
                            clockFormat={savedClockFormat}
                          />
                        </div>
                        <div>
                          <label>Actual end time: </label>
                          <TimePicker
                            value={actualMealEnd}
                            onChange={setActualMealEnd}
                            clockFormat={savedClockFormat}
                          />
                        </div>
                        <button type="button" onClick={() => handleLogActualMeal(meal.id)}>Save</button>
                        <button type="button" onClick={() => setMealFeedbackId(null)}>Cancel</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setMealFeedbackId(meal.id)}>
                        Log Actual Time
                      </button>
                    )}
                    <button type="button" onClick={() => handleEditMeal(meal)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteMeal(meal.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))
          )}

          <h3>Fixed Commitments</h3>
          <form onSubmit={handleAddCommitment}>
            <div>
              <label>Commitment name: </label>
              <input
                type="text"
                placeholder="e.g. Work shift"
                value={commitmentName}
                onChange={(e) => setCommitmentName(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Time mode: </label>
              <select value={commitmentTimeMode} onChange={(e) => setCommitmentTimeMode(e.target.value)}>
                <option value="fixed">Fixed time</option>
                <option value="flexible">Flexible time</option>
              </select>
            </div>
            {commitmentTimeMode === 'fixed' ? (
              <div>
                <div>
                  <label>Start time: </label>
                  <TimePicker value={commitmentStart} onChange={setCommitmentStart} clockFormat={savedClockFormat} />
                </div>
                <div>
                  <label>End time: </label>
                  <TimePicker value={commitmentEnd} onChange={setCommitmentEnd} clockFormat={savedClockFormat} />
                </div>
              </div>
            ) : (
              <div>
                <div>
                  <label>Duration (minutes): </label>
                  <input
                    type="number"
                    min="1"
                    value={commitmentFlexDuration}
                    onChange={(e) => setCommitmentFlexDuration(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label>Preferred time: </label>
                  <FlexPreferenceSelect value={commitmentFlexPreference} onChange={setCommitmentFlexPreference} />
                </div>
              </div>
            )}
            <div>
            <div>
              <label>Days (leave empty for every day): </label>
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={commitmentDays.includes(day)}
                    onChange={() => toggleDay(day, commitmentDays, setCommitmentDays)}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
              ))}
            </div>
              <select
                value={commitmentType}
                onChange={(e) => setCommitmentType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="Job/Internship">Job/Internship</option>
                <option value="Lecture">Lecture</option>
                <option value="Lab">Lab</option>
                <option value="Discussion">Discussion</option>
                <option value="Club Meeting">Club Meeting</option>
                <option value="Sports Practice">Sports Practice</option>
                <option value="Volunteer">Volunteer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label>Commute time (minutes, optional): </label>
              <input
                type="number"
                min="0"
                max="120"
                value={commuteTime}
                onChange={(e) => setCommuteTime(Number(e.target.value))}
              />
            </div>
            <button type="submit">Add Commitment</button>
          </form>

          <h4>Commitment List</h4>
          {commitments.length === 0 ? (
            <p>No commitments added yet.</p>
          ) : (
            commitments.map((commitment) => (
              <div key={commitment.id}>
                {editingCommitmentId === commitment.id ? (
                  <div>
                    <h4>Edit Commitment</h4>
                    <div>
                      <label>Commitment name: </label>
                      <input
                        type="text"
                        value={editCommitmentName}
                        onChange={(e) => setEditCommitmentName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Time mode: </label>
                      <select value={editCommitmentTimeMode} onChange={(e) => setEditCommitmentTimeMode(e.target.value)}>
                        <option value="fixed">Fixed time</option>
                        <option value="flexible">Flexible time</option>
                      </select>
                    </div>
                    {editCommitmentTimeMode === 'fixed' ? (
                      <div>
                        <div>
                          <label>Start time: </label>
                          <TimePicker value={editCommitmentStart} onChange={setEditCommitmentStart} clockFormat={savedClockFormat} />
                        </div>
                        <div>
                          <label>End time: </label>
                          <TimePicker value={editCommitmentEnd} onChange={setEditCommitmentEnd} clockFormat={savedClockFormat} />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div>
                          <label>Duration (minutes): </label>
                          <input
                            type="number"
                            min="1"
                            value={editCommitmentFlexDuration}
                            onChange={(e) => setEditCommitmentFlexDuration(Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <label>Preferred time: </label>
                          <FlexPreferenceSelect value={editCommitmentFlexPreference} onChange={setEditCommitmentFlexPreference} />
                        </div>
                      </div>
                    )}
                    <div>
                    <div>
                      <label>Days (leave empty for every day): </label>
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                        <label key={day}>
                          <input
                            type="checkbox"
                            checked={editCommitmentDays.includes(day)}
                            onChange={() => toggleDay(day, editCommitmentDays, setEditCommitmentDays)}
                          />
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </label>
                      ))}
                    </div>
                      <label>Type: </label>
                      <select
                        value={editCommitmentType}
                        onChange={(e) => setEditCommitmentType(e.target.value)}
                      >
                        <option value="">Select type</option>
                        <option value="Job/Internship">Job/Internship</option>
                        <option value="Lecture">Lecture</option>
                        <option value="Lab">Lab</option>
                        <option value="Discussion">Discussion</option>
                        <option value="Club Meeting">Club Meeting</option>
                        <option value="Sports Practice">Sports Practice</option>
                        <option value="Volunteer">Volunteer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label>Commute time (minutes): </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editCommitmentCommuteTime}
                        onChange={(e) => setEditCommitmentCommuteTime(Number(e.target.value))}
                      />
                    </div>
                    <button type="button" onClick={() => handleUpdateCommitment(commitment.id)}>Save Changes</button>
                    <button type="button" onClick={() => setEditingCommitmentId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <strong>{commitment.commitmentName}</strong>
                    <p>Type: {commitment.commitmentType}</p>
                    {commitment.days && commitment.days.length > 0 && (
                      <p>Days: {commitment.days.split(',').filter(Boolean).map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}</p>
                    )}
                    {commitment.timeMode === 'flexible' ? (
                      <p>Flexible — {commitment.flexDuration} minutes — {commitment.flexPreference === 'any' ? 'any time' : commitment.flexPreference.replace('_', ' ')}</p>
                    ) : (
                      <p>{formatTime(commitment.commitmentStart)} — {formatTime(commitment.commitmentEnd)}</p>
                    )}
                    {commitment.commuteTime > 0 && (
                      <p>Commute: {commitment.commuteTime} minutes</p>
                    )}
                    <button type="button" onClick={() => handleEditCommitment(commitment)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteCommitment(commitment.id)}>Delete</button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        <section id="progress">
          <h2>Progress</h2>
          {history.length === 0 ? (
            <p>No completed tasks yet. Complete a task to see your history.</p>
          ) : (
            <div>
              <h3>This Week</h3>
              {(() => {
                const week = calculateWeeklyStats();
                if (week.count === 0) {
                  return <p>No tasks completed in the last 7 days.</p>;
                }
                return (
                  <div>
                    <p>Tasks this week: {week.count} ({week.completed} completed, {week.partial} partial, {week.notCompleted} not completed)</p>
                    <p>Time estimated: {week.totalEstimated} minutes ({(week.totalEstimated / 60).toFixed(1)} hours)</p>
                    <p>Time actually spent: {week.totalActual} minutes ({(week.totalActual / 60).toFixed(1)} hours)</p>
                    {week.overallAccuracy && (
                      <p>Estimation accuracy this week: {week.overallAccuracy}%</p>
                    )}
                    {Object.keys(week.byCategory).length > 0 && (
                      <div>
                        <h4>By Category</h4>
                        {Object.entries(week.byCategory).map(([cat, data]) => (
                          <div key={cat}>
                            <strong>{cat}</strong>
                            <p>{data.count} task{data.count !== 1 ? 's' : ''} — {data.actual} minutes actual / {data.estimated} minutes estimated</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <h3>Summary</h3>
              <p>Total tasks completed: {history.filter((h) => h.completion_status === 'Completed').length}</p>
              <p>Total tasks partially completed: {history.filter((h) => h.completion_status === 'Partially Completed').length}</p>
              <p>Total tasks not completed: {history.filter((h) => h.completion_status === 'Not Completed').length}</p>
              <p>Average actual duration: {
                history.length > 0
                  ? (history.reduce((sum, h) => sum + (h.actual_duration || 0), 0) / history.length).toFixed(1)
                  : 0
              } minutes</p>
              <p>Overall accuracy: {
                history.filter((h) => h.estimated_duration && h.actual_duration).length > 0
                  ? (history
                      .filter((h) => h.estimated_duration && h.actual_duration)
                      .reduce((sum, h) => sum + Math.min((h.estimated_duration / h.actual_duration) * 100, 100), 0)
                      / history.filter((h) => h.estimated_duration && h.actual_duration).length
                    ).toFixed(1)
                  : 0
              }%</p>

              <h3>Task History</h3>
              {history.map((h) => (
                <div key={h.id}>
                  <strong>{h.taskName}</strong>
                  <p>Category: {h.category}</p>
                  <p>Status: {h.completion_status}</p>
                  <p>Estimated: {h.estimated_duration} minutes</p>
                  <p>Actual: {h.actual_duration} minutes</p>
                  <p>Accuracy: {calculateAccuracy(h.estimated_duration, h.actual_duration)}%</p>
                  <p>Planned difficulty: {h.planned_difficulty}</p>
                  <p>Actual difficulty: {h.actual_difficulty}</p>
                  <p>Completed at: {h.completed_at}</p>
                </div>
              ))}

              <h3>Category Breakdown</h3>
              {Object.entries(calculateCategoryStats()).map(([cat, stats]) => (
                <div key={cat}>
                  <strong>{cat}</strong>
                  <p>Tasks tracked: {stats.count}</p>
                  <p>Average estimated duration: {(stats.totalEstimated / stats.count).toFixed(1)} minutes</p>
                  <p>Average actual duration: {(stats.totalActual / stats.count).toFixed(1)} minutes</p>
                  {(() => {
                    const multipliers = getCategoryMultipliers();
                    const m = multipliers[cat];
                    if (!m) {
                      return <p>Not enough data to adjust estimates yet (need 2+ completed tasks).</p>;
                    }
                    return (
                      <p>
                        Category multiplier: {m.toFixed(2)}×
                        {m > 1
                          ? ` — you typically take ${((m - 1) * 100).toFixed(0)}% longer than estimated`
                          : ` — you typically finish ${((1 - m) * 100).toFixed(0)}% faster than estimated`}
                      </p>
                    );
                  })()}
                  <p>Completed: {stats.completed} | Partially: {stats.partiallyCompleted} | Not completed: {stats.notCompleted}</p>
                  {(() => {
                    const taskKeys = [...new Set(
                      history
                        .filter((h) => h.category === cat)
                        .map((h) => getTaskKey({ taskName: h.taskName, category: h.category }))
                    )];
                    const taskLevelData = taskKeys
                      .map((key) => {
                        const matches = history.filter((h) =>
                          h.category === cat &&
                          getTaskKey({ taskName: h.taskName, category: h.category }) === key &&
                          h.estimated_duration && h.actual_duration
                        );
                        if (matches.length < 2) {
                          return null;
                        }
                        const totalEst = matches.reduce((s, h) => s + h.estimated_duration, 0);
                        const totalAct = matches.reduce((s, h) => s + h.actual_duration, 0);
                        const m = totalAct / totalEst;
                        return { key, count: matches.length, multiplier: m };
                      })
                      .filter(Boolean);
                    if (taskLevelData.length === 0) {
                      return null;
                    }
                    return (
                      <div>
                        <p><strong>Task-level breakdown:</strong></p>
                        {taskLevelData.map(({ key, count, multiplier: m }) => (
                          <p key={key}>
                            "{key}": {m.toFixed(2)}× ({count} sessions —
                            {m > 1
                              ? ` takes ${((m - 1) * 100).toFixed(0)}% longer than estimated`
                              : ` finishes ${((1 - m) * 100).toFixed(0)}% faster than estimated`})
                          </p>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ))}

              <h3>Productive Time Analysis</h3>
              {history.filter((h) => h.start_time).length === 0 ? (
                <p>No timer data yet. Use the Start Task button to track productive time.</p>
              ) : (
                <div>
                  {(() => {
                    const best = getMostProductivePeriod();
                    if (!best.period) {
                      return null;
                    }
                    return (
                      <p>Most productive period: <strong>{best.period}</strong> ({best.rate}% completion rate)</p>
                    );
                  })()}
                  {Object.entries(calculateProductiveTime()).map(([period, data]) => {
                    if (data.total === 0) {
                      return null;
                    }
                    const rate = ((data.completed / data.total) * 100).toFixed(1);
                    const periodHistory = history.filter((h) => {
                      if (!h.start_time) {
                        return false;
                      }
                      const hour = new Date(h.start_time).getHours();
                      return hour >= data.start && hour < data.end;
                    });
                    const avgActual = periodHistory.filter((h) => h.actual_duration).length > 0
                      ? (periodHistory.reduce((sum, h) => sum + (h.actual_duration || 0), 0) / periodHistory.filter((h) => h.actual_duration).length).toFixed(1)
                      : null;
                    const avgAccuracy = periodHistory.filter((h) => h.estimated_duration && h.actual_duration).length > 0
                      ? (periodHistory
                          .filter((h) => h.estimated_duration && h.actual_duration)
                          .reduce((sum, h) => sum + Math.min((h.estimated_duration / h.actual_duration) * 100, 100), 0)
                        / periodHistory.filter((h) => h.estimated_duration && h.actual_duration).length
                        ).toFixed(1)
                      : null;
                    return (
                      <div key={period}>
                        <strong>{period}</strong>
                        <p>Tasks attempted: {data.total} — completed: {data.completed} — completion rate: {rate}%</p>
                        {avgActual && <p>Average actual duration: {avgActual} minutes</p>}
                        {avgAccuracy && <p>Average estimation accuracy: {avgAccuracy}%</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        <section id="settings">
          <h2>Settings</h2>
          <div>
            <h3>Custom Keywords</h3>
            <div>
              <input
                type="text"
                placeholder="e.g. chinese"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
              />
              <select
                value={newKeywordType}
                onChange={(e) => setNewKeywordType(e.target.value)}
              >
                <option value="deep">Deep Work</option>
                <option value="light">Light Work</option>
              </select>
              <button type="button" onClick={handleAddKeyword}>Add Keyword</button>
            </div>
            <h4>Deep Work Keywords</h4>
            {customDeepKeywords.length === 0 ? (
              <p>No custom deep work keywords added yet.</p>
            ) : (
              customDeepKeywords.map((keyword) => (
                <div key={keyword}>
                  <span>{keyword}</span>
                  <button type="button" onClick={() => handleDeleteKeyword(keyword, 'deep')}>Delete</button>
                </div>
              ))
            )}
            <h4>Light Work Keywords</h4>
            {customLightKeywords.length === 0 ? (
              <p>No custom light work keywords added yet.</p>
            ) : (
              customLightKeywords.map((keyword) => (
                <div key={keyword}>
                  <span>{keyword}</span>
                  <button type="button" onClick={() => handleDeleteKeyword(keyword, 'light')}>Delete</button>
                </div>
              ))
            )}
          </div>
          <div>
            <label>Clock Format: </label>
            <select
              value={clockFormat}
              onChange={(e) => setClockFormat(e.target.value)}
            >
              <option value="12">12-hour (AM/PM)</option>
              <option value="24">24-hour</option>
            </select>
            <button type="button" onClick={() => { setSavedClockFormat(clockFormat); saveSetting('clockFormat', clockFormat); }}>Confirm</button>
          </div>
          <div>
            <label>Max Deep Work Block (minutes): </label>
            <input
              type="number"
              min="30"
              max="180"
              value={maxBlockLength}
              onChange={(e) => setMaxBlockLength(clamp(e.target.value, 30, 180))}
            />
            <button type="button" onClick={() => { setSavedMaxBlockLength(maxBlockLength); saveSetting('maxBlockLength', maxBlockLength); }}>Confirm</button>
          </div>
          <div>
            <label>Morning Buffer (minutes): </label>
            <input
              type="number"
              min="0"
              max="120"
              value={morningBuffer}
              onChange={(e) => setMorningBuffer(clamp(e.target.value, 0, 120))}
            />
            <button type="button" onClick={() => { setSavedMorningBuffer(morningBuffer); saveSetting('morningBuffer', morningBuffer); }}>Confirm</button>
          </div>
          <div>
            <label>Night Buffer (minutes): </label>
            <input
              type="number"
              min="0"
              max="120"
              value={nightBuffer}
              onChange={(e) => setNightBuffer(clamp(e.target.value, 0, 120))}
            />
            <button type="button" onClick={() => { setSavedNightBuffer(nightBuffer); saveSetting('nightBuffer', nightBuffer); }}>Confirm</button>
          </div>
          <div>
            <label>Transition Gap (5-30 minutes): </label>
            <input
              type="number"
              min="5"
              max="30"
              value={transitionGap}
              onChange={(e) => setTransitionGap(clamp(e.target.value, 5, 30))}
            />
            <button type="button" onClick={() => { setSavedTransitionGap(transitionGap); saveSetting('transitionGap', transitionGap); }}>Confirm</button>
          </div>
          <div>
            <label>Shower duration (minutes): </label>
            <input
              type="number"
              min="5"
              max="60"
              value={showerDuration}
              onChange={(e) => setShowerDuration(clamp(e.target.value, 5, 60))}
            />
            <button type="button" onClick={() => { setSavedShowerDuration(showerDuration); saveSetting('showerDuration', showerDuration); }}>Confirm</button>
          </div>
          <div>
            <label>Shower preference: </label>
            <select
              value={showerPreference}
              onChange={(e) => setShowerPreference(e.target.value)}
            >
              <option value="morning">Morning (after wake-up buffer)</option>
              <option value="evening">Evening (before wind-down)</option>
              <option value="both">Both morning and evening</option>
            </select>
            <button type="button" onClick={() => { setSavedShowerPreference(showerPreference); saveSetting('showerPreference', showerPreference); }}>Confirm</button>
          </div>
          <div>
            <label>Energy Pattern: </label>
            <select
              value={energyPattern}
              onChange={(e) => setEnergyPattern(e.target.value)}
            >
              <option value="morning">Morning person (6:00am-12:00pm)</option>
              <option value="afternoon">Afternoon person (12:00pm-5:00pm)</option>
              <option value="evening">Evening person (5:00pm-10:00pm)</option>
              <option value="between">Between classes</option>
            </select>
            <button type="button" onClick={() => { setSavedEnergyPattern(energyPattern); saveSetting('energyPattern', energyPattern); }}>Confirm</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;