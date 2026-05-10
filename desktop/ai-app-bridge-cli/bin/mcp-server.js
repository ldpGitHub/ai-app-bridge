#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

const bridgeDir = __dirname;
const cliScript = path.join(bridgeDir, 'ai-app-bridge.js');
const nodeBinary = process.env.AI_APP_BRIDGE_NODE || process.execPath;

let buffer = Buffer.alloc(0);

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  drainMessages();
});

process.stdin.on('error', () => {});

function drainMessages() {
  while (true) {
    const delimiter = findHeaderDelimiter(buffer);
    const headerEnd = delimiter.index;
    if (headerEnd < 0) {
      return;
    }
    const header = buffer.subarray(0, headerEnd).toString('utf8');
    const match = /^Content-Length:\s*(\d+)$/im.exec(header);
    if (!match) {
      buffer = buffer.subarray(headerEnd + delimiter.length);
      continue;
    }
    const contentLength = Number(match[1]);
    const messageStart = headerEnd + delimiter.length;
    const messageEnd = messageStart + contentLength;
    if (buffer.length < messageEnd) {
      return;
    }
    const body = buffer.subarray(messageStart, messageEnd).toString('utf8');
    buffer = buffer.subarray(messageEnd);
    handleMessage(body).catch((error) => {
      writeLog(`unhandled message error: ${error.stack || error}`);
    });
  }
}

function findHeaderDelimiter(source) {
  const crlfIndex = source.indexOf('\r\n\r\n');
  const lfIndex = source.indexOf('\n\n');
  if (crlfIndex < 0) {
    return { index: lfIndex, length: 2 };
  }
  if (lfIndex < 0 || crlfIndex < lfIndex) {
    return { index: crlfIndex, length: 4 };
  }
  return { index: lfIndex, length: 2 };
}

async function handleMessage(body) {
  let message;
  try {
    message = JSON.parse(body);
  } catch (error) {
    sendError(null, -32700, `Parse error: ${error.message}`);
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(message, 'id')) {
    return;
  }

  try {
    if (message.method === 'initialize') {
      sendResult(message.id, {
        protocolVersion: message.params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'ai-app-bridge',
          version: '0.1.6',
        },
      });
      return;
    }

    if (message.method === 'tools/list') {
      sendResult(message.id, { tools: toolDefinitions() });
      return;
    }

    if (message.method === 'tools/call') {
      const name = message.params?.name;
      const args = message.params?.arguments || {};
      const result = await callTool(name, args);
      sendResult(message.id, result);
      return;
    }

    sendError(message.id, -32601, `Method not found: ${message.method}`);
  } catch (error) {
    sendError(message.id, -32000, error.message || String(error));
  }
}

function toolDefinitions() {
  return [
    bridgeTool('status', 'Read bridge status, app info, capture counts, and latest Flutter snapshot.'),
    bridgeTool('tree', 'Read the Android View tree from the in-app bridge.'),
    bridgeTool('flutter_tree', 'Read the latest Flutter widget/layout snapshot.'),
    bridgeTool('h5_dom', 'Read native Android WebView DOM from the current Activity.'),
    bridgeTool('h5_eval', 'Execute debug JavaScript in the current native Android WebView.', {
      script: { type: 'string' },
    }, ['script']),
    bridgeTool('h5_click', 'Click a native Android WebView DOM element by CSS selector or text.', h5TargetSchema(), []),
    bridgeTool('h5_input', 'Set text in a native Android WebView input by CSS selector or text.', {
      ...h5TargetSchema(),
      value: { type: 'string', description: 'Text value to set.' },
    }, ['value']),
    bridgeTool('h5_wait', 'Wait for a native Android WebView DOM element or body text.', {
      ...h5TargetSchema(),
      timeoutSec: { type: 'number', description: 'Maximum wait time. Defaults to 10 seconds.' },
      intervalMs: { type: 'number', description: 'Polling interval. Defaults to 500 ms.' },
    }),
    bridgeTool('h5_scroll', 'Scroll a native Android WebView or scroll a DOM element into view.', {
      ...h5TargetSchema(),
      deltaX: { type: 'number', description: 'Window scroll delta X when no selector/text is supplied.' },
      deltaY: { type: 'number', description: 'Window scroll delta Y when no selector/text is supplied.' },
    }),
    bridgeTool('flutter_h5_dom', 'Read DOM through a Flutter-registered H5 adapter.'),
    bridgeTool('flutter_h5_eval', 'Execute JavaScript through a Flutter-registered H5 adapter.', {
      script: { type: 'string' },
    }, ['script']),
    bridgeTool('flutter_h5_click', 'Click a Flutter H5 DOM element by CSS selector or text.', h5TargetSchema(), []),
    bridgeTool('flutter_h5_input', 'Set text in a Flutter H5 input by CSS selector or text.', {
      ...h5TargetSchema(),
      value: { type: 'string', description: 'Text value to set.' },
    }, ['value']),
    bridgeTool('flutter_h5_wait', 'Wait for a Flutter H5 DOM element or body text.', {
      ...h5TargetSchema(),
      timeoutSec: { type: 'number', description: 'Maximum wait time. Defaults to 10 seconds.' },
      intervalMs: { type: 'number', description: 'Polling interval. Defaults to 500 ms.' },
    }),
    bridgeTool('flutter_h5_scroll', 'Scroll a Flutter H5 document or DOM element into view.', {
      ...h5TargetSchema(),
      deltaX: { type: 'number', description: 'Window scroll delta X when no selector/text is supplied.' },
      deltaY: { type: 'number', description: 'Window scroll delta Y when no selector/text is supplied.' },
    }),
    bridgeTool('logs', 'Read generic in-app log records.'),
    bridgeTool('logcat', 'Read Android logcat through ADB with optional pid/tag/level/grep filters.', {
      pid: { type: 'string', description: 'Use "current" for the current app pid, or pass a numeric pid.' },
      appPid: { type: 'boolean', description: 'Filter by the current package pid.' },
      tag: { type: 'string', description: 'Comma-separated exact logcat tags.' },
      level: { type: 'string', description: 'Minimum Android log level: V,D,I,W,E,F.' },
      grep: { type: 'string', description: 'Substring filter applied after pid/tag/level.' },
      lines: { type: 'number', description: 'Input logcat tail line count before filtering.' },
      since: { type: 'string', description: 'Passed to adb logcat -T.' },
      follow: { type: 'boolean', description: 'Follow live logs for durationSec seconds.' },
      durationSec: { type: 'number', description: 'Bounded live follow duration. Max 60 seconds.' },
      clear: { type: 'boolean', description: 'Clear logcat before reading/following.' },
    }),
    bridgeTool('network', 'Read generic in-app network records.'),
    bridgeTool('state', 'Read generic in-app state records.'),
    bridgeTool('events', 'Read generic in-app event records.'),
    bridgeTool('uia_tree', 'Read UIAutomator XML for the current device window.'),
    bridgeTool('screenshot', 'Capture an ADB screenshot.'),
    bridgeTool('launch_native_test', 'Launch the debug native Android bridge test Activity.'),
    bridgeTool('launch_flutter', 'Launch the Flutter Activity, optionally with an initial route.'),
    bridgeTool('tap', 'Tap device coordinates through ADB.', {
      tapX: { type: 'number' },
      tapY: { type: 'number' },
    }, ['tapX', 'tapY']),
    bridgeTool('tap_text', 'Tap the center of an Android View node by exact text or contentDescription.', {
      targetText: { type: 'string' },
    }, ['targetText']),
    bridgeTool('wait_text', 'Wait until text appears in status, Android tree, or UIAutomator tree.', {
      targetText: { type: 'string' },
      timeoutSec: { type: 'number' },
    }, ['targetText']),
    bridgeTool('input_text', 'Type text through ADB input.', {
      text: { type: 'string' },
    }, ['text']),
    bridgeTool('swipe', 'Swipe device coordinates through ADB.', {
      startX: { type: 'number' },
      startY: { type: 'number' },
      endX: { type: 'number' },
      endY: { type: 'number' },
      durationMs: { type: 'number' },
    }, ['startX', 'startY', 'endX', 'endY']),
    bridgeTool('keyevent', 'Send an Android keyevent through ADB.', {
      keyCode: { type: 'number' },
    }, ['keyCode']),
    bridgeTool('permission_state', 'Read Android runtime permission state from dumpsys package.', {
      permission: { type: 'string' },
    }, ['permission']),
    bridgeTool('permission_grant', 'Grant an Android runtime permission with adb pm grant, then read state.', {
      permission: { type: 'string' },
    }, ['permission']),
    bridgeTool('permission_revoke', 'Revoke an Android runtime permission with adb pm revoke, then read state.', {
      permission: { type: 'string' },
    }, ['permission']),
    bridgeTool('appops_set', 'Set an Android app-op mode with adb appops set.', {
      op: { type: 'string' },
      mode: { type: 'string' },
    }, ['op', 'mode']),
    bridgeTool('tap_uia_text', 'Tap a UIAutomator node by text without relying on the in-app tree.', {
      targetText: { type: 'string' },
      exact: { type: 'boolean' },
    }, ['targetText']),
    bridgeTool('permission_dialog', 'Tap a visible Android permission dialog allow button through UIAutomator.', {
      targetText: { type: 'string', description: 'Optional custom allow-button text.' },
      buttonText: { type: 'string', description: 'Optional comma-separated allow-button texts.' },
      resourceId: { type: 'string', description: 'Optional permission button resource id.' },
      attempts: { type: 'number' },
      intervalMs: { type: 'number' },
      exact: { type: 'boolean' },
    }),
    {
      name: 'run_smoke',
      description: 'Run the full Android + Flutter bridge smoke test.',
      inputSchema: baseSchema(),
    },
  ];
}

function bridgeTool(name, description, properties = {}, required = []) {
  return {
    name,
    description,
    inputSchema: baseSchema(properties, required),
  };
}

function baseSchema(extraProperties = {}, extraRequired = []) {
  return {
    type: 'object',
    properties: {
      serial: { type: 'string', description: 'ADB serial. Optional when one device is connected.' },
      adb: { type: 'string', description: 'ADB executable path or command.' },
      port: { type: 'number', description: 'Bridge port. Defaults to 18080.' },
      packageName: { type: 'string', description: 'Android package name. Defaults to io.github.lidongping.aiappbridge.sample.' },
      initialRoute: { type: 'string', description: 'Flutter initial route for launch_flutter.' },
      outFile: { type: 'string', description: 'Screenshot output path for screenshot.' },
      sinceId: { type: 'number', description: 'Capture query lower bound by record id.' },
      sinceMs: { type: 'number', description: 'Capture query lower bound by timestamp milliseconds.' },
      limit: { type: 'number', description: 'Maximum capture records to return.' },
      ...extraProperties,
    },
    required: extraRequired,
    additionalProperties: false,
  };
}

function h5TargetSchema() {
  return {
    selector: { type: 'string', description: 'CSS selector for the target DOM element.' },
    targetText: { type: 'string', description: 'Text, value, aria-label, placeholder, id, name, or role to match.' },
    exact: { type: 'boolean', description: 'Require exact text match instead of substring match.' },
  };
}

async function callTool(name, args) {
  if (name === 'run_smoke') {
    return runSmoke(args);
  }
  const commandMap = {
    flutter_tree: 'flutter-tree',
    h5_dom: 'h5-dom',
    h5_eval: 'h5-eval',
    h5_click: 'h5-click',
    h5_input: 'h5-input',
    h5_wait: 'h5-wait',
    h5_scroll: 'h5-scroll',
    flutter_h5_dom: 'flutter-h5-dom',
    flutter_h5_eval: 'flutter-h5-eval',
    flutter_h5_click: 'flutter-h5-click',
    flutter_h5_input: 'flutter-h5-input',
    flutter_h5_wait: 'flutter-h5-wait',
    flutter_h5_scroll: 'flutter-h5-scroll',
    uia_tree: 'uia-tree',
    launch_native_test: 'launch-native-test',
    launch_flutter: 'launch-flutter',
    tap_text: 'tap-text',
    wait_text: 'wait-text',
    input_text: 'input-text',
    permission_state: 'permission-state',
    permission_grant: 'permission-grant',
    permission_revoke: 'permission-revoke',
    appops_set: 'appops-set',
    tap_uia_text: 'tap-uia-text',
    permission_dialog: 'permission-dialog',
  };
  const command = commandMap[name] || name;
  return runBridge(command, args);
}

async function runBridge(command, args) {
  const cliArgs = [cliScript, command];
  addCommonArgs(cliArgs, args);
  addArg(cliArgs, 'initial-route', args.initialRoute);
  addArg(cliArgs, 'out-file', args.outFile);
  addArg(cliArgs, 'tap-x', args.tapX);
  addArg(cliArgs, 'tap-y', args.tapY);
  addArg(cliArgs, 'target-text', args.targetText);
  addArg(cliArgs, 'timeout-sec', args.timeoutSec);
  addArg(cliArgs, 'text', args.text);
  addArg(cliArgs, 'start-x', args.startX);
  addArg(cliArgs, 'start-y', args.startY);
  addArg(cliArgs, 'end-x', args.endX);
  addArg(cliArgs, 'end-y', args.endY);
  addArg(cliArgs, 'duration-ms', args.durationMs);
  addArg(cliArgs, 'key-code', args.keyCode);
  addArg(cliArgs, 'permission', args.permission);
  addArg(cliArgs, 'op', args.op);
  addArg(cliArgs, 'mode', args.mode);
  addArg(cliArgs, 'script', args.script);
  addArg(cliArgs, 'selector', args.selector);
  addArg(cliArgs, 'target-text', args.targetText);
  addArg(cliArgs, 'value', args.value);
  addArg(cliArgs, 'exact', args.exact);
  addArg(cliArgs, 'button-text', args.buttonText);
  addArg(cliArgs, 'resource-id', args.resourceId);
  addArg(cliArgs, 'attempts', args.attempts);
  addArg(cliArgs, 'interval-ms', args.intervalMs);
  addArg(cliArgs, 'delta-x', args.deltaX);
  addArg(cliArgs, 'delta-y', args.deltaY);
  addArg(cliArgs, 'since-id', args.sinceId);
  addArg(cliArgs, 'since-ms', args.sinceMs);
  addArg(cliArgs, 'limit', args.limit);
  addArg(cliArgs, 'pid', args.pid);
  addArg(cliArgs, 'app-pid', args.appPid);
  addArg(cliArgs, 'tag', args.tag);
  addArg(cliArgs, 'level', args.level);
  addArg(cliArgs, 'grep', args.grep);
  addArg(cliArgs, 'lines', args.lines);
  addArg(cliArgs, 'since', args.since);
  addArg(cliArgs, 'follow', args.follow);
  addArg(cliArgs, 'duration-sec', args.durationSec);
  addArg(cliArgs, 'clear', args.clear);
  return runProcess(cliArgs);
}

async function runSmoke(args) {
  const cliArgs = [cliScript, 'smoke'];
  addCommonArgs(cliArgs, args);
  return runProcess(cliArgs);
}

function addCommonArgs(cliArgs, args) {
  addArg(cliArgs, 'adb', args.adb);
  addArg(cliArgs, 'serial', args.serial);
  addArg(cliArgs, 'port', args.port);
  addArg(cliArgs, 'package-name', args.packageName);
}

function addArg(cliArgs, name, value) {
  if (value === undefined || value === null || value === '' || value === false) {
    return;
  }
  cliArgs.push(`--${name}`, String(value));
}

function runProcess(cliArgs) {
  return new Promise((resolve) => {
    const child = spawn(nodeBinary, cliArgs, {
      cwd: bridgeDir,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      resolve(toolText(`failed to start Node bridge CLI: ${error.message}`, true));
    });
    child.on('close', (code) => {
      const text = [
        stdout.trim(),
        stderr.trim() ? `stderr:\n${stderr.trim()}` : '',
        code === 0 ? '' : `exitCode: ${code}`,
      ].filter(Boolean).join('\n\n');
      resolve(toolText(text || 'ok', code !== 0));
    });
  });
}

function toolText(text, isError = false) {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
    isError,
  };
}

function sendResult(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message) {
  send({
    jsonrpc: '2.0',
    id,
    error: { code, message },
  });
}

function send(message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

function writeLog(text) {
  process.stderr.write(`${text}\n`);
}

