import { Number } from 'effect'
import { Update } from 'foldkit'
import { evo } from 'foldkit/struct'

import { MAX_CAPO, MAX_TRANSPOSE } from '../../constant'
import { Song } from '../../domain'
import { CopyChart } from './command'
import { Message, OutMessage } from './message'
import { Model } from './model'

type UpdateReturn = Update.ReturnWithOutMessage<Model, Message, OutMessage>

const clamp = (value: number, min: number, max: number): number =>
  Number.min(max)(Number.max(min)(value))

const emitSong = (model: Model, song: Song.Song): UpdateReturn => ({
  model: evo(model, { song: () => song }),
  outMessage: OutMessage.UpdatedSong({ song }),
})

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
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

    ClickedCopyChart: () => ({
      model,
      commands: [CopyChart({ text: Song.toChartText(model.song) })],
    }),

    SucceededCopyChart: () => ({
      model,
      outMessage: OutMessage.CopiedChart(),
    }),

    FailedCopyChart: ({ error }) => ({
      model,
      outMessage: OutMessage.FailedCopy({ error }),
    }),
  })
