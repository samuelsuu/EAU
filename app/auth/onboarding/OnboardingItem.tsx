import {
  primaryColor,
  secondaryColor,
} from '@/constants/GlobalConstants';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface OnboardingItemProps {
  item: {
    id: string;
    title: string;
    description: string;
    image: any;
  };
  index: number;
  scrollX: SharedValue<number>;
}

export default function OnboardingItem({ item, index, scrollX }: OnboardingItemProps) {
  const { width } = useWindowDimensions();
  const floatingY = useSharedValue(0);

  useEffect(() => {
    // Continuous floating animation
    floatingY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [100, 0, 100],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP
    );

    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [45, 0, -45],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        { perspective: 1000 }, // Add perspective for 3D effect
        { translateY: translateY + floatingY.value }, // Combine scroll translation with floating
        { scale },
        { rotateY: `${rotateY}deg` },
      ],
    };
  });

  const animatedTitleStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [width * 0.5, 0, -width * 0.5],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  const animatedDescStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [width * 0.8, 0, -width * 0.8],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <View style={[styles.container, { width }]}>
      <Animated.View style={[styles.imageContainer, animatedImageStyle]}>
         <Image 
            source={item.image} 
            style={[styles.image, { width: width * 0.8 }]} 
         />
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={animatedTitleStyle}>
          <Text style={styles.title}>{item.title}</Text>
        </Animated.View>
        <Animated.View style={animatedDescStyle}>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.3, // Increased opacity for depth
    shadowRadius: 30,
    elevation: 20, // Increased elevation
  },
  image: {
    height: 300,
    resizeMode: 'contain',
  },
  content: {
    flex: 0.3,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 15,
    color: secondaryColor,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 17,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
    fontWeight: '500',
  },
});
