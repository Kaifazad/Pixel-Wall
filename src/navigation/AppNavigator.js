// src/navigation/AppNavigator.js
import React, { useContext, useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Pressable,
} from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Appbar, TextInput, useTheme, IconButton } from "react-native-paper";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import CollectionsScreen from "../screens/CollectionsScreen";
import WallpaperPreviewScreen from "../screens/WallpaperPreviewScreen";
import CustomTabBar from "./CustomTabBar";
import AboutScreen from "../screens/AboutScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SupportScreen from "../screens/SupportScreen";
import { SettingsContext } from "../context/SettingsContext";

export const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

if (!global.emitter) {
  const listeners = {};
  global.emitter = {
    on(event, cb) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(cb);
      return () => {
        listeners[event] = listeners[event].filter((fn) => fn !== cb);
      };
    },
    emit(event, ...args) {
      (listeners[event] || []).forEach((cb) => cb(...args));
    },
  };
}

const HeaderMenu = ({ visible, onClose, navigation }) => {
  const theme = useTheme();
  if (!visible) return null;

  const handlePress = (option) => {
    onClose();
    switch (option) {
      case "donate":
        navigation.navigate("Support");
        break;
      case "about":
        navigation.navigate("About");
        break;
      case "settings":
        navigation.navigate("Settings");
        break;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.menuBackdrop} onPress={onClose}>
        <View style={[styles.menuBox, { backgroundColor: theme.colors.elevation.level3 }]}>
          {["donate", "about", "settings"].map((key, i) => (
            <TouchableOpacity
              key={key}
              onPress={() => handlePress(key)}
              style={[
                styles.menuItem, 
                { borderColor: theme.colors.outlineVariant },
                i === 2 && { borderBottomWidth: 0 }
              ]}
            >
              <Text style={[styles.menuText, { color: theme.colors.onSurface }]}>
                {key === "donate"
                  ? "Support"
                  : key === "about"
                  ? "About"
                  : "Settings"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};


const Header = ({ title, onSearch, onClearSearch, navigation }) => {
  const theme = useTheme();
  const [searchMode, setSearchMode] = useState(false);
  const [query, setQuery] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <Appbar.Header 
      mode="center-aligned" 
      elevated={false} 
      style={{ backgroundColor: theme.colors.surface }}
    >
      {!searchMode ? (
        <>
     
          
          <Appbar.Content
            title={title}
            titleStyle={{
              color: theme.colors.onSurface,
              fontSize: 24, 
              fontWeight: "bold", 
              textAlign: "left", 
              marginLeft: 8,    
            }}
          />

          {title === "Pixel Wall" ? (
            <View style={styles.actionContainer}>
              <IconButton
                icon="magnify"
                iconColor={theme.colors.onSurface}
                size={26}
                onPress={() => setSearchMode(true)}
              />
              <IconButton
                icon="dots-vertical"
                iconColor={theme.colors.onSurface}
                size={26}
                onPress={() => setMenuVisible(true)}
              />
              <HeaderMenu
                visible={menuVisible}
                onClose={() => setMenuVisible(false)}
                navigation={navigation}
              />
            </View>
          ) : (
           
             <View style={{ width: 8 }} /> 
          )}
        </>
      ) : (
      
        <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface }]}>
          <View style={[
            styles.searchPill, 
            { 
              backgroundColor: theme.colors.elevation.level2, 
              borderRadius: 50 
            }
          ]}>
            <IconButton
              icon="arrow-left"
              iconColor={theme.colors.onSurface}
              size={24}
              onPress={() => {
                setSearchMode(false);
                setQuery("");
                onClearSearch();
              }}
            />
            <TextInput
              placeholder="Search wallpapers..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => {
                onSearch(query);
               
              }}
              style={[
                styles.searchInput,
                {
                  color: theme.colors.onSurface,
                  backgroundColor: 'transparent'
                },
              ]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              selectionColor={theme.colors.primary}
              autoFocus
            />
            {query.length > 0 && (
              <IconButton
                icon="close"
                iconColor={theme.colors.onSurface}
                size={20}
                onPress={() => {
                  setQuery("");
                  onClearSearch();
                }}
              />
            )}
          </View>
        </View>
      )}
    </Appbar.Header>
  );
};

const getHeaderTitle = (routeName) => {
  switch (routeName) {
    case "Home":
      return "Pixel Wall";
    case "Favorites":
      return "Favorites";
    case "Collections":
      return "Collections";
    default:
      return "Pixel Wall";
  }
};

function MainTabs({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const homeRef = useRef(null);

  useEffect(() => {
    const unsub = global.emitter.on("homeTabPressed", () => {
      if (searchQuery.trim()) setSearchQuery("");
      else homeRef.current?.scrollToTop?.();
    });
    return unsub;
  }, [searchQuery]);

  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => ({
        header: () => (
          <Header
            title={getHeaderTitle(route.name)}
            navigation={navigation}
            onSearch={(q) => setSearchQuery(q)}
            onClearSearch={() => setSearchQuery("")}
          />
        ),
      })}
    >
      <Tab.Screen name="Home">
        {(props) => (
          <HomeScreen
            {...props}
            ref={homeRef}
            searchQuery={searchQuery}
            clearSearch={() => setSearchQuery("")}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Collections" component={CollectionsScreen} />
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const { theme } = useContext(SettingsContext);

  const navTheme = {
    ...(theme.dark ? DarkTheme : DefaultTheme),
    colors: {
      ...(theme.dark ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outline,
      primary: theme.colors.primary,
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}> 
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="WallpaperPreview" component={WallpaperPreviewScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: '100%',
  },
  searchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 4,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    paddingHorizontal: 0,
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 70,
    paddingRight: 12,
  },
  menuBox: {
    width: 180,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
  },
  menuItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "400",
  },
});

export default AppNavigator;
