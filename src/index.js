import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import path from 'path';
import http from 'http';
import url from 'url';
import { TokenManager } from './services/TokenManager.js';
import { SpotifyService } from './services/SpotifyService.js';
import { LinkService } from './services/LinkService.js';
import { MessageFormatter } from './services/MessageFormatter.js';

// Load environment variables
dotenv.config();

class SpotifyTelegramBot {
  constructor() {
    // Initialize services
    this.tokenManager = new TokenManager(path.join(process.cwd(), 'src', 'tokens.json'));
    this.spotifyService = new SpotifyService({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    this.linkService = new LinkService();

    // Initialize Telegram bot
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
      polling: {
        params: {
          timeout: 60,
          allowed_updates: ["message", "callback_query", "inline_query"]
        }
      },
      filepath: false
    });

    // Bot commands configuration
    this.botCommands = [
      { command: 'start', description: 'Start and authorize with Spotify' },
      { command: 'help', description: 'Show help message' },
      { command: 'nowplaying', description: 'Share currently playing track' }
    ];

    // Start the callback server
    this.server = this.createCallbackServer();
  }

  async initialize() {
    await this.tokenManager.load();
    await this.setupBot();
    this.spotifyService.startCacheCleanup();
    this.startTokenRefresh();
    this.registerEventHandlers();
    
    const PORT = process.env.PORT || 8888;
    this.server.listen(PORT, () => {
      console.log(`Callback server is running on http://localhost:${PORT}`);
    });
  }

  async setupBot() {
    try {
      await this.bot.setMyCommands(this.botCommands);
      
      const baseUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
      const descriptions = {
        description: 'Share your currently playing Spotify track in any chat',
        short_description: 'Share Spotify tracks instantly'
      };

      for (const [key, value] of Object.entries(descriptions)) {
        await fetch(`${baseUrl}/setMy${key.charAt(0).toUpperCase() + key.slice(1)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [key]: value })
        });
      }
    } catch (error) {
      console.error('Error setting up bot:', error);
    }
  }

  startTokenRefresh() {
    setInterval(async () => {
      for (const [userId, tokens] of this.tokenManager.tokens.entries()) {
        try {
          const newAccessToken = await this.spotifyService.refreshToken(tokens.refreshToken);
          await this.tokenManager.set(userId, {
            ...tokens,
            accessToken: newAccessToken
          });
        } catch (error) {
          console.error(`Error refreshing token for user ${userId}:`, error);
          if (error.statusCode === 401) {
            await this.tokenManager.delete(userId);
          }
        }
      }
    }, 3600000); // Refresh every hour
  }

  registerEventHandlers() {
    this.bot.on('inline_query', this.handleInlineQuery.bind(this));
    this.bot.on('callback_query', this.handleCallbackQuery.bind(this));
    this.bot.onText(/\/nowplaying|@nowplaying/, this.handleNowPlayingCommand.bind(this));
    this.bot.onText(/\/start/, this.handleStartCommand.bind(this));
    this.bot.onText(/\/help/, this.handleHelpCommand.bind(this));
    this.bot.on('text', this.handleTextMessage.bind(this));
  }

  async handleInlineQuery(query) {
    const userId = query.from.id.toString();
    
    try {
      if (!this.tokenManager.has(userId)) {
        return this.handleUnauthorizedInlineQuery(query);
      }

      const tokens = this.tokenManager.get(userId);
      const track = await this.spotifyService.getCurrentTrack(userId, tokens.accessToken);
      if (!track) {
        throw new Error('Failed to get info about track');
      }
      const links = await this.linkService.getPlatformLinks(track.id);
      
      const result = [{
        type: 'article',
        id: 'current_track',
        title: `🎵 ${track.name}`,
        description: track.artists,
        thumb_url: track.album.image,
        input_message_content: {
          message_text: MessageFormatter.formatTrackMessage(track, links),
          parse_mode: 'Markdown',
          disable_web_page_preview: false
        },
        reply_markup: {
          inline_keyboard: [[{ text: '🔄 Refresh Track', callback_data: 'update_track' }]]
        }
      }];

      await this.bot.answerInlineQuery(query.id, result, {
        cache_time: 1,
        is_personal: true
      });
    } catch (error) {
      await this.handleInlineQueryError(query, error);
    }
  }

  async handleCallbackQuery(callbackQuery) {
    if (callbackQuery.data === 'update_track') {
      const userId = callbackQuery.from.id.toString();
      
      try {
        const tokens = this.tokenManager.get(userId);
        const track = await this.spotifyService.getCurrentTrack(userId, tokens.accessToken);
        if (!track) {
          throw new Error('Failed to get info about track');
        }
        const links = await this.linkService.getPlatformLinks(track.id);
        const newText = MessageFormatter.formatTrackMessage(track, links);

        if (callbackQuery.inline_message_id) {
          await this.bot.editMessageText(newText, {
            inline_message_id: callbackQuery.inline_message_id,
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
            reply_markup: {
              inline_keyboard: [[{ text: '🔄 Refresh Track', callback_data: 'update_track' }]]
            }
          });
        }

        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: '✅ Track information updated!',
          show_alert: false
        });
      } catch (error) {
        await this.bot.answerCallbackQuery(callbackQuery.id, {
          text: MessageFormatter.getErrorMessage(error),
          show_alert: true
        });
      }
    }
  }

  async handleNowPlayingCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const isPrivateChat = msg.chat.type === 'private';
    
    try {
      const tokens = this.tokenManager.get(userId);
      const track = await this.spotifyService.getCurrentTrack(userId, tokens.accessToken);
      const links = await this.linkService.getPlatformLinks(track.id);
      const message = MessageFormatter.formatTrackMessage(track, links);

      if (track.album.image) {
        await this.bot.sendPhoto(chatId, track.album.image, {
          caption: message,
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });
      } else {
        await this.bot.sendMessage(chatId, message, {
          parse_mode: 'Markdown',
          reply_to_message_id: msg.message_id
        });
      }
    } catch (error) {
      await this.bot.sendMessage(chatId, 
        MessageFormatter.getErrorMessage(error, isPrivateChat),
        { reply_to_message_id: msg.message_id }
      );
    }
  }

  async handleStartCommand(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    const isPrivateChat = msg.chat.type === 'private';
    
    const authUrl = this.spotifyService.createAuthUrl(['user-read-currently-playing'], userId);
    const keyboard = isPrivateChat ? {
      keyboard: [[{ text: '🎵 Share Current Track' }]],
      resize_keyboard: true,
      one_time_keyboard: false
    } : undefined;

    await this.bot.sendMessage(
      chatId,
      MessageFormatter.getStartMessage(authUrl, isPrivateChat),
      { reply_markup: keyboard }
    );
  }

  async handleHelpCommand(msg) {
    const chatId = msg.chat.id;
    const isPrivateChat = msg.chat.type === 'private';
    
    const keyboard = isPrivateChat ? {
      keyboard: [[{ text: '🎵 Share Current Track' }]],
      resize_keyboard: true,
      one_time_keyboard: false
    } : undefined;

    await this.bot.sendMessage(chatId, 
      MessageFormatter.getHelpMessage(isPrivateChat),
      {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id,
        reply_markup: keyboard
      }
    );
  }

  async handleTextMessage(msg) {
    if (msg.text === '🎵 Share Current Track') {
      await this.handleNowPlayingCommand(msg);
    }
  }

  handleUnauthorizedInlineQuery(query) {
    return this.bot.answerInlineQuery(query.id, [{
      type: 'article',
      id: 'auth_required',
      title: '🔑 Authorization Required',
      description: 'Click here to connect Spotify',
      input_message_content: {
        message_text: 'You need to authorize to share tracks. Send /start to the bot in a private message.',
        parse_mode: 'Markdown'
      }
    }], { cache_time: 1 });
  }

  async handleInlineQueryError(query, error) {
    const errorResult = [{
      type: 'article',
      id: 'error',
      title: error.message === 'not_playing' ? '❌ No Active Track' : '❌ Error',
      description: error.message === 'not_playing' ? 'Play music on Spotify' : 'Failed to get track information',
      input_message_content: {
        message_text: MessageFormatter.getErrorMessage(error),
        parse_mode: 'Markdown'
      }
    }];

    await this.bot.answerInlineQuery(query.id, errorResult, { cache_time: 1 });
  }

  createCallbackServer() {
    return http.createServer(async (req, res) => {
      const { query } = url.parse(req.url, true);
      
      if (query.error) {
        return this.sendErrorResponse(res, query.error);
      }
      
      if (!query.code || !query.state) {
        return this.sendErrorResponse(res, 'Missing required parameters');
      }

      try {
        const tokens = await this.spotifyService.getTokens(query.code);
        await this.tokenManager.set(query.state, tokens);
        this.sendSuccessResponse(res);
      } catch (error) {
        console.error('Error getting tokens:', error);
        this.sendErrorResponse(res, error.message);
      }
    });
  }

  sendSuccessResponse(res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;">
          <div style="text-align: center;">
            <h2> Authorization Successful!</h2>
            <p>You can now:</p>
            <ul style="list-style: none; padding: 0;">
              <li> Use the /nowplaying command in any chat with the bot</li>
              <li> Type @muznowbot in any chat to share the current track</li>
              <li> Just start typing @ and select the bot to share music</li>
            </ul>
            <p>You can close this window and return to Telegram</p>
          </div>
        </body>
      </html>
    `);
  }

  sendErrorResponse(res, error) {
    res.writeHead(400, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial;">
          <div style="text-align: center;">
            <h2> Authorization Error</h2>
            <p>Error: ${error}</p>
            <p>Please try again using the /start command in Telegram</p>
          </div>
        </body>
      </html>
    `);
  }
}

// Create and start the bot
const spotifyBot = new SpotifyTelegramBot();
spotifyBot.initialize().catch(error => {
  console.error('Error initializing bot:', error);
});

export default spotifyBot;