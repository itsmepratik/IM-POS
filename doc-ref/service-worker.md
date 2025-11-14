# Service Worker Documentation

## Overview

The service worker ensures that clients always fetch the latest data and see new features immediately after deployment. It implements intelligent caching strategies to balance performance with freshness.

## Features

### 1. **Network-First Strategy for Dynamic Content**
- All API endpoints (`/api/*`) always fetch fresh from the network
- POS, transactions, inventory, and customer pages always use latest data
- Falls back to cache only if network fails

### 2. **Stale-While-Revalidate for Static Assets**
- Static assets (JS, CSS, images, fonts) use stale-while-revalidate
- Users see cached content immediately while fresh content loads in background
- Ensures performance without sacrificing freshness

### 3. **Automatic Cache Invalidation**
- Cache is automatically cleared when a new version is deployed
- Version-based cache naming ensures old caches are deleted
- No manual cache clearing needed

### 4. **Update Detection**
- Automatically checks for updates every 5 minutes
- Checks for updates when page becomes visible
- Notifies users when updates are available
- Prompts users to update with a toast notification

### 5. **No-Cache for Critical Endpoints**
- Auth endpoints never cached
- Checkout endpoints never cached
- Transaction endpoints never cached

## How It Works

### Caching Strategies

1. **Network-First** (for dynamic content):
   ```
   Try network → If success, cache and return → If fail, try cache → If fail, return error
   ```

2. **Stale-While-Revalidate** (for static assets):
   ```
   Return cached immediately → Fetch fresh in background → Update cache
   ```

3. **Network-Only** (for critical endpoints):
   ```
   Always fetch from network → Never cache
   ```

### Version Management

The service worker uses version-based cache naming:
- Current version: `1.0.0` (defined in `public/sw.js`)
- Cache names: `pos-app-v1.0.0` and `pos-static-v1.0.0`
- When version changes, old caches are automatically deleted

## Updating the Service Worker

### When to Update

Update the service worker version (`SW_VERSION` in `public/sw.js`) when:
- Deploying new features
- Making breaking changes
- Fixing critical bugs
- Changing API endpoints

### How to Update

1. **Update the version number** in `public/sw.js`:
   ```javascript
   const SW_VERSION = "1.0.1"; // Increment this
   ```

2. **Deploy the changes**

3. **The service worker will automatically:**
   - Detect the new version
   - Clear old caches
   - Notify users to update
   - Activate the new version

### Version Numbering

Use semantic versioning:
- **Patch** (1.0.0 → 1.0.1): Bug fixes, minor changes
- **Minor** (1.0.0 → 1.1.0): New features, non-breaking changes
- **Major** (1.0.0 → 2.0.0): Breaking changes

## Usage in Code

### Using the Hook

```typescript
import { useServiceWorker } from "@/hooks/use-service-worker";

function MyComponent() {
  const { isUpdateAvailable, updateServiceWorker, checkForUpdate } = useServiceWorker();

  return (
    <div>
      {isUpdateAvailable && (
        <button onClick={updateServiceWorker}>
          Update Available - Click to Update
        </button>
      )}
      <button onClick={checkForUpdate}>Check for Updates</button>
    </div>
  );
}
```

### Manual Update Functions

The service worker registration exposes global functions:

```typescript
// Force update
window.updateServiceWorker();

// Clear all caches
window.clearServiceWorkerCache();
```

## Testing

### Development

1. Build the app: `npm run build`
2. Start the server: `npm start`
3. Open DevTools → Application → Service Workers
4. Check "Update on reload" to test updates

### Production Testing

1. Deploy with version `1.0.0`
2. Visit the site (service worker installs)
3. Update version to `1.0.1` and deploy
4. Visit the site again (should see update notification)
5. Click "Update Now" (page reloads with new version)

## Troubleshooting

### Service Worker Not Updating

1. **Check version number**: Ensure `SW_VERSION` is incremented
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Unregister old SW**: DevTools → Application → Service Workers → Unregister
4. **Check console**: Look for SW registration errors

### Stale Content Still Showing

1. **Check cache headers**: Ensure API endpoints don't have long cache headers
2. **Verify SW is active**: DevTools → Application → Service Workers
3. **Check network tab**: Ensure requests are going through SW
4. **Force update**: Use `window.updateServiceWorker()`

### Update Notification Not Showing

1. **Check SW registration**: Ensure `ServiceWorkerRegistration` component is loaded
2. **Check console**: Look for SW messages
3. **Verify version change**: Ensure `SW_VERSION` actually changed
4. **Manual check**: Use `window.updateServiceWorker()` in console

## Best Practices

1. **Always increment version** when deploying changes
2. **Test updates** in development before deploying
3. **Monitor console** for SW errors
4. **Use network-first** for all dynamic content
5. **Never cache** authentication or transaction endpoints
6. **Test offline behavior** to ensure graceful degradation

## Configuration

### Customizing Cache Patterns

Edit `public/sw.js` to modify caching behavior:

```javascript
// Add patterns for network-first
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/your-new-endpoint\//,
];

// Add patterns for no-cache
const NO_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/your-critical-endpoint\//,
];
```

### Adjusting Update Check Interval

Change the interval in `public/sw.js`:

```javascript
// Check every 5 minutes (default)
setInterval(async () => {
  // ... update check code
}, 5 * 60 * 1000);
```

## Security Considerations

1. **HTTPS Required**: Service workers only work over HTTPS (or localhost)
2. **Scope**: Service worker scope is limited to its directory and subdirectories
3. **No Sensitive Data**: Never store sensitive data in cache
4. **Cache Limits**: Browsers limit cache size (usually 50-100MB)

## Performance Impact

- **Initial Load**: Slight delay on first visit (SW registration)
- **Subsequent Loads**: Faster due to caching
- **Update Checks**: Minimal impact (runs in background)
- **Cache Size**: Monitor cache size in DevTools

## Support

For issues or questions:
1. Check browser console for errors
2. Check DevTools → Application → Service Workers
3. Verify version number matches deployment
4. Test in incognito mode (no extensions)

