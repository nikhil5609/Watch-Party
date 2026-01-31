import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosClient } from "../Api/api";

const initialState = {
  user: null,
  loggedIn: false,
  loading: false,
  error: null,
};

/* =======================
   ASYNC THUNKS
======================= */

// Signup
export const createUser = createAsyncThunk(
  "user/signup",
  async (userInfo, thunkAPI) => {
    try {
      const res = await axiosClient.post("/auth/signup", userInfo, { withCredentials: true });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

// Login
export const loginUser = createAsyncThunk(
  "user/login",
  async (userInfo, thunkAPI) => {
    try {
      const res = await axiosClient.post("/auth/login", userInfo, { withCredentials: true });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  "user/logout",
  async (_, thunkAPI) => {
    try {
      console.log("AAA");

      const res = await axiosClient.post("/auth/logout");
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

// Delete account
export const deleteUser = createAsyncThunk(
  "user/delete",
  async (_, thunkAPI) => {
    try {
      const res = await axiosClient.delete("/auth/delete", { withCredentials: true });
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || error.message
      );
    }
  }
);

export const verifyUser = createAsyncThunk(
  "user/verify",
  async (_, thunkAPI) => {
    try {
      const res = await axiosClient.get("/auth/isAuthenticated");
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

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      // SIGNUP
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.loggedIn = true;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.loggedIn = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.pending, (state) => {
        state.user = null;
        state.loggedIn = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.loggedIn = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.loggedIn = false;
      })


      // DELETE
      .addCase(deleteUser.fulfilled, (state) => {
        state.user = null;
        state.loggedIn = false;
      })
      // VERIFY USER
      .addCase(verifyUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.loggedIn = true;
      })
      .addCase(verifyUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.loggedIn = false;
      })
  },
});

export default userSlice.reducer;
