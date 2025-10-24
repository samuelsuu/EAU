import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AlertState {
  visible: boolean;
  type: "success" | "error" | "info" | null;
  message: string | null;
  message_desc?: string | null;
  buttonText2?: string | null;
  showLoginButton?: boolean;
  statusCode?: number | null;
}

const initialState: AlertState = {
  visible: false,
  type: null,
  message: null,
  message_desc: null,
  buttonText2: null,
  showLoginButton: false,
  statusCode: null,
};

const alertSlice = createSlice({
  name: "alert",
  initialState,
  reducers: {
    showAlert: (state, action: PayloadAction<Partial<AlertState>>) => {
      state.visible = true;
      state.type = action.payload.type || "info";
      state.message = action.payload.message || null;
      state.message_desc = action.payload.message_desc || null;
      state.buttonText2 = action.payload.buttonText2 || "Close";
      state.showLoginButton = action.payload.showLoginButton || false;
      state.statusCode = action.payload.statusCode || null;
    },
    hideAlert: (state) => {
      state.visible = false;
      state.type = null;
      state.message = null;
      state.message_desc = null;
      state.buttonText2 = null;
      state.showLoginButton = false;
      state.statusCode = null;
    },
  },
});

export const { showAlert, hideAlert } = alertSlice.actions;
export default alertSlice.reducer;
