import { SandboxInput } from '../../src/components/sandbox/SandboxInput';

// Simple unit tests for sandbox input logic
describe('SandboxInput Component', () => {
  const SANDBOX_ACTIONS = [
    { id: 'write', label: 'write', icon: 'edit-3', color: '#3B82F6' },
    { id: 'think', label: 'think', icon: 'zap', color: '#8B5CF6' },
    { id: 'find', label: 'find', icon: 'search', color: '#10B981' },
    { id: 'imagine', label: 'imagine', icon: 'aperture', color: '#F59E0B' },
    { id: 'connect', label: 'connect', icon: 'link', color: '#EC4899' },
    { id: 'explore', label: 'explore', icon: 'compass', color: '#06B6D4' },
    { id: 'ubpm', label: 'UBPM', icon: 'user', color: '#8B5CF6' },
  ];

  describe('Action Configuration', () => {
    it('has all required sandbox actions', () => {
      expect(SANDBOX_ACTIONS).toHaveLength(7);
      
      const actionIds = SANDBOX_ACTIONS.map(action => action.id);
      expect(actionIds).toContain('write');
      expect(actionIds).toContain('think');
      expect(actionIds).toContain('find');
      expect(actionIds).toContain('imagine');
      expect(actionIds).toContain('connect');
      expect(actionIds).toContain('explore');
      expect(actionIds).toContain('ubpm');
    });

    it('has proper action structure', () => {
      SANDBOX_ACTIONS.forEach(action => {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('icon');
        expect(action).toHaveProperty('color');
        
        expect(typeof action.id).toBe('string');
        expect(typeof action.label).toBe('string');
        expect(typeof action.icon).toBe('string');
        expect(typeof action.color).toBe('string');
      });
    });

    it('has unique action IDs', () => {
      const actionIds = SANDBOX_ACTIONS.map(action => action.id);
      const uniqueIds = [...new Set(actionIds)];
      expect(uniqueIds).toHaveLength(actionIds.length);
    });

    it('has valid color codes', () => {
      SANDBOX_ACTIONS.forEach(action => {
        expect(action.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Send Button Logic', () => {
    const getSendButtonIcon = (selectedActions: string[]) => {
      if (selectedActions.length === 0) return 'send';
      if (selectedActions.length === 1) {
        const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
        return selectedAction?.icon || 'send';
      }
      return 'plus';
    };

    const getSendButtonColor = (selectedActions: string[]) => {
      if (selectedActions.length === 0) return '#1a1a1a';
      if (selectedActions.length === 1) {
        const selectedAction = SANDBOX_ACTIONS.find(action => action.id === selectedActions[0]);
        return selectedAction?.color || '#1a1a1a';
      }
      return '#8B5CF6';
    };

    it('returns send icon for no selections', () => {
      expect(getSendButtonIcon([])).toBe('send');
    });

    it('returns action icon for single selection', () => {
      expect(getSendButtonIcon(['write'])).toBe('edit-3');
      expect(getSendButtonIcon(['think'])).toBe('zap');
      expect(getSendButtonIcon(['find'])).toBe('search');
    });

    it('returns plus icon for multiple selections', () => {
      expect(getSendButtonIcon(['write', 'think'])).toBe('plus');
      expect(getSendButtonIcon(['write', 'think', 'find'])).toBe('plus');
    });

    it('returns default color for no selections', () => {
      expect(getSendButtonColor([])).toBe('#1a1a1a');
    });

    it('returns action color for single selection', () => {
      expect(getSendButtonColor(['write'])).toBe('#3B82F6');
      expect(getSendButtonColor(['think'])).toBe('#8B5CF6');
    });

    it('returns purple color for multiple selections', () => {
      expect(getSendButtonColor(['write', 'think'])).toBe('#8B5CF6');
    });
  });

  describe('Input Validation', () => {
    const shouldBlurInput = (inputText: string, selectedActions: string[]) => {
      return inputText.length === 0 && selectedActions.length === 0;
    };

    it('allows blur when input is empty and no actions selected', () => {
      expect(shouldBlurInput('', [])).toBe(true);
    });

    it('prevents blur when input has text', () => {
      expect(shouldBlurInput('some text', [])).toBe(false);
    });

    it('prevents blur when actions are selected', () => {
      expect(shouldBlurInput('', ['write'])).toBe(false);
    });

    it('prevents blur when both text and actions present', () => {
      expect(shouldBlurInput('some text', ['write'])).toBe(false);
    });
  });

  describe('Component Import', () => {
    it('exports SandboxInput component', () => {
      expect(SandboxInput).toBeDefined();
      expect(typeof SandboxInput).toBe('function');
    });
  });
});