// ── CVin.Bio Auto-Fill — Popup Logic ──

const API_BASE = 'https://cvin.bio/api/profile';

const $ = (id) => document.getElementById(id);

// ── Field display labels ──
const FIELD_LABELS = {
  full_name: 'Name',
  email: 'Email',
  phone: 'Phone',
  location: 'Location',
  website: 'Website',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
};

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  const stored = await chrome.storage.local.get(['cvinbio_username', 'cvinbio_profile']);

  if (stored.cvinbio_username && stored.cvinbio_profile) {
    renderConnected(stored.cvinbio_profile);
  }

  $('connect-btn').addEventListener('click', handleConnect);
  $('username-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleConnect();
  });
  $('fill-btn').addEventListener('click', handleFill);
  $('disconnect-btn').addEventListener('click', handleDisconnect);
});

// ── Connect ──
async function handleConnect() {
  const username = $('username-input').value.trim().toLowerCase();
  if (!username) return;

  showStatus('loading', 'Fetching profile...');
  $('connect-btn').disabled = true;

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(username)}`);

    if (!res.ok) {
      showStatus('error', `No profile found for "${username}"`);
      $('connect-btn').disabled = false;
      return;
    }

    const profile = await res.json();
    profile._username = username;

    // Extract link values into flat fields
    if (profile.links && Array.isArray(profile.links)) {
      for (const link of profile.links) {
        if (link.type === 'email' && link.value) profile.email = profile.email || link.value;
        if (link.type === 'location' && link.value) profile.location = profile.location || link.value;
        if (link.type === 'website' && link.value) profile.website = profile.website || link.value;
      }
    }

    await chrome.storage.local.set({
      cvinbio_username: username,
      cvinbio_profile: profile,
    });

    showStatus('success', `Connected as ${profile.full_name || username}`);
    renderConnected(profile);
  } catch (err) {
    showStatus('error', 'Failed to connect. Check your internet.');
    console.error(err);
  }

  $('connect-btn').disabled = false;
}

// ── Render Connected ──
function renderConnected(profile) {
  $('setup-view').classList.add('hidden');
  $('connected-view').classList.remove('hidden');
  $('disconnect-btn').classList.remove('hidden');

  // Avatar
  const avatarEl = $('avatar');
  if (profile.profile_picture_url) {
    avatarEl.innerHTML = `<img src="${profile.profile_picture_url}" alt="" />`;
  } else {
    $('avatar-initial').textContent = (profile.full_name || '?')[0].toUpperCase();
  }

  $('profile-name').textContent = profile.full_name || 'No name';
  $('profile-email').textContent = profile.email || 'No email';

  // Field chips
  const fieldsEl = $('profile-fields');
  fieldsEl.innerHTML = '';
  for (const [key, label] of Object.entries(FIELD_LABELS)) {
    const val = profile[key];
    const filled = val && (Array.isArray(val) ? val.length > 0 : String(val).trim() !== '');
    fieldsEl.innerHTML += `
      <div class="field-chip">
        <span class="dot ${filled ? 'filled' : 'empty'}"></span>
        ${label}
      </div>
    `;
  }
}

// ── Fill ──
async function handleFill() {
  const stored = await chrome.storage.local.get(['cvinbio_profile']);
  if (!stored.cvinbio_profile) return;

  $('fill-btn').disabled = true;
  $('fill-btn').textContent = 'Filling...';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.tabs.sendMessage(tab.id, {
      action: 'FILL_FORM',
      profile: stored.cvinbio_profile,
    });

    const resultEl = $('fill-result');
    resultEl.classList.remove('hidden');

    if (result && result.filled > 0) {
      resultEl.className = `fill-result ${result.filled >= 3 ? 'success' : 'partial'}`;
      resultEl.innerHTML = `✓ Filled <strong>${result.filled}</strong> field${result.filled > 1 ? 's' : ''}${result.skipped > 0 ? ` · ${result.skipped} already had values` : ''}`;
    } else {
      resultEl.className = 'fill-result partial';
      resultEl.innerHTML = 'No matching fields found on this page. Try opening a job application form.';
    }
  } catch (err) {
    const resultEl = $('fill-result');
    resultEl.classList.remove('hidden');
    resultEl.className = 'fill-result partial';
    resultEl.innerHTML = 'Could not access this page. Try refreshing.';
  }

  $('fill-btn').disabled = false;
  $('fill-btn').innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
    </svg>
    Fill This Page
  `;
}

// ── Disconnect ──
async function handleDisconnect() {
  await chrome.storage.local.remove(['cvinbio_username', 'cvinbio_profile']);
  $('connected-view').classList.add('hidden');
  $('disconnect-btn').classList.add('hidden');
  $('setup-view').classList.remove('hidden');
  $('fill-result').classList.add('hidden');
  $('username-input').value = '';
  hideStatus();
}

// ── Status helpers ──
function showStatus(type, text) {
  const bar = $('status-bar');
  bar.className = `status ${type}`;
  bar.classList.remove('hidden');
  $('status-text').textContent = text;
  if (type === 'success' || type === 'error') {
    setTimeout(() => bar.classList.add('hidden'), 4000);
  }
}

function hideStatus() {
  $('status-bar').classList.add('hidden');
}
