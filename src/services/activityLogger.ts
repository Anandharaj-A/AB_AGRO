import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { ActivityLog, AppUser } from '../types';

export const logActivity = async (
  user: AppUser | null,
  action: ActivityLog['action'],
  module: ActivityLog['module'],
  summary: string,
  entityId?: string,
  entityName?: string
) => {
  try {
    const logData = {
      action,
      module,
      summary,
      entityId: entityId || '',
      entityName: entityName || '',
      performedByUid: user?.uid || 'anonymous',
      performedByName: user?.name || 'Unknown',
      performedByEmail: user?.email || '',
      performedByRole: user?.role || 'viewer',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, 'activity_logs'), logData);
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};
