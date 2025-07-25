import * as SecureStore from 'expo-secure-store';
import { SandboxNode } from '../types/sandbox';

interface NodeSession {
  id: string;
  userId: string;
  sessionName: string;
  lockedNodes: SandboxNode[];
  createdAt: string;
  lastAccessedAt: string;
  nodeCount: number;
}

interface SessionMetadata {
  id: string;
  sessionName: string;
  nodeCount: number;
  createdAt: string;
  lastAccessedAt: string;
}

class NodeSessionPersistenceService {
  private readonly SESSIONS_KEY = 'numina_node_sessions';
  private readonly SESSION_PREFIX = 'numina_session_';
  private readonly MAX_SESSIONS_PER_USER = 10;
  private readonly SESSION_EXPIRY_DAYS = 30;

  async createSession(
    userId: string, 
    sessionName: string, 
    lockedNodes: SandboxNode[]
  ): Promise<string> {
    const sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const nodeSession: NodeSession = {
      id: sessionId,
      userId,
      sessionName: sessionName || `Session ${new Date().toLocaleDateString()}`,
      lockedNodes,
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      nodeCount: lockedNodes.length
    };

    try {
      // Store the full session data
      await SecureStore.setItemAsync(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(nodeSession)
      );

      // Update session metadata list
      await this.updateSessionMetadata(userId, sessionId, nodeSession);
      
      // Cleanup old sessions if needed
      await this.cleanupOldSessions(userId);

      console.log(`✅ Created node session: ${sessionName} with ${lockedNodes.length} nodes`);
      return sessionId;
      
    } catch (error) {
      console.error('❌ Failed to create node session:', error);
      throw new Error('Failed to create node session');
    }
  }

  async getSession(sessionId: string): Promise<NodeSession | null> {
    try {
      const sessionData = await SecureStore.getItemAsync(`${this.SESSION_PREFIX}${sessionId}`);
      if (!sessionData) {
        return null;
      }

      const session: NodeSession = JSON.parse(sessionData);
      
      // Update last accessed time
      session.lastAccessedAt = new Date().toISOString();
      await SecureStore.setItemAsync(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(session)
      );

      return session;
      
    } catch (error) {
      console.error(`❌ Failed to get session ${sessionId}:`, error);
      return null;
    }
  }

  async getUserSessions(userId: string): Promise<SessionMetadata[]> {
    try {
      const metadataString = await SecureStore.getItemAsync(this.SESSIONS_KEY);
      if (!metadataString) {
        return [];
      }

      const allMetadata: Record<string, SessionMetadata[]> = JSON.parse(metadataString);
      const userSessions = allMetadata[userId] || [];

      // Sort by last accessed (most recent first)
      return userSessions.sort((a, b) => 
        new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
      );
      
    } catch (error) {
      console.error(`❌ Failed to get user sessions for ${userId}:`, error);
      return [];
    }
  }

  async updateSession(
    sessionId: string, 
    updatedNodes: SandboxNode[], 
    newSessionName?: string
  ): Promise<boolean> {
    try {
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        return false;
      }

      const updatedSession: NodeSession = {
        ...existingSession,
        lockedNodes: updatedNodes,
        lastAccessedAt: new Date().toISOString(),
        nodeCount: updatedNodes.length,
        ...(newSessionName && { sessionName: newSessionName })
      };

      await SecureStore.setItemAsync(
        `${this.SESSION_PREFIX}${sessionId}`,
        JSON.stringify(updatedSession)
      );

      // Update metadata
      await this.updateSessionMetadata(existingSession.userId, sessionId, updatedSession);

      console.log(`✅ Updated session ${sessionId} with ${updatedNodes.length} nodes`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to update session ${sessionId}:`, error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      // Remove the session data
      await SecureStore.deleteItemAsync(`${this.SESSION_PREFIX}${sessionId}`);
      
      // Remove from metadata
      await this.removeSessionMetadata(session.userId, sessionId);

      console.log(`✅ Deleted session ${sessionId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to delete session ${sessionId}:`, error);
      return false;
    }
  }

  async restoreLastSession(userId: string): Promise<SandboxNode[]> {
    try {
      const sessions = await this.getUserSessions(userId);
      if (sessions.length === 0) {
        return [];
      }

      const lastSession = await this.getSession(sessions[0].id);
      if (!lastSession) {
        return [];
      }

      console.log(`🔄 Restored last session: ${lastSession.sessionName} with ${lastSession.lockedNodes.length} nodes`);
      return lastSession.lockedNodes;
      
    } catch (error) {
      console.error(`❌ Failed to restore last session for ${userId}:`, error);
      return [];
    }
  }

  private async updateSessionMetadata(
    userId: string, 
    sessionId: string, 
    session: NodeSession
  ): Promise<void> {
    try {
      const metadataString = await SecureStore.getItemAsync(this.SESSIONS_KEY);
      const allMetadata: Record<string, SessionMetadata[]> = metadataString 
        ? JSON.parse(metadataString) 
        : {};

      if (!allMetadata[userId]) {
        allMetadata[userId] = [];
      }

      const sessionMetadata: SessionMetadata = {
        id: session.id,
        sessionName: session.sessionName,
        nodeCount: session.nodeCount,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt
      };

      // Update or add session metadata
      const existingIndex = allMetadata[userId].findIndex(s => s.id === sessionId);
      if (existingIndex >= 0) {
        allMetadata[userId][existingIndex] = sessionMetadata;
      } else {
        allMetadata[userId].push(sessionMetadata);
      }

      await SecureStore.setItemAsync(this.SESSIONS_KEY, JSON.stringify(allMetadata));
      
    } catch (error) {
      console.error('❌ Failed to update session metadata:', error);
    }
  }

  private async removeSessionMetadata(userId: string, sessionId: string): Promise<void> {
    try {
      const metadataString = await SecureStore.getItemAsync(this.SESSIONS_KEY);
      if (!metadataString) {
        return;
      }

      const allMetadata: Record<string, SessionMetadata[]> = JSON.parse(metadataString);
      if (!allMetadata[userId]) {
        return;
      }

      allMetadata[userId] = allMetadata[userId].filter(s => s.id !== sessionId);
      await SecureStore.setItemAsync(this.SESSIONS_KEY, JSON.stringify(allMetadata));
      
    } catch (error) {
      console.error('❌ Failed to remove session metadata:', error);
    }
  }

  private async cleanupOldSessions(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      // Remove sessions older than expiry days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - this.SESSION_EXPIRY_DAYS);
      
      const expiredSessions = sessions.filter(s => 
        new Date(s.lastAccessedAt) < expiryDate
      );

      for (const session of expiredSessions) {
        await this.deleteSession(session.id);
      }

      // If still too many sessions, remove oldest ones
      const remainingSessions = await this.getUserSessions(userId);
      if (remainingSessions.length > this.MAX_SESSIONS_PER_USER) {
        const sessionsToRemove = remainingSessions
          .slice(this.MAX_SESSIONS_PER_USER)
          .map(s => s.id);

        for (const sessionId of sessionsToRemove) {
          await this.deleteSession(sessionId);
        }
      }

      if (expiredSessions.length > 0) {
        console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions for user ${userId}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to cleanup old sessions:', error);
    }
  }

  async exportSession(sessionId: string): Promise<string | null> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        return null;
      }

      const exportData = {
        sessionName: session.sessionName,
        nodeCount: session.nodeCount,
        createdAt: session.createdAt,
        nodes: session.lockedNodes.map(node => ({
          id: node.id,
          title: node.title,
          content: node.content,
          category: node.category,
          confidence: node.confidence,
          personalHook: node.personalHook,
          deepInsights: node.deepInsights
        }))
      };

      return JSON.stringify(exportData, null, 2);
      
    } catch (error) {
      console.error(`❌ Failed to export session ${sessionId}:`, error);
      return null;
    }
  }

  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    totalNodes: number;
    oldestSession: string | null;
    newestSession: string | null;
  }> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      const totalNodes = sessions.reduce((sum, s) => sum + s.nodeCount, 0);
      
      return {
        totalSessions: sessions.length,
        totalNodes,
        oldestSession: sessions.length > 0 ? sessions[sessions.length - 1].sessionName : null,
        newestSession: sessions.length > 0 ? sessions[0].sessionName : null
      };
      
    } catch (error) {
      console.error(`❌ Failed to get session stats for ${userId}:`, error);
      return {
        totalSessions: 0,
        totalNodes: 0,
        oldestSession: null,
        newestSession: null
      };
    }
  }
}

export default new NodeSessionPersistenceService();