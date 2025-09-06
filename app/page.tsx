'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Settings2, User } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { TaskList } from '@/components/TaskList';
import { CalendarView } from '@/components/CalendarView';
import { Task, CalendarEvent } from '@/lib/types';
import { LocalStorage } from '@/lib/storage';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { Name, Avatar } from '@coinbase/onchainkit/identity';

type ViewMode = 'voice' | 'tasks' | 'calendar';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewMode>('voice');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { setFrameReady } = useMiniKit();

  useEffect(() => {
    setFrameReady();
  }, [setFrameReady]);

  useEffect(() => {
    // Load data from localStorage on mount
    setTasks(LocalStorage.getTasks());
    setEvents(LocalStorage.getEvents());
  }, []);

  const handleTaskAdded = (task: Task) => {
    setTasks(prev => [...prev, task]);
    // Auto-switch to tasks view to show the new task
    setTimeout(() => setCurrentView('tasks'), 1000);
  };

  const handleEventAdded = (event: CalendarEvent) => {
    setEvents(prev => [...prev, event]);
    // Auto-switch to calendar view to show the new event
    setTimeout(() => setCurrentView('calendar'), 1000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'voice':
        return (
          <VoiceInput
            onTaskAdded={handleTaskAdded}
            onEventAdded={handleEventAdded}
            onError={handleError}
          />
        );
      case 'tasks':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Tasks</h2>
              <button
                onClick={() => setCurrentView('voice')}
                className="glass-button px-4 py-2 text-white text-sm font-medium"
              >
                Add Task
              </button>
            </div>
            <TaskList tasks={tasks} onTasksChange={setTasks} />
          </div>
        );
      case 'calendar':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Your Calendar</h2>
              <button
                onClick={() => setCurrentView('voice')}
                className="glass-button px-4 py-2 text-white text-sm font-medium"
              >
                Add Event
              </button>
            </div>
            <CalendarView events={events} onEventsChange={setEvents} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">SpeakEasy Tasks</h1>
              <p className="text-sm text-white text-opacity-70">Voice-powered productivity</p>
            </div>
          </div>
          
          <Wallet>
            <ConnectWallet>
              <Avatar className="h-6 w-6" />
              <Name />
            </ConnectWallet>
          </Wallet>
        </div>
      </header>

      {/* Navigation */}
      <nav className="glass-card mx-4 mt-4 p-2">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentView('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'voice'
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            Voice
          </button>
          
          <button
            onClick={() => setCurrentView('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'tasks'
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Tasks ({tasks.filter(t => !t.isCompleted).length})
          </button>
          
          <button
            onClick={() => setCurrentView('calendar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'calendar'
                ? 'bg-white bg-opacity-20 text-white'
                : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendar ({events.length})
          </button>
        </div>
      </nav>

      {/* Error Display */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-white text-opacity-50 text-sm">
        <p>Built on Base • Powered by AI</p>
      </footer>
    </div>
  );
}
