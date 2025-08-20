import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

function projectId(): string {
  const cfg = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : undefined;
  return process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || cfg?.projectId || '';
}

export async function getSecret(name: string): Promise<string> {
  const pid = projectId();
  const [version] = await client.accessSecretVersion({ name: `projects/${pid}/secrets/${name}/versions/latest` });
  const payload = version.payload?.data?.toString();
  if (!payload) throw new Error(`Secret ${name} not found or empty`);
  return payload;
}
