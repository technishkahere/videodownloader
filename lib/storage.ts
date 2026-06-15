import { promises as fs } from "node:fs";
import path from "node:path";
import { config } from "@/lib/config";

/** Delete any stored files belonging to the given download ids. */
export async function removeFilesFor(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  let entries: string[] = [];
  try {
    entries = await fs.readdir(config.storageDir);
  } catch {
    return;
  }
  const idSet = new Set(ids);
  await Promise.all(
    entries
      .filter((name) => idSet.has(name.split(".")[0]))
      .map((name) =>
        fs.rm(path.join(config.storageDir, name), { force: true }).catch(() => {})
      )
  );
}
