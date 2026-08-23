import { Schema as S } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
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

export const IdRequest = S.Union([
  NewSectionRequest,
  DuplicateSectionRequest,
  NewMarkRequest,
])

export type IdRequest = typeof IdRequest.Type

export const Message = defineMessageUnion({
  UpdatedTitle: { value: S.String },
  UpdatedArtist: { value: S.String },
  UpdatedOriginalKey: { value: S.String },
  ClickedEditLyrics: { sectionId: S.String },
  UpdatedLyricsDraft: { value: S.String },
  ClickedSaveLyrics: {},
  ClickedCancelLyrics: {},
  ClickedWord: { lineId: S.String, at: S.Number },
  UpdatedPaletteDraft: { value: S.String },
  SubmittedPaletteChord: {},
  ClickedRemovePaletteChord: { name: S.String },
  ClickedRemoveSection: { sectionId: S.String },
  ClickedConfirmRemoveSection: {},
  ClickedDuplicateSection: { sectionId: S.String },
  CompletedGenerateEditorIds: {
    ids: S.Array(S.String),
    request: IdRequest,
  },
  GotAddSectionMenuMessage: { message: Menu.Message },
  GotChordMenuMessage: { message: Menu.Message },
  GotSectionDragAndDropMessage: { message: DragAndDrop.Message },
  GotDeleteSectionDialogMessage: { message: Dialog.Message },
})
export type Message = typeof Message.Type

// OUT MESSAGE

export const OutMessage = defineMessageUnion({
  UpdatedSong: { song: Song.Song },
})
export type OutMessage = typeof OutMessage.Type
