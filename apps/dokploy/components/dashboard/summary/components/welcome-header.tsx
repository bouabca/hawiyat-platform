import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bell, Users } from "lucide-react";

interface WelcomeHeaderProps {
  user: any;
  org: any;
  unreadCount: number;
  onMarkAsRead: () => void;
}

export const WelcomeHeader = ({ user, org, unreadCount, onMarkAsRead }: WelcomeHeaderProps) => (
  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 ring-2 ring-primary/20">
        <AvatarImage src={user?.user?.image || org?.logo || ""} alt={user?.user?.name || org?.name || "Org"} />
        <AvatarFallback className="text-lg font-semibold">
          {user?.user?.name?.charAt(0) || org?.name?.charAt(0) || "U"}
        </AvatarFallback>
      </Avatar>
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Welcome back, {user?.user?.name || user?.user?.email?.split('@')[0] || "User"}!
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          {org?.name || "Personal Workspace"}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onMarkAsRead}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications ({unreadCount} unread)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </div>
); 