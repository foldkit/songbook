import { Array, Option, Schema as S } from 'effect'
import { evo } from 'foldkit/struct'
import { fromString as urlFromString } from 'foldkit/url'
import { describe, expect, test } from 'vitest'

import { SavedLibraryJsonString } from './command'
import { Line, Song } from './domain'
import { Flags, init } from './main'

const libraryWithSong = (song: Song.Song) => ({ songs: [song] })

describe('library persistence', () => {
  test('saved songs round-trip through localStorage JSON', () => {
    const song = evo(Song.create('song-1', 'section-1'), {
      title: () => 'Blackbird',
      artist: () => 'The Beatles',
      maybeOriginalKey: () => Option.some('G'),
      sections: Array.map(section =>
        evo(section, {
          lines: () => [Line.empty('line-1', 'Blackbird singing')],
        }),
      ),
    })

    const encoded = S.encodeSync(SavedLibraryJsonString)(libraryWithSong(song))
    const decoded = S.decodeSync(SavedLibraryJsonString)(encoded)

    expect(decoded.songs).toHaveLength(1)
    expect(decoded.songs[0]?.title).toBe('Blackbird')
    expect(decoded.songs[0]?.sections[0]?.lines[0]?.lyric).toBe(
      'Blackbird singing',
    )
    expect(decoded.songs[0]?.maybeOriginalKey).toEqual(Option.some('G'))
    expect(Option.isSome(Song.findById(decoded.songs, 'song-1'))).toBe(true)
  })

  test('still loads libraries written before the JSON codec', () => {
    const encoded = JSON.stringify({
      songs: [
        {
          id: 'song-1',
          title: 'Blackbird',
          artist: 'The Beatles',
          maybeOriginalKey: { _id: 'Option', _tag: 'None' },
          transpose: 0,
          capo: 0,
          sections: [
            {
              id: 'section-1',
              kind: 'Verse',
              lines: [{ id: 'line-1', lyric: 'Blackbird singing', marks: [] }],
            },
          ],
        },
      ],
    })

    const decoded = S.decodeSync(SavedLibraryJsonString)(encoded)

    expect(Option.isSome(Song.findById(decoded.songs, 'song-1'))).toBe(true)
  })

  test('booting on a song URL finds the saved chart', () => {
    const song = Song.create('song-1', 'section-1')
    const encoded = S.encodeSync(SavedLibraryJsonString)(libraryWithSong(song))
    const decoded = S.decodeSync(SavedLibraryJsonString)(encoded)
    const url = Option.getOrThrow(
      urlFromString('http://localhost/songs/song-1'),
    )
    const [model] = init(
      Flags.make({ maybeSavedLibrary: Option.some(decoded) }),
      url,
    )

    expect(model.route._tag).toBe('SongEdit')
    expect(Option.isSome(Song.findById(model.songs, 'song-1'))).toBe(true)
    expect(model.editor.song.id).toBe('song-1')
  })
})
