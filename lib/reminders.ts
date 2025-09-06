import { Reminder, Task, CalendarEvent } from './types';
import { StorageService } from './storage';
import { generateId } from './utils';

export interface ReminderTrigger {
  type: 'time' | 'location' | 'completion';
  value: string;
  label: string;
}

export interface ContextualReminderOptions {
  taskId?: string;
  eventId?: string;
  userId: string;
  triggers: ReminderTrigger[];
  message?: string;
}

/**
 * Contextual reminder system that can trigger based on:
 * - Time (specific time, relative time)
 * - Location (if geolocation is available)
 * - Task completion (after completing another task)
 */
export class ContextualReminderService {
  private static activeReminders: Map<string, NodeJS.Timeout> = new Map();
  private static notificationPermission: NotificationPermission = 'default';

  /**
   * Initialize the reminder service
   */
  static async initialize(): Promise<void> {
    // Request notification permission
    if ('Notification' in window) {
      this.notificationPermission = await Notification.requestPermission();
    }

    // Load and schedule existing reminders
    await this.loadAndScheduleReminders();

    // Set up periodic check for reminders
    setInterval(() => {
      this.checkReminders();
    }, 60000); // Check every minute
  }

  /**
   * Create a new contextual reminder
   */
  static async createReminder(options: ContextualReminderOptions): Promise<Reminder | null> {
    const reminder: Reminder = {
      reminderId: generateId(),
      taskId: options.taskId,
      eventId: options.eventId,
      userId: options.userId,
      triggerType: options.triggers[0]?.type || 'time',
      triggerValue: options.triggers[0]?.value || '',
      isTriggered: false,
      createdAt: new Date(),
    };

    const savedReminder = await StorageService.addReminder(reminder);
    if (savedReminder) {
      this.scheduleReminder(savedReminder);
    }

    return savedReminder;
  }

  /**
   * Create time-based reminders for a task
   */
  static async createTaskReminders(task: Task): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const userId = StorageService.getCurrentUserId();

    // Create reminder based on due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      
      // Reminder 1 day before due date
      const oneDayBefore = new Date(dueDate.getTime() - 24 * 60 * 60 * 1000);
      if (oneDayBefore > now) {
        const reminder = await this.createReminder({
          taskId: task.taskId,
          userId,
          triggers: [{
            type: 'time',
            value: oneDayBefore.toISOString(),
            label: '1 day before due date'
          }]
        });
        if (reminder) reminders.push(reminder);
      }

      // Reminder 1 hour before due date
      const oneHourBefore = new Date(dueDate.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        const reminder = await this.createReminder({
          taskId: task.taskId,
          userId,
          triggers: [{
            type: 'time',
            value: oneHourBefore.toISOString(),
            label: '1 hour before due date'
          }]
        });
        if (reminder) reminders.push(reminder);
      }
    }

    // Create priority-based reminders
    if (task.priority === 'high') {
      // High priority tasks get a reminder in 2 hours if no due date
      if (!task.dueDate) {
        const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000);
        const reminder = await this.createReminder({
          taskId: task.taskId,
          userId,
          triggers: [{
            type: 'time',
            value: twoHoursLater.toISOString(),
            label: 'High priority task reminder'
          }]
        });
        if (reminder) reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Create time-based reminders for an event
   */
  static async createEventReminders(event: CalendarEvent): Promise<Reminder[]> {
    const reminders: Reminder[] = [];
    const userId = StorageService.getCurrentUserId();
    const startTime = new Date(event.startTime);
    const now = new Date();

    // Reminder 15 minutes before event
    const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);
    if (fifteenMinutesBefore > now) {
      const reminder = await this.createReminder({
        eventId: event.eventId,
        userId,
        triggers: [{
          type: 'time',
          value: fifteenMinutesBefore.toISOString(),
          label: '15 minutes before event'
        }]
      });
      if (reminder) reminders.push(reminder);
    }

    // Reminder 1 hour before event (for longer events)
    const eventDuration = event.endTime.getTime() - event.startTime.getTime();
    if (eventDuration > 60 * 60 * 1000) { // If event is longer than 1 hour
      const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > now) {
        const reminder = await this.createReminder({
          eventId: event.eventId,
          userId,
          triggers: [{
            type: 'time',
            value: oneHourBefore.toISOString(),
            label: '1 hour before event'
          }]
        });
        if (reminder) reminders.push(reminder);
      }
    }

    return reminders;
  }

  /**
   * Schedule a reminder for execution
   */
  private static scheduleReminder(reminder: Reminder): void {
    if (reminder.triggerType === 'time') {
      const triggerTime = new Date(reminder.triggerValue);
      const now = new Date();
      const delay = triggerTime.getTime() - now.getTime();

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          this.triggerReminder(reminder);
        }, delay);

        this.activeReminders.set(reminder.reminderId, timeoutId);
      }
    }
  }

  /**
   * Trigger a reminder (show notification)
   */
  private static async triggerReminder(reminder: Reminder): Promise<void> {
    try {
      // Mark reminder as triggered
      await StorageService.triggerReminder(reminder.reminderId);

      // Get the associated task or event
      let title = 'Reminder';
      let body = 'You have a reminder';

      if (reminder.taskId) {
        const tasks = await StorageService.getTasks();
        const task = tasks.find(t => t.taskId === reminder.taskId);
        if (task) {
          title = 'Task Reminder';
          body = `Don't forget: ${task.description}`;
        }
      } else if (reminder.eventId) {
        const events = await StorageService.getEvents();
        const event = events.find(e => e.eventId === reminder.eventId);
        if (event) {
          title = 'Event Reminder';
          body = `Upcoming: ${event.title}`;
        }
      }

      // Show notification
      this.showNotification(title, body);

      // Remove from active reminders
      this.activeReminders.delete(reminder.reminderId);

    } catch (error) {
      console.error('Error triggering reminder:', error);
    }
  }

  /**
   * Show a notification to the user
   */
  private static showNotification(title: string, body: string): void {
    if (this.notificationPermission === 'granted' && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'speakeasy-reminder',
        requireInteraction: true,
      });
    } else {
      // Fallback to browser alert or custom in-app notification
      console.log(`Reminder: ${title} - ${body}`);
      
      // You could dispatch a custom event here for in-app notifications
      window.dispatchEvent(new CustomEvent('speakeasy-reminder', {
        detail: { title, body }
      }));
    }
  }

  /**
   * Load existing reminders and schedule them
   */
  private static async loadAndScheduleReminders(): Promise<void> {
    try {
      const reminders = await StorageService.getReminders();
      reminders.forEach(reminder => {
        if (!reminder.isTriggered) {
          this.scheduleReminder(reminder);
        }
      });
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  }

  /**
   * Check for reminders that should be triggered (fallback mechanism)
   */
  private static async checkReminders(): Promise<void> {
    try {
      const reminders = await StorageService.getReminders();
      const now = new Date();

      for (const reminder of reminders) {
        if (!reminder.isTriggered && reminder.triggerType === 'time') {
          const triggerTime = new Date(reminder.triggerValue);
          if (triggerTime <= now) {
            await this.triggerReminder(reminder);
          }
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }

  /**
   * Cancel a reminder
   */
  static async cancelReminder(reminderId: string): Promise<boolean> {
    // Clear the timeout if it exists
    const timeoutId = this.activeReminders.get(reminderId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activeReminders.delete(reminderId);
    }

    // Delete from storage
    return await StorageService.deleteReminder(reminderId);
  }

  /**
   * Get all active reminders for the current user
   */
  static async getActiveReminders(): Promise<Reminder[]> {
    return await StorageService.getReminders();
  }

  /**
   * Create location-based reminder (if geolocation is available)
   */
  static async createLocationReminder(
    taskId: string,
    latitude: number,
    longitude: number,
    radius: number = 100
  ): Promise<Reminder | null> {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocation not supported');
      return null;
    }

    const userId = StorageService.getCurrentUserId();
    const locationValue = JSON.stringify({ latitude, longitude, radius });

    return await this.createReminder({
      taskId,
      userId,
      triggers: [{
        type: 'location',
        value: locationValue,
        label: `Within ${radius}m of location`
      }]
    });
  }

  /**
   * Check location-based reminders (call this when location changes)
   */
  static async checkLocationReminders(currentLat: number, currentLng: number): Promise<void> {
    try {
      const reminders = await StorageService.getReminders();
      
      for (const reminder of reminders) {
        if (!reminder.isTriggered && reminder.triggerType === 'location') {
          const locationData = JSON.parse(reminder.triggerValue);
          const distance = this.calculateDistance(
            currentLat, currentLng,
            locationData.latitude, locationData.longitude
          );

          if (distance <= locationData.radius) {
            await this.triggerReminder(reminder);
          }
        }
      }
    } catch (error) {
      console.error('Error checking location reminders:', error);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  private static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}
