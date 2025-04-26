import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API handler for reporting outdated delivery information
 * This forwards the request to the PHP backend endpoint
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers to allow requests from various environments
  const allowedOrigins = [
    'https://miniature-space-bassoon-r5r6gwp9jg525qj5-5173.app.github.dev',
    'https://*.app.github.dev',
    'https://*.github.dev',
    'http://localhost:5173',
    'https://app.enviadores.com.mx',
    'https://enviadores.com.mx'
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
    res.status(204).end();
    return;
  }

  // Handle POST request
  if (req.method === 'POST') {
    try {
      // The PHP endpoint to forward the request to
      const phpEndpoint = 'https://enviadores.com.mx/api/report-outdated.php';
      
      // Forward the request to the PHP endpoint
      const response = await fetch(phpEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
      
      // Get the response from PHP
      const responseText = await response.text();
      
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
    return;
  }

  // Any other method is not allowed
  res.status(405).json({ error: 'Method not allowed' });
}