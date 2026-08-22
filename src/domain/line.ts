import { Array, Option, Order, Schema as S, pipe } from 'effect'
import { evo } from 'foldkit/struct'

export const ChordMark = S.Struct({
  id: S.String,
  at: S.Number,
  name: S.String,
})

export type ChordMark = typeof ChordMark.Type

export const LyricLine = S.Struct({
  id: S.String,
  lyric: S.String,
  marks: S.Array(ChordMark),
})

export type LyricLine = typeof LyricLine.Type

export type Word = Readonly<{
  start: number
  text: string
}>

export const empty = (id: string, lyric = ''): LyricLine => ({
  id,
  lyric,
  marks: [],
})

export const words = (lyric: string): ReadonlyArray<Word> =>
  pipe(
    Array.fromIterable(lyric.matchAll(/\S+/g)),
    Array.flatMap(match =>
      Option.match(Option.fromNullishOr(match.index), {
        onNone: () => [],
        onSome: start => [{ start, text: match[0] ?? '' }],
      }),
    ),
  )

export const markAt = (line: LyricLine, at: number): Option.Option<ChordMark> =>
  Array.findFirst(line.marks, mark => mark.at === at)

export const upsertMark = (line: LyricLine, mark: ChordMark): LyricLine =>
  evo(line, {
    marks: marks =>
      pipe(
        marks,
        Array.filter(({ at, id }) => at !== mark.at && id !== mark.id),
        Array.append(mark),
        Array.sortWith(mark => mark.at, Order.Number),
      ),
  })

export const updateMarkName = (
  line: LyricLine,
  markId: string,
  name: string,
): LyricLine =>
  evo(line, {
    marks: Array.map(mark =>
      mark.id === markId ? evo(mark, { name: () => name }) : mark,
    ),
  })

export const removeMark = (line: LyricLine, markId: string): LyricLine =>
  evo(line, {
    marks: Array.filter(({ id }) => id !== markId),
  })

export const setLyric = (line: LyricLine, lyric: string): LyricLine => {
  const nextStarts = pipe(
    words(lyric),
    Array.map(({ start }) => start),
  )

  return evo(line, {
    lyric: () => lyric,
    marks: Array.filter(({ at }) => Array.contains(nextStarts, at)),
  })
}
