export interface User {
  userId: string;
  createdAt: Date;
  lastActive: Date;
}

export interface Task {
  id: string;
  taskId: string;
  userId: string;
  title: string;
  description: string;
  isCompleted: boolean;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface CalendarEvent {
  id: string;
  eventId: string;
  userId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface Reminder {
  reminderId: string;
  taskId?: string;
  eventId?: string;
  userId: string;
  triggerType: 'time' | 'location' | 'completion';
  triggerValue: string;
  isTriggered: boolean;
  createdAt: Date;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  audioBlob: Blob | null;
  transcription: string;
  error: string | null;
}

export interface ParsedVoiceInput {
  type: 'task' | 'event';
  title: string;
  description?: string;
  dueDate?: Date;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  priority?: 'low' | 'medium' | 'high';
}
