import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../Api/api";

const initialState = {
  room: null,
  video: null,
  loading: false,
  error: null,
};

/* =======================
   ASYNC THUNKS
======================= */

export const createRoom = createAsyncThunk(
  "room/create",
  async (_, thunkAPI) => {
    try {
      const res = await axiosClient.post(
        "/room/create",
        {},
        { withCredentials: true }
      );
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
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

export const setFile = createAsyncThunk(
  "room/setVideo",
  async (data, thunkAPI) => {
    try {
      const res = await axiosClient.post(
        "/room/set-video",
        data,
        { withCredentials: true }
      );
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

export const verifyFile = createAsyncThunk(
  "room/verifyFile",
  async (data, thunkAPI) => {
    try {
      const res = await axiosClient.post(
        "/room/verify-video",
        data,
        { withCredentials: true }
      );
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
      state.video = null;
      state.loading = false;
      state.error = null;
    },
    setRoom: (state,action) => {
      state.room = action.payload
    },
    setVideoState: (state, action) => {
      state.video = action.payload;
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

      // JOIN ROOM
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

      // BACKEND ONLY (no blob URL here)
      .addCase(setFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setFile.fulfilled, (state, action) => {
        state.loading = false;
        state.room = action.payload.room;
      })
      .addCase(setFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to set video";
      })

      .addCase(verifyFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyFile.fulfilled, (state, action) => {
        state.loading = false;
        state.room = action.payload.room;
      })
      .addCase(verifyFile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to verify video";
      });
  },
});

export const { clearRoomState, setVideoState , setRoom} = roomSlice.actions;
export default roomSlice.reducer;
