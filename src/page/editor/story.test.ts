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

import { Menu } from '@foldkit/ui'

import { Line, Song } from '../../domain'
import { GenerateEditorIds } from './command'
import { Message, NewMarkRequest, OutMessage } from './message'
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
      message(Message.UpdatedTitle({ value: 'Blackbird' })),
      expectOutMessage(
        OutMessage.UpdatedSong({
          song: evo(song, { title: () => 'Blackbird' }),
        }),
      ),
      model(current => {
        expect(current.song.title).toBe('Blackbird')
      }),
    )
  })

  test('typing lyrics writes them onto the song so they persist', () => {
    const draft = 'Hello world\nFrom a song'

    story(
      update,
      given(editorModel),
      message(Message.ClickedEditLyrics({ sectionId: 'section-1' })),
      expectNoOutMessage(),
      message(Message.UpdatedLyricsDraft({ value: draft })),
      model(current => {
        expect(current.song.sections[0]?.lines[0]?.lyric).toBe('Hello world')
        expect(current.song.sections[0]?.lines[1]?.lyric).toBe('From a song')
      }),
    )
  })

  test('clicking a word starts placing a chord', () => {
    story(
      update,
      given(editorModel),
      message(Message.ClickedWord({ lineId: 'line-1', at: 0 })),
      expectNoOutMessage(),
      Command.resolve(Menu.FocusItems, Menu.Message.CompletedFocusItems()),
      model(current => {
        expect(current.mode._tag).toBe('PlacingChord')
        expect(current.chordMenu.isOpen).toBe(true)
      }),
    )
  })

  test('adding a song chord and tapping it places the mark', () => {
    story(
      update,
      given(editorModel),
      message(Message.UpdatedPaletteDraft({ value: 'G' })),
      message(Message.SubmittedPaletteChord()),
      expectOutMessage(
        OutMessage.UpdatedSong({
          song: evo(song, { chords: () => ['G'] }),
        }),
      ),
      message(Message.ClickedWord({ lineId: 'line-1', at: 0 })),
      Command.resolve(Menu.FocusItems, Menu.Message.CompletedFocusItems()),
      message(
        Message.GotChordMenuMessage({
          message: Menu.Message.SelectedItem({ index: 0, item: 'G' }),
        }),
      ),
      Command.resolve(Menu.FocusButton, Menu.Message.CompletedFocusButton()),
      Command.expectExact(
        GenerateEditorIds({
          count: 1,
          request: NewMarkRequest({
            lineId: 'line-1',
            at: 0,
            name: 'G',
          }),
        }),
      ),
      Command.resolve(
        GenerateEditorIds,
        Message.CompletedGenerateEditorIds({
          ids: ['mark-1'],
          request: NewMarkRequest({
            lineId: 'line-1',
            at: 0,
            name: 'G',
          }),
        }),
      ),
    )
  })
})
