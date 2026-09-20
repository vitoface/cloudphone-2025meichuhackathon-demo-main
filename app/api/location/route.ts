// app/api/location/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 嘗試從 headers 中取得真實 IP，解決 itel 等手機雲端瀏覽器代理問題
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const operaIp = request.headers.get('x-opera-mini-phone-ip');

  // 依序優先取用代理伺服器傳遞的真實 IP (取字串中的第一個 IP)
  const clientIp = operaIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '') || realIp || '';

  // 構建 ip-api.com 請求 URL。如果有抓到特定 IP，就查該 IP；否則查伺服器自己看到的來源 IP
  const apiUrl = clientIp
    ? `http://ip-api.com/json/${clientIp}`
    : 'http://ip-api.com/json/';

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error('Failed to connect to external API');
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    // 把真實的錯誤印在終端機 (Terminal) 裡面方便除錯
    console.error('IP API call failed:', error);
    
    // 回傳符合 ip-api.com 格式的錯誤訊息，讓前端能夠一致性地接住
    return NextResponse.json(
      { status: 'fail', message: 'Failed to connect to external IP location service' },
      { status: 500 }
    );
  }
}