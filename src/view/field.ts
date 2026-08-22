import type { Html, HtmlBuilder } from 'foldkit/html'

import { Input, Textarea } from '@foldkit/ui'

import * as className from './className'

export const labeledInput = <Message>(
  config: Readonly<{
    id: string
    labelText: string
    value: string
    onInput: (value: string) => Message
    placeholder?: string
  }>,
  h: HtmlBuilder<Message>,
): Html =>
  Input.view(
    {
      id: config.id,
      value: config.value,
      onInput: config.onInput,
      ...(config.placeholder === undefined
        ? {}
        : { placeholder: config.placeholder }),
      toView: attributes =>
        h.div(
          [h.Class('flex flex-col gap-1')],
          [
            h.label(
              [...attributes.label, h.Class(className.label)],
              [config.labelText],
            ),
            h.input([...attributes.input, h.Class(className.input)]),
          ],
        ),
    },
    h,
  )

export const labeledTextarea = <Message>(
  config: Readonly<{
    id: string
    labelText: string
    value: string
    onInput: (value: string) => Message
    rows: number
    placeholder?: string
  }>,
  h: HtmlBuilder<Message>,
): Html =>
  Textarea.view(
    {
      id: config.id,
      value: config.value,
      onInput: config.onInput,
      rows: config.rows,
      ...(config.placeholder === undefined
        ? {}
        : { placeholder: config.placeholder }),
      toView: attributes =>
        h.div(
          [h.Class('flex flex-col gap-1')],
          [
            h.label(
              [...attributes.label, h.Class(className.label)],
              [config.labelText],
            ),
            h.textarea([...attributes.textarea, h.Class(className.textarea)]),
          ],
        ),
    },
    h,
  )
