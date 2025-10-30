// components/QuickMessageButton.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendMessage } from "@/api/api";
import {
  primaryColor,
  whiteColor,
  fontColor,
  backgroundColor,
} from "@/constants/GlobalConstants";

interface QuickMessageButtonProps {
  recipientId: string;
  recipientName: string;
  onSuccess?: () => void;
}

export const QuickMessageButton: React.FC<QuickMessageButtonProps> = ({
  recipientId,
  recipientName,
  onSuccess,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert("Error", "Please enter a message");
      return;
    }

    setSending(true);
    try {
      const response = await sendMessage({
        receiver_id: recipientId,
        message: message.trim(),
      });

      if (response.data?.type === "success") {
        Alert.alert("Success", "Message sent successfully!");
        setMessage("");
        setModalVisible(false);
        onSuccess?.();
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to send message"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.messageButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="chatbubble-outline" size={16} color={primaryColor} />
        <Text style={styles.messageButtonText}>Message</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Message</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={sending}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.recipientText}>To: {recipientName}</Text>

            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
              editable={!sending}
              maxLength={500}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={sending}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.7 }]}
                onPress={handleSendMessage}
                disabled={sending || !message.trim()}
              >
                {sending ? (
                  <ActivityIndicator color={whiteColor} size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color={whiteColor} />
                    <Text style={styles.sendButtonText}>Send</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: primaryColor,
    backgroundColor: whiteColor,
    gap: 6,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: primaryColor,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: whiteColor,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: fontColor,
  },
  recipientText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: fontColor,
    minHeight: 120,
    backgroundColor: backgroundColor,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  sendButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: primaryColor,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: whiteColor,
  },
});

export default QuickMessageButton;