import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { parseRoute } from './hooks/useRoute'

// Parse the initial URL once, before the app mounts, so deep links /
// shared URLs boot directly into the correct virtual route.
const initialRoute = parseRoute()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App initialRoute={initialRoute} />
  </StrictMode>,
)
