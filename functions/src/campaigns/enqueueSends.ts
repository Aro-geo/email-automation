import { onRequest } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';
import { createTaskToFunction } from '../utils/tasks';

async function getContactsForLists(listIds: string[]) {
  const ids = new Set<string>();
  for (const listId of listIds || []) {
    const q = await db.collection(`lists/${listId}/members`).get();
    for (const d of q.docs) ids.add(d.id);
  }
  const contacts: any[] = [];
  for (const id of ids) {
    const snap = await db.doc(`contacts/${id}`).get();
    if (snap.exists) contacts.push({ id: snap.id, ...(snap.data() as any) });
  }
  return contacts;
}

export const enqueueSends = onRequest(async (req, res) => {
  const now = Timestamp.now();
  const qs = await db.collection('campaigns')
    .where('status', '==', 'scheduled')
    .where('scheduleAt', '<=', now)
    .get();

  for (const snap of qs.docs) {
    const campaign = snap.data() as any;
    const contacts = await getContactsForLists(campaign.listId || []);
    const writer = db.bulkWriter();
    for (const c of contacts) {
      const sendRef = db.collection('campaignSends').doc();
      writer.set(sendRef, {
        orgId: campaign.orgId,
        campaignId: snap.id,
        contactId: c.id,
        to: c.email,
        templateId: campaign.templateId,
        state: 'queued',
        scheduledFor: now
      });
      await createTaskToFunction('sendWorker', { sendId: sendRef.id });
    }
    await writer.close();
    await snap.ref.update({ status: 'sending' });
  }

  res.status(200).send('OK');
});