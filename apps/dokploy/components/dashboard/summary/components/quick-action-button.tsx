import { Button } from "@/components/ui/button";
import Link from "next/link";

interface QuickActionButtonProps {
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "destructive";
  onClick?: () => void;
}

export const QuickActionButton = ({ href, icon: Icon, children, variant = "default", onClick }: QuickActionButtonProps) => {
  const button = (
    <Button variant={variant} className="flex items-center gap-2 h-auto py-3 px-4" onClick={onClick}>
      <Icon className="w-4 h-4" />
      {children}
    </Button>
  );

  return href ? <Link href={href}>{button}</Link> : button;
}; 