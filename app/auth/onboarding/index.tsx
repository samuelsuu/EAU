import {
    primaryColor,
    secondaryColor,
    whiteColor,
} from '@/constants/GlobalConstants';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    Extrapolation,
    interpolate,
    interpolateColor,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import OnboardingItem from './OnboardingItem';
import slides from './slides';

const { width, height } = Dimensions.get('window');

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const slidesRef = useRef<FlatList>(null);
  const router = useRouter();
  
  // Shared values for continuous animations
  const breathingScale = useSharedValue(1);
  const breathingRotate = useSharedValue(0);
  const buttonPulse = useSharedValue(1);

  useEffect(() => {
    // Breathing background animation
    breathingScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    
    breathingRotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );

    // Button pulse animation
    buttonPulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      Haptics.selectionAsync();
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const skip = () => {
    completeOnboarding();
  };

  const completeOnboarding = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/auth/login');
  };

  // Dynamic background color based on scroll position
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      [0, width, width * 2],
      ['#F0F8FF', '#FFF0F5', '#F5F5DC']
    );
    return { backgroundColor };
  });

  // Animated shapes for background interest
  const animatedShape1Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      [0, width, width * 2],
      [0, -50, 0],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { translateY }, 
        { rotate: `${breathingRotate.value}deg` },
        { scale: breathingScale.value }
      ],
    };
  });

  const animatedShape2Style = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      [0, width, width * 2],
      [0, 100, 0],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { translateY }, 
        { scale: breathingScale.value * 1.2 },
        { rotate: `-${breathingRotate.value}deg` }
      ],
    };
  });

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonPulse.value }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedBackgroundStyle]}>
      {/* Background Shapes */}
      <Animated.View style={[styles.shape, styles.shape1, animatedShape1Style]} />
      <Animated.View style={[styles.shape, styles.shape2, animatedShape2Style]} />

      <View style={{ flex: 1 }}>
        <Animated.FlatList
          data={slides}
          renderItem={({ item, index }) => (
            <OnboardingItem item={item} index={index} scrollX={scrollX} />
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={scrollHandler}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      {/* Glassmorphism Footer */}
      <BlurView intensity={80} tint="light" style={styles.footerContainer}>
        <View style={styles.footer}>
          {/* Paginator */}
          <View style={styles.paginatorContainer}>
            {slides.map((_, i) => {
              const animatedDotStyle = useAnimatedStyle(() => {
                const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                
                const dotWidth = interpolate(
                  scrollX.value,
                  inputRange,
                  [10, 30, 10],
                  Extrapolation.CLAMP
                );

                const opacity = interpolate(
                  scrollX.value,
                  inputRange,
                  [0.3, 1, 0.3],
                  Extrapolation.CLAMP
                );

                return {
                  width: dotWidth,
                  opacity,
                };
              });
              
              return (
                <Animated.View
                  key={i.toString()}
                  style={[styles.dot, animatedDotStyle]}
                />
              );
            })}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
              {currentIndex < slides.length - 1 ? (
                  <>
                      <TouchableOpacity onPress={skip} style={styles.skipButton}>
                          <Text style={styles.skipText}>Skip</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={scrollTo} 
                        style={styles.nextButton}
                        activeOpacity={0.8}
                      >
                          <Ionicons name="arrow-forward" size={24} color={whiteColor} />
                      </TouchableOpacity>
                  </>
              ) : (
                  <Animated.View style={[{ width: '100%' }, animatedButtonStyle]}>
                    <TouchableOpacity 
                      onPress={scrollTo} 
                      style={styles.getStartedButton}
                      activeOpacity={0.8}
                    >
                        <Text style={styles.getStartedText}>Get Started</Text>
                        <Ionicons name="rocket-outline" size={24} color={whiteColor} style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                  </Animated.View>
              )}
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shape: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.15, // Increased opacity slightly
  },
  shape1: {
    width: 300,
    height: 300,
    backgroundColor: primaryColor,
    top: -50,
    left: -100,
  },
  shape2: {
    width: 200,
    height: 200,
    backgroundColor: secondaryColor,
    bottom: 100,
    right: -50,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)', // Fallback/Tint
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    paddingTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: primaryColor,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 60,
  },
  skipButton: {
    padding: 15,
  },
  skipText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  nextButton: {
    backgroundColor: primaryColor,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButton: {
    backgroundColor: primaryColor,
    paddingVertical: 16,
    borderRadius: 30,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedText: {
    color: whiteColor,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
