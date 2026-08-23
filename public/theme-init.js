;(function () {
  var pref =
    localStorage.getItem('coverchart-theme-preference') ||
    localStorage.getItem('songbook-theme-preference')
  var theme = pref ? JSON.parse(pref) : 'System'
  var isDark =
    theme === 'Dark' ||
    (theme === 'System' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  if (isDark) document.documentElement.classList.add('dark')
  // NOTE: mirrors Tailwind stone-50 and stone-950.
  // Keep in sync with LIGHT_THEME_COLOR and DARK_THEME_COLOR.
  var themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? '#0c0a09' : '#fafaf9')
  }
})()
