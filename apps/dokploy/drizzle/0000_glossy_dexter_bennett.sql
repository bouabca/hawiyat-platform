CREATE TYPE "public"."buildType" AS ENUM('dockerfile', 'heroku_buildpacks', 'paketo_buildpacks', 'nixpacks', 'static', 'railpack');--> statement-breakpoint
CREATE TYPE "public"."sourceType" AS ENUM('docker', 'git', 'github', 'gitlab', 'bitbucket', 'gitea', 'drop');--> statement-breakpoint
CREATE TYPE "public"."domainType" AS ENUM('compose', 'application', 'preview');--> statement-breakpoint
CREATE TYPE "public"."databaseType" AS ENUM('postgres', 'mariadb', 'mysql', 'mongo', 'web-server');--> statement-breakpoint
CREATE TYPE "public"."deploymentStatus" AS ENUM('running', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."mountType" AS ENUM('bind', 'volume', 'file');--> statement-breakpoint
CREATE TYPE "public"."serviceType" AS ENUM('application', 'postgres', 'mysql', 'mariadb', 'mongo', 'redis', 'compose');--> statement-breakpoint
CREATE TYPE "public"."protocolType" AS ENUM('tcp', 'udp');--> statement-breakpoint
CREATE TYPE "public"."applicationStatus" AS ENUM('idle', 'running', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."certificateType" AS ENUM('letsencrypt', 'none', 'custom');--> statement-breakpoint
CREATE TYPE "public"."composeType" AS ENUM('docker-compose', 'stack');--> statement-breakpoint
CREATE TYPE "public"."sourceTypeCompose" AS ENUM('git', 'github', 'gitlab', 'bitbucket', 'gitea', 'raw');--> statement-breakpoint
CREATE TYPE "public"."RegistryType" AS ENUM('selfHosted', 'cloud');--> statement-breakpoint
CREATE TYPE "public"."notificationType" AS ENUM('slack', 'telegram', 'discord', 'email', 'gotify');--> statement-breakpoint
CREATE TYPE "public"."gitProviderType" AS ENUM('github', 'gitlab', 'bitbucket', 'gitea');--> statement-breakpoint
CREATE TYPE "public"."serverStatus" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "application" (
	"applicationId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"env" text,
	"previewEnv" text,
	"watchPaths" text[],
	"previewBuildArgs" text,
	"previewWildcard" text,
	"previewPort" integer DEFAULT 3000,
	"previewHttps" boolean DEFAULT false NOT NULL,
	"previewPath" text DEFAULT '/',
	"certificateType" "certificateType" DEFAULT 'none' NOT NULL,
	"previewCustomCertResolver" text,
	"previewLimit" integer DEFAULT 3,
	"isPreviewDeploymentsActive" boolean DEFAULT false,
	"buildArgs" text,
	"memoryReservation" text,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"title" text,
	"enabled" boolean,
	"subtitle" text,
	"command" text,
	"refreshToken" text,
	"sourceType" "sourceType" DEFAULT 'github' NOT NULL,
	"cleanCache" boolean DEFAULT false,
	"repository" text,
	"owner" text,
	"branch" text,
	"buildPath" text DEFAULT '/',
	"autoDeploy" boolean,
	"gitlabProjectId" integer,
	"gitlabRepository" text,
	"gitlabOwner" text,
	"gitlabBranch" text,
	"gitlabBuildPath" text DEFAULT '/',
	"gitlabPathNamespace" text,
	"giteaRepository" text,
	"giteaOwner" text,
	"giteaBranch" text,
	"giteaBuildPath" text DEFAULT '/',
	"bitbucketRepository" text,
	"bitbucketOwner" text,
	"bitbucketBranch" text,
	"bitbucketBuildPath" text DEFAULT '/',
	"username" text,
	"password" text,
	"dockerImage" text,
	"registryUrl" text,
	"customGitUrl" text,
	"customGitBranch" text,
	"customGitBuildPath" text,
	"customGitSSHKeyId" text,
	"dockerfile" text,
	"dockerContextPath" text,
	"dockerBuildStage" text,
	"dropBuildPath" text,
	"healthCheckSwarm" json,
	"restartPolicySwarm" json,
	"placementSwarm" json,
	"updateConfigSwarm" json,
	"rollbackConfigSwarm" json,
	"modeSwarm" json,
	"labelsSwarm" json,
	"networkSwarm" json,
	"replicas" integer DEFAULT 1 NOT NULL,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"buildType" "buildType" DEFAULT 'nixpacks' NOT NULL,
	"herokuVersion" text DEFAULT '24',
	"publishDirectory" text,
	"createdAt" text NOT NULL,
	"registryId" text,
	"projectId" text NOT NULL,
	"githubId" text,
	"gitlabId" text,
	"giteaId" text,
	"bitbucketId" text,
	"serverId" text,
	CONSTRAINT "application_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "postgres" (
	"postgresId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"databaseName" text NOT NULL,
	"databaseUser" text NOT NULL,
	"databasePassword" text NOT NULL,
	"description" text,
	"dockerImage" text NOT NULL,
	"command" text,
	"env" text,
	"memoryReservation" text,
	"externalPort" integer,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"createdAt" text NOT NULL,
	"projectId" text NOT NULL,
	"serverId" text,
	CONSTRAINT "postgres_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "user_temp" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"isRegistered" boolean DEFAULT false NOT NULL,
	"expirationDate" text NOT NULL,
	"createdAt" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"two_factor_enabled" boolean,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"banned" boolean,
	"ban_reason" text,
	"ban_expires" timestamp,
	"updated_at" timestamp NOT NULL,
	"serverIp" text,
	"certificateType" "certificateType" DEFAULT 'none' NOT NULL,
	"https" boolean DEFAULT false NOT NULL,
	"host" text,
	"letsEncryptEmail" text,
	"sshPrivateKey" text,
	"enableDockerCleanup" boolean DEFAULT false NOT NULL,
	"logCleanupCron" text,
	"enablePaidFeatures" boolean DEFAULT false NOT NULL,
	"metricsConfig" jsonb DEFAULT '{"server":{"type":"Dokploy","refreshRate":60,"port":4500,"token":"","retentionDays":2,"cronJob":"","urlCallback":"","thresholds":{"cpu":0,"memory":0}},"containers":{"refreshRate":60,"services":{"include":[],"exclude":[]}}}'::jsonb NOT NULL,
	"cleanupCacheApplications" boolean DEFAULT false NOT NULL,
	"cleanupCacheOnPreviews" boolean DEFAULT false NOT NULL,
	"cleanupCacheOnCompose" boolean DEFAULT false NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"serversQuantity" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "user_temp_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "project" (
	"projectId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" text NOT NULL,
	"organizationId" text NOT NULL,
	"env" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain" (
	"domainId" text PRIMARY KEY NOT NULL,
	"host" text NOT NULL,
	"https" boolean DEFAULT false NOT NULL,
	"port" integer DEFAULT 3000,
	"path" text DEFAULT '/',
	"serviceName" text,
	"domainType" "domainType" DEFAULT 'application',
	"uniqueConfigKey" serial NOT NULL,
	"createdAt" text NOT NULL,
	"composeId" text,
	"customCertResolver" text,
	"applicationId" text,
	"previewDeploymentId" text,
	"certificateType" "certificateType" DEFAULT 'none' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mariadb" (
	"mariadbId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"databaseName" text NOT NULL,
	"databaseUser" text NOT NULL,
	"databasePassword" text NOT NULL,
	"rootPassword" text NOT NULL,
	"dockerImage" text NOT NULL,
	"command" text,
	"env" text,
	"memoryReservation" text,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"externalPort" integer,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"createdAt" text NOT NULL,
	"projectId" text NOT NULL,
	"serverId" text,
	CONSTRAINT "mariadb_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "mongo" (
	"mongoId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"databaseUser" text NOT NULL,
	"databasePassword" text NOT NULL,
	"dockerImage" text NOT NULL,
	"command" text,
	"env" text,
	"memoryReservation" text,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"externalPort" integer,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"createdAt" text NOT NULL,
	"projectId" text NOT NULL,
	"serverId" text,
	"replicaSets" boolean DEFAULT false,
	CONSTRAINT "mongo_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "mysql" (
	"mysqlId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"databaseName" text NOT NULL,
	"databaseUser" text NOT NULL,
	"databasePassword" text NOT NULL,
	"rootPassword" text NOT NULL,
	"dockerImage" text NOT NULL,
	"command" text,
	"env" text,
	"memoryReservation" text,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"externalPort" integer,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"createdAt" text NOT NULL,
	"projectId" text NOT NULL,
	"serverId" text,
	CONSTRAINT "mysql_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "backup" (
	"backupId" text PRIMARY KEY NOT NULL,
	"schedule" text NOT NULL,
	"enabled" boolean,
	"database" text NOT NULL,
	"prefix" text NOT NULL,
	"destinationId" text NOT NULL,
	"keepLatestCount" integer,
	"databaseType" "databaseType" NOT NULL,
	"postgresId" text,
	"mariadbId" text,
	"mysqlId" text,
	"mongoId" text,
	"userId" text
);
--> statement-breakpoint
CREATE TABLE "destination" (
	"destinationId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"accessKey" text NOT NULL,
	"secretAccessKey" text NOT NULL,
	"bucket" text NOT NULL,
	"region" text NOT NULL,
	"endpoint" text NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment" (
	"deploymentId" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "deploymentStatus" DEFAULT 'running',
	"logPath" text NOT NULL,
	"applicationId" text,
	"composeId" text,
	"serverId" text,
	"isPreviewDeployment" boolean DEFAULT false,
	"previewDeploymentId" text,
	"createdAt" text NOT NULL,
	"errorMessage" text
);
--> statement-breakpoint
CREATE TABLE "mount" (
	"mountId" text PRIMARY KEY NOT NULL,
	"type" "mountType" NOT NULL,
	"hostPath" text,
	"volumeName" text,
	"filePath" text,
	"content" text,
	"serviceType" "serviceType" DEFAULT 'application' NOT NULL,
	"mountPath" text NOT NULL,
	"applicationId" text,
	"postgresId" text,
	"mariadbId" text,
	"mongoId" text,
	"mysqlId" text,
	"redisId" text,
	"composeId" text
);
--> statement-breakpoint
CREATE TABLE "certificate" (
	"certificateId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"certificateData" text NOT NULL,
	"privateKey" text NOT NULL,
	"certificatePath" text NOT NULL,
	"autoRenew" boolean,
	"organizationId" text NOT NULL,
	"serverId" text,
	CONSTRAINT "certificate_certificatePath_unique" UNIQUE("certificatePath")
);
--> statement-breakpoint
CREATE TABLE "session_temp" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	"active_organization_id" text,
	CONSTRAINT "session_temp_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "redirect" (
	"redirectId" text PRIMARY KEY NOT NULL,
	"regex" text NOT NULL,
	"replacement" text NOT NULL,
	"permanent" boolean DEFAULT false NOT NULL,
	"uniqueConfigKey" serial NOT NULL,
	"createdAt" text NOT NULL,
	"applicationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security" (
	"securityId" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"createdAt" text NOT NULL,
	"applicationId" text NOT NULL,
	CONSTRAINT "security_username_applicationId_unique" UNIQUE("username","applicationId")
);
--> statement-breakpoint
CREATE TABLE "port" (
	"portId" text PRIMARY KEY NOT NULL,
	"publishedPort" integer NOT NULL,
	"targetPort" integer NOT NULL,
	"protocol" "protocolType" NOT NULL,
	"applicationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redis" (
	"redisId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"password" text NOT NULL,
	"dockerImage" text NOT NULL,
	"command" text,
	"env" text,
	"memoryReservation" text,
	"memoryLimit" text,
	"cpuReservation" text,
	"cpuLimit" text,
	"externalPort" integer,
	"createdAt" text NOT NULL,
	"applicationStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"projectId" text NOT NULL,
	"serverId" text,
	CONSTRAINT "redis_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "compose" (
	"composeId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appName" text NOT NULL,
	"description" text,
	"env" text,
	"composeFile" text DEFAULT '' NOT NULL,
	"refreshToken" text,
	"sourceType" "sourceTypeCompose" DEFAULT 'github' NOT NULL,
	"composeType" "composeType" DEFAULT 'docker-compose' NOT NULL,
	"repository" text,
	"owner" text,
	"branch" text,
	"autoDeploy" boolean,
	"gitlabProjectId" integer,
	"gitlabRepository" text,
	"gitlabOwner" text,
	"gitlabBranch" text,
	"gitlabPathNamespace" text,
	"bitbucketRepository" text,
	"bitbucketOwner" text,
	"bitbucketBranch" text,
	"giteaRepository" text,
	"giteaOwner" text,
	"giteaBranch" text,
	"customGitUrl" text,
	"customGitBranch" text,
	"customGitSSHKeyId" text,
	"command" text DEFAULT '' NOT NULL,
	"composePath" text DEFAULT './docker-compose.yml' NOT NULL,
	"suffix" text DEFAULT '' NOT NULL,
	"randomize" boolean DEFAULT false NOT NULL,
	"isolatedDeployment" boolean DEFAULT false NOT NULL,
	"composeStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"projectId" text NOT NULL,
	"createdAt" text NOT NULL,
	"watchPaths" text[],
	"githubId" text,
	"gitlabId" text,
	"bitbucketId" text,
	"giteaId" text,
	"serverId" text
);
--> statement-breakpoint
CREATE TABLE "registry" (
	"registryId" text PRIMARY KEY NOT NULL,
	"registryName" text NOT NULL,
	"imagePrefix" text,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"registryUrl" text DEFAULT '' NOT NULL,
	"createdAt" text NOT NULL,
	"selfHosted" "RegistryType" DEFAULT 'cloud' NOT NULL,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discord" (
	"discordId" text PRIMARY KEY NOT NULL,
	"webhookUrl" text NOT NULL,
	"decoration" boolean
);
--> statement-breakpoint
CREATE TABLE "email" (
	"emailId" text PRIMARY KEY NOT NULL,
	"smtpServer" text NOT NULL,
	"smtpPort" integer NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"fromAddress" text NOT NULL,
	"toAddress" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gotify" (
	"gotifyId" text PRIMARY KEY NOT NULL,
	"serverUrl" text NOT NULL,
	"appToken" text NOT NULL,
	"priority" integer DEFAULT 5 NOT NULL,
	"decoration" boolean
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"notificationId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"appDeploy" boolean DEFAULT false NOT NULL,
	"appBuildError" boolean DEFAULT false NOT NULL,
	"databaseBackup" boolean DEFAULT false NOT NULL,
	"dokployRestart" boolean DEFAULT false NOT NULL,
	"dockerCleanup" boolean DEFAULT false NOT NULL,
	"serverThreshold" boolean DEFAULT false NOT NULL,
	"notificationType" "notificationType" NOT NULL,
	"createdAt" text NOT NULL,
	"slackId" text,
	"telegramId" text,
	"discordId" text,
	"emailId" text,
	"gotifyId" text,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slack" (
	"slackId" text PRIMARY KEY NOT NULL,
	"webhookUrl" text NOT NULL,
	"channel" text
);
--> statement-breakpoint
CREATE TABLE "telegram" (
	"telegramId" text PRIMARY KEY NOT NULL,
	"botToken" text NOT NULL,
	"chatId" text NOT NULL,
	"messageThreadId" text
);
--> statement-breakpoint
CREATE TABLE "ssh-key" (
	"sshKeyId" text PRIMARY KEY NOT NULL,
	"privateKey" text DEFAULT '' NOT NULL,
	"publicKey" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"createdAt" text NOT NULL,
	"lastUsedAt" text,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "git_provider" (
	"gitProviderId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"providerType" "gitProviderType" DEFAULT 'github' NOT NULL,
	"createdAt" text NOT NULL,
	"organizationId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bitbucket" (
	"bitbucketId" text PRIMARY KEY NOT NULL,
	"bitbucketUsername" text,
	"appPassword" text,
	"bitbucketWorkspaceName" text,
	"gitProviderId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github" (
	"githubId" text PRIMARY KEY NOT NULL,
	"githubAppName" text,
	"githubAppId" integer,
	"githubClientId" text,
	"githubClientSecret" text,
	"githubInstallationId" text,
	"githubPrivateKey" text,
	"githubWebhookSecret" text,
	"gitProviderId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gitlab" (
	"gitlabId" text PRIMARY KEY NOT NULL,
	"gitlabUrl" text DEFAULT 'https://gitlab.com' NOT NULL,
	"application_id" text,
	"redirect_uri" text,
	"secret" text,
	"access_token" text,
	"refresh_token" text,
	"group_name" text,
	"expires_at" integer,
	"gitProviderId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gitea" (
	"giteaId" text PRIMARY KEY NOT NULL,
	"giteaUrl" text DEFAULT 'https://gitea.com' NOT NULL,
	"redirect_uri" text,
	"client_id" text,
	"client_secret" text,
	"gitProviderId" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" integer,
	"scopes" text DEFAULT 'repo,repo:status,read:user,read:org',
	"last_authenticated_at" integer
);
--> statement-breakpoint
CREATE TABLE "server" (
	"serverId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ipAddress" text NOT NULL,
	"port" integer NOT NULL,
	"username" text DEFAULT 'root' NOT NULL,
	"appName" text NOT NULL,
	"enableDockerCleanup" boolean DEFAULT false NOT NULL,
	"createdAt" text NOT NULL,
	"organizationId" text NOT NULL,
	"serverStatus" "serverStatus" DEFAULT 'active' NOT NULL,
	"command" text DEFAULT '' NOT NULL,
	"sshKeyId" text,
	"metricsConfig" jsonb DEFAULT '{"server":{"type":"Remote","refreshRate":60,"port":4500,"token":"","urlCallback":"","cronJob":"","retentionDays":2,"thresholds":{"cpu":0,"memory":0}},"containers":{"refreshRate":60,"services":{"include":[],"exclude":[]}}}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "preview_deployments" (
	"previewDeploymentId" text PRIMARY KEY NOT NULL,
	"branch" text NOT NULL,
	"pullRequestId" text NOT NULL,
	"pullRequestNumber" text NOT NULL,
	"pullRequestURL" text NOT NULL,
	"pullRequestTitle" text NOT NULL,
	"pullRequestCommentId" text NOT NULL,
	"previewStatus" "applicationStatus" DEFAULT 'idle' NOT NULL,
	"appName" text NOT NULL,
	"applicationId" text NOT NULL,
	"domainId" text,
	"createdAt" text NOT NULL,
	"expiresAt" text,
	CONSTRAINT "preview_deployments_appName_unique" UNIQUE("appName")
);
--> statement-breakpoint
CREATE TABLE "ai" (
	"aiId" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"apiUrl" text NOT NULL,
	"apiKey" text NOT NULL,
	"model" text NOT NULL,
	"isEnabled" boolean DEFAULT true NOT NULL,
	"organizationId" text NOT NULL,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"is2FAEnabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"resetPasswordToken" text,
	"resetPasswordExpiresAt" text,
	"confirmationToken" text,
	"confirmationExpiresAt" text
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"start" text,
	"prefix" text,
	"key" text NOT NULL,
	"user_id" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean,
	"rate_limit_enabled" boolean,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"team_id" text
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"team_id" text,
	"canCreateProjects" boolean DEFAULT false NOT NULL,
	"canAccessToSSHKeys" boolean DEFAULT false NOT NULL,
	"canCreateServices" boolean DEFAULT false NOT NULL,
	"canDeleteProjects" boolean DEFAULT false NOT NULL,
	"canDeleteServices" boolean DEFAULT false NOT NULL,
	"canAccessToDocker" boolean DEFAULT false NOT NULL,
	"canAccessToAPI" boolean DEFAULT false NOT NULL,
	"canAccessToGitProviders" boolean DEFAULT false NOT NULL,
	"canAccessToTraefikFiles" boolean DEFAULT false NOT NULL,
	"accesedProjects" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"accesedServices" text[] DEFAULT ARRAY[]::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"owner_id" text NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_customGitSSHKeyId_ssh-key_sshKeyId_fk" FOREIGN KEY ("customGitSSHKeyId") REFERENCES "public"."ssh-key"("sshKeyId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_registryId_registry_registryId_fk" FOREIGN KEY ("registryId") REFERENCES "public"."registry"("registryId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_githubId_github_githubId_fk" FOREIGN KEY ("githubId") REFERENCES "public"."github"("githubId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_gitlabId_gitlab_gitlabId_fk" FOREIGN KEY ("gitlabId") REFERENCES "public"."gitlab"("gitlabId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_giteaId_gitea_giteaId_fk" FOREIGN KEY ("giteaId") REFERENCES "public"."gitea"("giteaId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_bitbucketId_bitbucket_bitbucketId_fk" FOREIGN KEY ("bitbucketId") REFERENCES "public"."bitbucket"("bitbucketId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postgres" ADD CONSTRAINT "postgres_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postgres" ADD CONSTRAINT "postgres_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_composeId_compose_composeId_fk" FOREIGN KEY ("composeId") REFERENCES "public"."compose"("composeId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "domain" ADD CONSTRAINT "domain_previewDeploymentId_preview_deployments_previewDeploymentId_fk" FOREIGN KEY ("previewDeploymentId") REFERENCES "public"."preview_deployments"("previewDeploymentId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mariadb" ADD CONSTRAINT "mariadb_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mariadb" ADD CONSTRAINT "mariadb_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mongo" ADD CONSTRAINT "mongo_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mongo" ADD CONSTRAINT "mongo_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mysql" ADD CONSTRAINT "mysql_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mysql" ADD CONSTRAINT "mysql_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_destinationId_destination_destinationId_fk" FOREIGN KEY ("destinationId") REFERENCES "public"."destination"("destinationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_postgresId_postgres_postgresId_fk" FOREIGN KEY ("postgresId") REFERENCES "public"."postgres"("postgresId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_mariadbId_mariadb_mariadbId_fk" FOREIGN KEY ("mariadbId") REFERENCES "public"."mariadb"("mariadbId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_mysqlId_mysql_mysqlId_fk" FOREIGN KEY ("mysqlId") REFERENCES "public"."mysql"("mysqlId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_mongoId_mongo_mongoId_fk" FOREIGN KEY ("mongoId") REFERENCES "public"."mongo"("mongoId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "backup" ADD CONSTRAINT "backup_userId_user_temp_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user_temp"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination" ADD CONSTRAINT "destination_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_composeId_compose_composeId_fk" FOREIGN KEY ("composeId") REFERENCES "public"."compose"("composeId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deployment" ADD CONSTRAINT "deployment_previewDeploymentId_preview_deployments_previewDeploymentId_fk" FOREIGN KEY ("previewDeploymentId") REFERENCES "public"."preview_deployments"("previewDeploymentId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_postgresId_postgres_postgresId_fk" FOREIGN KEY ("postgresId") REFERENCES "public"."postgres"("postgresId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_mariadbId_mariadb_mariadbId_fk" FOREIGN KEY ("mariadbId") REFERENCES "public"."mariadb"("mariadbId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_mongoId_mongo_mongoId_fk" FOREIGN KEY ("mongoId") REFERENCES "public"."mongo"("mongoId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_mysqlId_mysql_mysqlId_fk" FOREIGN KEY ("mysqlId") REFERENCES "public"."mysql"("mysqlId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_redisId_redis_redisId_fk" FOREIGN KEY ("redisId") REFERENCES "public"."redis"("redisId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mount" ADD CONSTRAINT "mount_composeId_compose_composeId_fk" FOREIGN KEY ("composeId") REFERENCES "public"."compose"("composeId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate" ADD CONSTRAINT "certificate_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_temp" ADD CONSTRAINT "session_temp_user_id_user_temp_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redirect" ADD CONSTRAINT "redirect_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security" ADD CONSTRAINT "security_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "port" ADD CONSTRAINT "port_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redis" ADD CONSTRAINT "redis_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redis" ADD CONSTRAINT "redis_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_customGitSSHKeyId_ssh-key_sshKeyId_fk" FOREIGN KEY ("customGitSSHKeyId") REFERENCES "public"."ssh-key"("sshKeyId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_projectId_project_projectId_fk" FOREIGN KEY ("projectId") REFERENCES "public"."project"("projectId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_githubId_github_githubId_fk" FOREIGN KEY ("githubId") REFERENCES "public"."github"("githubId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_gitlabId_gitlab_gitlabId_fk" FOREIGN KEY ("gitlabId") REFERENCES "public"."gitlab"("gitlabId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_bitbucketId_bitbucket_bitbucketId_fk" FOREIGN KEY ("bitbucketId") REFERENCES "public"."bitbucket"("bitbucketId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_giteaId_gitea_giteaId_fk" FOREIGN KEY ("giteaId") REFERENCES "public"."gitea"("giteaId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "compose" ADD CONSTRAINT "compose_serverId_server_serverId_fk" FOREIGN KEY ("serverId") REFERENCES "public"."server"("serverId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registry" ADD CONSTRAINT "registry_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_slackId_slack_slackId_fk" FOREIGN KEY ("slackId") REFERENCES "public"."slack"("slackId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_telegramId_telegram_telegramId_fk" FOREIGN KEY ("telegramId") REFERENCES "public"."telegram"("telegramId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_discordId_discord_discordId_fk" FOREIGN KEY ("discordId") REFERENCES "public"."discord"("discordId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_emailId_email_emailId_fk" FOREIGN KEY ("emailId") REFERENCES "public"."email"("emailId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_gotifyId_gotify_gotifyId_fk" FOREIGN KEY ("gotifyId") REFERENCES "public"."gotify"("gotifyId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ssh-key" ADD CONSTRAINT "ssh-key_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "git_provider" ADD CONSTRAINT "git_provider_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bitbucket" ADD CONSTRAINT "bitbucket_gitProviderId_git_provider_gitProviderId_fk" FOREIGN KEY ("gitProviderId") REFERENCES "public"."git_provider"("gitProviderId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github" ADD CONSTRAINT "github_gitProviderId_git_provider_gitProviderId_fk" FOREIGN KEY ("gitProviderId") REFERENCES "public"."git_provider"("gitProviderId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gitlab" ADD CONSTRAINT "gitlab_gitProviderId_git_provider_gitProviderId_fk" FOREIGN KEY ("gitProviderId") REFERENCES "public"."git_provider"("gitProviderId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gitea" ADD CONSTRAINT "gitea_gitProviderId_git_provider_gitProviderId_fk" FOREIGN KEY ("gitProviderId") REFERENCES "public"."git_provider"("gitProviderId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "server" ADD CONSTRAINT "server_sshKeyId_ssh-key_sshKeyId_fk" FOREIGN KEY ("sshKeyId") REFERENCES "public"."ssh-key"("sshKeyId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_deployments" ADD CONSTRAINT "preview_deployments_applicationId_application_applicationId_fk" FOREIGN KEY ("applicationId") REFERENCES "public"."application"("applicationId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preview_deployments" ADD CONSTRAINT "preview_deployments_domainId_domain_domainId_fk" FOREIGN KEY ("domainId") REFERENCES "public"."domain"("domainId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai" ADD CONSTRAINT "ai_organizationId_organization_id_fk" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_temp_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apikey" ADD CONSTRAINT "apikey_user_id_user_temp_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_temp_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_temp_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_owner_id_user_temp_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_temp_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_temp"("id") ON DELETE cascade ON UPDATE no action;