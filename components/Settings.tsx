'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { ReminderService } from '@/lib/reminders';
import { LocalStorage } from '@/lib/storage';
import { Task, CalendarEvent } from '@/lib/types';

interface SettingsProps {
  tasks: Task[];
  events: CalendarEvent[];
  onDataImported?: (tasks: Task[], events: CalendarEvent[]) => void;
}

export function Settings({ tasks, events, onDataImported }: SettingsProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [activeReminders, setActiveReminders] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Count active reminders
    setActiveReminders(ReminderService.getActiveReminders().length);
  }, []);

  const handleRequestNotifications = async () => {
    const permission = await ReminderService.requestNotificationPermission();
    setNotificationPermission(permission);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = {
        tasks,
        events,
        reminders: ReminderService.getReminders(),
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `speakeasy-tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.tasks || !data.events) {
          throw new Error('Invalid backup file format');
        }

        // Import tasks
        const importedTasks = data.tasks.map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        }));

        // Import events
        const importedEvents = data.events.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
        }));

        // Save to storage
        LocalStorage.saveTasks(importedTasks);
        LocalStorage.saveEvents(importedEvents);

        // Import reminders if available
        if (data.reminders) {
          ReminderService.saveReminders(data.reminders.map((reminder: any) => ({
            ...reminder,
            createdAt: new Date(reminder.createdAt),
          })));
        }

        // Notify parent component
        onDataImported?.(importedTasks, importedEvents);

        alert(`Successfully imported ${importedTasks.length} tasks and ${importedEvents.length} events`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleClearAllData = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    setIsClearingData(true);
    try {
      // Clear all storage
      LocalStorage.saveTasks([]);
      LocalStorage.saveEvents([]);
      ReminderService.saveReminders([]);

      // Cancel all active reminders
      const activeReminders = ReminderService.getActiveReminders();
      activeReminders.forEach(reminder => {
        ReminderService.cancelReminder(reminder.reminderId);
      });

      // Notify parent component
      onDataImported?.([], []);

      alert('All data has been cleared successfully');
    } catch (error) {
      console.error('Clear data error:', error);
      alert('Failed to clear data');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleRefreshReminders = () => {
    ReminderService.initializeReminders();
    setActiveReminders(ReminderService.getActiveReminders().length);
    alert('Reminders refreshed successfully');
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Browser Notifications</p>
              <p className="text-white text-opacity-70 text-sm">
                Get notified about upcoming tasks and events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                notificationPermission === 'granted' 
                  ? 'bg-green-500 bg-opacity-20 text-green-200'
                  : notificationPermission === 'denied'
                  ? 'bg-red-500 bg-opacity-20 text-red-200'
                  : 'bg-yellow-500 bg-opacity-20 text-yellow-200'
              }`}>
                {notificationPermission === 'granted' ? 'Enabled' : 
                 notificationPermission === 'denied' ? 'Blocked' : 'Not Set'}
              </span>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={handleRequestNotifications}
                  className="glass-button px-3 py-1 text-white text-sm"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Active Reminders</p>
              <p className="text-white text-opacity-70 text-sm">
                Currently scheduled reminders
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{activeReminders}</span>
              <button
                onClick={handleRefreshReminders}
                className="glass-button p-2 text-white"
                title="Refresh reminders"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Data Management
        </h3>
        
        <div className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Export Data</p>
              <p className="text-white text-opacity-70 text-sm">
                Download your tasks and events as a backup file
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="glass-button px-4 py-2 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>

          {/* Import Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Import Data</p>
              <p className="text-white text-opacity-70 text-sm">
                Restore from a backup file
              </p>
            </div>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isImporting}
              />
              <button
                disabled={isImporting}
                className="glass-button px-4 py-2 text-white text-sm font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import'}
              </button>
            </div>
          </div>

          {/* Clear All Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Clear All Data</p>
              <p className="text-white text-opacity-70 text-sm">
                Remove all tasks, events, and reminders
              </p>
            </div>
            <button
              onClick={handleClearAllData}
              disabled={isClearingData}
              className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 px-4 py-2 rounded-lg text-red-200 text-sm font-medium hover:bg-opacity-30 transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isClearingData ? 'Clearing...' : 'Clear All'}
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{tasks.length}</div>
            <div className="text-sm text-white text-opacity-70">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{events.length}</div>
            <div className="text-sm text-white text-opacity-70">Total Events</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {tasks.filter(t => t.isCompleted).length}
            </div>
            <div className="text-sm text-white text-opacity-70">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{activeReminders}</div>
            <div className="text-sm text-white text-opacity-70">Reminders</div>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="glass-card p-4">
        <h3 className="text-lg font-semibold text-white mb-4">About</h3>
        
        <div className="space-y-2 text-sm text-white text-opacity-70">
          <p><strong className="text-white">SpeakEasy Tasks</strong> v1.0.0</p>
          <p>A voice-powered productivity app built on Base</p>
          <p>Data is stored locally in your browser</p>
          <p>Built with Next.js, OpenAI, and OnchainKit</p>
        </div>
      </div>
    </div>
  );
}
