import '../../../packages/shared-ui/globals.css';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const savedTheme = localStorage.getItem('app-theme') || 'system';
if (savedTheme === 'system') {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
} else {
  document.documentElement.dataset.theme = savedTheme;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
