import { Schema as S } from 'effect'
import { m } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'

import { Editor, Home, Play } from './page'
import { Toast } from './toast'

export const ClickedLink = m('ClickedLink', { request: UrlRequest })
export const ChangedUrl = m('ChangedUrl', { url: Url })
export const CompletedNavigateInternal = m('CompletedNavigateInternal')
export const CompletedLoadExternal = m('CompletedLoadExternal')
export const CompletedGenerateSongIds = m('CompletedGenerateSongIds', {
  songId: S.String,
  sectionId: S.String,
})
export const SucceededSaveLibrary = m('SucceededSaveLibrary')
export const FailedSaveLibrary = m('FailedSaveLibrary', { error: S.String })
export const GotHomeMessage = m('GotHomeMessage', { message: Home.Message })
export const GotEditorMessage = m('GotEditorMessage', {
  message: Editor.Message,
})
export const GotPlayMessage = m('GotPlayMessage', { message: Play.Message })
export const GotToastMessage = m('GotToastMessage', { message: Toast.Message })

export const Message = S.Union([
  ClickedLink,
  ChangedUrl,
  CompletedNavigateInternal,
  CompletedLoadExternal,
  CompletedGenerateSongIds,
  SucceededSaveLibrary,
  FailedSaveLibrary,
  GotHomeMessage,
  GotEditorMessage,
  GotPlayMessage,
  GotToastMessage,
])

export type Message = typeof Message.Type
