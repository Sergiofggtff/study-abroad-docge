import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ApplicationProfile } from "@/lib/schemas";

function safePart(value: string | undefined, fallback: string) {
  const cleaned = (value || fallback)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function timestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

export async function exportGenerationFile({
  type,
  profile,
  content,
}: {
  type: "ps" | "cv";
  profile: ApplicationProfile;
  content: string;
}) {
  const outputsDir = path.join(process.cwd(), "outputs");
  await mkdir(outputsDir, { recursive: true });

  const student = safePart(profile.student.name, "student");
  const school = safePart(profile.targetProgram.school, "school");
  const program = safePart(profile.targetProgram.program, "program");
  const fileName = `${timestamp()}-${student}-${school}-${program}-${type.toUpperCase()}.md`;
  const filePath = path.join(outputsDir, fileName);

  await writeFile(filePath, content, "utf8");
  return filePath;
}
