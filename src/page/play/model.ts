import { Schema as S } from 'effect'

import { PLACEHOLDER_SECTION_ID, PLACEHOLDER_SONG_ID } from '../../constant'
import { Song } from '../../domain'

export const Model = S.Struct({
  song: Song.Song,
})

export type Model = typeof Model.Type

export const init = (
  song: Song.Song,
): readonly [Model, ReadonlyArray<never>] => [{ song }, []]

export const placeholderSong = Song.create(
  PLACEHOLDER_SONG_ID,
  PLACEHOLDER_SECTION_ID,
)
