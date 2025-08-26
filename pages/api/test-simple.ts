import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Simple test endpoint called');
  
  res.status(200).json({
    message: 'Simple test endpoint working',
    timestamp: new Date().toISOString()
  });
} 