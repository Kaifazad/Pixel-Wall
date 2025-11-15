// src/components/Toast.js
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from 'react-native-paper';

const { width } = Dimensions.get('window');

const Toast = ({ visible, message, type = 'info', onHide, duration = 2000 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;
  const { colors, dark } = useTheme();

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.toastWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 90}
          tint={dark ? "dark" : "light"}
          style={[
            styles.toast,
            {
              backgroundColor: dark
                ? "rgba(22,22,22,0.7)"
                : "rgba(200,200,200,0.6)",
              shadowColor: dark ? "#000" : "#AAA",
            },
          ]}
        >
          <Text style={[
            styles.message,
            { color: dark ? '#FFFFFF' : '#000000' }
          ]}>
            {message}
          </Text>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100, // Added bottom margin
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 20,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    minWidth: width * 0.5,
    maxWidth: width * 0.8,
    overflow: 'hidden',
  },
  message: {
    fontSize: 13, // Smaller message
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});

export default Toast;