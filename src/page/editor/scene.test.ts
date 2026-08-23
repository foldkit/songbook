import {
  Command,
  Mount,
  click,
  expect,
  given,
  pointerDown,
  role,
  scene,
} from 'foldkit/scene'
import { evo } from 'foldkit/struct'
import { describe, test } from 'vitest'

import { Menu } from '@foldkit/ui'

import { Line, Song } from '../../domain'
import { GenerateEditorIds } from './command'
import { Message, NewMarkRequest } from './message'
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
  test('clicking a lyric word then a song chord places it', () => {
    const withPalette = evo(editorModel, {
      song: () => evo(song, { chords: () => ['G'] }),
    })

    scene(
      { update, view },
      given(withPalette),
      expect(role('heading', { name: 'Untitled' })).toExist(),
      expect(role('button', { name: 'Place chord on Hello' })).toExist(),
      click(role('button', { name: 'Place chord on Hello' })),
      Command.resolve(Menu.FocusItems, Menu.Message.CompletedFocusItems()),
      Mount.resolve(Menu.AnchorMenu, Menu.Message.CompletedAnchorMenu()),
      Mount.resolve(
        Menu.PortalMenuBackdrop,
        Menu.Message.CompletedPortalMenuBackdrop(),
      ),
      click(role('menuitem', { name: 'G' })),
      Command.resolve(Menu.FocusButton, Menu.Message.CompletedFocusButton()),
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
      Mount.expectEnded(Menu.AnchorMenu),
      Mount.expectEnded(Menu.PortalMenuBackdrop),
      expect(role('button', { name: 'Edit chord G on Hello' })).toExist(),
    )
  })

  test('section reorder starts from the drag handle, not the card body', () => {
    scene(
      { update, view },
      given(editorModel),
      expect(role('option', { name: 'Reorder Verse' })).toExist(),
      expect(role('option', { name: 'Reorder Verse' })).toHaveAttr(
        'aria-roledescription',
        'draggable',
      ),
      pointerDown(role('option', { name: 'Reorder Verse' })),
      click(role('button', { name: 'Edit lyrics' })),
      expect(role('textbox', { name: 'Lyrics' })).toExist(),
    )
  })
})
