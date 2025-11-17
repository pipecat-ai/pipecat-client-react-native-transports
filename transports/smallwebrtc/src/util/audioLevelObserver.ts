import { logger, Participant } from '@pipecat-ai/client-js';
import { RTCPeerConnection } from '@daily-co/react-native-webrtc';
import { MediaManager } from '@pipecat-ai/react-native-small-webrtc-transport';

const DEFAULT_AUDIO_OBSERVER_INTERVAL_MS = 500;
export class AudioLevelObserver {
  private pc: RTCPeerConnection | null = null;
  private mediaManager: MediaManager;
  private _onLocalAudioLevel?: (level: number) => void;
  private _onRemoteAudioLevel?: (
    level: number,
    participant: Participant
  ) => void;

  private failsCount: number;
  private captureAudioLevelsInterval: ReturnType<typeof setInterval> | null =
    null;
  private botParticipant: Participant;

  constructor(mediaManager: MediaManager) {
    this.mediaManager = mediaManager;
    this.captureAudioLevelsInterval = null;
    this.failsCount = 0;
    this._onLocalAudioLevel = undefined;
    this._onRemoteAudioLevel = undefined;
    this.botParticipant = {
      id: 'bot',
      local: false,
      name: 'Bot',
    };
  }

  start(pc: RTCPeerConnection, interval?: number) {
    if (this.pc) {
      throw new Error(
        'The audio level observer has already been started. Please call stop() before starting again.'
      );
    }
    logger.info('Starting AudioLevelObserver.');
    this.pc = pc;
    this.startCapturingAudioLevels(
      interval || DEFAULT_AUDIO_OBSERVER_INTERVAL_MS
    );
  }

  stop() {
    if (!this.pc) {
      // No op
      return;
    }
    logger.info('Stopping AudioLevelObserver.');
    this.pc = null;
    this.failsCount = 0;
    if (this.captureAudioLevelsInterval) {
      clearInterval(this.captureAudioLevelsInterval);
      this.captureAudioLevelsInterval = null;
    }
  }

  set onLocalAudioLevel(value: ((level: number) => void) | undefined) {
    this._onLocalAudioLevel = value;
  }

  set onRemoteAudioLevel(
    value: ((level: number, participant: Participant) => void) | undefined
  ) {
    this._onRemoteAudioLevel = value;
  }

  private startCapturingAudioLevels(interval: number) {
    this.captureAudioLevelsInterval = setInterval(async () => {
      try {
        const localParticipantAudioLevel =
          await this.getLocalParticipantAudioLevel();
        this._onLocalAudioLevel?.(localParticipantAudioLevel);
        const remoteParticipantAudioLevel =
          await this.getRemoteParticipantAudioLevel();
        this._onRemoteAudioLevel?.(
          remoteParticipantAudioLevel,
          this.botParticipant
        );
      } catch (e) {
        logger.warn('Failed to retrieve remote audio level', { error: e });
        this.failsCount++;
        if (this.failsCount >= 3) {
          logger.warn(
            'Stopping audio level observer due to the previous errors.'
          );
          this.stop();
        }
      }
    }, interval);
  }

  private async getLocalParticipantAudioLevel() {
    if (!this.pc || !this.mediaManager.isMicEnabled) {
      // silence, not sending audio
      return 0;
    }
    const transceivers = this.pc.getTransceivers();
    if (!transceivers || transceivers.length < 1) {
      return 0;
    }
    // The audio transceiver is always the first one
    // check inside the transport addInitialTransceivers
    const stats = await transceivers[0]!.sender.getStats();
    let audioSourceStats = null;
    for (const report of stats.values()) {
      if (report.type === 'media-source' && report.kind === 'audio') {
        audioSourceStats = report;
        break;
      }
    }
    return audioSourceStats?.audioLevel;
  }

  private async getRemoteParticipantAudioLevel() {
    if (!this.pc) {
      // silence, not receiving audio
      return 0;
    }
    const transceivers = this.pc.getTransceivers();
    if (!transceivers || transceivers.length < 1) {
      return 0;
    }
    // The audio transceiver is always the first one
    // check inside the transport addInitialTransceivers
    const stats = await transceivers[0]!.receiver.getStats();
    let inboundAudioStats = null;
    for (const report of stats.values()) {
      if (report.type === 'inbound-rtp' && report.kind === 'audio') {
        inboundAudioStats = report;
      }
    }
    return inboundAudioStats?.audioLevel;
  }
}
