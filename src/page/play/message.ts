import { Schema as S } from 'effect'
import { defineMessageUnion } from 'foldkit/message'

import { Song } from '../../domain'

export const Message = defineMessageUnion({
  ClickedTransposeDown: {},
  ClickedTransposeUp: {},
  ClickedCapoDown: {},
  ClickedCapoUp: {},
  ClickedCopyChart: {},
  SucceededCopyChart: {},
  FailedCopyChart: { error: S.String },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  UpdatedSong: { song: Song.Song },
  CopiedChart: {},
  FailedCopy: { error: S.String },
})
export type OutMessage = typeof OutMessage.Type
