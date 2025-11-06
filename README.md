# Pipecat Client React Native Transports

[![Docs](https://img.shields.io/badge/Documentation-blue)](https://docs.pipecat.ai/client/react-native/introduction)
[![Discord](https://img.shields.io/discord/1239284677165056021)](https://discord.gg/pipecat)

A mono-repo to house the various supported Transport options to be used with React Native. Currently, there are two transports: `small-webrtc-transport` and `daily-transport`.

## Documentation

Please refer to the full Pipecat client documentation [here](https://docs.pipecat.ai/client/introduction).

## Current Transports

### [SmallWebRTCTransport](/transports/smallwebrtc/README.md)

[![Docs](https://img.shields.io/badge/Documentation-blue)](https://docs.pipecat.ai/client/js/transports/small-webrtc)
[![README](https://img.shields.io/badge/README-goldenrod)](/transports/smallwebrtc/README.md)
[![Demo](https://img.shields.io/badge/Demo-forestgreen)](https://github.com/pipecat-ai/pipecat/tree/main/examples/p2p-webrtc)
![NPM Version](https://img.shields.io/npm/v/@pipecat-ai/react-native-small-webrtc-transport)

This Transport creates a peer-to-peer WebRTC connection between the client and the bot process. This Transport is the client-side counterpart to the Pipecat [SmallWebRTCTransport component](https://docs.pipecat.ai/server/services/transport/small-webrtc).

This is the simplest low-latency audio/video transport for Pipecat. This transport is recommended for local development and demos. Things to be aware of:

- This transport is a direct connection between the client and the bot process. If you need multiple clients to connect to the same bot, you will need to use a different transport.
- For production usage at scale, a distributed WebRTC network that can do edge/mesh routing, has session-level observability and metrics, and can offload recording and other auxiliary services is often useful.

Typical media flow using a SmallWebRTCTransport:

```
                                            ┌──────────────────────────────────────────────────┐
                                            │                                                  │
 ┌─────────────────────────┐                │                       Server       ┌─────────┐   │
 │                         │                │                                    │Pipecat  │   │
 │            Client       │  RTVI Messages │                                    │Pipeline │   │
 │                         │       &        │                                              │   │
 │ ┌────────────────────┐  │  WebRTC Media  │  ┌────────────────────┐    media   │ ┌─────┐ │   │
 │ │SmallWebRTCTransport│◄─┼────────────────┼─►│SmallWebRTCTransport┼────────────┼─► STT │ │   │
 │ └────────────────────┘  │                │  └───────▲────────────┘     in     │ └──┬──┘ │   │
 │                         │                │          │                         │    │    │   │
 └─────────────────────────┘                │          │                         │ ┌──▼──┐ │   │
                                            │          │                         │ │ LLM │ │   │
                                            │          │                         │ └──┬──┘ │   │
                                            │          │                         │    │    │   │
                                            │          │                         │ ┌──▼──┐ │   │
                                            │          │           media         │ │ TTS │ │   │
                                            │          └─────────────────────────┼─┴─────┘ │   │
                                            │                       out          └─────────┘   │
                                            │                                                  │
                                            └──────────────────────────────────────────────────┘
```

### [DailyTransport](/transports/daily/README.md)

[![Docs](https://img.shields.io/badge/Documention-blue)](https://docs.pipecat.ai/client/js/transports/daily)
[![README](https://img.shields.io/badge/README-goldenrod)](/transports/daily/README.md)
[![Demo](https://img.shields.io/badge/Demo-forestgreen)](https://github.com/pipecat-ai/pipecat/tree/main/examples/simple-chatbot)
![NPM Version](https://img.shields.io/npm/v/@pipecat-ai/react-native-daily-transport)

This Transport uses the [Daily](https://daily.co) audio and video calling service to connect to a bot and stream media over a WebRTC connection. This Transport is the client-side counterpart to the Pipecat [DailyTransport component](https://docs.pipecat.ai/server/services/transport/daily).

Typical media flow using a DailyTransport:

```

                                       ┌────────────────────────────────────────────┐
                                       │                                            │
  ┌───────────────────┐                │                 Server       ┌─────────┐   │
  │                   │                │                              │Pipecat  │   │
  │      Client       │  RTVI Messages │                              │Pipeline │   │
  │                   │       &        │                              │         │   │
  │ ┌──────────────┐  │  WebRTC Media  │  ┌──────────────┐    media   │ ┌─────┐ │   │
  │ │DailyTransport│◄─┼────────────────┼─►│DailyTransport┼────────────┼─► STT │ │   │
  │ └──────────────┘  │                │  └───────▲──────┘     in     │ └──┬──┘ │   │
  │                   │                │          │                   │    │    │   │
  └───────────────────┘                │          │                   │ ┌──▼──┐ │   │
                                       │          │                   │ │ LLM │ │   │
                                       │          │                   │ └──┬──┘ │   │
                                       │          │                   │    │    │   │
                                       │          │                   │ ┌──▼──┐ │   │
                                       │          │     media         │ │ TTS │ │   │
                                       │          └───────────────────┼─┴─────┘ │   │
                                       │                 out          └─────────┘   │
                                       │                                            │
                                       └────────────────────────────────────────────┘

```

## Local Development

### Build the transport libraries

```bash
$ yarn install
$ yarn build
```

## License

BSD-2 Clause

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, improving documentation, or adding new features, here's how you can help:

- **Found a bug?** Open an [issue](https://github.com/pipecat-ai/pipecat-client-react-native-transports/issues)
- **Have a feature idea?** Start a [discussion](https://discord.gg/pipecat)
- **Want to contribute code?** Check our [CONTRIBUTING.md](CONTRIBUTING.md) guide
- **Documentation improvements?** [Docs](https://github.com/pipecat-ai/docs) PRs are always welcome

Before submitting a pull request, please check existing issues and PRs to avoid duplicates.

We aim to review all contributions promptly and provide constructive feedback to help get your changes merged.
