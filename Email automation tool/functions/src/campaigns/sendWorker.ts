import { onRequest } from 'firebase-functions/v2/https';
import { db } from '../utils/firestore';
import { initSendGrid, sendMail } from '../utils/email';
import Handlebars from 'handlebars';

function region() { return process.env.GCLOUD_LOCATION || 'us-central1'; }
function projectId() {
  const cfg = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : undefined;
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || cfg?.projectId || '';
}
function trackingBase() { return `https://${region()}-${projectId()}.cloudfunctions.net`; }

function renderTemplate(html: string, vars: any) {
  const tpl = Handlebars.compile(html || '');
  return tpl(vars || {});
}

function withTracking(html: string, sendId: string) {
  const pixel = `<img src="${trackingBase()}/trackOpen?sid=${encodeURIComponent(sendId)}" width="1" height="1"/>`;
  return `${html}\n${pixel}`;
}

export const sendWorker = onRequest(async (req, res) => {
  const { sendId } = req.body as any;
  if (!sendId) { res.status(400).send('missing sendId'); return; }

  const sendSnap = await db.doc(`campaignSends/${sendId}`).get();
  if (!sendSnap.exists) { res.status(404).send('not found'); return; }
  const send = sendSnap.data() as any;

  const tplSnap = await db.doc(`templates/${send.templateId}`).get();
  if (!tplSnap.exists) { res.status(400).send('template missing'); return; }
  const tpl = tplSnap.data() as any;

  const html = renderTemplate(tpl.html, send.mergeVars || {});
  const finalHtml = withTracking(html, sendId);
  const subject = tpl.subject || '';
  const from = send.from || process.env.FROM_EMAIL || 'no-reply@example.com';

  await initSendGrid();
  const messageId = await sendMail({
    to: send.to,
    from,
    subject,
    html: finalHtml,
    headers: { 'X-Campaign-Id': send.campaignId, 'X-Send-Id': sendId }
  });

  await sendSnap.ref.update({ state: 'sent', messageId });
  res.status(200).send('sent');
});