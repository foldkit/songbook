import { Option, Schema as S } from 'effect'
import { ts } from 'foldkit/schema'

import { Dialog, DragAndDrop, Menu } from '@foldkit/ui'

import {
  CHORD_MENU_ID,
  PLACEHOLDER_SECTION_ID,
  PLACEHOLDER_SONG_ID,
} from '../../constant'
import { Line, Song } from '../../domain'

export const Viewing = ts('Viewing')
export const EditingLyrics = ts('EditingLyrics', {
  sectionId: S.String,
  draft: S.String,
  backupLines: S.Array(Line.LyricLine),
})
export const PlacingChord = ts('PlacingChord', {
  lineId: S.String,
  at: S.Number,
  maybeMarkId: S.Option(S.String),
})

export const EditorMode = S.Union([Viewing, EditingLyrics, PlacingChord])

export type Viewing = typeof Viewing.Type
export type EditingLyrics = typeof EditingLyrics.Type
export type PlacingChord = typeof PlacingChord.Type
export type EditorMode = typeof EditorMode.Type

export const Model = S.Struct({
  song: Song.Song,
  mode: EditorMode,
  paletteDraft: S.String,
  addSectionMenu: Menu.Model,
  chordMenu: Menu.Model,
  sectionDragAndDrop: DragAndDrop.Model,
  deleteSectionDialog: Dialog.Model,
  maybePendingDeleteSectionId: S.Option(S.String),
  announcement: S.String,
})

export type Model = typeof Model.Type

export const init = (
  song: Song.Song,
): readonly [Model, ReadonlyArray<never>] => [
  {
    song,
    mode: Viewing(),
    paletteDraft: '',
    addSectionMenu: Menu.init({ id: 'add-section-menu' }),
    chordMenu: Menu.init({ id: CHORD_MENU_ID }),
    sectionDragAndDrop: DragAndDrop.init({
      id: 'section-dnd',
      orientation: 'Vertical',
    }),
    deleteSectionDialog: Dialog.init({ id: 'delete-section-dialog' }),
    maybePendingDeleteSectionId: Option.none(),
    announcement: '',
  },
  [],
]

export const placeholderSong = Song.create(
  PLACEHOLDER_SONG_ID,
  PLACEHOLDER_SECTION_ID,
)
