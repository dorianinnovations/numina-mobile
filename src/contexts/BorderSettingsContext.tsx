import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import SettingsService, { UserSettings } from '../services/settingsService';

export interface BorderSettings {
  effectsEnabled: boolean;
  brightness: number;
  speed: 1 | 2 | 3;
  direction: 'clockwise' | 'counterclockwise';
  variation: 'smooth' | 'pulse' | 'wave';
}

interface BorderSettingsContextType {
  borderSettings: BorderSettings;
  loading: boolean;
  updateBorderSetting: (key: keyof BorderSettings, value: any) => Promise<void>;
  effectsEnabled: boolean;
  brightness: number;
  speed: 1 | 2 | 3;
  direction: 'clockwise' | 'counterclockwise';
  variation: 'smooth' | 'pulse' | 'wave';
}

const BorderSettingsContext = createContext<BorderSettingsContextType | undefined>(undefined);

export const BorderSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [borderSettings, setBorderSettings] = useState<BorderSettings>({
    effectsEnabled: true,
    brightness: 80,
    speed: 2,
    direction: 'clockwise',
    variation: 'smooth',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBorderSettings = async () => {
      try {
        const settings = await SettingsService.loadSettings();
        
        const newBorderSettings = {
          effectsEnabled: settings.borderEffectsEnabled ?? true,
          brightness: settings.borderBrightness ?? 80,
          speed: (settings.borderSpeed ?? 2) as 1 | 2 | 3,
          direction: (settings.borderDirection ?? 'clockwise') as 'clockwise' | 'counterclockwise',
          variation: (settings.borderVariation ?? 'smooth') as 'smooth' | 'pulse' | 'wave',
        };
        
        setBorderSettings(newBorderSettings);
      } catch (error) {
        console.error('❌ BorderSettingsContext: Error loading border settings:', error);
        // Use default settings on error
        const defaultSettings = {
          effectsEnabled: true,
          brightness: 80,
          speed: 2 as const,
          direction: 'clockwise' as const,
          variation: 'smooth' as const,
        };
        setBorderSettings(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    loadBorderSettings();
  }, []);

  const updateBorderSetting = useCallback(async (key: keyof BorderSettings, value: any) => {
    try {
      
      // Map border settings to user settings keys
      const settingsKeyMap: Record<keyof BorderSettings, keyof UserSettings> = {
        effectsEnabled: 'borderEffectsEnabled',
        brightness: 'borderBrightness',
        speed: 'borderSpeed',
        direction: 'borderDirection',
        variation: 'borderVariation',
      };
      
      const settingsKey = settingsKeyMap[key];
      
      // Update the setting immediately for instant UI feedback
      setBorderSettings(prev => ({ ...prev, [key]: value }));
      
      // Then persist to storage
      await SettingsService.updateSetting(settingsKey, value);
      
    } catch (error) {
      console.error('❌ BorderSettingsContext: Error updating border setting:', error);
      // Revert the optimistic update on error
      try {
        const settings = await SettingsService.loadSettings();
        const revertedSettings = {
          effectsEnabled: settings.borderEffectsEnabled ?? true,
          brightness: settings.borderBrightness ?? 80,
          speed: settings.borderSpeed ?? 2,
          direction: settings.borderDirection ?? 'clockwise',
          variation: settings.borderVariation ?? 'smooth',
        };
        setBorderSettings(revertedSettings);
      } catch (revertError) {
        console.error('❌ BorderSettingsContext: Error reverting border setting:', revertError);
      }
    }
  }, []);

  const contextValue = useMemo(() => ({
    borderSettings,
    loading,
    updateBorderSetting,
    effectsEnabled: borderSettings.effectsEnabled,
    brightness: borderSettings.brightness,
    speed: borderSettings.speed,
    direction: borderSettings.direction,
    variation: borderSettings.variation,
  }), [borderSettings, loading, updateBorderSetting]);

  return (
    <BorderSettingsContext.Provider value={contextValue}>
      {React.Children.toArray(children)}
    </BorderSettingsContext.Provider>
  );
};

export const useBorderSettings = () => {
  const context = useContext(BorderSettingsContext);
  if (context === undefined) {
    throw new Error('useBorderSettings must be used within a BorderSettingsProvider');
  }
  return context;
};