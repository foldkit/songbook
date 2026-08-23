import clsx from 'clsx'
import { Match as M, Option } from 'effect'
import type { Document, Html, HtmlBuilder } from 'foldkit/html'

import { DragAndDrop } from '@foldkit/ui'

import { Song } from './domain'
import { Message } from './message'
import { Model } from './model'
import { notFoundView } from './notFoundView'
import { Editor, Home, Play } from './page'
import { homeRouter } from './route'
import { Toast } from './toast'
import * as className from './view/className'
import { themeSelector } from './view/themeSelector'

const descriptionView = (
  maybeDescription: Option.Option<string>,
  h: HtmlBuilder<Message>,
): Html =>
  Option.match(maybeDescription, {
    onNone: () => h.empty,
    onSome: description =>
      h.p(
        [h.Class('mt-1 text-sm text-stone-600 dark:text-stone-400')],
        [description],
      ),
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
              'pointer-events-auto max-w-sm rounded-md border border-stone-200 bg-white px-4 py-3 shadow-lg dark:border-stone-700 dark:bg-stone-900',
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
                      [
                        h.Class(
                          'font-medium text-stone-900 dark:text-stone-100',
                        ),
                      ],
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
    toParentMessage: message => Message.GotToastMessage({ message }),
  })

const homePageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'home',
    model: model.home,
    view: Home.view,
    viewInputs: { songs: model.songs },
    toParentMessage: message => Message.GotHomeMessage({ message }),
  })

const editorPageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'editor',
    model: model.editor,
    view: Editor.view,
    toParentMessage: message => Message.GotEditorMessage({ message }),
  })

const playPageView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: 'play',
    model: model.play,
    view: Play.view,
    toParentMessage: message => Message.GotPlayMessage({ message }),
  })

const missingSongView = (h: HtmlBuilder<Message>): Html =>
  h.main(
    [h.Class('flex flex-col items-center gap-4 py-16 text-center')],
    [
      h.h1([h.Class(className.heading)], ['Song not found']),
      h.p(
        [h.Class('text-stone-600 dark:text-stone-400')],
        ['This chart is not in your library.'],
      ),
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
    [
      h.Class(
        clsx(className.pageShell, {
          'is-dragging': DragAndDrop.isDragging(
            model.editor.sectionDragAndDrop,
          ),
        }),
      ),
    ],
    [
      h.div(
        [h.Class(className.pageInner)],
        [
          h.div(
            [h.Class('mb-6 flex justify-end')],
            [themeSelector(model.maybeThemePreference, h)],
          ),
          routeBodyView(model, h),
        ],
      ),
      toastView(model, h),
    ],
  ),
})
