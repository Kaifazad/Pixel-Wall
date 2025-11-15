// src/screens/FavoritesScreen.js
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  Dimensions,
  RefreshControl,
  Text,
  Animated, // ✅ Added
  Pressable, // ✅ Added
  Platform, // ✅ Added
} from "react-native";
import {
  Card,
  IconButton,
  useTheme,
} from "react-native-paper";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { useFavorites } from "../context/FavoritesContext";
import Toast from "../components/Toast";
import { SettingsContext } from "../context/SettingsContext";
import { getImageUrl } from "../utils/imageHelpers";
import InfoModal from "../components/InfoModal";
import WallpaperTypeDialog from "../components/WallpaperTypeDialog";
import ManageWallpaper, { TYPE } from "react-native-manage-wallpaper";
import * as Haptics from "expo-haptics"; // ✅ Added
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"; // ✅ Added

const { width, height } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS * 2)) / NUM_COLUMNS;

// ✅ REUSED WALLPAPER CARD LOGIC FOR FAVORITES
const WallpaperCard = ({ item, settings, onPress, onLongPressSuccess }) => {
  const { colors, dark } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const delayTimerRef = useRef(null); 
  const longPressTimerRef = useRef(null);
  
  const [isSuccess, setIsSuccess] = useState(false);

  const HOLD_DURATION = 2500; 
  const START_DELAY = 200;

  const handlePressIn = () => {
    if (!settings.longPressDownload) return;

    delayTimerRef.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      Animated.timing(scaleAnim, {
        toValue: 0.90,
        duration: 300,
        useNativeDriver: true,
      }).start();

      longPressTimerRef.current = setTimeout(() => {
        triggerSuccess();
      }, HOLD_DURATION);

    }, START_DELAY);
  };

  const handlePressOut = () => {
    if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    if (!isSuccess) {
        resetAnimation();
    }
  };

  const triggerSuccess = () => {
    setIsSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    onLongPressSuccess(item);

    setTimeout(() => {
        setIsSuccess(false);
        resetAnimation();
    }, 1500);
  };

  const resetAnimation = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (!isSuccess) {
        onPress(item);
    }
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={styles.cardWrapper}
      delayLongPress={HOLD_DURATION + 500}
    >
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Card style={{ borderRadius: 0 }} mode="contained"> 
          <Card.Cover
            source={{ uri: getImageUrl(item.urls, settings.wallpaperQuality, "grid") }}
            style={{ 
              width: "100%", 
              height: (CARD_WIDTH * 4) / 3 
            }}
          />
          
          {isSuccess && (
            <View style={styles.successOverlay}>
                <View style={styles.blurContainer}>
                    <BlurView 
                        intensity={Platform.OS === 'ios' ? 60 : 100} 
                        tint={dark ? "dark" : "light"} 
                        style={styles.blurCircle}
                    >
                        <MaterialCommunityIcons 
                            name="check" 
                            size={36} 
                            color={colors.onSurface} 
                        />
                    </BlurView>
                </View>
            </View>
          )}
        </Card>
      </Animated.View>
    </Pressable>
  );
};

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { favorites, removeFavorite } = useFavorites();
  const { colors, dark } = useTheme();
  const { settings } = useContext(SettingsContext);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [typeDialogVisible, setTypeDialogVisible] = useState(false);

  const scrollOffset = useRef(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    if (!previewVisible) {
      setToastVisible(false);
      setApplying(false);
    }
  }, [previewVisible]);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? "down" : "up";
    setIsScrollingDown(direction === "down");
    scrollOffset.current = currentOffset;
  };

  useEffect(() => {
    navigation.setParams({ isScrollingDown });
  }, [isScrollingDown]);

  const showToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const openPreview = (item) => {
    setSelected(item);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setSelected(null);
  };

  // ✅ UPDATED: Now accepts optional item argument for direct download
  const downloadImage = async (item) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast("Storage permission is needed to save images.", "error");
        return;
      }

      const targetPhoto = item || selected;
      const filename = `pixelwall_${targetPhoto?.id}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;

      const downloadUrl = getImageUrl(targetPhoto?.urls, "raw", "download");
      const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);
      await MediaLibrary.createAssetAsync(downloaded.uri);

      showToast("Image saved to gallery!", "success");
    } catch (err) {
      console.error("Download failed", err);
      showToast("Failed to download image.", "error");
    }
  };

  const applyWallpaper = async (wallpaperType = TYPE.HOME) => {
    if (applying || !selected) return;
    setApplying(true);
    showToast("Applying wallpaper...", "info");

    try {
      const downloadUrl = getImageUrl(selected.urls, "raw", "download");
      const filename = `pixelwall_apply_${selected.id}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;
      const downloaded = await FileSystem.downloadAsync(downloadUrl, fileUri);

      ManageWallpaper.setWallpaper(
        { uri: downloaded.uri },
        (res) => {
          setApplying(false);
          if (res.status === "success") {
            showToast(`Wallpaper applied to ${wallpaperType}!`, "success");
          } else {
            console.warn(res.msg);
            showToast("Could not apply wallpaper.", "error");
          }
        },
        wallpaperType
      );
    } catch (error) {
      console.error("Apply wallpaper failed:", error);
      showToast(`Apply wallpaper failed: ${error.message}`, "error");
      setApplying(false);
    }
  };

  const showInfo = () => {
    if (!selected) return;
    setInfoModalVisible(true);
  };

  const handleUnfavorite = (item) => {
    if (!item) return;
    removeFavorite(item.id);
    showToast("Removed from favorites", "info");
    closePreview();
  };

  // ✅ UPDATED: Use WallpaperCard instead of TouchableOpacity
  const renderItem = ({ item }) => (
    <WallpaperCard 
      item={item}
      settings={settings}
      onPress={openPreview}
      onLongPressSuccess={downloadImage}
    />
  );

  if (favorites.length === 0) {
    return (
      <View
        style={[styles.emptyContainer, { backgroundColor: colors.background }]}
      >
        <Text style={[styles.emptyText, { color: colors.onSurface }]}>
          No favorites yet.
        </Text>
        <Text style={[styles.emptySub, { color: colors.tabIcon }]}>
          Tap ❤️ on wallpapers to save them here.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
      
         style={{ marginTop: 4 }}
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={{ padding: CARD_MARGIN, paddingBottom: 100 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Toast rendered at root for visibility */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <Modal
        visible={previewVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={closePreview}
      >
        <View
          style={[
            styles.previewContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Image
            source={{
              uri: getImageUrl(
                selected?.urls,
                settings.wallpaperQuality,
                "preview"
              ),
            }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          <TouchableOpacity style={styles.closeButton} onPress={closePreview}>
            <IconButton icon="close" size={26} iconColor="#fff" />
          </TouchableOpacity>

          {/* Duplicate Toast inside Modal for visibility over preview */}
          <Toast
            visible={toastVisible}
            message={toastMessage}
            type={toastType}
            onHide={() => setToastVisible(false)}
          />

          <BlurView
            intensity={80}
            tint={dark ? "dark" : "light"}
            style={[
              styles.floatingBar,
              {
                backgroundColor: dark
                  ? "rgba(22,22,22,0.7)"
                  : "rgba(200,200,200,0.6)",
              },
            ]}
          >
            <TouchableOpacity style={styles.iconContainer} onPress={showInfo}>
              <IconButton
                icon="information-outline"
                size={24}
                iconColor={colors.tabIcon}
              />
              <Text style={[styles.iconLabel, { color: colors.tabIcon }]}>
                Info
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setTypeDialogVisible(true)}
              disabled={applying}
            >
              <IconButton
                icon={applying ? "clock-outline" : "image-plus"}
                size={24}
                iconColor={colors.tabIcon}
              />
              <Text style={[styles.iconLabel, { color: colors.tabIcon }]}>
                {applying ? "Applying..." : "Apply"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => handleUnfavorite(selected)}
            >
              <IconButton
                icon="heart-off-outline"
                size={24}
                iconColor="#ff4081"
              />
              <Text style={[styles.iconLabel, { color: "#ff4081" }]}>
                Unfavorite
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => downloadImage(null)} // Pass null to use 'selected'
            >
              <IconButton icon="download" size={24} iconColor={colors.tabIcon} />
              <Text style={[styles.iconLabel, { color: colors.tabIcon }]}>
                Download
              </Text>
            </TouchableOpacity>
          </BlurView>
        </View>

        <InfoModal
          visible={infoModalVisible}
          onClose={() => setInfoModalVisible(false)}
          photo={selected}
        />

        <WallpaperTypeDialog
          visible={typeDialogVisible}
          onClose={() => setTypeDialogVisible(false)}
          onSelect={(key) => {
            const type =
              key === "home"
                ? TYPE.HOME
                : key === "lock"
                ? TYPE.LOCK
                : TYPE.BOTH;
            applyWallpaper(type);
          }}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardWrapper: { margin: CARD_MARGIN / 2 },
  card: { width: CARD_WIDTH, borderRadius: 12, overflow: "hidden" },
  // ✅ Added Styles for Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.15)'
  },
  blurContainer: {
    overflow: "hidden",
    borderRadius: 30,
  },
  blurCircle: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 18, fontWeight: "bold" },
  emptySub: { fontSize: 14, marginTop: 8 },
  previewContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  previewImage: { width, height },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 15,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
  },
  floatingBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 28,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconLabel: { fontSize: 12, marginTop: -4 },
});

export default FavoritesScreen;