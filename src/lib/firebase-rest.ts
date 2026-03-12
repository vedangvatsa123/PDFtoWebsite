/**
 * Server-side Firebase Firestore data fetching via REST API.
 * Used in server components where the Firebase client SDK is unavailable.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

interface FirestoreField {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields: Record<string, FirestoreField> };
  arrayValue?: { values?: FirestoreField[] };
}

interface FirestoreDoc {
  name: string;
  fields: Record<string, FirestoreField>;
}

interface FirestoreListResponse {
  documents?: FirestoreDoc[];
}

function decodeField(field: FirestoreField): unknown {
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  if (field.nullValue !== undefined) return null;
  if (field.mapValue) return decodeFields(field.mapValue.fields);
  if (field.arrayValue) return (field.arrayValue.values ?? []).map(decodeField);
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreField>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    result[key] = decodeField(val);
  }
  return result;
}

async function fetchDoc(path: string): Promise<Record<string, unknown> | null> {
  const url = `${BASE_URL}/${path}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const doc: FirestoreDoc = await res.json();
    if (!doc.fields) return null;
    return decodeFields(doc.fields);
  } catch {
    return null;
  }
}

async function fetchCollection(path: string): Promise<Array<Record<string, unknown> & { id: string }>> {
  const url = `${BASE_URL}/${path}`;
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const body: FirestoreListResponse = await res.json();
    return (body.documents ?? []).map(doc => {
      const id = doc.name.split('/').pop() ?? '';
      return { ...decodeFields(doc.fields ?? {}), id };
    });
  } catch {
    return [];
  }
}

export interface ServerProfileData {
  profile: {
    userId: string;
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    summary: string;
    themeId?: string;
    slug: string;
    avatarUrl?: string;
    avatarHint?: string;
    website?: string;
    viewCount?: number;
  };
  workExperience: Array<{
    id: string;
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: Array<{ id: string; name: string }>;
}

export async function getProfileBySlug(slug: string): Promise<ServerProfileData | null> {
  const slugDoc = await fetchDoc(`userProfilesBySlug/${slug}`);
  if (!slugDoc) return null;

  const userId = slugDoc.userId as string;
  if (!userId) return null;

  const [profile, workExperience, education, skills] = await Promise.all([
    fetchDoc(`users/${userId}/userProfile/${userId}`),
    fetchCollection(`users/${userId}/workExperience`),
    fetchCollection(`users/${userId}/education`),
    fetchCollection(`users/${userId}/skills`),
  ]);

  if (!profile) return null;

  return {
    profile: profile as ServerProfileData['profile'],
    workExperience: workExperience as ServerProfileData['workExperience'],
    education: education as ServerProfileData['education'],
    skills: skills as ServerProfileData['skills'],
  };
}
