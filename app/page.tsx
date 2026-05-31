"use client";

import {
  CheckCircledIcon,
  ClipboardCopyIcon,
  FileTextIcon,
  LockClosedIcon,
  MagicWandIcon,
  ReaderIcon,
  ReloadIcon,
} from "@radix-ui/react-icons";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { ApplicationProfile } from "@/lib/schemas";

type Generation = {
  id: string;
  type: "ps" | "cv";
  targetName: string;
  content: string;
  createdAt: string;
};

const emptyProfile: ApplicationProfile = {
  student: {
    name: "",
    email: "",
    phone: "",
    currentSchool: "",
    currentMajor: "",
  },
  education: "",
  tests: "",
  researchExperiences: "",
  projects: "",
  internships: "",
  publications: "",
  awards: "",
  skills: "",
  motivation: "",
  targetProgram: {
    school: "",
    program: "",
    degree: "",
    direction: "",
    facultyOrLab: "",
    requirements: "",
  },
  supplementaryNotes: "",
  constraints: {
    psWordLimit: "800",
    language: "English",
    cvType: "Academic CV",
  },
};

function targetName(profile: ApplicationProfile) {
  return (
    [profile.targetProgram.school, profile.targetProgram.program]
      .filter(Boolean)
      .join(" / ") || "未命名项目"
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[#2b2d27]">{label}</span>
      {children}
      {helper ? <span className="text-xs text-[#7b8076]">{helper}</span> : null}
    </label>
  );
}

function inputClass() {
  return "w-full rounded-md border border-[#d8d8cf] bg-white px-3 py-2 text-sm text-[#20211d] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]";
}

function textareaClass() {
  return `${inputClass()} min-h-24 resize-y leading-6`;
}

function LoginGate({ onAuthed }: { onAuthed: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "访问密码不正确");
      return;
    }

    onAuthed();
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5">
      <form
        onSubmit={login}
        className="w-full max-w-md rounded-lg border border-[#d8d8cf] bg-white p-7 shadow-[0_24px_70px_rgba(32,33,29,0.08)]"
      >
        <div className="mb-8 flex items-start gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-md bg-[#e4eee9] text-[#2f6f5e]">
            <LockClosedIcon width={20} height={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">领航留学文书工作台</h1>
            <p className="mt-2 text-sm leading-6 text-[#6f746b]">
              请输入机构内部访问密码。API Key 和本地 skill 只在服务端使用。
            </p>
          </div>
        </div>

        <Field label="访问密码">
          <input
            className={inputClass()}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
        </Field>

        {error ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#2f6f5e] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#245849] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? <ReloadIcon className="animate-spin" /> : <CheckCircledIcon />}
          进入工作台
        </button>
      </form>
    </main>
  );
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profileId, setProfileId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<"ps" | "cv">("ps");
  const [psOutput, setPsOutput] = useState("");
  const [cvOutput, setCvOutput] = useState("");
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, getValues } = useForm<ApplicationProfile>({
    defaultValues: emptyProfile,
  });

  const currentProfile = watch();
  const currentOutput = activeTab === "ps" ? psOutput : cvOutput;
  const currentTargetName = useMemo(() => targetName(currentProfile), [currentProfile]);

  useEffect(() => {
    async function boot() {
      const response = await fetch("/api/auth");
      const data = await response.json().catch(() => ({ authenticated: false }));
      setAuthenticated(Boolean(data.authenticated));
      setCheckingAuth(false);

      const storedId = window.localStorage.getItem("docgen_profile_id");
      if (data.authenticated && storedId) {
        await loadProfile(storedId);
      }
    }

    void boot();
  }, []);

  async function loadProfile(id: string) {
    const response = await fetch(`/api/profile/${id}`);
    if (!response.ok) return;

    const data = await response.json();
    setProfileId(data.id);
    reset({ ...(data.data as ApplicationProfile), id: data.id });
    setGenerations(data.generations || []);
  }

  async function saveProfile(profile: ApplicationProfile) {
    setLoadingAction("save");
    setError("");
    setStatus("");

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: { ...profile, id: profileId } }),
    });

    setLoadingAction(null);

    if (!response.ok) {
      setError("保存失败，请检查必填字段。");
      return undefined;
    }

    const data = await response.json();
    setProfileId(data.id);
    window.localStorage.setItem("docgen_profile_id", data.id);
    reset({ ...(data.profile as ApplicationProfile), id: data.id });
    setStatus("学生档案已保存。");
    return data.id as string;
  }

  async function generate(type: "ps" | "cv") {
    const profile = getValues();
    const id = profileId || (await saveProfile(profile));
    if (!id) return;

    setLoadingAction(type);
    setError("");
    setStatus("");
    setActiveTab(type);

    const response = await fetch(`/api/generate/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: id, profile: { ...profile, id } }),
    });

    setLoadingAction(null);

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(data.error || "生成失败，请检查模型配置后重试。");
      return;
    }

    if (type === "ps") setPsOutput(data.content);
    if (type === "cv") setCvOutput(data.content);
    const label = type === "ps" ? "PS" : "CV";
    setStatus(
      data.filePath
        ? `${label} 已生成并保存。Markdown 文件：${data.filePath}`
        : `${label} 已生成并保存。`,
    );
    await loadProfile(id);
  }

  async function saveCurrentVersion() {
    const profile = getValues();
    const id = profileId || (await saveProfile(profile));
    if (!id || !currentOutput) return;

    setLoadingAction("version");
    setError("");

    const response = await fetch("/api/generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId: id,
        type: activeTab,
        targetName: currentTargetName,
        input: { ...profile, id },
        content: currentOutput,
      }),
    });

    setLoadingAction(null);

    if (!response.ok) {
      setError("版本保存失败。");
      return;
    }

    const data = await response.json().catch(() => ({}));
    setStatus(
      data.filePath
        ? `当前结果已保存为新版本。Markdown 文件：${data.filePath}`
        : "当前结果已保存为新版本。",
    );
    await loadProfile(id);
  }

  async function copyOutput() {
    if (!currentOutput) return;
    await navigator.clipboard.writeText(currentOutput);
    setStatus("结果已复制。");
  }

  if (checkingAuth) {
    return (
      <main className="grid min-h-[100dvh] place-items-center text-sm text-[#6f746b]">
        正在检查访问权限
      </main>
    );
  }

  if (!authenticated) {
    return <LoginGate onAuthed={() => setAuthenticated(true)} />;
  }

  return (
    <main className="min-h-[100dvh] px-4 py-5 md:px-6">
      <div className="mx-auto grid max-w-[1400px] gap-5">
        <header className="flex flex-col justify-between gap-4 border-b border-[#d8d8cf] pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2f6f5e]">
              领航留学
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#20211d]">
              PS/CV 生成工作台
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f746b]">
              一套学生资料，分别生成申请文书和学术 CV。模型可以补写表达和匹配逻辑，但会标注推断内容并保留需确认清单。
            </p>
          </div>
          <div className="rounded-md border border-[#d8d8cf] bg-white px-4 py-3 text-sm text-[#4e534b]">
            当前目标：<span className="font-semibold text-[#20211d]">{currentTargetName}</span>
          </div>
        </header>

        <form
          onSubmit={handleSubmit(saveProfile)}
          className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)]"
        >
          <section className="grid gap-4 rounded-lg border border-[#d8d8cf] bg-white p-4 shadow-[0_18px_50px_rgba(32,33,29,0.06)]">
            <div className="flex items-center gap-2 border-b border-[#ecece5] pb-3">
              <ReaderIcon className="text-[#2f6f5e]" />
              <h2 className="text-base font-semibold">学生与申请素材</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="学生姓名">
                <input className={inputClass()} {...register("student.name")} />
              </Field>
              <Field label="邮箱">
                <input className={inputClass()} {...register("student.email")} />
              </Field>
              <Field label="当前学校">
                <input className={inputClass()} {...register("student.currentSchool")} />
              </Field>
              <Field label="当前专业">
                <input className={inputClass()} {...register("student.currentMajor")} />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="教育背景">
                <textarea className={textareaClass()} {...register("education")} />
              </Field>
              <Field label="语言/标化成绩">
                <textarea className={textareaClass()} {...register("tests")} />
              </Field>
            </div>

            <Field label="科研经历">
              <textarea className={textareaClass()} {...register("researchExperiences")} />
            </Field>

            <Field label="项目经历">
              <textarea className={textareaClass()} {...register("projects")} />
            </Field>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="实习经历">
                <textarea className={textareaClass()} {...register("internships")} />
              </Field>
              <Field label="补充材料">
                <textarea
                  className={textareaClass()}
                  {...register("supplementaryNotes")}
                  placeholder="可粘贴旧 CV、旧 PS、学生自述或顾问备注。"
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="论文">
                <textarea className={textareaClass()} {...register("publications")} />
              </Field>
              <Field label="奖项">
                <textarea className={textareaClass()} {...register("awards")} />
              </Field>
              <Field label="技能">
                <textarea className={textareaClass()} {...register("skills")} />
              </Field>
            </div>

            <Field label="申请动机与未来规划">
              <textarea className={textareaClass()} {...register("motivation")} />
            </Field>
          </section>

          <section className="grid content-start gap-4">
            <div className="rounded-lg border border-[#d8d8cf] bg-white p-4 shadow-[0_18px_50px_rgba(32,33,29,0.06)]">
              <div className="flex items-center gap-2 border-b border-[#ecece5] pb-3">
                <FileTextIcon className="text-[#2f6f5e]" />
                <h2 className="text-base font-semibold">目标项目</h2>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="学校">
                  <input className={inputClass()} {...register("targetProgram.school")} />
                </Field>
                <Field label="项目">
                  <input className={inputClass()} {...register("targetProgram.program")} />
                </Field>
                <Field label="学位">
                  <input className={inputClass()} {...register("targetProgram.degree")} />
                </Field>
                <Field label="方向">
                  <input className={inputClass()} {...register("targetProgram.direction")} />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="导师/实验室">
                  <textarea className={textareaClass()} {...register("targetProgram.facultyOrLab")} />
                </Field>
                <Field label="项目要求">
                  <textarea className={textareaClass()} {...register("targetProgram.requirements")} />
                </Field>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Field label="PS 字数">
                  <input className={inputClass()} {...register("constraints.psWordLimit")} />
                </Field>
                <Field label="输出语言">
                  <input className={inputClass()} {...register("constraints.language")} />
                </Field>
                <Field label="CV 类型">
                  <input className={inputClass()} {...register("constraints.cvType")} />
                </Field>
              </div>
            </div>

            <div className="rounded-lg border border-[#d8d8cf] bg-white shadow-[0_18px_50px_rgba(32,33,29,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ecece5] p-4">
                <div className="flex rounded-md border border-[#d8d8cf] bg-[#f7f7f4] p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ps")}
                    className={`rounded px-3 py-1.5 text-sm font-medium ${
                      activeTab === "ps" ? "bg-white text-[#20211d] shadow-sm" : "text-[#6f746b]"
                    }`}
                  >
                    PS
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("cv")}
                    className={`rounded px-3 py-1.5 text-sm font-medium ${
                      activeTab === "cv" ? "bg-white text-[#20211d] shadow-sm" : "text-[#6f746b]"
                    }`}
                  >
                    CV
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="rounded-md border border-[#d8d8cf] px-3 py-2 text-sm font-medium text-[#2b2d27] hover:border-[#2f6f5e]"
                    disabled={loadingAction === "save"}
                  >
                    保存档案
                  </button>
                  <button
                    type="button"
                    onClick={() => void generate("ps")}
                    className="flex items-center gap-2 rounded-md bg-[#2f6f5e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#245849] disabled:opacity-60"
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === "ps" ? <ReloadIcon className="animate-spin" /> : <MagicWandIcon />}
                    生成 PS
                  </button>
                  <button
                    type="button"
                    onClick={() => void generate("cv")}
                    className="flex items-center gap-2 rounded-md bg-[#20211d] px-3 py-2 text-sm font-semibold text-white hover:bg-[#34362f] disabled:opacity-60"
                    disabled={loadingAction !== null}
                  >
                    {loadingAction === "cv" ? <ReloadIcon className="animate-spin" /> : <MagicWandIcon />}
                    生成 CV
                  </button>
                </div>
              </div>

              {error ? (
                <div className="m-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {status ? (
                <div className="m-4 flex items-center gap-2 rounded-md border border-[#cfe0d8] bg-[#eef7f3] px-3 py-2 text-sm text-[#245849]">
                  <CheckCircledIcon />
                  {status}
                </div>
              ) : null}

              <div className="min-h-[520px] p-4">
                {loadingAction === "ps" || loadingAction === "cv" ? (
                  <div className="grid gap-3">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-[#e7e7df]" />
                    <div className="h-4 w-5/6 animate-pulse rounded bg-[#e7e7df]" />
                    <div className="h-4 w-4/6 animate-pulse rounded bg-[#e7e7df]" />
                    <div className="mt-4 h-44 animate-pulse rounded-md bg-[#eeeee8]" />
                  </div>
                ) : currentOutput ? (
                  <pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-md border border-[#d8d8cf] bg-[#fbfbf8] p-4 font-[var(--font-geist-mono)] text-sm leading-6 text-[#252720]">
                    {currentOutput}
                  </pre>
                ) : (
                  <div className="grid min-h-[480px] place-items-center rounded-md border border-dashed border-[#d8d8cf] bg-[#fbfbf8] text-center">
                    <div className="max-w-sm px-6">
                      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-[#e4eee9] text-[#2f6f5e]">
                        <FileTextIcon width={22} height={22} />
                      </div>
                      <h3 className="text-base font-semibold">等待生成结果</h3>
                      <p className="mt-2 text-sm leading-6 text-[#6f746b]">
                        先保存档案，再生成 PS 或 CV。生成结果会自动写入版本记录，并导出为 Markdown 文件。
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ecece5] p-4">
                <div className="text-sm text-[#6f746b]">
                  {profileId ? `档案 ID：${profileId}` : "尚未保存档案"}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void copyOutput()}
                    disabled={!currentOutput}
                    className="flex items-center gap-2 rounded-md border border-[#d8d8cf] px-3 py-2 text-sm font-medium text-[#2b2d27] hover:border-[#2f6f5e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ClipboardCopyIcon />
                    复制结果
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveCurrentVersion()}
                    disabled={!currentOutput || loadingAction !== null}
                    className="rounded-md border border-[#d8d8cf] px-3 py-2 text-sm font-medium text-[#2b2d27] hover:border-[#2f6f5e] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    保存版本
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#d8d8cf] bg-white p-4 shadow-[0_18px_50px_rgba(32,33,29,0.06)]">
              <h2 className="text-base font-semibold">版本记录</h2>
              <div className="mt-3 divide-y divide-[#ecece5]">
                {generations.length ? (
                  generations.map((generation) => (
                    <button
                      key={generation.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(generation.type);
                        if (generation.type === "ps") setPsOutput(generation.content);
                        if (generation.type === "cv") setCvOutput(generation.content);
                      }}
                      className="grid w-full gap-1 py-3 text-left hover:bg-[#fbfbf8]"
                    >
                      <span className="text-sm font-medium text-[#20211d]">
                        {generation.type.toUpperCase()} · {generation.targetName}
                      </span>
                      <span className="text-xs text-[#7b8076]">
                        {new Date(generation.createdAt).toLocaleString()}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="py-6 text-sm text-[#6f746b]">生成后会在这里保留版本。</p>
                )}
              </div>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}
