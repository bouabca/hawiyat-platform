import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Plus, Rocket, Users, Zap } from "lucide-react";
import { QuickActionButton } from "../components/quick-action-button";

export const QuickActionsSection = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="w-5 h-5" />
        Quick Actions
      </CardTitle>
      <CardDescription>Common tasks and shortcuts</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-3">
        <QuickActionButton href="/dashboard/projects" icon={Plus}>
          Add Project
        </QuickActionButton>
        <QuickActionButton href="/dashboard/compose" icon={Rocket} variant="secondary">
          Deploy Compose
        </QuickActionButton>
        <QuickActionButton href="/docs" icon={BookOpen} variant="outline">
          View Docs
        </QuickActionButton>
        <QuickActionButton href="/dashboard/settings/users" icon={Users} variant="outline">
          Invite Member
        </QuickActionButton>
        <QuickActionButton 
          icon={Rocket} 
          variant="outline"
          onClick={() => alert("Backup started!")}
        >
          Backup Now
        </QuickActionButton>
      </div>
    </CardContent>
  </Card>
); 