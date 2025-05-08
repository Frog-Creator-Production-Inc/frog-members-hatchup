"use client";

import { useState, useEffect } from "react";
import { CalendarEvent } from "@/app/lib/google-calendar";
import { format, parseISO, isSameDay } from "date-fns";
import { ja } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar as CalendarIcon, Clock, ExternalLink, Info, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface EventListProps {
  events: CalendarEvent[];
  selectedDate?: Date;
}

export function EventList({ events, selectedDate }: EventListProps) {
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [pastEvents, setPastEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // 選択された日付がある場合はその日のイベントのみをフィルタリング
    // なければすべてのイベントを表示
    let filtered: CalendarEvent[] = [];
    
    if (selectedDate) {
      filtered = events.filter((event) => 
        isSameDay(parseISO(event.start.dateTime), selectedDate)
      );
    } else {
      filtered = [...events];
    }
    
    // 現在の日時
    const now = new Date();
    
    // 今後のイベントと過去のイベントに分ける
    const upcoming = filtered
      .filter(event => new Date(event.start.dateTime) > now)
      .sort((a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime());
    
    const past = filtered
      .filter(event => new Date(event.start.dateTime) <= now)
      .sort((a, b) => new Date(b.start.dateTime).getTime() - new Date(a.start.dateTime).getTime());
    
    setUpcomingEvents(upcoming);
    setPastEvents(past);
    setFilteredEvents(filtered);
  }, [events, selectedDate]);

  if (filteredEvents.length === 0) {
    return (
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            {selectedDate 
              ? `${format(selectedDate, 'yyyy年MM月dd日')}のイベントはありません`
              : 'イベントはありません'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {upcomingEvents.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
            今後のイベント
          </h3>
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} isUpcoming={true} />
            ))}
          </div>
        </div>
      )}
      
      {pastEvents.length > 0 && (
        <div className="mt-8">
          {upcomingEvents.length > 0 && <Separator className="mb-6" />}
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
            過去のイベント
          </h3>
          <div className="space-y-4">
            {pastEvents.map((event) => (
              <EventCard key={event.id} event={event} isUpcoming={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface EventCardProps {
  event: CalendarEvent;
  isUpcoming: boolean;
}

function EventCard({ event, isUpcoming }: EventCardProps) {
  return (
    <Card className={`bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 ${isUpcoming ? 'border-l-4 border-l-primary' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800">{event.summary}</CardTitle>
            <CardDescription className="flex items-center mt-2 text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
              {format(parseISO(event.start.dateTime), 'yyyy年MM月dd日(EEE)', { locale: ja })}
              <Clock className="h-4 w-4 ml-3 mr-1 text-gray-500" />
              {format(parseISO(event.start.dateTime), 'HH:mm')} - 
              {format(parseISO(event.end.dateTime), 'HH:mm')}
            </CardDescription>
          </div>
          <Badge variant={isUpcoming ? "outline" : "secondary"} className="ml-2">
            {isUpcoming ? "予定" : "終了"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {event.description && (
          <div className="mb-4 text-sm text-gray-700 border-l-2 border-gray-200 pl-3">
            {event.description}
          </div>
        )}
        
        <div className="flex flex-wrap gap-4 mt-4">
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1 text-gray-500" />
              {event.location}
            </div>
          )}
          
          <div className="flex-grow"></div>
          
          <div className="flex gap-2">
            {isUpcoming && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50 hover:border-primary hover:text-primary">
                    <Users className="h-4 w-4 mr-1" />
                    参加方法
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-white">
                  <DialogHeader>
                    <DialogTitle>イベントへの参加方法</DialogTitle>
                    <DialogDescription>
                      イベントに参加するための手順をご案内します
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-700">
                          このイベントに参加するためには、以下の手順に従ってください：
                        </p>
                        <ol className="mt-2 space-y-3 text-sm text-gray-700 list-decimal pl-5">
                          <li><a href="/community" className="text-primary hover:underline">コミュニティページ</a>からSlackコミュニティに参加してください。</li>
                          <li>参加後、各コミュニティの <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">#event-posts</span> チャンネルをご覧ください。</li>
                          <li>イベントの詳細情報や参加リンクが投稿されます。</li>
                        </ol>
                        <p className="mt-4 text-sm text-gray-700">
                          ご不明な点がございましたら、Slackの <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">#help</span> チャンネルでお問い合わせください。
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            <Button variant="outline" size="sm" className={`border-gray-200 hover:bg-gray-50 ${isUpcoming ? 'hover:border-primary hover:text-primary' : ''}`} asChild>
              <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="flex items-center">
                <ExternalLink className="h-4 w-4 mr-1" />
                詳細を見る
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 