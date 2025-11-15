// src/screens/HomeScreen.js
import React, {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useContext,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
  Platform,
  Text,
  BackHandler,
  Animated,
  Pressable,
} from "react-native";
import {
  Card,
  ActivityIndicator,
  IconButton,
  useTheme,
} from "react-native-paper";
import * as Haptics from "expo-haptics";
import api from "../api/api";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { useFavorites } from "../context/FavoritesContext";
import { BlurView } from "expo-blur";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "../components/Toast";
import { SettingsContext } from "../context/SettingsContext";
import { getImageUrl } from "../utils/imageHelpers";
import InfoModal from "../components/InfoModal";
import ManageWallpaper, { TYPE } from "react-native-manage-wallpaper";
import WallpaperTypeDialog from "../components/WallpaperTypeDialog";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width, height } = Dimensions.get("window");
const NUM_COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS * 2)) / NUM_COLUMNS;

const randomCategories = [
  "Nature",
  "Landscape",
  "Mountains",
  "Minimal",
  "Space",
  "Trees",
  "Patterns",
  "Abstract",
];

// ✅ REFINED WALLPAPER CARD
const WallpaperCard = ({ item, settings, onPress, onLongPressSuccess }) => {
  const { colors, dark } = useTheme(); // Get theme internally
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

      // ✅ SQUEEZE ANIMATION ONLY (No Border)
      Animated.timing(scaleAnim, {
        toValue: 0.90, // Squeezes to 90% size
        duration: 300,
        useNativeDriver: true, // Smooth native animation
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

    // Keep success visible for 1.5s then reset
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
            // Removed border styles completely
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
          
          {/* ✅ UI-MATCHING BLUR OVERLAY */}
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
                            color={colors.onSurface} // Adaptive color (Black/White)
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

const HomeScreen = forwardRef(({ searchQuery, clearSearch }, ref) => {
  const navigation = useNavigation();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { colors, dark } = useTheme();
  const { settings } = useContext(SettingsContext);

  const [page, setPage] = useState(1);
  const [wallpapers, setWallpapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  
  const isSearchMode = searchQuery && searchQuery.trim().length > 0;
  const flatListRef = useRef(null);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [activeRandomQuery, setActiveRandomQuery] = useState("");
  const [applying, setApplying] = useState(false);
  const [typeDialogVisible, setTypeDialogVisible] = useState(false);

  useEffect(() => {
    if (!previewVisible) {
      setToastVisible(false);
      setApplying(false);
    }
  }, [previewVisible]);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    },
  }));

  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const scrollOffset = useRef(0);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? "down" : "up";
    setIsScrollingDown(direction === "down");
    scrollOffset.current = currentOffset;
  };

  useEffect(() => {
    navigation.setParams({ isScrollingDown });
  }, [isScrollingDown]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isSearchMode) {
          clearSearch();
          return true;
        }
        return false;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [isSearchMode])
  );

  const setRandomQuery = () => {
    const query =
      randomCategories[Math.floor(Math.random() * randomCategories.length)];
    setActiveRandomQuery(query);
  };

  useEffect(() => {
    setRandomQuery();
  }, []);

  const loadWallpapers = async (pageToLoad = 1, replace = false) => {
    if (loading || loadingMore) return;
    try {
      if (pageToLoad === 1) setLoading(true);
      else setLoadingMore(true);

      let data;
      let pageToFetch;

      if (isSearchMode) {
        if (pageToLoad === 1) {
            pageToFetch = Math.floor(Math.random() * 10) + 1; 
        } else {
            pageToFetch = pageToLoad;
        }
        data = await api.searchWallpapers(searchQuery, pageToFetch, 20);
      } else {
        if (!activeRandomQuery) return;
        pageToFetch =
          pageToLoad === 1 ? Math.floor(Math.random() * 50) + 1 : pageToLoad;
        data = await api.searchWallpapers(activeRandomQuery, pageToFetch, 20);
      }

      const items = Array.isArray(data) ? data : data.results || [];
      if (replace) setWallpapers(items);
      else
        setWallpapers((prev) =>
          pageToLoad === 1 ? items : [...prev, ...items]
        );

      setHasMore(items.length > 0);
      setPage(pageToFetch);
    } catch (err) {
      console.warn("Failed to load wallpapers", err);
      showToast("Could not fetch wallpapers.", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeRandomQuery || isSearchMode) {
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
      loadWallpapers(1, true);
    }
  }, [searchQuery, activeRandomQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    if (isSearchMode) {
      loadWallpapers(1, true);
    } else {
      setRandomQuery();
    }
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    loadWallpapers(page + 1);
  };

  const openPreview = (item) => {
    setSelected(item);
    setPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewVisible(false);
    setSelected(null);
  };

  const showToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

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

  const chooseWallpaperType = () => {
    setTypeDialogVisible(true);
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

  const handleFavoriteToggle = () => {
    if (!selected) return;
    if (isFavorite(selected.id)) {
      removeFavorite(selected.id);
      showToast("Removed from favorites", "info");
    } else {
      addFavorite(selected);
      showToast("Added to favorites!", "success");
    }
  };

  const renderItem = ({ item }) => (
    <WallpaperCard 
      item={item} 
      settings={settings}
      onPress={openPreview}
      onLongPressSuccess={downloadImage}
    />
  );

  const ListFooter = () =>
    loadingMore ? (
      <View style={{ padding: 12 }}>
        <ActivityIndicator animating />
      </View>
    ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && wallpapers.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" animating />
        </View>
      ) : (
        <FlatList
         style={{ marginTop: 4 }}
          ref={flatListRef}
          data={wallpapers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={{ padding: CARD_MARGIN, paddingBottom: 100 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />

      <Modal
        visible={previewVisible}
        animationType="fade"
        onRequestClose={closePreview}
        transparent={true}
      >
        <View
          style={[styles.previewContainer, { backgroundColor: colors.background }]}
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
              onPress={chooseWallpaperType}
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
              onPress={handleFavoriteToggle}
            >
              <IconButton
                icon={isFavorite(selected?.id) ? "heart" : "heart-outline"}
                size={24}
                iconColor={
                  isFavorite(selected?.id) ? "#ff4081" : colors.tabIcon
                }
              />
              <Text
                style={[
                  styles.iconLabel,
                  {
                    color: isFavorite(selected?.id)
                      ? "#ff4081"
                      : colors.tabIcon,
                  },
                ]}
              >
                Favorite
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => downloadImage(null)} 
            >
              <IconButton
                icon="download"
                size={24}
                iconColor={colors.tabIcon}
              />
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
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: { margin: CARD_MARGIN / 2 },
  card: { 
    width: CARD_WIDTH, 
    borderRadius: 12, 
    overflow: "hidden",
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.15)' // Very subtle dim
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
  previewContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  iconContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: -4,
  },
});

export default HomeScreen;