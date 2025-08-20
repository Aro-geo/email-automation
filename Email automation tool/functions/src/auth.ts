import { onUserCreated } from 'firebase-functions/v2/identity';
import { db, Timestamp } from './utils/firestore';

export const createUserProfile = onUserCreated(async (event) => {
  const user = event.data;
  await db.doc(`users/${user.uid}`).set({
    displayName: user.displayName || '',
    email: user.email || '',
    photoURL: user.photoURL || '',
    role: 'user',
    createdAt: Timestamp.now()
  }, { merge: true });
});