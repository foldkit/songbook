import { Schema as S } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import { Dialog } from '@foldkit/ui'

export const Message = defineMessageUnion({
  UpdatedSearchQuery: { value: S.String },
  ClickedNewSong: {},
  ClickedDeleteSong: { songId: S.String },
  ClickedConfirmDelete: {},
  GotDeleteDialogMessage: { message: Dialog.Message },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  RequestedNewSong: {},
  ConfirmedDeleteSong: { songId: S.String },
})
export type OutMessage = typeof OutMessage.Type
