// src/components/PaymentMethodModal.js
import React from 'react';
import { View, StyleSheet, Modal, Pressable, Linking, Alert } from 'react-native';
import { useTheme, Text, List, IconButton } from 'react-native-paper';

// ✅ UPDATED: Replaced placeholder with your URL
const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/kaifazad';

const PaymentMethodModal = ({ visible, onClose, item }) => {
  const { colors, dark } = useTheme();

  if (!item) return null;

  const handleWebPayment = async () => {
    onClose(); // Close the modal first
    try {
      const supported = await Linking.canOpenURL(BUY_ME_A_COFFEE_URL);
      if (supported) {
        await Linking.openURL(BUY_ME_A_COFFEE_URL);
      } else {
        Alert.alert("Error", "Cannot open this link.");
      }
    } catch (err) {
      console.error("Failed to open link", err);
      Alert.alert("Error", "An unknown error occurred.");
    }
  };

  const handleGooglePlay = () => {
    onClose();
    Alert.alert(
      "Coming Soon",
      "Native Google Play payments are not yet enabled. Please use the 'Pay with UPI / Card' option for now."
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onClose}
      >
        <Pressable
          style={[styles.modalCard, { backgroundColor: colors.surface }]}
          onPress={() => {}} // Stop backdrop press
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.onSurface }]}>
              {item.title}
            </Text>
            <IconButton
              icon="close"
              size={22}
              iconColor={colors.onSurface}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>
          <Text style={[styles.price, { color: colors.primary }]}>{item.price}</Text>

          <List.Item
            title="Pay with UPI / Card"
            description="Uses Buy Me a Coffee (web)"
            left={(props) => <List.Icon {...props} icon="credit-card" />}
            right={(props) => <List.Icon {...props} icon="open-in-new" />}
            onPress={handleWebPayment}
            style={styles.option}
          />
          <List.Item
            title="Pay via Google Play"
            description="Coming Soon"
            left={(props) => <List.Icon {...props} icon="google-play" />}
            onPress={handleGooglePlay}
            style={styles.option}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28, // Matches your other custom modals
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 12,
    paddingVertical: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    margin: 0,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});

export default PaymentMethodModal;