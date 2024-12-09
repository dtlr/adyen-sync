import { Hono } from 'hono'
import { html } from 'hono/html'

interface SiteData {
  title: string
  children?: unknown
}

const Layout = (props: SiteData) =>
  html`<!doctype html>
    <html>
      <head>
        <title>${props.title}</title>
      </head>
      <body>
        ${props.children}
      </body>
    </html>`

const Content = (props: { siteData: SiteData }) => {
  return (
    <Layout {...props.siteData}>
      <h1>Hello Hono!</h1>
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
