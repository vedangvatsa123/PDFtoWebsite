// QuickReply — Content Script
// Injected on X (twitter.com / x.com) and LinkedIn

(function () {
  'use strict';

  // ── Detect platform ──
  const isX = location.hostname.includes('x.com') || location.hostname.includes('twitter.com');
  const isLinkedIn = location.hostname.includes('linkedin.com');
  const platform = isX ? 'x' : isLinkedIn ? 'linkedin' : null;
  if (!platform) return;

  // ── System prompt — the core of "no AI slop" ──
  const SYSTEM_PROMPT = `You are a ghostwriter who replies to social media posts on behalf of the user.

RULES — follow these exactly:
1. Write like a real human texting a friend. Short sentences. No filler.
2. NEVER use these words/phrases: "Absolutely", "I couldn't agree more", "This resonates", "Great point", "Well said", "spot on", "game-changer", "leverage", "unpack", "deep dive", "at the end of the day", "it's worth noting", "I think this is", "Couldn't have said it better".
3. No exclamation marks unless the tone is genuinely excited.
4. No hashtags. No emojis unless tone=casual and even then max 1.
5. Don't start with "I" — vary your sentence openers.
6. Keep it under 280 characters for X, under 500 for LinkedIn.
7. Add genuine value: a contrarian take, a personal anecdote, a follow-up question, or specific data. Never just agree.
8. Match the energy of the original post. If it's serious, be serious. If it's casual, be casual.
9. Never compliment the poster directly ("great post", "love this"). React to the idea, not the person.
10. Sound like someone who actually knows what they're talking about, not someone performing engagement.`;

  // ── Tones available ──
  const TONES = [
    { id: 'sharp', label: 'Sharp' },
    { id: 'casual', label: 'Casual' },
    { id: 'contrarian', label: 'Contrarian' },
    { id: 'curious', label: 'Curious' },
    { id: 'supportive', label: 'Supportive' },
  ];

  let selectedTone = 'sharp';
  let panelOpen = false;

  // ── Extract post text from the page ──
  function getPostText() {
    if (isX) {
      // On X, try to get the main tweet text from the focused tweet or timeline
      // If user is on a tweet detail page
      const tweetArticles = document.querySelectorAll('article[data-testid="tweet"]');
      if (tweetArticles.length > 0) {
        const first = tweetArticles[0];
        const textEl = first.querySelector('[data-testid="tweetText"]');
        if (textEl) return textEl.innerText.trim();
      }
      // Fallback: look for any selected/focused tweet text
      const anyTweetText = document.querySelector('[data-testid="tweetText"]');
      if (anyTweetText) return anyTweetText.innerText.trim();
      return '';
    }

    if (isLinkedIn) {
      // LinkedIn feed posts
      const feedPosts = document.querySelectorAll('.feed-shared-update-v2__description, .update-components-text__text, .feed-shared-text__text-view');
      if (feedPosts.length > 0) return feedPosts[0].innerText.trim();
      // Detail view
      const detail = document.querySelector('.social-details-social-activity__content');
      if (detail) return detail.innerText.trim();
      return '';
    }

    return '';
  }

  // ── Insert text into the reply box ──
  function insertReply(text) {
    if (isX) {
      // X reply box
      const replyBox = document.querySelector('[data-testid="tweetTextarea_0"], [role="textbox"][data-testid]') ||
                        document.querySelector('div[role="textbox"][contenteditable="true"]');
      if (replyBox) {
        replyBox.focus();
        // Clear existing
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        // Trigger input event
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    if (isLinkedIn) {
      const replyBox = document.querySelector('.ql-editor[contenteditable="true"], div[role="textbox"][contenteditable="true"]');
      if (replyBox) {
        replyBox.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        replyBox.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }

    return false;
  }

  // ── Call AI API ──
  async function generateReply(postText, tone) {
    const config = await new Promise(resolve => {
      chrome.storage.sync.get(['apiKey', 'provider', 'model'], resolve);
    });

    const apiKey = config.apiKey;
    const provider = config.provider || 'gemini';
    const model = config.model || '';

    if (!apiKey) {
      throw new Error('No API key set. Click the extension icon to configure.');
    }

    const maxLen = isX ? 280 : 500;
    const userPrompt = `Platform: ${platform === 'x' ? 'X (Twitter)' : 'LinkedIn'}
Tone: ${tone}
Max length: ${maxLen} characters

Original post:
"""
${postText}
"""

Write a reply.`;

    if (provider === 'openai') {
      const modelName = model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.9,
          max_tokens: 300,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI error: ${res.status} — ${err}`);
      }

      const data = await res.json();
      return data.choices[0].message.content.trim();
    }

    // Default: Gemini
    const modelName = model || 'gemini-2.0-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini error: ${res.status} — ${err}`);
    }

    const data = await res.json();
    return data.candidates[0].content.parts[0].text.trim();
  }

  // ── Build UI ──
  function createUI() {
    // FAB button
    const fab = document.createElement('button');
    fab.className = 'qr-fab';
    fab.title = 'QuickReply';
    fab.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>`;

    // Panel
    const panel = document.createElement('div');
    panel.className = 'qr-panel';
    panel.innerHTML = `
      <div class="qr-panel-header">
        <h3>QuickReply</h3>
        <button class="qr-panel-close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="qr-post-preview">
        <div class="qr-label">Replying to</div>
        <p class="qr-post-text">—</p>
      </div>
      <div class="qr-tones">
        ${TONES.map(t => `<button class="qr-tone-btn${t.id === selectedTone ? ' active' : ''}" data-tone="${t.id}">${t.label}</button>`).join('')}
      </div>
      <button class="qr-generate">Generate Reply</button>
      <div class="qr-error"><p></p></div>
      <div class="qr-result">
        <p class="qr-result-text"></p>
        <div class="qr-actions">
          <button class="qr-action-btn" data-action="copy">Copy</button>
          <button class="qr-action-btn" data-action="regenerate">Regenerate</button>
          <button class="qr-action-btn primary" data-action="insert">Paste into reply</button>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    // ── Event handlers ──
    fab.addEventListener('click', () => {
      panelOpen = !panelOpen;
      panel.classList.toggle('open', panelOpen);
      if (panelOpen) {
        const postText = getPostText();
        const preview = panel.querySelector('.qr-post-text');
        preview.textContent = postText || '(Could not detect post — navigate to a post and try again)';
      }
    });

    panel.querySelector('.qr-panel-close').addEventListener('click', () => {
      panelOpen = false;
      panel.classList.remove('open');
    });

    // Tone selection
    panel.querySelectorAll('.qr-tone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.qr-tone-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTone = btn.dataset.tone;
      });
    });

    // Generate
    const genBtn = panel.querySelector('.qr-generate');
    const resultArea = panel.querySelector('.qr-result');
    const resultText = panel.querySelector('.qr-result-text');
    const errorArea = panel.querySelector('.qr-error');
    const errorText = errorArea.querySelector('p');

    let lastReply = '';

    async function doGenerate() {
      const postText = getPostText();
      if (!postText) {
        errorArea.classList.add('visible');
        errorText.textContent = 'Could not detect post text. Navigate to a post first.';
        return;
      }

      genBtn.disabled = true;
      genBtn.innerHTML = '<span class="qr-spinner"></span>Generating…';
      errorArea.classList.remove('visible');
      resultArea.classList.remove('visible');

      try {
        lastReply = await generateReply(postText, selectedTone);
        resultText.textContent = lastReply;
        resultArea.classList.add('visible');
      } catch (err) {
        errorArea.classList.add('visible');
        errorText.textContent = err.message;
      } finally {
        genBtn.disabled = false;
        genBtn.textContent = 'Generate Reply';
      }
    }

    genBtn.addEventListener('click', doGenerate);

    // Actions
    panel.querySelectorAll('.qr-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action === 'copy') {
          navigator.clipboard.writeText(lastReply);
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
        } else if (action === 'regenerate') {
          doGenerate();
        } else if (action === 'insert') {
          const inserted = insertReply(lastReply);
          if (inserted) {
            btn.textContent = 'Done!';
            setTimeout(() => {
              btn.textContent = 'Paste into reply';
              panelOpen = false;
              panel.classList.remove('open');
            }, 1000);
          } else {
            btn.textContent = 'Open reply box first';
            setTimeout(() => { btn.textContent = 'Paste into reply'; }, 2000);
          }
        }
      });
    });
  }

  // ── Init ──
  // Wait for page to settle before injecting
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(createUI, 1000));
  } else {
    setTimeout(createUI, 1000);
  }
})();
