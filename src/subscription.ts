import { Effect, Option, Queue, Schema as S, Stream } from 'effect'
import { Subscription } from 'foldkit'

import { Message } from './message'
import { Model } from './model'
import { Editor } from './page'

const editorSubscriptions = Subscription.lift(Editor.subscriptions)<
  Model,
  Message
>({
  toChildModel: model => model.editor,
  toParentMessage: message => Message.GotEditorMessage({ message }),
  when: ({ route }) => route._tag === 'SongEdit',
})

const themeSubscriptions = Subscription.make<Model, Message>()(entry => ({
  systemTheme: entry(
    { isSystemPreference: S.Boolean },
    {
      modelToDependencies: model => ({
        isSystemPreference: Option.exists(
          model.maybeThemePreference,
          preference => preference === 'System',
        ),
      }),
      dependenciesToStream: ({ isSystemPreference }) =>
        Stream.when(
          Stream.callback<typeof Message.ChangedSystemTheme.Type>(queue =>
            Effect.acquireRelease(
              Effect.sync(() => {
                const mediaQuery = window.matchMedia(
                  '(prefers-color-scheme: dark)',
                )
                const handler = (event: MediaQueryListEvent) => {
                  Queue.offerUnsafe(
                    queue,
                    Message.ChangedSystemTheme({
                      theme: event.matches ? 'Dark' : 'Light',
                    }),
                  )
                }
                mediaQuery.addEventListener('change', handler)
                return { mediaQuery, handler }
              }),
              ({ mediaQuery, handler }) =>
                Effect.sync(() =>
                  mediaQuery.removeEventListener('change', handler),
                ),
            ).pipe(Effect.flatMap(() => Effect.never)),
          ),
          Effect.sync(() => isSystemPreference),
        ),
    },
  ),
}))

export const subscriptions = Subscription.aggregate<Model, Message>()(
  editorSubscriptions,
  themeSubscriptions,
)
