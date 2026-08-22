import { Schema as S } from 'effect'
import { m } from 'foldkit/message'
import { ts } from 'foldkit/schema'

import { Dialog, DragAndDrop, Menu } from '@foldkit/ui'

import { Section, Song } from '../../domain'

export const NewSectionRequest = ts('NewSection', { kind: Section.SectionKind })
export const DuplicateSectionRequest = ts('DuplicateSection', {
  sectionId: S.String,
})
export const NewMarkRequest = ts('NewMark', {
  lineId: S.String,
  at: S.Number,
  name: S.String,
})
export const ReplaceLyricsRequest = ts('ReplaceLyrics', {
  sectionId: S.String,
  draft: S.String,
})

export const IdRequest = S.Union([
  NewSectionRequest,
  DuplicateSectionRequest,
  NewMarkRequest,
  ReplaceLyricsRequest,
])

export type IdRequest = typeof IdRequest.Type

export const UpdatedTitle = m('UpdatedTitle', { value: S.String })
export const UpdatedArtist = m('UpdatedArtist', { value: S.String })
export const UpdatedOriginalKey = m('UpdatedOriginalKey', { value: S.String })
export const ClickedEditLyrics = m('ClickedEditLyrics', {
  sectionId: S.String,
})
export const UpdatedLyricsDraft = m('UpdatedLyricsDraft', { value: S.String })
export const ClickedSaveLyrics = m('ClickedSaveLyrics')
export const ClickedCancelLyrics = m('ClickedCancelLyrics')
export const ClickedWord = m('ClickedWord', {
  lineId: S.String,
  at: S.Number,
})
export const UpdatedChordDraft = m('UpdatedChordDraft', { value: S.String })
export const BlurredChordDraft = m('BlurredChordDraft')
export const PressedCommitChord = m('PressedCommitChord')
export const PressedCancelChord = m('PressedCancelChord')
export const ClickedRemoveSection = m('ClickedRemoveSection', {
  sectionId: S.String,
})
export const ClickedConfirmRemoveSection = m('ClickedConfirmRemoveSection')
export const ClickedDuplicateSection = m('ClickedDuplicateSection', {
  sectionId: S.String,
})
export const CompletedGenerateEditorIds = m('CompletedGenerateEditorIds', {
  ids: S.Array(S.String),
  request: IdRequest,
})
export const CompletedFocusChordDraft = m('CompletedFocusChordDraft')
export const GotAddSectionMenuMessage = m('GotAddSectionMenuMessage', {
  message: Menu.Message,
})
export const GotSectionDragAndDropMessage = m('GotSectionDragAndDropMessage', {
  message: DragAndDrop.Message,
})
export const GotDeleteSectionDialogMessage = m(
  'GotDeleteSectionDialogMessage',
  { message: Dialog.Message },
)

export const Message = S.Union([
  UpdatedTitle,
  UpdatedArtist,
  UpdatedOriginalKey,
  ClickedEditLyrics,
  UpdatedLyricsDraft,
  ClickedSaveLyrics,
  ClickedCancelLyrics,
  ClickedWord,
  UpdatedChordDraft,
  BlurredChordDraft,
  PressedCommitChord,
  PressedCancelChord,
  ClickedRemoveSection,
  ClickedConfirmRemoveSection,
  ClickedDuplicateSection,
  CompletedGenerateEditorIds,
  CompletedFocusChordDraft,
  GotAddSectionMenuMessage,
  GotSectionDragAndDropMessage,
  GotDeleteSectionDialogMessage,
])

export type Message = typeof Message.Type

export const UpdatedSong = m('UpdatedSong', { song: Song.Song })

export const OutMessage = S.Union([UpdatedSong])

export type OutMessage = typeof OutMessage.Type
