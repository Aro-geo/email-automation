import { onRequest } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';

export const trackClick = onRequest(async (req, res) => {
  const sid = (req.query.sid as string) || '';
  const url = (req.query.url as string) || '';
  if (sid && url) {
    await db.collection('events').add({ type: 'click', sendId: sid, url, ts: Timestamp.now() });
  }
  res.redirect(url || '/');
});