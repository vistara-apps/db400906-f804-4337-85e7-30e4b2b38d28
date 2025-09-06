import { createClient } from '@supabase/supabase-js';
import { Task, CalendarEvent, Reminder, User } from './types';

// Supabase client configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database table names
const TABLES = {
  USERS: 'users',
  TASKS: 'tasks',
  EVENTS: 'calendar_events',
  REMINDERS: 'reminders',
} as const;

// User operations
export class SupabaseUsers {
  static async getUser(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('userId', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data ? {
      ...data,
      createdAt: new Date(data.createdAt),
      lastActive: new Date(data.lastActive),
    } : null;
  }

  static async createUser(user: User): Promise<User | null> {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .insert([user])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      return null;
    }

    return data ? {
      ...data,
      createdAt: new Date(data.createdAt),
      lastActive: new Date(data.lastActive),
    } : null;
  }

  static async updateLastActive(userId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLES.USERS)
      .update({ lastActive: new Date().toISOString() })
      .eq('userId', userId);

    if (error) {
      console.error('Error updating last active:', error);
    }
  }
}

// Task operations
export class SupabaseTasks {
  static async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }

    return data.map(task => ({
      ...task,
      createdAt: new Date(task.createdAt),
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    }));
  }

  static async createTask(task: Task): Promise<Task | null> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .insert([task])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return null;
    }

    return data ? {
      ...data,
      createdAt: new Date(data.createdAt),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    } : null;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const { data, error } = await supabase
      .from(TABLES.TASKS)
      .update(updates)
      .eq('taskId', taskId)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return null;
    }

    return data ? {
      ...data,
      createdAt: new Date(data.createdAt),
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    } : null;
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.TASKS)
      .delete()
      .eq('taskId', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return false;
    }

    return true;
  }
}

// Calendar Event operations
export class SupabaseEvents {
  static async getEvents(userId: string): Promise<CalendarEvent[]> {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .select('*')
      .eq('userId', userId)
      .order('startTime', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return [];
    }

    return data.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
    }));
  }

  static async createEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .insert([event])
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      return null;
    }

    return data ? {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    } : null;
  }

  static async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const { data, error } = await supabase
      .from(TABLES.EVENTS)
      .update(updates)
      .eq('eventId', eventId)
      .select()
      .single();

    if (error) {
      console.error('Error updating event:', error);
      return null;
    }

    return data ? {
      ...data,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    } : null;
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.EVENTS)
      .delete()
      .eq('eventId', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      return false;
    }

    return true;
  }
}

// Reminder operations
export class SupabaseReminders {
  static async getReminders(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .select('*')
      .eq('userId', userId)
      .eq('isTriggered', false)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }

    return data.map(reminder => ({
      ...reminder,
      createdAt: new Date(reminder.createdAt),
    }));
  }

  static async createReminder(reminder: Reminder): Promise<Reminder | null> {
    const { data, error } = await supabase
      .from(TABLES.REMINDERS)
      .insert([reminder])
      .select()
      .single();

    if (error) {
      console.error('Error creating reminder:', error);
      return null;
    }

    return data ? {
      ...data,
      createdAt: new Date(data.createdAt),
    } : null;
  }

  static async triggerReminder(reminderId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .update({ isTriggered: true })
      .eq('reminderId', reminderId);

    if (error) {
      console.error('Error triggering reminder:', error);
      return false;
    }

    return true;
  }

  static async deleteReminder(reminderId: string): Promise<boolean> {
    const { error } = await supabase
      .from(TABLES.REMINDERS)
      .delete()
      .eq('reminderId', reminderId);

    if (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }

    return true;
  }
}

// Utility function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '');
}
