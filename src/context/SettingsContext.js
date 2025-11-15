// src/context/SettingsContext.js
import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme, Animated, Easing } from "react-native";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState(null);
  
  const [settings, setSettings] = useState({ 
    wallpaperQuality: "original",
    longPressDownload: true 
  });

  // Define light and dark themes (Kept exactly as provided)
  const lightTheme = {
    ...MD3LightTheme,
    dark: false,
    colors: {
      ...MD3LightTheme.colors,
      primary: "#000000",
      secondary: "#666666",
      background: "#FFFFFF",
      surface: "#F8F8F8",
      onSurface: "#000000",
      outline: "#E5E5E5",
      tabIcon: "#666666",
      tabIconActive: "#000000",
      elevation: {
        level0: "#FFFFFF",
        level1: "#F8F8F8",
        level2: "#F3F3F3",
        level3: "#EDEDED",
        level4: "#E8E8E8",
        level5: "#E3E3E3",
      },
    },
  };

  const darkTheme = {
    ...MD3DarkTheme,
    dark: true,
    colors: {
      ...MD3DarkTheme.colors,
      primary: "#FFFFFF",
      secondary: "#AAAAAA",
      background: "#000000",
      surface: "#121212",
      onSurface: "#FFFFFF",
      outline: "#2A2A2A",
      tabIcon: "#AAAAAA",
      tabIconActive: "#FFFFFF",
      elevation: {
        level0: "#000000",
        level1: "#1A1A1A",
        level2: "#222222",
        level3: "#2A2A2A",
        level4: "#333333",
        level5: "#383838",
      },
    },
  };

  const getTargetTheme = () => {
    const mode = themeMode || "system"; 
    return mode === "system"
      ? systemScheme === "dark"
        ? darkTheme
        : lightTheme
      : mode === "dark"
      ? darkTheme
      : lightTheme;
  };
  
  const [currentTheme, setCurrentTheme] = useState(MD3LightTheme);
  
  const [transitionBackgroundColor, setTransitionBackgroundColor] = useState(
    MD3LightTheme.colors.background
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (themeMode !== null) {
      applyTheme();
    }
  }, [themeMode, systemScheme]);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem("@pixelwall_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({
          wallpaperQuality: "original",
          longPressDownload: true,
          ...(parsed.settings || {})
        }); 
        setThemeMode(parsed.themeMode || "system");
      } else {
        setThemeMode("system");
      }
    } catch (e) {
      console.log("Failed to load settings", e);
      setThemeMode("system");
    }
  };

  const applyTheme = async (skipAnimation = false) => {
    if (isAnimating.current) return;

    const targetTheme = getTargetTheme();
    
    if (currentTheme.dark === targetTheme.dark || skipAnimation) {
      setCurrentTheme(targetTheme);
      return;
    }

    isAnimating.current = true;
    
    // 1. Capture the OLD background color to cover the screen
    setTransitionBackgroundColor(currentTheme.colors.background);

    // 2. Fade IN Overlay (Fast)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 150, // Faster fade in to hide the switch
      easing: Easing.out(Easing.poly(4)),
      useNativeDriver: true,
    }).start(() => {
      
      // 3. Switch Theme (While hidden)
      setCurrentTheme(targetTheme);
      
      // 4. Fade OUT Overlay (Smooth)
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250, // Slower reveal
        easing: Easing.in(Easing.poly(4)),
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
    });
  };

  const updateThemeMode = async (mode) => {
    setThemeMode(mode);
    await AsyncStorage.setItem(
      "@pixelwall_settings",
      JSON.stringify({ settings, themeMode: mode })
    );
  };

  const saveSettings = async (newData) => {
    const updated = { settings: newData, themeMode };
    setSettings(newData);
    await AsyncStorage.setItem("@pixelwall_settings", JSON.stringify(updated));
  };

  const value = useMemo(
    () => ({
      theme: currentTheme,
      fadeAnim,
      transitionBackgroundColor,
      themeMode,
      updateThemeMode,
      settings,
      setSettings,
      saveSettings,
    }),
    [currentTheme, fadeAnim, transitionBackgroundColor, themeMode, settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};