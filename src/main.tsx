import { render } from 'preact'
import { registerSW } from 'virtual:pwa-register'
import { App } from './App'
import { createApplicationUpdateController } from './application-update'
import './global.css'

const applicationUpdateController = createApplicationUpdateController(
  (options) => registerSW(options),
)

render(
  <App applicationUpdateController={applicationUpdateController} />,
  document.getElementById('app')!,
)
