import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { getLanguage } from './i18n'

document.documentElement.lang = getLanguage()
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
