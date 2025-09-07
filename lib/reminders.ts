import { Task, CalendarEvent } from './types';

export interface ReminderTrigger {
  id: string;
  type: 'immediate' | 'before_due' | 'daily' | 'weekly';
  offset?: number; // minutes before due date
  time?: string; // HH:MM format for daily/weekly
  enabled: boolean;
}

export interface TaskReminder {
  id: string;
  taskId: string;
  trigger: ReminderTrigger;
  nextTriggerTime: Date;
  isActive: boolean;
}

export interface EventReminder {
  id: string;
  eventId: string;
  trigger: ReminderTrigger;
  nextTriggerTime: Date;
  isActive: boolean;
}

export class ReminderService {
  private static reminders: (TaskReminder | EventReminder)[] = [];
  private static intervalId: NodeJS.Timeout | null = null;
  private static notificationPermission: NotificationPermission = 'default';

  static initializeReminders() {
    // Load reminders from localStorage
    const stored = localStorage.getItem('speakeasy_reminders');
    if (stored) {
      try {
        this.reminders = JSON.parse(stored).map((r: any) => ({
          ...r,
          nextTriggerTime: new Date(r.nextTriggerTime)
        }));
      } catch (error) {
        console.error('Failed to load reminders:', error);
        this.reminders = [];
      }
    }

    // Start the reminder check interval (every minute)
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => {
      this.checkReminders();
    }, 60000); // Check every minute

    // Check immediately on init
    this.checkReminders();
  }

  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
      return this.notificationPermission;
    }
    return 'denied';
  }

  static generateSmartReminders(item: Task | CalendarEvent): ReminderTrigger[] {
    const triggers: ReminderTrigger[] = [];
    const now = new Date();

    if ('dueDate' in item && item.dueDate) {
      const dueDate = new Date(item.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      // High priority tasks get more reminders
      if (item.priority === 'high') {
        if (daysDiff > 1) {
          triggers.push({
            id: `${item.id}_1day`,
            type: 'before_due',
            offset: 24 * 60, // 1 day before
            enabled: true
          });
        }
        
        if (daysDiff > 0.5) {
          triggers.push({
            id: `${item.id}_2hours`,
            type: 'before_due',
            offset: 2 * 60, // 2 hours before
            enabled: true
          });
        }
      }

      // All tasks get a 30-minute reminder
      if (daysDiff > 0.02) { // More than 30 minutes away
        triggers.push({
          id: `${item.id}_30min`,
          type: 'before_due',
          offset: 30, // 30 minutes before
          enabled: true
        });
      }
    }

    if ('startTime' in item && item.startTime) {
      const startTime = new Date(item.startTime);
      const timeDiff = startTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Event reminders
      if (hoursDiff > 1) {
        triggers.push({
          id: `${item.id}_1hour`,
          type: 'before_due',
          offset: 60, // 1 hour before
          enabled: true
        });
      }

      if (hoursDiff > 0.25) {
        triggers.push({
          id: `${item.id}_15min`,
          type: 'before_due',
          offset: 15, // 15 minutes before
          enabled: true
        });
      }
    }

    return triggers;
  }

  static createTaskReminder(task: Task, trigger: ReminderTrigger): void {
    const reminder: TaskReminder = {
      id: `task_${task.id}_${trigger.id}`,
      taskId: task.id,
      trigger,
      nextTriggerTime: this.calculateNextTriggerTime(task, trigger),
      isActive: true
    };

    this.reminders.push(reminder);
    this.saveReminders();
  }

  static createEventReminder(event: CalendarEvent, trigger: ReminderTrigger): void {
    const reminder: EventReminder = {
      id: `event_${event.id}_${trigger.id}`,
      eventId: event.id,
      trigger,
      nextTriggerTime: this.calculateNextTriggerTime(event, trigger),
      isActive: true
    };

    this.reminders.push(reminder);
    this.saveReminders();
  }

  private static calculateNextTriggerTime(item: Task | CalendarEvent, trigger: ReminderTrigger): Date {
    const now = new Date();

    switch (trigger.type) {
      case 'immediate':
        return now;
      
      case 'before_due':
        if ('dueDate' in item && item.dueDate) {
          const dueDate = new Date(item.dueDate);
          return new Date(dueDate.getTime() - (trigger.offset || 0) * 60 * 1000);
        }
        if ('startTime' in item && item.startTime) {
          const startTime = new Date(item.startTime);
          return new Date(startTime.getTime() - (trigger.offset || 0) * 60 * 1000);
        }
        return now;
      
      case 'daily':
        const dailyTime = this.parseTime(trigger.time || '09:00');
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(dailyTime.hours, dailyTime.minutes, 0, 0);
        return tomorrow;
      
      case 'weekly':
        const weeklyTime = this.parseTime(trigger.time || '09:00');
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(weeklyTime.hours, weeklyTime.minutes, 0, 0);
        return nextWeek;
      
      default:
        return now;
    }
  }

  private static parseTime(timeString: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeString.split(':').map(Number);
    return { hours: hours || 0, minutes: minutes || 0 };
  }

  private static checkReminders(): void {
    const now = new Date();
    
    this.reminders.forEach(reminder => {
      if (reminder.isActive && reminder.nextTriggerTime <= now) {
        this.triggerReminder(reminder);
        
        // Deactivate one-time reminders
        if (reminder.trigger.type === 'immediate' || reminder.trigger.type === 'before_due') {
          reminder.isActive = false;
        } else {
          // Reschedule recurring reminders
          const itemId = 'taskId' in reminder ? reminder.taskId : reminder.eventId;
          reminder.nextTriggerTime = this.calculateNextTriggerTime(
            { id: itemId } as any,
            reminder.trigger
          );
        }
      }
    });

    // Clean up inactive reminders
    this.reminders = this.reminders.filter(r => r.isActive);
    this.saveReminders();
  }

  private static triggerReminder(reminder: TaskReminder | EventReminder): void {
    // Show browser notification
    if (this.notificationPermission === 'granted') {
      const title = 'taskId' in reminder ? 'Task Reminder' : 'Event Reminder';
      const body = `Don't forget about your ${title.toLowerCase()}!`;
      
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }

    // You could also trigger other actions here like:
    // - Playing a sound
    // - Showing an in-app notification
    // - Sending a push notification
    console.log('Reminder triggered:', reminder);
  }

  private static saveReminders(): void {
    try {
      localStorage.setItem('speakeasy_reminders', JSON.stringify(this.reminders));
    } catch (error) {
      console.error('Failed to save reminders:', error);
    }
  }

  static getActiveReminders(): (TaskReminder | EventReminder)[] {
    return this.reminders.filter(r => r.isActive);
  }

  static removeRemindersForTask(taskId: string): void {
    this.reminders = this.reminders.filter(r => 
      !('taskId' in r) || r.taskId !== taskId
    );
    this.saveReminders();
  }

  static removeRemindersForEvent(eventId: string): void {
    this.reminders = this.reminders.filter(r => 
      !('eventId' in r) || r.eventId !== eventId
    );
    this.saveReminders();
  }

  static cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
