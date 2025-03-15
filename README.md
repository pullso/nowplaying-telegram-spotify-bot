# Spotify Telegram Bot

Share your currently playing Spotify track in any Telegram chat with this bot.

## Features

- Share currently playing track with album art and links
- Support for multiple music platforms (Spotify, Apple Music, YouTube, etc.)
- Inline mode for quick sharing in any chat
- Quick access button in private chats
- Automatic token refresh
- Cache system for better performance
- Real-time track updates
- Support for private chats and group chats

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
4. Set bot description and about info using `/setdescription` and `/setabouttext`
5. Enable inline feedback using `/setinlinefeedback`

### Spotify Setup
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Get Client ID and Client Secret
4. Add `http://localhost:8888/callback` (or your domain) to Redirect URIs
5. Request the following scopes in your application:
   - `user-read-currently-playing`
   - `user-read-playback-state`
6. Set the following variables in `.env`:
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
4. Use the refresh button to update track information

### Private Chat Features
- Quick access button for sharing current track
- Automatic keyboard resizing
- Direct command support

## Project Structure

```
src/
├── services/           # Core services
│   ├── SpotifyService.js    # Spotify API integration
│   ├── TokenManager.js      # Token management
│   ├── LinkService.js       # Music platform links
│   └── MessageFormatter.js  # Message formatting
├── index.js           # Main bot logic
└── tokens.json        # User tokens storage
```

## Error Handling

The bot includes comprehensive error handling for:
- No active track playing
- Authorization errors
- API rate limits
- Network issues
- Invalid tokens

## Security

- Tokens are stored locally in `tokens.json`
- Automatic token refresh
- Secure OAuth2 flow
- No sensitive data in logs

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT 