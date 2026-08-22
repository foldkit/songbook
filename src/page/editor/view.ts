import clsx from 'clsx'
import { Array, Option } from 'effect'
import { Submodel } from 'foldkit'
import { type Html, type HtmlBuilder, childAttributes } from 'foldkit/html'

import { Button, Dialog, DragAndDrop, Menu } from '@foldkit/ui'

import {
  ARTIST_INPUT_ID,
  KEY_INPUT_ID,
  LYRICS_TEXTAREA_ID,
  SECTIONS_CONTAINER_ID,
  TITLE_INPUT_ID,
} from '../../constant'
import { Section, Song } from '../../domain'
import { homeRouter, songPlayRouter } from '../../route'
import * as className from '../../view/className'
import { labeledInput, labeledTextarea } from '../../view/field'
import {
  isEditingSection,
  lineView,
  lyricsDraft,
  maybePlacingChord,
} from './lineView'
import { Message } from './message'
import { Model } from './model'

const AddSectionMenu = Menu.create<Section.SectionKind>()

const MENU_ANCHOR = {
  placement: 'bottom-start' as const,
  gap: 4,
  padding: 8,
}

const metadataView = (song: Song.Song, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('grid gap-4 sm:grid-cols-3')],
    [
      labeledInput(
        {
          id: TITLE_INPUT_ID,
          labelText: 'Title',
          value: song.title,
          onInput: value => Message.UpdatedTitle({ value }),
          placeholder: 'Untitled',
        },
        h,
      ),
      labeledInput(
        {
          id: ARTIST_INPUT_ID,
          labelText: 'Artist',
          value: song.artist,
          onInput: value => Message.UpdatedArtist({ value }),
        },
        h,
      ),
      labeledInput(
        {
          id: KEY_INPUT_ID,
          labelText: 'Original key',
          value: Option.getOrElse(song.maybeOriginalKey, () => ''),
          onInput: value => Message.UpdatedOriginalKey({ value }),
          placeholder: 'G',
        },
        h,
      ),
    ],
  )

const lyricsEditorView = (draft: string, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('flex flex-col gap-3')],
    [
      labeledTextarea(
        {
          id: LYRICS_TEXTAREA_ID,
          labelText: 'Lyrics',
          value: draft,
          onInput: value => Message.UpdatedLyricsDraft({ value }),
          rows: 8,
          placeholder: 'Paste lyrics, one line per row',
        },
        h,
      ),
      h.div(
        [h.Class('flex gap-2')],
        [
          Button.view(
            {
              onClick: Message.ClickedSaveLyrics(),
              toView: attributes =>
                h.button(
                  [...attributes.button, h.Class(className.primaryButton)],
                  ['Save lyrics'],
                ),
            },
            h,
          ),
          Button.view(
            {
              onClick: Message.ClickedCancelLyrics(),
              toView: attributes =>
                h.button(
                  [...attributes.button, h.Class(className.secondaryButton)],
                  ['Cancel'],
                ),
            },
            h,
          ),
        ],
      ),
    ],
  )

const emptySectionBodyView = (h: HtmlBuilder<Message>): Html =>
  h.p(
    [h.Class('text-sm text-stone-500')],
    ['No lyrics yet. Edit lyrics and paste while you listen.'],
  )

const chordLinesView = (
  section: Section.Section,
  model: Model,
  h: HtmlBuilder<Message>,
): Html =>
  Array.match(section.lines, {
    onEmpty: () => emptySectionBodyView(h),
    onNonEmpty: lines =>
      h.div(
        [h.Class('flex flex-col gap-3')],
        Array.map(lines, line =>
          h.keyed('div')(
            line.id,
            [],
            [lineView(line, maybePlacingChord(model), h)],
          ),
        ),
      ),
  })

const sectionBodyView = (
  section: Section.Section,
  model: Model,
  h: HtmlBuilder<Message>,
): Html =>
  isEditingSection(model, section.id)
    ? lyricsEditorView(lyricsDraft(model), h)
    : chordLinesView(section, model, h)

const sectionActionsView = (
  section: Section.Section,
  canRemove: boolean,
  h: HtmlBuilder<Message>,
): Html =>
  h.div(
    [h.Class('flex flex-wrap gap-2')],
    [
      Button.view(
        {
          onClick: Message.ClickedEditLyrics({ sectionId: section.id }),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.secondaryButton)],
              ['Edit lyrics'],
            ),
        },
        h,
      ),
      Button.view(
        {
          onClick: Message.ClickedDuplicateSection({ sectionId: section.id }),
          toView: attributes =>
            h.button(
              [...attributes.button, h.Class(className.quietButton)],
              ['Duplicate'],
            ),
        },
        h,
      ),
      canRemove
        ? Button.view(
            {
              onClick: Message.ClickedRemoveSection({ sectionId: section.id }),
              toView: attributes =>
                h.button(
                  [...attributes.button, h.Class(className.quietButton)],
                  ['Remove'],
                ),
            },
            h,
          )
        : h.empty,
    ],
  )

const sectionView = (
  model: Model,
  section: Section.Section,
  index: number,
  canRemove: boolean,
  h: HtmlBuilder<Message>,
): Html => {
  const isThisSectionDragged = Option.exists(
    DragAndDrop.maybeDraggedItemId(model.sectionDragAndDrop),
    id => id === section.id,
  )
  const isPointerDragged =
    model.sectionDragAndDrop.dragState._tag === 'Dragging' &&
    isThisSectionDragged
  const isKeyboardDragged =
    model.sectionDragAndDrop.dragState._tag === 'KeyboardDragging' &&
    isThisSectionDragged

  return h.keyed('li')(
    section.id,
    [
      h.Class(
        clsx('rounded-lg border bg-white p-4 shadow-sm', {
          'border-dashed border-stone-300 opacity-50': isPointerDragged,
          'border-amber-700': isKeyboardDragged,
          'border-stone-200': !isPointerDragged && !isKeyboardDragged,
        }),
      ),
      ...DragAndDrop.draggable(
        {
          model: model.sectionDragAndDrop,
          toParentMessage: message =>
            Message.GotSectionDragAndDropMessage({ message }),
          itemId: section.id,
          containerId: SECTIONS_CONTAINER_ID,
          index,
        },
        h,
      ),
      ...DragAndDrop.sortable(section.id),
    ],
    [
      h.div(
        [h.Class('mb-3 flex items-center justify-between gap-2')],
        [
          h.h2(
            [h.Class('text-lg font-semibold text-stone-800')],
            [Section.kindLabel(section.kind)],
          ),
          sectionActionsView(section, canRemove, h),
        ],
      ),
      sectionBodyView(section, model, h),
    ],
  )
}

const addSectionMenuView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.div(
    [h.Class('relative')],
    [
      h.submodel({
        slotId: model.addSectionMenu.id,
        model: model.addSectionMenu,
        view: AddSectionMenu.view,
        viewInputs: {
          anchor: MENU_ANCHOR,
          items: Section.SECTION_KINDS,
          itemToConfig: (kind: Section.SectionKind) => ({
            className:
              'px-3 py-2 text-sm text-stone-800 cursor-pointer data-[active]:bg-stone-100',
            content: h.span([], [Section.kindLabel(kind)]),
          }),
          buttonContent: h.span([], ['Add section']),
          buttonAttributes: childAttributes([
            h.Class(className.secondaryButton),
          ]),
          itemsAttributes: childAttributes([
            h.Class(
              'w-44 rounded-md border border-stone-200 bg-white shadow-lg overflow-hidden z-10 outline-none',
            ),
          ]),
          attributes: childAttributes([h.Class('relative inline-block')]),
        },
        toParentMessage: message =>
          Message.GotAddSectionMenuMessage({ message }),
      }),
    ],
  )

const deleteSectionDialogView = (model: Model, h: HtmlBuilder<Message>): Html =>
  h.submodel({
    slotId: model.deleteSectionDialog.id,
    model: model.deleteSectionDialog,
    view: Dialog.view,
    viewInputs: {
      toView: render =>
        h.dialog(
          [
            ...render.dialog,
            h.Class('bg-transparent p-0 open:flex items-center justify-center'),
          ],
          render.isVisible
            ? [
                h.div([
                  ...render.backdrop,
                  h.Class('fixed inset-0 bg-stone-900/40'),
                ]),
                h.div(
                  [
                    ...render.panel,
                    h.Class(
                      'relative z-10 mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl',
                    ),
                  ],
                  [
                    h.h2(
                      [
                        ...render.title,
                        h.Class('text-lg font-semibold text-stone-900'),
                      ],
                      ['Remove this section?'],
                    ),
                    h.p(
                      [
                        ...render.description,
                        h.Class('mt-2 text-sm text-stone-600'),
                      ],
                      ['Lyrics and chords in the section will be deleted.'],
                    ),
                    h.div(
                      [h.Class('mt-6 flex justify-end gap-2')],
                      [
                        Button.view(
                          {
                            toView: attributes =>
                              h.button(
                                [
                                  ...attributes.button,
                                  ...render.closeButton,
                                  h.Class(className.secondaryButton),
                                ],
                                ['Cancel'],
                              ),
                          },
                          h,
                        ),
                        Button.view(
                          {
                            onClick: Message.ClickedConfirmRemoveSection(),
                            toView: attributes =>
                              h.button(
                                [
                                  ...attributes.button,
                                  ...render.initialFocus,
                                  h.Class(className.dangerButton),
                                ],
                                ['Remove section'],
                              ),
                          },
                          h,
                        ),
                      ],
                    ),
                  ],
                ),
              ]
            : [],
        ),
    },
    toParentMessage: message =>
      Message.GotDeleteSectionDialogMessage({ message }),
  })

const ghostSectionView = (model: Model, h: HtmlBuilder<Message>): Html =>
  Option.match(
    Option.flatMap(
      DragAndDrop.ghostStyle(model.sectionDragAndDrop),
      ghostStyle =>
        Option.map(
          Option.flatMap(
            DragAndDrop.maybeDraggedItemId(model.sectionDragAndDrop),
            sectionId => Song.findSection(model.song, sectionId),
          ),
          section => ({ ghostStyle, section }),
        ),
    ),
    {
      onNone: () => h.empty,
      onSome: ({ ghostStyle, section }) =>
        h.div(
          [h.Style(ghostStyle), h.Class('w-80'), h.AriaHidden(true)],
          [
            h.div(
              [
                h.Class(
                  'rounded-lg border border-stone-200 bg-white p-4 shadow-lg',
                ),
              ],
              [Section.kindLabel(section.kind)],
            ),
          ],
        ),
    },
  )

export const view = Submodel.defineView<Model, Message>((model, h) => {
  const canRemove = Array.match(Array.drop(model.song.sections, 1), {
    onEmpty: () => false,
    onNonEmpty: () => true,
  })

  return h.main(
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
                      h.Href(songPlayRouter({ songId: model.song.id })),
                      h.Class(className.secondaryButton),
                    ],
                    ['Play'],
                  ),
                ],
              ),
            ],
          ),
          metadataView(model.song, h),
        ],
      ),
      h.div(
        [h.Class('flex items-center justify-between')],
        [
          h.h2([h.Class('text-sm font-medium text-stone-600')], ['Sections']),
          addSectionMenuView(model, h),
        ],
      ),
      h.ul(
        [
          h.Class('flex flex-col gap-4'),
          ...DragAndDrop.droppable(SECTIONS_CONTAINER_ID, 'Sections'),
        ],
        Array.map(model.song.sections, (section, index) =>
          sectionView(model, section, index, canRemove, h),
        ),
      ),
      ghostSectionView(model, h),
      h.div(
        [h.Class('sr-only'), h.AriaLive('assertive')],
        [model.announcement],
      ),
      deleteSectionDialogView(model, h),
    ],
  )
})
