import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  address?: string;
}

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permissionStatus: Location.LocationPermissionResponse | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permissionStatus: null,
  });

  const requestLocation = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Request permission
      const permissionResponse = await Location.requestForegroundPermissionsAsync();
      setState(prev => ({ ...prev, permissionStatus: permissionResponse }));

      if (permissionResponse.status !== 'granted') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Location permission denied. Please enable location access in settings to get weather for your current location.',
        }));
        return;
      }

      // Get current location
      const locationResponse = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = locationResponse.coords;

      // Reverse geocode to get city/address
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        if (reverseGeocode.length > 0) {
          const place = reverseGeocode[0];
          const locationData: LocationData = {
            latitude,
            longitude,
            city: place.city || place.subregion || undefined,
            region: place.region || undefined,
            country: place.country || undefined,
            address: [place.city, place.region, place.country]
              .filter(Boolean)
              .join(', ') || undefined,
          };

          setState(prev => ({
            ...prev,
            location: locationData,
            loading: false,
          }));
        } else {
          // Fallback without city name
          setState(prev => ({
            ...prev,
            location: { latitude, longitude },
            loading: false,
          }));
        }
      } catch (geocodeError) {
        // console.warn('Geocoding failed:', geocodeError);
        // Still provide coordinates even if geocoding fails
        setState(prev => ({
          ...prev,
          location: { latitude, longitude },
          loading: false,
        }));
      }
    } catch (error) {
      // console.error('Location error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: `Failed to get location: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    }
  };

  const clearLocation = () => {
    setState({
      location: null,
      loading: false,
      error: null,
      permissionStatus: null,
    });
  };

  const getLocationString = (): string => {
    if (!state.location) return '';
    
    if (state.location.address) {
      return state.location.address;
    }
    
    if (state.location.city) {
      return [state.location.city, state.location.region, state.location.country]
        .filter(Boolean)
        .join(', ');
    }
    
    // Fallback to coordinates
    return `${state.location.latitude.toFixed(4)}, ${state.location.longitude.toFixed(4)}`;
  };

  const hasPermission = (): boolean => {
    return state.permissionStatus?.status === 'granted';
  };

  const canRequestLocation = (): boolean => {
    return state.permissionStatus?.canAskAgain !== false;
  };

  return {
    ...state,
    requestLocation,
    clearLocation,
    getLocationString,
    hasPermission,
    canRequestLocation,
  };
};

export default useLocation;