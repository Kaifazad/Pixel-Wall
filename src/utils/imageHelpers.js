// src/utils/imageHelpers.js

/**
 * Selects the best image URL based on the user's quality setting.
 * @param {object} urls - The 'urls' object from the Unsplash API (item.urls)
 * @param {string} quality - The quality setting ('low', 'medium', 'high', 'raw')
 * @param {string} type - The display type ('grid' or 'preview')
 * @returns {string} The best available image URL
 */
export const getImageUrl = (urls, quality, type = 'preview') => {
  if (!urls) {
    return null; // Return null if urls are missing
  }

  // For downloads, always use 'raw'
  if (type === 'download') {
    return urls.raw || urls.full || urls.regular;
  }

  // For grid/thumbnails
  if (type === 'grid') {
    switch (quality) {
      case 'low':
        return urls.thumb || urls.small;
      case 'medium':
        return urls.small || urls.regular;
      case 'high':
      case 'raw':
        return urls.regular || urls.small; // 'regular' is max for grid
      default:
        return urls.small || urls.regular;
    }
  }

  // For preview/full-screen
  if (type === 'preview') {
    switch (quality) {
      case 'low':
        return urls.small || urls.regular;
      case 'medium':
        return urls.regular || urls.full;
      case 'high':
        return urls.full || urls.regular;
      case 'raw':
        return urls.raw || urls.full || urls.regular;
      default:
        return urls.full || urls.regular;
    }
  }

  // Fallback
  return urls.regular || urls.full || urls.small;
};