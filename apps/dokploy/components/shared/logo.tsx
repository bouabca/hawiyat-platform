import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  logoUrl?: string;
}

export const Logo = ({ className = "size-14", logoUrl }: Props) => {
  // Always render the image. If a logoUrl is provided, use it; otherwise fall back to the default logo in public/
  const src = logoUrl || "/logo.svg";

  return (
    <img
      src={src}
      alt="Organization Logo"
      className={cn(className, "object-contain rounded-sm")}
    />
  );
};