import { NextApiRequest, NextApiResponse } from 'next'
import { apiResponse } from '../../src/lib/auth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return apiResponse(res, 405, null, `Method ${req.method} Not Allowed`)
  }

  return apiResponse(res, 200, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  })
} 