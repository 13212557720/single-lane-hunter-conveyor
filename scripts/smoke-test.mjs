import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const url = process.env.TEST_URL ?? "http://localhost:5173/";
const screenshotPath = process.env.SCREENSHOT_PATH ?? "/tmp/conveyor-hunter-smoke.png";
const chromePath =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = Number(process.env.CDP_PORT ?? 9300 + Math.floor(Math.random() * 400));

const tmpProfile = await mkdtemp(join(tmpdir(), "conveyor-hunter-chrome-"));
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${tmpProfile}`,
    `--remote-debugging-port=${port}`,
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let stderr = "";
chrome.stderr.on("data", (chunk) => {
  stderr += chunk.toString();
});

try {
  const target = await waitForPageTarget(port);
  const client = await connectCdp(target.webSocketDebuggerUrl);
  const browserMessages = [];

  client.on("Runtime.exceptionThrown", (params) => {
    const text = params?.exceptionDetails?.text ?? "Runtime exception";
    browserMessages.push({ level: "error", message: text });
  });
  client.on("Runtime.consoleAPICalled", (params) => {
    if (!["error", "warning", "warn"].includes(params?.type)) return;
    const message =
      params.args?.map((arg) => arg.value ?? arg.description ?? arg.type).join(" ") ??
      params.type;
    browserMessages.push({ level: params.type, message });
  });
  client.on("Log.entryAdded", (params) => {
    if (!["error", "warning", "warn"].includes(params?.entry?.level)) return;
    browserMessages.push({
      level: params.entry.level,
      message: params.entry.text,
    });
  });

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Log.enable");

  const loaded = client.waitForEvent("Page.loadEventFired", 12000);
  await client.send("Page.navigate", { url });
  await loaded;
  await delay(3200);

  const before = await evaluate(client, debugExpression());
  const webpCheck = await checkWebpAssets(url);
  await client.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: 640,
    y: 560,
    button: "left",
    clickCount: 1,
  });
  await client.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: 640,
    y: 560,
    button: "left",
    clickCount: 1,
  });
  await pressKey(client, "D", "KeyD", 68, "keyDown");
  await delay(450);
  await pressKey(client, "D", "KeyD", 68, "keyUp");
  const qTriggered = await evaluate(client, "window.__conveyorHunterDebugCastQ?.() ?? false");
  await delay(900);

  const after = await evaluate(client, debugExpression());
  const screenshot = await client.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

  const errors = browserMessages.filter((entry) => entry.level === "error");
  const failures = [];
  if (!before.canvas) failures.push("canvas was not created");
  if ((after.elapsed ?? 0) < 3) failures.push("game clock did not advance");
  if ((after.enemies ?? 0) < 1) failures.push("director did not spawn enemies");
  if (webpCheck.failures.length > 0) {
    failures.push(`webp resources failed: ${webpCheck.failures.length}`);
  }
  if (!after.webpManifestReady) failures.push("runtime webp manifest was not loaded");
  if ((after.loadedAssets ?? 0) < (after.expectedAssets ?? 1)) {
    failures.push(`not all runtime assets loaded: ${after.loadedAssets}/${after.expectedAssets}`);
  }
  if ((after.fps ?? 0) < 30) failures.push(`fps below threshold: ${after.fps}`);
  if (!qTriggered || (after.qCasts ?? 0) <= (before.qCasts ?? 0)) failures.push("Q skill did not fire");
  if ((after.qCooldownRemaining ?? 0) <= 0) failures.push("Q skill did not enter cooldown");
  if (Math.abs((after.playerX ?? 0) - (before.playerX ?? 0)) < 8) {
    failures.push("keyboard movement did not change player position");
  }
  if ((after.canvasStats?.stddev ?? 0) < 4) failures.push("canvas appears blank");
  if (errors.length > 0) failures.push(`browser errors: ${errors.length}`);

  const report = {
    url,
    screenshotPath,
    webpCheck,
    qTriggered,
    before,
    after,
    warnings: browserMessages.filter((entry) => entry.level !== "error"),
    errors,
    failures,
  };
  console.log(JSON.stringify(report, null, 2));

  await client.close();
  if (failures.length > 0) process.exitCode = 1;
} finally {
  await stopChrome(chrome);
  await removeProfile(tmpProfile);
}

async function waitForPageTarget(cdpPort) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      const targets = await response.json();
      const target = targets.find((item) => item.type === "page");
      if (target?.webSocketDebuggerUrl) return target;
    } catch {
      // Chrome may still be starting.
    }
    await delay(150);
  }
  throw new Error(`Could not connect to Chrome DevTools on port ${cdpPort}`);
}

async function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await waitForSocket(socket, "open", 5000);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result ?? {});
      return;
    }
    if (message.method && listeners.has(message.method)) {
      for (const listener of listeners.get(message.method)) listener(message.params ?? {});
    }
  });

  return {
    send(method, params = {}) {
      const commandId = ++id;
      socket.send(JSON.stringify({ id: commandId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(commandId, { resolve, reject });
        setTimeout(() => {
          if (!pending.has(commandId)) return;
          pending.delete(commandId);
          reject(new Error(`CDP command timed out: ${method}`));
        }, 15000);
      });
    },
    on(method, handler) {
      const handlers = listeners.get(method) ?? new Set();
      handlers.add(handler);
      listeners.set(method, handlers);
    },
    waitForEvent(method, timeoutMs) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          handlers.delete(handler);
          reject(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs);
        const handler = (params) => {
          clearTimeout(timer);
          handlers.delete(handler);
          resolve(params);
        };
        const handlers = listeners.get(method) ?? new Set();
        handlers.add(handler);
        listeners.set(method, handlers);
      });
    },
    close() {
      socket.close();
    },
  };
}

async function checkWebpAssets(pageUrl) {
  const manifestUrl = new URL("/assets/p0-runtime/manifest.json", pageUrl).href;
  const manifestResponse = await fetch(manifestUrl);
  if (!manifestResponse.ok) {
    return {
      manifestUrl,
      total: 0,
      failures: [{ url: manifestUrl, status: manifestResponse.status }],
    };
  }
  const manifest = await manifestResponse.json();
  const failures = [];
  await Promise.all(
    manifest.assets.map(async (asset) => {
      const assetUrl = new URL(asset.url, pageUrl).href;
      const response = await fetch(assetUrl);
      if (!response.ok) failures.push({ url: assetUrl, status: response.status });
    }),
  );
  return {
    manifestUrl,
    total: manifest.assets.length,
    failures,
  };
}

async function pressKey(client, key, code, keyCode, type, text) {
  await client.send("Input.dispatchKeyEvent", {
    type,
    key,
    code,
    text: text ?? "",
    unmodifiedText: text ?? "",
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  });
}


async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime.evaluate failed");
  }
  return result.result.value;
}

function debugExpression() {
  return `(() => {
    const canvas = document.querySelector("canvas");
    let canvasStats = null;
    if (canvas) {
      const sample = document.createElement("canvas");
      sample.width = 80;
      sample.height = 45;
      const ctx = sample.getContext("2d");
      ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
      const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
        sum += v;
        sumSq += v * v;
        count += 1;
      }
      const mean = sum / count;
      canvasStats = {
        mean: Number(mean.toFixed(2)),
        stddev: Number(Math.sqrt(sumSq / count - mean * mean).toFixed(2)),
      };
    }
    const debug = window.__conveyorHunterDebug?.();
    return {
      title: document.title,
      canvas: canvas
        ? {
            width: canvas.width,
            height: canvas.height,
            clientWidth: canvas.clientWidth,
            clientHeight: canvas.clientHeight,
          }
        : null,
      canvasStats,
      ...debug,
    };
  })()`;
}

function waitForSocket(socket, eventName, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${eventName}`)), timeoutMs);
    socket.addEventListener(
      eventName,
      (event) => {
        clearTimeout(timer);
        resolve(event);
      },
      { once: true },
    );
    socket.addEventListener(
      "error",
      () => {
        clearTimeout(timer);
        reject(new Error("WebSocket connection failed"));
      },
      { once: true },
    );
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopChrome(process) {
  if (process.exitCode !== null) return;
  const gracefulExit = waitForProcessExit(process, 1800).catch(() => false);
  process.kill("SIGTERM");
  const exited = await gracefulExit;
  if (exited) return;
  const forcedExit = waitForProcessExit(process, 1800).catch(() => false);
  process.kill("SIGKILL");
  await forcedExit;
}

function waitForProcessExit(process, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Chrome did not exit in time")), timeoutMs);
    process.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

async function removeProfile(path) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await delay(250);
    }
  }
}
