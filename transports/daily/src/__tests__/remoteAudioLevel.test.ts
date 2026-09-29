const mockHandlers: Record<string, (ev: unknown) => void> = {};
const mockDaily = {
  on: jest.fn((name: string, handler: (ev: unknown) => void) => {
    mockHandlers[name] = handler;
  }),
  participants: jest.fn(),
};

jest.mock('@daily-co/react-native-daily-js', () => ({
  __esModule: true,
  default: { createCallObject: jest.fn(() => mockDaily) },
}));

import { RNDailyTransport } from '../transport';

describe('RNDailyTransport remote audio level', () => {
  const bot = { session_id: 'bot-1', user_id: 'bot-1', local: false };

  const setup = () => {
    const onRemoteAudioLevel = jest.fn();
    const transport = new RNDailyTransport();
    transport.initialize(
      { callbacks: { onRemoteAudioLevel } } as never,
      jest.fn()
    );
    mockDaily.participants.mockReturnValue({ 'bot-1': bot });
    return onRemoteAudioLevel;
  };

  it('reports a non-zero level', () => {
    const onRemoteAudioLevel = setup();
    mockHandlers['remote-participants-audio-level']!({
      participantsAudioLevel: { 'bot-1': 0.4 },
    });
    expect(onRemoteAudioLevel).toHaveBeenCalledTimes(1);
    expect(onRemoteAudioLevel.mock.calls[0][0]).toBe(0.4);
  });

  it('reports a level of zero so the client sees silence', () => {
    const onRemoteAudioLevel = setup();
    mockHandlers['remote-participants-audio-level']!({
      participantsAudioLevel: { 'bot-1': 0 },
    });
    expect(onRemoteAudioLevel).toHaveBeenCalledTimes(1);
    expect(onRemoteAudioLevel.mock.calls[0][0]).toBe(0);
  });

  it('skips participants that are no longer in the call', () => {
    const onRemoteAudioLevel = setup();
    mockHandlers['remote-participants-audio-level']!({
      participantsAudioLevel: { 'gone-1': 0.2 },
    });
    expect(onRemoteAudioLevel).not.toHaveBeenCalled();
  });
});
