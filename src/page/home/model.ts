import { Option, Schema as S } from 'effect'

import { Dialog } from '@foldkit/ui'

export const Model = S.Struct({
  searchQuery: S.String,
  deleteDialog: Dialog.Model,
  maybePendingDeleteSongId: S.Option(S.String),
})

export type Model = typeof Model.Type

export const init = (): readonly [Model, ReadonlyArray<never>] => [
  {
    searchQuery: '',
    deleteDialog: Dialog.init({ id: 'delete-song-dialog' }),
    maybePendingDeleteSongId: Option.none(),
  },
  [],
]
