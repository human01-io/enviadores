import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Debugging logs
  console.log(`Incoming ${req.method} request from origin:`, req.headers.origin);
  
  // Set CORS headers - must be set before any response
  const allowedOrigins = [
    'https://miniature-space-bassoon-r5r6gwp9jg525qj5-5173.app.github.dev',
    'https://*.app.github.dev',
    'https://*.github.dev',
    'http://localhost:5173'
  ];

  const origin = req.headers.origin || '';
  if (allowedOrigins.some(o => origin.includes(o.replace('*', '')))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight');
    res.status(204).end();
    return; // Return without value to avoid the warning
  }

  // Handle POST request
  if (req.method === 'POST') {
    console.log('Forwarding POST request to PHP endpoint');
    try {
      // Replace with your actual PHP endpoint URL
      const phpEndpoint = 'https://enviadores.com.mx/api/report-outdated.php';
      
      const response = await fetch(phpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      // Get the response from PHP
      const responseText = await response.text();
      console.log('PHP response:', responseText);
      
      // Try to parse as JSON
      try {
        const result = JSON.parse(responseText);
        res.status(response.ok ? 200 : 500).json(result);
      } catch (parseError) {
        console.error('Failed to parse PHP response as JSON:', parseError);
        res.status(500).json({ 
          success: false, 
          error: 'Invalid response from server', 
          raw: process.env.NODE_ENV === 'development' ? responseText : undefined 
        });
      }
    } catch (error) {
      console.error('API forwarding error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to process request',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
      });
    }
    return; // Return without value
  }

  res.status(405).json({ error: 'Method not allowed' });
}