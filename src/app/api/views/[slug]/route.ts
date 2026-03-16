
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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    // Slug lookup: slugs/{slug} → {userId}
    const slugRef = db.collection('slugs').doc(slug);
    const slugDoc = await slugRef.get();

    if (!slugDoc.exists) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { userId } = slugDoc.data() as { userId: string };
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found for slug' }, { status: 500 });
    }

    // Profile lives directly on users/{userId}
    const profileRef = db.collection('users').doc(userId);

    // Date key in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().slice(0, 10);
    const dailyViewRef = db.collection('users').doc(userId).collection('dailyViews').doc(today);

    // Batch: increment total + daily count atomically
    const batch = db.batch();
    batch.update(profileRef, { viewCount: FieldValue.increment(1) });
    batch.set(dailyViewRef, { date: today, views: FieldValue.increment(1) }, { merge: true });
    await batch.commit();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Failed to increment view count.', details: errorMessage }, { status: 500 });
  }
}
