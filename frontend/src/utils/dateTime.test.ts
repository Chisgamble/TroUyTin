/// <reference types="node" />

import test from "node:test";
import assert from "node:assert/strict";
import {
  formatListingUpdatedAgo,
  formatListingUpdatedAt,
} from "./dateTime.ts";

const NOW = new Date("2026-08-03T12:00:00.000Z");

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

test("formats a listing updated less than one minute ago", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:59:30.000Z", NOW),
    "Cập nhật vừa xong",
  );
});

test("formats listing updates in elapsed minutes, hours, and days", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:55:00.000Z", NOW),
    "Cập nhật 5 phút trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T10:00:00.000Z", NOW),
    "Cập nhật 2 giờ trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-07-31T12:00:00.000Z", NOW),
    "Cập nhật 3 ngày trước",
  );
});

test("uses the next relative unit at exact boundaries", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:59:00.000Z", NOW),
    "Cập nhật 1 phút trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T11:00:00.000Z", NOW),
    "Cập nhật 1 giờ trước",
  );
  assert.equal(
    formatListingUpdatedAgo("2026-08-02T12:00:00.000Z", NOW),
    "Cập nhật 1 ngày trước",
  );
});

test("clamps future listing timestamps to just now", () => {
  assert.equal(
    formatListingUpdatedAgo("2026-08-03T12:05:00.000Z", NOW),
    "Cập nhật vừa xong",
  );
});

test("falls back for missing or invalid relative timestamps", () => {
  assert.equal(formatListingUpdatedAgo(undefined, NOW), "Cập nhật: Không rõ");
  assert.equal(formatListingUpdatedAgo("invalid", NOW), "Cập nhật: Không rõ");
});
