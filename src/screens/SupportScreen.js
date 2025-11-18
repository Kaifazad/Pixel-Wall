// src/screens/SupportScreen.js
import React, { useState } from 'react'; 
import { View, StyleSheet, ScrollView, Alert, Linking, Modal } from 'react-native';
import { Appbar, Text, useTheme, Card, List } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import PaymentMethodModal from '../components/PaymentMethodModal'; 


const donationItems = [
  {
    id: 'boost',
    title: 'Pixel Boost',
    description: 'A small boost to keep the servers running and pixels flowing',
    price: '₹250.00',
  },
  {
    id: 'fuel',
    title: 'Feature Fuel',
    description: 'Help fund a new feature or improvement for the app',
    price: '₹450.00',
  },
  {
    id: 'dinner',
    title: 'Developer Dinner',
    description: "That's one whole evening dedicated to coding new stuff!",
    price: '₹850.00',
  },
  {
    id: 'legend',
    title: 'Legend Supporter',
    description: 'Wow! This is legendary. You keep the project alive.',
    price: '₹1,500.00',
  },
];

const SupportScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

 
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

 
  const handleDonationPress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  
    setTimeout(() => {
      setSelectedItem(null);
    }, 200);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Support Development"
          titleStyle={{
            fontSize: 22,
            fontWeight: 'bold',
            color: colors.onSurface,
          }}
          style={{ marginLeft: -8 }}
        />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* --- Header Text --- */}
        <View style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerText, { color: colors.onSurface }]}>
            Hello 👋,
          </Text>
          <Text style={[styles.bodyText, { color: colors.secondary }]}>
            I'm Kaif Azad, the developer of Pixel Wall. If you want to support
            the app, you can choose one of the options below.
          </Text>
        </View>

        {/* --- Donation Items --- */}
        {donationItems.map((item) => (
          <Card
            key={item.id}
            style={[styles.donationCard, { backgroundColor: colors.surface }]}
            onPress={() => handleDonationPress(item)} // ✅ 5. Call new handler
          >
            <List.Item
              title={item.title}
              description={item.description}
              descriptionNumberOfLines={2}
              titleStyle={{ fontWeight: 'bold' }}
              right={() => (
                <Text style={[styles.priceText, { color: colors.onSurface }]}>
                  {item.price}
                </Text>
              )}
            />
          </Card>
        ))}
      </ScrollView>

      {/*  Add the new modal component */}
      <PaymentMethodModal 
        visible={modalVisible}
        onClose={closeModal}
        item={selectedItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    gap: 16,
  },
  headerCard: {
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
  },
  donationCard: {
    borderRadius: 16,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    alignSelf: 'center',
    paddingRight: 16,
  },
});

export default SupportScreen;
