import { readFile } from "node:fs/promises";
import path from "node:path";

const skillRoot = "E:\\Codexwork\\.codex\\skills";

async function readOptional(filePath: string) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

export async function readPersonalStatementSkill() {
  const base = path.join(skillRoot, "personal-statement");
  const files = [
    "SKILL.md",
    "references/frameworks.md",
    "references/discipline.md",
    "references/examples.md",
    "references/post-templates.md",
  ];

  const sections = await Promise.all(
    files.map(async (file) => {
      const content = await readOptional(path.join(base, file));
      return content ? `\n\n## ${file}\n${content}` : "";
    }),
  );

  return sections.join("");
}

export async function readCvSkill() {
  return readOptional(path.join(skillRoot, "awesome-phd-cv", "SKILL.md"));
}

export async function readUiSkill() {
  return readOptional(path.join(skillRoot, "design-taste-frontend", "SKILL.md"));
}
