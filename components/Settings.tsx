'use client';

import { useState } from 'react';
import { Download, Upload, Trash2, Bell, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { Task, CalendarEvent } from '@/lib/types';
import { LocalStorage } from '@/lib/storage';

interface SettingsProps {
  tasks: Task[];
  events: CalendarEvent[];
  onDataImported: (tasks: Task[], events: CalendarEvent[]) => void;
}

export function Settings({ tasks, events, onDataImported }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'notifications'>('general');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    soundEnabled: true,
    autoSave: true,
    reminderDefaults: {
      taskReminder: 30, // minutes before due
      eventReminder: 15, // minutes before start
    }
  });

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        tasks,
        events,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `speakeasy-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate the import data structure
      if (!importData.tasks || !importData.events) {
        throw new Error('Invalid backup file format');
      }

      // Merge with existing data or replace
      const shouldReplace = confirm(
        'Do you want to replace all existing data? Click Cancel to merge with existing data.'
      );

      let newTasks: Task[];
      let newEvents: CalendarEvent[];

      if (shouldReplace) {
        newTasks = importData.tasks;
        newEvents = importData.events;
      } else {
        // Merge data, avoiding duplicates by ID
        const existingTaskIds = new Set(tasks.map(t => t.id));
        const existingEventIds = new Set(events.map(e => e.id));

        const importedTasks = importData.tasks.filter((t: Task) => !existingTaskIds.has(t.id));
        const importedEvents = importData.events.filter((e: CalendarEvent) => !existingEventIds.has(e.id));

        newTasks = [...tasks, ...importedTasks];
        newEvents = [...events, ...importedEvents];
      }

      // Save to localStorage
      LocalStorage.saveTasks(newTasks);
      LocalStorage.saveEvents(newEvents);

      // Update parent component
      onDataImported(newTasks, newEvents);

      alert(`Successfully imported ${newTasks.length} tasks and ${newEvents.length} events!`);
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format and try again.');
    } finally {
      setIsImporting(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleClearAllData = () => {
    const confirmed = confirm(
      'Are you sure you want to delete ALL tasks and events? This action cannot be undone.'
    );

    if (confirmed) {
      const doubleConfirmed = confirm(
        'This will permanently delete all your data. Are you absolutely sure?'
      );

      if (doubleConfirmed) {
        LocalStorage.clearAll();
        onDataImported([], []);
        alert('All data has been cleared.');
      }
    }
  };

  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('speakeasy_settings', JSON.stringify(newSettings));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Appearance</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <div>
                <p className="text-white font-medium">Theme</p>
                <p className="text-white text-opacity-70 text-sm">Choose your preferred theme</p>
              </div>
            </div>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="bg-white bg-opacity-20 text-white rounded-lg px-3 py-2 border border-white border-opacity-30"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Audio</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <div>
                <p className="text-white font-medium">Sound Effects</p>
                <p className="text-white text-opacity-70 text-sm">Play sounds for notifications and actions</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                settings.soundEnabled ? 'bg-blue-500' : 'bg-white bg-opacity-30'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Default Reminders</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Task Reminder (minutes before due)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.reminderDefaults.taskReminder}
              onChange={(e) => updateSetting('reminderDefaults', {
                ...settings.reminderDefaults,
                taskReminder: parseInt(e.target.value)
              })}
              className="w-full bg-white bg-opacity-20 text-white rounded-lg px-3 py-2 border border-white border-opacity-30"
            />
          </div>
          
          <div>
            <label className="block text-white font-medium mb-2">Event Reminder (minutes before start)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.reminderDefaults.eventReminder}
              onChange={(e) => updateSetting('reminderDefaults', {
                ...settings.reminderDefaults,
                eventReminder: parseInt(e.target.value)
              })}
              className="w-full bg-white bg-opacity-20 text-white rounded-lg px-3 py-2 border border-white border-opacity-30"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Data Management</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg">
            <div>
              <p className="text-white font-medium">Export Data</p>
              <p className="text-white text-opacity-70 text-sm">Download all your tasks and events as JSON</p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="glass-button px-4 py-2 text-white font-medium flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg">
            <div>
              <p className="text-white font-medium">Import Data</p>
              <p className="text-white text-opacity-70 text-sm">Upload a backup file to restore your data</p>
            </div>
            <label className="glass-button px-4 py-2 text-white font-medium flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import'}
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Storage Info</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white text-opacity-70">Total Tasks:</span>
            <span className="text-white font-medium">{tasks.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white text-opacity-70">Completed Tasks:</span>
            <span className="text-white font-medium">{tasks.filter(t => t.isCompleted).length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white text-opacity-70">Total Events:</span>
            <span className="text-white font-medium">{events.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white text-opacity-70">Storage Used:</span>
            <span className="text-white font-medium">
              {Math.round((JSON.stringify({ tasks, events }).length / 1024) * 100) / 100} KB
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card p-4 border border-red-500 border-opacity-30">
        <h4 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h4>
        
        <div className="flex items-center justify-between p-3 bg-red-500 bg-opacity-10 rounded-lg">
          <div>
            <p className="text-white font-medium">Clear All Data</p>
            <p className="text-white text-opacity-70 text-sm">Permanently delete all tasks and events</p>
          </div>
          <button
            onClick={handleClearAllData}
            className="bg-red-500 hover:bg-red-600 px-4 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5" />
              <div>
                <p className="text-white font-medium">Browser Notifications</p>
                <p className="text-white text-opacity-70 text-sm">Receive notifications for reminders</p>
              </div>
            </div>
            <button
              onClick={() => updateSetting('notifications', !settings.notifications)}
              className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                settings.notifications ? 'bg-blue-500' : 'bg-white bg-opacity-30'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                settings.notifications ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Notification Status</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white text-opacity-70">Permission Status:</span>
            <span className={`font-medium ${
              Notification.permission === 'granted' ? 'text-green-400' :
              Notification.permission === 'denied' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {Notification.permission === 'granted' ? 'Granted' :
               Notification.permission === 'denied' ? 'Denied' :
               'Not Requested'}
            </span>
          </div>
          
          {Notification.permission !== 'granted' && (
            <button
              onClick={() => Notification.requestPermission()}
              className="w-full glass-button px-4 py-2 text-white font-medium"
            >
              Request Permission
            </button>
          )}
        </div>
      </div>

      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">About</h4>
        
        <div className="space-y-3 text-white text-opacity-70 text-sm">
          <p>SpeakEasy Tasks v1.0</p>
          <p>Built with Next.js, OnchainKit, and AI-powered voice recognition</p>
          <p>Your data is stored locally in your browser and never sent to external servers</p>
          <p>© 2024 SpeakEasy Tasks Team</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white bg-opacity-10 rounded-lg">
        {[
          { id: 'general', label: 'General' },
          { id: 'data', label: 'Data' },
          { id: 'notifications', label: 'Notifications' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && renderGeneralSettings()}
      {activeTab === 'data' && renderDataSettings()}
      {activeTab === 'notifications' && renderNotificationSettings()}
    </div>
  );
}
