import { Effect, Schema as S } from 'effect'
import { Command } from 'foldkit'

import { FailedCopyChart, SucceededCopyChart } from './message'

export const CopyChart = Command.define('CopyChart', {
  args: { text: S.String },
  messages: [SucceededCopyChart, FailedCopyChart],
  execute: ({ text }) =>
    Effect.tryPromise({
      try: () => navigator.clipboard.writeText(text),
      catch: () => new Error('Failed to copy to clipboard'),
    }).pipe(
      Effect.as(SucceededCopyChart()),
      Effect.catch(() =>
        Effect.succeed(FailedCopyChart({ error: 'Could not copy the chart.' })),
      ),
    ),
})
