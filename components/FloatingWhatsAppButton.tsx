import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FloatingWhatsAppButtonProps {
  phoneNumber?: string; // WhatsApp phone number in international format (e.g., "1234567890")
  message?: string; // Pre-filled message (optional)
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  bottom?: number;
  right?: number;
  left?: number;
  top?: number;
}

const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  phoneNumber = '2348012345678', // Default number - REPLACE WITH YOUR WHATSAPP NUMBER
  message = 'Hello! I need assistance.',
  position = 'bottom-right',
  bottom = 20,
  right = 20,
  left = 20,
  top = 20,
}) => {
  const openWhatsApp = async () => {
    try {
      // Format the phone number (remove any spaces, dashes, or special characters)
      const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Encode the message for URL
      const encodedMessage = encodeURIComponent(message);
      
      // Construct WhatsApp URL
      // For mobile apps, use whatsapp://
      // For web fallback, use https://wa.me/
      const whatsappURL = Platform.select({
        ios: `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`,
        android: `whatsapp://send?phone=${formattedNumber}&text=${encodedMessage}`,
        default: `https://wa.me/${formattedNumber}?text=${encodedMessage}`,
      });

      // Check if WhatsApp is installed
      const canOpen = await Linking.canOpenURL(whatsappURL);

      if (canOpen) {
        await Linking.openURL(whatsappURL);
      } else {
        // If WhatsApp is not installed, open web version
        const webURL = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
        const canOpenWeb = await Linking.canOpenURL(webURL);
        
        if (canOpenWeb) {
          await Linking.openURL(webURL);
        } else {
          Alert.alert(
            'WhatsApp Not Available',
            'Please install WhatsApp or check your internet connection.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      Alert.alert(
        'Error',
        'Unable to open WhatsApp. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Determine position styles based on prop
  const getPositionStyles = () => {
    switch (position) {
      case 'bottom-right':
        return { bottom, right };
      case 'bottom-left':
        return { bottom, left };
      case 'top-right':
        return { top, right };
      case 'top-left':
        return { top, left };
      default:
        return { bottom, right };
    }
  };

  return (
    <TouchableOpacity
      style={[styles.floatingButton, getPositionStyles()]}
      onPress={openWhatsApp}
      activeOpacity={0.8}
    >
      <Ionicons name="logo-whatsapp" size={32} color="#fff" />
    </TouchableOpacity>
  );
};

export default FloatingWhatsAppButton;

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366', // WhatsApp green color
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 999,
  },
});