'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { Header } from '@/components/Header';
import { MicButton } from '@/components/MicButton';
import { TaskListItem } from '@/components/TaskListItem';
import { CalendarEventCard } from '@/components/CalendarEventCard';
import { FloatingElements } from '@/components/FloatingElements';
import { Task, CalendarEvent, ParsedVoiceInput } from '@/lib/types';
import { LocalStorage } from '@/lib/storage';
import { transcribeAudio, parseVoiceInput } from '@/lib/openai';
import { generateId } from '@/lib/utils';
import { Calendar, CheckSquare, Sparkles } from 'lucide-react';

export default function HomePage() {
  const { setFrameReady } = useMiniKit();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tasks' | 'calendar'>('tasks');

  // Initialize MiniKit
  useEffect(() => {
    setFrameReady();
  }, [setFrameReady]);

  // Load data from localStorage
  useEffect(() => {
    setTasks(LocalStorage.getTasks());
    setEvents(LocalStorage.getEvents());
  }, []);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Transcribe audio
      const transcription = await transcribeAudio(audioBlob);
      setLastTranscription(transcription);
      
      // Parse the transcription
      const parsed = await parseVoiceInput(transcription);
      
      // Create task or event based on parsed input
      if (parsed.type === 'task') {
        const newTask: Task = {
          taskId: generateId(),
          userId: 'demo-user', // In production, get from wallet/auth
          description: parsed.title,
          isCompleted: false,
          createdAt: new Date(),
          dueDate: parsed.dueDate,
          priority: parsed.priority || 'medium',
        };
        
        LocalStorage.addTask(newTask);
        setTasks(LocalStorage.getTasks());
      } else if (parsed.type === 'event') {
        const newEvent: CalendarEvent = {
          eventId: generateId(),
          userId: 'demo-user', // In production, get from wallet/auth
          title: parsed.title,
          startTime: parsed.startTime || new Date(),
          endTime: parsed.endTime || new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
          location: parsed.location,
          notes: parsed.description,
        };
        
        LocalStorage.addEvent(newEvent);
        setEvents(LocalStorage.getEvents());
      }
      
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleToggleTaskComplete = useCallback((taskId: string) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      LocalStorage.updateTask(taskId, { isCompleted: !task.isCompleted });
      setTasks(LocalStorage.getTasks());
    }
  }, [tasks]);

  const handleDeleteTask = useCallback((taskId: string) => {
    LocalStorage.deleteTask(taskId);
    setTasks(LocalStorage.getTasks());
  }, []);

  const handleDeleteEvent = useCallback((eventId: string) => {
    LocalStorage.deleteEvent(eventId);
    setEvents(LocalStorage.getEvents());
  }, []);

  const incompleteTasks = tasks.filter(task => !task.isCompleted);
  const completedTasks = tasks.filter(task => task.isCompleted);
  const upcomingEvents = events
    .filter(event => event.startTime > new Date())
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  return (
    <div className="min-h-screen relative">
      <FloatingElements />
      
      <div className="relative z-10">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 pb-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Turn Your Voice Into Action
            </h2>
            <p className="text-xl text-white opacity-80 mb-8">
              Speak your tasks and events - let AI organize your life
            </p>
            
            <MicButton 
              onRecordingComplete={handleRecordingComplete}
              disabled={isProcessing}
            />
            
            {lastTranscription && (
              <div className="mt-6 glass-card p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-300 mb-2">Last transcription:</p>
                <p className="text-white italic">"{lastTranscription}"</p>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card p-1 flex rounded-lg">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-6 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'tasks' 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white opacity-60 hover:opacity-80'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tasks ({incompleteTasks.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-2 rounded-md transition-all duration-200 flex items-center space-x-2 ${
                  activeTab === 'calendar' 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'text-white opacity-60 hover:opacity-80'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Events ({upcomingEvents.length})</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeTab === 'tasks' ? (
              <>
                {/* Active Tasks */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-semibold text-white">Active Tasks</h3>
                    {incompleteTasks.length > 0 && (
                      <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        {incompleteTasks.length}
                      </span>
                    )}
                  </div>
                  
                  {incompleteTasks.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                      <p className="text-white opacity-60">
                        No active tasks. Speak to create your first task!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {incompleteTasks.map(task => (
                        <TaskListItem
                          key={task.taskId}
                          task={task}
                          onToggleComplete={handleToggleTaskComplete}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Completed Tasks */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-green-400" />
                    <h3 className="text-xl font-semibold text-white">Completed</h3>
                    {completedTasks.length > 0 && (
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {completedTasks.length}
                      </span>
                    )}
                  </div>
                  
                  {completedTasks.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <p className="text-white opacity-60">
                        Completed tasks will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {completedTasks.map(task => (
                        <TaskListItem
                          key={task.taskId}
                          task={task}
                          onToggleComplete={handleToggleTaskComplete}
                          onDelete={handleDeleteTask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Upcoming Events */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-white" />
                    <h3 className="text-xl font-semibold text-white">Upcoming Events</h3>
                    {upcomingEvents.length > 0 && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        {upcomingEvents.length}
                      </span>
                    )}
                  </div>
                  
                  {upcomingEvents.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                      <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                      <p className="text-white opacity-60">
                        No upcoming events. Speak to schedule your first event!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {upcomingEvents.map(event => (
                        <CalendarEventCard
                          key={event.eventId}
                          event={event}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {tasks.length}
              </div>
              <div className="text-white opacity-60">Total Tasks</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {completedTasks.length}
              </div>
              <div className="text-white opacity-60">Completed</div>
            </div>
            <div className="glass-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {events.length}
              </div>
              <div className="text-white opacity-60">Events</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
