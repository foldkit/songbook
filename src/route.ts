import { Schema as S, pipe } from 'effect'
import { Route } from 'foldkit'
import { literal, r, slash, string } from 'foldkit/route'

export const HomeRoute = r('Home')
export const SongEditRoute = r('SongEdit', { songId: S.String })
export const SongPlayRoute = r('SongPlay', { songId: S.String })
export const NotFoundRoute = r('NotFound', { path: S.String })

export const AppRoute = S.Union([
  HomeRoute,
  SongEditRoute,
  SongPlayRoute,
  NotFoundRoute,
])

export type HomeRoute = typeof HomeRoute.Type
export type SongEditRoute = typeof SongEditRoute.Type
export type SongPlayRoute = typeof SongPlayRoute.Type
export type NotFoundRoute = typeof NotFoundRoute.Type
export type AppRoute = typeof AppRoute.Type

export const homeRouter = pipe(Route.root, Route.mapTo(HomeRoute))

export const songEditRouter = pipe(
  literal('songs'),
  slash(string('songId')),
  Route.mapTo(SongEditRoute),
)

export const songPlayRouter = pipe(
  literal('songs'),
  slash(string('songId')),
  slash(literal('play')),
  Route.mapTo(SongPlayRoute),
)

const routeParser = Route.oneOf(songPlayRouter, songEditRouter, homeRouter)

export const urlToAppRoute = Route.parseUrlWithFallback(
  routeParser,
  NotFoundRoute,
)
