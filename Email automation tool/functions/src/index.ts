// Firebase Cloud Functions - Email Automation SaaS
// Main entry point exporting all function endpoints

// Campaign management functions
export { scheduleCampaign } from './campaigns/scheduleCampaign';
export { enqueueSends } from './campaigns/enqueueSends';
export { sendWorker } from './campaigns/sendWorker';
export { trackOpen } from './campaigns/trackOpen';
export { trackClick } from './campaigns/trackClick';
export { webhookSendgrid } from './campaigns/webhookSendgrid';

// Sequence automation functions
export { processEnrollments } from './sequences/processEnrollments';

// Authentication functions
export { createUserProfile } from './auth';
