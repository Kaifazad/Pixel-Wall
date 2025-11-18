// src/api/api.js
import axios from 'axios';

const YOUR_NETLIFY_FUNCTION_URL = 'https://pixelwall-api.netlify.app/.netlify/functions/wallpapers';

const api = axios.create({
  baseURL: YOUR_NETLIFY_FUNCTION_URL,
  timeout: 10000,
});

const fetchData = async (params) => {
  try {
    const response = await api.get('', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching from Netlify function:', error);
    throw error;
  }
};


export const fetchWallpapers = (page = 1, per_page = 20) => {
  return fetchData({
    endpoint: 'photos',
    page,
    per_page,
  });
};

export const fetchCollectionPhotos = (collectionId, page = 1, per_page = 20) => {
  return fetchData({
    endpoint: `collections/${collectionId}/photos`,
    page,
    per_page,
  });
};

export const searchWallpapers = (query, page = 1, per_page = 20) => {
  return fetchData({
    endpoint: 'search',
    query,
    page,
    per_page,
  });
};

export default {
  fetchWallpapers,
  fetchCollectionPhotos,
  searchWallpapers,
};
