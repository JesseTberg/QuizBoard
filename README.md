# Jeopardy Real-Time

A real-time Jeopardy game built with React, Vite, Express, and Socket.io.

## Live Demo

View the deployed app on Render:

https://jeopardy-f731.onrender.com/

## Features

- Real-time question board and score updates
- Host view with game controls
- Player view with buzzer support
- Setup view for configuring players and game settings
- Built with React + Vite and Socket.io for realtime communication

## Getting Started

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the app in your browser at the address shown by the development server.

## Build

```bash
npm run build
```

## Preview production build

```bash
npm run preview
```

## Project Structure

- `server.ts` - Express server entrypoint
- `src/` - React application source
- `src/components/` - UI components for host, player, and board views
- `src/lib/socket.ts` - Socket.io client setup
- `index.html` - application HTML template

## Notes

This project currently uses the Render deployment at `https://jeopardy-f731.onrender.com/` for the live version.
