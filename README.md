# blockdudes3

 * external name: birdtown (pending)
 * internal name: blockdudes3

## Overview

The third version of Block Dudes, a team-based 2.5D multiplayer shooter that runs in your browser with no setup required. My goal was to build a multiplayer game that could handle [twitch gameplay](https://en.wikipedia.org/wiki/Twitch_gameplay), but also had a low barrier to entry--i.e. no installs required, support for older machines, and minimal time for game setup.

### Status

Needs polish, but fully playable with lots of technical features. I'm also exploring building a [similar engine](https://github.com/bchoi12/birdtown) that is also browser-based, but fully P2P to cut out server costs

### Screenshots

![devlog 40](https://raw.githubusercontent.com/bchoi12/blockdudes3/master/screenshots/devlog40.png)

![devlog 43](https://raw.githubusercontent.com/bchoi12/blockdudes3/master/screenshots/devlog43.png)

![devlog 44](https://raw.githubusercontent.com/bchoi12/blockdudes3/master/screenshots/devlog44.png)

![devlog 45](https://raw.githubusercontent.com/bchoi12/blockdudes3/master/screenshots/devlog45.png)

### Game engine features
 * built with Golang and deployed to Google Cloud
 * also compiled as a WASM binary to support client-side prediction
 * game state is serialized and compressed before being sent over network
 * custom physics engine with moderate to full support for rectangles, circles, n-gons
 * uses a basic spatial grid for fast object lookups
 * seeded pseudo-random modular level generation for unlimited variations of birdtowns

### Networking features
 * able to run many concurrent games each at 62hz tickrate with support for 10+ players per room
 * custom server-authoritative netcode using a synchronized TCP channel (websocket) and UDP-like channel (WebRTC data connection)
 * fully functional text chat and peer-to-peer voice chat for all players

### Client (browser) features
 * nearly instant load times due to small footprint (<10Mb for all assets)
 * supports all Chromium-based browsers with no additional setup required
 * custom particle system with support for instanced geometry and geometry caching
 * optimized rendering for older machines (e.g. 40 FPS on my 9 year old laptop)
 * custom framework for dynamically adding modular UI elements to the page

### Known issues
 * Firefox and Safari are not supported

## Credits

### Game Engine
 * [golang](https://go.dev/)
 * [Google Cloud](https://cloud.google.com/) and [Heroku](https://www.heroku.com/) for hosting
 * [Gorilla Websocket](https://github.com/gorilla/websocket) for reliable communication and signaling for P2P connections
 * [Pion WebRTC](https://github.com/pion/webrtc) for low latency communication
 * [vmihailenco msgpack](github.com/vmihailenco/msgpack/v5) for data compression

### Client
 * [TypeScript](https://www.typescriptlang.org/)
 * [three.js](https://threejs.org/) for 3D rendering
 * [WebAssembly](https://webassembly.org/) for client-side prediction
 * Websocket for reliable communication
 * WebRTC for low latency communication and voice chat
 * [msgpack](https://msgpack.org/) for data compression
 * [Howler](https://howlerjs.com/) for audio
 * [webpack](https://webpack.js.org/) for bundling code

 ### Others
 * [Blender](https://www.blender.org/) for art
 * [Github](https://github.com/) for version control