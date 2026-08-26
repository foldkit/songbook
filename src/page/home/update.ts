import { Match as M, Option, pipe } from 'effect'
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
    Opened: () => model => ({ model }),
    Closed: () => model => ({
      model: evo(model, { maybePendingDeleteSongId: () => Option.none() }),
    }),
  }),
)

const foldDeleteDialog = Update.foldChild({
  update: Dialog.update,
  read: readDeleteDialog,
  write: writeDeleteDialog,
  toParentMessage: toGotDeleteDialogMessage,
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

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    UpdatedSearchQuery: ({ value }) => ({
      model: evo(model, { searchQuery: () => value }),
    }),

    ClickedNewSong: () => ({
      model,
      outMessage: OutMessage.RequestedNewSong(),
    }),

    ClickedDeleteSong: ({ songId }) =>
      foldDeleteDialogOpen(
        evo(model, { maybePendingDeleteSongId: () => Option.some(songId) }),
      ),

    ClickedConfirmDelete: () => {
      const dialogClose = foldDeleteDialogClose(
        evo(model, { maybePendingDeleteSongId: () => Option.none() }),
      )
      return Option.match(model.maybePendingDeleteSongId, {
        onNone: () => dialogClose,
        onSome: songId =>
          pipe(
            dialogClose,
            Update.withOutMessage(OutMessage.ConfirmedDeleteSong({ songId })),
          ),
      })
    },

    GotDeleteDialogMessage: ({ message }) => foldDeleteDialog(model, message),
  })
