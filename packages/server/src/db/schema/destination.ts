import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";
import { organization } from "./account";
import { backups } from "./backups";

export const destinations = pgTable("destination", {
	destinationId: text("destinationId")
		.notNull()
		.primaryKey()
		.$defaultFn(() => nanoid()),
	name: text("name").notNull(),
	provider: text("provider"),
	accessKey: text("accessKey").notNull(),
	secretAccessKey: text("secretAccessKey").notNull(),
	bucket: text("bucket").notNull(),
	region: text("region").notNull(),
	endpoint: text("endpoint").notNull(),
	organizationId: text("organizationId")
		.notNull()
		.references(() => organization.id, { onDelete: "cascade" }),
	createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const destinationsRelations = relations(
	destinations,
	({ many, one }) => ({
		backups: many(backups),
		organization: one(organization, {
			fields: [destinations.organizationId],
			references: [organization.id],
		}),
	}),
);

const createSchema = createInsertSchema(destinations, {
	destinationId: z.string(),
	name: z.string().min(1),
	provider: z.string(),
	accessKey: z.string(),
	bucket: z.string(),
	endpoint: z.string(),
	secretAccessKey: z.string(),
	region: z.string(),
});

export const apiCreateDestination = createSchema
	.pick({
		name: true,
		provider: true,
		bucket: true,
	})
	.extend({
		accessKey: z.string().optional(),
		secretAccessKey: z.string().optional(),
		region: z.string().optional(),
		endpoint: z.string().optional(),
		serverId: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.provider !== "Local") {
			if (!data.accessKey) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Access key is required for S3 providers",
					path: ["accessKey"],
				});
			}
			if (!data.secretAccessKey) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Secret access key is required for S3 providers",
					path: ["secretAccessKey"],
				});
			}
			if (!data.region) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Region is required for S3 providers",
					path: ["region"],
				});
			}
			if (!data.endpoint) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Endpoint is required for S3 providers",
					path: ["endpoint"],
				});
			}
		}
	});

export const apiFindOneDestination = createSchema
	.pick({
		destinationId: true,
	})
	.required();

export const apiRemoveDestination = createSchema
	.pick({
		destinationId: true,
	})
	.required();

export const apiUpdateDestination = createSchema
	.pick({
		name: true,
		accessKey: true,
		bucket: true,
		region: true,
		endpoint: true,
		secretAccessKey: true,
		destinationId: true,
		provider: true,
	})
	.required()
	.extend({
		serverId: z.string().optional(),
	});
