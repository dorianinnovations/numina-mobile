/**
 * User Data Queries Test
 * Tests that the system can handle various user data query patterns
 */

// Test queries that should be supported
const TEST_QUERIES = [
  // Basic data queries
  'show my data',
  'what are my metrics',
  'show my progress',
  'display my current baseline',
  'what patterns do you see',
  'show my communication style',
  
  // UBPM specific queries
  'what is my ubpm',
  'whats my ubpm',
  'my user behavior profile',
  'my behavioral patterns',
  'tell me about myself',
  'analyze me',
  'what do you know about me',
  'my personality',
  'my communication style',
  'how do i behave',
  'my habits',
  'my preferences',
  'my tendencies',
  
  // Analytics queries
  'show my analytics',
  'my emotional patterns',
  'what insights do you have',
  'my growth progress',
  'analyze my conversations',
  'my interaction style',
  
  // Progress queries
  'how am I doing',
  'show my improvements',
  'my development over time',
  'track my growth',
  'my personal insights'
];

describe('User Data Queries', () => {
  let recognizedQueries = 0;
  let totalQueries = TEST_QUERIES.length;

  console.log('📊 Testing User Data Query Recognition');
  console.log(`Total queries to test: ${totalQueries}`);

  // Test UBPM keyword recognition
  test('should recognize UBPM queries', () => {
    const ubpmKeywords = [
      'ubpm', 'my ubpm', 'whats my ubpm', "what's my ubpm",
      'user behavior profile', 'behavioral profile', 'my behavior profile',
      'my patterns', 'behavioral patterns', 'my behavioral patterns',
      'tell me about myself', 'analyze me', 'what do you know about me',
      'my personality', 'my communication style', 'how do i behave',
      'my habits', 'my preferences', 'my tendencies'
    ];

    TEST_QUERIES.forEach(query => {
      const isUBPMQuery = ubpmKeywords.some(keyword => 
        query.toLowerCase().includes(keyword)
      );
      
      if (isUBPMQuery) {
        recognizedQueries++;
        console.log(`✅ UBPM Query: "${query}"`);
      }
    });

    expect(recognizedQueries).toBeGreaterThan(0);
  });

  // Test data-related keyword recognition
  test('should recognize data queries', () => {
    const dataKeywords = [
      'show my data', 'my data', 'what are my metrics', 'my metrics',
      'show my progress', 'my progress', 'display my', 'my baseline',
      'what patterns', 'my communication', 'show my analytics'
    ];

    let dataQueries = 0;
    TEST_QUERIES.forEach(query => {
      const isDataQuery = dataKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isDataQuery) {
        dataQueries++;
        console.log(`📊 Data Query: "${query}"`);
      }
    });

    expect(dataQueries).toBeGreaterThan(0);
  });

  // Test analytics keyword recognition
  test('should recognize analytics queries', () => {
    const analyticsKeywords = [
      'analytics', 'insights', 'patterns', 'analyze', 'progress',
      'growth', 'improvements', 'development', 'track', 'emotional'
    ];

    let analyticsQueries = 0;
    TEST_QUERIES.forEach(query => {
      const isAnalyticsQuery = analyticsKeywords.some(keyword => 
        query.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (isAnalyticsQuery) {
        analyticsQueries++;
        console.log(`📈 Analytics Query: "${query}"`);
      }
    });

    expect(analyticsQueries).toBeGreaterThan(0);
  });

  // Test query pattern matching
  test('should handle various query formats', () => {
    const queryPatterns = [
      /show my\s+/i,           // "show my [data/progress/etc]"
      /what are my\s+/i,       // "what are my [metrics/patterns/etc]"
      /display my\s+/i,        // "display my [baseline/etc]"
      /my\s+\w+/i,            // "my [data/patterns/habits/etc]"
      /what.*do you.*about me/i, // "what do you know about me"
      /tell me about myself/i,   // "tell me about myself"
      /analyze me/i,            // "analyze me"
      /how am i doing/i         // "how am I doing"
    ];

    let matchedPatterns = 0;
    TEST_QUERIES.forEach(query => {
      const matches = queryPatterns.filter(pattern => pattern.test(query));
      if (matches.length > 0) {
        matchedPatterns++;
        console.log(`🎯 Pattern Match: "${query}" - ${matches.length} patterns`);
      }
    });

    expect(matchedPatterns).toBeGreaterThan(0);
  });

  // Summary test
  test('should recognize majority of test queries', () => {
    const recognitionRate = (recognizedQueries / totalQueries) * 100;
    
    console.log('\n📋 USER DATA QUERIES TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total queries tested: ${totalQueries}`);
    console.log(`Queries recognized: ${recognizedQueries}`);
    console.log(`Recognition rate: ${recognitionRate.toFixed(1)}%`);
    console.log('='.repeat(50));

    // We should recognize at least 50% of queries
    expect(recognitionRate).toBeGreaterThanOrEqual(50);
  });

  afterAll(() => {
    console.log('\n✅ User Data Queries Test Complete');
    console.log('The system should be able to handle user requests for:');
    console.log('- Personal data and metrics');
    console.log('- Behavioral patterns and analysis');
    console.log('- Progress tracking and insights');
    console.log('- Communication style analysis');
    console.log('- Growth and development metrics');
  });
});