'use client';

import { useState, useEffect } from 'react';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarEvent } from '@/lib/types';
import { LocalStorage } from '@/lib/storage';
import { format, isToday, isTomorrow, isThisWeek } from 'date-fns';

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventsChange: (events: CalendarEvent[]) => void;
}

export function CalendarView({ events, onEventsChange }: CalendarViewProps) {
  const handleDelete = (eventId: string) => {
    LocalStorage.deleteEvent(eventId);
    const updatedEvents = events.filter(e => e.eventId !== eventId);
    onEventsChange(updatedEvents);
  };

  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const todayEvents = sortedEvents.filter(e => isToday(e.startTime));
  const tomorrowEvents = sortedEvents.filter(e => isTomorrow(e.startTime));
  const thisWeekEvents = sortedEvents.filter(e => 
    isThisWeek(e.startTime) && !isToday(e.startTime) && !isTomorrow(e.startTime)
  );
  const futureEvents = sortedEvents.filter(e => 
    !isThisWeek(e.startTime)
  );

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-white text-opacity-70">
          No events scheduled. Use your voice to create your first event!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {todayEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Today ({todayEvents.length})
          </h3>
          <div className="space-y-3">
            {todayEvents.map(event => (
              <CalendarEventCard
                key={event.eventId}
                event={event}
                onDelete={handleDelete}
                variant="day"
              />
            ))}
          </div>
        </div>
      )}

      {tomorrowEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Tomorrow ({tomorrowEvents.length})
          </h3>
          <div className="space-y-3">
            {tomorrowEvents.map(event => (
              <CalendarEventCard
                key={event.eventId}
                event={event}
                onDelete={handleDelete}
                variant="day"
              />
            ))}
          </div>
        </div>
      )}

      {thisWeekEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            This Week ({thisWeekEvents.length})
          </h3>
          <div className="space-y-3">
            {thisWeekEvents.map(event => (
              <CalendarEventCard
                key={event.eventId}
                event={event}
                onDelete={handleDelete}
                variant="upcoming"
              />
            ))}
          </div>
        </div>
      )}

      {futureEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">
            Upcoming ({futureEvents.length})
          </h3>
          <div className="space-y-3">
            {futureEvents.map(event => (
              <CalendarEventCard
                key={event.eventId}
                event={event}
                onDelete={handleDelete}
                variant="upcoming"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
