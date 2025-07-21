import { LocationData } from '../hooks/useLocation';
import { ApiService } from './api';

export interface WeatherRequest {
  location?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  units?: 'metric' | 'imperial';
}

export interface WeatherResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export class WeatherService {
  /**
   * Get weather using location string or coordinates
   */
  static async getWeather(request: WeatherRequest): Promise<WeatherResponse> {
    try {
      let locationString = request.location;

      // If coordinates provided but no location string, create one
      if (!locationString && request.coordinates) {
        locationString = `${request.coordinates.latitude},${request.coordinates.longitude}`;
      }

      if (!locationString) {
        throw new Error('Location or coordinates required');
      }

      // Call the weather_check tool via the tools API
      const userContext = request.coordinates ? {
        currentLocation: {
          latitude: request.coordinates.latitude,
          longitude: request.coordinates.longitude,
          timestamp: new Date().toISOString()
        }
      } : {};

      const response = await ApiService.executeToolWithPayment('weather_check', {
        location: locationString,
        units: request.units || 'metric',
      }, userContext);

      return {
        success: response.success,
        data: response.data,
        message: response.message,
        error: response.error,
      };
    } catch (error) {
      console.error('Weather service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get weather data',
      };
    }
  }

  /**
   * Get weather for current user location
   */
  static async getWeatherForLocation(locationData: LocationData, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherResponse> {
    // Prefer city name if available, fall back to coordinates
    const location = locationData.address || 
                    locationData.city || 
                    `${locationData.latitude},${locationData.longitude}`;

    return this.getWeather({
      location,
      coordinates: {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      },
      units,
    });
  }

  /**
   * Get weather for a specific city/location string
   */
  static async getWeatherForCity(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<WeatherResponse> {
    return this.getWeather({
      location: city,
      units,
    });
  }
}