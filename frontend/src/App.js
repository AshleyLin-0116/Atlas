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

function App() {
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

  useEffect(() => {
    fetch('http://localhost:8000/tasks')
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch((err) => console.error('Failed to load tasks:', err));

    fetch('http://localhost:8000/history')
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error('Failed to load history:', err));
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
    const finalTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
    const newTask = {
      taskName,
      deadline,
      difficulty: Number(difficulty),
      importance: Number(importance),
      userPreference: Number(userPreference),
      duration: Number(duration),
      taskType: finalTaskType,
      category
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
    const newMeal = {
      id: Date.now(),
      mealName,
      mealStart,
      mealEnd
    };
    setMeals([...meals, newMeal]);
    setMealName('');
    setMealStart('');
    setMealEnd('');
  }

  function handleDeleteMeal(id) {
    setMeals(meals.filter((meal) => meal.id !== id));
  }

  function handleAddCommitment(e) {
    e.preventDefault();
    const newCommitment = {
      id: Date.now(),
      commitmentName,
      commitmentStart,
      commitmentEnd,
      commitmentType
    };
    setCommitments([...commitments, newCommitment]);
    setCommitmentName('');
    setCommitmentStart('');
    setCommitmentEnd('');
    setCommitmentType('');
  }

  function handleDeleteCommitment(id) {
    setCommitments(commitments.filter((commitment) => commitment.id !== id));
  }

  function handleSaveSleepSchedule() {
    if (!wakeTime || !sleepTime) {
      return;
    }
    setSleepScheduleSaved(true);
  }

  function handleAddKeyword() {
    if (!newKeyword.trim()) {
      return;
    }
    const keyword = newKeyword.toLowerCase().trim();
    if (newKeywordType === 'deep') {
      setCustomDeepKeywords([...customDeepKeywords, keyword]);
    } else {
      setCustomLightKeywords([...customLightKeywords, keyword]);
    }
    setNewKeyword('');
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
    const urgency = daysUntilDeadline === 0 ? 1 : Math.max(0, 1 - daysUntilDeadline / 30);
    const importance = Number(task.importance) / 10;
    const userPreference = Number(task.userPreference) / 10;
    const difficulty = Number(task.difficulty) / 10;
    const consistency = 0.5;
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
      return h * 60 + m;
    };
    const wake = toMinutes(wakeTime);
    const sleep = toMinutes(sleepTime);
    const totalTime = sleep - wake;
    const mealTime = meals.reduce((total, meal) => {
      if (!meal.mealStart || !meal.mealEnd) {
        return total;
      }
      return total + (toMinutes(meal.mealEnd) - toMinutes(meal.mealStart));
    }, 0);
    const commitmentTime = commitments.reduce((total, commitment) => {
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
      return h * 60 + m;
    };
    const toTimeString = (minutes) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const wake = toMinutes(wakeTime) + savedMorningBuffer;
    const sleep = toMinutes(sleepTime) - savedNightBuffer;
    const blockedRanges = [
      ...meals.map((meal) => ({
        start: toMinutes(meal.mealStart),
        end: toMinutes(meal.mealEnd),
        label: meal.mealName,
        type: 'meal'
      })),
      ...commitments.map((commitment) => ({
        start: toMinutes(commitment.commitmentStart),
        end: toMinutes(commitment.commitmentEnd),
        label: commitment.commitmentName,
        type: 'commitment'
      }))
    ].sort((a, b) => a.start - b.start);

    const schedule = [];

    schedule.push({
      start: toTimeString(toMinutes(wakeTime)),
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
      start: toTimeString(toMinutes(sleepTime) - savedNightBuffer),
      end: toTimeString(toMinutes(sleepTime)),
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

    const isBlocked = (start, end) => {
      return blockedRanges.some(
        (range) => start < range.end && end > range.start
      );
    };

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

    let currentTime = wake;

    for (const task of orderedTasks) {
      let remaining = Number(task.duration);
      const limit = task.taskType === 'deep' ? savedMaxBlockLength : Infinity;
      let isFirstBlock = true;

      let safetyCounter = 0;
      while (remaining > 0 && currentTime < sleep) {
        safetyCounter++;
        if (safetyCounter > 1000) {
          break;
        }
        currentTime = getNextFreeTime(currentTime, blockedRanges, schedule, toTimeString, savedTransitionGap);
        if (currentTime >= sleep) {
          break;
        }
        const blockSize = Math.min(remaining, limit, sleep - currentTime);
        if (blockSize <= 0) {
          break;
        }
        const blockEnd = currentTime + blockSize;
        if (isBlocked(currentTime, blockEnd)) {
          currentTime = blockEnd;
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
          const breakStart = currentTime;
          const breakEnd = breakStart + breakLength;
          const breakOverlaps = blockedRanges.some(
            (range) => breakStart < range.end && breakEnd > range.start
          );
          if (!breakOverlaps) {
            schedule.push({
              start: toTimeString(currentTime),
              end: toTimeString(breakEnd),
              label: 'Break',
              type: 'break'
            });
            currentTime = breakEnd + savedTransitionGap;
          } else {
            currentTime = getNextFreeTime(currentTime, blockedRanges, schedule, toTimeString, savedTransitionGap);
          }
        } else if (!isFirstBlock || remaining === 0) {
          currentTime += savedTransitionGap;
        }
        isFirstBlock = false;
      }
    }
    return schedule.sort((a, b) => a.start.localeCompare(b.start));
  }

  const activeTaskType = userOverrideType !== null ? userOverrideType : autoTaskType;
  const hasConflict = userOverrideType !== null && userOverrideType !== autoTaskType;

  function handleGenerateSchedule() {
    const schedule = generateSchedule();
    setGeneratedSchedule(schedule);
  }

  function getBlockDuration(start, end) {
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const diff = toMinutes(end) - toMinutes(start);
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

  function getNextFreeTime(from, blockedRanges, schedule, toTimeString, transitionGap) {
    let time = from;
    for (const range of blockedRanges) {
      if (time >= range.start && time < range.end) {
        schedule.push({
          start: toTimeString(range.start),
          end: toTimeString(range.end),
          label: range.label,
          type: range.type
        });
        time = range.end + transitionGap;
      }
    }
    return time;
  }

  function handleSubmitFeedback(taskId) {
    if (!completionStatus || !actualDuration) {
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
      .then((res) => res.json())
      .then(() => {
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
      .catch((err) => console.error('Failed to submit feedback:', err));
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
      'Early Morning (12am–6am)': { start: 0, end: 6, completed: 0, total: 0 },
      'Morning (6am–12pm)': { start: 6, end: 12, completed: 0, total: 0 },
      'Afternoon (12pm–5pm)': { start: 12, end: 17, completed: 0, total: 0 },
      'Evening (5pm–10pm)': { start: 17, end: 22, completed: 0, total: 0 },
      'Night (10pm–12am)': { start: 22, end: 24, completed: 0, total: 0 }
    };

    history.forEach((h) => {
      if (!h.start_time) {
        return;
      }
      const startHour = new Date(h.start_time).getHours();
      for (const [data] of Object.entries(periods)) {
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
                    ) : block.type === 'buffer' ? (
                      <div>
                        <p>{formatTime(block.start)} — {formatTime(block.end)} ({getBlockDuration(block.start, block.end)})</p>
                        <p>🌅 {block.label}</p>
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
                  <p>Category: {task.category}</p>
                  <p>Deadline: {task.deadline}</p>
                  <p>Difficulty: {task.difficulty}</p>
                  <p>Importance: {task.importance}</p>
                  <p>Personal Priority: {task.userPreference}</p>
                  <p>Duration: {task.duration} minutes</p>
                  <p>Priority Score: {calculatePriorityScore(task)}</p>
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
                  <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
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
            <p>Sleep schedule saved — wake up at {formatTime(wakeTime)}, sleep at {formatTime(sleepTime)}.</p>
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
              <label>Start time: </label>
              <TimePicker
                value={mealStart}
                onChange={setMealStart}
                clockFormat={savedClockFormat}
              />
            </div>
            <div>
              <label>End time: </label>
              <TimePicker
                value={mealEnd}
                onChange={setMealEnd}
                clockFormat={savedClockFormat}
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
                <strong>{meal.mealName}</strong>
                <p>{formatTime(meal.mealStart)} — {formatTime(meal.mealEnd)}</p>
                <button onClick={() => handleDeleteMeal(meal.id)}>Delete</button>
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
              <label>Start time: </label>
              <TimePicker
                value={commitmentStart}
                onChange={setCommitmentStart}
                clockFormat={savedClockFormat}
              />
            </div>
            <div>
              <label>End time: </label>
              <TimePicker
                value={commitmentEnd}
                onChange={setCommitmentEnd}
                clockFormat={savedClockFormat}
              />
            </div>
            <div>
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
            <button type="submit">Add Commitment</button>
          </form>

          <h4>Commitment List</h4>
          {commitments.length === 0 ? (
            <p>No commitments added yet.</p>
          ) : (
            commitments.map((commitment) => (
              <div key={commitment.id}>
                <strong>{commitment.commitmentName}</strong>
                <p>Type: {commitment.commitmentType}</p>
                <p>{formatTime(commitment.commitmentStart)} — {formatTime(commitment.commitmentEnd)}</p>
                <button onClick={() => handleDeleteCommitment(commitment.id)}>Delete</button>
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
              {Object.keys(calculateCategoryStats()).length === 0 ? (
                <p>No category data yet.</p>
              ) : (
                Object.entries(calculateCategoryStats()).map(([category, stats]) => (
                  <div key={category}>
                    <strong>{category}</strong>
                    <p>Tasks tracked: {stats.count}</p>
                    <p>Average estimated duration: {(stats.totalEstimated / stats.count).toFixed(1)} minutes</p>
                    <p>Average actual duration: {(stats.totalActual / stats.count).toFixed(1)} minutes</p>
                    <p>Average accuracy: {(stats.totalAccuracy / stats.count).toFixed(1)}%</p>
                    <p>Completed: {stats.completed} | Partially: {stats.partiallyCompleted} | Not completed: {stats.notCompleted}</p>
                  </div>
                ))
              )}

              <h3>Productive Time Analysis</h3>
              {history.filter((h) => h.start_time).length === 0 ? (
                <p>No timer data yet. Use the Start Task button to track productive time.</p>
              ) : (
                <div>
                  {(() => {
                    const best = getMostProductivePeriod();
                    if (best.period) {
                      return <p>Most productive period: <strong>{best.period}</strong> ({best.rate}% completion rate)</p>;
                    }
                    return null;
                  })()}
                  {Object.entries(calculateProductiveTime()).map(([period, data]) => {
                    if (data.total === 0) {
                      return null;
                    }
                    return (
                      <div key={period}>
                        <strong>{period}</strong>
                        <p>Tasks attempted: {data.total}</p>
                        <p>Tasks completed: {data.completed}</p>
                        <p>Completion rate: {((data.completed / data.total) * 100).toFixed(1)}%</p>
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
            <button type="button" onClick={() => setSavedClockFormat(clockFormat)}>Confirm</button>
          </div>
          <div>
            <label>Max Deep Work Block (minutes): </label>
            <input
              type="number"
              min="30"
              max="180"
              value={maxBlockLength}
              onChange={(e) => setMaxBlockLength(Number(e.target.value))}
            />
            <button type="button" onClick={() => setSavedMaxBlockLength(maxBlockLength)}>Confirm</button>
          </div>
          <div>
            <label>Morning Buffer (minutes): </label>
            <input
              type="number"
              min="0"
              max="120"
              value={morningBuffer}
              onChange={(e) => setMorningBuffer(Number(e.target.value))}
            />
            <button type="button" onClick={() => setSavedMorningBuffer(morningBuffer)}>Confirm</button>
          </div>
          <div>
            <label>Night Buffer (minutes): </label>
            <input
              type="number"
              min="0"
              max="120"
              value={nightBuffer}
              onChange={(e) => setNightBuffer(Number(e.target.value))}
            />
            <button type="button" onClick={() => setSavedNightBuffer(nightBuffer)}>Confirm</button>
          </div>
          <div>
            <label>Transition Gap (5-30 minutes): </label>
            <input
              type="number"
              min="5"
              max="30"
              value={transitionGap}
              onChange={(e) => setTransitionGap(Number(e.target.value))}
            />
            <button type="button" onClick={() => setSavedTransitionGap(transitionGap)}>Confirm</button>
          </div>
          <div>
            <label>Energy Pattern: </label>
            <select
              value={energyPattern}
              onChange={(e) => setEnergyPattern(e.target.value)}
            >
              <option value="morning">Morning person (6am-12pm)</option>
              <option value="afternoon">Afternoon person (12pm-5pm)</option>
              <option value="evening">Evening person (5pm-10pm)</option>
              <option value="between">Between classes</option>
            </select>
            <button type="button" onClick={() => setSavedEnergyPattern(energyPattern)}>Confirm</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;