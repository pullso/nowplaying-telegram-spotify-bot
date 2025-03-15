import fetch from 'node-fetch';

export class LinkService {
  async getPlatformLinks(spotifyId) {
    try {
      const response = await fetch(`https://api.song.link/v1-alpha.1/links?url=spotify:track:${spotifyId}`);
      const data = await response.json();
      
      return {
        spotify: data.linksByPlatform?.spotify?.url,
        appleMusic: data.linksByPlatform?.appleMusic?.url,
        yandex: data.linksByPlatform?.yandex?.url,
        youtube: data.linksByPlatform?.youtube?.url,
        youtubeMusic: data.linksByPlatform?.youtubeMusic?.url,
        songLink: `https://song.link/s/${spotifyId}`
      };
    } catch (error) {
      console.error('Error getting platform links:', error);
      return { songLink: `https://song.link/s/${spotifyId}` };
    }
  }
} 