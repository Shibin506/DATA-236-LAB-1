import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App'
import { store, persistor } from './store'
import { setAuthToken } from './services/api'

// Ensure axios Authorization header reflects persisted auth token on startup
const currentToken = store.getState().auth?.token
if (currentToken) setAuthToken(currentToken)

// Subscribe to store to keep axios header synchronized when auth token changes
let lastToken = currentToken
store.subscribe(() => {
  const token = store.getState().auth?.token
  if (token !== lastToken) {
    lastToken = token
    setAuthToken(token)
  }
})
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
)
