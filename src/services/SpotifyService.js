import SpotifyWebApi from 'spotify-web-api-node';

export class SpotifyService {
  constructor(config) {
    this.api = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      redirectUri: config.redirectUri
    });
    this.trackCache = new Map();
    this.CACHE_DURATION = 30000; // 30 seconds
  }

  createAuthUrl(scopes, state) {
    return this.api.createAuthorizeURL(scopes, state);
  }

  async getTokens(code) {
    const data = await this.api.authorizationCodeGrant(code);
    return {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token
    };
  }

  async refreshToken(refreshToken) {
    this.api.setRefreshToken(refreshToken);
    const data = await this.api.refreshAccessToken();
    return data.body.access_token;
  }

  async getCurrentTrack(userId, accessToken) {
    // Check cache
    const cached = this.trackCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    this.api.setAccessToken(accessToken);
    const data = await this.api.getMyCurrentPlayingTrack();

    if (!data.body || !data.body.item) {
      throw new Error('not_playing');
    }

    const track = data.body.item;
    const result = {
      name: track.name,
      artists: track.artists.map(artist => artist.name).join(', '),
      album: {
        name: track.album.name,
        releaseDate: track.album.release_date,
        image: track.album.images[0]?.url
      },
      id: track.uri.split(':')[2]
    };

    // Cache result
    this.trackCache.set(userId, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }

  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.trackCache.entries()) {
        if (now - value.timestamp > this.CACHE_DURATION) {
          this.trackCache.delete(key);
        }
      }
    }, this.CACHE_DURATION);
  }
} 