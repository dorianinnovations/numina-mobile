import AsyncStorage from '@react-native-async-storage/async-storage';
import SpotifyService from './spotifyService';

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  genre?: string;
  spotifyUri?: string;
  addedAt: number;
  source: 'ai_recommendation' | 'user_request' | 'mood_analysis';
  mood?: string;
  toolExecutionId?: string;
}

export interface AutoPlaylist {
  id: string;
  name: string;
  description: string;
  tracks: RecommendedTrack[];
  spotifyPlaylistId?: string;
  createdAt: number;
  lastUpdated: number;
  autoSync: boolean;
  totalTracks: number;
}

class AutoPlaylistService {
  private static instance: AutoPlaylistService;
  private storageKey = '@auto_playlists';
  private recentTracksKey = '@recent_ai_tracks';
  private maxRecentTracks = 50;

  static getInstance(): AutoPlaylistService {
    if (!this.instance) {
      this.instance = new AutoPlaylistService();
    }
    return this.instance;
  }

  // Get recent AI-recommended tracks (last 50)
  async getRecentTracks(): Promise<RecommendedTrack[]> {
    try {
      const stored = await AsyncStorage.getItem(this.recentTracksKey);
      if (stored) {
        const tracks = JSON.parse(stored);
        return tracks.sort((a: RecommendedTrack, b: RecommendedTrack) => b.addedAt - a.addedAt);
      }
      return [];
    } catch (error) {
      console.error('Error getting recent tracks:', error);
      return [];
    }
  }

  // Add new track from AI recommendation
  async addRecommendedTrack(track: Omit<RecommendedTrack, 'id' | 'addedAt'>): Promise<void> {
    try {
      const newTrack: RecommendedTrack = {
        ...track,
        id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        addedAt: Date.now(),
      };

      console.log('🎵 Adding AI recommended track:', newTrack.title, 'by', newTrack.artist);

      // Get existing tracks
      const recentTracks = await this.getRecentTracks();
      
      // Check for duplicates
      const isDuplicate = recentTracks.some(t => 
        t.title.toLowerCase() === newTrack.title.toLowerCase() && 
        t.artist.toLowerCase() === newTrack.artist.toLowerCase()
      );

      if (!isDuplicate) {
        // Add new track and keep only last 50
        const updatedTracks = [newTrack, ...recentTracks].slice(0, this.maxRecentTracks);
        await AsyncStorage.setItem(this.recentTracksKey, JSON.stringify(updatedTracks));

        // Auto-update the main AI playlist
        await this.updateAIPlaylist();
        
        console.log('✅ Track added to recent recommendations');
      } else {
        console.log('ℹ️ Track already exists in recent recommendations');
      }
    } catch (error) {
      console.error('Error adding recommended track:', error);
    }
  }

  // Process tool execution results to extract music recommendations
  async processToolExecutionForMusic(toolName: string, results: any): Promise<void> {
    if (toolName === 'music_recommendations' && results.success) {
      const { recommendations, mood, genre } = results;
      
      if (recommendations && Array.isArray(recommendations)) {
        for (const rec of recommendations) {
          await this.addRecommendedTrack({
            title: rec.title,
            artist: rec.artist,
            genre: rec.genre || genre,
            source: 'ai_recommendation',
            mood: mood,
          });
        }
      }
    } else if (toolName === 'spotify_playlist' && results.success) {
      // Track that we created a playlist
      console.log('🎧 Spotify playlist created:', results.playlistName);
    }
  }

  // Get or create the main AI recommendations playlist
  async getAIPlaylist(): Promise<AutoPlaylist> {
    try {
      const playlists = await this.getAllPlaylists();
      let aiPlaylist = playlists.find(p => p.name === 'AI Recommendations');
      
      if (!aiPlaylist) {
        // Create new AI playlist
        aiPlaylist = {
          id: `playlist_ai_${Date.now()}`,
          name: 'AI Recommendations',
          description: 'Automatically curated by your AI assistant based on your conversations and preferences',
          tracks: [],
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          autoSync: true,
          totalTracks: 0,
        };
        
        await this.savePlaylist(aiPlaylist);
        console.log('🎵 Created AI Recommendations playlist');
      }
      
      return aiPlaylist;
    } catch (error) {
      console.error('Error getting AI playlist:', error);
      throw error;
    }
  }

  // Update the AI playlist with recent tracks
  async updateAIPlaylist(): Promise<void> {
    try {
      const aiPlaylist = await this.getAIPlaylist();
      const recentTracks = await this.getRecentTracks();
      
      // Update playlist with recent tracks
      aiPlaylist.tracks = recentTracks;
      aiPlaylist.totalTracks = recentTracks.length;
      aiPlaylist.lastUpdated = Date.now();
      
      await this.savePlaylist(aiPlaylist);
      
      // If connected to Spotify and auto-sync is enabled, sync to Spotify
      if (aiPlaylist.autoSync) {
        await this.syncToSpotify(aiPlaylist);
      }
      
      console.log('🔄 Updated AI playlist with', recentTracks.length, 'tracks');
    } catch (error) {
      console.error('Error updating AI playlist:', error);
    }
  }

  // Sync playlist to Spotify
  async syncToSpotify(playlist: AutoPlaylist): Promise<void> {
    try {
      const isConnected = await SpotifyService().isConnected();
      if (!isConnected) {
        console.log('ℹ️ Spotify not connected, skipping sync');
        return;
      }

      // Get tracks with Spotify URIs
      const tracksForSpotify = playlist.tracks
        .filter(t => t.spotifyUri)
        .map(t => t.spotifyUri!)
        .slice(0, 100); // Spotify playlist limit

      if (tracksForSpotify.length === 0) {
        console.log('ℹ️ No Spotify tracks to sync');
        return;
      }

      let spotifyPlaylistId = playlist.spotifyPlaylistId;

      if (!spotifyPlaylistId) {
        // Create new Spotify playlist
        try {
          // Implement createSpotifyPlaylist in ApiService
          // Temporarily disabled to fix circular dependency
          console.log('🚧 Spotify playlist creation temporarily disabled');
          
          // const spotifyResult = await ApiService.post('/spotify/playlists', {
          //   playlistName: playlist.name,
          //   description: playlist.description,
          //   tracks: tracksForSpotify,
          //   isPublic: false,
          // });

          // if (spotifyResult.success && spotifyResult.data) {
          //   spotifyPlaylistId = spotifyResult.data.playlistId;
          //   playlist.spotifyPlaylistId = spotifyPlaylistId;
          //   await this.savePlaylist(playlist);
          //   console.log('✅ Created Spotify playlist:', playlist.name);
          // }
        } catch (error) {
          console.error('Error creating Spotify playlist:', error);
        }
      } else {
        // Update existing Spotify playlist
        try {
              // Implement updateSpotifyPlaylist in ApiService
    // PUT method not available in ApiService yet
          console.log('🔄 Would update Spotify playlist:', playlist.name, 'with', tracksForSpotify.length, 'tracks');
        } catch (error) {
          console.error('Error updating Spotify playlist:', error);
        }
      }
    } catch (error) {
      console.error('Error syncing to Spotify:', error);
    }
  }

  // Get all auto-managed playlists
  async getAllPlaylists(): Promise<AutoPlaylist[]> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error getting playlists:', error);
      return [];
    }
  }

  // Save playlist
  async savePlaylist(playlist: AutoPlaylist): Promise<void> {
    try {
      const playlists = await this.getAllPlaylists();
      const index = playlists.findIndex(p => p.id === playlist.id);
      
      if (index >= 0) {
        playlists[index] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(playlists));
    } catch (error) {
      console.error('Error saving playlist:', error);
    }
  }

  // Create custom playlist from recent tracks
  async createCustomPlaylist(
    name: string,
    description: string,
    trackIds: string[],
    autoSync: boolean = true
  ): Promise<AutoPlaylist> {
    try {
      const recentTracks = await this.getRecentTracks();
      const selectedTracks = recentTracks.filter(t => trackIds.includes(t.id));
      
      const newPlaylist: AutoPlaylist = {
        id: `playlist_custom_${Date.now()}`,
        name,
        description,
        tracks: selectedTracks,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        autoSync,
        totalTracks: selectedTracks.length,
      };
      
      await this.savePlaylist(newPlaylist);
      
      if (autoSync) {
        await this.syncToSpotify(newPlaylist);
      }
      
      console.log('✅ Created custom playlist:', name, 'with', selectedTracks.length, 'tracks');
      return newPlaylist;
    } catch (error) {
      console.error('Error creating custom playlist:', error);
      throw error;
    }
  }

  // Get playlist statistics
  async getPlaylistStats(): Promise<{
    totalTracks: number;
    totalPlaylists: number;
    mostCommonMood: string;
    mostCommonGenre: string;
    recentActivity: number;
  }> {
    try {
      const recentTracks = await this.getRecentTracks();
      const playlists = await this.getAllPlaylists();
      
      // Analyze moods
      const moodCounts: { [key: string]: number } = {};
      recentTracks.forEach(track => {
        if (track.mood) {
          moodCounts[track.mood] = (moodCounts[track.mood] || 0) + 1;
        }
      });
      
      // Analyze genres
      const genreCounts: { [key: string]: number } = {};
      recentTracks.forEach(track => {
        if (track.genre) {
          genreCounts[track.genre] = (genreCounts[track.genre] || 0) + 1;
        }
      });
      
      const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b, 'unknown'
      );
      
      const mostCommonGenre = Object.keys(genreCounts).reduce((a, b) => 
        genreCounts[a] > genreCounts[b] ? a : b, 'unknown'
      );
      
      // Recent activity (tracks added in last 7 days)
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentActivity = recentTracks.filter(t => t.addedAt > weekAgo).length;
      
      return {
        totalTracks: recentTracks.length,
        totalPlaylists: playlists.length,
        mostCommonMood,
        mostCommonGenre,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting playlist stats:', error);
      return {
        totalTracks: 0,
        totalPlaylists: 0,
        mostCommonMood: 'unknown',
        mostCommonGenre: 'unknown',
        recentActivity: 0,
      };
    }
  }

  // Clear all data (for testing or reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      await AsyncStorage.removeItem(this.recentTracksKey);
      console.log('🗑️ Cleared all auto-playlist data');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }
}

export default AutoPlaylistService;