export class MessageFormatter {
  static formatTrackMessage(track, links) {
    let message = `🎵 Now Playing: ${track.name}\n👤 Artist: ${track.artists}\n💿 Album: ${track.album.name}`;
    
    if (track.album.releaseDate) {
      message += ` (${track.album.releaseDate.split('-')[0]})`;
    }
    
    message += '\n\n🎧 Listen on:\n';
    
    const platforms = {
      spotify: 'Spotify',
      appleMusic: 'Apple Music',
      yandex: 'Yandex Music',
      youtube: 'YouTube',
      youtubeMusic: 'YouTube Music'
    };

    Object.entries(platforms).forEach(([key, name]) => {
      if (links[key]) {
        message += `• [${name}](${links[key]})\n`;
      }
    });

    message += `\n🌐 [Open all options](${links.songLink})`;
    
    return message;
  }

  static getErrorMessage(error, isPrivateChat = false) {
    const messages = {
      not_authorized: `Please authorize first. ${isPrivateChat ? 'Use the /start command' : 'Open a private chat with the bot and use the /start command'}`,
      not_playing: 'Nothing is playing right now. Start playing music on Spotify and try again!',
      default: 'An error occurred while getting track information. Please try again later.'
    };

    return messages[error.message] || messages.default;
  }

  static getHelpMessage(isPrivateChat) {
    return `🎵 *Quick Guide to Using Music Bot*

*Fastest way to share:*
${isPrivateChat ? '• Use the "Share Current Track" button below\n' : ''}1️⃣ Type @ in any chat
2️⃣ Select this bot from the list
3️⃣ Click to share current track

*Other methods:*
• Use /nowplaying command
• Mention @your_bot_name
• Type @your_bot_name in any chat

*Tips:*
• Works in private chats, groups and channels
• Shows album art when available
• Includes links to multiple music platforms
• Automatically refreshes authorization

*Need help?*
• /start - Authorize with Spotify
• /help - Show this message
• /nowplaying - Share current track

The bot will remember your Spotify connection, so you only need to authorize once.`;
  }

  static getStartMessage(authUrl, isPrivateChat) {
    return `Hi! To get started, you need to authorize with Spotify. 
Click the link below and grant access:\n${authUrl}

After authorization, you can use the bot in any chat:
1. Quick share: Just type @ and select the bot
2. Command: /nowplaying
3. Mention: @your_bot_name
${isPrivateChat ? '\n4. Use the quick button below' : ''}

Use /help to see all commands and tips`;
  }
} 