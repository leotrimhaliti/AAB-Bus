import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  BUS_LOCATIONS: 'bus_locations_cache',
  LAST_UPDATE: 'last_update_timestamp',
};

export const cache = {
  async saveBusLocations(data: any) {
    try {
      await AsyncStorage.setItem(CACHE_KEYS.BUS_LOCATIONS, JSON.stringify(data));
      await AsyncStorage.setItem(CACHE_KEYS.LAST_UPDATE, new Date().toISOString());
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  },

  async getBusLocations() {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEYS.BUS_LOCATIONS);
      const lastUpdate = await AsyncStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      
      if (!data) return null;
      
      return {
        data: JSON.parse(data),
        lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
      };
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  },

  async clearCache() {
    try {
      await AsyncStorage.removeItem(CACHE_KEYS.BUS_LOCATIONS);
      await AsyncStorage.removeItem(CACHE_KEYS.LAST_UPDATE);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },
};
