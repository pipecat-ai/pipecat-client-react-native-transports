# Changelog

All notable changes to **Pipecat Client React Native Small WebRTC** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - Unreleased

### Added

- Implemented support for the new `botOutput` RTVI message. This message is now the preferred
  way of communicating a holistic view of what the bot "says". It includes a `spoken` field, indicating whether the text has been spoken along with a field, `aggregated_by`, to indicate what
  the text represents. By default, with TTS services that support word-by-word output, you can
  expect two `agggregated_by` values for `botOutput` events: `"sentence"` and `"word"`. All
  sentence events are guaranteed to be in order, while word events come in at the time of being
  spoken. This allows for building karaoke-like UIs where the sentence is displayed and each word
  is highlighted as it's spoken.  This event also provides continuity across bot output even when
  the TTS is skipped or does not exist. And if your pipeline takes advantage of customizing how
  the LLM text is aggregated, you can handle custom `aggregated_by` fields, like `"code"` or
  `"address"` or `"url"`, allowing the server to do the parsing.
- Saved the parameters used to start the bot, so transports can access them.
- Added `offerUrlTemplate` inside the `SmallWebRTCTransportConstructorOptions`, allowing to define a template which will be used
  during the transformation between startBot and connect, to create the offer url pointing to a custom endpoint other than `/api/offer`.
  ``` javascript
    transport: new SmallWebRTCTransport({
      offerUrlTemplate: `${this.baseUrl}/sessions/:sessionId/api/offer`
    }),
  ```
-

### Deprecated

- Deprecated the `botTranscript` event and associated `onBotTranscript` callbacks in lieu of
  the more thorough and accurate `botOutput` event.

### Fixed

- Fixed an issue in `startBotAndConnect` where `requestData` was not carried over when invoking the `connect` endpoint.

## [1.4.1]

- Adding support for the `onLocalAudioLevel` callback.
- Adding support for the `onRemoteAudioLevel` callback.

## [1.4.0] - 2025-11-07

- `SmallWebRTCTransport` for React Native, matching all the features provided by Pipecat Client 1.4.0.
