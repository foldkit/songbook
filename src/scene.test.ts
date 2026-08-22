import { Option } from 'effect'
import { Command, click, expect, given, role, scene, text } from 'foldkit/scene'
import { describe, test } from 'vitest'

import { GenerateSongIds, NavigateInternal, SaveLibrary } from './command'
import { Message } from './message'
import type { Model } from './model'
import { Editor, Home, Play } from './page'
import { HomeRoute } from './route'
import { Toast } from './toast'
import { update } from './update'
import { view } from './view'

const emptyModel: Model = {
  route: HomeRoute(),
  songs: [],
  home: Home.init()[0],
  editor: Editor.init(Editor.placeholderSong)[0],
  play: Play.init(Play.placeholderSong)[0],
  toast: Toast.init({ id: 'app-toast' }),
  maybePendingEditSongId: Option.none(),
}

describe('library view', () => {
  test('empty library shows the heading and new song button', () => {
    scene(
      { update, view },
      given(emptyModel),
      expect(role('heading', { name: 'Songbook' })).toExist(),
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
})
