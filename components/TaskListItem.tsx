'use client';

import { useState } from 'react';
import { Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Task } from '@/lib/types';
import { formatDate, getPriorityColor } from '@/lib/utils';

interface TaskListItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskListItem({ task, onToggleComplete, onDelete }: TaskListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Animation delay
    onDelete(task.taskId);
  };

  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div className={`task-item ${isDeleting ? 'opacity-0 scale-95' : ''} transition-all duration-300`}>
      <div className="flex items-start space-x-3">
        {/* Priority indicator */}
        <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} mt-1 flex-shrink-0`} />
        
        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-white font-medium ${task.isCompleted ? 'line-through opacity-60' : ''}`}>
                {task.description}
              </h3>
              
              {task.dueDate && (
                <div className="flex items-center mt-1 text-sm">
                  {isDueSoon && !task.isCompleted ? (
                    <AlertCircle className="w-4 h-4 text-yellow-400 mr-1" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-400 mr-1" />
                  )}
                  <span className={`${isDueSoon && !task.isCompleted ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {formatDate(task.dueDate)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => onToggleComplete(task.taskId)}
                className={`p-1 rounded-full transition-colors duration-200 ${
                  task.isCompleted 
                    ? 'bg-green-500 text-white' 
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                aria-label={task.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
              >
                <Check className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDelete}
                className="p-1 rounded-full bg-white bg-opacity-20 text-white hover:bg-red-500 hover:bg-opacity-100 transition-colors duration-200"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
