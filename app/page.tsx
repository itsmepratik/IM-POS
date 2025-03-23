import HomePage from './home/page'

// Re-export the home page component for the root route
export default HomePage

// Keep the same cache configuration
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'force-cache' 