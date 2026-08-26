import { Effect, Match as M, Option, Schema as S } from 'effect'
import { KeyValueStore } from 'effect/unstable/persistence'
import { Runtime } from 'foldkit'
import { Url } from 'foldkit/url'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { ApplyTheme, SavedLibrary, SavedLibraryJsonString } from './command'
import { STORAGE_KEY, THEME_STORAGE_KEY } from './constant'
import { Song } from './domain'
import { Message, ResolvedTheme, ThemePreference } from './message'
import { Model } from './model'
import { Editor, Home, Play } from './page'
import { urlToAppRoute } from './route'
import { resolveTheme } from './theme'
import { Toast } from './toast'

export { Message, Model }
export { update } from './update'
export { view } from './view'
export { subscriptions } from './subscription'

export const Flags = S.Struct({
  maybeSavedLibrary: S.Option(SavedLibrary),
  maybeThemePreference: S.Option(ThemePreference),
  systemTheme: ResolvedTheme,
})

export type Flags = typeof Flags.Type

const loadSavedLibrary = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(STORAGE_KEY)),
  )
  const decoded = yield* S.decodeEffect(SavedLibraryJsonString)(json)
  return Option.some(decoded)
}).pipe(Effect.catch(() => Effect.succeed(Option.none<SavedLibrary>())))

const loadThemePreference = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(THEME_STORAGE_KEY)),
  )
  const theme = yield* S.decodeEffect(S.fromJsonString(ThemePreference))(json)
  return Option.some(theme)
}).pipe(Effect.catch(() => Effect.succeed(Option.none<ThemePreference>())))

export const flags: Effect.Effect<Flags> = Effect.gen(function* () {
  const maybeSavedLibrary = yield* loadSavedLibrary
  const maybeThemePreference = yield* loadThemePreference
  const systemTheme: ResolvedTheme = yield* Effect.sync(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'Dark'
      : 'Light',
  )
  return Flags.make({ maybeSavedLibrary, maybeThemePreference, systemTheme })
}).pipe(Effect.provide(BrowserKeyValueStore.layerLocalStorage))

export const init: Runtime.RoutingApplicationInit<Model, Message, Flags> = (
  flags,
  url: Url,
) => {
  const route = urlToAppRoute(url)
  const songs = Option.match(flags.maybeSavedLibrary, {
    onNone: () => [],
    onSome: ({ songs }) => songs,
  })
  const homeInit = Home.init()
  const maybeCurrentSong = M.value(route).pipe(
    M.tag('SongEdit', ({ songId }) => Song.findById(songs, songId)),
    M.tag('SongPlay', ({ songId }) => Song.findById(songs, songId)),
    M.orElse(() => Option.none()),
  )
  const currentSong = Option.getOrElse(
    maybeCurrentSong,
    () => Editor.placeholderSong,
  )
  const editorInit = Editor.init(currentSong)
  const playInit = Play.init(currentSong)
  const themePreference: ThemePreference = Option.getOrElse(
    flags.maybeThemePreference,
    () => 'System',
  )
  const resolvedTheme = resolveTheme(themePreference, flags.systemTheme)

  return {
    model: {
      route,
      songs,
      home: homeInit.model,
      editor: editorInit.model,
      play: playInit.model,
      toast: Toast.init({ id: 'app-toast' }),
      maybePendingEditSongId: Option.none(),
      maybeThemePreference: Option.some(themePreference),
      systemTheme: flags.systemTheme,
      resolvedTheme,
    },
    commands: [ApplyTheme({ theme: resolvedTheme })],
  }
}
