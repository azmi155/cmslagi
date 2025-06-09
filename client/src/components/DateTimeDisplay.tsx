import * as React from 'react';
import { useEffect, useState } from 'react';
import { Calendar } from './ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

export function DateTimeDisplay() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Digital Clock */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2" />
            Current Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-primary">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {formatDate(currentTime)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <CalendarIcon className="h-5 w-5 mr-2" />
            Calendar
          </CardTitle>
          <CardDescription>
            {selectedDate ? `Selected: ${formatDate(selectedDate)}` : 'Select a date'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </CardContent>
      </Card>
    </div>
  );
}
