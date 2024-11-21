import React from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { SettingsPanel } from './components/SettingsPanel';
import { NewsList } from './components/NewsList';

function App() {
  return (
    <SettingsProvider>
      <div className="min-h-screen bg-gray-100">
        <SettingsPanel />
        <NewsList />
      </div>
    </SettingsProvider>
  );
}

export default App;