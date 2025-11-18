// src/components/InfoModal.js
import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  Pressable,
  Linking,
  ScrollView,
} from "react-native";
import { useTheme, IconButton, List } from "react-native-paper";


const formatNumber = (num) => {
  const number = Number(num) || 0; 
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1) + "M";
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(1) + "K";
  }
  return String(number); 
};

const InfoModal = ({ visible, onClose, photo }) => {
  const { colors, dark } = useTheme();

  if (!photo) {
    return null;
  }

  const details = {
    photographer: photo.user?.name || "Unknown",
    portfolio: photo.user?.portfolio_url,
    description: photo.description || photo.alt_description || "No description",
    resolution: `${photo.width} x ${photo.height}`,
    likes: formatNumber(photo.likes),
    color: photo.color, 
  };

  const exif = photo.exif;
  
  const hasExifData = exif && (
    exif.make || 
    exif.model || 
    exif.exposure_time || 
    exif.aperture || 
    exif.focal_length || 
    exif.iso
  );

  const openPortfolio = () => {
    if (details.portfolio) {
      Linking.openURL(details.portfolio);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          styles.backdrop,
          { backgroundColor: dark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.5)" },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.surface }]}
          onPress={() => {}}
        >
          <ScrollView>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.onSurface }]}>
                Details
              </Text>
              <IconButton
                icon="close"
                size={22}
                iconColor={colors.onSurface}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {/* --- Main Details --- */}
            <List.Section>
              <List.Item
                title="Photographer"
                description={details.photographer}
                left={(props) => <List.Icon {...props} icon="camera-account" />}
                right={(props) =>
                  details.portfolio ? (
                    <IconButton
                      {...props}
                      icon="open-in-new"
                      size={20}
                      onPress={openPortfolio}
                    />
                  ) : null
                }
                onPress={details.portfolio ? openPortfolio : null}
              />
            </List.Section>
            
            {/* --- Stats --- */}
            <List.Section>
              <List.Subheader>STATS</List.Subheader>
              <List.Item
                title="Resolution"
                description={details.resolution}
                left={(props) => <List.Icon {...props} icon="fullscreen" />}
              />
              <List.Item
                title="Likes"
                description={details.likes}
                left={(props) => <List.Icon {...props} icon="heart" />}
              />
              {details.color && (
                <List.Item
                  title="Dominant Color"
                  description={details.color.toUpperCase()} // ✅ Show HEX code
                  left={(props) => <List.Icon {...props} icon="palette" />}
                  right={() => (
                    <View style={[styles.colorChip, { backgroundColor: details.color }]} />
                  )}
                />
              )}
            </List.Section>

            {/* --- Description --- */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.descTitle, { color: colors.onSurface }]}>
                Description
              </Text>
              <Text style={[styles.descText, { color: colors.secondary }]}>
                {details.description}
              </Text>
            </View>

            {/* --- Camera (Exif) Details --- */}
            {hasExifData && (
              <List.Section>
                <List.Subheader>CAMERA</List.Subheader>
                {exif.make && (
                  <List.Item
                    title="Make"
                    description={exif.make}
                    left={(props) => <List.Icon {...props} icon="camera-iris" />}
                  />
                )}
                {exif.model && (
                  <List.Item
                    title="Model"
                    description={exif.model}
                    left={(props) => <List.Icon {...props} icon="camera" />}
                  />
                )}
                {exif.exposure_time && (
                  <List.Item
                    title="Exposure"
                    description={`${exif.exposure_time}s`}
                    left={(props) => <List.Icon {...props} icon="camera-timer" />}
                  />
                )}
                {exif.aperture && (
                  <List.Item
                    title="Aperture"
                    description={`ƒ/${exif.aperture}`}
                    left={(props) => <List.Icon {...props} icon="camera-gopro" />}
                  />
                )}
                {exif.focal_length && (
                  <List.Item
                    title="Focal Length"
                    description={`${exif.focal_length}mm`}
                    left={(props) => <List.Icon {...props} icon="image-filter-center-focus" />}
                  />
                )}
                {exif.iso && (
                  <List.Item
                    title="ISO"
                    description={exif.iso}
                    left={(props) => <List.Icon {...props} icon="iso" />}
                  />
                )}
              </List.Section>
            )}
            
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 28,
    paddingTop: 8,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    margin: 0,
  },
  descriptionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
  },
  descTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 20,
  },
  colorChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,0.5)',
  }
});

export default InfoModal;
