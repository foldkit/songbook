import { Option } from 'effect'
import {
  Command,
  click,
  expect,
  given,
  role,
  scene,
  selector,
  text,
} from 'foldkit/scene'
import { evo } from 'foldkit/struct'
import { describe, test } from 'vitest'

import {
  ApplyTheme,
  GenerateSongIds,
  NavigateInternal,
  SaveLibrary,
  SaveThemePreference,
} from './command'
import { SECTIONS_CONTAINER_ID } from './constant'
import { Song } from './domain'
import { Message } from './message'
import type { Model } from './model'
import { Editor, Home, Play } from './page'
import { HomeRoute, SongEditRoute } from './route'
import { Toast } from './toast'
import { update } from './update'
import { view } from './view'

const emptyModel: Model = {
  route: HomeRoute(),
  songs: [],
  home: Home.init().model,
  editor: Editor.init(Editor.placeholderSong).model,
  play: Play.init(Play.placeholderSong).model,
  toast: Toast.init({ id: 'app-toast' }),
  maybePendingEditSongId: Option.none(),
  maybeThemePreference: Option.some('System'),
  systemTheme: 'Light',
  resolvedTheme: 'Light',
}

describe('library view', () => {
  test('empty library shows the heading and new song button', () => {
    scene(
      { update, view },
      given(emptyModel),
      expect(role('heading', { name: 'Coverchart' })).toExist(),
      expect(role('button', { name: 'New song' })).toExist(),
      expect(
        text('No songs yet. Start a chart and paste lyrics while you listen.'),
      ).toExist(),
      click(role('button', { name: 'New song' })),
      Command.resolve(
        GenerateSongIds,
        Message.CompletedGenerateSongIds({
          songId: 'song-1',
          sectionId: 'section-1',
        }),
      ),
      Command.resolve(SaveLibrary, Message.SucceededSaveLibrary()),
      Command.resolve(NavigateInternal, Message.CompletedNavigateInternal()),
    )
  })

  test('theme selector switches to dark mode', () => {
    scene(
      { update, view },
      given(emptyModel),
      expect(role('group', { name: 'Theme preference' })).toExist(),
      expect(role('button', { name: 'System mode' })).toHaveAttr(
        'aria-pressed',
        'true',
      ),
      click(role('button', { name: 'Dark mode' })),
      Command.resolve(ApplyTheme, Message.CompletedApplyTheme()),
      Command.resolve(
        SaveThemePreference,
        Message.CompletedSaveThemePreference(),
      ),
      expect(role('button', { name: 'Dark mode' })).toHaveAttr(
        'aria-pressed',
        'true',
      ),
      expect(role('button', { name: 'System mode' })).toHaveAttr(
        'aria-pressed',
        'false',
      ),
    )
  })

  test('the shell marks itself as dragging while a section is moved', () => {
    const song = Song.create('song-1', 'section-1')
    const editorInit = Editor.init(song)
    const dragging: Model = evo(emptyModel, {
      route: () => SongEditRoute({ songId: song.id }),
      songs: () => [song],
      editor: () =>
        evo(editorInit.model, {
          sectionDragAndDrop: dnd =>
            evo(dnd, {
              dragState: () => ({
                _tag: 'Dragging',
                itemId: 'section-1',
                sourceContainerId: SECTIONS_CONTAINER_ID,
                sourceIndex: 0,
                origin: { screenX: 0, screenY: 0 },
                current: { clientX: 10, clientY: 10 },
                maybeDropTarget: Option.none(),
              }),
            }),
        }),
    })

    scene(
      { update, view },
      given(dragging),
      expect(selector('.is-dragging')).toExist(),
      expect(role('link', { name: 'Library' })).toExist(),
    )
  })
})
