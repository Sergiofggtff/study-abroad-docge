import OpenAI from "openai";
import type { ApplicationProfile } from "@/lib/schemas";
import { readCvSkill, readPersonalStatementSkill } from "@/lib/skills";

type GenerationType = "ps" | "cv";

const truthPolicy = `
事实与补写规则：
- 可以补写过渡句、动机表达、项目匹配、未来规划、经历之间的成长逻辑。
- 可以基于目标院校、项目、专业、导师/实验室信息推导 fit 表达。
- 不得编造未提供的 GPA、排名、论文、奖项、实习公司、导师关系、录取承诺、具体实验成果。
- 输出必须显式区分来源：用户提供、模型润色、模型推断，需确认。
- 对未经证实的事实性缺口，用“需确认”标注，不得当作事实写死。
- 目标是提升录取成功率，但不能牺牲真实性和面试可解释性。
`;

function getTargetName(profile: ApplicationProfile) {
  const { school, program } = profile.targetProgram;
  return [school, program].filter(Boolean).join(" / ") || "未命名项目";
}

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺少 OPENAI_API_KEY，请先在 .env.local 中配置。");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    timeout: 120000,
  });
}

function mockDocument(type: GenerationType, profile: ApplicationProfile) {
  const name = profile.student.name || "Student";
  const school = profile.targetProgram.school || "Target University";
  const program = profile.targetProgram.program || "Target Programme";
  const direction = profile.targetProgram.direction || "the target field";

  if (type === "ps") {
    return `## Outline

1. Academic foundation: ${profile.education || "模型推断，需确认：补充教育背景。"}
2. Relevant practice: connect research, projects, and internship evidence to ${direction}.
3. Programme fit: explain why ${school} / ${program} is a useful platform.
4. Future goal: build toward ${profile.motivation || "模型推断，需确认：补充长期目标。"}

## Personal Statement Draft

I am applying to ${program} at ${school} because my academic training and project experience have led me toward ${direction}. During my undergraduate study, I built a foundation in ${profile.skills || "模型推断，需确认：补充核心技能"}, and I became especially interested in how data-driven systems can solve practical education and user-experience problems.

My most relevant experience is ${profile.researchExperiences || "模型推断，需确认：补充一段科研经历"}. This experience helped me understand how to move from raw information to a testable question, and then to evidence that can support product or research decisions. I also completed ${profile.projects || "模型推断，需确认：补充一段项目经历"}, which strengthened my ability to translate an idea into a working prototype.

${school}'s ${program} is a strong fit because ${profile.targetProgram.requirements || "模型推断，需确认：补充项目要求与匹配点"}. I hope to use the programme to deepen my technical and research skills while learning how to design systems that are useful, responsible, and grounded in real user needs.

## 来源标注

- 用户提供：学生姓名、教育/经历/目标项目字段中已填写的信息。
- 模型润色：段落衔接、申请动机表达、项目匹配表述。
- 模型推断，需确认：未填写的具体成果、量化结果、导师/实验室细节。

## 需确认信息清单

- 是否有更具体的项目结果或数据指标。
- 是否有目标项目的课程、导师或实验室名称。
- 是否需要控制到 ${profile.constraints.psWordLimit || "指定"} 词以内。`;
  }

  return `# Academic CV

## ${name}

Email: ${profile.student.email || "需确认"}  
Current Institution: ${profile.student.currentSchool || "需确认"}  
Current Major: ${profile.student.currentMajor || "需确认"}

## Education

- ${profile.education || "需确认：补充学位、学校、GPA、时间。"}

## Research Experience

- ${profile.researchExperiences || "需确认：补充科研经历。"}

## Projects

- ${profile.projects || "需确认：补充项目经历。"}

## Internships

- ${profile.internships || "需确认：如无实习可删除本节。"}

## Publications

- ${profile.publications || "需确认：如无论文可删除本节。"}

## Awards

- ${profile.awards || "需确认：补充奖项。"}

## Skills

- ${profile.skills || "需确认：补充技能。"}

## 来源标注

- 用户提供：已填写的教育、科研、项目、实习、奖项和技能。
- 模型润色：条目顺序、Academic CV 标题结构、动作表达。
- 模型推断，需确认：空字段和未量化成果均保留为“需确认”，未写成事实。

## 需确认信息清单

- 补充每段经历的起止时间、角色和量化结果。
- 确认 ${school} / ${program} 是否更偏 academic CV 或 one-page resume。`;
}

async function createResponse(systemPrompt: string, userPrompt: string) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    max_tokens: 2200,
    stream: false,
  });

  return response.choices[0]?.message?.content || "";
}

function outputLanguage(profile: ApplicationProfile) {
  return profile.constraints.language || "English";
}

export async function generateDocument(type: GenerationType, profile: ApplicationProfile) {
  if (process.env.OPENAI_MOCK === "true") {
    return mockDocument(type, profile);
  }

  const profileJson = JSON.stringify(profile, null, 2);
  const targetName = getTargetName(profile);

  if (type === "ps") {
    const skill = (await readPersonalStatementSkill()).slice(0, 18000);
    const systemPrompt = `
你是留学机构内部使用的 PS/SOP 生成助手。严格遵循下方 personal-statement skill 和事实边界。

${truthPolicy}

${skill}
`;

    const userPrompt = `
请基于以下 ApplicationProfile 为目标项目“${targetName}”生成 PS/SOP。

输出语言必须是：${outputLanguage(profile)}。
不要输出中文说明、不要输出聊天式开场、不要解释“我已经分析了”。直接输出 Markdown 成稿。
输出必须包含且只包含：
1. ## Outline
2. ## Personal Statement Draft
3. ## 来源标注
4. ## 需确认信息清单

ApplicationProfile:
${profileJson}
`;

    return createResponse(systemPrompt, userPrompt);
  }

  const skill = (await readCvSkill()).slice(0, 14000);
  const systemPrompt = `
你是留学机构内部使用的 Academic CV 生成助手。严格遵循下方 awesome-phd-cv skill 和事实边界。

${truthPolicy}

${skill}
`;

  const userPrompt = `
请基于以下 ApplicationProfile 为目标项目“${targetName}”生成 Academic CV。

输出语言必须是：${outputLanguage(profile)}。
不要输出中文说明、不要输出聊天式开场。直接输出 Markdown 成稿。
输出必须包含且只包含：
1. # Academic CV
2. Education
3. Research Experience
4. Projects
5. Internships
6. Publications
7. Awards
8. Skills
9. 来源标注
10. 需确认信息清单

每条经历尽量写成“动作 + 方法 + 结果”，但不得编造事实性结果。

ApplicationProfile:
${profileJson}
`;

  return createResponse(systemPrompt, userPrompt);
}

export function targetNameFromProfile(profile: ApplicationProfile) {
  return getTargetName(profile);
}
