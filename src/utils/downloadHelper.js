// src/utils/downloadHelper.js
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const saveToPixelWall = async (photoUrl, photoId) => {
  try {
   
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Storage permission not granted");
    }

   
    const filename = `pixelwall_${photoId}.jpg`;
    const fileUri = FileSystem.cacheDirectory + filename;
    const { uri } = await FileSystem.downloadAsync(photoUrl, fileUri);
    const asset = await MediaLibrary.createAssetAsync(uri);
    const album = await MediaLibrary.getAlbumAsync("Pixel Wall");

    if (album == null) {
      await MediaLibrary.createAlbumAsync("Pixel Wall", asset, true);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;

  } catch (error) {
    console.error("Save Error:", error);
    throw error;
  }
};
