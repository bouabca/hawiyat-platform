import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ShowProjects } from "../../projects/show";

interface ProjectsSectionProps {
  loadingProjects: boolean;
}

export const ProjectsSection = ({ loadingProjects }: ProjectsSectionProps) => (
  <Card>
    <CardHeader>
      <CardTitle>Projects</CardTitle>
      <CardDescription>All projects in your organization</CardDescription>
    </CardHeader>
    <CardContent>
      {loadingProjects ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ShowProjects />
      )}
    </CardContent>
  </Card>
); 