export interface NewsItem {
  title: string;
  link: string;
  content: string;
  pubDate: string;
  analysis?: string;
}

export interface Settings {
  apiKey: string;
  model: string;
  feedUrl: string;
  prompt: string;
}

export interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}