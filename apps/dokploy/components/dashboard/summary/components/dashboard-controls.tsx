import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { CardKey, CARD_KEYS } from "../types";

interface DashboardControlsProps {
  visibleCards: Record<CardKey, boolean>;
  onToggleCard: (key: CardKey) => void;
  onRefresh: () => void;
}

export const DashboardControls = ({ visibleCards, onToggleCard, onRefresh }: DashboardControlsProps) => (
  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
    <div className="flex flex-wrap items-center gap-4">
      <Label className="text-sm font-medium">Dashboard Sections:</Label>
      {CARD_KEYS.map((key) => (
        <div key={key} className="flex items-center gap-2">
          <Switch
            checked={visibleCards[key]}
            onCheckedChange={() => onToggleCard(key)}
            id={`toggle-${key}`}
          />
          <Label htmlFor={`toggle-${key}`} className="text-sm cursor-pointer">
            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
          </Label>
        </div>
      ))}
    </div>
    <Button variant="outline" size="sm" onClick={onRefresh}>
      <RefreshCw className="w-4 h-4 mr-2" />
      Refresh
    </Button>
  </div>
); 