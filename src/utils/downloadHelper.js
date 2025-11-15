// src/utils/downloadHelper.js
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const saveToPixelWall = async (photoUrl, photoId) => {
  try {
    // 1. Request Permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Storage permission not granted");
    }

    // 2. Download to Cache
    const filename = `pixelwall_${photoId}.jpg`;
    const fileUri = FileSystem.cacheDirectory + filename;
    
    const { uri } = await FileSystem.downloadAsync(photoUrl, fileUri);

    // 3. Create Asset
    const asset = await MediaLibrary.createAssetAsync(uri);

    // 4. Check if Album "Pixel Wall" exists
    const album = await MediaLibrary.getAlbumAsync("Pixel Wall");

    if (album == null) {
      // Create Album and COPY the asset (copyAsset: true)
      // 'true' avoids the "modify" permission prompt on Android 10+
      await MediaLibrary.createAlbumAsync("Pixel Wall", asset, true);
    } else {
      // Add to existing Album and COPY the asset (copyAsset: true)
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
    }

    // 5. Success Feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return true;

  } catch (error) {
    console.error("Save Error:", error);
    throw error;
  }
};