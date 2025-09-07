import { Task, CalendarEvent, Reminder } from './types';
import { generateId } from './utils';

export type ReminderTrigger = {
  type: 'time' | 'location' | 'completion';
  value: string;
  label: string;
};

export class ReminderService {
  private static STORAGE_KEY = 'speakeasy_reminders';
  private static activeReminders = new Map<string, NodeJS.Timeout>();

  static getReminders(): Reminder[] {
    if (typeof window === 'undefined') return [];
    try {
      const reminders = localStorage.getItem(this.STORAGE_KEY);
      return reminders ? JSON.parse(reminders).map((reminder: any) => ({
        ...reminder,
        createdAt: new Date(reminder.createdAt),
      })) : [];
    } catch {
      return [];
    }
  }

  static saveReminders(reminders: Reminder[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(reminders));
  }

  static createTaskReminder(task: Task, trigger: ReminderTrigger): Reminder {
    const reminder: Reminder = {
      reminderId: generateId(),
      taskId: task.taskId,
      userId: task.userId,
      triggerType: trigger.type,
      triggerValue: trigger.value,
      isTriggered: false,
      createdAt: new Date(),
    };

    const reminders = this.getReminders();
    reminders.push(reminder);
    this.saveReminders(reminders);

    // Schedule the reminder if it's time-based
    if (trigger.type === 'time') {
      this.scheduleTimeReminder(reminder, task);
    }

    return reminder;
  }

  static createEventReminder(event: CalendarEvent, trigger: ReminderTrigger): Reminder {
    const reminder: Reminder = {
      reminderId: generateId(),
      eventId: event.eventId,
      userId: event.userId,
      triggerType: trigger.type,
      triggerValue: trigger.value,
      isTriggered: false,
      createdAt: new Date(),
    };

    const reminders = this.getReminders();
    reminders.push(reminder);
    this.saveReminders(reminders);

    // Schedule the reminder if it's time-based
    if (trigger.type === 'time') {
      this.scheduleTimeReminder(reminder, event);
    }

    return reminder;
  }

  private static scheduleTimeReminder(reminder: Reminder, item: Task | CalendarEvent): void {
    const triggerTime = new Date(reminder.triggerValue);
    const now = new Date();
    const delay = triggerTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.triggerReminder(reminder, item);
      }, delay);

      this.activeReminders.set(reminder.reminderId, timeoutId);
    }
  }

  private static triggerReminder(reminder: Reminder, item: Task | CalendarEvent): void {
    // Mark reminder as triggered
    const reminders = this.getReminders();
    const index = reminders.findIndex(r => r.reminderId === reminder.reminderId);
    if (index !== -1) {
      reminders[index].isTriggered = true;
      this.saveReminders(reminders);
    }

    // Show notification
    this.showNotification(reminder, item);

    // Clean up active reminder
    this.activeReminders.delete(reminder.reminderId);
  }

  private static showNotification(reminder: Reminder, item: Task | CalendarEvent): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const title = 'taskId' in item ? `Task Reminder: ${item.description}` : `Event Reminder: ${item.title}`;
      const body = 'taskId' in item 
        ? `Don't forget: ${item.description}${item.dueDate ? ` (Due: ${item.dueDate.toLocaleDateString()})` : ''}`
        : `Upcoming: ${item.title}${item.location ? ` at ${item.location}` : ''}`;

      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: reminder.reminderId,
      });
    } else {
      // Fallback to browser alert
      const message = 'taskId' in item 
        ? `Reminder: ${item.description}`
        : `Event: ${item.title}`;
      alert(message);
    }
  }

  static requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  }

  static generateSmartReminders(item: Task | CalendarEvent): ReminderTrigger[] {
    const triggers: ReminderTrigger[] = [];

    if ('taskId' in item) {
      // Task reminders
      if (item.dueDate) {
        const dueTime = new Date(item.dueDate);
        
        // 1 day before
        const oneDayBefore = new Date(dueTime.getTime() - 24 * 60 * 60 * 1000);
        if (oneDayBefore > new Date()) {
          triggers.push({
            type: 'time',
            value: oneDayBefore.toISOString(),
            label: '1 day before due date'
          });
        }

        // 1 hour before
        const oneHourBefore = new Date(dueTime.getTime() - 60 * 60 * 1000);
        if (oneHourBefore > new Date()) {
          triggers.push({
            type: 'time',
            value: oneHourBefore.toISOString(),
            label: '1 hour before due date'
          });
        }
      }

      // Priority-based reminders
      if (item.priority === 'high') {
        const in30Minutes = new Date(Date.now() + 30 * 60 * 1000);
        triggers.push({
          type: 'time',
          value: in30Minutes.toISOString(),
          label: 'High priority - 30 minutes'
        });
      }
    } else {
      // Event reminders
      const startTime = new Date(item.startTime);
      
      // 15 minutes before
      const fifteenMinsBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
      if (fifteenMinsBefore > new Date()) {
        triggers.push({
          type: 'time',
          value: fifteenMinsBefore.toISOString(),
          label: '15 minutes before event'
        });
      }

      // 1 hour before
      const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > new Date()) {
        triggers.push({
          type: 'time',
          value: oneHourBefore.toISOString(),
          label: '1 hour before event'
        });
      }

      // Day before for important events
      const oneDayBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > new Date()) {
        triggers.push({
          type: 'time',
          value: oneDayBefore.toISOString(),
          label: '1 day before event'
        });
      }
    }

    return triggers;
  }

  static initializeReminders(): void {
    // Initialize all existing time-based reminders
    const reminders = this.getReminders().filter(r => !r.isTriggered && r.triggerType === 'time');
    
    reminders.forEach(reminder => {
      // We need to get the associated task or event
      // This is a simplified version - in production, you'd want to store more context
      const triggerTime = new Date(reminder.triggerValue);
      const now = new Date();
      const delay = triggerTime.getTime() - now.getTime();

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          // Create a mock item for notification
          const mockItem = reminder.taskId 
            ? { taskId: reminder.taskId, description: 'Task reminder', userId: reminder.userId } as Task
            : { eventId: reminder.eventId!, title: 'Event reminder', userId: reminder.userId } as CalendarEvent;
          
          this.triggerReminder(reminder, mockItem);
        }, delay);

        this.activeReminders.set(reminder.reminderId, timeoutId);
      }
    });
  }

  static cancelReminder(reminderId: string): void {
    const timeoutId = this.activeReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeReminders.delete(reminderId);
    }

    // Remove from storage
    const reminders = this.getReminders().filter(r => r.reminderId !== reminderId);
    this.saveReminders(reminders);
  }

  static getActiveReminders(): Reminder[] {
    return this.getReminders().filter(r => !r.isTriggered);
  }

  static getTriggeredReminders(): Reminder[] {
    return this.getReminders().filter(r => r.isTriggered);
  }
}
