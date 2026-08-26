import { Match as M, Option } from 'effect'
import { Update } from 'foldkit'
import { evo } from 'foldkit/struct'
import { Url, toString as urlToString } from 'foldkit/url'

import {
  ApplyTheme,
  GenerateSongIds,
  LoadExternal,
  NavigateInternal,
  SaveLibrary,
  SaveThemePreference,
} from './command'
import { Song } from './domain'
import { Message } from './message'
import { Model } from './model'
import { Editor, Home, Play } from './page'
import { songEditRouter, urlToAppRoute } from './route'
import { resolveTheme } from './theme'
import { Toast } from './toast'

type UpdateReturn = Update.Return<Model, Message>
const withUpdateReturn = M.withReturnType<UpdateReturn>()

const saveSongs =
  (songs: ReadonlyArray<Song.Song>): Update.Step<Model, Message> =>
  model => ({
    model: evo(model, { songs: () => songs }),
    commands: [SaveLibrary({ songs })],
  })

const readToast = (model: Model) => Option.some(model.toast)

const writeToast = (model: Model, nextToast: Model['toast']): Model =>
  evo(model, { toast: () => nextToast })

const toGotToastMessage = (message: typeof Toast.Message.Type): Message =>
  Message.GotToastMessage({ message })

const foldToastOutMessage = M.type<typeof Toast.OutMessage.Type>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    DismissedToast: () => model => ({ model }),
  }),
)

const foldToast = Update.foldChild({
  update: Toast.update,
  read: readToast,
  write: writeToast,
  toParentMessage: toGotToastMessage,
  foldOutMessage: foldToastOutMessage,
})

const foldToastShow = Update.foldChild({
  update: Toast.show,
  read: readToast,
  write: writeToast,
  toParentMessage: toGotToastMessage,
  foldOutMessage: foldToastOutMessage,
})

const showToast = (
  variant: 'Success' | 'Error',
  title: string,
  maybeDescription: Option.Option<string> = Option.none(),
): Update.Step<Model, Message> =>
  foldToastShow({
    variant,
    payload: { title, maybeDescription },
  })

const foldHomeOutMessage = (
  outMessage: Home.OutMessage,
): Update.Step<Model, Message> =>
  Home.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    RequestedNewSong: () => model => ({
      model,
      commands: [GenerateSongIds()],
    }),
    ConfirmedDeleteSong:
      ({ songId }) =>
      model =>
        Update.combine(model, [
          foldEditorAbandonSong(songId),
          foldPlayAbandonSong(songId),
          saveSongs(Song.remove(model.songs, songId)),
        ]),
  })

const foldHome = Update.foldChild({
  update: Home.update,
  read: (model: Model) => Option.some(model.home),
  write: (model, nextHome) => evo(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  foldOutMessage: foldHomeOutMessage,
})

const readEditor = (model: Model) => Option.some(model.editor)
const writeEditor = (model: Model, nextEditor: Model['editor']): Model =>
  evo(model, { editor: () => nextEditor })
const toGotEditorMessage = (message: Editor.Message): Message =>
  Message.GotEditorMessage({ message })

const readPlay = (model: Model) => Option.some(model.play)
const writePlay = (model: Model, nextPlay: Model['play']): Model =>
  evo(model, { play: () => nextPlay })
const toGotPlayMessage = (message: Play.Message): Message =>
  Message.GotPlayMessage({ message })

const foldEditorSyncSong = Update.foldChild({
  update: Editor.syncSong,
  read: readEditor,
  write: writeEditor,
  toParentMessage: toGotEditorMessage,
})

const foldPlaySyncSong = Update.foldChild({
  update: Play.syncSong,
  read: readPlay,
  write: writePlay,
  toParentMessage: toGotPlayMessage,
})

const syncSong =
  (song: Song.Song): Update.Step<Model, Message> =>
  model =>
    Update.combine(model, [
      foldEditorSyncSong(song),
      foldPlaySyncSong(song),
      saveSongs(Song.upsert(model.songs, song)),
    ])

const foldEditorOutMessage = (
  outMessage: Editor.OutMessage,
): Update.Step<Model, Message> =>
  Editor.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    UpdatedSong: ({ song }) => syncSong(song),
  })

const foldEditor = Update.foldChild({
  update: Editor.update,
  read: readEditor,
  write: writeEditor,
  toParentMessage: toGotEditorMessage,
  foldOutMessage: foldEditorOutMessage,
})

const foldEditorLoadSong = Update.foldChild({
  update: Editor.loadSong,
  read: readEditor,
  write: writeEditor,
  toParentMessage: toGotEditorMessage,
})

const foldEditorAbandonSong = Update.foldChild({
  update: Editor.abandonSong,
  read: readEditor,
  write: writeEditor,
  toParentMessage: toGotEditorMessage,
})

const foldPlayOutMessage = (
  outMessage: Play.OutMessage,
): Update.Step<Model, Message> =>
  Play.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    UpdatedSong: ({ song }) => syncSong(song),
    CopiedChart: () => showToast('Success', 'Chart copied'),
    FailedCopy: ({ error }) => showToast('Error', error),
  })

const foldPlay = Update.foldChild({
  update: Play.update,
  read: readPlay,
  write: writePlay,
  toParentMessage: toGotPlayMessage,
  foldOutMessage: foldPlayOutMessage,
})

const foldPlayLoadSong = Update.foldChild({
  update: Play.loadSong,
  read: readPlay,
  write: writePlay,
  toParentMessage: toGotPlayMessage,
})

const foldPlayAbandonSong = Update.foldChild({
  update: Play.abandonSong,
  read: readPlay,
  write: writePlay,
  toParentMessage: toGotPlayMessage,
})

const loadSongPages =
  (songId: string): Update.Step<Model, Message> =>
  model =>
    Option.match(Song.findById(model.songs, songId), {
      onNone: () => ({ model }),
      onSome: song =>
        Update.combine(model, [
          foldEditorLoadSong(song),
          foldPlayLoadSong(song),
        ]),
    })

const setRoute =
  (url: Url): Update.Step<Model, Message> =>
  model => {
    const nextRoute = urlToAppRoute(url)
    const pageStep = M.value(nextRoute).pipe(
      M.withReturnType<Update.Step<Model, Message>>(),
      M.tag('SongEdit', ({ songId }) => loadSongPages(songId)),
      M.tag('SongPlay', ({ songId }) => loadSongPages(songId)),
      M.orElse(() => (currentModel: Model) => ({ model: currentModel })),
    )

    return pageStep(evo(model, { route: () => nextRoute }))
  }

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ClickedLink: ({ request }) =>
      M.value(request).pipe(
        withUpdateReturn,
        M.tagsExhaustive({
          Internal: ({ url }) => ({
            model,
            commands: [NavigateInternal({ url: urlToString(url) })],
          }),
          External: ({ href }) => ({
            model,
            commands: [LoadExternal({ href })],
          }),
        }),
      ),

    ChangedUrl: ({ url }) => setRoute(url)(model),

    CompletedNavigateInternal: () => ({ model }),
    CompletedLoadExternal: () => ({ model }),

    CompletedGenerateSongIds: ({ songId, sectionId }) => {
      const song = Song.create(songId, sectionId)
      const editorInit = Editor.init(song)
      const playInit = Play.init(song)
      return saveSongs(Song.upsert(model.songs, song))(
        evo(model, {
          editor: () => editorInit.model,
          play: () => playInit.model,
          maybePendingEditSongId: () => Option.some(songId),
        }),
      )
    },

    SucceededSaveLibrary: () =>
      Option.match(model.maybePendingEditSongId, {
        onNone: () => ({ model }),
        onSome: songId => ({
          model: evo(model, { maybePendingEditSongId: () => Option.none() }),
          commands: [NavigateInternal({ url: songEditRouter({ songId }) })],
        }),
      }),

    FailedSaveLibrary: ({ error }) =>
      showToast(
        'Error',
        error,
      )(evo(model, { maybePendingEditSongId: () => Option.none() })),

    CompletedApplyTheme: () => ({ model }),
    CompletedSaveThemePreference: () => ({ model }),

    SelectedThemePreference: ({ preference }) => {
      const resolvedTheme = resolveTheme(preference, model.systemTheme)

      return {
        model: evo(model, {
          maybeThemePreference: () => Option.some(preference),
          resolvedTheme: () => resolvedTheme,
        }),
        commands: [
          ApplyTheme({ theme: resolvedTheme }),
          SaveThemePreference({ preference }),
        ],
      }
    },

    ChangedSystemTheme: ({ theme }) => {
      const resolvedTheme = resolveTheme(
        Option.getOrElse(model.maybeThemePreference, () => 'System'),
        theme,
      )

      return {
        model: evo(model, {
          systemTheme: () => theme,
          resolvedTheme: () => resolvedTheme,
        }),
        commands: [ApplyTheme({ theme: resolvedTheme })],
      }
    },

    GotHomeMessage: ({ message }) => foldHome(model, message),
    GotEditorMessage: ({ message }) => foldEditor(model, message),
    GotPlayMessage: ({ message }) => foldPlay(model, message),
    GotToastMessage: ({ message }) => foldToast(model, message),
  })
