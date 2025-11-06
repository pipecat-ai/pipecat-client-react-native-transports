import {
  MediaManager,
  TrackEvent,
} from '@pipecat-ai/react-native-small-webrtc-transport';

import Daily, {
  DailyCall,
  DailyCameraErrorObject,
  DailyCameraErrorType,
  DailyEventObjectAvailableDevicesUpdated,
  DailyEventObjectCameraError,
  DailyEventObjectLocalAudioLevel,
  DailyEventObjectRemoteParticipantsAudioLevel,
  DailyEventObjectTrack,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/react-native-daily-js';

import {
  DeviceArray,
  DeviceError,
  Participant,
  Tracks,
} from '@pipecat-ai/client-js';
import { MediaDeviceInfo } from '@daily-co/react-native-webrtc';

export class DailyMediaManager extends MediaManager {
  private _daily: DailyCall;

  private _initialized: boolean;
  private _connected: boolean;
  private _connectResolve: ((value: void | PromiseLike<void>) => void) | null;

  private _selectedCam: MediaDeviceInfo | Record<string, never> = {};
  private _selectedMic: MediaDeviceInfo | Record<string, never> = {};
  private _selectedSpeaker: MediaDeviceInfo | Record<string, never> = {};

  constructor(
    onTrackStartedCallback?: (event: TrackEvent) => void,
    onTrackStoppedCallback?: (event: TrackEvent) => void
  ) {
    super();
    this._initialized = false;
    this._connected = false;
    this._connectResolve = null;
    this._onTrackStartedCallback = onTrackStartedCallback;
    this._onTrackStoppedCallback = onTrackStoppedCallback;

    this._supportsScreenShare = true;

    this._daily = Daily.getCallInstance() ?? Daily.createCallObject();

    this._daily.on('track-started', this.handleTrackStarted.bind(this));
    this._daily.on('track-stopped', this.handleTrackStopped.bind(this));
    this._daily.on(
      'available-devices-updated',
      this._handleAvailableDevicesUpdated.bind(this)
    );
    this._daily.on(
      // TODO, we need to add DailyEventObjectSelectedDevicesUpdated to types overrides inside react-ntive-daily-js
      // @ts-ignore
      'selected-devices-updated',
      this._handleSelectedDevicesUpdated.bind(this)
    );
    this._daily.on('camera-error', this.handleDeviceError.bind(this));
    this._daily.on('local-audio-level', this._handleLocalAudioLevel.bind(this));
    this._daily.on(
      'remote-participants-audio-level',
      this._handleRemoteAudioLevel.bind(this)
    );
  }

  async initialize(): Promise<void> {
    if (this._initialized) {
      console.warn('DailyMediaManager already initialized');
      return;
    }
    await this._daily.startCamera({
      startVideoOff: !this._camEnabled,
      startAudioOff: !this._micEnabled,
    });
    const { devices } = await this._daily.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    const mics = devices.filter((d) => d.kind === 'audio');
    const speakers = devices.filter((d) => d.kind === 'audio');
    this._callbacks.onAvailableCamsUpdated?.(cams);
    this._callbacks.onAvailableMicsUpdated?.(mics);
    this._callbacks.onAvailableSpeakersUpdated?.(speakers);

    let inputDevices = await this._daily.getInputDevices();
    this._selectedCam = inputDevices.camera;
    this._callbacks.onCamUpdated?.(this._selectedCam as MediaDeviceInfo);
    this._selectedMic = inputDevices.mic;
    this._callbacks.onMicUpdated?.(this._selectedMic as MediaDeviceInfo);

    // TODO: keeping it disabled for now
    // It is not possible to use the audio observers provided by Daily
    // Instantiate audio observers
    /*if (!this._daily.isLocalAudioLevelObserverRunning())
      await this._daily.startLocalAudioLevelObserver(100);
    if (!this._daily.isRemoteParticipantsAudioLevelObserverRunning())
      await this._daily.startRemoteParticipantsAudioLevelObserver(100);*/

    this._initialized = true;
  }

  async connect(): Promise<void> {
    if (this._connected) {
      console.warn('DailyMediaManager already connected');
      return;
    }
    this._connected = true;
    if (!this._initialized) {
      return new Promise((resolve) => {
        (async () => {
          this._connectResolve = resolve;
          await this.initialize();
        })();
      });
    }
  }

  async disconnect(): Promise<void> {
    this._daily.stopLocalAudioLevelObserver();
    this._daily.stopRemoteParticipantsAudioLevelObserver();
    await this._daily.leave();
    this._initialized = false;
    this._connected = false;
  }

  async getAllMics(): Promise<MediaDeviceInfo[]> {
    let devices = (await this._daily.enumerateDevices()).devices;
    return devices.filter((device) => device.kind === 'audio');
  }
  async getAllCams(): Promise<MediaDeviceInfo[]> {
    let devices = (await this._daily.enumerateDevices()).devices;
    return devices.filter((device) => device.kind === 'videoinput');
  }
  async getAllSpeakers(): Promise<MediaDeviceInfo[]> {
    let devices = (await this._daily.enumerateDevices()).devices;
    return devices.filter((device) => device.kind === 'audio');
  }

  updateMic(micId: string) {
    this._daily.setAudioDevice(micId).then(async () => {
      let inputDevices = await this._daily.getInputDevices();
      this._selectedMic = inputDevices.mic as MediaDeviceInfo;
    });
  }
  updateCam(camId: string) {
    this._daily.setCamera(camId).then(async () => {
      let inputDevices = await this._daily.getInputDevices();
      this._selectedCam = inputDevices.camera as MediaDeviceInfo;
    });
  }
  updateSpeaker(speakerId: string) {
    this._daily?.setAudioDevice(speakerId).then(async () => {
      const devicesInUse = await this._daily.getInputDevices();
      this._selectedSpeaker = devicesInUse?.speaker;
    });
  }

  get selectedMic(): MediaDeviceInfo | Record<string, never> {
    return this._selectedMic;
  }
  get selectedCam(): MediaDeviceInfo | Record<string, never> {
    return this._selectedCam;
  }
  get selectedSpeaker(): MediaDeviceInfo | Record<string, never> {
    return this._selectedSpeaker;
  }

  async enableMic(enable: boolean): Promise<void> {
    this._micEnabled = enable;
    if (!this._daily.participants()?.local) return;
    this._daily.setLocalAudio(enable);
  }
  enableCam(enable: boolean): void {
    this._camEnabled = enable;
    this._daily.setLocalVideo(enable);
  }
  enableScreenShare(enable: boolean): void {
    if (enable) {
      this._daily.startScreenShare();
    } else {
      this._daily.stopScreenShare();
    }
  }

  get isCamEnabled(): boolean {
    return this._daily.localVideo();
  }
  get isMicEnabled(): boolean {
    return this._daily.localAudio();
  }
  get isSharingScreen(): boolean {
    return this._daily.localScreenAudio() || this._daily.localScreenVideo();
  }

  tracks(): Tracks {
    const participants: DailyParticipantsObject = this._daily.participants();
    return {
      local: {
        audio: participants?.local?.tracks?.audio?.persistentTrack,
        screenAudio: participants?.local?.tracks?.screenAudio?.persistentTrack,
        screenVideo: participants?.local?.tracks?.screenVideo?.persistentTrack,
        video: participants?.local?.tracks?.video?.persistentTrack,
      },
    };
  }

  private _handleAvailableDevicesUpdated(
    event: DailyEventObjectAvailableDevicesUpdated
  ) {
    this._callbacks.onAvailableCamsUpdated?.(
      event.availableDevices.filter((d) => d.kind === 'videoinput')
    );
    this._callbacks.onAvailableMicsUpdated?.(
      event.availableDevices.filter((d) => d.kind === 'audio')
    );
    this._callbacks.onAvailableSpeakersUpdated?.(
      event.availableDevices.filter((d) => d.kind === 'audio')
    );
    if (this._selectedSpeaker.deviceId === 'default') {
      this.updateSpeaker('default');
    }
  }

  // TODO, we need to add DailyEventObjectSelectedDevicesUpdated to types overrides inside react-ntive-daily-js
  private _handleSelectedDevicesUpdated(
    // @ts-ignore
    event: DailyEventObjectSelectedDevicesUpdated
  ) {
    if (this._selectedCam?.deviceId !== event.devices.camera) {
      this._selectedCam = event.devices.camera;
      this._callbacks.onCamUpdated?.(event.devices.camera as MediaDeviceInfo);
    }
    if (this._selectedMic?.deviceId !== event.devices.mic) {
      this._selectedMic = event.devices.mic;
      this._callbacks.onMicUpdated?.(event.devices.mic as MediaDeviceInfo);
    }
  }

  private handleDeviceError(ev: DailyEventObjectCameraError) {
    const generateDeviceError = (
      error: DailyCameraErrorObject<DailyCameraErrorType>
    ) => {
      const devices: DeviceArray = [];
      switch (error.type) {
        case 'permissions': {
          error.blockedMedia.forEach((d) => {
            devices.push(d === 'video' ? 'cam' : 'mic');
          });
          return new DeviceError(devices, error.type, error.msg, {
            blockedBy: error.blockedBy,
          });
        }
        case 'not-found': {
          error.missingMedia.forEach((d) => {
            devices.push(d === 'video' ? 'cam' : 'mic');
          });
          return new DeviceError(devices, error.type, error.msg);
        }
        case 'constraints': {
          error.failedMedia.forEach((d) => {
            devices.push(d === 'video' ? 'cam' : 'mic');
          });
          return new DeviceError(devices, error.type, error.msg, {
            reason: error.reason,
          });
        }
        case 'cam-in-use': {
          devices.push('cam');
          return new DeviceError(devices, 'in-use', error.msg);
        }
        case 'mic-in-use': {
          devices.push('mic');
          return new DeviceError(devices, 'in-use', error.msg);
        }
        case 'cam-mic-in-use': {
          devices.push('cam');
          devices.push('mic');
          return new DeviceError(devices, 'in-use', error.msg);
        }
        case 'undefined-mediadevices':
        case 'unknown':
        default: {
          devices.push('cam');
          devices.push('mic');
          return new DeviceError(devices, error.type, error.msg);
        }
      }
    };
    this._callbacks.onDeviceError?.(generateDeviceError(ev.error));
  }

  private _handleLocalAudioLevel(ev: DailyEventObjectLocalAudioLevel) {
    this._callbacks.onLocalAudioLevel?.(ev.audioLevel);
  }

  private _handleRemoteAudioLevel(
    ev: DailyEventObjectRemoteParticipantsAudioLevel
  ) {
    const participants = this._daily.participants();

    for (const participantId in ev.participantsAudioLevel) {
      if (ev.participantsAudioLevel.hasOwnProperty(participantId)) {
        const audioLevel = ev.participantsAudioLevel[participantId];
        let participant = participants[participantId];
        if (audioLevel && participant) {
          this._callbacks.onRemoteAudioLevel?.(
            audioLevel,
            dailyParticipantToParticipant(participant)
          );
        }
      }
    }
  }

  protected async handleTrackStarted(event: DailyEventObjectTrack) {
    if (!event.participant?.local) return;
    if (event.track.kind === 'audio') {
      if (this._connectResolve) {
        this._connectResolve();
        this._connectResolve = null;
      }
    }
    this._callbacks.onTrackStarted?.(
      event.track,
      event.participant
        ? dailyParticipantToParticipant(event.participant)
        : undefined
    );
    this._onTrackStartedCallback?.(event);
  }

  protected handleTrackStopped(event: DailyEventObjectTrack) {
    if (!event.participant?.local) return;
    this._callbacks.onTrackStopped?.(
      event.track,
      event.participant
        ? dailyParticipantToParticipant(event.participant)
        : undefined
    );
    this._onTrackStoppedCallback?.(event);
  }
}

const dailyParticipantToParticipant = (p: DailyParticipant): Participant => ({
  id: p.user_id,
  local: p.local,
  name: p.user_name,
});
