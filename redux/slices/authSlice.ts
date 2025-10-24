import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  loginUser,
  registerUser,
//   uploadProfilePhoto,
//   updateProfileInfo,
  switchRole,
} from "@/api/api";

// ✅ Define interfaces for type safety
interface User {
  id?: number | string;
  name?: string;
  email?: string;
  profilePhoto?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: any;
}

// ✅ Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

// ✅ Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async (credentials: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await loginUser(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await registerUser(userData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error);
    }
  }
);

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await updateProfileInfo(profileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const uploadPhoto = createAsyncThunk(
  "auth/uploadPhoto",
  async (fileData: Record<string, any>, { rejectWithValue }) => {
    try {
      const response = await uploadProfilePhoto(fileData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const switchUserRole = createAsyncThunk(
  "auth/switchRole",
  async (
    callbacks: { onSuccess?: () => void } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await switchRole();
      if (!response?.data?.user) {
        throw new Error("Invalid response format");
      }
      if (callbacks.onSuccess) {
        callbacks.onSuccess();
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Slice
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    // ✅ NEW: Logout action - clears all auth state
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    // ✅ NEW: Reset auth state to initial state
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action?.payload?.data?.user || null;
        state.token = action?.payload?.data?.token || null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action?.payload?.data?.user || null;
        state.token = action?.payload?.data?.token || null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(uploadPhoto.pending, (state) => {
        state.loading = true;
      })
      .addCase(uploadPhoto.fulfilled, (state, action) => {
        state.loading = false;
        state.user = {
          ...state.user,
          profilePhoto: action.payload?.profilePhoto || "",
        };
      })
      .addCase(uploadPhoto.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(switchUserRole.pending, (state) => {
        state.loading = true;
      })
      .addCase(switchUserRole.fulfilled, (state, action) => {
        state.loading = false;
        if (action?.payload?.data?.user) {
          state.user = action.payload.data.user;
        }
      })
      .addCase(switchUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// ✅ Actions - NOW INCLUDING LOGOUT
export const { 
  setToken, 
  clearToken, 
  setUser, 
  clearUser, 
  clearError,
  logout,
  resetAuth 
} = authSlice.actions;

export default authSlice.reducer;

// ✅ Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  !!state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) =>
  state.auth.error;