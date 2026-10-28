// Applies the saved theme before the first paint (prefs load asynchronously).
// Until the user picks one, the popup follows the system theme.
try {
  const theme = localStorage.getItem('vt-theme');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // storage unavailable: follow the system theme
}
document.documentElement.dataset.effectiveTheme =
  document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
