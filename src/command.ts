import { Crypto, Effect, Match as M, Schema as S } from 'effect'
import { KeyValueStore } from 'effect/unstable/persistence'
import { Command } from 'foldkit'
import { load, pushUrl } from 'foldkit/navigation'

import { BrowserCrypto, BrowserKeyValueStore } from '@effect/platform-browser'

import {
  DARK_THEME_COLOR,
  LIGHT_THEME_COLOR,
  STORAGE_KEY,
  THEME_STORAGE_KEY,
} from './constant'
import { Song } from './domain'
import { Message, ResolvedTheme, ThemePreference } from './message'

export const SavedLibrary = S.Struct({
  songs: S.Array(Song.Song),
})

export type SavedLibrary = typeof SavedLibrary.Type

export const SavedLibraryJsonString = S.fromJsonString(
  S.toCodecJson(SavedLibrary),
)

export const GenerateSongIds = Command.define('GenerateSongIds', {
  messages: [Message.CompletedGenerateSongIds],
  execute: Effect.gen(function* () {
    const crypto = yield* Crypto.Crypto
    const songId = yield* Effect.orDie(crypto.randomUUIDv4)
    const sectionId = yield* Effect.orDie(crypto.randomUUIDv4)
    return Message.CompletedGenerateSongIds({ songId, sectionId })
  }).pipe(Effect.provide(BrowserCrypto.layer)),
})

export const SaveLibrary = Command.define('SaveLibrary', {
  args: { songs: S.Array(Song.Song) },
  messages: [Message.SucceededSaveLibrary, Message.FailedSaveLibrary],
  execute: ({ songs }) =>
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore
      yield* store.set(
        STORAGE_KEY,
        S.encodeSync(SavedLibraryJsonString)({ songs }),
      )
      return Message.SucceededSaveLibrary()
    }).pipe(
      Effect.catch(() =>
        Effect.succeed(
          Message.FailedSaveLibrary({ error: 'Could not save your songs.' }),
        ),
      ),
      Effect.provide(BrowserKeyValueStore.layerLocalStorage),
    ),
})

export const NavigateInternal = Command.define('NavigateInternal', {
  args: { url: S.String },
  messages: [Message.CompletedNavigateInternal],
  execute: ({ url }) =>
    pushUrl(url).pipe(Effect.as(Message.CompletedNavigateInternal())),
})

export const LoadExternal = Command.define('LoadExternal', {
  args: { href: S.String },
  messages: [Message.CompletedLoadExternal],
  execute: ({ href }) =>
    load(href).pipe(Effect.as(Message.CompletedLoadExternal())),
})

const setThemeColorMeta = (color: string): void => {
  const themeColorMeta = document.querySelector('meta[name="theme-color"]')
  if (themeColorMeta !== null) {
    themeColorMeta.setAttribute('content', color)
  }
}

export const ApplyTheme = Command.define('ApplyTheme', {
  args: { theme: ResolvedTheme },
  messages: [Message.CompletedApplyTheme],
  execute: ({ theme }) =>
    Effect.sync(() => {
      M.value(theme).pipe(
        M.when('Dark', () => {
          document.documentElement.classList.add('dark')
          setThemeColorMeta(DARK_THEME_COLOR)
        }),
        M.when('Light', () => {
          document.documentElement.classList.remove('dark')
          setThemeColorMeta(LIGHT_THEME_COLOR)
        }),
        M.exhaustive,
      )
      return Message.CompletedApplyTheme()
    }),
})

export const SaveThemePreference = Command.define('SaveThemePreference', {
  args: { preference: ThemePreference },
  messages: [Message.CompletedSaveThemePreference],
  execute: ({ preference }) =>
    Effect.gen(function* () {
      const store = yield* KeyValueStore.KeyValueStore
      yield* store.set(THEME_STORAGE_KEY, JSON.stringify(preference))
      return Message.CompletedSaveThemePreference()
    }).pipe(
      Effect.catch(() =>
        Effect.succeed(Message.CompletedSaveThemePreference()),
      ),
      Effect.provide(BrowserKeyValueStore.layerLocalStorage),
    ),
})
