import {
  Command,
  expectOutMessage,
  given,
  message,
  model,
  story,
} from 'foldkit/story'
import { evo } from 'foldkit/struct'
import { describe, expect, test } from 'vitest'

import { Line, Song } from '../../domain'
import { CopyChart } from './command'
import {
  ClickedCapoUp,
  ClickedCopyChart,
  ClickedTransposeUp,
  FailedCopyChart,
  SucceededCopyChart,
  UpdatedSong,
} from './message'
import { init } from './model'
import { update } from './update'

const base = Song.updateSection(
  Song.create('song-1', 'section-1'),
  'section-1',
  section =>
    evo(section, {
      lines: () => [
        Line.upsertMark(Line.empty('line-1', 'Hello world'), {
          id: 'mark-1',
          at: 0,
          name: 'G',
        }),
      ],
    }),
)

const [playModel] = init(base)

describe('play view preferences', () => {
  test('transpose up changes display without rewriting stored chord names', () => {
    story(
      update,
      given(playModel),
      message(ClickedTransposeUp()),
      model(current => {
        expect(current.song.transpose).toBe(1)
        expect(current.song.sections[0]?.lines[0]?.marks[0]?.name).toBe('G')
        expect(Song.toChartText(current.song)).toContain('G#')
      }),
      expectOutMessage(
        UpdatedSong({ song: evo(base, { transpose: () => 1 }) }),
      ),
    )
  })

  test('capo up displays shapes a whole step down', () => {
    story(
      update,
      given(playModel),
      message(ClickedCapoUp()),
      model(current => {
        expect(current.song.capo).toBe(1)
        expect(Song.toChartText(current.song)).toContain('F#')
      }),
      expectOutMessage(UpdatedSong({ song: evo(base, { capo: () => 1 }) })),
    )
  })

  test('copying the chart succeeds', () => {
    story(
      update,
      given(playModel),
      message(ClickedCopyChart()),
      Command.expectExact(CopyChart({ text: Song.toChartText(base) })),
      Command.resolve(CopyChart, SucceededCopyChart()),
    )
  })

  test('copying the chart can fail', () => {
    story(
      update,
      given(playModel),
      message(ClickedCopyChart()),
      Command.resolve(
        CopyChart,
        FailedCopyChart({ error: 'Could not copy the chart.' }),
      ),
    )
  })
})
