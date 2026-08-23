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
  model => [evo(model, { songs: () => songs }), [SaveLibrary({ songs })]]

const readToast = (model: Model) => Option.some(model.toast)

const writeToast = (model: Model, nextToast: Model['toast']): Model =>
  evo(model, { toast: () => nextToast })

const toGotToastMessage = (message: typeof Toast.Message.Type): Message =>
  Message.GotToastMessage({ message })

const foldToastOutMessage = M.type<typeof Toast.OutMessage.Type>().pipe(
  M.withReturnType<Update.Step<Model, Message>>(),
  M.tagsExhaustive({
    DismissedToast: () => model => [model, []],
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
    RequestedNewSong: () => model => [model, [GenerateSongIds()]],
    ConfirmedDeleteSong:
      ({ songId }) =>
      model => {
        const songs = Song.remove(model.songs, songId)
        const editor =
          model.editor.song.id === songId
            ? Editor.init(Editor.placeholderSong)[0]
            : model.editor
        const play =
          model.play.song.id === songId
            ? Play.init(Play.placeholderSong)[0]
            : model.play

        return Update.combine(
          evo(model, { editor: () => editor, play: () => play }),
          [saveSongs(songs)],
        )
      },
  })

const foldHome = Update.foldChild({
  update: Home.update,
  read: (model: Model) => Option.some(model.home),
  write: (model, nextHome) => evo(model, { home: () => nextHome }),
  toParentMessage: message => Message.GotHomeMessage({ message }),
  foldOutMessage: foldHomeOutMessage,
})

const syncSong =
  (song: Song.Song): Update.Step<Model, Message> =>
  model => {
    const songs = Song.upsert(model.songs, song)
    const editor =
      model.editor.song.id === song.id
        ? evo(model.editor, { song: () => song })
        : model.editor
    const play =
      model.play.song.id === song.id
        ? evo(model.play, { song: () => song })
        : model.play

    return Update.combine(
      evo(model, { editor: () => editor, play: () => play }),
      [saveSongs(songs)],
    )
  }

const foldEditorOutMessage = (
  outMessage: Editor.OutMessage,
): Update.Step<Model, Message> =>
  Editor.OutMessage.match<Update.Step<Model, Message>>(outMessage, {
    UpdatedSong: ({ song }) => syncSong(song),
  })

const foldEditor = Update.foldChild({
  update: Editor.update,
  read: (model: Model) => Option.some(model.editor),
  write: (model, nextEditor) => evo(model, { editor: () => nextEditor }),
  toParentMessage: message => Message.GotEditorMessage({ message }),
  foldOutMessage: foldEditorOutMessage,
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
  read: (model: Model) => Option.some(model.play),
  write: (model, nextPlay) => evo(model, { play: () => nextPlay }),
  toParentMessage: message => Message.GotPlayMessage({ message }),
  foldOutMessage: foldPlayOutMessage,
})

const loadSongPages =
  (songId: string): Update.Step<Model, Message> =>
  model =>
    Option.match(Song.findById(model.songs, songId), {
      onNone: () => [model, []],
      onSome: song => {
        const editor =
          model.editor.song.id === song.id ? model.editor : Editor.init(song)[0]
        const play =
          model.play.song.id === song.id ? model.play : Play.init(song)[0]
        return [evo(model, { editor: () => editor, play: () => play }), []]
      },
    })

const setRoute =
  (url: Url): Update.Step<Model, Message> =>
  model => {
    const nextRoute = urlToAppRoute(url)
    const pageStep = M.value(nextRoute).pipe(
      M.withReturnType<Update.Step<Model, Message>>(),
      M.tag('SongEdit', ({ songId }) => loadSongPages(songId)),
      M.tag('SongPlay', ({ songId }) => loadSongPages(songId)),
      M.orElse(() => (currentModel: Model) => [currentModel, []]),
    )

    return Update.combine(evo(model, { route: () => nextRoute }), [pageStep])
  }

export const update = (model: Model, message: Message) =>
  Message.match<UpdateReturn>(message, {
    ClickedLink: ({ request }) =>
      M.value(request).pipe(
        withUpdateReturn,
        M.tagsExhaustive({
          Internal: ({ url }) => [
            model,
            [NavigateInternal({ url: urlToString(url) })],
          ],
          External: ({ href }) => [model, [LoadExternal({ href })]],
        }),
      ),

    ChangedUrl: ({ url }) => setRoute(url)(model),

    CompletedNavigateInternal: () => [model, []],
    CompletedLoadExternal: () => [model, []],

    CompletedGenerateSongIds: ({ songId, sectionId }) => {
      const song = Song.create(songId, sectionId)
      const [editor] = Editor.init(song)
      const [play] = Play.init(song)
      return Update.combine(
        evo(model, {
          editor: () => editor,
          play: () => play,
          maybePendingEditSongId: () => Option.some(songId),
        }),
        [saveSongs(Song.upsert(model.songs, song))],
      )
    },

    SucceededSaveLibrary: () =>
      Option.match(model.maybePendingEditSongId, {
        onNone: () => [model, []],
        onSome: songId => [
          evo(model, { maybePendingEditSongId: () => Option.none() }),
          [NavigateInternal({ url: songEditRouter({ songId }) })],
        ],
      }),

    FailedSaveLibrary: ({ error }) =>
      Update.combine(
        evo(model, { maybePendingEditSongId: () => Option.none() }),
        [showToast('Error', error)],
      ),

    CompletedApplyTheme: () => [model, []],
    CompletedSaveThemePreference: () => [model, []],

    SelectedThemePreference: ({ preference }) => {
      const resolvedTheme = resolveTheme(preference, model.systemTheme)

      return [
        evo(model, {
          maybeThemePreference: () => Option.some(preference),
          resolvedTheme: () => resolvedTheme,
        }),
        [
          ApplyTheme({ theme: resolvedTheme }),
          SaveThemePreference({ preference }),
        ],
      ]
    },

    ChangedSystemTheme: ({ theme }) => {
      const resolvedTheme = resolveTheme(
        Option.getOrElse(model.maybeThemePreference, () => 'System'),
        theme,
      )

      return [
        evo(model, {
          systemTheme: () => theme,
          resolvedTheme: () => resolvedTheme,
        }),
        [ApplyTheme({ theme: resolvedTheme })],
      ]
    },

    GotHomeMessage: ({ message }) => foldHome(model, message),
    GotEditorMessage: ({ message }) => foldEditor(model, message),
    GotPlayMessage: ({ message }) => foldPlay(model, message),
    GotToastMessage: ({ message }) => foldToast(model, message),
  })
