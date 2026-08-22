import { Array, Match as M, Option, String as Str } from 'effect'
import type { Html, HtmlBuilder } from 'foldkit/html'

import { Button, Input } from '@foldkit/ui'

import { CHORD_DRAFT_INPUT_ID } from '../../constant'
import { Line } from '../../domain'
import * as className from '../../view/className'
import * as Message from './message'
import type { Model, PlacingChord } from './model'

const chordDraftKeyMessage = (key: string): Option.Option<Message.Message> =>
  M.value(key).pipe(
    M.when('Escape', () => Message.PressedCancelChord()),
    M.when('Enter', () => Message.PressedCommitChord()),
    M.option,
  )

const isPlacingOnWord = (
  maybePlacing: Option.Option<PlacingChord>,
  lineId: string,
  at: number,
): boolean =>
  Option.exists(
    maybePlacing,
    placing => placing.lineId === lineId && placing.at === at,
  )

const chordSlotView = (
  line: Line.LyricLine,
  word: Line.Word,
  maybePlacing: Option.Option<PlacingChord>,
  h: HtmlBuilder<Message.Message>,
): Html => {
  if (isPlacingOnWord(maybePlacing, line.id, word.start)) {
    const draft = Option.match(maybePlacing, {
      onNone: () => '',
      onSome: ({ draft }) => draft,
    })

    return Input.view(
      {
        id: CHORD_DRAFT_INPUT_ID,
        value: draft,
        onInput: value => Message.UpdatedChordDraft({ value }),
        placeholder: 'Am',
        isAutofocus: true,
        toView: attributes =>
          h.div(
            [h.Class('min-h-7')],
            [
              h.label(
                [...attributes.label, h.Class('sr-only')],
                [`Chord on ${word.text}`],
              ),
              h.input([
                ...attributes.input,
                h.Class(
                  'w-16 rounded-sm border border-amber-700 bg-white px-1 py-0.5 font-semibold text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                ),
                h.OnBlur(Message.BlurredChordDraft()),
                h.OnKeyDownPreventDefault(chordDraftKeyMessage),
              ]),
            ],
          ),
      },
      h,
    )
  }

  const maybeMark = Line.markAt(line, word.start)

  return Option.match(maybeMark, {
    onNone: () => h.div([h.Class('min-h-7')]),
    onSome: mark =>
      Button.view(
        {
          onClick: Message.ClickedWord({ lineId: line.id, at: word.start }),
          toView: attributes =>
            h.button(
              [
                ...attributes.button,
                h.Class(
                  'min-h-7 cursor-pointer rounded-sm px-0.5 text-left font-semibold text-amber-800 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400',
                ),
                h.AriaLabel(`Edit chord ${mark.name} on ${word.text}`),
              ],
              [mark.name],
            ),
        },
        h,
      ),
  })
}

const wordButtonView = (
  line: Line.LyricLine,
  word: Line.Word,
  h: HtmlBuilder<Message.Message>,
): Html =>
  Button.view(
    {
      onClick: Message.ClickedWord({ lineId: line.id, at: word.start }),
      toView: attributes =>
        h.button(
          [
            ...attributes.button,
            h.Class(className.wordButton),
            h.AriaLabel(`Place chord on ${word.text}`),
          ],
          [word.text],
        ),
    },
    h,
  )

export const lineView = (
  line: Line.LyricLine,
  maybePlacing: Option.Option<PlacingChord>,
  h: HtmlBuilder<Message.Message>,
): Html =>
  Array.match(Line.words(line.lyric), {
    onEmpty: () =>
      h.p(
        [h.Class('min-h-7 text-sm text-stone-400')],
        [Str.isNonEmpty(line.lyric) ? line.lyric : 'Empty line'],
      ),
    onNonEmpty: words =>
      h.div(
        [h.Class('flex flex-wrap items-end gap-x-2 gap-y-1')],
        Array.map(words, word =>
          h.keyed('div')(
            `${line.id}-${String(word.start)}`,
            [h.Class('flex flex-col items-start')],
            [
              chordSlotView(line, word, maybePlacing, h),
              wordButtonView(line, word, h),
            ],
          ),
        ),
      ),
  })

export const maybePlacingChord = (model: Model): Option.Option<PlacingChord> =>
  M.value(model.mode).pipe(
    M.tag('PlacingChord', placing => placing),
    M.option,
  )

export const isEditingSection = (model: Model, sectionId: string): boolean =>
  Option.exists(
    M.value(model.mode).pipe(
      M.tag('EditingLyrics', editing => editing),
      M.option,
    ),
    editing => editing.sectionId === sectionId,
  )

export const lyricsDraft = (model: Model): string =>
  M.value(model.mode).pipe(
    M.tag('EditingLyrics', ({ draft }) => draft),
    M.orElse(() => ''),
  )
