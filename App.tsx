// Import the simplified app
import SimpleApp from './src/SimpleApp';

/**
 * Main App Entry Point
 * 
 * REFACTORED FOR STABILITY:
 * - Uses simplified authentication-first architecture
 * - Eliminates race conditions and token clearing issues
 * - Single source of truth for authentication state
 * - No premature service initialization
 */

const App: React.FC = () => {
  return <SimpleApp />;
};

export default App;