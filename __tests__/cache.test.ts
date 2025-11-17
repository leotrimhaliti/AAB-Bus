import AsyncStorage from '@react-native-async-storage/async-storage';
import { cache } from '../lib/cache';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBusLocations', () => {
    it('should save bus locations to cache', async () => {
      const mockData = { bus1: { lat: '42.6', lng: '21.1', loc_valid: '1' } };
      
      await cache.saveBusLocations(mockData);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'bus_locations_cache',
        JSON.stringify(mockData)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'last_update_timestamp',
        expect.any(String)
      );
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.saveBusLocations({ test: 'data' });

      expect(consoleSpy).toHaveBeenCalledWith('Error saving to cache:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getBusLocations', () => {
    it('should retrieve cached bus locations', async () => {
      const mockData = { bus1: { lat: '42.6', lng: '21.1', loc_valid: '1' } };
      const mockTimestamp = new Date().toISOString();

      (AsyncStorage.getItem as jest.Mock)
        .mockResolvedValueOnce(JSON.stringify(mockData))
        .mockResolvedValueOnce(mockTimestamp);

      const result = await cache.getBusLocations();

      expect(result).toEqual({
        data: mockData,
        lastUpdate: new Date(mockTimestamp),
      });
    });

    it('should return null when no cache exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await cache.getBusLocations();

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Read error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await cache.getBusLocations();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clearCache', () => {
    it('should remove all cached data', async () => {
      await cache.clearCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('bus_locations_cache');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('last_update_timestamp');
    });

    it('should handle errors gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Clear error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await cache.clearCache();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
