#!/usr/bin/env node
// Copies the types of the installed @pipecat-ai/client-js into
// types/@pipecat-ai/client-js/typeOverrides.d.ts, which the packages' tsconfig
// files use in place of client-js's own types. client-js is typed against the
// browser, so its MediaStreamTrack and MediaDeviceInfo are replaced with the
// ones from react-native-webrtc, and the UI features are left out (see
// UNAVAILABLE).
//
// Run it after updating client-js: node scripts/sync-client-js-types.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import ts from 'typescript';

// The UI features, which work with a UIWorker on the bot, aren't supported on
// React Native. They're built around the UI snapshot, which client-js takes
// from the page's DOM, and React Native has no DOM: the bot couldn't see the
// screen, and the commands that act on an element name it by its ref in the
// snapshot. So all of them are left out: the snapshot, the UI events and
// commands, and the job groups.
const UNAVAILABLE = {
  declarations: [
    // The snapshot: the DOM walker and its helpers, the streamer, and the
    // ui-snapshot message's data.
    'findElementByRef',
    'findRefForElement',
    'serializeSelection',
    'SnapshotOptions',
    'snapshotDocument',
    'A11ySnapshotStreamerOptions',
    'A11ySnapshotEmitter',
    'A11ySnapshotStreamer',
    'A11yNode',
    'A11ySelection',
    'A11ySnapshot',
    'UISnapshotData',
    // UI events and commands.
    'ProtocolUIEventData',
    'UIEventData',
    'UICommandData',
    'ToastPayload',
    'NavigatePayload',
    'ScrollToPayload',
    'HighlightPayload',
    'FocusPayload',
    'ClickPayload',
    'SetInputValuePayload',
    'SelectTextPayload',
    // Job groups.
    'JobStatus',
    'UIJobGroupStartedEnvelope',
    'UIJobUpdateEnvelope',
    'UIJobCompletedEnvelope',
    'UIJobGroupCompletedEnvelope',
    'UIJobGroupEnvelope',
    'UIJobGroupListener',
    'UIJobGroupData',
    'ProtocolUICancelJobGroupData',
    'UICancelJobGroupData',
  ],
  // Members of a class, an enum, or a type such as RTVIEvents.
  members: {
    PipecatClient: [
      'startUISnapshotStream',
      'stopUISnapshotStream',
      'sendUIEvent',
      'cancelUIJobGroup',
    ],
    RTVIMessageType: [
      'UI_EVENT',
      'UI_SNAPSHOT',
      'UI_CANCEL_JOB_GROUP',
      'UI_COMMAND',
      'UI_JOB_GROUP',
    ],
    RTVIEvent: ['UICommand', 'UIJobGroup'],
    RTVIEvents: ['uiCommand', 'uiJobGroup'],
    RTVIEventCallbacks: ['onUICommand', 'onUIJobGroup'],
  },
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clientJs = join(root, 'node_modules', '@pipecat-ai', 'client-js');
const types = readFileSync(join(clientJs, 'dist', 'index.d.ts'), 'utf8');

/**
 * The members of a class, an enum, an interface, or a type alias of an object
 * type, also when wrapped as `Partial<{ ... }>`.
 */
function membersOf(statement) {
  if (statement.members) return statement.members;
  let type = statement.type;
  if (type && ts.isTypeReferenceNode(type)) type = type.typeArguments?.[0];
  return type && ts.isTypeLiteralNode(type) ? type.members : [];
}

/** The source without the declarations and members in UNAVAILABLE. */
function withoutUnavailable(source) {
  const file = ts.createSourceFile(
    'index.d.ts',
    source,
    ts.ScriptTarget.Latest
  );
  const ranges = [];
  const found = new Set();
  const remove = (node, name) => {
    // An enum member's comma follows it.
    let end = source[node.getEnd()] === ',' ? node.getEnd() + 1 : node.getEnd();
    // The leading trivia starts with the rest of the previous line, such as
    // its trailing comment, so the removal starts on the next line and runs
    // to the end of the node's own line.
    let start = node.getFullStart();
    const newline = source.indexOf('\n', start);
    if (newline !== -1 && newline < node.getStart(file)) {
      start = newline + 1;
      const endOfLine = source.indexOf('\n', end);
      if (
        endOfLine !== -1 &&
        /^\s*(\/\/.*)?$/.test(source.slice(end, endOfLine))
      ) {
        end = endOfLine + 1;
      }
    }
    ranges.push([start, end]);
    found.add(name);
  };
  for (const statement of file.statements) {
    const name = statement.name?.text;
    if (UNAVAILABLE.declarations.includes(name)) {
      remove(statement, name);
    }
    const members = UNAVAILABLE.members[name];
    for (const member of members ? membersOf(statement) : []) {
      const memberName = member.name?.getText(file);
      if (members.includes(memberName)) {
        remove(member, `${name}.${memberName}`);
      }
    }
  }
  const expected = [
    ...UNAVAILABLE.declarations,
    ...Object.entries(UNAVAILABLE.members).flatMap(([cls, names]) =>
      names.map((n) => `${cls}.${n}`)
    ),
  ];
  const missing = expected.filter((name) => !found.has(name));
  if (missing.length) {
    console.warn(`Not in client-js's types any more: ${missing.join(', ')}`);
  }
  let result = source;
  for (const [start, end] of ranges.sort((a, b) => b[0] - a[0])) {
    result = result.slice(0, start) + result.slice(end);
  }
  return result;
}

const header = `import { MediaDeviceInfo, MediaStreamTrack } from '@daily-co/react-native-webrtc';\n`;
const output = join(
  root,
  'types',
  '@pipecat-ai',
  'client-js',
  'typeOverrides.d.ts'
);
const options = await prettier.resolveConfig(output);
const formatted = await prettier.format(
  header +
    withoutUnavailable(types.replace(/\n?\/\/# sourceMappingURL=.*$/, '\n')),
  {
    ...options,
    parser: 'typescript',
  }
);
writeFileSync(output, formatted);

const { version } = JSON.parse(
  readFileSync(join(clientJs, 'package.json'), 'utf8')
);
console.log(`Wrote ${output} from @pipecat-ai/client-js ${version}.`);
