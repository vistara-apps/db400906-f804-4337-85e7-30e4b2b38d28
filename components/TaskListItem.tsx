'use client';

import { useState } from 'react';
import { Check, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Task } from '@/lib/types';
import { formatDate, getPriorityColor, cn } from '@/lib/utils';

interface TaskListItemProps {
  task: Task;
  onToggleComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  variant?: 'incomplete' | 'complete' | 'dueSoon';
}

export function TaskListItem({
  task,
  onToggleComplete,
  onDelete,
  variant = 'incomplete'
}: TaskListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for UX
    onDelete(task.taskId);
  };

  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 24 * 60 * 60 * 1000);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div
      className={cn(
        'task-item group',
        {
          'opacity-60': task.isCompleted,
          'border-l-4 border-red-500': isOverdue && !task.isCompleted,
          'border-l-4 border-yellow-500': isDueSoon && !task.isCompleted && !isOverdue,
          'animate-pulse': isDeleting,
        }
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.taskId)}
          className={cn(
            'flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            task.isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-white border-opacity-40 hover:border-opacity-60'
          )}
        >
          {task.isCompleted && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-white font-medium',
              task.isCompleted && 'line-through opacity-60'
            )}
          >
            {task.title}
          </p>

          <div className="flex items-center gap-4 mt-2">
            {task.dueDate && (
              <div className="flex items-center gap-1 text-sm text-white text-opacity-70">
                <Clock className="w-4 h-4" />
                <span className={cn(
                  isOverdue && !task.isCompleted && 'text-red-400',
                  isDueSoon && !task.isCompleted && !isOverdue && 'text-yellow-400'
                )}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}

            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r',
              getPriorityColor(task.priority)
            )}>
              {task.priority}
            </div>

            {(isOverdue || isDueSoon) && !task.isCompleted && (
              <AlertCircle className={cn(
                'w-4 h-4',
                isOverdue ? 'text-red-400' : 'text-yellow-400'
              )} />
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200"
          aria-label="Delete task"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
