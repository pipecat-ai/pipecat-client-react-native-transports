import {
  PipecatClientOptions,
  RTVIEventCallbacks,
  Tracks,
} from '@pipecat-ai/client-js';
import { MediaDeviceInfo } from '@daily-co/react-native-webrtc';

export abstract class MediaManager {
  protected _options?: PipecatClientOptions;
  protected _callbacks: RTVIEventCallbacks = {};

  protected _micEnabled: boolean;
  protected _camEnabled: boolean;

  protected _supportsScreenShare: boolean;

  constructor() {
    this._micEnabled = true;
    this._camEnabled = false;
    this._supportsScreenShare = false;
  }

  setClientOptions(options: PipecatClientOptions, override: boolean = false) {
    if (this._options && !override) return;
    this._options = options;
    this._callbacks = options.callbacks ?? {};
    this._micEnabled = options.enableMic ?? true;
    this._camEnabled = options.enableCam ?? false;
  }

  abstract initialize(): Promise<void>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;

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

  abstract tracks(): Tracks;

  get supportsScreenShare(): boolean {
    return this._supportsScreenShare;
  }
}
