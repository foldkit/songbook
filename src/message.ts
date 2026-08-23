import { Schema as S } from 'effect'
import { defineMessageUnion } from 'foldkit/message'
import { UrlRequest } from 'foldkit/navigation'
import { Url } from 'foldkit/url'

import { Editor, Home, Play } from './page'
import { Toast } from './toast'

export const ThemePreference = S.Literals(['Dark', 'Light', 'System'])
export type ThemePreference = typeof ThemePreference.Type

export const ResolvedTheme = S.Literals(['Dark', 'Light'])
export type ResolvedTheme = typeof ResolvedTheme.Type

export const Message = defineMessageUnion({
  ClickedLink: { request: UrlRequest },
  ChangedUrl: { url: Url },
  CompletedNavigateInternal: {},
  CompletedLoadExternal: {},
  CompletedGenerateSongIds: { songId: S.String, sectionId: S.String },
  SucceededSaveLibrary: {},
  FailedSaveLibrary: { error: S.String },
  CompletedApplyTheme: {},
  CompletedSaveThemePreference: {},
  SelectedThemePreference: { preference: ThemePreference },
  ChangedSystemTheme: { theme: ResolvedTheme },
  GotHomeMessage: { message: Home.Message },
  GotEditorMessage: { message: Editor.Message },
  GotPlayMessage: { message: Play.Message },
  GotToastMessage: { message: Toast.Message },
})
export type Message = typeof Message.Type
