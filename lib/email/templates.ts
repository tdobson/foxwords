function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function renderMagicLinkEmail(params: { loginUrl: string }): {
  subject: string;
  text: string;
  html: string;
} {
  // Validate that loginUrl is a valid absolute URL
  const parsedUrl = new URL(params.loginUrl);
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`Invalid magic link URL scheme: ${parsedUrl.protocol}`);
  }

  const subject = 'Your Foxwords Login Link';
  const rawUrl = parsedUrl.toString();
  const escapedUrl = escapeHtml(rawUrl);

  // Strict humanized, clean plain text without raw markdown markers
  const text = [
    'Hello,',
    '',
    'Click the link below to sign in to Foxwords and manage your child profiles:',
    '',
    rawUrl,
    '',
    'This link is valid for 15 minutes and can only be used once.',
    '',
    'If you did not request this login link, you can safely ignore this email.',
    '',
    'Best wishes,',
    'Tim Dobson & The Foxwords Team',
  ].join(String.fromCharCode(10));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #212529; padding: 24px;">
  <h2 style="color: #2b8a3e; margin-bottom: 16px;">Welcome to Foxwords</h2>
  <p>Click the button below to sign in and access your family learning setup:</p>
  <p style="margin: 24px 0;">
    <a href="${escapedUrl}" style="background-color: #2b8a3e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
      Sign in to Foxwords
    </a>
  </p>
  <p style="font-size: 14px; color: #495057;">Or copy and paste this link into your browser:</p>
  <p style="font-size: 14px; color: #228be6; word-break: break-all;">${escapedUrl}</p>
  <hr style="border: 0; border-top: 1px solid #dee2e6; margin: 24px 0;" />
  <p style="font-size: 12px; color: #868e96;">This link expires in 15 minutes and can only be used once. If you did not request it, you can safely ignore this message.</p>
</body>
</html>`;

  return { subject, text, html };
}
