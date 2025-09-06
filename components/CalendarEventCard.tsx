'use client';

import { useState } from 'react';
import { Calendar, MapPin, Trash2, Clock } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onDelete: (eventId: string) => void;
  variant?: 'day' | 'upcoming';
}

export function CalendarEventCard({ event, onDelete, variant = 'upcoming' }: CalendarEventCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 300)); // Animation delay
    onDelete(event.eventId);
  };

  const duration = event.endTime.getTime() - event.startTime.getTime();
  const durationMinutes = Math.round(duration / (1000 * 60));
  const durationText = durationMinutes >= 60 
    ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
    : `${durationMinutes}m`;

  return (
    <div className={`calendar-event ${isDeleting ? 'opacity-0 scale-95' : ''} transition-all duration-300`}>
      <div className="flex items-start space-x-3">
        {/* Event indicator */}
        <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
        
        {/* Event content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-white font-medium">
                {event.title}
              </h3>
              
              <div className="flex items-center mt-1 text-sm text-gray-300">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(event.startTime)}</span>
                <Clock className="w-4 h-4 ml-3 mr-1" />
                <span>{durationText}</span>
              </div>
              
              {event.location && (
                <div className="flex items-center mt-1 text-sm text-gray-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{event.location}</span>
                </div>
              )}
              
              {event.notes && (
                <p className="text-sm text-gray-400 mt-2">
                  {event.notes}
                </p>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handleDelete}
                className="p-1 rounded-full bg-white bg-opacity-20 text-white hover:bg-red-500 hover:bg-opacity-100 transition-colors duration-200"
                aria-label="Delete event"
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
