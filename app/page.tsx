'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Settings2, User, Sparkles } from 'lucide-react';
import { VoiceInput } from '@/components/VoiceInput';
import { TaskList } from '@/components/TaskList';
import { CalendarView } from '@/components/CalendarView';
import { Task, CalendarEvent } from '@/lib/types';
import { StorageService } from '@/lib/storage';
import { ContextualReminderService } from '@/lib/reminders';
import { AITaskPrioritizer } from '@/lib/ai-prioritization';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { Name, Avatar } from '@coinbase/onchainkit/identity';
import { Toaster } from 'react-hot-toast';

type ViewMode = 'voice' | 'tasks' | 'calendar';

export default function HomePage() {
  const [currentView, setCurrentView] = useState<ViewMode>('voice');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAIPrioritization, setShowAIPrioritization] = useState(false);
  const { setFrameReady } = useMiniKit();

  useEffect(() => {
    setFrameReady();
  }, [setFrameReady]);

  useEffect(() => {
    // Initialize services and load data
    const initializeApp = async () => {
      try {
        // Initialize reminder service
        await ContextualReminderService.initialize();
        
        // Load data from storage
        const [loadedTasks, loadedEvents] = await Promise.all([
          StorageService.getTasks(),
          StorageService.getEvents()
        ]);
        
        setTasks(loadedTasks);
        setEvents(loadedEvents);
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
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

  const handleAIPrioritization = async () => {
    if (tasks.length === 0) {
      setError('No tasks to prioritize');
      return;
    }

    setShowAIPrioritization(true);
    try {
      const result = await AITaskPrioritizer.prioritizeTasks(tasks);
      
      // Update tasks with new priorities
      const updatedTasks = tasks.map(task => {
        const prioritizedTask = result.prioritizedTasks.find(p => p.taskId === task.taskId);
        if (prioritizedTask) {
          return { ...task, priority: prioritizedTask.priority };
        }
        return task;
      });

      // Sort by suggested order
      const sortedTasks = updatedTasks.sort((a, b) => {
        const priorityA = result.prioritizedTasks.find(p => p.taskId === a.taskId);
        const priorityB = result.prioritizedTasks.find(p => p.taskId === b.taskId);
        return (priorityA?.suggestedOrder || 999) - (priorityB?.suggestedOrder || 999);
      });

      setTasks(sortedTasks);
      
      // Save updated tasks
      for (const task of updatedTasks) {
        await StorageService.updateTask(task.taskId, { priority: task.priority });
      }

    } catch (error) {
      console.error('AI prioritization error:', error);
      setError('Failed to prioritize tasks with AI');
    } finally {
      setShowAIPrioritization(false);
    }
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
              <div className="flex gap-2">
                <button
                  onClick={handleAIPrioritization}
                  disabled={showAIPrioritization || tasks.length === 0}
                  className="glass-button px-4 py-2 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {showAIPrioritization ? 'Prioritizing...' : 'AI Prioritize'}
                </button>
                <button
                  onClick={() => setCurrentView('voice')}
                  className="glass-button px-4 py-2 text-white text-sm font-medium"
                >
                  Add Task
                </button>
              </div>
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-opacity-20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-opacity-70">Loading SpeakEasy Tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      />
      
      {/* Header */}
      <header className="glass-card mx-4 mt-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">SpeakEasy Tasks</h1>
              <p className="text-sm text-white text-opacity-70">
                Voice-powered productivity {StorageService.isUsingSupabase() ? '• Cloud Storage' : '• Local Storage'}
              </p>
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
