import Redis from 'ioredis';

// Redis connection config
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
  // Enable reconnect attempts
  maxRetriesPerRequest: 3,
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  }
};

// Initialize Redis client with graceful error handling
let redisClient: Redis;

try {
  redisClient = new Redis(REDIS_CONFIG);
  
  // Log Redis connection events
  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
} catch (error) {
  console.error('Failed to initialize Redis:', error);
  // Fallback to a mock Redis implementation
  redisClient = {
    get: async () => null,
    set: async () => 'OK',
    del: async () => 1,
    flushall: async () => 'OK',
  } as unknown as Redis;
}

// Cache TTL in seconds
const DEFAULT_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL || '300');

// Cache operations
export const redisCache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, ttl = DEFAULT_CACHE_TTL): Promise<boolean> {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  /**
   * Clear all cache (be careful!)
   */
  async clear(): Promise<boolean> {
    try {
      await redisClient.flushall();
      return true;
    } catch (error) {
      console.error('Redis clear error:', error);
      return false;
    }
  },

  /**
   * Get cached data or fetch from source and cache the result
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = DEFAULT_CACHE_TTL
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.get<T>(key);
    if (cachedData) return cachedData;

    // If not in cache, fetch fresh data
    const freshData = await fetchFn();
    
    // Store in cache for next time
    await this.set(key, freshData, ttl);
    
    return freshData;
  }
}; 