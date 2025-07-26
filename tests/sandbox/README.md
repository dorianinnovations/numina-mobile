# Sandbox Unit Tests

This directory contains comprehensive unit and integration tests for the Numina Mobile sandbox functionality.

## Test Structure

### Unit Tests
- **SandboxInput.test.tsx** - Tests for the sandbox input component
- **SandboxModalManager.test.tsx** - Tests for the modal manager component  
- **SandboxNodes.test.tsx** - Tests for sandbox node rendering
- **SandboxNodeCanvas.test.tsx** - Tests for node canvas component
- **SandboxDataService.test.ts** - Tests for sandbox data service

### Integration Tests
- **SandboxWorkflow.integration.test.tsx** - End-to-end workflow tests

## Running Tests

### Run All Sandbox Tests
```bash
npm test -- --testPathPattern=tests/sandbox
```

### Run Specific Test Suite
```bash
npm test -- tests/sandbox/SandboxInput.test.tsx
npm test -- tests/sandbox/SandboxModalManager.test.tsx
npm test -- tests/sandbox/SandboxDataService.test.ts
```

### Run Integration Tests Only
```bash
npm test -- tests/sandbox/SandboxWorkflow.integration.test.tsx
```

### Run with Coverage
```bash
npm test -- --coverage --testPathPattern=tests/sandbox
```

### Watch Mode
```bash
npm test -- --watch --testPathPattern=tests/sandbox
```

## Test Categories

### 1. Component Rendering Tests
- Verify components render without crashing
- Test prop handling and state management
- Validate UI element presence and behavior

### 2. Interaction Tests  
- User input handling (text input, action selection)
- Touch/press events and haptic feedback
- Animation triggers and state changes

### 3. Integration Tests
- Complete workflow from input to node generation
- Service integration and API calls
- Error handling and recovery flows

### 4. Performance Tests
- Large dataset handling
- Animation performance
- Memory usage and cleanup

### 5. Edge Case Tests
- Invalid inputs and error conditions
- Network failures and timeouts
- Concurrent operations

## Test Utilities

### Setup
- **setupTests.js** - Test environment configuration
- **jest.config.js** - Jest configuration for sandbox tests

### Mocks
- Expo modules (Haptics, SecureStore, etc.)
- React Native components and APIs
- Network requests and services
- Animation values and timers

### Helpers
- `testUtils.waitForAnimations()` - Wait for animations to complete
- `testUtils.flushAllTimers()` - Advance all timers
- `testUtils.createMockAnimatedValue()` - Create mock animated values

## Coverage Goals

Target coverage metrics:
- **Statements**: >90%
- **Branches**: >85%
- **Functions**: >90%
- **Lines**: >90%

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

### 2. Mocking Strategy
- Mock external dependencies consistently
- Use real implementations for internal logic
- Mock animations and timers for deterministic tests

### 3. Async Testing
- Use `await waitFor()` for async operations
- Properly handle promises and timers
- Test both success and error scenarios

### 4. Component Testing
- Test component interfaces, not implementation details
- Focus on user-visible behavior
- Use semantic queries when possible

## Common Test Patterns

### Testing User Interactions
```typescript
it('handles user input correctly', async () => {
  const { getByDisplayValue } = render(<SandboxInput {...props} />);
  const input = getByDisplayValue('');
  
  fireEvent.changeText(input, 'test input');
  
  expect(props.setInputText).toHaveBeenCalledWith('test input');
});
```

### Testing Async Operations
```typescript
it('processes async operations', async () => {
  const promise = service.generateNodes('query');
  
  await waitFor(() => {
    expect(mockCallback).toHaveBeenCalled();
  });
  
  const result = await promise;
  expect(result.success).toBe(true);
});
```

### Testing Error Handling
```typescript
it('handles errors gracefully', async () => {
  mockService.mockRejectedValue(new Error('Test error'));
  
  const result = await service.operation();
  
  expect(result.success).toBe(false);
  expect(result.error).toContain('Test error');
});
```

## Troubleshooting

### Common Issues

1. **Animation Tests Failing**
   - Ensure fake timers are used
   - Advance timers with `jest.advanceTimersByTime()`
   - Wait for animations with `waitFor()`

2. **Async Test Timeouts**
   - Increase test timeout in jest config
   - Use proper async/await patterns
   - Mock long-running operations

3. **Component Mock Issues**
   - Verify mock setup in setupTests.js
   - Check import paths match component structure
   - Ensure mocks return expected data types

### Debug Tips
- Use `screen.debug()` to inspect rendered components
- Add console.log statements (mocked by default)
- Run tests with `--verbose` for detailed output
- Use `--detectOpenHandles` to find resource leaks

## Contributing

When adding new tests:
1. Follow existing naming conventions
2. Add appropriate mocks for new dependencies
3. Include both positive and negative test cases
4. Update this README if adding new patterns
5. Ensure tests are deterministic and fast

## Related Documentation
- [Jest Testing Framework](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Native Apps](https://reactnative.dev/docs/testing-overview)