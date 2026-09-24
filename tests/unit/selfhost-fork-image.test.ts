import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";

// A deploy of this fork must run this fork's code. docker-compose.selfhost.yml used to pull
// the upstream diegosouzapw/omniroute image, so a server "deploying master" kept serving
// upstream's v3.8.50 UI. It now pulls the image that .github/workflows/arcbyte-image.yml
// builds from master and publishes to this repository's GHCR namespace.

const root = path.resolve(import.meta.dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

/** GHCR lowercases repository paths; the workflow derives the same name at run time. */
const FORK_IMAGE = `ghcr.io/${"arcbyteofficial/OpenAI".toLowerCase()}`;

type Step = { name?: string; uses?: string; run?: string; with?: Record<string, string> };
type Job = { needs?: string; if?: string; steps: Step[] };
type Workflow = { on: { push?: { branches?: string[] } }; jobs: Record<string, Job> };

test("the self-host compose runs this fork's image and re-pulls it on every up", () => {
  const compose = load(read("docker-compose.selfhost.yml")) as {
    services: Record<string, { image?: string; pull_policy?: string }>;
  };
  const app = compose.services.omniroute;
  assert.equal(app.image, `${FORK_IMAGE}:latest`);
  assert.equal(app.pull_policy, "always", "a redeploy must not reuse a stale local :latest");
  assert.ok(
    !read("docker-compose.selfhost.yml").includes("diegosouzapw/omniroute:"),
    "no upstream image reference is left"
  );
});

test("the image workflow publishes that image from master", () => {
  const wf = load(read(".github/workflows/arcbyte-image.yml")) as Workflow;
  assert.deepEqual(wf.on.push?.branches, ["master"]);

  const steps = wf.jobs.build.steps;
  const nameStep = steps.find((s) => s.name === "Resolve image name");
  assert.ok(nameStep?.run?.includes("IMAGE=ghcr.io/${GITHUB_REPOSITORY,,}"));

  const build = steps.find((s) => s.uses?.startsWith("docker/build-push-action@"));
  assert.ok(build?.with, "the build job builds the image");
  assert.equal(build.with.target, "runner-base");
  assert.equal(build.with.tags, "${{ env.IMAGE }}");
  // Webpack with upstream's CI heap: Turbopack's native memory cannot be capped, and the
  // Dockerfile's 6 GB default heap runs out under webpack.
  const args = build.with["build-args"].split("\n").map((l) => l.trim());
  assert.ok(args.includes("OMNIROUTE_USE_TURBOPACK=0"));
  assert.ok(args.includes("OMNIROUTE_BUILD_MEMORY_MB=12288"));
  assert.ok(
    build.with.labels.includes(
      "org.opencontainers.image.source=${{ github.server_url }}/${{ github.repository }}"
    ),
    "the package links to this repository, not upstream"
  );

  const publish = wf.jobs.publish;
  assert.equal(publish.needs, "build");
  assert.equal(publish.if, "${{ !cancelled() }}", "one failed platform must not block the tag");
  const tag = publish.steps.find((s) => s.name === "Tag latest and the commit");
  assert.ok(tag?.run?.includes('-t "${IMAGE}:latest"'));
});

test("every action the image workflow runs is pinned to a commit", () => {
  // The jobs hold a packages:write token; a moved tag must not change the code they run.
  const wf = load(read(".github/workflows/arcbyte-image.yml")) as Workflow;
  for (const [jobName, job] of Object.entries(wf.jobs)) {
    for (const step of job.steps) {
      if (!step.uses) continue;
      const [action, ref] = step.uses.split("@");
      assert.match(ref, /^[0-9a-f]{40}$/, `${jobName}: ${action} is pinned to a commit`);
    }
  }
});
