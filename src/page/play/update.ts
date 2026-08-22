import { Match as M, Number, Option } from 'effect'
import { Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { MAX_CAPO, MAX_TRANSPOSE } from '../../constant'
import { Song } from '../../domain'
import { CopyChart } from './command'
import * as Message from './message'
import { Model } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<
  Model,
  Message.Message,
  Message.OutMessage
>

const clamp = (value: number, min: number, max: number): number =>
  Number.min(max)(Number.max(min)(value))

const emitSong = (model: Model, song: Song.Song): UpdateReturn => [
  evo(model, { song: () => song }),
  [],
  Option.some(Message.UpdatedSong({ song })),
]

export const update = (model: Model, message: Message.Message): UpdateReturn =>
  M.value(message).pipe(
    M.withReturnType<UpdateReturn>(),
    M.tagsExhaustive({
      ClickedTransposeDown: () =>
        emitSong(
          model,
          evo(model.song, {
            transpose: transpose =>
              clamp(transpose - 1, -MAX_TRANSPOSE, MAX_TRANSPOSE),
          }),
        ),

      ClickedTransposeUp: () =>
        emitSong(
          model,
          evo(model.song, {
            transpose: transpose =>
              clamp(transpose + 1, -MAX_TRANSPOSE, MAX_TRANSPOSE),
          }),
        ),

      ClickedCapoDown: () =>
        emitSong(
          model,
          evo(model.song, {
            capo: capo => clamp(capo - 1, 0, MAX_CAPO),
          }),
        ),

      ClickedCapoUp: () =>
        emitSong(
          model,
          evo(model.song, {
            capo: capo => clamp(capo + 1, 0, MAX_CAPO),
          }),
        ),

      ClickedCopyChart: () => [
        model,
        [CopyChart({ text: Song.toChartText(model.song) })],
        Option.none(),
      ],

      SucceededCopyChart: () => [model, [], Option.some(Message.CopiedChart())],

      FailedCopyChart: ({ error }) => [
        model,
        [],
        Option.some(Message.FailedCopy({ error })),
      ],
    }),
  )
