import { onRequest } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';
import { EventWebhook } from '@sendgrid/eventwebhook';

export const webhookSendgrid = onRequest(async (req, res) => {
  const signature = req.header('x-twilio-email-event-webhook-signature') as string;
  const timestamp = req.header('x-twilio-email-event-webhook-timestamp') as string;
  const { signingKey } = (await db.doc('webhooks/sendgrid').get()).data() || {} as any;

  if (!signingKey || !signature || !timestamp) {
    res.status(401).send('unauthorized');
    return;
  }

  const verifier = new EventWebhook();
  const payload = (req.rawBody || Buffer.from(JSON.stringify(req.body))) as Buffer;
  // Convert stored public key to ECDSA format and verify signature with correct arg order
  const ec = verifier.convertPublicKeyToECDSA(signingKey);
  const valid = verifier.verifySignature(ec, payload, signature, timestamp);
  if (!valid) {
    res.status(401).send('invalid');
    return;
  }

  const events = Array.isArray(req.body) ? req.body : [];
  const writer = db.bulkWriter();
  for (const e of events) {
    const ts = e.timestamp ? Timestamp.fromMillis(Number(e.timestamp) * 1000) : Timestamp.now();
    const data: any = {
      type: e.event,
      messageId: e.sg_message_id || e['sg_message_id'] || '',
      url: e.url || null,
      ts
    };
    const evRef = db.collection('events').doc();
    writer.set(evRef, data);

    if (data.messageId) {
      const qs = await db.collection('campaignSends').where('messageId', '==', data.messageId).limit(1).get();
      if (!qs.empty) {
        const send = qs.docs[0];
        if (e.event === 'bounce' || e.event === 'spamreport' || e.event === 'unsubscribe') {
          writer.update(db.doc(`contacts/${send.data().contactId}`), { status: 'unsubscribed', lastActivityAt: ts });
        }
      }
    }
  }
  await writer.close();
  res.status(200).send('ok');
});