import { configureStore } from '@reduxjs/toolkit'
import userReducer from './user.slice.js'
import roomReducer from './room.slice.js'
export default configureStore({
  reducer: {
    user: userReducer,
    room: roomReducer
  },
})