import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as Constant from '@/constants/GlobalConstants';
import { usePrimaryColor } from '@/hooks/index';
import { useSelector } from 'react-redux';

interface AlertComponentProps {
  type: 'success' | 'error';
  message?: string;
  message_desc?: string;
  onPress: (action?: string) => void;
  visible: boolean;
  buttonText?: string;
  buttonText2?: string;
  showLoginButton?: boolean;
  isLoading?: boolean;
}

interface RootState {
  global?: {
    globalSettings?: {
      data?: {
        localize?: {
          success?: string;
          error?: string;
        };
      };
    };
  };
}

const AlertComponent: React.FC<AlertComponentProps> = ({
  type,
  message,
  message_desc,
  onPress,
  visible,
  buttonText = 'OK',
  buttonText2 = 'Cancel',
  showLoginButton = false,
  isLoading = false,
}) => {
  const settings = useSelector(
    (state: RootState) => state?.global?.globalSettings?.data
  );
  const primaryColor = usePrimaryColor();

  // Replace icon with emoji
  const iconComponent = (
    <Text style={{ fontSize: 50 }}>
      {type === 'success' ? '✅' : '❌'}
    </Text>
  );

  const defaultMessage =
    type === 'success'
      ? settings?.localize?.success || 'Success'
      : settings?.localize?.error || 'Error';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => onPress()}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogContent}>
          <View style={styles.iconContainer}>{iconComponent}</View>
          <View style={styles.textContainer}>
            <Text style={styles.typemessage}>
              {message !== undefined ? message : defaultMessage}
            </Text>
            {message_desc && (
              <Text style={styles.message}>{message_desc}</Text>
            )}
          </View>
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[
                styles.button,
                !showLoginButton
                  ? [styles.loginButton, { backgroundColor: primaryColor }]
                  : styles.cancelButton,
              ]}
              onPress={() => onPress('cancel')}
              disabled={isLoading}
            >
              {!showLoginButton && isLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={{ transform: [{ scale: 0.9 }] }}
                />
              ) : (
                <Text
                  style={[
                    styles.buttonText,
                    { color: !showLoginButton ? '#fff' : Constant.secondaryColor },
                  ]}
                >
                  {buttonText2}
                </Text>
              )}
            </TouchableOpacity>
            {showLoginButton && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.loginButton,
                  { backgroundColor: primaryColor },
                ]}
                onPress={() => onPress('login')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{buttonText}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: 300,
    position: 'relative',
    marginTop: 50,
  },
  iconContainer: {
    position: 'absolute',
    top: -30,
    zIndex: 1,
  },
  textContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  typemessage: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '500',
    fontFamily: Constant.primaryFontSemiBold,
    color: '#000',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B6B6B',
    fontFamily: Constant.primaryFontRegular,
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 30,
  },
  buttonWrapper: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#f7f7f8',
    width: '100%',
    paddingHorizontal: 16,
    gap: 14,
    paddingVertical: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#eaeaea',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    shadowColor: 'rgba(16, 24, 40, 0.04)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#ee4710',
    borderRadius: 10,
    paddingVertical: 12,
    shadowColor: 'rgba(16, 24, 40, 0.04)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: Constant.primaryFontMedium,
    color: '#fff',
    textAlign: 'center',
  },
});

export default AlertComponent;
