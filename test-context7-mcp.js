// Test script to demonstrate Context7 MCP server capabilities
// This script shows how the MCP server would be used

import { spawn } from 'child_process';

async function testContext7MCP() {
  console.log('Testing Context7 MCP Server...\n');
  
  // Test 1: Resolve library ID for Next.js
  console.log('1. Testing resolve-library-id for "next.js"');
  
  const resolveProcess = spawn('bunx', ['-y', '@upstash/context7-mcp'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  // Send MCP request to resolve library ID
  const resolveRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "resolve-library-id",
      arguments: {
        libraryName: "next.js"
      }
    }
  };
  
  resolveProcess.stdin.write(JSON.stringify(resolveRequest) + '\n');
  resolveProcess.stdin.end();
  
  resolveProcess.stdout.on('data', (data) => {
    console.log('Response:', data.toString());
  });
  
  resolveProcess.stderr.on('data', (data) => {
    console.error('Error:', data.toString());
  });
  
  resolveProcess.on('close', (code) => {
    console.log(`Process exited with code ${code}\n`);
    
    // Test 2: Get library docs
    console.log('2. Testing get-library-docs for Next.js');
    
    const docsProcess = spawn('bunx', ['-y', '@upstash/context7-mcp'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const docsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get-library-docs",
        arguments: {
          context7CompatibleLibraryID: "/next",
          topic: "routing",
          tokens: 5000
        }
      }
    };
    
    docsProcess.stdin.write(JSON.stringify(docsRequest) + '\n');
    docsProcess.stdin.end();
    
    docsProcess.stdout.on('data', (data) => {
      console.log('Docs Response:', data.toString());
    });
    
    docsProcess.stderr.on('data', (data) => {
      console.error('Docs Error:', data.toString());
    });
    
    docsProcess.on('close', (code) => {
      console.log(`Docs process exited with code ${code}`);
    });
  });
}

// Run the test
testContext7MCP().catch(console.error);