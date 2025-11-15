// src/screens/CollectionsScreen.js
import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Image,
  Modal,
  Text,
  Animated, // ✅ Added
  Pressable, // ✅ Added
  Platform, // ✅ Added
} from "react-native";
import {
  Card,
  ActivityIndicator,
  IconButton,
  useTheme,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { BlurView } from "expo-blur";
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
const BASE_URL =
  "https://pixelwall-api.netlify.app/.netlify/functions/wallpapers";

// Layout constants (Matched to HomeScreen)
const NUM_COLUMNS = 2;
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - CARD_MARGIN * (NUM_COLUMNS * 2)) / NUM_COLUMNS;

// ✅ REUSED WALLPAPER CARD COMPONENT
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

const CollectionsScreen = () => {
  const navigation = useNavigation();
  const [collections, setCollections] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collectionPhotos, setCollectionPhotos] = useState([]);
  const [photosPage, setPhotosPage] = useState(1);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [typeDialogVisible, setTypeDialogVisible] = useState(false);

  const { colors, dark } = useTheme();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useContext(SettingsContext);

  const scrollOffset = useRef(0);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    navigation.setParams({ isScrollingDown });
  }, [isScrollingDown]);

  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > scrollOffset.current ? "down" : "up";
    setIsScrollingDown(direction === "down");
    scrollOffset.current = currentOffset;
  };

  const showToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const loadCollections = async (pageToLoad = 1, replace = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}?endpoint=collections&page=${pageToLoad}`
      );
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];
      const filtered = items.filter((item) => {
        const titleLower = item.title.toLowerCase();
        return (
          !titleLower.includes("unsplash+") &&
          !titleLower.includes("unsplash plus")
        );
      });
      setCollections((prev) =>
        pageToLoad === 1 || replace ? filtered : [...prev, ...filtered]
      );
      setPage(pageToLoad);
    } catch (err) {
      console.error("Failed to fetch collections", err);
      showToast("Could not load collections.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCollections(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCollections(1, true);
  };

  const loadMoreCollections = () => {
    if (!loading) loadCollections(page + 1);
  };

  const openCollection = async (collection) => {
    setSelectedCollection(collection);
    setCollectionPhotos([]);
    setPhotosPage(1);
    await loadCollectionPhotos(collection.id, 1, true);
  };

  const closeCollection = () => {
    setSelectedCollection(null);
    setCollectionPhotos([]);
  };

  const loadCollectionPhotos = async (id, pageToLoad = 1, replace = false) => {
    try {
      const res = await fetch(
        `${BASE_URL}?endpoint=collections/${id}/photos&page=${pageToLoad}`
      );
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.results || [];
      setCollectionPhotos((prev) =>
        replace ? items : [...prev, ...items]
      );
      setPhotosPage(pageToLoad);
    } catch (err) {
      console.error("Error loading collection photos", err);
      showToast("Failed to load collection photos.", "error");
    }
  };

  const loadMoreCollectionPhotos = () => {
    if (loadingMorePhotos) return;
    setLoadingMorePhotos(true);
    loadCollectionPhotos(selectedCollection.id, photosPage + 1).finally(() =>
      setLoadingMorePhotos(false)
    );
  };

  const openPhotoPreview = (photo) => {
    setSelectedPhoto(photo);
    setPreviewVisible(true);
  };

  const closePhotoPreview = () => {
    setPreviewVisible(false);
    setSelectedPhoto(null);
  };

  // ✅ UPDATED: Now accepts optional item for direct download
  const downloadImage = async (item) => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast("Storage permission is needed to save images.", "error");
        return;
      }

      const targetPhoto = item || selectedPhoto;
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
    if (applying || !selectedPhoto) return;
    setApplying(true);
    showToast("Applying wallpaper...", "info");

    try {
      const downloadUrl = getImageUrl(selectedPhoto.urls, "raw", "download");
      const filename = `pixelwall_apply_${selectedPhoto.id}.jpg`;
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
    if (!selectedPhoto) return;
    setInfoModalVisible(true);
  };

  const handleFavoriteToggle = () => {
    if (!selectedPhoto) return;
    if (isFavorite(selectedPhoto.id)) {
      removeFavorite(selectedPhoto.id);
      showToast("Removed from favorites", "info");
    } else {
      addFavorite(selectedPhoto);
      showToast("Added to favorites!", "success");
    }
  };

  const renderCollection = ({ item }) => {
    const cover = item.cover_photo?.urls?.regular || item.cover_photo?.urls?.small;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openCollection(item)}
        style={styles.cardWrapper}
      >
        <Card style={styles.card} mode="elevated" elevation={3}>
          {cover ? (
            <Image source={{ uri: cover }} style={styles.image} />
          ) : (
            <View style={[styles.noImage, { backgroundColor: colors.surface }]} />
          )}
          <View style={styles.overlay}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.count}>{item.total_photos} photos</Text>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // ✅ UPDATED: Uses WallpaperCard instead of TouchableOpacity
  const renderPhoto = ({ item }) => (
    <WallpaperCard 
      item={item}
      settings={settings}
      onPress={openPhotoPreview}
      onLongPressSuccess={downloadImage}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {loading && collections.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
        
         style={{ marginTop: 4 }}
          data={collections}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderCollection}
          numColumns={NUM_COLUMNS}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMoreCollections}
          onEndReachedThreshold={0.6}
          contentContainerStyle={{
            padding: CARD_MARGIN,
            paddingBottom: 100,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      {/* --- Collection Photos Modal --- */}
      <Modal visible={!!selectedCollection} animationType="slide" onRequestClose={closeCollection}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>
              {selectedCollection?.title || "Collection"}
            </Text>
            <IconButton
              icon="close"
              size={26}
              iconColor={colors.onSurface}
              onPress={closeCollection}
            />
          </View>

          <FlatList
            data={collectionPhotos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPhoto}
            numColumns={NUM_COLUMNS}
            onEndReached={loadMoreCollectionPhotos}
            onEndReachedThreshold={0.6}
            contentContainerStyle={{ 
                padding: CARD_MARGIN, 
                paddingBottom: 100 
            }}
            ListFooterComponent={
              loadingMorePhotos ? <ActivityIndicator style={{ margin: 16 }} /> : null
            }
          />
        </View>

        {/* --- Photo Preview Modal --- */}
        <Modal
          visible={previewVisible}
          animationType="fade"
          transparent
          onRequestClose={closePhotoPreview}
        >
          <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
            <Image
              source={{
                uri: getImageUrl(selectedPhoto?.urls, settings.wallpaperQuality, "preview"),
              }}
              style={styles.previewImage}
              resizeMode="contain"
            />

            <TouchableOpacity style={styles.closeButton} onPress={closePhotoPreview}>
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
                onPress={handleFavoriteToggle}
              >
                <IconButton
                  icon={isFavorite(selectedPhoto?.id) ? "heart" : "heart-outline"}
                  size={24}
                  iconColor={
                    isFavorite(selectedPhoto?.id) ? "#ff4081" : colors.tabIcon
                  }
                />
                <Text
                  style={[
                    styles.iconLabel,
                    {
                      color: isFavorite(selectedPhoto?.id)
                        ? "#ff4081"
                        : colors.tabIcon,
                    },
                  ]}
                >
                  Favorite
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconContainer} onPress={() => downloadImage(null)}>
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
            photo={selectedPhoto}
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
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  cardWrapper: {
    margin: CARD_MARGIN / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: (CARD_WIDTH * 4) / 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  // ✅ Success Overlay Styles
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
  image: { width: "100%", height: "100%" },
  photo: {
    width: CARD_WIDTH,
    height: (CARD_WIDTH * 4) / 3,
    borderRadius: 12,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: { color: "#fff", fontSize: 15, fontWeight: "600" },
  count: { color: "#ccc", fontSize: 12, marginTop: 1 },
  noImage: {
    flex: 1,
    height: (CARD_WIDTH * 4) / 3, 
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 40,
    paddingBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
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
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  iconContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconLabel: { fontSize: 12, marginTop: -4 },
});

export default CollectionsScreen;