<h1><div align="center">
 <img alt="pipecat client react native" width="500px" height="auto" src="https://raw.githubusercontent.com/pipecat-ai/pipecat-client-react-native-transports/main/pipecat-react-native.png">
</div></h1>

[![Docs](https://img.shields.io/badge/documentation-blue)](https://docs.pipecat.ai/client/introduction)
![NPM Version](https://img.shields.io/npm/v/@pipecat-ai/react-native-daily-transport)

The Pipecat client React Native Transport library exports a `RNDailyTransport` that has the [Daily](https://www.daily.co/) transport associated.

To connect to a bot, you will need both this SDK and the [`@pipecat-client/client-js`](https://www.npmjs.com/package/@pipecat-ai/client-js) to create an `RTVIClient`.

## Minimum OS/SDK versions

This package introduces some constraints on what OS/SDK versions your project can support:

- **iOS**: Deployment target >= 13
- **Android**: `minSdkVersion` >= 24

## Installation

Install `@pipecat-ai/react-native-daily-transport` along with its peer dependencies:

```bash
npm i @pipecat-ai/react-native-daily-transport
npm i @daily-co/react-native-daily-js@^0.81.0
npm i @daily-co/react-native-webrtc@^124.0.6-daily.1
npm i @react-native-async-storage/async-storage@^1.24.0
npm i react-native-background-timer@^2.4.1
npm i react-native-get-random-values@^1.11.0
```

If you are using Expo, you will also need to add the following dependencies:

```bash
npm i @daily-co/config-plugin-rn-daily-js@0.0.10
```

All the details about Expo can be found [here](https://github.com/daily-co/rn-daily-js-expo-config-plugin).

A full demo can be found [here](https://github.com/pipecat-ai/pipecat-examples/tree/main/simple-chatbot/client/react-native)

## Quick Start

Instantiate an `RTVIClient` instance, wire up the bot's audio, and start the conversation:

```typescript
let pipecatClient = new PipecatClient({
  transport: new RNDailyTransport(),
  enableMic: true,
  enableCam: false,
  callbacks: {
    onConnected: () => {
      setInCall(true);
    },
    onDisconnected: () => {
      setInCall(false);
    },
    onTransportStateChanged: (state) => {
      console.log(`Transport state changed: ${state}`);
      setCurrentState(state);
    },
    onError: (error) => {
      console.log('Error:', JSON.stringify(error));
    },
  },
});

await client?.startBotAndConnect({
  endpoint: baseUrl + '/start',
});
```

> Note: To enable screen sharing on iOS, follow the instructions in the [Daily Framework RN Screen Share extension](https://github.com/daily-co/rn-screen-share-extension/).

## Documentation

Pipecat Client React Native implements a client instance that:

- Facilitates requests to an endpoint you create.
- Dispatches single-turn actions to a HTTP bot service when disconnected.
- Provides methods that handle the connectivity state and realtime interaction with your bot service.
- Manages media transport (such as audio and video).
- Provides callbacks and events for handling bot messages and actions.
- Optionally configures your AI services and pipeline.

Docs and API reference can be found at https://docs.pipecat.ai/client/introduction.

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, improving documentation, or adding new features, here's how you can help:

- **Found a bug?** Open an [issue](https://github.com/pipecat-ai/pipecat-client-react-native-transports/issues)
- **Have a feature idea?** Start a [discussion](https://discord.gg/pipecat)
- **Want to contribute code?** Check our [CONTRIBUTING.md](CONTRIBUTING.md) guide
- **Documentation improvements?** [Docs](https://github.com/pipecat-ai/docs) PRs are always welcome

Before submitting a pull request, please check existing issues and PRs to avoid duplicates.

We aim to review all contributions promptly and provide constructive feedback to help get your changes merged.

## Getting help

➡️ [Join our Discord](https://discord.gg/pipecat)

➡️ [Read the docs](https://docs.pipecat.ai)

➡️ [Reach us on X](https://x.com/pipecat_ai)
