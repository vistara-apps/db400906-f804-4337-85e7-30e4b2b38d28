import OpenAI from 'openai';
import { Task } from './types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY || '',
  baseURL: process.env.OPENROUTER_API_KEY ? "https://openrouter.ai/api/v1" : undefined,
});

export interface TaskPriority {
  taskId: string;
  priority: 'low' | 'medium' | 'high';
  urgencyScore: number; // 1-10
  importanceScore: number; // 1-10
  reasoning: string;
  suggestedOrder: number;
}

export interface PrioritizationResult {
  prioritizedTasks: TaskPriority[];
  summary: string;
  recommendations: string[];
}

/**
 * AI-powered task prioritization using the Eisenhower Matrix
 * and contextual analysis of task descriptions and due dates
 */
export class AITaskPrioritizer {
  /**
   * Analyze and prioritize a list of tasks using AI
   */
  static async prioritizeTasks(tasks: Task[]): Promise<PrioritizationResult> {
    if (tasks.length === 0) {
      return {
        prioritizedTasks: [],
        summary: 'No tasks to prioritize',
        recommendations: []
      };
    }

    try {
      const taskDescriptions = tasks.map((task, index) => ({
        id: task.taskId,
        index: index + 1,
        description: task.description,
        currentPriority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        isCompleted: task.isCompleted,
        createdAt: task.createdAt.toISOString()
      }));

      const prompt = `
Analyze and prioritize the following tasks using the Eisenhower Matrix (Urgent vs Important) and provide detailed reasoning.

Tasks to analyze:
${JSON.stringify(taskDescriptions, null, 2)}

For each task, provide:
1. Urgency score (1-10): How time-sensitive is this task?
2. Importance score (1-10): How much impact does this task have on goals/outcomes?
3. Priority level: low, medium, or high
4. Reasoning: Brief explanation of the scoring
5. Suggested order: Rank from 1 (highest priority) to ${tasks.length} (lowest priority)

Consider these factors:
- Due dates and time sensitivity
- Keywords indicating urgency (ASAP, urgent, deadline, etc.)
- Keywords indicating importance (important, critical, key, etc.)
- Task complexity and dependencies
- Impact on productivity and goals

Return a JSON object with this structure:
{
  "prioritizedTasks": [
    {
      "taskId": "string",
      "priority": "low" | "medium" | "high",
      "urgencyScore": number,
      "importanceScore": number,
      "reasoning": "string",
      "suggestedOrder": number
    }
  ],
  "summary": "Brief summary of the prioritization approach used",
  "recommendations": ["Array of actionable recommendations for task management"]
}

Focus on practical, actionable prioritization that helps users be more productive.
`;

      const response = await openai.chat.completions.create({
        model: process.env.OPENROUTER_API_KEY ? 'google/gemini-2.0-flash-001' : 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert productivity consultant specializing in task prioritization and time management. Provide practical, actionable advice based on proven methodologies like the Eisenhower Matrix.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI prioritization service');
      }

      const result = JSON.parse(content) as PrioritizationResult;
      
      // Validate the response structure
      if (!result.prioritizedTasks || !Array.isArray(result.prioritizedTasks)) {
        throw new Error('Invalid response format from AI prioritization service');
      }

      // Ensure all tasks are included in the response
      const responseTaskIds = new Set(result.prioritizedTasks.map(t => t.taskId));
      const inputTaskIds = new Set(tasks.map(t => t.taskId));
      
      if (responseTaskIds.size !== inputTaskIds.size) {
        console.warn('AI prioritization response missing some tasks, falling back to basic prioritization');
        return this.fallbackPrioritization(tasks);
      }

      return result;

    } catch (error) {
      console.error('AI prioritization error:', error);
      // Fallback to rule-based prioritization
      return this.fallbackPrioritization(tasks);
    }
  }

  /**
   * Fallback prioritization using rule-based logic
   */
  private static fallbackPrioritization(tasks: Task[]): PrioritizationResult {
    const now = new Date();
    
    const prioritizedTasks: TaskPriority[] = tasks
      .filter(task => !task.isCompleted)
      .map(task => {
        let urgencyScore = 5; // Default medium urgency
        let importanceScore = 5; // Default medium importance
        let priority: 'low' | 'medium' | 'high' = task.priority;

        // Analyze due date for urgency
        if (task.dueDate) {
          const daysUntilDue = Math.ceil((task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilDue <= 1) urgencyScore = 9;
          else if (daysUntilDue <= 3) urgencyScore = 7;
          else if (daysUntilDue <= 7) urgencyScore = 6;
          else urgencyScore = 4;
        }

        // Analyze description for keywords
        const description = task.description.toLowerCase();
        
        // Urgency keywords
        if (description.includes('urgent') || description.includes('asap') || description.includes('immediately')) {
          urgencyScore = Math.min(10, urgencyScore + 3);
        }
        if (description.includes('deadline') || description.includes('due')) {
          urgencyScore = Math.min(10, urgencyScore + 2);
        }

        // Importance keywords
        if (description.includes('important') || description.includes('critical') || description.includes('key')) {
          importanceScore = Math.min(10, importanceScore + 3);
        }
        if (description.includes('meeting') || description.includes('presentation') || description.includes('client')) {
          importanceScore = Math.min(10, importanceScore + 2);
        }

        // Determine priority based on scores
        const totalScore = urgencyScore + importanceScore;
        if (totalScore >= 16) priority = 'high';
        else if (totalScore >= 12) priority = 'medium';
        else priority = 'low';

        return {
          taskId: task.taskId,
          priority,
          urgencyScore,
          importanceScore,
          reasoning: `Urgency: ${urgencyScore}/10, Importance: ${importanceScore}/10`,
          suggestedOrder: 0 // Will be set after sorting
        };
      })
      .sort((a, b) => {
        // Sort by total score (urgency + importance), then by urgency
        const scoreA = a.urgencyScore + a.importanceScore;
        const scoreB = b.urgencyScore + b.importanceScore;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return b.urgencyScore - a.urgencyScore;
      })
      .map((task, index) => ({
        ...task,
        suggestedOrder: index + 1
      }));

    return {
      prioritizedTasks,
      summary: 'Tasks prioritized using rule-based analysis of due dates and keywords',
      recommendations: [
        'Focus on high-priority tasks first',
        'Consider breaking down complex tasks into smaller steps',
        'Set specific deadlines for tasks without due dates',
        'Review and adjust priorities regularly'
      ]
    };
  }

  /**
   * Get quick priority suggestions for a single task
   */
  static async suggestTaskPriority(task: Task): Promise<TaskPriority> {
    try {
      const result = await this.prioritizeTasks([task]);
      return result.prioritizedTasks[0] || {
        taskId: task.taskId,
        priority: task.priority,
        urgencyScore: 5,
        importanceScore: 5,
        reasoning: 'Default priority maintained',
        suggestedOrder: 1
      };
    } catch (error) {
      console.error('Error suggesting task priority:', error);
      return {
        taskId: task.taskId,
        priority: task.priority,
        urgencyScore: 5,
        importanceScore: 5,
        reasoning: 'Error occurred during analysis',
        suggestedOrder: 1
      };
    }
  }
}
