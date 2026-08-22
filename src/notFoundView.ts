import type { Html, HtmlBuilder } from 'foldkit/html'

import { homeRouter } from './route'
import * as className from './view/className'

export const notFoundView = <Message>(
  path: string,
  h: HtmlBuilder<Message>,
): Html =>
  h.main(
    [h.Class('flex flex-col items-center gap-4 py-16 text-center')],
    [
      h.h1([h.Class(className.heading)], ['Page not found']),
      h.p([h.Class('text-stone-600')], [`Nothing is saved at “${path}”.`]),
      h.a(
        [h.Href(homeRouter()), h.Class(className.secondaryButton)],
        ['Back to library'],
      ),
    ],
  )
