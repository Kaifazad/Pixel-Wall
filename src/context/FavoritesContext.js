// src/context/FavoritesContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext();

const STORAGE_KEY = '@pixelwall_favorites';

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState({});

 
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      if (jsonValue != null) {
        const parsed = JSON.parse(jsonValue);
        setFavorites(parsed);
      }
    } catch (error) {
      console.error('Failed to load favorites', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Failed to save favorites', error);
    }
  };

  const addFavorite = (photo) => {
    setFavorites((prev) => {
   
      const updated = { [photo.id]: photo, ...prev };
      saveFavorites(updated);
      return updated;
    });
  };

  const removeFavorite = (photoId) => {
    setFavorites((prev) => {
      const copy = { ...prev };
      delete copy[photoId];
      saveFavorites(copy);
      return copy;
    });
  };

  const isFavorite = (photoId) => !!favorites[photoId];

  return (
    <FavoritesContext.Provider
      value={{
       
        favorites: Object.values(favorites),
        addFavorite,
        removeFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoritesContext);
