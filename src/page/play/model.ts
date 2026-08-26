import { Schema as S } from 'effect'
import { evo } from 'foldkit/struct'

import { PLACEHOLDER_SECTION_ID, PLACEHOLDER_SONG_ID } from '../../constant'
import { Song } from '../../domain'

export const Model = S.Struct({
  song: Song.Song,
})

export type Model = typeof Model.Type

export const init = (song: Song.Song) => ({
  model: { song },
})

export const placeholderSong = Song.create(
  PLACEHOLDER_SONG_ID,
  PLACEHOLDER_SECTION_ID,
)

export const loadSong = (model: Model, song: Song.Song) =>
  model.song.id === song.id ? { model } : init(song)

export const abandonSong = (model: Model, songId: string) =>
  model.song.id === songId ? init(placeholderSong) : { model }

export const syncSong = (model: Model, song: Song.Song) =>
  model.song.id === song.id
    ? { model: evo(model, { song: () => song }) }
    : { model }
