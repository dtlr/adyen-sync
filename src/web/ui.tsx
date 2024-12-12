import { Hono } from 'hono'
import { html } from 'hono/html'

interface SiteData {
  title: string
  children?: unknown
}

const Layout = (props: SiteData) =>
  html`<!doctype html>
    <html lang="en" data-theme="dark">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="JDNA Sync" />
        <meta name="author" content="DTLR" />
        <meta name="keywords" content="JDNA, Sync, Terminals, Stores" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="color-scheme" content="light dark" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css"
        />
        <title>${props.title}</title>
      </head>
      <body>
        <main class="container">${props.children}</main>
      </body>
    </html>`

const Content = (props: { siteData: SiteData }) => {
  return (
    <Layout {...props.siteData}>
      <h1>Hello Hono UI!</h1>
    </Layout>
  )
}

const ui = new Hono()
  .get('/', (c) => {
    const props = {
      siteData: {
        title: 'JDNA Sync',
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/stores', (c) => {
    const props = {
      siteData: {
        title: 'JDNA Sync | Stores',
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/stores/:storeId', (c) => {
    const { storeId } = c.req.param()
    const props = {
      siteData: {
        title: `JDNA Sync | Store ${storeId}`,
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/stores/:storeId/terminals', (c) => {
    const { storeId } = c.req.param()
    const props = {
      siteData: {
        title: `JDNA Sync | Store ${storeId} | Terminals`,
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/stores/:storeId/terminals/:terminalId', (c) => {
    const { storeId, terminalId } = c.req.param()
    const props = {
      siteData: {
        title: `JDNA Sync | Store ${storeId} | Terminal ${terminalId}`,
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/terminals', (c) => {
    const props = {
      siteData: {
        title: 'JDNA Sync | Terminals',
      },
    }
    return c.html(<Content {...props} />)
  })
  .get('/terminals/:terminalId', (c) => {
    const { terminalId } = c.req.param()
    const props = {
      siteData: {
        title: `JDNA Sync | Terminal ${terminalId}`,
      },
    }
    return c.html(<Content {...props} />)
  })

export default ui
