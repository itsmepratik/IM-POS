import { createSupabaseServer } from '@supabase/mcp-connector';
import dotenv from 'dotenv';
import path from 'path';

// Windows-specific environment loading
const envPath = path.resolve(process.env.USERPROFILE, 'project1.env');
dotenv.config({ path: envPath });

const server = createSupabaseServer({
  supabaseUrl: "https://putvnnpptgiupfsohggq.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHZubnBwdGdpdXBmc29oZ2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg2ODUxMzQsImV4cCI6MjA1NDI2MTEzNH0.i4x7TVrZo2gqIInWS-0uBJNxNWlnoItM0YmypbrpIw4",
  scopes: {
    project1: ['select', 'insert'],  
    project2: ['select']
  },
  windowsCompat: true  // Enables Win32 API wrappers
});

// Windows error handling
process.on('uncaughtException', (err) => {
  console.error('Windows PATH Error:', err);
  server.restart();
});

// Explicit port binding for Windows
try {
  server.start(3001, '0.0.0.0');  // Required for Cursor detection
} catch (err) {
  console.error('Port conflict - try 3001-3005');
  process.exit(1);
}
