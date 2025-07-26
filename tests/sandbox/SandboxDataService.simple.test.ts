import SandboxDataService from '../../src/services/sandboxDataService';

// Mock CloudAuth
jest.mock('../../src/services/cloudAuth', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      getToken: jest.fn(() => 'mock-token'),
    })),
  },
}));

// Mock other services
jest.mock('../../src/services/api', () => ({
  __esModule: true,
  default: {
    getUserProfile: jest.fn(() => Promise.resolve({})),
    apiRequest: jest.fn(() => Promise.resolve({ data: [] })),
    getPersonalGrowthSummary: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

jest.mock('../../src/services/analyticsService', () => ({
  __esModule: true,
  default: {
    getAnalyticsData: jest.fn(() => Promise.resolve({})),
    trackEvent: jest.fn(),
  },
}));

global.fetch = jest.fn();

describe('SandboxDataService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Basic Functionality', () => {
    it('is properly exported', () => {
      expect(SandboxDataService).toBeDefined();
    });

    it('has required methods', () => {
      expect(typeof SandboxDataService.getComprehensiveUserData).toBe('function');
      expect(typeof SandboxDataService.generateNodes).toBe('function');
      expect(typeof SandboxDataService.enhanceNodeWithUserData).toBe('function');
      expect(typeof SandboxDataService.detectNodeConnections).toBe('function');
      expect(typeof SandboxDataService.saveSandboxSession).toBe('function');
      expect(typeof SandboxDataService.loadSandboxSessions).toBe('function');
    });
  });

  describe('Node Position Generation', () => {
    it('generates positions within canvas bounds', () => {
      const canvasWidth = 400;
      const canvasHeight = 300;
      const existingNodes: any[] = [];

      const position = SandboxDataService.generateNodePosition(
        canvasWidth,
        canvasHeight,
        existingNodes
      );

      expect(position.x).toBeGreaterThanOrEqual(60); // margin
      expect(position.x).toBeLessThanOrEqual(340); // width - margin
      expect(position.y).toBeGreaterThanOrEqual(60); // margin
      expect(position.y).toBeLessThanOrEqual(240); // height - margin
    });

    it('generates different positions for multiple calls', () => {
      const canvasWidth = 400;
      const canvasHeight = 300;
      const existingNodes: any[] = [];

      const position1 = SandboxDataService.generateNodePosition(canvasWidth, canvasHeight, existingNodes);
      const position2 = SandboxDataService.generateNodePosition(canvasWidth, canvasHeight, existingNodes);

      // Due to randomness, positions should likely be different
      expect(position1).not.toEqual(position2);
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await SandboxDataService.generateNodes('test query');

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('handles authentication errors', async () => {
      // Mock no token
      require('../../src/services/cloudAuth').default.getInstance.mockReturnValue({
        getToken: jest.fn(() => null),
      });

      const result = await SandboxDataService.generateNodes('test query');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });
  });

  describe('Connection Analysis', () => {
    it('calculates node relevance correctly', async () => {
      const mockNodes = [
        { 
          id: '1', 
          title: 'Node 1', 
          content: 'growth mindset learning', 
          category: 'personal',
          personalHook: 'test hook' 
        },
        { 
          id: '2', 
          title: 'Node 2', 
          content: 'mindset growth patterns', 
          category: 'personal',
          personalHook: 'another hook' 
        },
        { 
          id: '3', 
          title: 'Node 3', 
          content: 'different topic entirely', 
          category: 'technical',
          personalHook: null 
        },
      ];

      // Mock AI analysis to fail so we use local analysis
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      const connections = await SandboxDataService.detectNodeConnections(mockNodes);

      expect(Array.isArray(connections)).toBe(true);
      expect(connections.length).toBeGreaterThan(0);

      // Check that connections have proper structure
      connections.forEach(connection => {
        expect(connection).toHaveProperty('from');
        expect(connection).toHaveProperty('to');
        expect(connection).toHaveProperty('relevance');
        expect(connection).toHaveProperty('connectionType');
        expect(typeof connection.relevance).toBe('number');
        expect(connection.relevance).toBeGreaterThan(0);
        expect(connection.relevance).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('User Data Management', () => {
    it('returns fallback data on service errors', async () => {
      // Mock all services to fail
      require('../../src/services/analyticsService').default.getAnalyticsData.mockRejectedValue(
        new Error('Service error')
      );

      const result = await SandboxDataService.getComprehensiveUserData();

      expect(result).toMatchObject({
        ubpmData: {},
        behavioralMetrics: null,
        emotionalProfile: {},
        conversationHistory: [],
        metadata: expect.objectContaining({
          sources: ['fallback'],
          dataCompleteness: 10,
        }),
      });
    });
  });

  describe('Session Management', () => {
    it('handles session save failures gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const sessionData = {
        nodes: [],
        lockedNodes: [],
        connections: [],
        userQuery: 'test',
        timestamp: new Date().toISOString(),
      };

      const result = await SandboxDataService.saveSandboxSession(sessionData);
      expect(result).toBe(false);
    });

    it('handles session load failures gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await SandboxDataService.loadSandboxSessions();
      expect(result).toEqual([]);
    });
  });
});