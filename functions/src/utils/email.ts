import sgMail from '@sendgrid/mail';
import { getSecret } from './secrets';

let initialized = false;

export async function initSendGrid() {
  if (initialized) return;
  const key = await getSecret('SENDGRID_API_KEY');
  sgMail.setApiKey(key);
  initialized = true;
}

export async function sendMail({ to, from, subject, html, headers }:{ to:string; from:string; subject:string; html:string; headers?:Record<string,string> }) {
  await initSendGrid();
  const [res] = await sgMail.send({ to, from, subject, html, headers } as any);
  return (res.headers['x-message-id'] as string) || (res.headers['x-sendgrid-message-id'] as string) || '';
}