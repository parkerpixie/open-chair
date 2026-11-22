import { describe, expect, it, vi } from "vitest";
import type { Database } from "../src/db/database";
import { Repository } from "../src/db/repository";
import { toolResponses } from "../src/features/my-days/timeline";
import { tools } from "../src/features/tools/catalog";
import { stepsForTool } from "../src/features/tools/exercises";

describe("guided tool reflections", () => {
  it("provides an exercise for every illustrated skill", () => {
    for (const tool of tools)
      expect(stepsForTool(tool).length).toBeGreaterThan(0);
  });

  it("saves a partial reflection and reads older entries", async () => {
    const runAsync = vi.fn();
    const repo = new Repository({ runAsync } as unknown as Database);
    await repo.saveSession("check-the-facts", null, [
      " I sent a text. ",
      "",
      "",
      "",
    ]);
    const stored = runAsync.mock.calls[0][6];
    expect(toolResponses(stored)).toEqual(["I sent a text.", "", "", ""]);
    expect(toolResponses('["First","Second","Third"]')).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("does not create an empty My Days entry", async () => {
    const runAsync = vi.fn();
    const repo = new Repository({ runAsync } as unknown as Database);
    await expect(
      repo.saveSession("grounding", null, ["", "", "", "", "", " "]),
    ).rejects.toThrow("Write or select something");
    expect(runAsync).not.toHaveBeenCalled();
  });
});
