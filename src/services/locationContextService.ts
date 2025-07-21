import { LocationData, useLocation } from '../hooks/useLocation';

export interface LocationContext {
  currentLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
    region?: string;
    country?: string;
    address?: string;
    timestamp: string;
    accuracy?: string;
  };
}

class LocationContextService {
  private static instance: LocationContextService;
  private currentLocationData: LocationData | null = null;

  static getInstance(): LocationContextService {
    if (!LocationContextService.instance) {
      LocationContextService.instance = new LocationContextService();
    }
    return LocationContextService.instance;
  }

  setLocationData(locationData: LocationData | null) {
    this.currentLocationData = locationData;
  }

  getCurrentLocationContext(): LocationContext {
    if (!this.currentLocationData) {
      return {};
    }

    return {
      currentLocation: {
        latitude: this.currentLocationData.latitude,
        longitude: this.currentLocationData.longitude,
        city: this.currentLocationData.city,
        region: this.currentLocationData.region,
        country: this.currentLocationData.country,
        address: this.currentLocationData.address,
        timestamp: new Date().toISOString(),
        accuracy: 'city-level'
      }
    };
  }

  async requestLocationForAI(): Promise<LocationContext> {
    // This would trigger location request in the mobile app
    // For now, return current cached location
    return this.getCurrentLocationContext();
  }

  hasLocation(): boolean {
    return this.currentLocationData !== null;
  }

  getLocationString(): string {
    if (!this.currentLocationData) return '';
    
    if (this.currentLocationData.address) {
      return this.currentLocationData.address;
    }
    
    if (this.currentLocationData.city) {
      return [
        this.currentLocationData.city, 
        this.currentLocationData.region, 
        this.currentLocationData.country
      ].filter(Boolean).join(', ');
    }
    
    return `${this.currentLocationData.latitude.toFixed(4)}, ${this.currentLocationData.longitude.toFixed(4)}`;
  }
}

export default LocationContextService;