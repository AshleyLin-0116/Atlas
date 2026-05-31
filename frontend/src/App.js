import React, { useState } from 'react';
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
  const [clockFormat, setClockFormat] = useState('12');
  const [savedClockFormat, setSavedClockFormat] = useState('12');
  const [commitmentType, setCommitmentType] = useState('');
  const [sleepScheduleSaved, setSleepScheduleSaved] = useState(false);

  function handleAddTask(e) {
    e.preventDefault();
    const newTask = {
      id: Date.now(),
      taskName,
      deadline,
      difficulty,
      importance,
      duration
    };
    setTasks([...tasks, newTask]);
    setTaskName('');
    setDeadline('');
    setDifficulty(5);
    setImportance(5);
    setDuration('');
  }

  function handleDeleteTask(id) {
    setTasks(tasks.filter((task) => task.id !== id));
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
      if (!task.duration) return total;
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

  function handleSaveSleepSchedule() {
    if (!wakeTime || !sleepTime) {
      return;
    }
    setSleepScheduleSaved(true);
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
          <p>Your generated schedule will appear here.</p>
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
                onChange={(e) => setTaskName(e.target.value)}
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
              <label>Difficulty (1-10): </label>
              <input
                type="range"
                min="1"
                max="10"
                step="0.01"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
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
            <button type="submit">Add Task</button>
          </form>

          <h3>Task List</h3>
          {tasks.length === 0 ? (
            <p>No tasks added yet.</p>
          ) : (
            tasks.map((task) => (
              <div key={task.id}>
                <strong>{task.taskName}</strong>
                <p>Deadline: {task.deadline}</p>
                <p>Difficulty: {task.difficulty}</p>
                <p>Importance: {task.importance}</p>
                <p>Duration: {task.duration} minutes</p>
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
          <p>Your weekly summary and insights will appear here.</p>
        </section>
        <section id="settings">
          <h2>Settings</h2>
          <div>
            <label>Clock Format: </label>
            <select
              value={clockFormat}
              onChange={(e) => setClockFormat(e.target.value)}
            >
              <option value="12">12-hour (AM/PM)</option>
              <option value="24">24-hour</option>
            </select>
            <button onClick={() => setSavedClockFormat(clockFormat)}>Confirm</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;