/**
 * Helper to determine whether to use mock data
 * For development, always returns true to use mock data
 * In production, would typically return false
 */
export const useMockData = (): boolean => {
  // Always return true to use mock data as requested
  return true;

  // In a real app, you might check for environment variables, etc.
  // return process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
}; 