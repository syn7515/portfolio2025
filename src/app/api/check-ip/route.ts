import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Get the IP address from headers
  // Check various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  // Extract the first IP from x-forwarded-for (it can contain multiple IPs)
  const ip = forwarded?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown';
  
  // Get the opt-out IP from environment variable
  const optOutIp = process.env.GTM_OPT_OUT_IP;
  
  // Check if the current IP matches the opt-out IP
  const shouldOptOut = optOutIp && ip === optOutIp;
  
  return NextResponse.json({ 
    ip,
    shouldOptOut: !!shouldOptOut 
  });
}

