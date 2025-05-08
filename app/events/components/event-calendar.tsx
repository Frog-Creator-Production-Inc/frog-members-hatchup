"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { CalendarEvent } from "@/app/lib/google-calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DayContent } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface EventCalendarProps {
  events: CalendarEvent[];
  onDateSelect: (date: Date | undefined) => void;
  loading?: boolean;
}

export function EventCalendar({ events, onDateSelect, loading = false }: EventCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [eventDates, setEventDates] = useState<Date[]>([]);

  useEffect(() => {
    // イベントの日付を抽出
    const dates = events.map((event) => parseISO(event.start.dateTime));
    setEventDates(dates);
  }, [events]);

  // 選択された日付のイベントを取得
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => 
      isSameDay(parseISO(event.start.dateTime), date)
    );
  };

  // 日付が選択されたときの処理
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    onDateSelect(date);
  };

  return (
    <Card className="bg-white border border-gray-100 shadow-sm w-full">
      <CardContent className="p-2 sm:p-4">
        {loading ? (
          <div className="w-full flex flex-col items-center justify-center space-y-4 py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-500">カレンダーデータを読み込み中...</p>
            <div className="w-full space-y-2">
              <Skeleton className="h-6 w-full" />
              <div className="grid grid-cols-7 gap-1">
                {Array(7).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-1 mt-2">
                  {Array(7).fill(0).map((_, j) => (
                    <Skeleton key={j} className="h-8 w-full rounded-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ja}
              className="w-full max-w-full"
              classNames={{
                months: "w-full flex flex-col space-y-4",
                month: "w-full space-y-4",
                table: "w-full border-collapse space-y-1",
                head_row: "w-full flex justify-between",
                row: "flex w-full mt-2 justify-between",
                cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-full p-0 font-normal aria-selected:opacity-100 flex items-center justify-center"
              }}
              modifiers={{
                hasEvent: (date) => 
                  eventDates.some(eventDate => isSameDay(eventDate, date))
              }}
              modifiersClassNames={{
                hasEvent: "relative before:absolute before:top-0 before:right-0 before:h-2 before:w-2 before:rounded-full before:bg-primary"
              }}
              components={{
                DayContent: (props) => {
                  const { date } = props;
                  if (!date) return <DayContent {...props} />;
                  
                  const hasEvent = eventDates.some(eventDate => 
                    isSameDay(eventDate, date)
                  );
                  
                  if (!hasEvent) return <DayContent {...props} />;
                  
                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <DayContent {...props} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="bg-white border border-gray-100 shadow-md p-2">
                          <div className="text-xs space-y-1">
                            {getEventsForDate(date).map((event) => (
                              <div key={event.id} className="py-1 px-2 hover:bg-gray-50 rounded">
                                <div className="font-medium text-gray-800">{event.summary}</div>
                                <div className="text-gray-500 flex items-center mt-0.5">
                                  {format(parseISO(event.start.dateTime), 'HH:mm')} - 
                                  {format(parseISO(event.end.dateTime), 'HH:mm')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
} 