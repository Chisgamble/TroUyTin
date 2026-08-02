/// <reference types="node" />

import test from "node:test";
import assert from "node:assert/strict";
import { formatListingUpdatedAt } from "./dateTime.ts";

test("formats listing updates in Vietnam time", () => {
  assert.equal(
    formatListingUpdatedAt("2026-08-02T10:30:00.000Z"),
    "17:30, 02/08/2026",
  );
});

test("falls back for missing or invalid timestamps", () => {
  assert.equal(formatListingUpdatedAt(undefined), "Không rõ");
  assert.equal(formatListingUpdatedAt("invalid"), "Không rõ");
});
