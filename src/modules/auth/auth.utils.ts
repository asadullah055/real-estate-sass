/** Lightweight user-agent parser — no external deps. */
export function parseUserAgent(ua: string): {
  device: string;
  browser: string;
  os: string;
} {
  // Browser
  let browser = 'Unknown Browser';
  if (ua.includes('Edg/'))                              browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/'))                      browser = 'Google Chrome';
  else if (ua.includes('Firefox/'))                     browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Apple Safari';

  // OS
  let os = 'Unknown OS';
  if (ua.includes('Windows NT'))                        os = 'Windows';
  else if (ua.includes('Mac OS X'))                     os = 'macOS';
  else if (ua.includes('Android'))                      os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux'))                        os = 'Linux';

  // Device
  let device = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'Tablet';
  }

  return { device, browser, os };
}
