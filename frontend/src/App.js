import React, { useState } from 'react';

function App() {
  const [difficulty, setDifficulty] = useState(5);
  const [importance, setImportance] = useState(5);
  const [editingDifficulty, setEditingDifficulty] = useState(false);
  const [editingImportance, setEditingImportance] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [duration, setDuration] = useState('');

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

  return (
    <div>
      <nav>
        <h1>Atlas</h1>
        <ul>
          <li>Dashboard</li>
          <li>Schedule</li>
          <li>Tasks</li>
          <li>Progress</li>
          <li>Settings</li>
        </ul>
      </nav>
      <main>
        <section id="dashboard">
          <h2>Dashboard</h2>
          <p>Your daily overview will appear here.</p>
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
        <section id="progress">
          <h2>Progress</h2>
          <p>Your weekly summary and insights will appear here.</p>
        </section>
        <section id="settings">
          <h2>Settings</h2>
          <p>Your preferences and availability will appear here.</p>
        </section>
      </main>
    </div>
  );
}

export default App;