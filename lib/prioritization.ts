import { Task, CalendarEvent } from './types';

export interface PrioritizedTask extends Task {
  priorityScore: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToDeadline?: number; // hours
  estimatedDuration?: number; // minutes
}

export interface ProductivityPattern {
  completionRate: number;
  averageCompletionTime: number;
  productivityInsights: string[];
  recommendedImprovements: string[];
}

export interface SchedulingSuggestion {
  todayTasks: PrioritizedTask[];
  tomorrowTasks: PrioritizedTask[];
  thisWeekTasks: PrioritizedTask[];
  suggestions: string[];
}

export class TaskPrioritizationService {
  static async prioritizeTasks(
    tasks: Task[], 
    context: { currentTime: Date }
  ): Promise<PrioritizedTask[]> {
    const prioritizedTasks: PrioritizedTask[] = tasks.map(task => {
      const priorityScore = this.calculatePriorityScore(task, context.currentTime);
      const urgencyLevel = this.determineUrgencyLevel(task, context.currentTime);
      const timeToDeadline = task.dueDate 
        ? (new Date(task.dueDate).getTime() - context.currentTime.getTime()) / (1000 * 60 * 60)
        : undefined;

      return {
        ...task,
        priorityScore,
        urgencyLevel,
        timeToDeadline,
        estimatedDuration: this.estimateTaskDuration(task)
      };
    });

    // Sort by priority score (highest first)
    return prioritizedTasks.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private static calculatePriorityScore(task: Task, currentTime: Date): number {
    let score = 0;

    // Base priority score
    switch (task.priority) {
      case 'high':
        score += 100;
        break;
      case 'medium':
        score += 50;
        break;
      case 'low':
        score += 25;
        break;
    }

    // Time-based urgency
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDue < 0) {
        // Overdue
        score += 200;
      } else if (hoursUntilDue < 2) {
        // Due within 2 hours
        score += 150;
      } else if (hoursUntilDue < 24) {
        // Due within 24 hours
        score += 75;
      } else if (hoursUntilDue < 72) {
        // Due within 3 days
        score += 25;
      }
    }

    // Completion status penalty
    if (task.isCompleted) {
      score = 0;
    }

    // Task age (older tasks get slight priority boost)
    const taskAge = (currentTime.getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (taskAge > 7) {
      score += 10; // Small boost for tasks older than a week
    }

    return Math.max(0, score);
  }

  private static determineUrgencyLevel(task: Task, currentTime: Date): 'low' | 'medium' | 'high' | 'critical' {
    if (task.isCompleted) return 'low';

    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const hoursUntilDue = (dueDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDue < 0) return 'critical'; // Overdue
      if (hoursUntilDue < 2) return 'critical';
      if (hoursUntilDue < 24) return 'high';
      if (hoursUntilDue < 72) return 'medium';
    }

    // Base on priority if no due date
    switch (task.priority) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  private static estimateTaskDuration(task: Task): number {
    // Simple heuristic based on title length and priority
    const titleLength = task.title.length;
    let baseDuration = 30; // 30 minutes default

    if (titleLength > 50) baseDuration += 15;
    if (titleLength > 100) baseDuration += 15;

    switch (task.priority) {
      case 'high':
        baseDuration += 30;
        break;
      case 'medium':
        baseDuration += 15;
        break;
      case 'low':
        baseDuration += 0;
        break;
    }

    // Check for keywords that suggest longer tasks
    const longTaskKeywords = ['research', 'analyze', 'write', 'develop', 'create', 'design', 'plan'];
    const shortTaskKeywords = ['call', 'email', 'check', 'review', 'update', 'fix'];

    const titleLower = task.title.toLowerCase();
    
    if (longTaskKeywords.some(keyword => titleLower.includes(keyword))) {
      baseDuration += 45;
    }
    
    if (shortTaskKeywords.some(keyword => titleLower.includes(keyword))) {
      baseDuration -= 15;
    }

    return Math.max(15, baseDuration); // Minimum 15 minutes
  }

  static analyzeProductivityPatterns(tasks: Task[]): ProductivityPattern {
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalTasks = tasks.length;
    
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
    
    // Calculate average completion time
    let totalCompletionTime = 0;
    let tasksWithCompletionTime = 0;

    completedTasks.forEach(task => {
      if (task.completedAt && task.createdAt) {
        const completionTime = (new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        totalCompletionTime += completionTime;
        tasksWithCompletionTime++;
      }
    });

    const averageCompletionTime = tasksWithCompletionTime > 0 
      ? totalCompletionTime / tasksWithCompletionTime 
      : 0;

    // Generate insights
    const insights: string[] = [];
    const improvements: string[] = [];

    if (completionRate > 80) {
      insights.push("Excellent task completion rate! You're staying on top of your work.");
    } else if (completionRate > 60) {
      insights.push("Good task completion rate. There's room for improvement.");
      improvements.push("Try breaking down larger tasks into smaller, manageable chunks.");
    } else {
      insights.push("Your task completion rate could use some attention.");
      improvements.push("Consider reviewing your task priorities and deadlines.");
      improvements.push("Focus on completing high-priority tasks first.");
    }

    if (averageCompletionTime > 7) {
      insights.push("Tasks are taking longer than a week to complete on average.");
      improvements.push("Set more realistic deadlines and break tasks into smaller parts.");
    } else if (averageCompletionTime < 1) {
      insights.push("You're completing tasks quickly! Great productivity.");
    }

    // Analyze priority distribution
    const highPriorityTasks = tasks.filter(t => t.priority === 'high').length;
    const totalActiveTasks = tasks.filter(t => !t.isCompleted).length;
    
    if (highPriorityTasks > totalActiveTasks * 0.5) {
      insights.push("You have many high-priority tasks. Consider if they're all truly urgent.");
      improvements.push("Review task priorities to ensure they reflect actual importance.");
    }

    return {
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      productivityInsights: insights,
      recommendedImprovements: improvements
    };
  }

  static async getTaskSchedulingSuggestions(
    prioritizedTasks: PrioritizedTask[],
    context: { currentTime: Date }
  ): Promise<SchedulingSuggestion> {
    const now = context.currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const activeTasks = prioritizedTasks.filter(t => !t.isCompleted);

    // Categorize tasks by suggested timing
    const todayTasks = activeTasks.filter(task => {
      if (task.urgencyLevel === 'critical') return true;
      if (task.urgencyLevel === 'high' && task.timeToDeadline && task.timeToDeadline < 48) return true;
      return false;
    }).slice(0, 5); // Limit to 5 tasks for today

    const tomorrowTasks = activeTasks.filter(task => {
      if (todayTasks.includes(task)) return false;
      if (task.urgencyLevel === 'high') return true;
      if (task.urgencyLevel === 'medium' && task.timeToDeadline && task.timeToDeadline < 72) return true;
      return false;
    }).slice(0, 3); // Limit to 3 tasks for tomorrow

    const thisWeekTasks = activeTasks.filter(task => {
      if (todayTasks.includes(task) || tomorrowTasks.includes(task)) return false;
      if (task.timeToDeadline && task.timeToDeadline < 168) return true; // Within a week
      return task.urgencyLevel === 'medium';
    }).slice(0, 7); // Limit to 7 tasks for this week

    // Generate suggestions
    const suggestions: string[] = [];

    if (todayTasks.length === 0) {
      suggestions.push("Great! No urgent tasks for today. Consider working on medium-priority items.");
    } else if (todayTasks.length > 3) {
      suggestions.push("You have many urgent tasks today. Consider delegating or rescheduling some if possible.");
    }

    if (activeTasks.filter(t => t.urgencyLevel === 'critical').length > 0) {
      suggestions.push("You have overdue tasks! Prioritize these immediately.");
    }

    const totalEstimatedTime = todayTasks.reduce((sum, task) => sum + (task.estimatedDuration || 30), 0);
    if (totalEstimatedTime > 480) { // More than 8 hours
      suggestions.push("Today's tasks might take more than 8 hours. Consider moving some to tomorrow.");
    }

    if (activeTasks.length > 20) {
      suggestions.push("You have many active tasks. Consider archiving completed ones and focusing on the most important.");
    }

    return {
      todayTasks,
      tomorrowTasks,
      thisWeekTasks,
      suggestions
    };
  }
}
