import { Crypto, Effect, Schema as S } from 'effect'
import { KeyValueStore } from 'effect/unstable/persistence'
import { Command } from 'foldkit'
import { load, pushUrl } from 'foldkit/navigation'

import { BrowserCrypto, BrowserKeyValueStore } from '@effect/platform-browser'

import { STORAGE_KEY } from './constant'
import { Song } from './domain'
import { Message } from './message'

export const SavedLibrary = S.Struct({
  songs: S.Array(Song.Song),
})

export type SavedLibrary = typeof SavedLibrary.Type

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
        S.encodeSync(S.fromJsonString(SavedLibrary))({ songs }),
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
