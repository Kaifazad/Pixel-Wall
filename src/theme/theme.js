// src/theme/theme.js
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

const darkColors = {
  ...MD3DarkTheme.colors,
  background: '#000000',
  surface: '#121212',
  primary: '#ffffff',
  secondary: '#bdbdbd',
  onPrimary: '#000000',
  onSurface: '#ffffff',
  elevation: {
    level0: '#000000',
    level1: '#1a1a1a',
    level2: '#222222',
    level3: '#2c2c2c',
    level4: '#333333',
    level5: '#383838',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: darkColors,
  roundness: 16,
};

const lightColors = {
  ...MD3LightTheme.colors,
  background: '#ffffff',
  surface: '#f4f4f4',
  primary: '#000000',
  secondary: '#555555',
  onPrimary: '#ffffff',
  onSurface: '#000000',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: lightColors,
  roundness: 16,
};
