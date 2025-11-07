import { logger } from '@pipecat-ai/client-js';
import { RTCPeerConnection } from '@daily-co/react-native-webrtc';
import { MediaManager } from '@pipecat-ai/react-native-small-webrtc-transport';

const DEFAULT_LOCAL_AUDIO_OBSERVER_INTERVAL_MS = 500;
export class LocalAudioLevelObserver {
  private pc: RTCPeerConnection | null = null;
  private mediaManager: MediaManager;
  private _onLocalAudioLevel?: (level: number) => void;

  private inProgress: boolean;
  private failsCount: number;
  private captureLocalAudioLevelsInterval: ReturnType<
    typeof setInterval
  > | null = null;

  constructor(pc: RTCPeerConnection, mediaManager: MediaManager) {
    this.pc = pc;
    this.mediaManager = mediaManager;
    this.inProgress = false;
    this.captureLocalAudioLevelsInterval = null;
    this.failsCount = 0;
    this._onLocalAudioLevel = undefined;
  }

  start(interval?: number) {
    if (this.inProgress) {
      throw new Error(
        'The local audio level observer has already been started. Please call stop() before starting again.'
      );
    }
    logger.info('Starting LocalAudioLevelObserver.');
    this.inProgress = true;
    this.startCapturingLocalAudioLevels(
      interval || DEFAULT_LOCAL_AUDIO_OBSERVER_INTERVAL_MS
    );
  }

  stop() {
    if (!this.inProgress) {
      // No op
      return;
    }
    logger.info('Stopping LocalAudioLevelObserver.');
    this.inProgress = false;
    this.failsCount = 0;
    if (this.captureLocalAudioLevelsInterval) {
      clearInterval(this.captureLocalAudioLevelsInterval);
      this.captureLocalAudioLevelsInterval = null;
    }
  }

  set onLocalAudioLevel(value: (level: number) => void) {
    this._onLocalAudioLevel = value;
  }

  private startCapturingLocalAudioLevels(interval: number) {
    this.captureLocalAudioLevelsInterval = setInterval(() => {
      this.getLocalParticipantAudioLevel().then(
        (localParticipantAudioLevel: number) => {
          this._onLocalAudioLevel?.(localParticipantAudioLevel);
        },
        (e) => {
          logger.warn('Failed to retrieve local audio level', { error: e });
          this.failsCount++;
          if (this.failsCount >= 3) {
            logger.warn(
              'Stopping local audio level observer due to the previous errors.'
            );
            this.stop();
          }
        }
      );
    }, interval);
  }

  private async getLocalParticipantAudioLevel() {
    if (!this.pc || !this.mediaManager.isMicEnabled) {
      // silence, not sending audio
      return 0;
    }
    const transceivers = this.pc.getTransceivers();
    if (!transceivers || transceivers.length < 2) {
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
}
