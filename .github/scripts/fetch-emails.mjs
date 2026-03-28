import { createSign } from 'crypto';
import { readFileSync } from 'fs';

// Load service account
const sa = JSON.parse(readFileSync('/Users/vedang/Downloads/service-account.json', 'utf8'));

// Create JWT for Google OAuth
function createJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  })).toString('base64url');
  
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(sa.private_key, 'base64url');
  return `${header}.${payload}.${signature}`;
}

// Get access token
async function getToken() {
  const jwt = createJwt(sa);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });
  const data = await res.json();
  return data.access_token;
}

// Fetch all subscribers
async function fetchSubscribers(token) {
  const projectId = sa.project_id;
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscribers?pageSize=300`;
  
  let allEmails = [];
  let pageToken = null;
  
  do {
    const fetchUrl = pageToken ? `${url}&pageToken=${pageToken}` : url;
    const res = await fetch(fetchUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (data.documents) {
      for (const doc of data.documents) {
        const email = doc.fields?.email?.stringValue;
        if (email) allEmails.push(email);
      }
    }
    pageToken = data.nextPageToken || null;
  } while (pageToken);
  
  return allEmails;
}

const token = await getToken();
const emails = await fetchSubscribers(token);
console.log(`Found ${emails.length} subscriber emails:`);
console.log(JSON.stringify(emails, null, 2));

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('/Users/vedang/PDFtoWebsite/.github/scripts/email-list.json', JSON.stringify(emails, null, 2));
console.log('\nSaved to email-list.json');
