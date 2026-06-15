import type {
  Format,
  HistoryRecord,
  JobStatus,
  MeResponse,
  Quality,
  SessionUser,
  VideoMeta,
} from "@/lib/types";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || "Request failed",
      res.status,
      (data as { code?: string }).code
    );
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  /** Machine-readable error code, e.g. "TRIAL_EXCEEDED". */
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function jsonPost(url: string, body?: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/* ------------------------------ auth ------------------------------ */

export async function getMe(): Promise<MeResponse> {
  return parse<MeResponse>(await fetch("/api/auth/me", { cache: "no-store" }));
}

export async function signUp(input: {
  name?: string;
  email: string;
  password: string;
}): Promise<SessionUser> {
  const data = await parse<{ user: SessionUser }>(
    await jsonPost("/api/auth/signup", input)
  );
  return data.user;
}

export async function logIn(input: {
  email: string;
  password: string;
}): Promise<SessionUser> {
  const data = await parse<{ user: SessionUser }>(
    await jsonPost("/api/auth/login", input)
  );
  return data.user;
}

export async function logOut(): Promise<void> {
  await parse(await jsonPost("/api/auth/logout"));
}

export async function updateName(name: string): Promise<SessionUser> {
  const data = await parse<{ user: SessionUser }>(
    await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })
  );
  return data.user;
}

export async function deleteAccount(): Promise<void> {
  await parse(await fetch("/api/account", { method: "DELETE" }));
}

export async function getVideoInfo(url: string): Promise<VideoMeta> {
  const res = await fetch("/api/video-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return parse<VideoMeta>(res);
}

export interface StartDownloadInput {
  url: string;
  quality: Quality;
  format: Format;
  title?: string;
  thumbnail?: string | null;
  creator?: string;
  duration?: string;
}

export async function startDownload(
  input: StartDownloadInput
): Promise<{ id: string }> {
  const res = await fetch("/api/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<{ id: string }>(res);
}

export async function getJobStatus(id: string): Promise<JobStatus> {
  const res = await fetch(`/api/download/${id}/status`, { cache: "no-store" });
  return parse<JobStatus>(res);
}

export async function getHistory(): Promise<HistoryRecord[]> {
  const res = await fetch("/api/history", { cache: "no-store" });
  const data = await parse<{ items: HistoryRecord[] }>(res);
  return data.items;
}

export async function deleteHistoryItem(id: string): Promise<void> {
  await parse(await fetch(`/api/history/${id}`, { method: "DELETE" }));
}

export async function clearHistory(): Promise<void> {
  await parse(await fetch("/api/history", { method: "DELETE" }));
}
