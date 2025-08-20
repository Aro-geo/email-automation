import { onCall } from 'firebase-functions/v2/https';
import { db, Timestamp } from '../utils/firestore';
import { logger } from 'firebase-functions';

export const scheduleCampaign = onCall(async (req) => {
  try {
    // Extract and validate data
    const { campaignId, scheduleAt } = req.data as { campaignId: string; scheduleAt?: string | number };
    
    if (!campaignId) {
      throw new Error('Missing required parameter: campaignId');
    }
    
    // Get campaign reference
    const ref = db.doc(`campaigns/${campaignId}`);
    const doc = await ref.get();
    
    if (!doc.exists) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }
    
    // Convert scheduleAt to Firestore Timestamp
    const at = scheduleAt ? Timestamp.fromDate(new Date(scheduleAt)) : Timestamp.now();
    
    // Update campaign status
    await ref.update({ 
      status: 'scheduled', 
      scheduleAt: at,
      updatedAt: Timestamp.now()
    });
    
    logger.info(`Campaign ${campaignId} scheduled for ${at.toDate().toISOString()}`);
    
    return { 
      success: true, 
      campaignId,
      scheduledAt: at.toDate().toISOString() 
    };
  } catch (error) {
    logger.error('Error scheduling campaign:', error);
    throw new Error(`Failed to schedule campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});