import {
  MediaDeviceInfo,
  MediaStreamTrack,
} from '@daily-co/react-native-webrtc';
import TypedEmitter from 'typed-emitter';
export type TransportState =
  | 'disconnected'
  | 'initializing'
  | 'initialized'
  | 'authenticating'
  | 'authenticated'
  | 'connecting'
  | 'connected'
  | 'ready'
  | 'disconnecting'
  | 'error';
export enum TransportStateEnum {
  DISCONNECTED = 'disconnected',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  READY = 'ready',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error',
}
export type Participant = {
  id: string;
  name: string;
  local: boolean;
};
/**
 * Per-device lifecycle state, tracked independently for the mic and the cam.
 * Modelled after daily-react's DailyDevices. Transitions are driven by
 * explicit calls to PipecatClient.initDevices() and by DeviceError events.
 * Never by transport connect/disconnect.
 */
export type DeviceState =
  /** initDevices() has not been called yet for this device */
  | 'uninitialized'
  /** initDevices() is in flight (enumeration / permission request) */
  | 'initializing'
  /** Device is enumerated and ready to use */
  | 'granted'
  /** Device is in an error state and could not be acquired */
  | 'error';
/**
 * Per-device error categories. Only meaningful when DeviceStatus.state is
 * 'error'. Mirrors the shape of DeviceErrorType but expressed in
 * MediaState's own vocabulary so consumers can render UI without going
 * through the underlying error object.
 */
export type DeviceErrorReason =
  /** User explicitly denied permission */
  | 'blocked'
  /** Hardware is busy in another application */
  | 'already-in-use'
  /** No matching hardware was found */
  | 'not-found'
  /** getUserMedia constraints couldn't be satisfied */
  | 'invalid-constraints'
  /** Browser API is unavailable (legacy browser, insecure context) */
  | 'not-supported'
  /** Catch-all for errors we couldn't classify */
  | 'unknown';
/**
 * Per-device status. A discriminated union: when `state` is `'error'`, the
 * `reason` field describes the error category (and `details` may carry the
 * raw error payload). Consumers branch on `state` to decide what to render.
 */
export type DeviceStatus =
  | {
      state: 'uninitialized' | 'initializing' | 'granted';
    }
  | {
      state: 'error';
      reason: DeviceErrorReason;
      details?: unknown;
    };
/**
 * Per-device state on PipecatClient, exposed independently of TransportState.
 * Speakers are intentionally not tracked here: output devices have no
 * permission or in-use failure mode, only enumeration.
 */
export type MediaState = {
  mic: DeviceStatus;
  cam: DeviceStatus;
};
/**
 * Whether each kind of media can flow in a session. `false` rules it out, so
 * the matching UI can be hidden; `undefined` means it isn't ruled out, so the
 * UI should be shown. `true` means everything involved supports it.
 */
export type MediaSupport = {
  /** The user's microphone audio to the bot. */
  mic?: boolean;
  /** The user's camera video to the bot. */
  cam?: boolean;
  /** The user's screen share to the bot. */
  screenShare?: boolean;
  /** The bot's audio to the user. */
  botAudio?: boolean;
  /** The bot's video to the user. */
  botVideo?: boolean;
};
/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */
export class RTVIError extends Error {
  readonly status: number | undefined;
  constructor(message?: string, status?: number | undefined);
}
export class ConnectionTimeoutError extends RTVIError {
  constructor(message?: string | undefined);
}
export class StartBotError extends RTVIError {
  readonly error: string;
  constructor(message?: string | undefined, status?: number);
}
export class TransportStartError extends RTVIError {
  constructor(message?: string | undefined);
}
export class InvalidTransportParamsError extends RTVIError {
  constructor(message?: string | undefined);
}
export class BotNotReadyError extends RTVIError {
  constructor(message?: string | undefined);
}
export class BotAlreadyStartedError extends RTVIError {
  constructor(message?: string | undefined);
}
export class UnsupportedFeatureError extends RTVIError {
  readonly feature: string;
  constructor(feature: string, source?: string, message?: string);
}
export class MessageTooLargeError extends RTVIError {
  constructor(message?: string | undefined);
}
export type DeviceArray = Array<'cam' | 'mic' | 'speaker'>;
export type DeviceErrorType =
  | 'in-use'
  | 'permissions'
  | 'undefined-mediadevices'
  | 'not-found'
  | 'constraints'
  | 'unknown';
export type DeviceErrorDetails = Record<
  string,
  string | boolean | number | Error
>;
export class DeviceError extends RTVIError {
  readonly devices: DeviceArray;
  readonly type: DeviceErrorType;
  readonly details: DeviceErrorDetails | undefined;
  constructor(
    devices: DeviceArray,
    type: DeviceErrorType,
    message?: string,
    details?: DeviceErrorDetails
  );
}
/**
 * Data format for sending audio levels.
 */
interface ProtocolAudioLevelMessageData {
  /**
   * How loud the audio is, from 0 (quiet) to 1 (loud).
   */
  value: number;
}
/**
 * What a bot does in a session.
 */
interface ProtocolBotCapabilities {
  /**
   * Whether the bot receives the user's audio.
   */
  audio_in?: boolean;
  /**
   * Whether the bot sends audio to the user.
   */
  audio_out?: boolean;
  /**
   * Whether the bot receives the user's video.
   */
  video_in?: boolean;
  /**
   * Whether the bot receives the user's screen share. Known when the transport captures its video sources from `video_in_sources`; unknown when the application captures them itself.
   */
  screen_in?: boolean;
  /**
   * Whether the bot sends video to the user.
   */
  video_out?: boolean;
  /**
   * Whether the bot reports metrics.
   */
  metrics?: boolean;
}
/**
 * Data for a bot LLM marker message.
 */
interface ProtocolBotLLMMarkerMessageData {
  /**
   * The marker as the LLM produced it; empty when the response carried none.
   */
  text: string;
  /**
   * What the marker means, such as `complete`, `short` or `long` for the markers that say whether the user's turn was complete, `silent` for a reply dropped as the wait-reassurance silent mark, or `null` when it means nothing the server knows.
   */
  kind?: string;
  /**
   * The response's text as the LLM produced it, markers included.
   */
  raw: string;
  /**
   * Every marker the emitter recognizes.
   */
  markers: string[];
}
/**
 * Data for bot output RTVI messages.
 */
interface ProtocolBotOutputMessageData {
  /**
   * The text.
   */
  text: string;
  /**
   * What form the text is in (e.g., sentence, code, etc.).
   */
  output_type: ProtocolTextType | string;
  /**
   * @deprecated
   * What form the text is in, always the same as `output_type`. Deprecated: Use `output_type` instead.
   */
  text_type?: ProtocolTextType | string;
  /**
   * @deprecated
   * What form the text is in, always the same as `output_type`. Deprecated: Use `output_type` instead.
   */
  aggregated_by?: ProtocolTextType | string;
  /**
   * Identifies the segment the text belongs to; every message about one segment, such as its spoken progress, carries the same id.
   */
  segment_id?: number;
  /**
   * **(v1 only)** Whether the text has been spoken by TTS.
   */
  spoken?: boolean;
  /**
   * **(v2+)** Whether the text will be spoken by TTS.
   */
  will_be_spoken?: boolean;
  /**
   * **(v2+)** Lifecycle status of the segment: `"new"` on its first message, the only one for text that isn't spoken; `"in-progress"` as each of its words is spoken, for TTS services with word timestamps; `"completed"` once its last word is spoken.
   */
  spoken_status?: 'new' | 'in-progress' | 'completed';
  /**
   * **(v2+)** Accumulated / remaining text breakdown. Present when `will_be_spoken` is `true`.
   */
  spoken_progress?: ProtocolSpokenProgressData;
  /**
   * **(2.3.0+)** The delivery of the text just spoken, by its universal names, such as `["warm", "emphasis"]`, empty for the voice's baseline. They change within a segment where its delivery does, so a segment's `"new"` message has none. Present in expressive conversation (alpha).
   */
  delivery?: string[];
}
/**
 * Data for an RTVI error event.
 */
interface ProtocolErrorData {
  /**
   * What went wrong.
   */
  error: string;
  /**
   * Whether the bot stopped because of the error.
   */
  fatal: boolean;
}
/**
 * Data format for a conversation flow entering a node.
 */
interface ProtocolFlowNodeEnteredMessageData {
  /**
   * The name of the node the flow entered. A node of a subflow is named `<parent>.<node>`.
   */
  node: string;
  /**
   * The name of the node the flow left. Absent for the flow's first node.
   */
  previous_node?: string;
  /**
   * The name of the function whose call moved the flow to this node. Absent when the bot set the node itself.
   */
  function?: string;
  /**
   * The entered node's metadata, a JSON object of the application's own. Absent when the node has none.
   */
  metadata?: {
    [k: string]: unknown;
  };
  /**
   * The metadata of `function`, a JSON object of the application's own. Absent when the function has none.
   */
  function_metadata?: {
    [k: string]: unknown;
  };
  /**
   * When the node belongs to a subflow, the name of the node that runs the subflow. Absent otherwise.
   */
  parent?: string;
}
/**
 * Data for LLM function call in-progress notification.
 */
interface ProtocolLLMFunctionCallInProgressMessageData {
  /**
   * Unique identifier of the call.
   */
  tool_call_id: string;
  /**
   * Name of the function called.
   */
  function_name?: string;
  /**
   * Arguments passed to the function.
   */
  arguments?: {
    [k: string]: unknown;
  };
}
/**
 * Data for LLM function call result.
 */
interface ProtocolLLMFunctionCallResultData {
  /**
   * Name of the function called.
   */
  function_name: string;
  /**
   * Unique identifier of the call, as the server reported it.
   */
  tool_call_id: string;
  /**
   * Arguments the function was called with.
   */
  arguments: {
    [k: string]: unknown;
  };
  /**
   * What the function returned.
   */
  result:
    | {
        [k: string]: unknown;
      }
    | string;
}
/**
 * Data for LLM function call start notification.
 */
interface ProtocolLLMFunctionCallStartMessageData {
  /**
   * Name of the function called.
   */
  function_name?: string;
}
/**
 * Data for LLM function call stopped notification.
 */
interface ProtocolLLMFunctionCallStoppedMessageData {
  /**
   * Unique identifier of the call.
   */
  tool_call_id: string;
  /**
   * Whether the call was cancelled rather than completed.
   */
  cancelled: boolean;
  /**
   * Name of the function called.
   */
  function_name?: string;
  /**
   * The result, when the call completed with one.
   */
  result?: unknown;
}
/**
 * Token usage statistics for LLM operations.
 */
interface ProtocolLLMTokenUsage {
  /**
   * Number of tokens in the input prompt, net or gross of the cache counts depending on the service. Includes tool results the provider feeds back to the model, which are billed as input.
   */
  prompt_tokens: number;
  /**
   * Number of tokens in the generated completion, including any reasoning tokens.
   */
  completion_tokens: number;
  /**
   * Total number of tokens used, including any cached input tokens.
   */
  total_tokens: number;
  /**
   * Number of tokens read from cache, if applicable. Billed below the input rate.
   */
  cache_read_input_tokens?: number;
  /**
   * Number of tokens written to cache, if applicable. Billed at or above the input rate.
   */
  cache_creation_input_tokens?: number;
  /**
   * Number of completion tokens used for reasoning, if applicable.
   */
  reasoning_tokens?: number;
  /**
   * Number of prompt tokens that were audio, if applicable.
   */
  input_audio_tokens?: number;
  /**
   * Number of completion tokens that were audio, if applicable.
   */
  output_audio_tokens?: number;
  /**
   * Number of cache-read tokens that were audio, if applicable.
   */
  cache_read_input_audio_tokens?: number;
}
/**
 * Data structure expected from client messages sent to the RTVI server.
 */
interface ProtocolRawClientMessageData {
  /**
   * The message's type, one of the application's own.
   */
  t: string;
  d?: unknown;
}
/**
 * Data for STT raw text messages.
 */
interface ProtocolSTTRawTextMessageData {
  /**
   * The transcribed text.
   */
  text: string;
  /**
   * Identifier for the user who spoke.
   */
  user_id: string;
  /**
   * When the user said it.
   */
  timestamp: string;
  /**
   * Whether the transcription is final, as opposed to interim.
   */
  final: boolean;
  /**
   * Who said it, when the STT service's diarization tells speakers apart.
   */
  speaker?: ProtocolTranscriptionSpeaker;
}
/**
 * Usage statistics for STT operations.
 */
interface ProtocolSTTUsage {
  /**
   * Client-measured seconds of audio submitted to the service since the last usage report.
   */
  audio_seconds: number;
}
/**
 * Speech-to-Text usage metrics data.
 */
interface ProtocolSTTUsageMetricsData {
  /**
   * Name of the processor generating the metrics.
   */
  processor: string;
  /**
   * Optional model name associated with the metrics.
   */
  model?: string;
  /**
   * Usage statistics for the STT operation.
   */
  value: ProtocolSTTUsage;
}
/**
 * Options for sending text input to the LLM.
 */
interface ProtocolSendTextOptions {
  /**
   * Whether the bot responds to the text right away, interrupting itself if it is speaking. When false, the text waits in the conversation for the bot's next response.
   */
  run_immediately?: boolean;
  /**
   * Whether the bot speaks its response. When false, the response is text only.
   */
  audio_response?: boolean;
}
/**
 * Word-level TTS progress within a spoken segment.
 */
interface ProtocolSpokenProgressData {
  /**
   * Text already spoken in this segment, including the current word.
   */
  accumulated_text: string;
  /**
   * Text not yet spoken in this segment.
   */
  remaining_text: string;
}
/**
 * Time To First Audio (TTFA) metrics data.
 */
interface ProtocolTTFAMetricsData {
  /**
   * Name of the processor generating the metrics.
   */
  processor: string;
  /**
   * Optional model name associated with the metrics.
   */
  model?: string;
  /**
   * TTFA measurement in seconds (`ttfb` plus `leading_silence`).
   */
  ttfa: number;
  /**
   * Time-to-first-byte that TTFA builds on, in seconds. This mirrors the standalone `TTFBMetricsData` (emitted earlier) for convenience; it is not a separate measurement, so don't aggregate both.
   */
  ttfb: number;
  /**
   * Silence padding before the first audible sample, in seconds (`ttfa` minus `ttfb`).
   */
  leading_silence: number;
}
/**
 * Time To First Answer Token (TTFAT) metrics data.
 */
interface ProtocolTTFATMetricsData {
  /**
   * Name of the processor generating the metrics.
   */
  processor: string;
  /**
   * Optional model name associated with the metrics.
   */
  model?: string;
  /**
   * TTFAT measurement in seconds (`ttfb` plus `thinking_time`).
   */
  ttfat: number;
  /**
   * Time-to-first-byte that TTFAT builds on, in seconds. This mirrors the standalone `TTFBMetricsData` (emitted earlier) for convenience; it is not a separate measurement, so don't aggregate both.
   */
  ttfb: number;
  /**
   * Time between the model's first output and the first answer token, in seconds (`ttfat` minus `ttfb`). Reasoning is the usual reason a model streams something before it starts answering, though a model that reasons none still spends a little time here.
   */
  thinking_time: number;
}
/**
 * Data for text-based RTVI messages.
 */
interface ProtocolTextMessageData {
  /**
   * The text.
   */
  text: string;
}
/**
 * Built-in text types.
 */
type ProtocolTextType =
  | 'backchannel'
  | 'expression_sound'
  | 'expression_pause'
  | 'sentence'
  | 'token'
  | 'word';
/**
 * A speaker an STT service's diarization told apart in a transcription stream.
 */
interface ProtocolTranscriptionSpeaker {
  /**
   * The provider's label for the speaker (e.g. `"A"`, `"S1"`, `"2"`).
   */
  label: string;
  /**
   * The speaker's place in the order speakers first appeared, starting at `1`.
   */
  number: number;
}
/**
 * Data for user input messages.
 */
interface ProtocolUserInputMessageData {
  /**
   * What the user said or typed.
   */
  text: string;
  /**
   * What kind of input it is: `"transcription"` for speech transcribed by the STT, `"chat"` for text the client sent, or `"backchannel"` for a short acknowledgment the user said while the bot talks, such as "mhm".
   */
  input_type: 'transcription' | 'chat' | 'backchannel';
  /**
   * When the user said or sent it.
   */
  timestamp: string;
  /**
   * Whether the text is final. Only an interim transcription isn't.
   */
  final: boolean;
  /**
   * Identifier for the user who spoke or typed. For chat, set only when the transport knows the sender, such as Daily and LiveKit.
   */
  user_id?: string;
  /**
   * For chat, the id of the client's `send-text` message.
   */
  msg_id?: string;
  /**
   * For a transcription, how the user said it, when the STT service reports a reading with it. Part of expressive conversation (alpha).
   */
  perception?: ProtocolUserPerceptionSignal[];
  /**
   * For a transcription, who said it, when the STT service's diarization tells speakers apart.
   */
  speaker?: ProtocolTranscriptionSpeaker;
}
/**
 * A label of a perception signal, with how sure the reading is.
 */
interface ProtocolUserPerceptionLabel {
  /**
   * The label, such as `"frustrated"`.
   */
  label: string;
  /**
   * How sure the reading is, from 0 to 1.
   */
  confidence: number;
}
/**
 * One signal of a reading of how the user spoke.
 */
interface ProtocolUserPerceptionSignal {
  /**
   * What is read, such as `"tone"`.
   */
  name: string;
  /**
   * The likeliest labels, likeliest first, for a signal read as labels.
   */
  labels: ProtocolUserPerceptionLabel[];
  /**
   * The measure, for a signal read as a value.
   */
  value?: number;
}
/**
 * Data for user transcription messages.
 */
interface ProtocolUserTranscriptionMessageData {
  /**
   * The transcribed text.
   */
  text: string;
  /**
   * Identifier for the user who spoke.
   */
  user_id: string;
  /**
   * When the user said it.
   */
  timestamp: string;
  /**
   * Whether the transcription is final, as opposed to interim.
   */
  final: boolean;
}
export const RTVI_PROTOCOL_VERSION = '2.4.0';
export const RTVI_MESSAGE_LABEL = 'rtvi-ai';
/**
 * Messages the corresponding server-side client expects to receive about
 * our client-side state.
 */
export enum RTVIMessageType {
  /** Outbound Messages */
  CLIENT_READY = 'client-ready',
  DISCONNECT_BOT = 'disconnect-bot',
  CLIENT_MESSAGE = 'client-message',
  SEND_TEXT = 'send-text',
  SEND_FILE = 'send-file',
  DTMF = 'dtmf',
  APPEND_TO_CONTEXT = 'append-to-context',
  /**
   * Inbound Messages
   * Messages the server-side client sends to our client-side client regarding
   * its state or other non-service-specific messaging.
   */
  BOT_READY = 'bot-ready', // Bot is connected and ready to receive messages
  ERROR = 'error', // Bot initialization error
  METRICS = 'metrics', // Bot reporting metrics
  SERVER_MESSAGE = 'server-message', // Custom server-to-client message
  SERVER_RESPONSE = 'server-response', // Server response to client message
  ERROR_RESPONSE = 'error-response', // Error message in response to an outbound message
  SYSTEM_LOG = 'system-log', // A line of the bot's log, sent only when enabled
  APPEND_TO_CONTEXT_RESULT = 'append-to-context-result',
  FLOW_NODE_ENTERED = 'flow-node-entered', // The bot's conversation flow entered a node (RTVI 2.4.0+)
  /** Speaking and Transcription Messages */
  USER_STARTED_SPEAKING = 'user-started-speaking', // User started speaking
  USER_STOPPED_SPEAKING = 'user-stopped-speaking', // User stopped speaking
  BOT_STARTED_SPEAKING = 'bot-started-speaking', // Bot started speaking
  BOT_STOPPED_SPEAKING = 'bot-stopped-speaking', // Bot stopped speaking
  BOT_INTERRUPTED = 'bot-interrupted', // The bot's in-flight output was cut off, by the user speaking or by text sent with run_immediately (RTVI 2.0.0+)
  USER_MUTE_STARTED = 'user-mute-started', // User muted server-side.
  USER_MUTE_STOPPED = 'user-mute-stopped', // User unmuted server-side.
  VAD_USER_STARTED_SPEAKING = 'vad-user-started-speaking',
  VAD_USER_STOPPED_SPEAKING = 'vad-user-stopped-speaking',
  USER_AUDIO_LEVEL = 'user-audio-level',
  BOT_AUDIO_LEVEL = 'bot-audio-level',
  /** @deprecated Use `USER_INPUT` or `STT_RAW_TEXT` instead. */
  USER_TRANSCRIPTION = 'user-transcription', // Local user speech to text transcription (partials and finals)
  USER_INPUT = 'user-input', // What the user said or typed: transcriptions, sent text and backchannels (RTVI 2.2.0+)
  BOT_OUTPUT = 'bot-output', // A best effort aggregation of all bot output along with metadata like if it's spoken
  BOT_TRANSCRIPTION = 'bot-transcription', // Bot full text transcription (sentence aggregated)
  /** LLM Messages */
  USER_LLM_TEXT = 'user-llm-text', // Aggregated user input text which is sent to LLM
  /** @deprecated Use `LLM_RAW_TEXT` instead. */
  BOT_LLM_TEXT = 'bot-llm-text', // Streamed token returned by the LLM
  BOT_LLM_STARTED = 'bot-llm-started', // Bot LLM inference starts
  BOT_LLM_STOPPED = 'bot-llm-stopped', // Bot LLM inference stops
  BOT_LLM_MARKER = 'bot-llm-marker', // The marker in an LLM response, sent only when enabled
  LLM_FUNCTION_CALL = 'llm-function-call', // Inbound function call from LLM
  LLM_FUNCTION_CALL_STARTED = 'llm-function-call-started', // Inbound function call started
  LLM_FUNCTION_CALL_IN_PROGRESS = 'llm-function-call-in-progress', // Inbound function call in progress
  LLM_FUNCTION_CALL_STOPPED = 'llm-function-call-stopped', // Inbound function call stopped
  LLM_FUNCTION_CALL_RESULT = 'llm-function-call-result', // Outbound result of function call
  BOT_LLM_SEARCH_RESPONSE = 'bot-llm-search-response', // Bot LLM search response
  /** TTS Messages */
  /** @deprecated Use `TTS_RAW_TEXT` instead. */
  BOT_TTS_TEXT = 'bot-tts-text', // Bot TTS text output (streamed word as it is spoken)
  BOT_TTS_STARTED = 'bot-tts-started', // Bot TTS response starts
  BOT_TTS_STOPPED = 'bot-tts-stopped', // Bot TTS response stops
  /** Raw text messages (RTVI 2.2.0+). The bot only sends them when enabled. */
  STT_RAW_TEXT = 'stt-raw-text', // Each transcription as the STT produced it (partials and finals)
  LLM_RAW_TEXT = 'llm-raw-text', // Each chunk of text as the LLM streamed it
  TTS_RAW_TEXT = 'tts-raw-text',
}
/**
 * What the bot does in the session, sent in `bot-ready` (RTVI 2.2.0+).
 *
 * A missing field means the bot can't tell, so keep the default behavior for
 * it. `false` means the bot doesn't do it, so the matching UI can be hidden.
 */
export type BotCapabilities = ProtocolBotCapabilities;
export type BotReadyData = {
  version: string;
  about?: unknown;
  capabilities?: BotCapabilities;
};
type PlatformDetailsValue = undefined | string | number | boolean;
type NestedPlatformDetails =
  | PlatformDetailsValue
  | Record<string, PlatformDetailsValue>;
export interface AboutClientData {
  library: string;
  library_version?: string;
  platform?: string;
  platform_version?: string;
  platform_details?: Record<string, NestedPlatformDetails>;
}
export type ClientReadyData = {
  version: string;
  about: AboutClientData;
};
export type ErrorData = ProtocolErrorData & {
  /** @deprecated Use `error` instead. */
  message?: string;
};
export type PipecatMetricData = {
  /** The service that reported the metric. */
  processor: string;
  /** The service's model, when it reports one. */
  model?: string;
  value: number;
};
/** A TTS service's time to first audio, in seconds. */
export type PipecatTTFAMetricData = ProtocolTTFAMetricsData;
/** An LLM service's time to first answer token, in seconds. */
export type PipecatTTFATMetricData = ProtocolTTFATMetricsData;
/** The tokens an LLM call used. */
export type PipecatTokenUsageData = ProtocolLLMTokenUsage;
/** How much audio an STT service received. */
export type PipecatSTTUsageMetricData = ProtocolSTTUsageMetricsData;
export type PipecatMetricsData = {
  /** How long each service took to process, in seconds. */
  processing?: PipecatMetricData[];
  /** Each service's time to first byte, in seconds. */
  ttfb?: PipecatMetricData[];
  /** Each TTS service's time to first audio. */
  ttfa?: PipecatTTFAMetricData[];
  /** Each LLM service's time to first answer token. */
  ttfat?: PipecatTTFATMetricData[];
  /** The tokens each LLM call used. */
  tokens?: PipecatTokenUsageData[];
  /** How much audio each STT service received. */
  stt_usage?: PipecatSTTUsageMetricData[];
  /** How many characters each TTS service spoke. */
  characters?: PipecatMetricData[];
};
export type TranscriptData = ProtocolUserTranscriptionMessageData;
/**
 * A speaker the bot's STT service told apart with diarization, in a
 * transcription.
 */
export type TranscriptionSpeaker = ProtocolTranscriptionSpeaker;
/** A transcription as the STT produced it (RTVI 2.2.0+). */
export type STTRawTextData = ProtocolSTTRawTextMessageData;
/**
 * What kind of input a `user-input` message reports (RTVI 2.2.0+).
 *
 * - `transcription`: speech the bot transcribed.
 * - `chat`: text sent with `sendText()`.
 * - `backchannel`: a short acknowledgment the user said while the bot talked,
 *   such as "mhm". It doesn't interrupt the bot or reach the LLM.
 */
export type UserInputType = ProtocolUserInputMessageData['input_type'];
/** A label of a perception signal, with how sure the reading is. */
export type UserPerceptionLabel = ProtocolUserPerceptionLabel;
/**
 * One reading of how the user spoke, in expressive conversation (alpha). A
 * signal is read either as labels or as a value.
 */
export type UserPerceptionSignal = ProtocolUserPerceptionSignal;
/**
 * What the user said or typed (RTVI 2.2.0+). For `chat`, `msg_id` is the id
 * `sendText()` returned.
 */
export type UserInputData = ProtocolUserInputMessageData;
/**
 * What kind of text a `bot-output` message holds, the counterpart of
 * {@link UserInputType}. Bots can also send output types of their own, such
 * as "code".
 */
export enum BotOutputType {
  /**
   * A short acknowledgment the bot says while the user talks, such as
   * "Mm-hmm." (RTVI 2.2.0+).
   */
  BACKCHANNEL = 'backchannel',
  /**
   * A sound the bot makes at one point in expressive conversation (alpha),
   * such as a laugh. The text is its name, such as "laugh", one of Pipecat's
   * universal names, the same whichever TTS service performs it (RTVI 2.3.0+).
   */
  EXPRESSION_SOUND = 'expression_sound',
  /**
   * A pause the bot makes in expressive conversation (alpha). The text is
   * its length in milliseconds, such as "300" (RTVI 2.3.0+).
   */
  EXPRESSION_PAUSE = 'expression_pause',
  SENTENCE = 'sentence',
  TOKEN = 'token',
  WORD = 'word',
}
/** @deprecated Use {@link BotOutputType} instead. */
export import TextType = BotOutputType;
/** @deprecated Use {@link BotOutputType} instead. */
export import AggregationType = BotOutputType;
export type SpokenStatus = NonNullable<
  ProtocolBotOutputMessageData['spoken_status']
>;
export type SpokenProgressData = ProtocolSpokenProgressData;
/**
 * The bot's output, with the fields older bots send: a bot on protocol 1.x
 * sends `spoken`, and bots before 2.2.0 send only `text_type` or
 * `aggregated_by`, from which client-js fills in `output_type`.
 */
export type BotOutputData = Omit<
  ProtocolBotOutputMessageData,
  'output_type' | 'text_type' | 'aggregated_by' | 'spoken'
> & {
  /**
   * What form the text is in, the counterpart of `UserInputData.input_type`.
   * Bots that only send `text_type` or `aggregated_by` have it filled in from
   * those.
   */
  output_type?: BotOutputType | string;
  /** @deprecated Use `output_type` instead. */
  text_type?: BotOutputType | string;
  /** @deprecated Use `output_type` instead. */
  aggregated_by?: BotOutputType | string;
  /** @deprecated Protocol 1.4.x only. Use `will_be_spoken` instead. */
  spoken?: boolean;
};
/**
 * The bot's delivery changed, in expressive conversation (alpha,
 * RTVI 2.3.0+). Reported only when it changes: a stressed word brings
 * `"emphasis"` and the word after it takes it away again.
 */
export type BotDeliveryUpdatedData = {
  /**
   * The delivery of the words the bot is speaking now, such as `["warm"]`;
   * empty for the voice's baseline, and null once it stops speaking.
   */
  delivery: string[] | null;
  /** The delivery before the change, or null when it wasn't speaking. */
  previous: string[] | null;
};
/** The kinds of expression the bot performs (alpha, RTVI 2.3.0+). */
export enum BotExpressionKind {
  SOUND = 'sound',
  PAUSE = 'pause',
}
/**
 * A sound or pause the bot performed in expressive conversation (alpha,
 * RTVI 2.3.0+), reported as it was performed.
 */
export type BotExpressionData =
  | {
      kind: BotExpressionKind.SOUND;
      /**
       * The sound, such as "laugh", by Pipecat's universal name for it, the
       * same whichever TTS service performs it.
       */
      sound: string;
    }
  | {
      kind: BotExpressionKind.PAUSE;
      /** How long the pause is, in milliseconds. */
      duration_ms: number;
    };
export type BotLLMTextData = ProtocolTextMessageData;
export type UserLLMTextData = ProtocolTextMessageData;
export type BotTTSTextData = ProtocolTextMessageData;
/** A chunk of text as the LLM streamed it (RTVI 2.2.0+). */
export type LLMRawTextData = ProtocolTextMessageData;
/** Text the TTS speaks, as it is spoken (RTVI 2.2.0+). */
export type TTSRawTextData = ProtocolTextMessageData;
/** How loud the user's or the bot's audio is, as the bot measures it. */
export type AudioLevelData = ProtocolAudioLevelMessageData;
/** A line of the bot's log, for debugging. */
export type SystemLogData = ProtocolTextMessageData;
/**
 * The marker the bot's LLM put in a response, outside the text it speaks,
 * such as one saying whether the user's turn was complete.
 */
export type BotLLMMarkerData = ProtocolBotLLMMarkerMessageData;
export type ServerMessageData = {
  data: any;
};
export type ClientMessageData = ProtocolRawClientMessageData;
/**
 * The bot's conversation flow, built with Pipecat Flows, entered a node
 * (RTVI 2.4.0+). Sent each time the flow enters a node, including its first
 * node and a node it enters again, before the bot responds in that node.
 */
export type FlowNodeEnteredData = ProtocolFlowNodeEnteredMessageData;
export type LLMSearchResult = {
  text: string;
  confidence: number[];
};
export type BotLLMSearchResponseData = {
  search_result?: string;
  rendered_content?: string;
  origins: LLMSearchOrigin[];
};
export type LLMSearchOrigin = {
  site_uri?: string;
  site_title?: string;
  results: LLMSearchResult[];
};
export type LLMFunctionCallStartedData =
  ProtocolLLMFunctionCallStartMessageData;
export type LLMFunctionCallInProgressData =
  ProtocolLLMFunctionCallInProgressMessageData;
/** @deprecated Use LLMFunctionCallInProgressData instead */
export type LLMFunctionCallData = {
  function_name?: string;
  tool_call_id: string;
  args: Record<string, unknown>;
};
export type LLMFunctionCallResult = Record<string, unknown> | string;
export type LLMFunctionCallResultResponse = ProtocolLLMFunctionCallResultData;
export type LLMFunctionCallStoppedData =
  ProtocolLLMFunctionCallStoppedMessageData;
export type SendTextOptions = ProtocolSendTextOptions;
type Serializable =
  | string
  | number
  | boolean
  | null
  | Serializable[]
  | {
      [key: number | string]: Serializable;
    };
export type RTVIImageFormat =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'gif'
  | 'heic'
  | 'heif';
export type RTVIDocFormat =
  | 'pdf'
  | 'csv'
  | 'txt'
  | 'md'
  | 'doc'
  | 'docx'
  | 'xls'
  | 'xlsx'
  | 'json'
  | 'html'
  | 'css'
  | 'javascript';
export type RTVIMediaFormat =
  | 'mp3'
  | 'wav'
  | 'ogg'
  | 'aac'
  | 'mp4'
  | 'webm'
  | 'avi';
export type RTVIFileFormat = RTVIImageFormat | RTVIDocFormat | RTVIMediaFormat;
export const MimeTypeMapping: Record<RTVIFileFormat, string>;
export type FileSourceType = 'bytes' | 'url';
export type FileBytes = {
  type: Extract<FileSourceType, 'bytes'>;
  bytes: string;
};
export type ImageFileBytes = FileBytes & {
  width?: number;
  height?: number;
};
export type FileUrl = {
  type: Extract<FileSourceType, 'url'>;
  url: string | URL;
};
export type RTVIFile = {
  name?: string;
  format: string;
  source: FileBytes | FileUrl;
};
export type SendFileOptions = {
  run_immediately?: boolean;
  audio_response?: boolean;
  custom_options?: {
    [key: number | string]: Serializable;
  };
};
export type FileSupport = {
  formats: string[];
  sources: FileSourceType[];
  maxSize: number;
};
/** Valid DTMF keypad keys. */
export type DTMFButton =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '*'
  | '#';
export type DTMFData = {
  /** One or more DTMF keys, in order. Requires a bot on RTVI protocol
   * 2.1.0+; older bots expect a legacy `{button}` message per key. */
  buttons: DTMFButton[];
};
/** DEPRECATED */
export type LLMContextMessage = {
  role: 'user' | 'assistant';
  content: unknown;
  run_immediately?: boolean;
};
/** DEPRECATED */
export type AppendToContextResultData = {
  result: Record<string, unknown> | string;
};
export function setAboutClient(about: AboutClientData): void;
export class RTVIMessage {
  id: string;
  label: string;
  type: string;
  data: unknown;
  constructor(type: string, data: unknown, id?: string);
  static clientReady(): RTVIMessage;
  static disconnectBot(): RTVIMessage;
  static error(message: string, fatal?: boolean): RTVIMessage;
}
export enum RTVIEvent {
  /** local connection state events */
  Connected = 'connected',
  Disconnected = 'disconnected',
  TransportStateChanged = 'transportStateChanged',
  /** remote connection state events */
  BotStarted = 'botStarted',
  BotConnected = 'botConnected',
  BotReady = 'botReady',
  BotDisconnected = 'botDisconnected',
  Error = 'error',
  /** server messaging */
  ServerMessage = 'serverMessage',
  ServerResponse = 'serverResponse',
  MessageError = 'messageError',
  SystemLog = 'systemLog',
  /** conversation flows */
  FlowNodeEntered = 'flowNodeEntered',
  /** service events */
  Metrics = 'metrics',
  BotStartedSpeaking = 'botStartedSpeaking',
  BotStoppedSpeaking = 'botStoppedSpeaking',
  BotInterrupted = 'botInterrupted',
  UserStartedSpeaking = 'userStartedSpeaking',
  UserStoppedSpeaking = 'userStoppedSpeaking',
  UserMuteStarted = 'userMuteStarted',
  UserMuteStopped = 'userMuteStopped',
  VadUserStartedSpeaking = 'vadUserStartedSpeaking',
  VadUserStoppedSpeaking = 'vadUserStoppedSpeaking',
  ServerUserAudioLevel = 'serverUserAudioLevel',
  ServerBotAudioLevel = 'serverBotAudioLevel',
  /**
   * @deprecated Use `UserInput` to show what the user said, or `SttRawText` to
   * inspect what the STT produced.
   */
  UserTranscript = 'userTranscript',
  UserInput = 'userInput',
  BotOutput = 'botOutput',
  /** The bot's delivery changed, in expressive conversation (RTVI 2.3.0+). */
  BotDeliveryUpdated = 'botDeliveryUpdated',
  /** The bot performed a sound or pause, in expressive conversation (RTVI 2.3.0+). */
  BotExpression = 'botExpression',
  BotTranscript = 'botTranscript',
  UserLlmText = 'userLlmText',
  /**
   * @deprecated Use `BotOutput` to show the bot's text, or `LlmRawText` to
   * inspect what the LLM produced.
   */
  BotLlmText = 'botLlmText',
  BotLlmStarted = 'botLlmStarted',
  BotLlmStopped = 'botLlmStopped',
  BotLlmMarker = 'botLlmMarker',
  LLMFunctionCall = 'llmFunctionCall',
  LLMFunctionCallStarted = 'llmFunctionCallStarted',
  LLMFunctionCallInProgress = 'llmFunctionCallInProgress',
  LLMFunctionCallStopped = 'llmFunctionCallStopped',
  BotLlmSearchResponse = 'botLlmSearchResponse',
  /**
   * @deprecated Use `BotOutput` to show the bot's text, or `TtsRawText` to
   * inspect what the TTS produced.
   */
  BotTtsText = 'botTtsText',
  BotTtsStarted = 'botTtsStarted',
  BotTtsStopped = 'botTtsStopped',
  SttRawText = 'sttRawText',
  LlmRawText = 'llmRawText',
  TtsRawText = 'ttsRawText',
  /** participant events */
  ParticipantConnected = 'participantConnected',
  ParticipantLeft = 'participantLeft',
  /** media events */
  TrackStarted = 'trackStarted',
  TrackStopped = 'trackStopped',
  ScreenTrackStarted = 'screenTrackStarted',
  ScreenTrackStopped = 'screenTrackStopped',
  ScreenShareError = 'screenShareError',
  ClientUserAudioLevel = 'clientUserAudioLevel',
  ClientBotAudioLevel = 'clientBotAudioLevel',
  /** @deprecated Use `ClientUserAudioLevel` instead. */
  LocalAudioLevel = 'localAudioLevel',
  /** @deprecated Use `ClientBotAudioLevel` instead. */
  RemoteAudioLevel = 'remoteAudioLevel',
  /** media device events */
  AvailableCamsUpdated = 'availableCamsUpdated',
  AvailableMicsUpdated = 'availableMicsUpdated',
  AvailableSpeakersUpdated = 'availableSpeakersUpdated',
  CamUpdated = 'camUpdated',
  MicUpdated = 'micUpdated',
  SpeakerUpdated = 'speakerUpdated',
  DeviceError = 'deviceError',
  MediaStateUpdated = 'mediaStateUpdated',
  MediaSupportUpdated = 'mediaSupportUpdated',
  UnsupportedFeature = 'unsupportedFeature',
}
export type RTVIEvents = Partial<{
  /** local connection state events */
  connected: () => void;
  disconnected: () => void;
  transportStateChanged: (state: TransportState) => void;
  /** remote connection state events */
  botStarted: (botResponse: unknown) => void;
  botConnected: (participant: Participant) => void;
  botReady: (botData: BotReadyData) => void;
  botDisconnected: (participant: Participant) => void;
  error: (message: RTVIMessage) => void;
  /** server messaging */
  serverMessage: (data: any) => void;
  serverResponse: (data: any) => void;
  messageError: (message: RTVIMessage) => void;
  /**
   * A line of the bot's log, for debugging. The bot sends it only when
   * enabled, with Pipecat's `system_logs_enabled` RTVIObserverParams.
   */
  systemLog: (data: SystemLogData) => void;
  /** conversation flows */
  flowNodeEntered: (data: FlowNodeEnteredData) => void;
  /** service events */
  metrics: (data: PipecatMetricsData) => void;
  botStartedSpeaking: () => void;
  botStoppedSpeaking: () => void;
  /**
   * The bot's in-flight output was cut off, whether by the user speaking or
   * by text sent with `run_immediately`. Whatever it was mid-saying will not
   * be spoken. Sent by bots on RTVI 2.0.0+.
   */
  botInterrupted: () => void;
  userStartedSpeaking: () => void;
  userStoppedSpeaking: () => void;
  userMuteStarted: () => void;
  userMuteStopped: () => void;
  /**
   * The bot's voice activity detection heard the user start speaking. It
   * reacts to any voice, sooner than `userStartedSpeaking`, which comes when
   * the bot decides the user's turn started. The bot sends it only when
   * enabled, with Pipecat's `vad_user_speaking_enabled` RTVIObserverParams.
   */
  vadUserStartedSpeaking: () => void;
  /**
   * The bot's voice activity detection heard the user stop speaking. It
   * reacts to any pause, sooner than `userStoppedSpeaking`, which comes when
   * the bot decides the user's turn ended. The bot sends it only when
   * enabled, with Pipecat's `vad_user_speaking_enabled` RTVIObserverParams.
   */
  vadUserStoppedSpeaking: () => void;
  /**
   * How loud the user's audio is, from 0 (quiet) to 1 (loud), as the bot
   * received it, sent regularly while it comes in. Unlike
   * `clientUserAudioLevel`, which the transport measures on the device, the
   * bot measures it. The bot sends it only when enabled, with Pipecat's
   * `user_audio_level_enabled` RTVIObserverParams.
   */
  serverUserAudioLevel: (data: AudioLevelData) => void;
  /**
   * How loud the bot's audio is, from 0 (quiet) to 1 (loud), as the bot
   * produced it, sent regularly while it speaks. Unlike `clientBotAudioLevel`,
   * which the transport measures on the device, the bot measures it. The bot
   * sends it only when enabled, with Pipecat's `bot_audio_level_enabled`
   * RTVIObserverParams.
   */
  serverBotAudioLevel: (data: AudioLevelData) => void;
  /**
   * @deprecated Use `userInput` to show what the user said, or `sttRawText` to
   * inspect what the STT produced.
   */
  userTranscript: (data: TranscriptData) => void;
  userInput: (data: UserInputData) => void;
  botOutput: (data: BotOutputData) => void;
  botDeliveryUpdated: (data: BotDeliveryUpdatedData) => void;
  botExpression: (data: BotExpressionData) => void;
  botTranscript: (data: BotLLMTextData) => void;
  userLlmText: (data: UserLLMTextData) => void;
  /**
   * @deprecated Use `botOutput` to show the bot's text, or `llmRawText` to
   * inspect what the LLM produced.
   */
  botLlmText: (data: BotLLMTextData) => void;
  botLlmStarted: () => void;
  botLlmStopped: () => void;
  /**
   * The marker the bot's LLM put in a response, outside the text it speaks,
   * such as one saying whether the user's turn was complete; sent once per
   * response, when it ends. It carries the response's raw text, so it's for
   * evaluating and debugging the bot, not for showing to the user. The bot
   * sends it only when enabled, with Pipecat's `bot_llm_marker_enabled`
   * RTVIObserverParams.
   */
  botLlmMarker: (data: BotLLMMarkerData) => void;
  /** @deprecated Use LLMFunctionCallInProgress instead */
  llmFunctionCall: (func: LLMFunctionCallData) => void;
  llmFunctionCallStarted: (data: LLMFunctionCallStartedData) => void;
  llmFunctionCallInProgress: (data: LLMFunctionCallInProgressData) => void;
  llmFunctionCallStopped: (data: LLMFunctionCallStoppedData) => void;
  botLlmSearchResponse: (data: BotLLMSearchResponseData) => void;
  /**
   * @deprecated Use `botOutput` to show the bot's text, or `ttsRawText` to
   * inspect what the TTS produced.
   */
  botTtsText: (data: BotTTSTextData) => void;
  botTtsStarted: () => void;
  botTtsStopped: () => void;
  sttRawText: (data: STTRawTextData) => void;
  llmRawText: (data: LLMRawTextData) => void;
  ttsRawText: (data: TTSRawTextData) => void;
  /** participant events */
  participantConnected: (participant: Participant) => void;
  participantLeft: (participant: Participant) => void;
  /** media events */
  trackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  trackStopped: (track: MediaStreamTrack, participant?: Participant) => void;
  screenTrackStarted: (track: MediaStreamTrack, p?: Participant) => void;
  screenTrackStopped: (track: MediaStreamTrack, p?: Participant) => void;
  screenShareError: (errorMessage: string) => void;
  /**
   * How loud the user's microphone audio is, from 0 (quiet) to 1 (loud), as
   * the transport measures it on the device, reported regularly.
   */
  clientUserAudioLevel: (level: number) => void;
  /**
   * How loud the bot's audio is, from 0 (quiet) to 1 (loud), as the transport
   * measures it on the device while playing it, reported regularly.
   */
  clientBotAudioLevel: (level: number) => void;
  /** @deprecated Use `clientUserAudioLevel` instead. */
  localAudioLevel: (level: number) => void;
  /** @deprecated Use `clientBotAudioLevel` instead. */
  remoteAudioLevel: (level: number, p: Participant) => void;
  /** media device events */
  availableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  availableMicsUpdated: (mics: MediaDeviceInfo[]) => void;
  availableSpeakersUpdated: (speakers: MediaDeviceInfo[]) => void;
  camUpdated: (cam: MediaDeviceInfo) => void;
  micUpdated: (mic: MediaDeviceInfo) => void;
  speakerUpdated: (speaker: MediaDeviceInfo) => void;
  deviceError: (error: DeviceError) => void;
  mediaStateUpdated: (mediaState: MediaState) => void;
  mediaSupportUpdated: (mediaSupport: MediaSupport) => void;
  unsupportedFeature: (error: UnsupportedFeatureError) => void;
}>;
export type RTVIEventHandler<E extends RTVIEvent> = E extends keyof RTVIEvents
  ? RTVIEvents[E]
  : never;
/**
 * Copyright (c) 2024, Daily.
 *
 * SPDX-License-Identifier: BSD-2-Clause
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}
declare class Logger {
  private constructor();
  static getInstance(): Logger;
  setLevel(level: LogLevel): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
export const logger: Logger;
export type ILogger = Logger;
interface QueuedRTVIMessage {
  message: RTVIMessage;
  timestamp: number;
  timeout: number;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}
export class MessageDispatcher {
  protected _sendMethod: (message: RTVIMessage) => void;
  protected _queue: QueuedRTVIMessage[];
  protected _gcInterval: ReturnType<typeof setInterval> | undefined;
  constructor(sendMethod: (message: RTVIMessage) => void);
  disconnect(): void;
  dispatch(
    message_data: unknown,
    type?: RTVIMessageType,
    timeout?: number
  ): Promise<RTVIMessage>;
  clearQueue(reason?: string): void;
  resolve(message: RTVIMessage): RTVIMessage;
  reject(message: RTVIMessage): RTVIMessage;
  protected _gc(): void;
}
type _Serializable1 =
  | string
  | number
  | boolean
  | null
  | _Serializable1[]
  | {
      [key: number | string]: _Serializable1;
    };
export interface APIRequest {
  endpoint: string | URL | globalThis.Request;
  headers?: Headers;
  requestData?: _Serializable1;
  timeout?: number;
}
/**
 * @deprecated Use APIRequest instead
 */
export type ConnectionEndpoint = APIRequest;
export function isAPIRequest(value: unknown): boolean;
export function makeRequest(
  cxnOpts: APIRequest,
  abortController?: AbortController
): Promise<unknown>;
export type Tracks = {
  local: {
    audio?: MediaStreamTrack;
    video?: MediaStreamTrack;
    screenAudio?: MediaStreamTrack;
    screenVideo?: MediaStreamTrack;
  };
  bot?: {
    audio?: MediaStreamTrack;
    screenAudio?: undefined;
    screenVideo?: undefined;
    video?: MediaStreamTrack;
  };
};
export type TransportConnectionParams = unknown;
export abstract class Transport {
  protected _options: PipecatClientOptions;
  protected _onMessage: (ev: RTVIMessage) => void;
  protected _callbacks: RTVIEventCallbacks;
  protected _abortController: AbortController | undefined;
  protected _state: TransportState;
  protected _startBotParams: APIRequest | undefined;
  protected _startBotResponse: unknown;
  /**
   * Maximum allowed size in bytes for a single signaling/message payload.
   *
   * The default is 64 KiB (`64 * 1024`), which is chosen to stay well within
   * typical WebSocket, proxy, and intermediary limits and to discourage
   * transports from sending very large payloads in a single message.
   *
   * Transport implementations may override this value in subclasses or
   * constructors if their underlying transport has stricter or more relaxed
   * limits, as long as they continue to honor this field when enforcing
   * message size constraints.
   */
  protected _maxMessageSize: number;
  constructor();
  /** called from PipecatClient constructor to wire up callbacks */
  abstract initialize(
    options: PipecatClientOptions,
    messageHandler: (ev: RTVIMessage) => void
  ): void;
  /**
   * This method is intended to initialize cam/mic devices. It is wrapped
   * by PipecatClient.initDevices and should not be called directly. It is also
   * called as part of PipecatClient.connect if it has not already called.
   */
  abstract initDevices(): Promise<void>;
  /**
   * Establishes a connection with the remote server. This is the main entry
   * point for the transport to start sending and receiving media and messages.
   * This is called from PipecatClient.connect() and should not be called directly.
   * @param connectParams - This type will ultimately be defned by the transport
   * implementation. It is used to pass connection parameters to the transport.
   */
  connect(connectParams?: TransportConnectionParams): Promise<void>;
  /**
   * Allow the transports to determine how the bot was started.
   */
  get startBotParams(): APIRequest | undefined;
  /**
   * Set the parameters used to start the bot.
   * @param startBotParams
   */
  set startBotParams(startBotParams: APIRequest);
  /**
   * The raw response from the start-bot endpoint, stored alongside
   * startBotParams by PipecatClient.startBot() and cleared on disconnect.
   * Consumers parse what they need from it lazily (e.g. the advertised
   * fileUploadUrl); its shape is backend-specific and not part of the RTVI
   * contract.
   */
  get startBotResponse(): unknown;
  set startBotResponse(response: unknown);
  abstract _validateConnectionParams(connectParams?: unknown): unknown;
  abstract _connect(connectParams?: TransportConnectionParams): Promise<void>;
  /**
   * Disconnects the transport from the remote server. This is called from
   * PipecatClient.disconnect() and should not be called directly.
   */
  disconnect(): Promise<void>;
  abstract _disconnect(): Promise<void>;
  abstract sendReadyMessage(): void;
  abstract get state(): TransportState;
  abstract set state(state: TransportState);
  abstract getAllMics(): Promise<MediaDeviceInfo[]>;
  abstract getAllCams(): Promise<MediaDeviceInfo[]>;
  abstract getAllSpeakers(): Promise<MediaDeviceInfo[]>;
  abstract updateMic(micId: string): void;
  abstract updateCam(camId: string): void;
  abstract updateSpeaker(speakerId: string): void;
  abstract get selectedMic(): MediaDeviceInfo | Record<string, never>;
  abstract get selectedCam(): MediaDeviceInfo | Record<string, never>;
  abstract get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;
  abstract enableMic(enable: boolean): void;
  abstract enableCam(enable: boolean): void;
  abstract enableScreenShare(enable: boolean): void;
  abstract get isCamEnabled(): boolean;
  abstract get isMicEnabled(): boolean;
  abstract get isSharingScreen(): boolean;
  abstract sendMessage(message: RTVIMessage): void;
  /**
   * Maximum size, in bytes, of a single message that this transport will attempt
   * to send. Callers should ensure that any outbound {@link RTVIMessage} payloads
   * do not exceed this limit to avoid transport or server errors.
   */
  get maxMessageSize(): number;
  /**
   * The media this transport, in this environment, can carry. Known before
   * connecting. Transports override this; the default rules nothing out.
   */
  get mediaSupport(): MediaSupport;
  abstract tracks(): Tracks;
}
export class TransportWrapper {
  constructor(transport: Transport);
  get proxy(): Transport;
}
interface JSAboutClientData extends AboutClientData {
  platform_details: {
    browser?: string;
    browser_version?: string;
    platform_type?: string;
    engine?: string;
    device_memory?: number;
    language?: string;
    connection?: {
      effectiveType?: string;
      downlink?: number;
    };
  };
}
export function learnAboutClient(): JSAboutClientData;
export function messageSizeWithinLimit(
  message: unknown,
  maxSize: number
): boolean;
export type FunctionCallParams = {
  functionName: string;
  arguments: Record<string, unknown>;
};
export type FunctionCallCallback = (
  fn: FunctionCallParams
) => Promise<LLMFunctionCallResult | void>;
export type RTVIEventCallbacks = Partial<{
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (message: RTVIMessage) => void;
  onTransportStateChanged: (state: TransportState) => void;
  onBotStarted: (botResponse: unknown) => void;
  onBotConnected: (participant: Participant) => void;
  onBotReady: (botReadyData: BotReadyData) => void;
  onBotDisconnected: (participant: Participant) => void;
  onMetrics: (data: PipecatMetricsData) => void;
  onServerMessage: (data: any) => void;
  onMessageError: (message: RTVIMessage) => void;
  /**
   * A line of the bot's log, for debugging. The bot sends it only when
   * enabled, with Pipecat's system_logs_enabled RTVIObserverParams.
   */
  onSystemLog: (data: SystemLogData) => void;
  onFlowNodeEntered: (data: FlowNodeEnteredData) => void;
  onParticipantJoined: (participant: Participant) => void;
  onParticipantLeft: (participant: Participant) => void;
  onAvailableCamsUpdated: (cams: MediaDeviceInfo[]) => void;
  onAvailableMicsUpdated: (mics: MediaDeviceInfo[]) => void;
  onAvailableSpeakersUpdated: (speakers: MediaDeviceInfo[]) => void;
  onCamUpdated: (cam: MediaDeviceInfo) => void;
  onMicUpdated: (mic: MediaDeviceInfo) => void;
  onSpeakerUpdated: (speaker: MediaDeviceInfo) => void;
  onDeviceError: (error: DeviceError) => void;
  onMediaStateChanged: (mediaState: MediaState) => void;
  onMediaSupportChanged: (mediaSupport: MediaSupport) => void;
  onTrackStarted: (track: MediaStreamTrack, participant?: Participant) => void;
  onTrackStopped: (track: MediaStreamTrack, participant?: Participant) => void;
  onScreenTrackStarted: (
    track: MediaStreamTrack,
    participant?: Participant
  ) => void;
  onScreenTrackStopped: (
    track: MediaStreamTrack,
    participant?: Participant
  ) => void;
  onScreenShareError: (errorMessage: string) => void;
  onUnsupportedFeature: (error: UnsupportedFeatureError) => void;
  /**
   * How loud the user's microphone audio is, from 0 (quiet) to 1 (loud), as
   * the transport measures it on the device, reported regularly.
   */
  onClientUserAudioLevel: (level: number) => void;
  /**
   * How loud the bot's audio is, from 0 (quiet) to 1 (loud), as the transport
   * measures it on the device while playing it, reported regularly.
   */
  onClientBotAudioLevel: (level: number) => void;
  /** @deprecated Use onClientUserAudioLevel instead. */
  onLocalAudioLevel: (level: number) => void;
  /** @deprecated Use onClientBotAudioLevel instead. */
  onRemoteAudioLevel: (level: number, participant: Participant) => void;
  onUserStartedSpeaking: () => void;
  onUserStoppedSpeaking: () => void;
  onBotStartedSpeaking: () => void;
  onBotStoppedSpeaking: () => void;
  /**
   * The bot's in-flight output was cut off, whether by the user speaking or
   * by text sent with `run_immediately`. Whatever it was mid-saying will not
   * be spoken. Sent by bots on RTVI 2.0.0+.
   */
  onBotInterrupted: () => void;
  onUserMuteStarted: () => void;
  onUserMuteStopped: () => void;
  /**
   * The bot's voice activity detection heard the user start speaking. It
   * reacts to any voice, sooner than onUserStartedSpeaking, which comes when
   * the bot decides the user's turn started. The bot sends it only when
   * enabled, with Pipecat's vad_user_speaking_enabled RTVIObserverParams.
   */
  onVadUserStartedSpeaking: () => void;
  /**
   * The bot's voice activity detection heard the user stop speaking. It
   * reacts to any pause, sooner than onUserStoppedSpeaking, which comes when
   * the bot decides the user's turn ended. The bot sends it only when
   * enabled, with Pipecat's vad_user_speaking_enabled RTVIObserverParams.
   */
  onVadUserStoppedSpeaking: () => void;
  /**
   * How loud the user's audio is, from 0 (quiet) to 1 (loud), as the bot
   * received it, sent regularly while it comes in. Unlike
   * onClientUserAudioLevel, which the transport measures on the device, the
   * bot measures it. The bot sends it only when enabled, with Pipecat's
   * user_audio_level_enabled RTVIObserverParams.
   */
  onServerUserAudioLevel: (data: AudioLevelData) => void;
  /**
   * How loud the bot's audio is, from 0 (quiet) to 1 (loud), as the bot
   * produced it, sent regularly while it speaks. Unlike
   * onClientBotAudioLevel, which the transport measures on the device, the
   * bot measures it. The bot sends it only when enabled, with Pipecat's
   * bot_audio_level_enabled RTVIObserverParams.
   */
  onServerBotAudioLevel: (data: AudioLevelData) => void;
  /**
   * @deprecated Use onUserInput to show what the user said, or onSttRawText to
   * inspect what the STT produced
   */
  onUserTranscript: (data: TranscriptData) => void;
  onUserInput: (data: UserInputData) => void;
  onUserLlmText: (data: UserLLMTextData) => void;
  onBotOutput: (data: BotOutputData) => void;
  /**
   * The bot's delivery changed, in expressive conversation (RTVI 2.3.0+).
   * Derived from `onBotOutput`: called only when it changes, and with a null
   * delivery once the bot stops speaking.
   */
  onBotDeliveryUpdated: (data: BotDeliveryUpdatedData) => void;
  /**
   * The bot performed a sound, such as a laugh, or a pause, in expressive
   * conversation (RTVI 2.3.0+). Derived from `onBotOutput`.
   */
  onBotExpression: (data: BotExpressionData) => void;
  /** @deprecated Use onBotOutput instead */
  onBotTranscript: (data: BotLLMTextData) => void;
  /**
   * @deprecated Use onBotOutput to show the bot's text, or onLlmRawText to
   * inspect what the LLM produced
   */
  onBotLlmText: (data: BotLLMTextData) => void;
  onBotLlmStarted: () => void;
  onBotLlmStopped: () => void;
  /**
   * The marker the bot's LLM put in a response, outside the text it speaks,
   * such as one saying whether the user's turn was complete; sent once per
   * response, when it ends. It carries the response's raw text, so it's for
   * evaluating and debugging the bot, not for showing to the user. The bot
   * sends it only when enabled, with Pipecat's bot_llm_marker_enabled
   * RTVIObserverParams.
   */
  onBotLlmMarker: (data: BotLLMMarkerData) => void;
  /**
   * @deprecated Use onBotOutput to show the bot's text, or onTtsRawText to
   * inspect what the TTS produced
   */
  onBotTtsText: (data: BotTTSTextData) => void;
  onBotTtsStarted: () => void;
  onBotTtsStopped: () => void;
  onSttRawText: (data: STTRawTextData) => void;
  onLlmRawText: (data: LLMRawTextData) => void;
  onTtsRawText: (data: TTSRawTextData) => void;
  onLLMFunctionCallStarted: (data: LLMFunctionCallStartedData) => void;
  onLLMFunctionCallInProgress: (data: LLMFunctionCallInProgressData) => void;
  onLLMFunctionCallStopped: (data: LLMFunctionCallStoppedData) => void;
  onBotLlmSearchResponse: (data: BotLLMSearchResponseData) => void;
  /** @deprecated Use onLLMFunctionCallInProgress instead */
  onLLMFunctionCall: (data: LLMFunctionCallData) => void;
}>;
export interface PipecatClientOptions {
  /**
   * Transport class for media streaming
   */
  transport: Transport;
  /**
   * Optional callback methods for RTVI events
   */
  callbacks?: RTVIEventCallbacks;
  /**
   * Enable user mic input
   *
   * Default to true
   */
  enableMic?: boolean;
  /**
   * Enable user cam input
   *
   * Default to false
   */
  enableCam?: boolean;
  /**
   * Enable screen sharing
   *
   * Default to false
   */
  enableScreenShare?: boolean;
  /**
   * Disconnect when the bot disconnects.
   *
   * Default to true
   */
  disconnectOnBotDisconnect?: boolean;
  /**
   * The endpoint to POST file uploads to when a file passed to sendFile()
   * is too large to send inline. A fileUploadUrl advertised by the
   * start-bot response takes precedence over this, since the backend may
   * mint a session-scoped route per call to /start. Relative URLs are
   * resolved against the startBot endpoint.
   */
  fileUploadEndpoint?: string | URL;
}
declare const RTVIEventEmitter_base: new () => TypedEmitter<RTVIEvents>;
declare abstract class RTVIEventEmitter extends RTVIEventEmitter_base {}
export class PipecatClient extends RTVIEventEmitter {
  protected _options: PipecatClientOptions;
  protected _transport: Transport;
  protected _transportWrapper: TransportWrapper;
  protected _disconnectOnBotDisconnect: boolean;
  protected _messageDispatcher: MessageDispatcher;
  protected _functionCallCallbacks: Record<string, FunctionCallCallback>;
  protected _abortController: AbortController | undefined;
  constructor(options: PipecatClientOptions);
  setLogLevel(level: LogLevel): void;
  /**
   * Initialize local media devices.
   *
   * Drives MediaState transitions: both mic and cam move to 'initializing' on
   * entry. On success, each device moves to 'granted' only if the transport
   * reports it as acquired (via onMicUpdated / onCamUpdated with a real
   * deviceId); otherwise that device falls back to 'uninitialized'. On
   * failure the in-flight DeviceError (if any) classifies the affected
   * device(s) per-device; anything still at 'initializing' falls back to
   * 'unknown'. The original error is always re-thrown.
   *
   * Calling this again after a failure is the recovery path — a second call
   * re-enters 'initializing' and reclassifies. There is no separate
   * retryDevices() method.
   */
  initDevices(): Promise<void>;
  /**
   * startBot() is a method that initiates the bot by posting to a specified endpoint
   * that optionally returns connection parameters for establishing a transport session.
   * @param startBotParams
   * @returns Promise that resolves to TransportConnectionParams or unknown
   */
  startBot(startBotParams: APIRequest): Promise<unknown>;
  /**
   * The `connect` function establishes a transport session and awaits a
   * bot-ready signal, handling various connection states and errors.
   * @param {TransportConnectionParams} [connectParams] -
   * The `connectParams` parameter in the `connect` method should be of type
   * `TransportConnectionParams`. This parameter is passed to the transport
   * for establishing a transport session.
   * NOTE: `connectParams` as type `ConnectionEndpoint` IS NOW DEPRECATED. If you
   * want to authenticate and connect to a bot in one step, use
   * `startBotAndConnect()` instead.
   * @returns The `connect` method returns a Promise that resolves to an unknown value.
   */
  connect(
    connectParams?: TransportConnectionParams | ConnectionEndpoint
  ): Promise<BotReadyData>;
  startBotAndConnect(startBotParams: APIRequest): Promise<BotReadyData>;
  /**
   * Disconnect the voice client from the transport
   * Reset / reinitialize transport and abort any pending requests
   */
  disconnect(): Promise<void>;
  /**
   * Get the current state of the transport
   */
  get connected(): boolean;
  get transport(): Transport;
  get state(): TransportState;
  /**
   * Per-device device state (mic, cam). Independent of transport state.
   *
   * Updated by initDevices() and DeviceError events. Returns a snapshot — to
   * track changes, subscribe to RTVIEvent.MediaStateUpdated or pass an
   * onMediaStateChanged callback in the client constructor.
   */
  get mediaState(): MediaState;
  /**
   * Whether initDevices() still has work to do. Returns true if any device
   * the caller opted into (enableMic / enableCam) is still 'uninitialized'.
   * Devices the caller opted out of are not considered — they stay
   * 'uninitialized' by design and must not gate the implicit init.
   *
   * Used internally by connect() / startBot() to decide whether to drive an
   * implicit initDevices(); exposed publicly so consumers (e.g. step 3's
   * useMediaState hook) can branch on the same logic.
   */
  needsInit(): boolean;
  get version(): string;
  /**
   * What the bot does in this session, from its `bot-ready` message.
   *
   * Undefined before `bot-ready`, after disconnecting, and for bots that don't
   * send capabilities (RTVI protocol older than 2.2.0). Within the object, a
   * missing field means the bot can't tell.
   */
  get botCapabilities(): BotCapabilities | undefined;
  /**
   * The node the bot's conversation flow, built with Pipecat Flows, is in:
   * the data of its latest `flow-node-entered` message (RTVI 2.4.0+).
   *
   * Null before the flow enters its first node, after disconnecting, and for
   * bots that don't run a flow. To track changes, subscribe to
   * RTVIEvent.FlowNodeEntered or pass an onFlowNodeEntered callback in the
   * client constructor.
   */
  get flowNode(): FlowNodeEnteredData | null;
  /**
   * Whether each kind of media can flow in this session, combining what the
   * transport supports with the bot's capabilities. Before `bot-ready` it
   * reflects only the transport. `false` rules a kind of media out; a missing
   * or `undefined` value means it isn't ruled out. Returns a snapshot — to
   * track changes, subscribe to RTVIEvent.MediaSupportUpdated or pass an
   * onMediaSupportChanged callback in the client constructor.
   */
  get mediaSupport(): MediaSupport;
  getAllMics(): Promise<MediaDeviceInfo[]>;
  getAllCams(): Promise<MediaDeviceInfo[]>;
  getAllSpeakers(): Promise<MediaDeviceInfo[]>;
  get selectedMic(): MediaDeviceInfo | Record<string, never>;
  get selectedCam(): MediaDeviceInfo | Record<string, never>;
  get selectedSpeaker(): MediaDeviceInfo | Record<string, never>;
  updateMic(micId: string): void;
  updateCam(camId: string): void;
  updateSpeaker(speakerId: string): void;
  enableMic(enable: boolean): void;
  get isMicEnabled(): boolean;
  enableCam(enable: boolean): void;
  get isCamEnabled(): boolean;
  tracks(): Tracks;
  enableScreenShare(enable: boolean): void;
  get isSharingScreen(): boolean;
  /**
   * Directly send a message to the bot via the transport.
   * Do not await a response.
   * @param msgType - a string representing the message type
   * @param data - a dictionary of data to send with the message
   */
  sendClientMessage(msgType: string, data?: unknown): void;
  /**
   * Send DTMF tones to the server as first-class RTVI `dtmf` messages.
   *
   * Accepts a single key or a sequence of keys (e.g. "123#"). Bots on
   * RTVI protocol 2.1.0+ receive the keys as a single message; 2.0.x
   * bots receive one legacy `{button}` message per key. Bots older than
   * 2.0.0 don't support DTMF at all.
   *
   * @param dtmf - The DTMF key(s) to send (0-9, *, or #).
   */
  sendDTMF(dtmf: DTMFButton | string): void;
  /**
   * Directly send a message to the bot via the transport.
   * Wait for and return the response.
   * @param msgType - a string representing the message type
   * @param data - a dictionary of data to send with the message
   * @param timeout - optional timeout in milliseconds for the response
   */
  sendClientRequest(
    msgType: string,
    data: unknown,
    timeout?: number
  ): Promise<unknown>;
  registerFunctionCallHandler(
    functionName: string,
    callback: FunctionCallCallback
  ): void;
  unregisterFunctionCallHandler(functionName: string): void;
  unregisterAllFunctionCallHandlers(): void;
  appendToContext(context: LLMContextMessage): Promise<boolean>;
  /**
   * Sends text to the bot as if the user typed it.
   *
   * @returns The id of the send-text message. A bot of RTVI 2.2.0 or later
   * with user input turned on acknowledges it with a `user-input` message of
   * type `chat` that carries this id as `msg_id`.
   */
  sendText(content: string, options?: SendTextOptions): Promise<string>;
  sendFile(
    file: RTVIFile | File,
    content: string,
    options?: SendFileOptions
  ): Promise<void>;
  /**
   * Parse the file-upload endpoint advertised by the start-bot response,
   * tolerating both the camelCase key the pipecat runner and Pipecat Cloud
   * return and a snake_case variant. Not part of the RTVI contract — a
   * backend that doesn't support uploads simply doesn't advertise one.
   */
  private get _advertisedFileUploadUrl();
  /**
   * Disconnects the bot, but keeps the session alive
   */
  disconnectBot(): void;
  protected handleMessage(ev: RTVIMessage): void;
}

//# sourceMappingURL=index.d.ts.map
