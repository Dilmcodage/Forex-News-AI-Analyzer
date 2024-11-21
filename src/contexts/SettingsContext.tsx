import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings, SettingsContextType } from '../types';

const defaultSettings: Settings = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  feedUrl: 'https://forexlive.com/feed/news',
  prompt: 'Analyze this forex news article and provide key insights and potential market impact in 2-3 sentences:'
};

const SETTINGS_STORAGE_KEY = 'forex_news_settings';

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}