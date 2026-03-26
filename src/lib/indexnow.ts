/**
 * IndexNow — Notify Bing, Yandex, and other engines of URL changes.
 * https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = '6db32ca940dd46cab89375c221953bd6';
const SITE_HOST = 'cvin.bio';

export async function submitToIndexNow(urls: string | string[]): Promise<void> {
  const urlList = Array.isArray(urls) ? urls : [urls];
  if (urlList.length === 0) return;

  try {
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });

    if (res.ok || res.status === 202) {
      console.log(`IndexNow: submitted ${urlList.length} URL(s)`);
    } else {
      console.error(`IndexNow: HTTP ${res.status}`);
    }
  } catch (err) {
    // Best-effort — never block the main request
    console.error('IndexNow error:', err);
  }
}
