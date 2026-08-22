import { Subscription } from 'foldkit'

import { DragAndDrop } from '@foldkit/ui'

import { GotSectionDragAndDropMessage, type Message } from './message'
import { Model } from './model'

export const subscriptions = Subscription.lift({
  dragPointer: DragAndDrop.subscriptions.documentPointer,
  dragEscape: DragAndDrop.subscriptions.documentEscape,
  dragKeyboard: DragAndDrop.subscriptions.documentKeyboard,
  autoScroll: DragAndDrop.subscriptions.autoScroll,
})<Model, Message>({
  toChildModel: model => model.sectionDragAndDrop,
  toParentMessage: message => GotSectionDragAndDropMessage({ message }),
})
