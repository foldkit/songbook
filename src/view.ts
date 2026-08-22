import { Match as M, Option } from 'effect'
import type { Document, Html, HtmlBuilder } from 'foldkit/html'

import { Song } from './domain'
import {
  GotEditorMessage,
  GotHomeMessage,
  GotPlayMessage,
  GotToastMessage,
  type Message,
} from './message'
import { Model } from './model'
import { notFoundView } from './notFoundView'
import { Editor, Home, Play } from './page'
import { homeRouter } from './route'
import { Toast } from './toast'
import * as className from './view/className'

const descriptionView = (
  maybeDescription: Option.Option<string>,
  h: HtmlBuilder<Message>,
): Html =>
  Option.match(maybeDescription, {
    onNone: () => h.empty,
    onSome: description =>
      h.p([h.Class('mt-1 text-sm text-stone-600')], [description]),
  })

const toastView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'app-toast',
    model: model.toast,
    view: Toast.view,
    viewInputs: {
      position: 'BottomRight',
      ariaLabel: 'Notifications',
      entryToView: (entry, handlers) =>
        h.div(
          [
            h.Class(
              'pointer-events-auto max-w-sm rounded-md border border-stone-200 bg-white px-4 py-3 shadow-lg',
            ),
          ],
          [
            h.div(
              [h.Class('flex items-start justify-between gap-3')],
              [
                h.div(
                  [],
                  [
                    h.p(
                      [h.Class('font-medium text-stone-900')],
                      [entry.payload.title],
                    ),
                    descriptionView(entry.payload.maybeDescription, h),
                  ],
                ),
                h.button(
                  [
                    ...handlers.dismiss,
                    h.Class(className.quietButton),
                    h.AriaLabel('Dismiss notification'),
                  ],
                  ['Dismiss'],
                ),
              ],
            ),
          ],
        ),
    },
    toParentMessage: message => GotToastMessage({ message }),
  })

const homePageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'home',
    model: model.home,
    view: Home.view,
    viewInputs: { songs: model.songs },
    toParentMessage: message => GotHomeMessage({ message }),
  })

const editorPageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'editor',
    model: model.editor,
    view: Editor.view,
    toParentMessage: message => GotEditorMessage({ message }),
  })

const playPageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'play',
    model: model.play,
    view: Play.view,
    toParentMessage: message => GotPlayMessage({ message }),
  })

const missingSongView = (h: HtmlBuilder<Message>): Html =>
  h.main(
    [h.Class('flex flex-col items-center gap-4 py-16 text-center')],
    [
      h.h1([h.Class(className.heading)], ['Song not found']),
      h.p([h.Class('text-stone-600')], ['This chart is not in your library.']),
      h.a(
        [h.Href(homeRouter()), h.Class(className.secondaryButton)],
        ['Back to library'],
      ),
    ],
  )

const songPageView = (
  model: Model,
  songId: string,
  pageView: (model: Model, h: HtmlBuilder<Message>) => Html,
  h: HtmlBuilder<Message>,
): Html =>
  Option.match(Song.findById(model.songs, songId), {
    onNone: () => missingSongView(h),
    onSome: () => pageView(model, h),
  })

const documentTitle = (model: Model): string =>
  M.value(model.route).pipe(
    M.tagsExhaustive({
      Home: () => 'Songbook',
      SongEdit: ({ songId }) =>
        Option.match(Song.findById(model.songs, songId), {
          onNone: () => 'Song not found · Songbook',
          onSome: song => `${Song.displayTitle(song)} · Edit`,
        }),
      SongPlay: ({ songId }) =>
        Option.match(Song.findById(model.songs, songId), {
          onNone: () => 'Song not found · Songbook',
          onSome: song => `${Song.displayTitle(song)} · Play`,
        }),
      NotFound: () => 'Not found · Songbook',
    }),
  )

const routeBodyView = (model: Model, h: HtmlBuilder<Message>): Html =>
  M.value(model.route).pipe(
    M.tagsExhaustive({
      Home: () => homePageView(model, h),
      SongEdit: ({ songId }) => songPageView(model, songId, editorPageView, h),
      SongPlay: ({ songId }) => songPageView(model, songId, playPageView, h),
      NotFound: ({ path }) => notFoundView(path, h),
    }),
  )

export const view = (model: Model, h: HtmlBuilder<Message>): Document => ({
  title: documentTitle(model),
  body: h.div(
    [h.Class(className.pageShell)],
    [
      h.div([h.Class(className.pageInner)], [routeBodyView(model, h)]),
      toastView(model, h),
    ],
  ),
})
