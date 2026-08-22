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
import { Message, OutMessage } from './message'
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
      Command.expectExact(FocusChordDraft()),
      Command.resolve(FocusChordDraft, Message.CompletedFocusChordDraft()),
      expectNoOutMessage(),
      model(current => {
        expect(current.mode._tag).toBe('PlacingChord')
      }),
    )
  })
})
