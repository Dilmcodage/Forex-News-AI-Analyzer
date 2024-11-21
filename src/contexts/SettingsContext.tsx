import React, { createContext, useContext, useState } from 'react';
import { Settings, SettingsContextType } from '../types';

const defaultSettings: Settings = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  feedUrl: 'https://forexlive.com/feed/news',
  prompt: 'Analyze this forex news article and provide key insights and potential market impact in 2-3 sentences:'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

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