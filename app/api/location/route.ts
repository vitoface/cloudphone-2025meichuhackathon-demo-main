// app/api/location/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 嘗試從 headers 中取得真實 IP，解決 itel 等手機雲端瀏覽器代理問題
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const operaIp = request.headers.get('x-opera-mini-phone-ip');

  // 依序優先取用代理伺服器傳遞的真實 IP (取字串中的第一個 IP)
  const clientIp = operaIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : '') || realIp || '';

  // 構建 ipapi.co 請求 URL。如果有抓到特定 IP，就查該 IP；否則查伺服器自己看到的來源 IP
  const apiUrl = clientIp
    ? `https://ipapi.co/${clientIp}/json/`
    : 'https://ipapi.co/json/';

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error('外部 API 連線失敗');
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: true, reason: '無法連線至外部 IP 定位服務' },
      { status: 500 }
    );
  }
}