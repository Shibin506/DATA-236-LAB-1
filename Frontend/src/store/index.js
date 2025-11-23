import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import bookingReducer from './bookingSlice'
import authReducer from './authSlice'
import propertiesReducer from './propertiesSlice'
import travelerBookingReducer from './travelerBookingSlice'
import { combineReducers } from 'redux'

const rootReducer = combineReducers({
  auth: authReducer,
  properties: propertiesReducer,
  bookings: bookingReducer,
  travelerBookings: travelerBookingReducer
})

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'properties'] // persist auth and properties
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
    }
  })
})

export const persistor = persistStore(store)
