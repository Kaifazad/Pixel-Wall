// src/navigation/CustomTabBar.js
import React, { useEffect, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { IconButton, useTheme } from "react-native-paper";
import Color from "color";

const iconMap = {
  Home: "home-variant",
  Favorites: "heart",
  Collections: "layers",
};

function CustomTabBar({ state, descriptors, navigation }) {
  const { colors, dark } = useTheme();
  const translateY = useRef(new Animated.Value(0)).current;

  const currentRoute = state.routes[state.index];
  const isScrollingDown = currentRoute?.params?.isScrollingDown;

  // animate hide/show
  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isScrollingDown ? 100 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 15,
    }).start();
  }, [isScrollingDown]);

  const handleTabPress = (route, index, isFocused) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }

    if (isFocused && route.name === "Home") {
      global.emitter?.emit("homeTabPressed");
    }
  };

  // small fade when theme changes
  const fadeAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  }, [dark]);

  return (
    <Animated.View
      style={[styles.animatedContainer, { transform: [{ translateY }] }]}
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        <BlurView
          intensity={Platform.OS === "ios" ? 70 : 90}
          tint={dark ? "dark" : "light"}
          style={[
            styles.floatingBar,
            {
              backgroundColor: dark
                ? "rgba(22,22,22,0.7)"
                : "rgba(200,200,200,0.6)",
              shadowColor: dark ? "#000" : "#AAA",
            },
          ]}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = options.title !== undefined ? options.title : route.name;
            const isFocused = state.index === index;
            const iconName = iconMap[route.name] || "help-circle";

            const color = isFocused
              ? colors.tabIconActive
              : colors.tabIcon;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handleTabPress(route, index, isFocused)}
                style={styles.iconContainer}
                activeOpacity={0.8}
              >
                <IconButton icon={iconName} size={24} iconColor={color} />
                <Text style={[styles.iconLabel, { color }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 20,
  },
  floatingBar: {
    height: 70,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  iconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8, // Nudge content up
  },
  iconLabel: {
    fontSize: 12,
    marginTop: -4,
    fontWeight: "500",
  },
});

export default CustomTabBar;