// ── CVin.Bio Auto-Fill — Content Script ──
// Detects form fields on any page and fills them with profile data.

(() => {
  'use strict';

  // ── Field matchers ──
  // Each entry: { profileKey, patterns (matched against name, id, placeholder, label, autocomplete) }
  const FIELD_MAP = [
    // ── Name fields ──
    {
      profileKey: 'first_name',
      extract: (p) => (p.full_name || '').split(' ')[0],
      patterns: ['first.?name', 'fname', 'given.?name', 'first'],
      autocomplete: ['given-name'],
    },
    {
      profileKey: 'last_name',
      extract: (p) => (p.full_name || '').split(' ').slice(1).join(' '),
      patterns: ['last.?name', 'lname', 'surname', 'family.?name', 'last'],
      autocomplete: ['family-name'],
    },
    {
      profileKey: 'full_name',
      extract: (p) => p.full_name || '',
      patterns: ['full.?name', 'name', 'your.?name', 'candidate.?name', 'applicant.?name'],
      autocomplete: ['name'],
      excludePatterns: ['first', 'last', 'company', 'user', 'middle'],
    },

    // ── Contact ──
    {
      profileKey: 'email',
      extract: (p) => p.email || '',
      patterns: ['email', 'e.?mail', 'email.?address'],
      autocomplete: ['email'],
      inputTypes: ['email'],
    },
    {
      profileKey: 'phone',
      extract: (p) => p.phone || '',
      patterns: ['phone', 'tel', 'mobile', 'cell', 'phone.?number'],
      autocomplete: ['tel'],
      inputTypes: ['tel'],
    },

    // ── Location ──
    {
      profileKey: 'location',
      extract: (p) => p.location || '',
      patterns: ['location', 'city', 'address', 'current.?location', 'where.?are.?you'],
      autocomplete: ['address-level2'],
    },

    // ── URLs ──
    {
      profileKey: 'linkedin',
      extract: (p) => p.linkedin || '',
      patterns: ['linkedin', 'linked.?in'],
    },
    {
      profileKey: 'github',
      extract: (p) => p.github || '',
      patterns: ['github', 'git.?hub'],
    },
    {
      profileKey: 'website',
      extract: (p) => p.website || '',
      patterns: ['website', 'portfolio', 'personal.?site', 'url', 'homepage', 'blog'],
      excludePatterns: ['linkedin', 'github', 'twitter', 'company'],
    },

    // ── Professional ──
    {
      profileKey: 'current_company',
      extract: (p) => {
        const exp = p.experience;
        if (exp && exp.length > 0) return exp[0].company || '';
        return '';
      },
      patterns: ['company', 'current.?company', 'employer', 'organization', 'org'],
      excludePatterns: ['name'],
    },
    {
      profileKey: 'current_title',
      extract: (p) => {
        const exp = p.experience;
        if (exp && exp.length > 0) return exp[0].title || '';
        return '';
      },
      patterns: ['title', 'job.?title', 'current.?title', 'position', 'role', 'current.?role'],
      excludePatterns: ['name', 'mr', 'mrs'],
    },
    {
      profileKey: 'summary',
      extract: (p) => p.summary || '',
      patterns: ['summary', 'about', 'bio', 'cover.?letter', 'additional.?info', 'intro', 'tell.?us.?about'],
      isTextarea: true,
    },
  ];

  // ── Get identifying text for an input ──
  function getFieldSignals(el) {
    const signals = [];

    // Direct attributes
    const name = (el.getAttribute('name') || '').toLowerCase();
    const id = (el.getAttribute('id') || '').toLowerCase();
    const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
    const autocomplete = (el.getAttribute('autocomplete') || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const dataField = (el.getAttribute('data-field') || '').toLowerCase();

    signals.push(name, id, placeholder, autocomplete, ariaLabel, dataField);

    // Associated label
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) signals.push(label.textContent.toLowerCase().trim());
    }

    // Parent label
    const parentLabel = el.closest('label');
    if (parentLabel) {
      signals.push(parentLabel.textContent.toLowerCase().trim());
    }

    // Nearby label (sibling or parent container)
    const container = el.closest('.field, .form-group, .form-field, [class*="field"], [class*="input"], [class*="form"]');
    if (container) {
      const label = container.querySelector('label, .label, [class*="label"]');
      if (label) signals.push(label.textContent.toLowerCase().trim());
    }

    return {
      signals: signals.filter(Boolean),
      autocomplete,
      inputType: (el.getAttribute('type') || '').toLowerCase(),
    };
  }

  // ── Match a field against patterns ──
  function matchField(fieldInfo, matcher) {
    const { signals, autocomplete, inputType } = fieldInfo;

    // Check autocomplete match
    if (matcher.autocomplete && matcher.autocomplete.includes(autocomplete)) {
      return true;
    }

    // Check input type match
    if (matcher.inputTypes && matcher.inputTypes.includes(inputType)) {
      return true;
    }

    // Check pattern match against all signals
    for (const signal of signals) {
      if (!signal) continue;

      // Check exclude patterns first
      if (matcher.excludePatterns) {
        const excluded = matcher.excludePatterns.some((ep) =>
          new RegExp(ep, 'i').test(signal)
        );
        if (excluded) continue;
      }

      for (const pattern of matcher.patterns) {
        if (new RegExp(pattern, 'i').test(signal)) {
          return true;
        }
      }
    }

    return false;
  }

  // ── Set value on an input (React-compatible) ──
  function setNativeValue(el, value) {
    // Store original value
    const lastValue = el.value;

    // Use native setter to bypass React's synthetic event system
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    )?.set;
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, 'value'
    )?.set;

    if (el.tagName === 'TEXTAREA' && nativeTextareaValueSetter) {
      nativeTextareaValueSetter.call(el, value);
    } else if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }

    // Dispatch events that React and other frameworks listen to
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  // ── Handle select elements ──
  function fillSelect(el, value) {
    if (!value) return false;
    const valueLower = value.toLowerCase();

    for (const option of el.options) {
      if (
        option.value.toLowerCase() === valueLower ||
        option.textContent.toLowerCase().trim() === valueLower ||
        option.textContent.toLowerCase().includes(valueLower)
      ) {
        el.value = option.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    return false;
  }

  // ── Visual feedback ──
  function flashField(el) {
    const originalBorder = el.style.border;
    const originalShadow = el.style.boxShadow;
    el.style.border = '2px solid #6366f1';
    el.style.boxShadow = '0 0 8px rgba(99, 102, 241, 0.4)';
    el.style.transition = 'border 0.3s, box-shadow 0.3s';

    setTimeout(() => {
      el.style.border = originalBorder;
      el.style.boxShadow = originalShadow;
    }, 1500);
  }

  // ── Main fill logic ──
  function fillForm(profile) {
    // Gather all fillable elements
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea, select'
    );

    let filled = 0;
    let skipped = 0;
    const filledFields = new Set();

    for (const el of inputs) {
      // Skip invisible elements
      if (el.offsetParent === null && el.getAttribute('type') !== 'hidden') continue;
      // Skip disabled/readonly
      if (el.disabled || el.readOnly) continue;

      const fieldInfo = getFieldSignals(el);

      for (const matcher of FIELD_MAP) {
        // Skip if we already filled this profileKey
        if (filledFields.has(matcher.profileKey)) continue;
        // Skip textarea matchers for non-textarea elements
        if (matcher.isTextarea && el.tagName !== 'TEXTAREA') continue;

        if (matchField(fieldInfo, matcher)) {
          const value = matcher.extract(profile);
          if (!value) break;

          // Skip if field already has a value
          if (el.value && el.value.trim() !== '') {
            skipped++;
            filledFields.add(matcher.profileKey);
            break;
          }

          if (el.tagName === 'SELECT') {
            if (fillSelect(el, value)) {
              filled++;
              filledFields.add(matcher.profileKey);
              flashField(el);
            }
          } else {
            setNativeValue(el, value);
            filled++;
            filledFields.add(matcher.profileKey);
            flashField(el);
          }
          break;
        }
      }
    }

    return { filled, skipped };
  }

  // ── Listen for messages from popup ──
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'FILL_FORM' && msg.profile) {
      const result = fillForm(msg.profile);
      sendResponse(result);
    }
    return true; // async response
  });
})();
