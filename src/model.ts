import { Schema as S } from 'effect'

import { Song } from './domain'
import { Editor, Home, Play } from './page'
import { AppRoute } from './route'
import { Toast } from './toast'

export const Model = S.Struct({
  route: AppRoute,
  songs: S.Array(Song.Song),
  home: Home.Model,
  editor: Editor.Model,
  play: Play.Model,
  toast: Toast.Model,
  maybePendingEditSongId: S.Option(S.String),
})

export type Model = typeof Model.Type
