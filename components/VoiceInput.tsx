'use client';

import { useState, useCallback } from 'react';
import { MicButton } from './MicButton';
import { StorageService } from '@/lib/storage';
import { ContextualReminderService } from '@/lib/reminders';
import { generateId } from '@/lib/utils';
import { Task, CalendarEvent, ParsedVoiceInput } from '@/lib/types';
import toast from 'react-hot-toast';

interface VoiceInputProps {
  onTaskAdded?: (task: Task) => void;
  onEventAdded?: (event: CalendarEvent) => void;
  onError?: (error: string) => void;
}

export function VoiceInput({ onTaskAdded, onEventAdded, onError }: VoiceInputProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [lastResult, setLastResult] = useState<ParsedVoiceInput | null>(null);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscription('');
    setLastResult(null);

    try {
      // Step 1: Transcribe audio using API route
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const { transcription: transcribedText } = await transcribeResponse.json();
      setTranscription(transcribedText);

      // Step 2: Parse the transcription using API route
      const parseResponse = await fetch('/api/parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription: transcribedText }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse voice input');
      }

      const { parsed } = await parseResponse.json();
      setLastResult(parsed);

      // Step 3: Create task or event with enhanced storage
      if (parsed.type === 'task') {
        const task: Task = {
          taskId: generateId(),
          userId: StorageService.getCurrentUserId(),
          description: parsed.title,
          isCompleted: false,
          createdAt: new Date(),
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          priority: parsed.priority || 'medium',
        };

        const savedTask = await StorageService.addTask(task);
        if (savedTask) {
          // Create contextual reminders for the task
          await ContextualReminderService.createTaskReminders(savedTask);
          onTaskAdded?.(savedTask);
          toast.success('Task created successfully!');
        }
      } else if (parsed.type === 'event') {
        const event: CalendarEvent = {
          eventId: generateId(),
          userId: StorageService.getCurrentUserId(),
          title: parsed.title,
          startTime: parsed.startTime ? new Date(parsed.startTime) : new Date(),
          endTime: parsed.endTime ? new Date(parsed.endTime) : new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
          location: parsed.location,
          notes: parsed.description,
        };

        const savedEvent = await StorageService.addEvent(event);
        if (savedEvent) {
          // Create contextual reminders for the event
          await ContextualReminderService.createEventReminders(savedEvent);
          onEventAdded?.(savedEvent);
          toast.success('Event created successfully!');
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process voice input';
      onError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [onTaskAdded, onEventAdded, onError]);

  return (
    <div className="text-center">
      <div className="relative">
        <MicButton
          onRecordingComplete={handleRecordingComplete}
          disabled={isProcessing}
          className="mx-auto"
        />
        
        {/* Floating decorative elements */}
        <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-60 floating-element" />
        <div className="absolute -bottom-2 -right-6 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-40 floating-element" style={{ animationDelay: '1s' }} />
        <div className="absolute top-8 -right-2 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-50 floating-element" style={{ animationDelay: '2s' }} />
      </div>

      <div className="mt-6 space-y-4">
        <h1 className="text-3xl font-bold gradient-text">
          SpeakEasy Tasks
        </h1>
        
        <p className="text-white text-opacity-80 max-w-md mx-auto">
          {isProcessing 
            ? 'Processing your voice...' 
            : 'Tap the microphone and speak your task or event'
          }
        </p>

        {transcription && (
          <div className="glass-card p-4 max-w-md mx-auto">
            <p className="text-sm text-white text-opacity-70 mb-2">You said:</p>
            <p className="text-white italic">"{transcription}"</p>
          </div>
        )}

        {lastResult && (
          <div className="glass-card p-4 max-w-md mx-auto">
            <p className="text-sm text-white text-opacity-70 mb-2">
              Created {lastResult.type}:
            </p>
            <p className="text-white font-medium">{lastResult.title}</p>
            {lastResult.dueDate && (
              <p className="text-sm text-white text-opacity-80 mt-1">
                Due: {new Date(lastResult.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
