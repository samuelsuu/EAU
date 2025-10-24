import React from "react";
import { Stack } from "expo-router";
import { Provider } from "react-redux";
import { store } from "@/redux/Store";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/redux/Store";
import { Portal, Dialog, Button, Text } from "react-native-paper";
import { hideAlert } from "@/redux/slices/alertSlice";

function AlertDialog() {
  const dispatch = useDispatch();
  const { visible, alertData } = useSelector((state: RootState) => state.alert);

  if (!alertData) return null;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={() => dispatch(hideAlert())}>
        <Dialog.Title>
          {alertData.type === "error" ? "Error" : alertData.type === "success" ? "Success" : "Info"}
        </Dialog.Title>
        <Dialog.Content>
          <Text>{alertData.message}</Text>
          {alertData.message_desc ? <Text>{alertData.message_desc}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => dispatch(hideAlert())}>
            {alertData.buttonText2 || "OK"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="(tabs)" options={{headerShown: false,}} />
        
      </Stack>
      <AlertDialog />
    </Provider>
  );
}
