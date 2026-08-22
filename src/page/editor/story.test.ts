import {
  Command,
  expectNoOutMessage,
  expectOutMessage,
  given,
  message,
  model,
  story,
} from 'foldkit/story'
import { evo } from 'foldkit/struct'
import { describe, expect, test } from 'vitest'

import { Line, Song } from '../../domain'
import { FocusChordDraft } from './command'
import {
  ClickedWord,
  CompletedFocusChordDraft,
  UpdatedSong,
  UpdatedTitle,
} from './message'
import { init } from './model'
import { update } from './update'

const baseSong = Song.create('song-1', 'section-1')
const song = Song.updateSection(baseSong, 'section-1', section =>
  evo(section, {
    lines: () => [Line.empty('line-1', 'Hello world')],
  }),
)

const [editorModel] = init(song)

describe('editor', () => {
  test('updating the title emits the changed song', () => {
    story(
      update,
      given(editorModel),
      message(UpdatedTitle({ value: 'Blackbird' })),
      expectOutMessage(
        UpdatedSong({ song: evo(song, { title: () => 'Blackbird' }) }),
      ),
      model(current => {
        expect(current.song.title).toBe('Blackbird')
      }),
    )
  })

  test('clicking a word starts placing a chord', () => {
    story(
      update,
      given(editorModel),
      message(ClickedWord({ lineId: 'line-1', at: 0 })),
      Command.expectExact(FocusChordDraft()),
      Command.resolve(FocusChordDraft, CompletedFocusChordDraft()),
      expectNoOutMessage(),
      model(current => {
        expect(current.mode._tag).toBe('PlacingChord')
      }),
    )
  })
})
