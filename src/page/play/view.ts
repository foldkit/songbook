import { Array, Option, String as Str, pipe } from 'effect'
import { Submodel } from 'foldkit'
import type { Html, HtmlBuilder } from 'foldkit/html'

import { Button } from '@foldkit/ui'

import { Song } from '../../domain'
import { homeRouter, songEditRouter } from '../../route'
import * as className from '../../view/className'
import { Message } from './message'
import { Model } from './model'

const formatSigned = (value: number): string =>
  value > 0 ? `+${String(value)}` : String(value)

const metaLineView = (song: Song.Song, h: HtmlBuilder<Message>): Html => {
  const keyText = Option.match(song.maybeOriginalKey, {
    onNone: () => '',
    onSome: key => `Key ${key}`,
  })
  const parts = pipe(
    [
      Str.isNonEmpty(song.artist) ? song.artist : '',
      keyText,
      song.capo > 0 ? `Capo ${String(song.capo)}` : '',
      song.transpose !== 0 ? `Transpose ${formatSigned(song.transpose)}` : '',
    ],
    Array.filter(Str.isNonEmpty),
  )

  return Array.match(parts, {
    onEmpty: () => h.empty,
    onNonEmpty: items =>
      h.p([h.Class('text-sm text-stone-500')], [Array.join(items, ' · ')]),
  })
}

const controlsView = (h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-wrap gap-2')],
    [
      Button.view(
        {
          onClick: Message.ClickedTransposeDown(),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.secondaryButton)],
              ['Transpose down'],
            ),
        },
        h,
      ),
      Button.view(
        {
          onClick: Message.ClickedTransposeUp(),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.secondaryButton)],
              ['Transpose up'],
            ),
        },
        h,
      ),
      Button.view(
        {
          onClick: Message.ClickedCapoDown(),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.secondaryButton)],
              ['Capo down'],
            ),
        },
        h,
      ),
      Button.view(
        {
          onClick: Message.ClickedCapoUp(),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.secondaryButton)],
              ['Capo up'],
            ),
        },
        h,
      ),
      Button.view(
        {
          onClick: Message.ClickedCopyChart(),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.primaryButton)],
              ['Copy chart'],
            ),
        },
        h,
      ),
    ],
  )

export const view = Submodel.defineView<Model, Message>((model, h) =>
  h.main(
    [h.Class('flex flex-col gap-8')],
    [
      h.header(
        [h.Class('flex flex-col gap-4')],
        [
          h.div(
            [h.Class('flex flex-wrap items-center justify-between gap-3')],
            [
              h.h1(
                [h.Class(className.heading)],
                [Song.displayTitle(model.song)],
              ),
              h.div(
                [h.Class('flex flex-wrap gap-2')],
                [
                  h.a(
                    [h.Href(homeRouter()), h.Class(className.quietButton)],
                    ['Library'],
                  ),
                  h.a(
                    [
                      h.Href(songEditRouter({ songId: model.song.id })),
                      h.Class(className.secondaryButton),
                    ],
                    ['Edit'],
                  ),
                ],
              ),
            ],
          ),
          metaLineView(model.song, h),
          controlsView(h),
        ],
      ),
      h.pre(
        [
          h.Class(
            'overflow-x-auto whitespace-pre-wrap rounded-lg border border-stone-200 bg-white p-6 font-mono text-base leading-7 text-stone-900',
          ),
          h.AriaLabel('Chord chart'),
        ],
        [Song.toChartText(model.song)],
      ),
    ],
  ),
)
