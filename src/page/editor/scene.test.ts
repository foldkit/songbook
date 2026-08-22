import {
  Command,
  click,
  expect,
  given,
  label,
  role,
  scene,
} from 'foldkit/scene'
import { evo } from 'foldkit/struct'
import { describe, test } from 'vitest'

import { Line, Song } from '../../domain'
import { FocusChordDraft } from './command'
import { Message } from './message'
import { init } from './model'
import { update } from './update'
import { view } from './view'

const song = Song.updateSection(
  Song.create('song-1', 'section-1'),
  'section-1',
  section =>
    evo(section, {
      lines: () => [Line.empty('line-1', 'Hello world')],
    }),
)

const [editorModel] = init(song)

describe('editor view', () => {
  test('clicking a lyric word opens the chord input', () => {
    scene(
      { update, view },
      given(editorModel),
      expect(role('heading', { name: 'Untitled' })).toExist(),
      expect(role('button', { name: 'Place chord on Hello' })).toExist(),
      click(role('button', { name: 'Place chord on Hello' })),
      Command.resolve(FocusChordDraft, Message.CompletedFocusChordDraft()),
      expect(label('Chord on Hello')).toExist(),
    )
  })
})
