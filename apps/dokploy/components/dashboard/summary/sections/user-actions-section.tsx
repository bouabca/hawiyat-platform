import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { UserActionItem } from "../components/user-action-item";
import { UserAction } from "../types";

interface UserActionsSectionProps {
  userActions: UserAction[];
}

export const UserActionsSection = ({ userActions }: UserActionsSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="w-5 h-5" />
        My Recent Actions
      </CardTitle>
      <CardDescription>Things you've done recently</CardDescription>
    </CardHeader>
    <CardContent>
      {userActions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent actions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userActions.map((action, idx) => (
            <UserActionItem key={idx} action={action} />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
); 