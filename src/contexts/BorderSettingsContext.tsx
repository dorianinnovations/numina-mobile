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
        setBorderSettings({
          effectsEnabled: settings.borderEffectsEnabled,
          brightness: settings.borderBrightness,
          speed: settings.borderSpeed,
          direction: settings.borderDirection,
          variation: settings.borderVariation,
        });
      } catch (error) {
        console.error('Error loading border settings:', error);
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
      setBorderSettings(prev => {
        const newSettings = { ...prev, [key]: value };
        console.log(`🔄 Border setting updated immediately: ${key} = ${value}`, newSettings);
        return newSettings;
      });
      
      // Then persist to storage
      await SettingsService.updateSetting(settingsKey, value);
      console.log(`💾 Border setting persisted: ${key} = ${value}`);
      
    } catch (error) {
      console.error('Error updating border setting:', error);
      // Revert the optimistic update on error
      try {
        const settings = await SettingsService.loadSettings();
        setBorderSettings({
          effectsEnabled: settings.borderEffectsEnabled,
          brightness: settings.borderBrightness,
          speed: settings.borderSpeed,
          direction: settings.borderDirection,
          variation: settings.borderVariation,
        });
      } catch (revertError) {
        console.error('Error reverting border setting:', revertError);
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
      {children}
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