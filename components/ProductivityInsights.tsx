'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const generateAnalytics = useCallback(async () => {
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
  }, [tasks]);

  useEffect(() => {
    if (tasks.length > 0) {
      generateAnalytics();
    }
  }, [tasks, generateAnalytics]);

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
          Recommended Improvements
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
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      {/* Suggestions */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Smart Suggestions
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

      {/* Today's Tasks */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Today&apos;s Priority Tasks</h4>
        
        {analytics.todayTasks.length === 0 ? (
          <p className="text-white text-opacity-70 text-sm">No urgent tasks for today! 🎉</p>
        ) : (
          <div className="space-y-2">
            {analytics.todayTasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-2 bg-white bg-opacity-5 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  task.urgencyLevel === 'critical' ? 'bg-red-500' :
                  task.urgencyLevel === 'high' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`} />
                <span className="text-white text-opacity-90 text-sm flex-1">{task.title}</span>
                <span className="text-xs text-white text-opacity-50">
                  {task.estimatedDuration}min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tomorrow's Tasks */}
      <div className="glass-card p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Tomorrow&apos;s Tasks</h4>
        
        {analytics.tomorrowTasks.length === 0 ? (
          <p className="text-white text-opacity-70 text-sm">No tasks scheduled for tomorrow.</p>
        ) : (
          <div className="space-y-2">
            {analytics.tomorrowTasks.map((task, index) => (
              <div key={task.id} className="flex items-center gap-3 p-2 bg-white bg-opacity-5 rounded">
                <div className={`w-2 h-2 rounded-full ${
                  task.urgencyLevel === 'high' ? 'bg-orange-500' :
                  task.urgencyLevel === 'medium' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
                <span className="text-white text-opacity-90 text-sm flex-1">{task.title}</span>
                <span className="text-xs text-white text-opacity-50">
                  {task.estimatedDuration}min
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-white bg-opacity-10 rounded-lg">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'insights', label: 'Insights', icon: TrendingUp },
          { id: 'schedule', label: 'Schedule', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex-1 justify-center ${
                activeTab === tab.id
                  ? 'bg-white bg-opacity-20 text-white'
                  : 'text-white text-opacity-70 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'insights' && renderInsights()}
      {activeTab === 'schedule' && renderSchedule()}
    </div>
  );
}
