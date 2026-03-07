import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import AppPage from './pages/AppPage';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('seva-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('seva-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <Routes>
      <Route path="/" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="/app" element={<AppPage theme={theme} onToggleTheme={toggleTheme} />} />
      <Route path="*" element={<LandingPage theme={theme} onToggleTheme={toggleTheme} />} />
    </Routes>
  );
}
