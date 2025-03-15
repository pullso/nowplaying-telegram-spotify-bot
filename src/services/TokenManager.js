import fs from 'fs/promises';
import path from 'path';

export class TokenManager {
  constructor(tokensPath) {
    this.tokensPath = tokensPath;
    this.tokens = new Map();
  }

  async load() {
    try {
      const data = await fs.readFile(this.tokensPath, 'utf8');
      const tokens = JSON.parse(data);
      Object.entries(tokens).forEach(([key, value]) => {
        this.tokens.set(key, value);
      });
      console.log('Tokens loaded successfully');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading tokens:', error);
      }
    }
  }

  async save() {
    try {
      const tokens = Object.fromEntries(this.tokens);
      await fs.writeFile(this.tokensPath, JSON.stringify(tokens, null, 2));
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  get(userId) {
    return this.tokens.get(userId);
  }

  set(userId, tokens) {
    this.tokens.set(userId, tokens);
    return this.save();
  }

  delete(userId) {
    this.tokens.delete(userId);
    return this.save();
  }

  has(userId) {
    return this.tokens.has(userId);
  }
} 