import { onRequest } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';

const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuMB9o0iVYkAAAAASUVORK5CYII=';

export const trackOpen = onRequest(async (req, res) => {
  const sid = (req.query.sid as string) || '';
  if (sid) {
    await db.collection('events').add({ type: 'open', sendId: sid, ts: Timestamp.now() });
  }
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).send(Buffer.from(PNG_BASE64, 'base64'));
});