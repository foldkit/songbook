import { Schema as S } from 'effect'

import { Toast as UiToast } from '@foldkit/ui'

export const ToastPayload = S.Struct({
  title: S.String,
  maybeDescription: S.Option(S.String),
})

export type ToastPayload = typeof ToastPayload.Type

export const Toast = UiToast.make(ToastPayload)
