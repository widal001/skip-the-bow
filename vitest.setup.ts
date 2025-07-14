// vitest.setup.ts
import { vi } from "vitest";

// Mock auth-astro/server to prevent auth:config import errors
vi.mock("auth-astro/server", () => ({
  getSession: vi.fn(),
}));
