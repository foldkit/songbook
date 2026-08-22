import { Array, Crypto, Effect, Schema as S } from 'effect'
import { Command, Dom } from 'foldkit'

import { BrowserCrypto } from '@effect/platform-browser'

import { CHORD_DRAFT_INPUT_ID } from '../../constant'
import { IdRequest, Message } from './message'

export const GenerateEditorIds = Command.define('GenerateEditorIds', {
  args: { count: S.Number, request: IdRequest },
  messages: [Message.CompletedGenerateEditorIds],
  execute: ({ count, request }) =>
    Effect.gen(function* () {
      const crypto = yield* Crypto.Crypto
      const ids = yield* Effect.all(
        Array.makeBy(count, () => Effect.orDie(crypto.randomUUIDv4)),
      )
      return Message.CompletedGenerateEditorIds({ ids, request })
    }).pipe(Effect.provide(BrowserCrypto.layer)),
})

export const FocusChordDraft = Command.define('FocusChordDraft', {
  messages: [Message.CompletedFocusChordDraft],
  execute: Dom.focus(`#${CHORD_DRAFT_INPUT_ID}`).pipe(
    Effect.ignore,
    Effect.as(Message.CompletedFocusChordDraft()),
  ),
})
