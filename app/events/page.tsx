"use client";

import { useState, useEffect } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ja } from "date-fns/locale";
import { EventCalendar } from "./components/event-calendar";
import { EventList } from "./components/event-list";
import EventHeader from "./components/event-header";
import { CalendarEvent } from "@/app/lib/google-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventsPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // イベントを取得する関数
  const fetchEvents = async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const response = await fetch(`/api/events?year=${year}&month=${month}`);
      
      if (!response.ok) {
        throw new Error('イベントの取得に失敗しました');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('イベントの取得中にエラーが発生しました。後でもう一度お試しください。');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // 初回レンダリング時とcurrentDateが変更されたときにイベントを取得
  useEffect(() => {
    fetchEvents(currentDate);
  }, [currentDate]);

  // 前月に移動
  const handlePrevMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
    setSelectedDate(undefined);
  };

  // 翌月に移動
  const handleNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
    setSelectedDate(undefined);
  };

  // 日付が選択されたときの処理
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  return (
    <div className="space-y-6">
      <EventHeader />
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">イベントカレンダー</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <EventCalendar 
                events={events} 
                onDateSelect={handleDateSelect} 
                loading={loading}
              />
            </div>
            <div className="md:col-span-2">
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
              ) : (
                <EventList 
                  events={events} 
                  selectedDate={selectedDate} 
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 