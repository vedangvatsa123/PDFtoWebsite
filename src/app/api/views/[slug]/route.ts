
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const slugRef = db.collection('userProfilesBySlug').doc(slug);
    const slugDoc = await slugRef.get();

    if (!slugDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { userId } = slugDoc.data() as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found for slug' }, { status: 500 });
    }

    const profileRef = db.collection('users').doc(userId).collection('userProfile').doc(userId);

    await profileRef.update({
      viewCount: FieldValue.increment(1),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to increment view count.', details: errorMessage }, { status: 500 });
  }
}
