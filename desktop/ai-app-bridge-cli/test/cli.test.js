const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const path = require('path');
const test = require('node:test');

const {
  buildBridgeFailureResult,
  defaultInstallerButtonTexts,
  findTappableNodeByText,
  helpText,
  installerButtonTextsForSurface,
  isLikelyInstallerSurface,
  normalizeBridgeError,
  parseKeyboardState,
  parseComponentFromWindowLine,
  parseForegroundWindow,
  shouldDismissKeyboardForPoint,
} = require('../bin/ai-app-bridge.js');

const cliPath = path.join(__dirname, '..', 'bin', 'ai-app-bridge.js');

test('--help prints usage without probing adb', () => {
  const output = execFileSync(process.execPath, [cliPath, '--help'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ADB: 'adb-that-should-not-run',
    },
  });

  assert.equal(output, `${helpText}\n`);
  assert.match(output, /Usage: ai-app-bridge <command>/);
  assert.match(output, /--package-name <name>/);
});

test('help command prints usage without probing adb', () => {
  const output = execFileSync(process.execPath, [cliPath, 'help'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ADB: 'adb-that-should-not-run',
    },
  });

  assert.equal(output, `${helpText}\n`);
});

test('normalizes socket hang-up as structured not-ready status', () => {
  const error = new Error('socket hang up');
  error.code = 'ECONNRESET';

  const normalized = normalizeBridgeError(error);
  assert.equal(normalized.code, 'bridge_not_ready');

  const result = buildBridgeFailureResult(
    {
      packageName: 'com.example.reader',
      port: 18080,
      hostPort: 18083,
      devicePort: 18083,
      devicePortSource: 'package-port-file',
      explicitPort: false,
    },
    'status',
    '/v1/status',
    error,
  );

  assert.equal(result.ok, false);
  assert.equal(result.error, 'bridge_not_ready');
  assert.equal(result.packageName, 'com.example.reader');
  assert.equal(result.attempted.localPort, 18083);
  assert.equal(result.attempted.devicePort, 18083);
});

test('normalizes status HTTP timeout as structured not-ready status', () => {
  const normalized = normalizeBridgeError(new Error('HTTP timeout: http://127.0.0.1:18080/v1/status'));
  assert.equal(normalized.code, 'bridge_not_ready');
});

test('normalizes adb timeout separately from bridge HTTP readiness', () => {
  const normalized = normalizeBridgeError(new Error('adb timed out after 15000ms: adb shell run-as app cat file'));
  assert.equal(normalized.code, 'adb_timeout');
});

test('parses foreground package and activity from window dumpsys lines', () => {
  const line = 'mCurrentFocus=Window{123 u0 com.example.reader/.ui.activity.MainActivity}';
  const component = parseComponentFromWindowLine(line);
  assert.deepEqual(component, {
    packageName: 'com.example.reader',
    activity: 'com.example.reader.ui.activity.MainActivity',
    component: 'com.example.reader/.ui.activity.MainActivity',
  });

  const foreground = parseForegroundWindow(`irrelevant\n${line}\n`);
  assert.equal(foreground.ok, true);
  assert.equal(foreground.source, 'mCurrentFocus');
  assert.equal(foreground.packageName, 'com.example.reader');
  assert.equal(foreground.activity, 'com.example.reader.ui.activity.MainActivity');
});

test('tap-text candidate selection skips offscreen bridge nodes', () => {
  const tree = {
    root: {
      bounds: { left: 0, top: 0, right: 100, bottom: 200, width: 100, height: 200 },
      children: [
        {
          text: 'Open Detail',
          visible: true,
          effectiveVisible: true,
          bounds: { left: 0, top: 240, right: 100, bottom: 280, width: 100, height: 40 },
        },
        {
          text: 'Open Detail',
          visible: true,
          effectiveVisible: true,
          bounds: { left: 0, top: 20, right: 100, bottom: 60, width: 100, height: 40 },
        },
      ],
    },
  };

  const match = findTappableNodeByText(tree, 'Open Detail');
  assert.equal(match.node.bounds.top, 20);
});

test('tap-text candidate selection reports offscreen-only bridge match', () => {
  const tree = {
    root: {
      bounds: { left: 0, top: 0, right: 100, bottom: 200, width: 100, height: 200 },
      children: [
        {
          contentDescription: 'Hidden Action',
          visible: true,
          effectiveVisible: true,
          bounds: { left: 0, top: 260, right: 100, bottom: 300, width: 100, height: 40 },
        },
      ],
    },
  };

  const match = findTappableNodeByText(tree, 'Hidden Action');
  assert.equal(match.node, null);
  assert.equal(match.rejected.reason, 'center_outside_viewport');
});

test('parses visible Android keyboard state from dumpsys input_method markers', () => {
  const visible = parseKeyboardState('mInputShown=true\nmImeWindowVis=0x1');
  assert.equal(visible.ok, true);
  assert.equal(visible.visible, true);
  assert.deepEqual(visible.markers, ['mInputShown=true', 'mImeWindowVis']);

  const hidden = parseKeyboardState('mInputShown=false\nmImeWindowVis=0x0');
  assert.equal(hidden.visible, false);

  const staleInputView = parseKeyboardState('mImeWindowVis=0\nmInputShown=false\nmWindowVisible=false\nmIsInputViewShown=true');
  assert.equal(staleInputView.visible, false);
  assert.ok(staleInputView.hiddenMarkers.includes('mWindowVisible=false'));
});

test('keyboard guard only dismisses for lower-screen targets while IME is visible', () => {
  const viewport = { left: 0, top: 0, right: 1080, bottom: 2400 };
  assert.equal(shouldDismissKeyboardForPoint({
    point: { x: 540, y: 1800 },
    viewport,
    keyboardVisible: true,
  }).dismiss, true);
  assert.equal(shouldDismissKeyboardForPoint({
    point: { x: 540, y: 500 },
    viewport,
    keyboardVisible: true,
  }).dismiss, false);
  assert.equal(shouldDismissKeyboardForPoint({
    point: { x: 540, y: 1800 },
    viewport,
    keyboardVisible: false,
  }).dismiss, false);
});

test('installer assistant recognises ROM installer surfaces and safe positive labels', () => {
  assert.equal(isLikelyInstallerSurface(
    { packageName: 'com.oplus.appdetail' },
    '<node text="检测结果：涉及敏感权限" package="com.oplus.appdetail" />',
  ), true);
  assert.equal(isLikelyInstallerSurface(
    { packageName: 'com.example.app' },
    '<node text="安装" package="com.example.app" />',
  ), false);
  assert.equal(isLikelyInstallerSurface(
    { packageName: 'com.heytap.market' },
    '<node text="打开" resource-id="com.heytap.market:id/bt_notification_snack_bar" package="com.heytap.market" />',
  ), false);
  assert.equal(isLikelyInstallerSurface(
    {
      packageName: 'com.oplus.appdetail',
      activity: 'com.oplus.appdetail.model.finish.InstallFinishActivity',
    },
    '<node text="安装" resource-id="com.oplus.appdetail:id/btn_install" package="com.oplus.appdetail" />',
  ), true);
  assert.ok(defaultInstallerButtonTexts().includes('继续安装'));
  assert.ok(defaultInstallerButtonTexts().includes('安装'));
  assert.equal(defaultInstallerButtonTexts().includes('打开'), false);
  assert.equal(defaultInstallerButtonTexts().includes('Open'), false);
  assert.equal(installerButtonTextsForSurface({ finish: true, market: false }).includes('安装'), false);
  assert.equal(installerButtonTextsForSurface({ finish: false, market: true }).includes('Install'), false);
});
