import { Task, CalendarEvent, Reminder } from './types';
import { SupabaseTasks, SupabaseEvents, SupabaseReminders, isSupabaseConfigured } from './supabase';

// Unified storage service that switches between localStorage and Supabase
// based on configuration and environment

const STORAGE_KEYS = {
  TASKS: 'speakeasy_tasks',
  EVENTS: 'speakeasy_events',
  REMINDERS: 'speakeasy_reminders',
} as const;

// Local storage implementation for fallback/demo
class LocalStorageService {
  static getTasks(): Task[] {
    if (typeof window === 'undefined') return [];
    try {
      const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      return tasks ? JSON.parse(tasks).map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      })) : [];
    } catch {
      return [];
    }
  }

  static saveTasks(tasks: Task[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  static addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  }

  static updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.taskId === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveTasks(tasks);
    }
  }

  static deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter(t => t.taskId !== taskId);
    this.saveTasks(tasks);
  }

  static getEvents(): CalendarEvent[] {
    if (typeof window === 'undefined') return [];
    try {
      const events = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return events ? JSON.parse(events).map((event: any) => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
      })) : [];
    } catch {
      return [];
    }
  }

  static saveEvents(events: CalendarEvent[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  }

  static addEvent(event: CalendarEvent): void {
    const events = this.getEvents();
    events.push(event);
    this.saveEvents(events);
  }

  static updateEvent(eventId: string, updates: Partial<CalendarEvent>): void {
    const events = this.getEvents();
    const index = events.findIndex(e => e.eventId === eventId);
    if (index !== -1) {
      events[index] = { ...events[index], ...updates };
      this.saveEvents(events);
    }
  }

  static deleteEvent(eventId: string): void {
    const events = this.getEvents().filter(e => e.eventId !== eventId);
    this.saveEvents(events);
  }
}

// Unified storage service that automatically chooses between localStorage and Supabase
export class StorageService {
  private static useSupabase = isSupabaseConfigured();
  private static currentUserId = 'demo-user'; // Default user ID for demo

  static setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  static getCurrentUserId(): string {
    return this.currentUserId;
  }

  // Task operations
  static async getTasks(): Promise<Task[]> {
    if (this.useSupabase) {
      return await SupabaseTasks.getTasks(this.currentUserId);
    }
    return LocalStorageService.getTasks();
  }

  static async addTask(task: Task): Promise<Task | null> {
    if (this.useSupabase) {
      return await SupabaseTasks.createTask(task);
    }
    LocalStorageService.addTask(task);
    return task;
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    if (this.useSupabase) {
      return await SupabaseTasks.updateTask(taskId, updates);
    }
    LocalStorageService.updateTask(taskId, updates);
    const tasks = LocalStorageService.getTasks();
    return tasks.find(t => t.taskId === taskId) || null;
  }

  static async deleteTask(taskId: string): Promise<boolean> {
    if (this.useSupabase) {
      return await SupabaseTasks.deleteTask(taskId);
    }
    LocalStorageService.deleteTask(taskId);
    return true;
  }

  // Event operations
  static async getEvents(): Promise<CalendarEvent[]> {
    if (this.useSupabase) {
      return await SupabaseEvents.getEvents(this.currentUserId);
    }
    return LocalStorageService.getEvents();
  }

  static async addEvent(event: CalendarEvent): Promise<CalendarEvent | null> {
    if (this.useSupabase) {
      return await SupabaseEvents.createEvent(event);
    }
    LocalStorageService.addEvent(event);
    return event;
  }

  static async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    if (this.useSupabase) {
      return await SupabaseEvents.updateEvent(eventId, updates);
    }
    LocalStorageService.updateEvent(eventId, updates);
    const events = LocalStorageService.getEvents();
    return events.find(e => e.eventId === eventId) || null;
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    if (this.useSupabase) {
      return await SupabaseEvents.deleteEvent(eventId);
    }
    LocalStorageService.deleteEvent(eventId);
    return true;
  }

  // Reminder operations
  static async getReminders(): Promise<Reminder[]> {
    if (this.useSupabase) {
      return await SupabaseReminders.getReminders(this.currentUserId);
    }
    // For localStorage, we'll implement basic reminder storage
    return [];
  }

  static async addReminder(reminder: Reminder): Promise<Reminder | null> {
    if (this.useSupabase) {
      return await SupabaseReminders.createReminder(reminder);
    }
    // For localStorage, we'll implement basic reminder storage
    return reminder;
  }

  static async triggerReminder(reminderId: string): Promise<boolean> {
    if (this.useSupabase) {
      return await SupabaseReminders.triggerReminder(reminderId);
    }
    return true;
  }

  static async deleteReminder(reminderId: string): Promise<boolean> {
    if (this.useSupabase) {
      return await SupabaseReminders.deleteReminder(reminderId);
    }
    return true;
  }

  // Utility methods
  static isUsingSupabase(): boolean {
    return this.useSupabase;
  }
}

// Keep LocalStorage export for backward compatibility
export const LocalStorage = LocalStorageService;
