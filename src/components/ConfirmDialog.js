// src/components/ConfirmDialog.js
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Button, Text, useTheme } from 'react-native-paper';

const ConfirmDialog = ({ visible, title, message, onClose, onConfirm }) => {
  const { colors } = useTheme();

  return (
    <Dialog
      visible={visible}
      onDismiss={onClose}
      style={{ backgroundColor: colors.surface }}
    >
      <Dialog.Title style={{ color: colors.onSurface }}>
        {title}
      </Dialog.Title>
      <Dialog.Content>
        <Text style={{ color: colors.onSurface, lineHeight: 22 }}>
          {message}
        </Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onClose} textColor={colors.secondary}>
          Cancel
        </Button>
        <Button onPress={onConfirm} textColor={colors.primary}>
          Yes
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
};

export default ConfirmDialog;