import type { RuntimeEnv } from '../cloudflare-context';
import { signAwsRequest } from './aws-sigv4';
import { renderMagicLinkEmail } from './templates';

export interface SendMagicLinkInput {
  toEmail: string;
  loginUrl: string;
}

export interface SendEmailResult {
  messageId: string;
  status: 'sent' | 'mocked';
}

export interface MailSink {
  record(message: { to: string; subject: string; text: string; html: string }): void;
  getSent(): Array<{ to: string; subject: string; text: string; html: string }>;
  clear(): void;
}

class LocalMailSink implements MailSink {
  private messages: Array<{ to: string; subject: string; text: string; html: string }> = [];

  record(message: { to: string; subject: string; text: string; html: string }) {
    this.messages.push(message);
  }

  getSent() {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }
}

export const defaultLocalMailSink: MailSink = new LocalMailSink();

export async function sendMagicLink(
  env: RuntimeEnv,
  input: SendMagicLinkInput,
  sink: MailSink = defaultLocalMailSink
): Promise<SendEmailResult> {
  const { subject, text, html } = renderMagicLinkEmail({ loginUrl: input.loginUrl });

  // In local or test environments, record to local sink and DO NOT hit AWS SES
  if (env.APP_ENV === 'local' || env.APP_ENV === 'test') {
    sink.record({
      to: input.toEmail,
      subject,
      text,
      html,
    });
    return {
      messageId: `mock-msg-${Date.now()}`,
      status: 'mocked',
    };
  }

  // Production and Dev cloud environments enforce real SES credentials
  if (!env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials missing for SES delivery in non-local environment');
  }

  const host = `email.${env.SES_REGION}.amazonaws.com`;
  const sender = env.SES_SENDER_EMAIL || 'noreply@foxwords.net';

  const form = new URLSearchParams();
  form.set('Action', 'SendEmail');
  form.set('Version', '2010-12-01');
  form.set('Source', sender);
  form.set('Destination.ToAddresses.member.1', input.toEmail);
  form.set('Message.Subject.Data', subject);
  form.set('Message.Subject.Charset', 'UTF-8');
  form.set('Message.Body.Text.Data', text);
  form.set('Message.Body.Text.Charset', 'UTF-8');
  form.set('Message.Body.Html.Data', html);
  form.set('Message.Body.Html.Charset', 'UTF-8');

  const body = form.toString();
  const query = new URLSearchParams();

  const headers = await signAwsRequest({
    method: 'POST',
    service: 'ses',
    region: env.SES_REGION,
    host,
    path: '/',
    query,
    body,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    now: new Date(),
  });

  const response = await fetch(`https://${host}/`, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SES SendEmail failed (status ${response.status}): ${errorText}`);
  }

  const responseText = await response.text();
  const startTag = '<MessageId>';
  const endTag = '</MessageId>';
  const startIdx = responseText.indexOf(startTag);
  const endIdx = responseText.indexOf(endTag);
  const messageId =
    startIdx !== -1 && endIdx !== -1
      ? responseText.substring(startIdx + startTag.length, endIdx)
      : `ses-${Date.now()}`;

  return {
    messageId,
    status: 'sent',
  };
}
