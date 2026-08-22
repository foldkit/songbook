import { Schema as S } from 'effect'
import { m } from 'foldkit/message'

import { Dialog } from '@foldkit/ui'

export const UpdatedSearchQuery = m('UpdatedSearchQuery', { value: S.String })
export const ClickedNewSong = m('ClickedNewSong')
export const ClickedDeleteSong = m('ClickedDeleteSong', { songId: S.String })
export const ClickedConfirmDelete = m('ClickedConfirmDelete')
export const GotDeleteDialogMessage = m('GotDeleteDialogMessage', {
  message: Dialog.Message,
})

export const Message = S.Union([
  UpdatedSearchQuery,
  ClickedNewSong,
  ClickedDeleteSong,
  ClickedConfirmDelete,
  GotDeleteDialogMessage,
])

export type Message = typeof Message.Type

export const RequestedNewSong = m('RequestedNewSong')
export const ConfirmedDeleteSong = m('ConfirmedDeleteSong', {
  songId: S.String,
})

export const OutMessage = S.Union([RequestedNewSong, ConfirmedDeleteSong])

export type OutMessage = typeof OutMessage.Type
