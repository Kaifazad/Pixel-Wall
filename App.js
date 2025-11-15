// App.js
import React, { useContext, useEffect, useState } from "react";
import {
  Animated,
  StatusBar,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import { PaperProvider } from "react-native-paper";
import * as Font from "expo-font";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Feather from "react-native-vector-icons/Feather";
import Ionicons from "react-native-vector-icons/Ionicons";
import AppNavigator from "./src/navigation/AppNavigator";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { SettingsProvider, SettingsContext } from "./src/context/SettingsContext";

const AppContent = () => {
  const { theme } = useContext(SettingsContext);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...MaterialCommunityIcons.font,
          ...Feather.font,
          ...Ionicons.font,
        });
        setFontsLoaded(true);
      } catch (err) {
        console.warn("Font loading failed:", err);
      }
    }
    loadFonts();
  }, []);

  // Simple fallback while fonts load
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#000",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <PaperProvider theme={theme}>
        <FavoritesProvider>
          <StatusBar
            barStyle={theme.dark ? "light-content" : "dark-content"}
            backgroundColor={theme.colors.background}
          />
          <AppNavigator />
        </FavoritesProvider>
      </PaperProvider>
    </View>
  );
};

const ThemeOverlay = () => {
  const { fadeAnim, transitionBackgroundColor } = useContext(SettingsContext);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: transitionBackgroundColor,
          opacity: fadeAnim,
          zIndex: 1,
        },
      ]}
      pointerEvents="none"
    />
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
      <ThemeOverlay />
    </SettingsProvider>
  );
}
