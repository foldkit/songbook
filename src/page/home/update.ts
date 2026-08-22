import { Match as M, Option } from 'effect'
import { Command, Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { Dialog } from '@foldkit/ui'

import * as Message from './message'
import { Model } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<
  Model,
  Message.Message,
  Message.OutMessage
>
const withUpdateReturn = M.withReturnType<UpdateReturn>()

const foldDeleteDialogOutMessage = (
  outMessage: Dialog.OutMessage,
): Update.Step<Model, Message.Message> =>
  M.value(outMessage).pipe(
    M.withReturnType<Update.Step<Model, Message.Message>>(),
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
  read: (model: Model) => Option.some(model.deleteDialog),
  write: (model, nextDeleteDialog) =>
    evo(model, { deleteDialog: () => nextDeleteDialog }),
  toParentMessage: message => Message.GotDeleteDialogMessage({ message }),
  toParentOutMessage: () => Option.none(),
  foldOutMessage: foldDeleteDialogOutMessage,
})

export const update = (model: Model, message: Message.Message): UpdateReturn =>
  M.value(message).pipe(
    withUpdateReturn,
    M.tagsExhaustive({
      UpdatedSearchQuery: ({ value }) => [
        evo(model, { searchQuery: () => value }),
        [],
        Option.none(),
      ],

      ClickedNewSong: () => [
        model,
        [],
        Option.some(Message.RequestedNewSong()),
      ],

      ClickedDeleteSong: ({ songId }) => {
        const [nextDialog, dialogCommands] = Dialog.open(model.deleteDialog)
        return [
          evo(model, {
            deleteDialog: () => nextDialog,
            maybePendingDeleteSongId: () => Option.some(songId),
          }),
          Command.mapMessages(dialogCommands, dialogMessage =>
            Message.GotDeleteDialogMessage({ message: dialogMessage }),
          ),
          Option.none(),
        ]
      },

      ClickedConfirmDelete: () => {
        const [nextDialog, dialogCommands] = Dialog.close(model.deleteDialog)
        const maybeOut = Option.map(model.maybePendingDeleteSongId, songId =>
          Message.ConfirmedDeleteSong({ songId }),
        )
        return [
          evo(model, {
            deleteDialog: () => nextDialog,
            maybePendingDeleteSongId: () => Option.none(),
          }),
          Command.mapMessages(dialogCommands, dialogMessage =>
            Message.GotDeleteDialogMessage({ message: dialogMessage }),
          ),
          maybeOut,
        ]
      },

      GotDeleteDialogMessage: ({ message }) => {
        const [nextModel, commands] = foldDeleteDialog(model, message)
        return [nextModel, commands, Option.none()]
      },
    }),
  )
