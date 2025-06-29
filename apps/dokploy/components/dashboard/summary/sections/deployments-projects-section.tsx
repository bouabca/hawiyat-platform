import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Rocket, Server } from "lucide-react";
import { useRouter } from "next/router";
import { Deployment, Project } from "../types";

interface DeploymentsProjectsSectionProps {
  topDeployments: Deployment[];
  mostActiveProjects: Project[];
}

export const DeploymentsProjectsSection = ({ topDeployments, mostActiveProjects }: DeploymentsProjectsSectionProps) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Resource-Consuming Deployments</CardTitle>
          <CardDescription>Most resource-intensive deployments</CardDescription>
        </CardHeader>
        <CardContent>
          {topDeployments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No deployments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topDeployments.map((deployment) => (
                <div 
                  key={deployment.composeId} 
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/compose/${deployment.composeId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Rocket className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{deployment.name || deployment.composeId}</span>
                  </div>
                  <Badge variant={deployment.status === 'running' ? 'default' : 'secondary'}>
                    {deployment.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Active Projects</CardTitle>
          <CardDescription>Projects with the most activity</CardDescription>
        </CardHeader>
        <CardContent>
          {mostActiveProjects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No projects found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mostActiveProjects.map((project) => (
                <div 
                  key={project.projectId} 
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/dashboard/projects/${project.projectId}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-secondary/10">
                      <Database className="w-4 h-4 text-secondary-foreground" />
                    </div>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <Badge variant="outline">{project.status || "Active"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 