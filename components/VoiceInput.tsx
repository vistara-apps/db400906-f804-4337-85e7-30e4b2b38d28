'use client';

import { useState, useCallback } from 'react';
import { MicButton } from './MicButton';
import { transcribeAudio, parseVoiceInput } from '@/lib/openai';
import { LocalStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { Task, CalendarEvent, ParsedVoiceInput } from '@/lib/types';

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
      // Step 1: Transcribe audio
      const transcribedText = await transcribeAudio(audioBlob);
      setTranscription(transcribedText);

      // Step 2: Parse the transcription
      const parsed = await parseVoiceInput(transcribedText);
      setLastResult(parsed);

      // Step 3: Create task or event
      if (parsed.type === 'task') {
        const taskId = generateId();
        const task: Task = {
          id: taskId,
          taskId: taskId,
          userId: 'demo-user', // In production, get from auth
          title: parsed.title,
          description: parsed.description || parsed.title,
          isCompleted: false,
          createdAt: new Date(),
          dueDate: parsed.dueDate ? new Date(parsed.dueDate) : undefined,
          priority: parsed.priority || 'medium',
        };

        LocalStorage.addTask(task);
        onTaskAdded?.(task);
      } else if (parsed.type === 'event') {
        const eventId = generateId();
        const event: CalendarEvent = {
          id: eventId,
          eventId: eventId,
          userId: 'demo-user', // In production, get from auth
          title: parsed.title,
          startTime: parsed.startTime ? new Date(parsed.startTime) : new Date(),
          endTime: parsed.endTime ? new Date(parsed.endTime) : new Date(Date.now() + 60 * 60 * 1000), // Default 1 hour
          location: parsed.location,
          notes: parsed.description,
          priority: parsed.priority || 'medium',
        };

        LocalStorage.addEvent(event);
        onEventAdded?.(event);
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to process voice input');
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
            <p className="text-white italic">&quot;{transcription}&quot;</p>
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
