import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity } from "lucide-react";
import { ActivityItem } from "../components/activity-item";
import { Notification } from "../types";

interface RecentActivitySectionProps {
  activityFilter: string;
  setActivityFilter: (filter: string) => void;
  loadingNotifications: boolean;
  filteredNotifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
}

export const RecentActivitySection = ({
  activityFilter,
  setActivityFilter,
  loadingNotifications,
  filteredNotifications,
  onNotificationClick,
}: RecentActivitySectionProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Recent deployments, changes, and logs</CardDescription>
      </div>
      <Select value={activityFilter} onValueChange={setActivityFilter}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Activities</SelectItem>
          <SelectItem value="deployment">Deployments</SelectItem>
          <SelectItem value="project">Projects</SelectItem>
          <SelectItem value="error">Errors</SelectItem>
        </SelectContent>
      </Select>
    </CardHeader>
    <CardContent>
      {loadingNotifications ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotifications?.length ? (
        <div className="space-y-2">
          {filteredNotifications.slice(0, 10).map((notif) => (
            <ActivityItem 
              key={notif.id} 
              notification={notif} 
              onClick={() => onNotificationClick(notif)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent activity</p>
          <p className="text-sm">There are no recent notifications for your organization.</p>
        </div>
      )}
    </CardContent>
  </Card>
); 