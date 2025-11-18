// src/screens/SettingsScreen.js
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  Linking,
  Animated, 
  Easing,  
} from "react-native";
import {
  Text,
  useTheme,
  Appbar,
  List,
} from "react-native-paper";
import * as FileSystem from "expo-file-system/legacy";
import { SettingsContext } from "../context/SettingsContext";
import { useNavigation } from "@react-navigation/native";
import ConfirmDialog from "../components/ConfirmDialog";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import * as Haptics from "expo-haptics";


const ExpressiveSwitch = ({ value, onValueChange }) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false, 
    }).start();
  }, [value]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };


  const trackColor = anim.interpolate({
    inputRange: [0, 1],
 
    outputRange: [colors.elevation.level3, colors.primary] 
  });

  const trackBorderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.outline, colors.primary]
  });

  const thumbColor = anim.interpolate({
    inputRange: [0, 1],
    
    outputRange: [colors.outline, colors.onPrimary]
  });

  const thumbTranslate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22] 
  });

  const iconScale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1] 
  });

  const offIconScale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0]
  });

  return (
    <Pressable onPress={handlePress} style={styles.switchContainer}>
      <Animated.View style={[
        styles.switchTrack, 
        { 
          backgroundColor: trackColor,
          borderColor: trackBorderColor,
          borderWidth: 2 
        }
      ]}>
        <Animated.View style={[
          styles.switchThumb, 
          { 
            backgroundColor: thumbColor,
            transform: [{ translateX: thumbTranslate }] 
          }
        ]}>
          {/* On Icon (Check) */}
          <Animated.View style={[styles.switchIcon, { opacity: anim, transform: [{ scale: iconScale }] }]}>
             <MaterialCommunityIcons name="check" size={16} color={value ? colors.primary : colors.surface} />
          </Animated.View>
          
          {/* Off Icon (Close) - Optional, but expressive */}
          <Animated.View style={[styles.switchIcon, { position: 'absolute', opacity: offIconScale, transform: [{ scale: offIconScale }] }]}>
             <MaterialCommunityIcons name="close" size={16} color={colors.surface} />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { themeMode, updateThemeMode, settings, saveSettings } =
    useContext(SettingsContext);

  const [cacheSize, setCacheSize] = useState(null);
  const [loadingCache, setLoadingCache] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    calculateCacheSize();
  }, []);

  const calculateCacheSize = async () => {
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      let total = 0;
      for (const f of files) {
        const info = await FileSystem.getInfoAsync(`${FileSystem.cacheDirectory}${f}`);
        if (info.exists) total += info.size || 0;
      }
      setCacheSize((total / 1024 / 1024).toFixed(2));
    } catch (e) {
      setCacheSize("0");
    } finally {
      setLoadingCache(false);
    }
  };

  const clearCache = async () => {
    setDialogVisible(true);
  };

  const handleConfirmClearCache = async () => {
    setDialogVisible(false);
    try {
      const files = await FileSystem.readDirectoryAsync(FileSystem.cacheDirectory);
      for (const f of files) {
        await FileSystem.deleteAsync(`${FileSystem.cacheDirectory}${f}`, {
          idempotent: true,
        });
      }
      setCacheSize("0.00");
    } catch (err) {
      console.error("Failed to clear cache", err);
      Alert.alert("Error", "Failed to clear cache.");
    }
  };

  const updateSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    saveSettings(updated);
  };

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const handleSelection = (value) => {
    if (modalType === "theme") updateThemeMode(value);
    if (modalType === "quality") updateSetting("wallpaperQuality", value);
    closeModal();
  };

  const getDisplayValue = (type) => {
    if (type === "theme") {
      const mode = (themeMode || "system");
      return mode.charAt(0).toUpperCase() + mode.slice(1);
    }
    if (type === "quality") {
      const quality = settings.wallpaperQuality || "original";
      switch (quality) {
        case 'original': return 'Original';
        case 'high': return 'High';
        case 'medium': return 'Medium';
        case 'low': return 'Low';
        default: return 'Original';
      }
    }
    return "";
  };
  
  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link.");
      }
    } catch (err) {
      Alert.alert("Error", "An unknown error occurred.");
    }
  };
  
  const renderModalOptions = () => {
    let options = [];
    if (modalType === "theme")
      options = [
        { label: "Light", value: "light" },
        { label: "Dark", value: "dark" },
        { label: "System Default", value: "system" },
      ];
    if (modalType === "quality")
      options = [
        { label: "Low", value: "low", description: "Fastest loading" },
        { label: "Medium", value: "medium", description: "Balanced" },
        { label: "High", value: "high", description: "Recommended" },
        { label: "Original", value: "original", description: "Original quality" },
      ];

    return (
      <Pressable 
        style={[styles.modalContainer, { backgroundColor: colors.surface }]}
        onPress={() => {}}
      >
        <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
            {modalType === "theme" ? "Choose Theme" : "Image Quality"}
          </Text>
        </View>
        
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {options.map((opt, index) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.modalOption,
                { 
                  backgroundColor: colors.surface,
                  borderBottomWidth: index === options.length - 1 ? 0 : 1,
                  borderBottomColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }
              ]}
              onPress={() => handleSelection(opt.value)}
            >
              <View style={styles.modalOptionContent}>
                <View style={styles.modalTextContainer}>
                  <Text style={[styles.modalOptionTitle, { color: colors.onSurface }]}>
                    {opt.label}
                  </Text>
                  {opt.description && (
                    <Text style={[styles.modalOptionDesc, { color: colors.secondary }]}>
                      {opt.description}
                    </Text>
                  )}
                </View>
                <View style={[
                  styles.radioOuter,
                  { borderColor: colors.primary }
                ]}>
                  {(modalType === "theme" && themeMode === opt.value) || 
                   (modalType === "quality" && settings.wallpaperQuality === opt.value) ? (
                    <View style={[
                      styles.radioInner,
                      { backgroundColor: colors.primary }
                    ]} />
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Appbar.Header style={{ backgroundColor: colors.surface }} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Settings"
          titleStyle={{
            fontSize: 22,
            fontWeight: "bold",
            color: colors.onSurface,
          }}
          style={{ marginLeft: -2 }}
        />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>APPEARANCE</List.Subheader>
          <List.Item
            title="Theme"
            description={getDisplayValue("theme")}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => openModal("theme")}
          />
        </List.Section>

        {/* GESTURES SECTION WITH NEW EXPRESSIVE SWITCH */}
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>GESTURES</List.Subheader>
          <List.Item
            title="Long Press to Download"
            description="Hold an image to quick save"
            right={() => (
              <View style={{ justifyContent: 'center', paddingRight: 8 }}>
                <ExpressiveSwitch 
                  value={settings.longPressDownload} 
                  onValueChange={(val) => updateSetting("longPressDownload", val)} 
                />
              </View>
            )}
          />
        </List.Section>

        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>HOW TO USE</List.Subheader>
          <List.Item
            title="Discover New Wallpapers"
            description="On the Home screen, pull down to refresh and get a new random category every time you refresh the page"
            descriptionNumberOfLines={2}
          />
          <List.Item
            title="Search"
            description="Tap the search icon in the header to find specific wallpapers"
          />
        </List.Section>

        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>STORAGE</List.Subheader>
          <List.Item
            title="Clear App Cache"
            description={loadingCache ? "Calculating..." : `${cacheSize} MB`}
            onPress={clearCache}
          />
        </List.Section>

        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>QUALITY</List.Subheader>
          <List.Item
            title="Image Quality"
            description={getDisplayValue("quality")}
            right={() => <List.Icon icon="chevron-right" />}
            onPress={() => openModal("quality")}
          />
        </List.Section>

        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>ACCOUNT</List.Subheader>
          <List.Item
            title="Unsplash Login"
            description="Connect your account"
            right={() => <List.Icon icon="open-in-new" />}
            onPress={() => openLink("https://unsplash.com/join")}
          />
        </List.Section>
      </ScrollView>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable
          style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={closeModal}
        >
          {renderModalOptions()}
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={dialogVisible}
        title="Clear Cache"
        message="Delete all app cache? This action cannot be undone."
        onClose={() => setDialogVisible(false)}
        onConfirm={handleConfirmClearCache}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 16, gap: 16 },
  section: { borderRadius: 16, margin: 0 },
  modalBackdrop: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  modalContainer: { width: "100%", maxWidth: 400, borderRadius: 28, overflow: "hidden" },
  modalHeader: { padding: 20, paddingTop: 24 },
  modalTitle: { fontSize: 22, fontWeight: "bold", textAlign: "center" },
  modalContent: { paddingBottom: 8 },
  modalOption: { paddingVertical: 16, paddingHorizontal: 24 },
  modalOptionContent: { flexDirection: "row", alignItems: "center" },
  modalTextContainer: { flex: 1 },
  modalOptionTitle: { fontSize: 16, fontWeight: "500", marginBottom: 2 },
  modalOptionDesc: { fontSize: 13, opacity: 0.7 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: "center", alignItems: "center", marginLeft: 12 },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
  // Switch Styles
  switchContainer: {
    width: 52,
    height: 32,
    justifyContent: 'center',
  },
  switchTrack: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  switchIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default SettingsScreen;
