#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting Vercel build process...');

try {
  // Build the client (frontend)
  console.log('Building client...');
  execSync('npx vite build --outDir dist', { stdio: 'inherit' });
  
  // Create serverless function with actual server code
  console.log('Creating serverless API...');
  
  // Read the server index file and modify for serverless
  const serverCode = fs.readFileSync(join(__dirname, 'server/index.ts'), 'utf8');
  
  // Create modified version for Vercel
  const vercelServerCode = `
import { VercelRequest, VercelResponse } from '@vercel/node';
${serverCode.replace('app.listen', '// app.listen')}

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
`;

  // Write the serverless function
  fs.writeFileSync(join(__dirname, 'api/index.ts'), vercelServerCode);
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}