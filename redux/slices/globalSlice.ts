import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { fetchSettings } from "@/api/api";

// ---------------- Types ----------------
export interface GlobalSettings {
  data?: any;
  fields?: Record<string, any>;
  [key: string]: any;
}

export interface GlobalState {
  globalSettings: GlobalSettings | null;
  theme: "light" | "dark";
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ---------------- Async Thunk ----------------
export const fetchSettingsFields = createAsyncThunk<
  GlobalSettings,       // ✅ return type
  void,                 // ✅ argument type (none)
  { rejectValue: string } // ✅ reject value type
>(
  "global/fetchSettingsFields",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchSettings();
      return response;
    } catch (error: any) {
      return rejectWithValue(error?.message || "Failed to fetch settings");
    }
  }
);

// ---------------- Initial State ----------------
const initialState: GlobalState = {
  globalSettings: null,
  theme: "light",
  status: "idle",
  error: null,
};

// ---------------- Slice ----------------
const globalSlice = createSlice({
  name: "global",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettingsFields.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSettingsFields.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.globalSettings = action.payload;
      })
      .addCase(fetchSettingsFields.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Error loading global settings";
      });
  },
});

// ---------------- Exports ----------------
export const { setTheme } = globalSlice.actions;
export default globalSlice.reducer;
