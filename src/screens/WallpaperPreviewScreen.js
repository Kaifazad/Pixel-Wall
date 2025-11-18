// src/screens/WallpaperPreviewScreen.js
import React, { useContext, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import { IconButton, useTheme } from "react-native-paper";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import { BlurView } from "expo-blur";
import { FavoritesContext } from "../context/FavoritesContext";
import { useNavigation } from "@react-navigation/native";
import Toast from "../components/Toast";
import InfoModal from "../components/InfoModal";
import { SettingsContext } from "../context/SettingsContext";
import { getImageUrl } from "../utils/imageHelpers";
import ManageWallpaper, { TYPE } from "react-native-manage-wallpaper";
import WallpaperTypeDialog from "../components/WallpaperTypeDialog"; 

const { width, height } = Dimensions.get("window");

const WallpaperPreviewScreen = ({ route }) => {
  const { photo } = route.params;
  const navigation = useNavigation();
  const { colors, dark } = useTheme();
  const { addFavorite, removeFavorite, isFavorite } =
    useContext(FavoritesContext);
  const { settings } = useContext(SettingsContext);
  const isFav = isFavorite(photo.id);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info");
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [applying, setApplying] = useState(false);
  const [typeDialogVisible, setTypeDialogVisible] = useState(false); 

  useEffect(() => {
    return () => {
      setToastVisible(false);
      setApplying(false);
    };
  }, []);

  const showToast = (message, type = "info") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const downloadImage = async () => {
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        showToast("Please allow storage access to save wallpapers.", "error");
        return;
      }
      const filename = `pixelwall_${photo.id}.jpg`;
      const fileUri = FileSystem.cacheDirectory + filename;
      const downloadUrl = getImageUrl(photo.urls, "raw", "download");
      const { uri } = await FileSystem.downloadAsync(downloadUrl, fileUri);
      await MediaLibrary.createAssetAsync(uri);
      showToast("Wallpaper saved to your gallery!", "success");
    } catch (error) {
      console.error("Download failed:", error);
      showToast(error.message || "Failed to download wallpaper.", "error");
    }
  };

  
  const chooseWallpaperType = () => {
    setTypeDialogVisible(true);
  };

  const applyWallpaper = async (wallpaperType = TYPE.HOME) => {
    if (applying || !photo) return;
    setApplying(true);
    showToast("Applying wallpaper...", "info");

    try {
      const downloadUrl = getImageUrl(photo.urls, "raw", "download");
      const filename = `pixelwall_apply_${photo.id}.jpg`;
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

  const toggleFavorite = () => {
    if (isFav) {
      removeFavorite(photo.id);
      showToast("Removed from favorites", "info");
    } else {
      addFavorite(photo);
      showToast("Added to favorites!", "success");
    }
  };

  const showInfo = () => {
    setInfoModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={{
          uri: getImageUrl(photo.urls, settings.wallpaperQuality, "preview"),
        }}
        style={styles.image}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
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

        <TouchableOpacity style={styles.iconContainer} onPress={toggleFavorite}>
          <IconButton
            icon={isFav ? "heart" : "heart-outline"}
            size={24}
            iconColor={isFav ? "#ff4081" : colors.tabIcon}
          />
          <Text
            style={[
              styles.iconLabel,
              { color: isFav ? "#ff4081" : colors.tabIcon },
            ]}
          >
            Favorite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconContainer} onPress={downloadImage}>
          <IconButton icon="download" size={24} iconColor={colors.tabIcon} />
          <Text style={[styles.iconLabel, { color: colors.tabIcon }]}>
            Download
          </Text>
        </TouchableOpacity>
      </BlurView>

      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
        photo={photo}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { width, height },
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

export default WallpaperPreviewScreen;
