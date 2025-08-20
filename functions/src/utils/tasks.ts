import { CloudTasksClient } from '@google-cloud/tasks';

const client = new CloudTasksClient();

function projectId(): string {
  const cfg = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : undefined;
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || cfg?.projectId || '';
}

function region(): string {
  return process.env.GCLOUD_LOCATION || 'us-central1';
}

function baseUrl(): string {
  return `https://${region()}-${projectId()}.cloudfunctions.net`;
}

export async function createTaskToFunction(functionName: string, payload: object, scheduleTime?: Date) {
  const queue = process.env.EMAIL_TASKS_QUEUE || 'email-sends';
  const parent = client.queuePath(projectId(), region(), queue);
  const body = Buffer.from(JSON.stringify(payload)).toString('base64');
  const task: any = {
    httpRequest: {
      httpMethod: 'POST',
      url: `${baseUrl()}/${functionName}`,
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  };
  if (scheduleTime) {
    task.scheduleTime = { seconds: Math.floor(scheduleTime.getTime() / 1000) };
  }
  const [resp] = await client.createTask({ parent, task });
  return resp.name;
}