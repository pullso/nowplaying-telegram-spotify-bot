# Spotify Telegram Bot

Share your currently playing Spotify track in any Telegram chat with this bot.

## Features

- Share currently playing track with album art and links
- Support for multiple music platforms (Spotify, Apple Music, YouTube, etc.)
- Inline mode for quick sharing in any chat
- Quick access button in private chats
- Automatic token refresh
- Cache system for better performance

## Prerequisites

- Node.js 16 or higher
- Spotify Premium account
- Telegram account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/spotify-telegram.git
cd spotify-telegram
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:

### Telegram Setup
1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Get your bot token and set `TELEGRAM_BOT_TOKEN` in `.env`
3. Enable inline mode for your bot with `/setinline` command in BotFather

### Spotify Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get Client ID and Client Secret
4. Add `http://localhost:8888` (or your domain) to Redirect URIs
5. Set the following variables in `.env`:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `SPOTIFY_REDIRECT_URI`

## Usage

Start the bot:
```bash
npm start
```

### Bot Commands
- `/start` - Start and authorize with Spotify
- `/help` - Show help message
- `/nowplaying` - Share currently playing track

### Inline Mode
1. Type @ in any chat
2. Select your bot
3. Click to share current track

## Development

The project follows SOLID principles and is organized into the following structure:

```
src/
├── config/         # Configuration files
├── controllers/    # Bot command handlers
├── data/          # Data storage
├── repositories/   # Data access layer
├── services/      # Business logic
└── utils/         # Utility functions
```

## License

MIT 