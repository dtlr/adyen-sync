import { type FC } from 'hono/jsx'

export const App: FC = (props) => {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="JDNA Sync" />
        <meta name="author" content="DTLR" />
        <meta name="keywords" content="JDNA, Sync, Terminals, Stores" />
        <title>JDNA Sync</title>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
      </head>
      <body>
        <div id="app">{props.children}</div>
      </body>
    </html>
  )
}
