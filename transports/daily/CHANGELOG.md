# Changelog

All notable changes to **Pipecat Client React Native** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] - 2025-10-06

### Added

- Introduced `onBotStarted`/`'botStarted'` callbacks for `startBot()`, providing a way for clients to use callbacks to get the return value from the startBot REST endpoint whether calling `startBot()` directly or via `startBotAndConnect()`. As a part of this, `startBot()` will also now trigger the `error` callbacks, reporting `fatal: true` when `startBot()` fails for any reason.
- Added new `sendText()` method to support the new RTVI `send-text` event. The method takes a string, along with an optional set of options to control whether the bot should respond immediately and/or whether the bot should respond with audio (vs. text only). Note: This is a replacement for the current `appendToContext()` method and changes the default of `run_immediately` to `True`.
- Add rest_helpers and utils to client-js library
- Added support for registering a generic callback for LLM function call events to maintain consistency and flexibility.
- Added two new `RTVIError` types:
  - `BotAlreadyStartedError`: thrown when a `startBot()`, `connect()`, or `startBotAndConnect()` are called after having already started/connected.
  - `InvalidTransportParamsError`: thrown on `connect()` when the provided `TransportConnectionParams` are invalid.
- Added `unregisterFunctionCallHandler()` and `unregisterAllFunctionCallHandlers()` for, well, unregistering registered function call handlers :).

### Deprecated

- Deprecated `appendToContext()` in lieu of the new `sendText()` method. This sets a standard for future methods like `sendImage()`.

### Fixed

- Fixed issue where devices would not initialize automatically when using `startBotAndConnect()`

## [1.2.0] - 2025-08-13

- Improved flexibility and clarity around `connect()`:

  - Renamed `ConnectionEndpoint` to `APIRequest` for clarity.
  - Deprecated use of `connect()` with a `ConnectionEndpoint` params type in favor of separating out the authorization step from the connection step. Uses of `connect()` with a `ConnectionEndpoint` should be updated to call `startBotAndConnect()` instead. See below. `connect()` now performs only the portion of the logic for connecting the transport. If called with a `ConnectionEndpoint`, it will call `startBotAndConnect()` under the hood.
  - Introduced `startBot()` for performing just the endpoint POST for kicking off a bot process and optionally returning connection parameters required by the transport.
  - Introduced `startBotAndConnect()` which takes an `APIRequest` and calls both `startBot()` and `connect()`, passing any data returned from the `startBot()` endpoint to `connect()` as transport parameters.

- RTVI 1.0 Protocol Updates:
  - client-ready/bot-ready messages now both include a version and about section
  - action-related messages have been removed (deprecated) in lieu of client-server messages and some built-in types
  - service configuration message have been removed (security concerns. should be replaced with custom client-server messages)
  - new client-message and server-response messages for custom messaging
  - new append-to-context message
  - All RTVI base types have moved to the new `rtvi` folder
- RTVIClient is now PipecatClient w/ changes to support the above RTVI Protocol updates
  - The constructor no longer takes `params` with pipeline configuration information or endpoint configuration
  - `connect()` now takes a set of parameters defined and needed by the transport in use. Or, alternatively, it takes an endpoint configuration to obtain the transport params.
  - REMOVED:
    - All actions-related methods and types: `action()`, `describeActions()`, `onActionsAvailable`, etc.
    - All configuration-related methods and types: `getConfig()`, `updateConfig()`, `describeConfig()`, `onConfig`, `onConfigDescribe`, etc.
    - All helper-related methods, types and files: `RTVIClientHelper`, `registerHelper`, `LLMHelper`, etc.
    - `transportExpiry()`
  - NEW:
    - built-in function call handling: `registerFunctionCallHandler()`
    - built-in ability to append to llm context: `appendToContext()`
    - ability to send a message and wait for a response: `sendClientRequest()`
    - added rtvi version and an about section to `client-ready` with information about the client platform, browser, etc.
    - `UnsupportedFeatureError`: A new error transports can throw for features they have not implemented or cannot support.
  - CHANGED:
    - sending a client message (send and forget style): `sendMessage()` -> `sendClientMessage()`
  - Added warning log on `bot-ready` if the server version < 1.0.0, indicating that rtvi communication problems are likely

## [0.3.5] - 2025-05-08

### Added

- Updated to the latest version of `@pipecat-ai/client-js` (0.3.5).
  - See the recent improvements [here](https://github.com/pipecat-ai/pipecat-client-web/blob/main/CHANGELOG.md#035---2025-03-20).

### Fixed

- Fixed an issue where joining would fail if the `token` was `null`.

## [0.3.2] - 2025-03-14

### Added

- Screen media sharing methods implemented:
  - Added `startScreenShare` and `stopScreenShare` methods to `RTVIClient` and `Transport`.
  - Added `isSharingScreen` getter to `RTVIClient` and `Transport`.

### Fixed

- Fixed issue that was not triggering `onSpeakerUpdated`.

### Changes

- `baseUrl` and `endpoints` are now optional parameters in the `RTVIClient` constructor (`RTVIClientParams`), allowing developers to connect directly to a transport without requiring a handshake auth bundle.
  - Note: Most transport services require an API key for secure operation, and setting these keys dangerously on the client is not recommended for production. This change intends to simplify testing and local development where running a server-side connect method can be cumbersome.
