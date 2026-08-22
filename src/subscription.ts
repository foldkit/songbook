import { Subscription } from 'foldkit'

import { GotEditorMessage, type Message } from './message'
import { Model } from './model'
import { Editor } from './page'

export const subscriptions = Subscription.lift(Editor.subscriptions)<
  Model,
  Message
>({
  toChildModel: model => model.editor,
  toParentMessage: message => GotEditorMessage({ message }),
  when: ({ route }) => route._tag === 'SongEdit',
})
