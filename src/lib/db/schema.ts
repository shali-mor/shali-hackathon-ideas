import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const submissionStatus = pgEnum("submission_status", [
  "pending",
  "accepted",
  "rejected",
]);

// SDLC lifecycle stages — the hackathon's organising theme.
export const submissionCategory = pgEnum("submission_category", [
  "planning",
  "design",
  "development",
  "testing",
  "deployment",
  "maintenance",
  "other",
]);

export const submissions = pgTable("submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  motivation: text("motivation").notNull(),
  category: submissionCategory("category").notNull().default("other"),
  // Free-text label used only when category === "other".
  categoryOther: text("category_other"),
  developers: text("developers").array().notNull(),
  teamNeeded: boolean("team_needed").notNull().default(false),
  teamContact: text("team_contact").notNull(),
  submittedByEmail: text("submitted_by_email").notNull(),
  submittedByName: text("submitted_by_name"),
  status: submissionStatus("status").notNull().default("pending"),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: "date" }),
  reviewedByEmail: text("reviewed_by_email"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;

// Auth.js v5 / drizzle adapter tables -----------------------------------

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);
