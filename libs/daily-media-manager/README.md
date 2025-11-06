<h1><div align="center">
 <img alt="pipecat client react native" width="500px" height="auto" src="https://raw.githubusercontent.com/pipecat-ai/pipecat-client-react-native-daily-transport/main/pipecat-react-native.png">
</div></h1>

[![Docs](https://img.shields.io/badge/documentation-blue)](https://docs.pipecat.ai/client/introduction)
![NPM Version](https://img.shields.io/npm/v/@pipecat-ai/react-native-daily-transport)

A comprehensive media management layer built on Daily’s React Native SDK.

While [SmallWebRTCTransport](/transports/smallwebrtc/README.md) enables lightweight peer-to-peer communication without relying on Daily’s infrastructure,
the Daily Media Manager leverages Daily’s mature SDK to deliver enterprise-grade device management and media handling.

### Key Features

- **Complete Device Management**: Full control over cameras, microphones, and speakers with automatic device enumeration and selection
- **Device Error Handling**: Comprehensive error handling for device permissions, constraints, and availability issues
- **Media Control**: Enable/disable microphone, camera, and screen sharing with simple API calls
- **Track Management**: Access to WebRTC media tracks for advanced media processing
- **Real-time Updates**: Automatic callbacks for device changes and track events

## Installation

Install `@pipecat-ai/react-native-daily-media-manager` along with its peer dependencies:

```bash
npm i @pipecat-ai/react-native-daily-media-manager
npm i @daily-co/react-native-daily-js@^0.82.0
npm i @daily-co/react-native-webrtc@^124.0.6-daily.1
npm i @react-native-async-storage/async-storage@^1.24.0
npm i react-native-background-timer@^2.4.1
npm i react-native-get-random-values@^1.11.0
```

If you are using Expo, you will also need to add the following dependencies:

```bash
npm i @daily-co/config-plugin-rn-daily-js@0.0.11
```

All the details about Expo can be found [here](https://github.com/daily-co/rn-daily-js-expo-config-plugin).

A full demo can be found [here](https://github.com/pipecat-ai/pipecat-examples/tree/main/p2p-webrtc/video-transform/client/react-native)

## Quick Start

Instantiate the `DailyMediaManager` instance, to use it together with the `SmallWebRTCTransport`:

```typescript
const options: SmallWebRTCTransportConstructorOptions = {
  mediaManager: new DailyMediaManager(),
};
const transport = new RNSmallWebRTCTransport(options);
```

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
