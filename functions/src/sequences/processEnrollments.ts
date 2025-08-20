import { onRequest } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';
import { logger } from 'firebase-functions';

export const processEnrollments = onRequest(async (req, res) => {
  try {
    const now = Timestamp.now();
    logger.info('Processing sequence enrollments due before', now.toDate());
    
    const qs = await db.collection('sequenceEnrollments')
      .where('state', '==', 'active')
      .where('nextRunAt', '<=', now)
      .limit(100)
      .get();
    
    logger.info(`Found ${qs.size} enrollments to process`);
    
    if (qs.empty) {
      res.status(200).send('No enrollments to process');
      return;
    }
    
    const writer = db.bulkWriter();
    for (const d of qs.docs) {
      writer.update(d.ref, { 
        state: 'done', 
        updatedAt: now,
        processedAt: now
      });
    }
    
    await writer.close();
    logger.info(`Successfully processed ${qs.size} enrollments`);
    res.status(200).send(`Processed ${qs.size} enrollments`);
  } catch (error) {
    logger.error('Error processing enrollments:', error);
    res.status(500).send('Error processing enrollments');
  }
});