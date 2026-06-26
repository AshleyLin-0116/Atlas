import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEMES = [
  { id: 'pastel', label: 'Pastel', description: 'Soft and friendly (default)' },
  { id: 'dark',   label: 'Dark',   description: 'Easy on the eyes at night' },
  { id: 'ocean',  label: 'Ocean',  description: 'Cool blues and teals' },
  { id: 'forest', label: 'Forest', description: 'Warm greens and earth tones' },
];

const CATEGORY_EMOJIS = {
  task:       '📚',
  meal:       '🍽️',
  sleep:      '😴',
  commitment: '📅',
  exercise:   '💪',
  free:       '✨',
  commute:    '🚌',
};

const KEYWORD_CATEGORY_MAP = {
  task:       ['study', 'homework', 'assignment', 'project', 'work', 'read', 'review', 'write', 'research', 'exam', 'quiz'],
  meal:       ['breakfast', 'lunch', 'dinner', 'brunch', 'snack', 'eat', 'food', 'meal', 'coffee', 'cafe'],
  sleep:      ['sleep', 'nap', 'rest', 'bed', 'wake'],
  commitment: ['class', 'meeting', 'lecture', 'seminar', 'appointment', 'call', 'interview', 'office hours'],
  exercise:   ['gym', 'workout', 'run', 'yoga', 'swim', 'bike', 'hike', 'walk', 'sport', 'exercise', 'lift'],
  free:       ['free', 'break', 'relax', 'leisure', 'fun', 'game', 'movie', 'hang', 'social'],
  commute:    ['commute', 'drive', 'bus', 'train', 'transit', 'travel', 'uber', 'lyft'],
};

export function getCategoryFromName(name) {
  if (!name) { return 'task'; }
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_CATEGORY_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }
  return 'task';
}

export function getEmojiForCategory(category) {
  return CATEGORY_EMOJIS[category] || '📌';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('atlas-theme') || 'pastel';
  });

  useEffect(() => {
    if (theme === 'pastel') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem('atlas-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, THEMES, getCategoryFromName, getEmojiForCategory }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) { throw new Error('useTheme must be used inside ThemeProvider'); }
  return ctx;
}

export { THEMES, CATEGORY_EMOJIS, KEYWORD_CATEGORY_MAP };