import type { RuntimeEnv } from '../../cloudflare-context';
import { defaultLocalMailSink, sendMagicLink } from '../ses';

describe('SES Magic-Link Mailer', () => {
  beforeEach(() => {
    defaultLocalMailSink.clear();
  });

  it('routes to local test sink in local environment without invoking network', async () => {
    const localEnv: RuntimeEnv = {
      DB: {} as any,
      APP_ENV: 'local',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };

    const res = await sendMagicLink(localEnv, {
      toEmail: 'parent@example.com',
      loginUrl: 'http://localhost:8787/api/auth/verify?token=abc123xyz',
    });

    expect(res.status).toBe('mocked');
    const sent = defaultLocalMailSink.getSent();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('parent@example.com');
    expect(sent[0].subject).toBe('Your Foxwords Login Link');
    expect(sent[0].text).toContain('http://localhost:8787/api/auth/verify?token=abc123xyz');
    expect(sent[0].text).not.toContain('**'); // No raw markdown
    expect(sent[0].html).toContain('Sign in to Foxwords');
  });

  it('fails fast in production environment if AWS credentials are missing', async () => {
    const prodEnv: RuntimeEnv = {
      DB: {} as any,
      APP_ENV: 'production',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'https://game.tdobson.net',
    };

    await expect(
      sendMagicLink(prodEnv, {
        toEmail: 'parent@example.com',
        loginUrl: 'https://game.tdobson.net/api/auth/verify?token=abc',
      })
    ).rejects.toThrow(/AWS credentials missing/);
  });
});
