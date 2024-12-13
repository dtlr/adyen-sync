import { createFactory } from 'hono/factory'
import { App } from './components/App.jsx'

const factory = createFactory()
const ui = factory.createApp()

ui.get('/', (c) => c.html(<App />))
ui.get('/stores', (c) => c.html(<App />))
ui.get('/stores/:id', (c) => c.html(<App />))
ui.get('/stores/:id/terminals', (c) => c.html(<App />))

ui.get('/terminals', (c) => c.html(<App />))
ui.get('/terminals/:id', (c) => c.html(<App />))

export default ui
