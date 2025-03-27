# Whistle: Synchronized YouTube Watch Party

A real-time synchronized YouTube viewing platform with chat functionality, built using Socket.io and YouTube IFrame API.

## Features
- **Synchronized Playback**: All users in a room experience simultaneous video playback
- **Room System**: Create/join separate viewing rooms with unique IDs
- **Buffering Coordination**: Ensures all users are buffered before playback starts
- **Live Chat**: Real-time messaging using Socket.io
- **URL Validation**: Supports YouTube links and direct video URLs (mp4, webm, ogg)
- **Error Handling**: Checks URL validity before broadcasting to users

## Technologies Used
- **Frontend**: HTML5, CSS3 (Flexbox/Grid), JavaScript ES6+
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io
- **Video Integration**: YouTube IFrame Player API

## Key Technical Challenges
- Implemented custom buffering synchronization logic
- Overcame YouTube API event loop conflicts with Socket.io
- Developed custom control layer to bypass native YouTube controls
- Created real-time position sync using timestamp validation

## Installation
1. Clone repository
2. npm start

Or try a demo at https://fly.io/apps/whistle-empty-silence-2875
