# Agent Office

**AI Agent Management Simulation** — Manage a chaotic virtual office of autonomous AI agents. Assign tasks, watch them collaborate, and generate real interactive apps, games, and concepts with Gemini.

## Features

- 🏢 Interactive 2D office floor with animated agents
- 🤖 4 starter agents + hireable candidates + custom agent creator
- ✨ Task assignment with live Gemini 3.7 Flash (or high-quality offline simulator)
- 🤝 Multi-agent co-op hackathon mode
- 🪴 Decor shop (arcade, ping pong, disco ball)
- ⚡ Office upgrades system
- 🎮 Live sandboxed interactive result viewer for generated HTML games/apps
- 💾 LocalStorage persistence for tokens, upgrades, custom agents, and task history

## Quick Start

1. Open `index.html` in a modern browser, **or**
2. Run the included static server:

```bash
node server.js
```

Then visit http://localhost:3000

## Optional: Live Gemini API

Open **Settings** in the app and paste your Google Gemini API key. Keys stay in your browser LocalStorage only.

Without a key the app uses a high-quality offline neural simulator that still produces playable mini-games and rich creative output.

## Project Structure

```
agent-office/
├── index.html
├── server.js          # Simple high-performance static HTTP server
├── css/
│   ├── main.css
│   └── modals.css
└── js/
    ├── app.js             # Main application controller
    ├── agents-data.js     # Agent rosters & personalities
    ├── audio.js           # Procedural Web Audio engine
    ├── config.js          # Waypoints, stations, presets, upgrades
    ├── events-system.js   # Autonomous agent activity & chaos events
    ├── llm-service.js     # Gemini API + offline fallback generator
    ├── office-canvas.js   # 2D canvas renderer & pathfinding
    └── task-system.js     # Task assignment & result archive
```

Built with pure frontend HTML/CSS/JS — no build step required.
