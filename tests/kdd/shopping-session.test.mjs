import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const source = join(root, "client/src/kdd/lib/shoppingSession.ts");
const output = join(
  tmpdir(),
  `kdd-shopping-session-${process.pid}-${Date.now()}.mjs`
);
await mkdir(dirname(output), { recursive: true });
await build({
  entryPoints: [source],
  bundle: true,
  format: "esm",
  platform: "node",
  outfile: output,
});
const api = await import(`${pathToFileURL(output).href}?${Date.now()}`);
const {
  SESSION_STORAGE_KEY,
  MAX_SESSION_MS,
  loadShoppingSession,
  getSessionCountdown,
} = api;

test.after(async () => {
  await unlink(output).catch(() => {});
});

class FakeStorage {
  constructor(value = null) {
    this.value = value;
    this.calls = [];
  }
  getItem(key) {
    this.calls.push(["get", key]);
    return this.value;
  }
  setItem(key, value) {
    this.calls.push(["set", key]);
    this.value = value;
  }
}

class FailingStorage {
  getItem() {
    throw new Error("read failed");
  }
  setItem() {
    throw new Error("write failed");
  }
}

test("random duration spans one to seven hours and countdown uses actual remaining time", () => {
  const now = 1_000_000;
  const minimum = loadShoppingSession(new FakeStorage(), now, () => 0);
  const maximumStore = new FakeStorage();
  const maximum = loadShoppingSession(maximumStore, now, () => 1);
  assert.equal(minimum.deadline - minimum.startedAt, 60 * 60 * 1000);
  assert.equal(maximum.deadline - maximum.startedAt, MAX_SESSION_MS);
  const countdown = getSessionCountdown(maximum, now + 3_661_250);
  assert.deepEqual(countdown, {
    hours: 5,
    minutes: 58,
    seconds: 58,
    remainingSeconds: 21_538,
  });
  assert.equal(getSessionCountdown(maximum, now).remainingSeconds, 7 * 60 * 60);
  assert.ok(maximumStore.calls.every(([, key]) => key === SESSION_STORAGE_KEY));
});

test("refresh returns the fixed stored record without a second random call", () => {
  const storage = new FakeStorage();
  let randomCalls = 0;
  const first = loadShoppingSession(storage, 10_000, () => {
    randomCalls += 1;
    return 0.25;
  });
  const refreshed = loadShoppingSession(storage, 20_000, () => {
    throw new Error("random must not run on refresh");
  });
  assert.equal(randomCalls, 1);
  assert.deepEqual(refreshed, first);
});

test("successful fake storages are independent visitors", () => {
  const visitorA = loadShoppingSession(new FakeStorage(), 100, () => 0);
  const visitorB = loadShoppingSession(new FakeStorage(), 100, () => 1);
  assert.notDeepEqual(visitorA, visitorB);
  assert.equal(visitorA.deadline - visitorA.startedAt, 60 * 60 * 1000);
  assert.equal(visitorB.deadline - visitorB.startedAt, MAX_SESSION_MS);
});

test("expired sessions stay stored and count down to zero", () => {
  const storage = new FakeStorage();
  const session = loadShoppingSession(storage, 5_000, () => 0);
  const expired = loadShoppingSession(
    storage,
    session.deadline + MAX_SESSION_MS,
    () => {
      throw new Error("expired record must not reset");
    }
  );
  assert.deepEqual(expired, session);
  assert.deepEqual(getSessionCountdown(expired, expired.deadline + 1), {
    hours: 0,
    minutes: 0,
    seconds: 0,
    remainingSeconds: 0,
  });
});

test("corrupt JSON is recovered and written under only the session key", () => {
  const storage = new FakeStorage("{not-json");
  let randomCalls = 0;
  const session = loadShoppingSession(storage, 42, () => {
    randomCalls += 1;
    return 0;
  });
  assert.equal(randomCalls, 1);
  assert.equal(JSON.parse(storage.value).deadline, session.deadline);
  assert.deepEqual(storage.calls, [
    ["get", SESSION_STORAGE_KEY],
    ["set", SESSION_STORAGE_KEY],
  ]);
});

test("storage failures fall back to a stable module-memory session without throwing", () => {
  const failing = new FailingStorage();
  let randomCalls = 0;
  const first = loadShoppingSession(failing, 70_000, () => {
    randomCalls += 1;
    return 0;
  });
  const second = loadShoppingSession(null, 80_000, () => {
    randomCalls += 1;
    return 1;
  });
  assert.deepEqual(second, first);
  assert.equal(randomCalls, 1);
});

test("clock rollback cannot exceed the original session duration or seven hours", () => {
  const now = 9_000_000;
  const session = loadShoppingSession(new FakeStorage(), now, () => 0);
  const countdown = getSessionCountdown(session, now - 24 * 60 * 60 * 1000);
  assert.equal(
    countdown.remainingSeconds,
    (session.deadline - session.startedAt) / 1000
  );
  assert.ok(countdown.remainingSeconds <= MAX_SESSION_MS / 1000);
  assert.deepEqual(countdown, {
    hours: 1,
    minutes: 0,
    seconds: 0,
    remainingSeconds: 60 * 60,
  });
});

test("visitor durations vary within an hour rather than having only seven choices", () => {
  const samples = [0.101, 0.102, 0.103, 0.104];
  const sessions = samples.map(sample =>
    loadShoppingSession(new FakeStorage(), 100_000, () => sample)
  );
  assert.equal(
    new Set(sessions.map(session => session.deadline)).size,
    samples.length
  );
  for (const session of sessions) {
    assert.ok(session.deadline - session.startedAt >= 60 * 60 * 1000);
    assert.ok(session.deadline - session.startedAt <= MAX_SESSION_MS);
  }
});

test("write-only storage failures keep the same deadline across remounts", () => {
  const store = new FakeStorage();
  store.setItem = () => {
    throw new Error("write forbidden");
  };
  const first = loadShoppingSession(store, 5_000, () => 0.3);
  const second = loadShoppingSession(store, 10_000, () => {
    throw new Error("do not reroll when persistence fails");
  });
  assert.deepEqual(second, first);
});
