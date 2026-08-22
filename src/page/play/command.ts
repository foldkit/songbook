import { Effect, Schema as S } from 'effect'
import { Command } from 'foldkit'

import { Message } from './message'

export const CopyChart = Command.define('CopyChart', {
  args: { text: S.String },
  messages: [Message.SucceededCopyChart, Message.FailedCopyChart],
  execute: ({ text }) =>
    Effect.tryPromise({
      try: () => navigator.clipboard.writeText(text),
      catch: () => new Error('Failed to copy to clipboard'),
    }).pipe(
      Effect.as(Message.SucceededCopyChart()),
      Effect.catch(() =>
        Effect.succeed(
          Message.FailedCopyChart({ error: 'Could not copy the chart.' }),
        ),
      ),
    ),
})
