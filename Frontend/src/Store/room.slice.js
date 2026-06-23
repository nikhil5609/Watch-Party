import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../Api/api";

const initialState = {
  room: null,
  loading: false,
  error: null,
};

/* =======================
   ASYNC THUNKS
======================= */

export const createRoom = createAsyncThunk(
  "room/create",
  async (movieKey, thunkAPI) => {
    try {
      console.log(movieKey);
      
      const res = await axiosClient.post(
        "/room/create",
        {movieKey},
        { withCredentials: true }
      );
      console.log(res.data);
      
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

export const joinRoom = createAsyncThunk(
  "room/join",
  async (roomId, thunkAPI) => {
    try {
      const res = await axiosClient.post(
        "/room/join",
        { roomId },
        { withCredentials: true }
      );
      console.log(res.data);
      
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);


/* =======================
   SLICE
======================= */

export const roomSlice = createSlice({
  name: "room",
  initialState,
  reducers: {
    clearRoomState: (state) => {
      state.room = null;
      state.loading = false;
      state.error = null;
    },
    setRoom: (state,action) => {
      state.room = action.payload
    },
  },
  extraReducers: (builder) => {
    builder

      // CREATE ROOM
      .addCase(createRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.room = action.payload.room;
      })
      .addCase(createRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create room";
      })
      .addCase(joinRoom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinRoom.fulfilled, (state, action) => {
        state.loading = false;
        state.room = action.payload.room;
      })
      .addCase(joinRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to join room";
      })
  },
});

export const { clearRoomState , setRoom} = roomSlice.actions;
export default roomSlice.reducer;
