// src/middleware/csp.ts
export const cspMiddleware = async (c: any, next: any) => {
  await next();
  c.header(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' https://telegram.org", // allow Telegram scripts
      "style-src 'self' 'unsafe-inline'", // inline styles masih perlu buat TMA
      "img-src 'self' data: https:", // allow images dari https
      "connect-src 'self' https://api.telegram.org", // allow fetch ke Telegram API
      "frame-ancestors 'self' https://web.telegram.org https://telegram.org", // allow TMA iframe
    ].join("; "),
  );

  c.header("X-Content-Type-Options", "nosniff");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
};
