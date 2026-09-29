import { AudioLevelObserver } from '../util/audioLevelObserver';

const INTERVAL_MS = 100;

const stats = new Map([
  ['local', { type: 'media-source', kind: 'audio', audioLevel: 0.5 }],
  ['remote', { type: 'inbound-rtp', kind: 'audio', audioLevel: 0.5 }],
]);

const makePeerConnection = (
  senderGetStats: jest.Mock,
  receiverGetStats: jest.Mock
) =>
  ({
    getTransceivers: () => [
      {
        sender: { getStats: senderGetStats },
        receiver: { getStats: receiverGetStats },
      },
    ],
  }) as never;

const runTicks = async (count: number) => {
  for (let i = 0; i < count; i++) {
    jest.advanceTimersByTime(INTERVAL_MS);
    for (let j = 0; j < 5; j++) await Promise.resolve();
  }
};

describe('AudioLevelObserver', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps reporting after isolated failures separated by successes', async () => {
    // The local stats call fails on every other tick, so no two consecutive
    // ticks fail.
    let tick = 0;
    const senderGetStats = jest.fn(async () => {
      if (tick++ % 2 === 0) throw new Error('transient');
      return stats;
    });
    const receiverGetStats = jest.fn(async () => stats);

    const observer = new AudioLevelObserver({ isMicEnabled: true } as never);
    const onRemoteAudioLevel = jest.fn();
    observer.onRemoteAudioLevel = onRemoteAudioLevel;
    observer.start(
      makePeerConnection(senderGetStats, receiverGetStats),
      INTERVAL_MS
    );

    await runTicks(12);

    expect(senderGetStats).toHaveBeenCalledTimes(12);
    expect(onRemoteAudioLevel).toHaveBeenCalledTimes(6);
    observer.stop();
  });

  it('stops after three consecutive failures', async () => {
    const senderGetStats = jest.fn(async () => {
      throw new Error('broken');
    });
    const receiverGetStats = jest.fn(async () => stats);

    const observer = new AudioLevelObserver({ isMicEnabled: true } as never);
    observer.start(
      makePeerConnection(senderGetStats, receiverGetStats),
      INTERVAL_MS
    );

    await runTicks(6);

    expect(senderGetStats).toHaveBeenCalledTimes(3);
  });
});
