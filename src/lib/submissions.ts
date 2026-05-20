import { z } from "zod";

export const submissionSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(80),
  description: z
    .string()
    .trim()
    .min(20, "Describe the idea in at least 20 chars")
    .max(2000),
  motivation: z
    .string()
    .trim()
    .min(10, "Add some motivation (10+ chars)")
    .max(1000),
  developers: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "At least one developer")
    .max(6, "Up to 6 developers"),
  teamContact: z.string().trim().min(3).max(120),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export function parseDevelopers(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseSubmissionForm(formData: FormData): SubmissionInput {
  return submissionSchema.parse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    motivation: formData.get("motivation") ?? "",
    developers: parseDevelopers(formData.get("developers")),
    teamContact: formData.get("teamContact") ?? "",
  });
}
