import { Task } from './types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  baseURL: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
  dangerouslyAllowBrowser: true,
});

export interface PrioritizedTask extends Task {
  aiScore: number;
  aiReasoning: string;
  suggestedOrder: number;
}

export interface PrioritizationContext {
  currentTime: Date;
  userPreferences?: {
    workingHours?: { start: number; end: number };
    preferredTaskTypes?: string[];
    urgencyBias?: 'high' | 'medium' | 'low';
  };
  existingTasks?: Task[];
}

export class TaskPrioritizationService {
  /**
   * Analyze and prioritize a list of tasks using AI
   */
  static async prioritizeTasks(
    tasks: Task[], 
    context: PrioritizationContext = { currentTime: new Date() }
  ): Promise<PrioritizedTask[]> {
    if (tasks.length === 0) return [];

    try {
      const systemPrompt = `You are an AI task prioritization assistant. Analyze the given tasks and provide prioritization scores and reasoning.

IMPORTANT: Respond with valid JSON only.

Consider these factors:
1. Due dates and urgency
2. Task priority levels (high/medium/low)
3. Current time context
4. Task complexity (inferred from description)
5. Dependencies between tasks
6. Work-life balance

For each task, provide:
- aiScore: number between 0-100 (100 = highest priority)
- aiReasoning: brief explanation of the score
- suggestedOrder: integer ranking (1 = do first)

Return format:
{
  "prioritizedTasks": [
    {
      "taskId": "string",
      "aiScore": number,
      "aiReasoning": "string",
      "suggestedOrder": number
    }
  ]
}`;

      const userPrompt = `Current time: ${context.currentTime.toISOString()}

Tasks to prioritize:
${tasks.map((task, index) => `
${index + 1}. Task ID: ${task.taskId}
   Description: ${task.description}
   Priority: ${task.priority}
   Due Date: ${task.dueDate ? task.dueDate.toISOString() : 'None'}
   Created: ${task.createdAt.toISOString()}
   Completed: ${task.isCompleted}
`).join('')}

${context.userPreferences ? `
User Preferences:
- Working Hours: ${context.userPreferences.workingHours?.start || 9}:00 - ${context.userPreferences.workingHours?.end || 17}:00
- Urgency Bias: ${context.userPreferences.urgencyBias || 'medium'}
` : ''}

Analyze and prioritize these tasks.`;

      const response = await openai.chat.completions.create({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI prioritization service');
      }

      const result = JSON.parse(content);
      
      // Merge AI analysis with original tasks
      const prioritizedTasks: PrioritizedTask[] = tasks.map(task => {
        const aiAnalysis = result.prioritizedTasks.find((p: any) => p.taskId === task.taskId);
        return {
          ...task,
          aiScore: aiAnalysis?.aiScore || 50,
          aiReasoning: aiAnalysis?.aiReasoning || 'No AI analysis available',
          suggestedOrder: aiAnalysis?.suggestedOrder || 999,
        };
      });

      // Sort by suggested order
      return prioritizedTasks.sort((a, b) => a.suggestedOrder - b.suggestedOrder);

    } catch (error) {
      console.error('Task prioritization error:', error);
      
      // Fallback to simple prioritization
      return this.fallbackPrioritization(tasks, context);
    }
  }

  /**
   * Simple fallback prioritization when AI is unavailable
   */
  private static fallbackPrioritization(
    tasks: Task[], 
    context: PrioritizationContext
  ): PrioritizedTask[] {
    const now = context.currentTime;

    return tasks.map((task, index) => {
      let score = 50; // Base score
      let reasoning = 'Fallback prioritization: ';

      // Priority weight
      if (task.priority === 'high') {
        score += 30;
        reasoning += 'High priority (+30). ';
      } else if (task.priority === 'low') {
        score -= 20;
        reasoning += 'Low priority (-20). ';
      }

      // Due date urgency
      if (task.dueDate) {
        const daysUntilDue = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          score += 40; // Overdue
          reasoning += 'Overdue (+40). ';
        } else if (daysUntilDue === 0) {
          score += 35; // Due today
          reasoning += 'Due today (+35). ';
        } else if (daysUntilDue === 1) {
          score += 25; // Due tomorrow
          reasoning += 'Due tomorrow (+25). ';
        } else if (daysUntilDue <= 3) {
          score += 15; // Due within 3 days
          reasoning += 'Due within 3 days (+15). ';
        }
      }

      // Recency bonus (newer tasks get slight priority)
      const hoursOld = (now.getTime() - task.createdAt.getTime()) / (1000 * 60 * 60);
      if (hoursOld < 24) {
        score += 5;
        reasoning += 'Recently created (+5). ';
      }

      // Ensure score is within bounds
      score = Math.max(0, Math.min(100, score));

      return {
        ...task,
        aiScore: score,
        aiReasoning: reasoning.trim(),
        suggestedOrder: index + 1, // Will be re-sorted
      };
    }).sort((a, b) => b.aiScore - a.aiScore) // Sort by score descending
      .map((task, index) => ({ ...task, suggestedOrder: index + 1 })); // Update order
  }

  /**
   * Get smart suggestions for task scheduling
   */
  static async getTaskSchedulingSuggestions(
    tasks: PrioritizedTask[],
    context: PrioritizationContext
  ): Promise<{
    todayTasks: PrioritizedTask[];
    tomorrowTasks: PrioritizedTask[];
    thisWeekTasks: PrioritizedTask[];
    suggestions: string[];
  }> {
    const now = context.currentTime;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const incompleteTasks = tasks.filter(t => !t.isCompleted);
    
    // Categorize tasks
    const todayTasks = incompleteTasks.filter(task => 
      task.aiScore >= 70 || 
      (task.dueDate && task.dueDate <= tomorrow) ||
      task.priority === 'high'
    ).slice(0, 5); // Limit to 5 tasks for today

    const tomorrowTasks = incompleteTasks.filter(task => 
      !todayTasks.includes(task) && 
      (task.aiScore >= 50 || (task.dueDate && task.dueDate <= endOfWeek))
    ).slice(0, 3); // Limit to 3 tasks for tomorrow

    const thisWeekTasks = incompleteTasks.filter(task => 
      !todayTasks.includes(task) && 
      !tomorrowTasks.includes(task) &&
      (task.dueDate && task.dueDate <= endOfWeek)
    );

    // Generate suggestions
    const suggestions: string[] = [];
    
    if (todayTasks.length > 5) {
      suggestions.push(`You have ${todayTasks.length} high-priority tasks. Consider focusing on the top 3 first.`);
    }

    const overdueTasks = incompleteTasks.filter(t => t.dueDate && t.dueDate < today);
    if (overdueTasks.length > 0) {
      suggestions.push(`You have ${overdueTasks.length} overdue task(s). Consider addressing these immediately.`);
    }

    const highPriorityTasks = incompleteTasks.filter(t => t.priority === 'high' && !t.dueDate);
    if (highPriorityTasks.length > 0) {
      suggestions.push(`${highPriorityTasks.length} high-priority task(s) don't have due dates. Consider setting deadlines.`);
    }

    if (incompleteTasks.length > 20) {
      suggestions.push('You have many tasks. Consider breaking down large tasks or delegating some items.');
    }

    return {
      todayTasks,
      tomorrowTasks,
      thisWeekTasks,
      suggestions,
    };
  }

  /**
   * Analyze task completion patterns and provide insights
   */
  static analyzeProductivityPatterns(tasks: Task[]): {
    completionRate: number;
    averageCompletionTime: number;
    productivityInsights: string[];
    recommendedImprovements: string[];
  } {
    const completedTasks = tasks.filter(t => t.isCompleted);
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Calculate average completion time (simplified)
    const tasksWithDueDates = completedTasks.filter(t => t.dueDate);
    const averageCompletionTime = tasksWithDueDates.length > 0 
      ? tasksWithDueDates.reduce((sum, task) => {
          const completionTime = task.dueDate!.getTime() - task.createdAt.getTime();
          return sum + completionTime;
        }, 0) / tasksWithDueDates.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    const insights: string[] = [];
    const improvements: string[] = [];

    // Completion rate insights
    if (completionRate >= 80) {
      insights.push('Excellent task completion rate! You\'re very productive.');
    } else if (completionRate >= 60) {
      insights.push('Good task completion rate. Room for improvement.');
      improvements.push('Try breaking down large tasks into smaller, manageable pieces.');
    } else {
      insights.push('Low task completion rate. Consider reviewing your task management approach.');
      improvements.push('Focus on completing fewer, high-priority tasks rather than creating many tasks.');
      improvements.push('Set more realistic deadlines and priorities.');
    }

    // Priority distribution insights
    const priorityCounts = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    };

    if (priorityCounts.high > totalTasks * 0.5) {
      insights.push('You mark many tasks as high priority. Consider being more selective.');
      improvements.push('Reserve "high priority" for truly urgent and important tasks.');
    }

    // Due date insights
    const tasksWithoutDueDates = tasks.filter(t => !t.dueDate).length;
    if (tasksWithoutDueDates > totalTasks * 0.3) {
      insights.push('Many tasks lack due dates, which can hurt prioritization.');
      improvements.push('Set realistic due dates for better time management.');
    }

    return {
      completionRate: Math.round(completionRate),
      averageCompletionTime: Math.round(averageCompletionTime * 10) / 10,
      productivityInsights: insights,
      recommendedImprovements: improvements,
    };
  }
}
