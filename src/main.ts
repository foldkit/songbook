import { Effect, Match as M, Option, Schema as S } from 'effect'
import { KeyValueStore } from 'effect/unstable/persistence'
import { Runtime } from 'foldkit'
import { Url } from 'foldkit/url'

import { BrowserKeyValueStore } from '@effect/platform-browser'

import { SavedLibrary } from './command'
import { STORAGE_KEY } from './constant'
import { Song } from './domain'
import { Message } from './message'
import { Model } from './model'
import { Editor, Home, Play } from './page'
import { urlToAppRoute } from './route'
import { Toast } from './toast'

export { Message, Model }
export { update } from './update'
export { view } from './view'
export { subscriptions } from './subscription'

export const Flags = S.Struct({
  maybeSavedLibrary: S.Option(SavedLibrary),
})

export type Flags = typeof Flags.Type

export const flags: Effect.Effect<Flags> = Effect.gen(function* () {
  const store = yield* KeyValueStore.KeyValueStore
  const json = yield* Effect.fromOption(
    Option.fromNullishOr(yield* store.get(STORAGE_KEY)),
  )
  const decoded = yield* S.decodeEffect(S.fromJsonString(SavedLibrary))(json)
  return Flags.make({ maybeSavedLibrary: Option.some(decoded) })
}).pipe(
  Effect.catch(() =>
    Effect.succeed(Flags.make({ maybeSavedLibrary: Option.none() })),
  ),
  Effect.provide(BrowserKeyValueStore.layerLocalStorage),
)

export const init: Runtime.RoutingApplicationInit<Model, Message, Flags> = (
  flags,
  url: Url,
) => {
  const route = urlToAppRoute(url)
  const songs = Option.match(flags.maybeSavedLibrary, {
    onNone: () => [],
    onSome: ({ songs }) => songs,
  })
  const [home] = Home.init()
  const maybeCurrentSong = M.value(route).pipe(
    M.tag('SongEdit', ({ songId }) => Song.findById(songs, songId)),
    M.tag('SongPlay', ({ songId }) => Song.findById(songs, songId)),
    M.orElse(() => Option.none()),
  )
  const currentSong = Option.getOrElse(
    maybeCurrentSong,
    () => Editor.placeholderSong,
  )
  const [editor] = Editor.init(currentSong)
  const [play] = Play.init(currentSong)

  return [
    {
      route,
      songs,
      home,
      editor,
      play,
      toast: Toast.init({ id: 'app-toast' }),
      maybePendingEditSongId: Option.none(),
    },
    [],
  ]
}
