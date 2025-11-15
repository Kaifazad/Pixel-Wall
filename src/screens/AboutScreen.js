// src/screens/AboutScreen.js
import React from "react";
import { View, StyleSheet, ScrollView, Linking, Alert, Image } from "react-native";
import { useTheme, Appbar, List, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";

// --- TODO: Replace these with your actual links ---
const GITHUB_URL = "https://github.com/your-username/pixelwall";
const RATE_APP_URL = "market://details?id=com.pixelwall";
const REPORT_BUG_URL = "https://github.com/your-username/pixelwall/issues";
const PRIVACY_POLICY_URL = "https://your-website.com/privacy";
const TERMS_CONDITIONS_URL = "https://your-website.com/terms";
// ---

const AboutScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();

  const openLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this link.");
      }
    } catch (err) {
      console.error("Failed to open link", err);
      Alert.alert("Error", "An unknown error occurred.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Appbar.Header style={{ backgroundColor: colors.surface }} elevated>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="About"
          titleStyle={{
            fontSize: 22,
            fontWeight: "bold",
            color: colors.onSurface,
          }}
          style={{ marginLeft: -8 }}
        />
      </Appbar.Header>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/icon.png')} 
            style={styles.logo}
          />
          <Text style={[styles.appName, { color: colors.onSurface }]}>
            Pixel Wall
          </Text>
          <Text style={[styles.appVersion, { color: colors.secondary }]}>
            Version 1.0.0
          </Text>
        </View>


        {/* Unsplash Section */}
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Item
            title="Unsplash"
            description="The internet’s source of freely-usable images"
            onPress={() => openLink("https://unsplash.com")}
            right={() => <List.Icon icon="open-in-new" />}
          />
        </List.Section>

        {/* App Section */}
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>PIXEL WALL</List.Subheader>
          <List.Item
            title="Support Development"
            description="If you like Pixel Wall, consider supporting it"
           
            onPress={() => navigation.navigate("Support")} 
            right={() => <List.Icon icon="chevron-right" />}
          />
          <List.Item
            title="GitHub"
            description="Pixel Wall is open-source, check it out on GitHub"
            onPress={() => openLink("https://github.com/Kaifazad/Pixel-Wall")}
            right={() => <List.Icon icon="open-in-new" />}
          />
          <List.Item
            title="Rate App"
            description="If you like Pixel Wall, rate it on the Play Store"
            onPress={() => openLink(RATE_APP_URL)}
            right={() => <List.Icon icon="open-in-new" />}
          />
          <List.Item
            title="Report Bug"
            description="Report bugs or request new features"
            onPress={() => openLink("https://github.com/Kaifazad/Pixel-Wall/issues")}
            right={() => <List.Icon icon="open-in-new" />}
          />
        </List.Section>

        {/* Developer Section - UPDATED */}
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>DEVELOPER</List.Subheader>
          <List.Item
            title="Kaif Azad"
            // Removed description="Developer" to avoid redundancy
            // Removed onPress to remove the link
            left={(props) => <List.Icon {...props} icon="account-circle-outline" />}
          />
        </List.Section>

        {/* Legal Section */}
        <List.Section style={[styles.section, { backgroundColor: colors.surface }]}>
          <List.Subheader>LEGAL</List.Subheader>
          <List.Item
            title="Privacy Policy"
            onPress={() => openLink("https://github.com/Kaifazad/Pixel-Wall/blob/main/PRIVACY_POLICY.md")}
            right={() => <List.Icon icon="chevron-right" />}
          />
          
         
        </List.Section>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  scrollContainer: {
    padding: 16,
    gap: 16,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 20,
  },
  appName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  appVersion: {
    fontSize: 14,
  },
  section: {
    borderRadius: 16,
    margin: 0,
  },
});

export default AboutScreen;