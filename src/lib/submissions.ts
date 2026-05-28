import { z } from "zod";

// Strip control characters from user input. Done character-by-character to
// avoid embedding control characters in this source file.
function isControl(code: number, allowTabLF: boolean): boolean {
  if (code === 0x7f) return true;
  if (code <= 0x1f) {
    if (allowTabLF && (code === 0x09 || code === 0x0a)) return false;
    return true;
  }
  return false;
}

function stripCtrl(s: string, allowTabLF: boolean): string {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (!isControl(c, allowTabLF)) out += s[i];
  }
  return out;
}

// For single-line fields: drop every control char (incl. CR/LF).
function cleanLine(s: string): string {
  return stripCtrl(s, false).trim();
}

// For multi-line fields: normalise CRLF to LF, keep TAB + LF, drop everything else.
function cleanText(s: string): string {
  return stripCtrl(s.replace(/\r\n?/g, "\n"), true).trim();
}

export const submissionSchema = z
  .object({
    title: z
      .string()
      .transform(cleanLine)
      .pipe(z.string().min(3, "Title is required").max(80)),
    description: z
      .string()
      .transform(cleanText)
      .pipe(z.string().min(20, "Describe the idea in at least 20 chars").max(2000)),
    motivation: z
      .string()
      .transform(cleanText)
      .pipe(z.string().min(10, "Add some motivation (10+ chars)").max(1000)),
    developers: z
      .array(z.string().transform(cleanLine).pipe(z.string().min(1).max(80)))
      .max(3, "Up to 3 developers"),
    teamNeeded: z.boolean(),
    teamContact: z
      .string()
      .transform(cleanLine)
      .pipe(z.string().min(3).max(120)),
  })
  .refine((d) => d.teamNeeded || d.developers.length >= 1, {
    message: "Add at least one developer, or mark this idea as needing a team.",
    path: ["developers"],
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
    teamNeeded: formData.get("teamNeeded") === "true",
    teamContact: formData.get("teamContact") ?? "",
  });
}
