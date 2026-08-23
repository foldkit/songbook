import { Match as M } from 'effect'

import type { ResolvedTheme, ThemePreference } from './message'

export const resolveTheme = (
  preference: ThemePreference,
  systemTheme: ResolvedTheme,
): ResolvedTheme =>
  M.value(preference).pipe(
    M.withReturnType<ResolvedTheme>(),
    M.when('Dark', () => 'Dark'),
    M.when('Light', () => 'Light'),
    M.when('System', () => systemTheme),
    M.exhaustive,
  )
