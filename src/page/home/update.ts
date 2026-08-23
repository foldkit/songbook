import { Match as M, Option } from 'effect'
import { Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import { Message, OutMessage } from './message'
import { Model } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage>

const readDeleteDialog = (model: Model): Option.Option<Dialog.Model> =>
  Option.some(model.deleteDialog)

const writeDeleteDialog = (
  model: Model,
  nextDeleteDialog: Dialog.Model,
): Model => evo(model, { deleteDialog: () => nextDeleteDialog })

const toGotDeleteDialogMessage = (message: Dialog.Message): Message =>
  Message.GotDeleteDialogMessage({ message })

const foldDeleteDialogOutMessage = M.type<Dialog.OutMessage>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    Opened: () => model => [model, []],
    Closed: () => model => [
      evo(model, { maybePendingDeleteSongId: () => Option.none() }),
      [],
    ],
  }),
)

const foldDeleteDialog = Update.foldChild({
  update: Dialog.update,
  read: readDeleteDialog,
  write: writeDeleteDialog,
  toParentMessage: toGotDeleteDialogMessage,
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldDeleteDialogOutMessage,
})

const foldDeleteDialogOpen = Update.foldChildStep({
  update: Dialog.open,
  read: readDeleteDialog,
  write: writeDeleteDialog,
  toParentMessage: toGotDeleteDialogMessage,
  foldOutMessage: foldDeleteDialogOutMessage,
})

const foldDeleteDialogClose = Update.foldChildStep({
  update: Dialog.close,
  read: readDeleteDialog,
  write: writeDeleteDialog,
  toParentMessage: toGotDeleteDialogMessage,
  foldOutMessage: foldDeleteDialogOutMessage,
})

export const update = (model: Model, message: Message): UpdateReturn =>
  Message.match<UpdateReturn>(message, {
    UpdatedSearchQuery: ({ value }) => [
      evo(model, { searchQuery: () => value }),
      [],
      Option.none(),
    ],

    ClickedNewSong: () => [
      model,
      [],
      Option.some(OutMessage.RequestedNewSong()),
    ],

    ClickedDeleteSong: ({ songId }) => {
      const [nextModel, commands] = foldDeleteDialogOpen(
        evo(model, { maybePendingDeleteSongId: () => Option.some(songId) }),
      )
      return [nextModel, commands, Option.none()]
    },

    ClickedConfirmDelete: () => {
      const maybeOut = Option.map(model.maybePendingDeleteSongId, songId =>
        OutMessage.ConfirmedDeleteSong({ songId }),
      )
      const [nextModel, commands] = foldDeleteDialogClose(
        evo(model, { maybePendingDeleteSongId: () => Option.none() }),
      )
      return [nextModel, commands, maybeOut]
    },

    GotDeleteDialogMessage: ({ message }) => foldDeleteDialog(model, message),
  })
