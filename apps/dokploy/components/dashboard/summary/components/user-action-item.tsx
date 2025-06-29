import { getTimeAgo } from "../utils";
import { UserAction } from "../types";

interface UserActionItemProps {
  action: UserAction;
}

export const UserActionItem = ({ action }: UserActionItemProps) => {
  const Icon = action.icon;
  const timeAgo = getTimeAgo(action.date);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="p-2 rounded-full bg-secondary/10">
        <Icon className="w-4 h-4 text-secondary-foreground" />
      </div>
      <div className="flex-1">
        <div className="font-medium text-sm">{action.message}</div>
        <div className="text-xs text-muted-foreground">{timeAgo}</div>
      </div>
    </div>
  );
}; 