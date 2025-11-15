// src/components/WallpaperTypeDialog.js
import React from "react";
import { View, Pressable, StyleSheet, Modal } from "react-native";
import { useTheme, Text, IconButton } from "react-native-paper";

const WallpaperTypeDialog = ({ visible, onClose, onSelect }) => {
  const { colors } = useTheme();

  const options = [
    { key: "home", label: "Home Screen", icon: "home-outline" },
    { key: "lock", label: "Lock Screen", icon: "lock-outline" },
    { key: "both", label: "Both", icon: "image-multiple-outline" },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              Set Wallpaper
            </Text>
            <IconButton
              icon="close"
              size={22}
              iconColor={colors.onSurface}
              onPress={onClose}
            />
          </View>

          <Text
            style={[
              styles.subtitle,
              { color: colors.secondary, borderBottomColor: colors.outline },
            ]}
          >
            Choose where to apply this wallpaper
          </Text>

          {options.map((opt) => (
            <Pressable
              key={opt.key}
              style={styles.optionRow}
              android_ripple={{ color: colors.primary, borderless: false }}
              onPress={() => {
                onSelect(opt.key);
                onClose();
              }}
            >
              <View style={styles.optionContent}>
                <IconButton icon={opt.icon} size={24} iconColor={colors.primary} />
                <Text style={[styles.optionText, { color: colors.onSurface }]}>
                  {opt.label}
                </Text>
              </View>
            </Pressable>
          ))}
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
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    paddingBottom: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    marginLeft: 8,
  },
});

export default WallpaperTypeDialog;
