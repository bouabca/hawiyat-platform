import { Activity, AlertTriangle, Clock, Database, Rocket } from "lucide-react";
import { getTimeAgo, getNotificationIcon } from "../utils";
import { Notification } from "../types";

interface ActivityItemProps {
  notification: Notification;
  onClick: () => void;
}

export const ActivityItem = ({ notification, onClick }: ActivityItemProps) => {
  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'deployment': return Rocket;
      case 'project': return Database;
      case 'error': return AlertTriangle;
      default: return Activity;
    }
  };

  const Icon = getIcon(notification.type || '');
  const timeAgo = notification.createdAt ? getTimeAgo(notification.createdAt) : '-';

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {notification.message || notification.title || "No message"}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="capitalize">{notification.type || notification.channel || "Info"}</span>
          <span>•</span>
          <span>{timeAgo}</span>
        </div>
      </div>
      <Clock className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}; 