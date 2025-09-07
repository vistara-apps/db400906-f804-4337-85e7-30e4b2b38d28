import { Task, CalendarEvent, Reminder } from './types';

// Simple localStorage-based storage for demo purposes
// In production, this would connect to Supabase or another backend

const STORAGE_KEYS = {
  TASKS: 'speakeasy_tasks',
  EVENTS: 'speakeasy_events',
  REMINDERS: 'speakeasy_reminders',
} as const;

export class LocalStorage {
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

  static clearAll(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.REMINDERS);
  }
}
