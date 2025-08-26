import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const hfKey = process.env.HF_API_KEY;
  
  console.log('HF_API_KEY exists:', !!hfKey);
  console.log('HF_API_KEY length:', hfKey ? hfKey.length : 0);
  
  res.status(200).json({
    hfKeyExists: !!hfKey,
    hfKeyLength: hfKey ? hfKey.length : 0,
    envKeys: Object.keys(process.env).filter(key => key.includes('HF_'))
  });
} 