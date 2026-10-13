import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "./helpers/load-page.js";

describe("Render deployment contract", () => {
  it("builds the PHP app with PostgreSQL support and listens on Render's port", async () => {
    const dockerfile = await readFile(path.join(projectRoot, "Dockerfile"), "utf8");
    const dockerignore = await readFile(path.join(projectRoot, ".dockerignore"), "utf8");

    expect(dockerfile).toMatch(/^FROM php:8\.3-apache/m);
    expect(dockerfile).toContain("docker-php-ext-install pdo_pgsql");
    expect(dockerfile).toContain("EXPOSE 10000");
    expect(dockerfile).toContain("${PORT:-10000}");
    expect(dockerignore.split(/\r?\n/)).toContain(".qa");
  });

  it("defines a free Docker web service and prompts for the database secret", async () => {
    const blueprint = await readFile(path.join(projectRoot, "render.yaml"), "utf8");

    expect(blueprint).toMatch(/type:\s*web/);
    expect(blueprint).toMatch(/runtime:\s*docker/);
    expect(blueprint).toMatch(/plan:\s*free/);
    expect(blueprint).toMatch(/healthCheckPath:\s*\/\s*$/m);
    const services = blueprint.match(/^\s{2}- type:\s*\w+/gm) ?? [];
    const freePlans = blueprint.match(/^\s{4}plan:\s*free\s*$/gm) ?? [];
    expect(freePlans).toHaveLength(services.length);

    const databaseEntry = blueprint.match(
      /^\s{6}- key:\s*DATABASE_URL\s*$([\s\S]*?)(?=^\s{6}- key:|^\S|(?![\s\S]))/m,
    )?.[0];
    expect(databaseEntry).toMatch(/sync:\s*false/);
    expect(databaseEntry).not.toMatch(/\bvalue:/);
  });
});
