'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, Trash2 } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onDelete: (eventId: string) => void;
  variant?: 'day' | 'upcoming';
}

export function CalendarEventCard({
  event,
  onDelete,
  variant = 'upcoming'
}: CalendarEventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 200));
    onDelete(event.eventId);
  };

  const isToday = new Date(event.startTime).toDateString() === new Date().toDateString();
  const isPast = new Date(event.endTime) < new Date();

  return (
    <div
      className={cn(
        'calendar-event group',
        {
          'opacity-60': isPast,
          'border-l-4 border-blue-500': isToday && !isPast,
          'animate-pulse': isDeleting,
        }
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'text-white font-medium',
            isPast && 'line-through opacity-60'
          )}>
            {event.title}
          </h3>

          <div className="flex items-center gap-1 mt-1 text-sm text-white text-opacity-70">
            <Clock className="w-4 h-4" />
            <span>
              {formatDate(event.startTime)}
              {event.endTime && event.startTime.toDateString() === event.endTime.toDateString() && (
                ` - ${event.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              )}
            </span>
          </div>

          {event.location && (
            <div className="flex items-center gap-1 mt-1 text-sm text-white text-opacity-70">
              <MapPin className="w-4 h-4" />
              <span>{event.location}</span>
            </div>
          )}

          {event.notes && (
            <p className="mt-2 text-sm text-white text-opacity-80">
              {event.notes}
            </p>
          )}
        </div>

        <button
          onClick={handleDelete}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-all duration-200"
          aria-label="Delete event"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}
