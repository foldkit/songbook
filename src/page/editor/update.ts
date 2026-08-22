import { Array, Match as M, Option, String as Str, pipe } from 'effect'
import { Command, Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { Dialog, DragAndDrop, Menu } from '@foldkit/ui'

import { Line, Section, Song } from '../../domain'
import { FocusChordDraft, GenerateEditorIds } from './command'
import {
  DuplicateSectionRequest,
  type IdRequest,
  Message,
  NewMarkRequest,
  NewSectionRequest,
  OutMessage,
  ReplaceLyricsRequest,
} from './message'
import { EditingLyrics, Model, PlacingChord, Viewing } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage>
const withUpdateReturn = M.withReturnType<UpdateReturn>()

const AddSectionMenu = Menu.create<Section.SectionKind>()

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

const foldAddSectionMenuOutMessage = (
  outMessage: Menu.OutMessage<Section.SectionKind>,
): Update.Step<Model, Message> =>
  M.value(outMessage).pipe(
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
  toParentMessage: message => Message.GotAddSectionMenuMessage({ message }),
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldAddSectionMenuOutMessage,
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
    toParentMessage: message =>
      Message.GotSectionDragAndDropMessage({ message }),
    toParentOutMessage: () => Option.none(),
    foldOutMessage: foldDragAndDropOutMessage(previousModel),
  })

const foldDeleteSectionDialogOutMessage = (
  outMessage: Dialog.OutMessage,
): Update.Step<Model, Message> =>
  Dialog.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    Opened: () => model => [model, []],
    Closed: () => model => [
      evo(model, { maybePendingDeleteSectionId: () => Option.none() }),
      [],
    ],
  })

const foldDeleteSectionDialog = Update.foldChild({
  update: Dialog.update,
  read: (model: Model) => Option.some(model.deleteSectionDialog),
  write: (model, nextDeleteSectionDialog) =>
    evo(model, { deleteSectionDialog: () => nextDeleteSectionDialog }),
  toParentMessage: message =>
    Message.GotDeleteSectionDialogMessage({ message }),
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldDeleteSectionDialogOutMessage,
})

const commitPlacing =
  (model: Model) =>
  (placing: PlacingChord): UpdateReturn => {
    const name = pipe(placing.draft, Str.trim)

    if (pipe(name, Str.isEmpty)) {
      return Option.match(placing.maybeMarkId, {
        onNone: () => [
          evo(model, { mode: () => Viewing() }),
          [],
          Option.none(),
        ],
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
        const song = Song.updateLine(model.song, placing.lineId, line =>
          Line.updateMarkName(line, markId, name),
        )
        return emitSong(model, song)
      },
      onNone: () => [
        model,
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

const whenPlacingChord =
  (model: Model, onPlacing: (placing: PlacingChord) => UpdateReturn) =>
  (): UpdateReturn =>
    M.value(model.mode).pipe(
      withUpdateReturn,
      M.tag('PlacingChord', onPlacing),
      M.orElse(() => [model, [], Option.none()]),
    )

const handleClickedSaveLyrics = (model: Model): UpdateReturn =>
  M.value(model.mode).pipe(
    withUpdateReturn,
    M.tag('EditingLyrics', ({ sectionId, draft }) =>
      Option.match(Song.findSection(model.song, sectionId), {
        onNone: () => [
          evo(model, { mode: () => Viewing() }),
          [],
          Option.none(),
        ],
        onSome: section => {
          const count = Section.countUnpreservedLines(section, draft)
          if (count === 0) {
            const song = Song.updateSection(model.song, sectionId, current =>
              Section.replaceLyrics(current, draft, []),
            )
            return emitSong(model, song)
          }

          return [
            model,
            [
              GenerateEditorIds({
                count,
                request: ReplaceLyricsRequest({ sectionId, draft }),
              }),
            ],
            Option.none(),
          ]
        },
      }),
    ),
    M.orElse(() => [model, [], Option.none()]),
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
        ReplaceLyrics: ({ sectionId, draft }) => {
          const song = Song.updateSection(model.song, sectionId, section =>
            Section.replaceLyrics(section, draft, ids),
          )
          return emitSong(model, song)
        },
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
        onSome: section => [
          evo(model, {
            mode: () =>
              EditingLyrics({
                sectionId,
                draft: Section.lyricsText(section),
              }),
          }),
          [],
          Option.none(),
        ],
      }),

    UpdatedLyricsDraft: ({ value }) =>
      M.value(model.mode).pipe(
        withUpdateReturn,
        M.tag('EditingLyrics', editing => [
          evo(model, {
            mode: () => evo(editing, { draft: () => value }),
          }),
          [],
          Option.none(),
        ]),
        M.orElse(() => [model, [], Option.none()]),
      ),

    ClickedSaveLyrics: () => handleClickedSaveLyrics(model),

    ClickedCancelLyrics: () => [
      evo(model, { mode: () => Viewing() }),
      [],
      Option.none(),
    ],

    ClickedWord: ({ lineId, at }) => {
      const maybeMark = pipe(
        Song.findLine(model.song, lineId),
        Option.flatMap(line => Line.markAt(line, at)),
      )

      return [
        evo(model, {
          mode: () =>
            PlacingChord({
              lineId,
              at,
              draft: Option.match(maybeMark, {
                onNone: () => '',
                onSome: ({ name }) => name,
              }),
              maybeMarkId: Option.map(maybeMark, ({ id }) => id),
            }),
        }),
        [FocusChordDraft()],
        Option.none(),
      ]
    },

    UpdatedChordDraft: ({ value }) =>
      M.value(model.mode).pipe(
        withUpdateReturn,
        M.tag('PlacingChord', placing => [
          evo(model, {
            mode: () => evo(placing, { draft: () => value }),
          }),
          [],
          Option.none(),
        ]),
        M.orElse(() => [model, [], Option.none()]),
      ),

    BlurredChordDraft: () => whenPlacingChord(model, commitPlacing(model))(),

    PressedCommitChord: () => whenPlacingChord(model, commitPlacing(model))(),

    PressedCancelChord: () => [
      evo(model, { mode: () => Viewing() }),
      [],
      Option.none(),
    ],

    ClickedRemoveSection: ({ sectionId }) =>
      Array.match(model.song.sections, {
        onEmpty: () => [model, [], Option.none()],
        onNonEmpty: sections =>
          Array.match(Array.drop(sections, 1), {
            onEmpty: () => [model, [], Option.none()],
            onNonEmpty: () => {
              const [nextDialog, dialogCommands] = Dialog.open(
                model.deleteSectionDialog,
              )
              return [
                evo(model, {
                  deleteSectionDialog: () => nextDialog,
                  maybePendingDeleteSectionId: () => Option.some(sectionId),
                }),
                Command.mapMessages(dialogCommands, dialogMessage =>
                  Message.GotDeleteSectionDialogMessage({
                    message: dialogMessage,
                  }),
                ),
                Option.none(),
              ]
            },
          }),
      }),

    ClickedConfirmRemoveSection: () => {
      const [nextDialog, dialogCommands] = Dialog.close(
        model.deleteSectionDialog,
      )
      const mapped = Command.mapMessages(dialogCommands, dialogMessage =>
        Message.GotDeleteSectionDialogMessage({ message: dialogMessage }),
      )

      return Option.match(model.maybePendingDeleteSectionId, {
        onNone: () => [
          evo(model, { deleteSectionDialog: () => nextDialog }),
          mapped,
          Option.none(),
        ],
        onSome: sectionId => {
          const song = Song.removeSection(model.song, sectionId)
          return [
            evo(model, {
              song: () => song,
              deleteSectionDialog: () => nextDialog,
              maybePendingDeleteSectionId: () => Option.none(),
            }),
            mapped,
            Option.some(OutMessage.UpdatedSong({ song })),
          ]
        },
      })
    },

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

    CompletedFocusChordDraft: () => [model, [], Option.none()],

    GotAddSectionMenuMessage: ({ message }) => {
      const [nextModel, commands] = foldAddSectionMenu(model, message)
      return [nextModel, commands, Option.none()]
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

    GotDeleteSectionDialogMessage: ({ message }) => {
      const [nextModel, commands] = foldDeleteSectionDialog(model, message)
      return [nextModel, commands, Option.none()]
    },
  })
