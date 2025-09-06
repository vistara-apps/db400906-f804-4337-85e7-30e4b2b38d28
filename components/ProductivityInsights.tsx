'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Lightbulb, Calendar } from 'lucide-react';
import { Task, CalendarEvent } from '@/lib/types';
import { TaskPrioritizationService, PrioritizedTask } from '@/lib/prioritization';

interface ProductivityInsightsProps {
  tasks: Task[];
  events: CalendarEvent[];
}

interface AnalyticsData {
  completionRate: number;
  averageCompletionTime: number;
  productivityInsights: string[];
  recommendedImprovements: string[];
  todayTasks: PrioritizedTask[];
  tomorrowTasks: PrioritizedTask[];
  thisWeekTasks: PrioritizedTask[];
  suggestions: string[];
}

export function ProductivityInsights({ tasks, events }: ProductivityInsightsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'schedule'>('overview');

  useEffect(() => {
    if (tasks.length > 0) {
      generateAnalytics();
    }
  }, [tasks, events]);

  const generateAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get productivity patterns
      const patterns = TaskPrioritizationService.analyzeProductivityPatterns(tasks);
      
      // Get prioritized tasks
      const prioritizedTasks = await TaskPrioritizationService.prioritizeTasks(tasks, {
        currentTime: new Date(),
      });

      // Get scheduling suggestions
      const scheduling = await TaskPrioritizationService.getTaskSchedulingSuggestions(
        prioritizedTasks,
        { currentTime: new Date() }
      );

      setAnalytics({
        ...patterns,
        ...scheduling,
      });
    } catch (error) {
      console.error('Analytics generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="glass-card p-6 text-center">
        <BarChart3 className="w-12 h-12 text-white text-opacity-50 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Data Yet</h3>
        <p className="text-white text-opacity-70">
          Create some tasks to see your productivity insights!
        </p>
      </div>
    );
  }

  if (isLoading || !analytics) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-8 bg-white bg-opacity-20 rounded mb-4"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded mb-2"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-sm text-white text-opacity-70">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.completionRate}%
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mt-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${analytics.completionRate}%` }}
            />
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-white text-opacity-70">Avg. Completion</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.averageCompletionTime.toFixed(1)}
          </div>
          <div className="text-sm text-white text-opacity-70">days</div>
        </div>
      </div>

      {/* Task Distribution */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Task Distribution
        </h4>
        
        <div className="space-y-3">
          {['high', 'medium', 'low'].map(priority => {
            const count = tasks.filter(t => t.priority === priority).length;
            const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
            const colors = {
              high: 'from-red-400 to-pink-500',
              medium: 'from-yellow-400 to-orange-500',
              low: 'from-green-400 to-blue-500'
            };

            return (
              <div key={priority} className="flex items-center gap-3">
                <div className="w-16 text-sm text-white text-opacity-70 capitalize">
                  {priority}
                </div>
                <div className="flex-1 bg-white bg-opacity-20 rounded-full h-2">
                  <div 
                    className={`bg-gradient-to-r ${colors[priority as keyof typeof colors]} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-8 text-sm text-white text-opacity-70">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderInsights = () => (
    <div className="space-y-6">
      {/* Productivity Insights */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Productivity Insights
        </h4>
        
        <div className="space-y-3">
          {analytics.productivityInsights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-white text-opacity-90 text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Recommendations
        </h4>
        
        <div className="space-y-3">
          {analytics.recommendedImprovements.map((improvement, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-white bg-opacity-10 rounded-lg">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-white text-opacity-90 text-sm">{improvement}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      {analytics.suggestions.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            AI Suggestions
          </h4>
          
          <div className="space-y-3">
            {analytics.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-white bg-opacity-10 rounded-lg">
                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                <p className="text-white text-opacity-90 text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      {/* Today's Tasks */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today's Focus ({analytics.todayTasks.length})
        </h4>
        
        {analytics.todayTasks.length > 0 ? (
          <div className="space-y-3">
            {analytics.todayTasks.map((task, index) => (
              <div key={task.taskId} className="flex items-center gap-3 p-3 bg-white bg-opacity-10 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{task.description}</p>
                  <p className="text-white text-opacity-70 text-xs mt-1">
                    AI Score: {task.aiScore}/100 • {task.aiReasoning}
                  </p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-500 bg-opacity-20 text-red-200' :
                  task.priority === 'medium' ? 'bg-yellow-500 bg-opacity-20 text-yellow-200' :
                  'bg-green-500 bg-opacity-20 text-green-200'
                }`}>
                  {task.priority}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white text-opacity-70 text-sm">No high-priority tasks for today!</p>
        )}
      </div>

      {/* Tomorrow's Tasks */}
      {analytics.tomorrowTasks.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-lg font-semibold text-white mb-4">
            Tomorrow's Plan ({analytics.tomorrowTasks.length})
          </h4>
          
          <div className="space-y-2">
            {analytics.tomorrowTasks.map((task, index) => (
              <div key={task.taskId} className="flex items-center gap-3 p-2 bg-white bg-opacity-5 rounded">
                <div className="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white text-xs">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-white text-opacity-90 text-sm">{task.description}</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${
                  task.priority === 'high' ? 'bg-red-500 bg-opacity-20 text-red-200' :
                  task.priority === 'medium' ? 'bg-yellow-500 bg-opacity-20 text-yellow-200' :
                  'bg-green-500 bg-opacity-20 text-green-200'
                }`}>
                  {task.priority}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This Week */}
      {analytics.thisWeekTasks.length > 0 && (
        <div className="glass-card p-4">
          <h4 className="text-lg font-semibold text-white mb-4">
            This Week ({analytics.thisWeekTasks.length})
          </h4>
          
          <div className="space-y-2">
            {analytics.thisWeekTasks.slice(0, 5).map((task) => (
              <div key={task.taskId} className="flex items-center gap-3 p-2 bg-white bg-opacity-5 rounded">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <div className="flex-1">
                  <p className="text-white text-opacity-80 text-sm">{task.description}</p>
                  {task.dueDate && (
                    <p className="text-white text-opacity-50 text-xs">
                      Due: {task.dueDate.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {analytics.thisWeekTasks.length > 5 && (
              <p className="text-white text-opacity-50 text-xs text-center pt-2">
                +{analytics.thisWeekTasks.length - 5} more tasks this week
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="glass-card p-2">
        <div className="flex items-center justify-center gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'insights' && renderInsights()}
      {activeTab === 'schedule' && renderSchedule()}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={generateAnalytics}
          disabled={isLoading}
          className="glass-button px-6 py-2 text-white text-sm font-medium disabled:opacity-50"
        >
          {isLoading ? 'Analyzing...' : 'Refresh Analytics'}
        </button>
      </div>
    </div>
  );
}
