import { Array, Match as M, Option, String as Str, pipe } from 'effect'
import { Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { Dialog, DragAndDrop, Menu } from '@foldkit/ui'

import { CHORD_MENU_CLEAR, CHORD_MENU_EMPTY } from '../../constant'
import { Line, Section, Song } from '../../domain'
import { GenerateEditorIds } from './command'
import {
  DuplicateSectionRequest,
  type IdRequest,
  Message,
  NewMarkRequest,
  NewSectionRequest,
  OutMessage,
} from './message'
import { EditingLyrics, Model, PlacingChord, Viewing } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage>
const withUpdateReturn = M.withReturnType<UpdateReturn>()

const AddSectionMenu = Menu.create<Section.SectionKind>()
const ChordMenu = Menu.create<string>()

const emitSong = (model: Model, song: Song.Song): UpdateReturn => [
  evo(model, { song: () => song, mode: () => Viewing() }),
  [],
  Option.some(OutMessage.UpdatedSong({ song })),
]

const emitSongKeepMode = (model: Model, song: Song.Song): UpdateReturn => [
  evo(model, { song: () => song }),
  [],
  Option.some(OutMessage.UpdatedSong({ song })),
]

const foldAddSectionMenuOutMessage = M.type<
  Menu.OutMessage<Section.SectionKind>
>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    Selected:
      ({ value }) =>
      model => [
        model,
        [
          GenerateEditorIds({
            count: 1,
            request: NewSectionRequest({ kind: value }),
          }),
        ],
      ],
  }),
)

const foldAddSectionMenu = Update.foldChild({
  update: AddSectionMenu.update,
  read: (model: Model) => Option.some(model.addSectionMenu),
  write: (model, nextAddSectionMenu) =>
    evo(model, { addSectionMenu: () => nextAddSectionMenu }),
  toParentMessage: (message: Menu.Message): Message =>
    Message.GotAddSectionMenuMessage({ message }),
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldAddSectionMenuOutMessage,
})

const readChordMenu = (model: Model): Option.Option<Menu.Model> =>
  Option.some(model.chordMenu)

const writeChordMenu = (model: Model, nextChordMenu: Menu.Model): Model =>
  evo(model, { chordMenu: () => nextChordMenu })

const toGotChordMenuMessage = (message: Menu.Message): Message =>
  Message.GotChordMenuMessage({ message })

const foldChordMenuOutMessage = M.type<Menu.OutMessage<string>>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    Selected: () => model => [model, []],
  }),
)

const foldChordMenu = Update.foldChild({
  update: ChordMenu.update,
  read: readChordMenu,
  write: writeChordMenu,
  toParentMessage: toGotChordMenuMessage,
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldChordMenuOutMessage,
})

const foldChordMenuOpen = Update.foldChildStep({
  update: ChordMenu.open,
  read: readChordMenu,
  write: writeChordMenu,
  toParentMessage: toGotChordMenuMessage,
  foldOutMessage: foldChordMenuOutMessage,
})

const foldChordMenuClose = Update.foldChildStep({
  update: ChordMenu.close,
  read: readChordMenu,
  write: writeChordMenu,
  toParentMessage: toGotChordMenuMessage,
  foldOutMessage: foldChordMenuOutMessage,
})

const foldDragAndDropOutMessage =
  (previousModel: Model) =>
  (outMessage: DragAndDrop.OutMessage): Update.Step<Model, Message> =>
    DragAndDrop.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
      Reordered:
        ({ itemId, toIndex }) =>
        model => {
          const song = Song.reorderSections(previousModel.song, itemId, toIndex)
          const kind = Option.match(Song.findSection(song, itemId), {
            onNone: () => 'Section',
            onSome: section => Section.kindLabel(section.kind),
          })
          return [
            evo(model, {
              song: () => song,
              announcement: () =>
                `${kind} moved to position ${String(toIndex + 1)}.`,
            }),
            [],
          ]
        },
      Cancelled: () => model => [
        evo(model, {
          announcement: () => 'Section move cancelled.',
        }),
        [],
      ],
    })

const foldSectionDragAndDrop = (previousModel: Model) =>
  Update.foldChild({
    update: DragAndDrop.update,
    read: (model: Model) => Option.some(model.sectionDragAndDrop),
    write: (model, nextSectionDragAndDrop) =>
      evo(model, { sectionDragAndDrop: () => nextSectionDragAndDrop }),
    toParentMessage: (message: DragAndDrop.Message): Message =>
      Message.GotSectionDragAndDropMessage({ message }),
    toParentOutMessage: () => Option.none(),
    foldOutMessage: foldDragAndDropOutMessage(previousModel),
  })

const readDeleteSectionDialog = (model: Model): Option.Option<Dialog.Model> =>
  Option.some(model.deleteSectionDialog)

const writeDeleteSectionDialog = (
  model: Model,
  nextDeleteSectionDialog: Dialog.Model,
): Model => evo(model, { deleteSectionDialog: () => nextDeleteSectionDialog })

const toGotDeleteSectionDialogMessage = (message: Dialog.Message): Message =>
  Message.GotDeleteSectionDialogMessage({ message })

const foldDeleteSectionDialogOutMessage = M.type<Dialog.OutMessage>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    Opened: () => model => [model, []],
    Closed: () => model => [
      evo(model, { maybePendingDeleteSectionId: () => Option.none() }),
      [],
    ],
  }),
)

const foldDeleteSectionDialog = Update.foldChild({
  update: Dialog.update,
  read: readDeleteSectionDialog,
  write: writeDeleteSectionDialog,
  toParentMessage: toGotDeleteSectionDialogMessage,
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldDeleteSectionDialogOutMessage,
})

const foldDeleteSectionDialogOpen = Update.foldChildStep({
  update: Dialog.open,
  read: readDeleteSectionDialog,
  write: writeDeleteSectionDialog,
  toParentMessage: toGotDeleteSectionDialogMessage,
  foldOutMessage: foldDeleteSectionDialogOutMessage,
})

const foldDeleteSectionDialogClose = Update.foldChildStep({
  update: Dialog.close,
  read: readDeleteSectionDialog,
  write: writeDeleteSectionDialog,
  toParentMessage: toGotDeleteSectionDialogMessage,
  foldOutMessage: foldDeleteSectionDialogOutMessage,
})

const commitChord = (
  model: Model,
  placing: PlacingChord,
  name: string,
): UpdateReturn => {
  if (pipe(name, Str.isEmpty)) {
    return Option.match(placing.maybeMarkId, {
      onNone: () => [evo(model, { mode: () => Viewing() }), [], Option.none()],
      onSome: markId => {
        const song = Song.updateLine(model.song, placing.lineId, line =>
          Line.removeMark(line, markId),
        )
        return emitSong(model, song)
      },
    })
  }

  return Option.match(placing.maybeMarkId, {
    onSome: markId => {
      const song = Song.addChord(
        Song.updateLine(model.song, placing.lineId, line =>
          Line.updateMarkName(line, markId, name),
        ),
        name,
      )
      return emitSong(model, song)
    },
    onNone: () => [
      evo(model, { song: () => Song.addChord(model.song, name) }),
      [
        GenerateEditorIds({
          count: 1,
          request: NewMarkRequest({
            lineId: placing.lineId,
            at: placing.at,
            name,
          }),
        }),
      ],
      Option.none(),
    ],
  })
}

const applyLyricsDraft = (
  model: Model,
  sectionId: string,
  draft: string,
): Song.Song =>
  Song.updateSection(model.song, sectionId, section =>
    Section.replaceLyrics(section, draft),
  )

const handleCompletedGenerateEditorIds =
  (model: Model) =>
  ({
    ids,
    request,
  }: {
    ids: ReadonlyArray<string>
    request: IdRequest
  }): UpdateReturn =>
    M.value(request).pipe(
      withUpdateReturn,
      M.tagsExhaustive({
        NewSection: ({ kind }) =>
          Option.match(Array.head(ids), {
            onNone: () => [model, [], Option.none()],
            onSome: id =>
              emitSongKeepMode(
                model,
                Song.addSection(model.song, Section.empty(id, kind)),
              ),
          }),
        DuplicateSection: ({ sectionId }) =>
          Option.match(Song.findSection(model.song, sectionId), {
            onNone: () => [model, [], Option.none()],
            onSome: section =>
              Option.match(Section.duplicate(section, ids), {
                onNone: () => [model, [], Option.none()],
                onSome: duplicated =>
                  emitSongKeepMode(
                    model,
                    Song.insertSectionAfter(model.song, sectionId, duplicated),
                  ),
              }),
          }),
        NewMark: ({ lineId, at, name }) =>
          Option.match(Array.head(ids), {
            onNone: () => [model, [], Option.none()],
            onSome: id => {
              const song = Song.updateLine(model.song, lineId, line =>
                Line.upsertMark(line, { id, at, name }),
              )
              return emitSong(model, song)
            },
          }),
      }),
    )

export const update = (model: Model, message: Message): UpdateReturn =>
  Message.match<UpdateReturn>(message, {
    UpdatedTitle: ({ value }) =>
      emitSongKeepMode(model, evo(model.song, { title: () => value })),

    UpdatedArtist: ({ value }) =>
      emitSongKeepMode(model, evo(model.song, { artist: () => value })),

    UpdatedOriginalKey: ({ value }) =>
      emitSongKeepMode(
        model,
        evo(model.song, {
          maybeOriginalKey: () =>
            Option.liftPredicate(pipe(value, Str.trim), Str.isNonEmpty),
        }),
      ),

    ClickedEditLyrics: ({ sectionId }) =>
      Option.match(Song.findSection(model.song, sectionId), {
        onNone: () => [model, [], Option.none()],
        onSome: section => {
          const [nextModel, commands] = foldChordMenuClose(
            evo(model, {
              mode: () =>
                EditingLyrics({
                  sectionId,
                  draft: Section.lyricsText(section),
                  backupLines: section.lines,
                }),
            }),
          )
          return [nextModel, commands, Option.none()]
        },
      }),

    UpdatedLyricsDraft: ({ value }) =>
      M.value(model.mode).pipe(
        withUpdateReturn,
        M.tag('EditingLyrics', editing => {
          const song = applyLyricsDraft(model, editing.sectionId, value)
          return [
            evo(model, {
              mode: () => evo(editing, { draft: () => value }),
              song: () => song,
            }),
            [],
            Option.some(OutMessage.UpdatedSong({ song })),
          ]
        }),
        M.orElse(() => [model, [], Option.none()]),
      ),

    ClickedSaveLyrics: () => [
      evo(model, { mode: () => Viewing() }),
      [],
      Option.none(),
    ],

    ClickedCancelLyrics: () =>
      M.value(model.mode).pipe(
        withUpdateReturn,
        M.tag('EditingLyrics', ({ sectionId, backupLines }) => {
          const song = Song.updateSection(model.song, sectionId, section =>
            evo(section, { lines: () => backupLines }),
          )
          return [
            evo(model, { song: () => song, mode: () => Viewing() }),
            [],
            Option.some(OutMessage.UpdatedSong({ song })),
          ]
        }),
        M.orElse(() => [
          evo(model, { mode: () => Viewing() }),
          [],
          Option.none(),
        ]),
      ),

    ClickedWord: ({ lineId, at }) => {
      const maybeMark = pipe(
        Song.findLine(model.song, lineId),
        Option.flatMap(line => Line.markAt(line, at)),
      )
      const [nextModel, commands] = foldChordMenuOpen(
        evo(model, {
          mode: () =>
            PlacingChord({
              lineId,
              at,
              maybeMarkId: Option.map(maybeMark, ({ id }) => id),
            }),
        }),
      )
      return [nextModel, commands, Option.none()]
    },

    UpdatedPaletteDraft: ({ value }) => [
      evo(model, { paletteDraft: () => value }),
      [],
      Option.none(),
    ],

    SubmittedPaletteChord: () => {
      const name = pipe(model.paletteDraft, Str.trim)
      if (pipe(name, Str.isEmpty)) {
        return [evo(model, { paletteDraft: () => '' }), [], Option.none()]
      }

      const nextModel = evo(model, {
        song: () => Song.addChord(model.song, name),
        paletteDraft: () => '',
      })

      return M.value(model.mode).pipe(
        withUpdateReturn,
        M.tag('PlacingChord', placing => commitChord(nextModel, placing, name)),
        M.orElse(() => [
          nextModel,
          [],
          Option.some(OutMessage.UpdatedSong({ song: nextModel.song })),
        ]),
      )
    },

    ClickedRemovePaletteChord: ({ name }) =>
      emitSongKeepMode(model, Song.removeChord(model.song, name)),

    ClickedRemoveSection: ({ sectionId }) =>
      Array.match(model.song.sections, {
        onEmpty: () => [model, [], Option.none()],
        onNonEmpty: sections =>
          Array.match(Array.drop(sections, 1), {
            onEmpty: () => [model, [], Option.none()],
            onNonEmpty: () => {
              const [nextModel, commands] = foldDeleteSectionDialogOpen(
                evo(model, {
                  maybePendingDeleteSectionId: () => Option.some(sectionId),
                }),
              )
              return [nextModel, commands, Option.none()]
            },
          }),
      }),

    ClickedConfirmRemoveSection: () =>
      Option.match(model.maybePendingDeleteSectionId, {
        onNone: () => {
          const [nextModel, commands] = foldDeleteSectionDialogClose(model)
          return [nextModel, commands, Option.none()]
        },
        onSome: sectionId => {
          const song = Song.removeSection(model.song, sectionId)
          const [nextModel, commands] = foldDeleteSectionDialogClose(
            evo(model, {
              song: () => song,
              maybePendingDeleteSectionId: () => Option.none(),
            }),
          )
          return [
            nextModel,
            commands,
            Option.some(OutMessage.UpdatedSong({ song })),
          ]
        },
      }),

    ClickedDuplicateSection: ({ sectionId }) =>
      Option.match(Song.findSection(model.song, sectionId), {
        onNone: () => [model, [], Option.none()],
        onSome: section => [
          model,
          [
            GenerateEditorIds({
              count: Section.duplicateIdCount(section),
              request: DuplicateSectionRequest({ sectionId }),
            }),
          ],
          Option.none(),
        ],
      }),

    CompletedGenerateEditorIds: handleCompletedGenerateEditorIds(model),

    GotAddSectionMenuMessage: ({ message }) =>
      foldAddSectionMenu(model, message),

    GotChordMenuMessage: ({ message }) => {
      const [nextModel, commands] = foldChordMenu(model, message)

      return M.value(message).pipe(
        withUpdateReturn,
        M.tag('SelectedItem', ({ item }) =>
          M.value(nextModel.mode).pipe(
            withUpdateReturn,
            M.tag('PlacingChord', placing => {
              if (item === CHORD_MENU_EMPTY) {
                return [
                  evo(nextModel, { mode: () => Viewing() }),
                  commands,
                  Option.none(),
                ]
              }

              if (item === CHORD_MENU_CLEAR) {
                const [placed, placeCommands, out] = commitChord(
                  nextModel,
                  placing,
                  '',
                )
                return [placed, [...commands, ...placeCommands], out]
              }

              const [placed, placeCommands, out] = commitChord(
                nextModel,
                placing,
                item,
              )
              return [placed, [...commands, ...placeCommands], out]
            }),
            M.orElse(() => [nextModel, commands, Option.none()]),
          ),
        ),
        M.tag('Closed', () =>
          nextModel.mode._tag === 'PlacingChord'
            ? [
                evo(nextModel, { mode: () => Viewing() }),
                commands,
                Option.none(),
              ]
            : [nextModel, commands, Option.none()],
        ),
        M.orElse(() => [nextModel, commands, Option.none()]),
      )
    },

    GotSectionDragAndDropMessage: ({ message }) => {
      const [nextModel, commands] = foldSectionDragAndDrop(model)(
        model,
        message,
      )
      const maybeSongChanged =
        nextModel.song !== model.song
          ? Option.some(OutMessage.UpdatedSong({ song: nextModel.song }))
          : Option.none()
      return [nextModel, commands, maybeSongChanged]
    },

    GotDeleteSectionDialogMessage: ({ message }) =>
      foldDeleteSectionDialog(model, message),
  })
