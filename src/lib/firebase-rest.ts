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

async function fetchDoc(path: string, noCache = false): Promise<Record<string, unknown> | null> {
  const url = `${BASE_URL}/${path}`;
  try {
    const fetchOptions = noCache ? { cache: 'no-store' as const } : { next: { revalidate: 10 } };
    const res = await fetch(url, fetchOptions);
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
    const res = await fetch(url, { next: { revalidate: 10 } });
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
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
    themeId?: string;
    slug: string;
    avatarUrl?: string;
    avatarHint?: string;
    website?: string;
    viewCount?: number;
    skills?: string[];
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
  customSections: Array<{
    id: string;
    sectionTitle: string;
    items: Array<{ id: string; title: string; subtitle?: string; description?: string; date?: string }>;
    order: number;
  }>;
}

export async function getProfileBySlug(slug: string): Promise<ServerProfileData | null> {
  // Slug lookup: slugs/{slug} → {userId}
  const slugDoc = await fetchDoc(`slugs/${slug}`, true);
  if (!slugDoc) return null;

  const userId = slugDoc.userId as string;
  if (!userId) return null;

  // Profile lives directly on users/{userId}
  const [profile, workExperience, education, customSections] = await Promise.all([
    fetchDoc(`users/${userId}`),
    fetchCollection(`users/${userId}/workExperience`),
    fetchCollection(`users/${userId}/education`),
    fetchCollection(`users/${userId}/customSections`),
  ]);

  if (!profile) return null;

  const safeProfile: ServerProfileData['profile'] = {
    userId: (profile.userId as string) || userId,
    fullName: (profile.fullName as string) || 'Professional Profile',
    slug: (profile.slug as string) || slug,
    email: profile.email as string | undefined,
    phone: profile.phone as string | undefined,
    location: profile.location as string | undefined,
    summary: profile.summary as string | undefined,
    themeId: (profile.themeId as string) || 'modern-creative',
    avatarUrl: profile.avatarUrl as string | undefined,
    avatarHint: profile.avatarHint as string | undefined,
    website: profile.website as string | undefined,
    viewCount: profile.viewCount as number | undefined,
    skills: (profile.skills as string[]) || [],
  };

  return {
    profile: safeProfile,
    workExperience: workExperience as ServerProfileData['workExperience'],
    education: education as ServerProfileData['education'],
    customSections: (customSections as ServerProfileData['customSections']).sort((a, b) => a.order - b.order),
  };
}
