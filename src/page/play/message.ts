import { Schema as S } from 'effect'
import { m } from 'foldkit/message'

import { Song } from '../../domain'

export const ClickedTransposeDown = m('ClickedTransposeDown')
export const ClickedTransposeUp = m('ClickedTransposeUp')
export const ClickedCapoDown = m('ClickedCapoDown')
export const ClickedCapoUp = m('ClickedCapoUp')
export const ClickedCopyChart = m('ClickedCopyChart')
export const SucceededCopyChart = m('SucceededCopyChart')
export const FailedCopyChart = m('FailedCopyChart', { error: S.String })

export const Message = S.Union([
  ClickedTransposeDown,
  ClickedTransposeUp,
  ClickedCapoDown,
  ClickedCapoUp,
  ClickedCopyChart,
  SucceededCopyChart,
  FailedCopyChart,
])

export type Message = typeof Message.Type

export const UpdatedSong = m('UpdatedSong', { song: Song.Song })
export const CopiedChart = m('CopiedChart')
export const FailedCopy = m('FailedCopy', { error: S.String })

export const OutMessage = S.Union([UpdatedSong, CopiedChart, FailedCopy])

export type OutMessage = typeof OutMessage.Type
