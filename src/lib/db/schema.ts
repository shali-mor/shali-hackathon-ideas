import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  integer,
  boolean,
  pgEnum,
  unique,
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
  // Set by an admin from the semi-final leaderboard to mark ideas that
  // shouldn't wait for the regular roadmap — implement now.
  needsImmediateImpl: boolean("needs_immediate_impl").notNull().default(false),
  // Set by an admin from /roadmap to pick the subset of ideas the org
  // commits to building during the current quarter. Unpicked ideas stay
  // visible but greyed out below the picks.
  pickedForQuarter: boolean("picked_for_quarter").notNull().default(false),
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

// One row per (judge, submission). Judges score the four rubric criteria 1–5;
// re-submitting updates the existing row (upsert on the unique constraint).
export const judgeScores = pgTable(
  "judge_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    judgeEmail: text("judge_email").notNull(),
    judgeName: text("judge_name"),
    impact: integer("impact").notNull(),
    demo: integer("demo").notNull(),
    pitch: integer("pitch").notNull(),
    adoptability: integer("adoptability").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("judge_scores_judge_submission").on(t.judgeEmail, t.submissionId)],
);

export type JudgeScore = typeof judgeScores.$inferSelect;

// Final round — a separate scoring pass over the top finalists only, kept in
// its own table so it never collides with (or overwrites) the semi-final
// scores in judge_scores. Same shape, same one-row-per-(judge, submission).
export const finalScores = pgTable(
  "final_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => submissions.id, { onDelete: "cascade" }),
    judgeEmail: text("judge_email").notNull(),
    judgeName: text("judge_name"),
    impact: integer("impact").notNull(),
    demo: integer("demo").notNull(),
    pitch: integer("pitch").notNull(),
    adoptability: integer("adoptability").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique("final_scores_judge_submission").on(t.judgeEmail, t.submissionId)],
);

export type FinalScore = typeof finalScores.$inferSelect;

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
