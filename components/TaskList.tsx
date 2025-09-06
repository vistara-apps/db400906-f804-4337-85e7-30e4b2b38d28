'use client';

import { useState, useEffect } from 'react';
import { TaskListItem } from './TaskListItem';
import { Task } from '@/lib/types';
import { StorageService } from '@/lib/storage';

interface TaskListProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
}

export function TaskList({ tasks, onTasksChange }: TaskListProps) {
  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      const updatedTask = { ...task, isCompleted: !task.isCompleted };
      await StorageService.updateTask(taskId, { isCompleted: !task.isCompleted });
      
      const updatedTasks = tasks.map(t => 
        t.taskId === taskId ? updatedTask : t
      );
      onTasksChange(updatedTasks);
    }
  };

  const handleDelete = async (taskId: string) => {
    await StorageService.deleteTask(taskId);
    const updatedTasks = tasks.filter(t => t.taskId !== taskId);
    onTasksChange(updatedTasks);
  };

  const incompleteTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);

  if (tasks.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white text-opacity-70">
          No tasks yet. Use your voice to create your first task!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {incompleteTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Active Tasks ({incompleteTasks.length})
          </h3>
          <div className="space-y-3">
            {incompleteTasks.map(task => (
              <TaskListItem
                key={task.taskId}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Completed ({completedTasks.length})
          </h3>
          <div className="space-y-3">
            {completedTasks.map(task => (
              <TaskListItem
                key={task.taskId}
                task={task}
                onToggleComplete={handleToggleComplete}
                onDelete={handleDelete}
                variant="complete"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
