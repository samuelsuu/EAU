import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { hideAlert } from "@/redux/slices/alertSlice";
import { RootState } from "@/redux/Store";

export default function AlertModal() {
  const dispatch = useDispatch();
  const alert = useSelector((state: RootState) => state.alert);

  if (!alert.visible) return null;

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            {alert.type === "error"
              ? "Error"
              : alert.type === "success"
              ? "Success"
              : "Notice"}
          </Text>

          <Text style={styles.message}>{alert.message}</Text>

          {alert.message_desc ? (
            <Text style={styles.messageDesc}>{alert.message_desc}</Text>
          ) : null}

          <TouchableOpacity
            style={[
              styles.button,
              alert.type === "error"
                ? styles.errorButton
                : styles.defaultButton,
            ]}
            onPress={() => dispatch(hideAlert())}
          >
            <Text style={styles.buttonText}>
              {alert.buttonText2 || "Close"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: "#444",
    marginBottom: 10,
  },
  messageDesc: {
    fontSize: 14,
    color: "#777",
    marginBottom: 16,
  },
  button: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  defaultButton: {
    backgroundColor: "#0066cc",
  },
  errorButton: {
    backgroundColor: "#cc0000",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
