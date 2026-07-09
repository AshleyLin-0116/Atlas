import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

const CATEGORY_OPTIONS = [
    'Homework', 
    'Reading', 
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

const STEPS = ['sleep', 'meal', 'task'];

function StepIndicator({ current }) {
    return (
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {STEPS.map((s, i) => (
                <div
                    key={s}
                    style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i < current
                            ? 'var(--brand)'
                            : i === current
                                ? 'var(--brand-light)'
                                : 'var(--border-color)',
                        transition: 'background 0.3s',
                    }}
                />
            ))}
        </div>
    );
}

export default function Onboarding({ onComplete, authFetch, apiUrl, clockFormat }) {
    const [step, setStep] = useState(0); // 0=welcome, 1=sleep, 2=meal, 3=task

    // Sleep
    const [wakeTime, setWakeTime] = useState('07:00');
    const [sleepTime, setSleepTime] = useState('23:00');

    // Meal
    const [mealName, setMealName] = useState('');
    const [mealStart, setMealStart] = useState('12:00');
    const [mealEnd, setMealEnd] = useState('13:00');

    // Task
    const [taskName, setTaskName] = useState('');
    const [deadline, setDeadline] = useState('');
    const [duration, setDuration] = useState('60');
    const [category, setCategory] = useState('');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    function toMin(t) {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    }

    async function handleSaveSleep() {
        if (!wakeTime || !sleepTime) {
            setError('Please set both times.');
            return;
        }
        if (Math.abs(toMin(sleepTime) - toMin(wakeTime)) < 60) {
            setError('Wake and sleep times must be at least 1 hour apart.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await authFetch(`${apiUrl}/sleep`, {
                method: 'POST',
                body: JSON.stringify({ wakeTime, sleepTime }),
            });
            setStep(2);
        } catch {
            setError('Could not save — please try again.');
        }
        setSaving(false);
    }

    async function handleSaveMeal() {
        if (!mealName.trim()) {
            setError('Please enter a meal name.');
            return;
        }
        if (toMin(mealEnd) <= toMin(mealStart)) {
            setError('End time must be after start time.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await authFetch(`${apiUrl}/meals`, {
                method: 'POST',
                body: JSON.stringify({
                    mealName: mealName.trim(),
                    mealStart,
                    mealEnd,
                    commuteTime: 0,
                    commuteTimeTo: 0,
                    commuteTimeFrom: 0,
                    timeMode: 'fixed',
                    flexDuration: 0,
                    flexPreference: 'any',
                }),
            });
            setStep(3);
        } catch {
            setError('Could not save — please try again.');
        }
        setSaving(false);
    }

    async function handleSaveTask() {
        if (!taskName.trim() || !deadline || !category || !duration) {
            setError('Please fill in all fields.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            await authFetch(`${apiUrl}/tasks`, {
                method: 'POST',
                body: JSON.stringify({
                    taskName: taskName.trim(),
                    deadline,
                    difficulty: 5,
                    importance: 5,
                    userPreference: 5,
                    duration: Number(duration),
                    taskType: 'deep',
                    category,
                    workOnDueDate: true,
                    description: '',
                    isRecurring: false,
                    recurringDays: '',
                }),
            });
            onComplete();
        } catch {
            setError('Could not save — please try again.');
        }
        setSaving(false);
    }

    const sharedInput = {
        style: {
            width: '100%',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-color)',
            fontSize: 14,
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
        },
    };

    const label = (text) => (
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
            {text}
        </label>
    );

    const fieldWrap = { marginBottom: 14 };

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 20px', maxWidth: 480, margin: '0 auto', width: '100%' }}>

            {/* Welcome */}
            {step === 0 && (
                <>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>👋</div>
                    <h2 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>Welcome to Atlas</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                        Let's get you set up in about 2 minutes. Atlas builds a personalised daily schedule around your sleep, meals, and tasks — no manual planning.
                    </p>
                    <div style={{ background: 'var(--brand-light)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 24, fontSize: 13, color: 'var(--brand-dark)' }}>
                        We'll walk through three quick steps: sleep schedule → first meal → first task.
                    </div>
                    <button className="btn-primary" type="button" onClick={() => setStep(1)} style={{ width: '100%' }}>
                        Get started
                    </button>
                </>
            )}

            {/* Sleep */}
            {step === 1 && (
                <>
                    <StepIndicator current={0} />
                    <div style={{ fontSize: 32, marginBottom: 12 }}>😴</div>
                    <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>When do you wake and sleep?</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                        Atlas uses this to define your schedulable window each day.
                    </p>
                    {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                    <div style={fieldWrap}>
                        {label('Wake-up time')}
                        <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} {...sharedInput} />
                    </div>
                    <div style={fieldWrap}>
                        {label('Sleep time')}
                        <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} {...sharedInput} />
                    </div>
                    <button className="btn-primary" type="button" onClick={handleSaveSleep} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
                        {saving ? 'Saving…' : 'Save and continue'}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setError(''); setStep(2); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, marginTop: 12, width: '100%', textAlign: 'center', cursor: 'pointer' }}
                    >
                        Skip for now
                    </button>
                </>
            )}

            {/* Meal */}
            {step === 2 && (
                <>
                    <StepIndicator current={1} />
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🍽</div>
                    <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Add your first meal</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                        Meals get blocked off so Atlas doesn't schedule work during them. You can add more later.
                    </p>
                    {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                    <div style={fieldWrap}>
                        {label('Meal name')}
                        <input
                            type="text"
                            placeholder="e.g. Lunch"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            {...sharedInput}
                        />
                    </div>
                    <div style={fieldWrap}>
                        {label('Start time')}
                        <input type="time" value={mealStart} onChange={(e) => setMealStart(e.target.value)} {...sharedInput} />
                    </div>
                    <div style={fieldWrap}>
                        {label('End time')}
                        <input type="time" value={mealEnd} onChange={(e) => setMealEnd(e.target.value)} {...sharedInput} />
                    </div>
                    <button className="btn-primary" type="button" onClick={handleSaveMeal} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
                        {saving ? 'Saving…' : 'Save and continue'}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setError(''); setStep(3); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, marginTop: 12, width: '100%', textAlign: 'center', cursor: 'pointer' }}
                    >
                        Skip for now
                    </button>
                </>
            )}

            {/* Task */}
            {step === 3 && (
                <>
                    <StepIndicator current={2} />
                    <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
                    <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 6 }}>Add your first task</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                        Give Atlas something to schedule. Even a rough estimate helps.
                    </p>
                    {error && <p style={{ color: '#c0392b', fontSize: 13, marginBottom: 12 }}>{error}</p>}
                    <div style={fieldWrap}>
                        {label('Task name')}
                        <input
                            type="text"
                            placeholder="e.g. Study for stats exam"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            {...sharedInput}
                        />
                    </div>
                    <div style={fieldWrap}>
                        {label('Deadline')}
                        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} {...sharedInput} />
                    </div>
                    <div style={fieldWrap}>
                        {label('Estimated duration (minutes)')}
                        <input
                            type="number"
                            min="1"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            {...sharedInput}
                        />
                    </div>
                    <div style={fieldWrap}>
                        {label('Category')}
                        <select value={category} onChange={(e) => setCategory(e.target.value)} {...sharedInput}>
                            <option value="">Select category</option>
                            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <button className="btn-primary" type="button" onClick={handleSaveTask} disabled={saving} style={{ width: '100%', marginTop: 8 }}>
                        {saving ? 'Saving…' : 'Add task and finish'}
                    </button>
                    <button
                        type="button"
                        onClick={onComplete}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 13, marginTop: 12, width: '100%', textAlign: 'center', cursor: 'pointer' }}
                    >
                        Finish without a task
                    </button>
                </>
            )}
        </div>
    );
}