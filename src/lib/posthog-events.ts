/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CVin.Bio — PostHog Event Taxonomy
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * EVERY custom event captured by the platform is defined here.
 * This file is the SINGLE SOURCE OF TRUTH for event names and properties.
 *
 * Rules:
 *   1. All event names use snake_case
 *   2. Format: {page}_{action}  (e.g., landing_cv_upload_started)
 *   3. Every event MUST have `page` as a property (set automatically)
 *   4. Property names use snake_case, values are primitives (string/number/boolean)
 *   5. Never reuse an event name for a different action
 *   6. When adding a new event, add it here FIRST, then implement in code
 *
 * Funnel stages:
 *   AWARENESS  → Landing page visit
 *   ACTIVATION → CV upload + signup
 *   ENGAGEMENT → Editor actions (parse, save, photo, slug)
 *   SHARING    → Share actions (copy link, LinkedIn, X, etc.)
 *   RETENTION  → Profile views, time spent
 *   CHURN      → Logout, account deletion
 */

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: LANDING (/)
// User is on the homepage, not yet signed in
// ═══════════════════════════════════════════════════════════════════════════════

export const LANDING_EVENTS = {
  /** User selected a CV file and upload/parse started */
  CV_UPLOAD_STARTED: 'landing_cv_upload_started',
  /** CV was successfully parsed by the API */
  CV_UPLOAD_COMPLETED: 'landing_cv_upload_completed',
  /** CV upload failed (network error or API error) */
  CV_UPLOAD_FAILED: 'landing_cv_upload_failed',
  /** User selected a file that exceeds 10MB limit */
  CV_FILE_TOO_LARGE: 'landing_cv_file_rejected',
  /** User selected a file with unsupported format */
  CV_INVALID_FORMAT: 'landing_cv_format_rejected',
} as const;

// Properties for LANDING events:
// | Property    | Type    | Description                        | Example            |
// |-------------|---------|------------------------------------|--------------------|
// | file_type   | string  | MIME type of the uploaded file      | "application/pdf"  |
// | file_size   | number  | File size in bytes                  | 245760             |
// | error       | string  | Error reason (for failed events)   | "network_error"    |

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: AUTH (/signup)
// User is signing in or creating an account
// ═══════════════════════════════════════════════════════════════════════════════

export const AUTH_EVENTS = {
  /** User clicked "Continue with Google" button */
  GOOGLE_CLICKED: 'auth_google_started',
  /** Google OAuth returned an error */
  GOOGLE_FAILED: 'auth_google_failed',
  /** Magic link email was successfully sent */
  MAGIC_LINK_SENT: 'auth_magic_link_sent',
  /** Magic link email send failed */
  MAGIC_LINK_FAILED: 'auth_magic_link_failed',
} as const;

// Properties for AUTH events:
// | Property    | Type    | Description                         | Example            |
// |-------------|---------|-------------------------------------|--------------------|
// | from        | string  | Where the user came from            | "upload", "direct" |
// | error       | string  | Error message (for failed events)   | "rate_limited"     |

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: EDITOR (/editor)
// Signed-in user is editing their profile
// ═══════════════════════════════════════════════════════════════════════════════

export const EDITOR_EVENTS = {
  /** User started a CV parse from the editor (re-upload) */
  CV_PARSE_STARTED: 'editor_cv_parse_started',
  /** CV parse completed and profile was saved to DB */
  CV_PARSE_SAVED: 'editor_cv_parse_saved',
  /** CV parse completed but user is anonymous (saved to sessionStorage only) */
  CV_PARSE_ANONYMOUS: 'editor_cv_parse_anonymous',
  /** CV parse failed with an error */
  CV_PARSE_FAILED: 'editor_cv_parse_failed',
  /** User changed their profile slug/URL */
  SLUG_CHANGED: 'editor_slug_changed',
  /** User updated their profile photo */
  PHOTO_UPDATED: 'editor_photo_updated',
  /** User deleted their account */
  ACCOUNT_DELETED: 'editor_account_deleted',
  /** User shared via X/Twitter from the editor share dropdown */
  SHARE_X: 'editor_share_x',
  /** User shared via LinkedIn from the editor share dropdown */
  SHARE_LINKEDIN: 'editor_share_linkedin',
  /** User shared via Facebook from the editor share dropdown */
  SHARE_FACEBOOK: 'editor_share_facebook',
  /** User copied the profile link from editor share dropdown */
  SHARE_LINK_COPIED: 'editor_share_link_copied',
  /** User copied the share message from editor share dropdown */
  SHARE_MESSAGE_COPIED: 'editor_share_message_copied',
} as const;

// Properties for EDITOR events:
// | Property    | Type    | Description                         | Example            |
// |-------------|---------|-------------------------------------|--------------------|
// | file_type   | string  | MIME type of parsed CV              | "application/pdf"  |
// | file_size   | number  | File size in bytes                  | 245760             |
// | slug        | string  | Profile slug/username               | "harsimar"         |
// | new_slug    | string  | New slug after change               | "harsimar-singh"   |
// | source      | string  | What triggered the save             | "cv_parse"         |
// | error       | string  | Error message                       | "Network error"    |

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE: PROFILE (/:slug)
// Public profile page — viewed by the profile owner or external visitors
// ═══════════════════════════════════════════════════════════════════════════════

export const PROFILE_EVENTS = {
  /** A profile page was loaded (by anyone — owner or visitor) */
  VIEWED: 'profile_viewed',
  /** Track time spent on a profile (fires on page leave) */
  TIME_SPENT: 'profile_time_spent',
  /** Celebration modal was shown to the profile owner (first-time achievement) */
  CELEBRATION_SHOWN: 'profile_celebration_shown',
  /** User copied their profile link from the celebration modal */
  SHARE_LINK_COPIED: 'profile_share_link_copied',
  /** User shared to LinkedIn from celebration modal */
  SHARE_LINKEDIN: 'profile_share_linkedin',
  /** User shared to X/Twitter from celebration modal */
  SHARE_X: 'profile_share_x',
  /** User shared to Facebook from celebration modal */
  SHARE_FACEBOOK: 'profile_share_facebook',
  /** User shared to WhatsApp from celebration modal */
  SHARE_WHATSAPP: 'profile_share_whatsapp',
  /** User downloaded the story card image */
  STORY_CARD_DOWNLOADED: 'profile_story_card_downloaded',
} as const;

// Properties for PROFILE events:
// | Property       | Type    | Description                            | Example        |
// |----------------|---------|----------------------------------------|----------------|
// | slug           | string  | Profile slug being viewed              | "harsimar"     |
// | has_photo      | boolean | Profile has a real photo (not default)  | true           |
// | has_work       | boolean | Profile has work experience entries     | true           |
// | has_education  | boolean | Profile has education entries           | true           |
// | has_summary    | boolean | Profile has a bio/summary              | false          |
// | skill_count    | number  | Number of skills listed                | 12             |
// | work_count     | number  | Number of work experience entries      | 3              |
// | is_complete    | boolean | All 6 completeness checks pass         | true           |
// | seconds        | number  | Time spent on page (for TIME_SPENT)    | 45             |

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL / SYSTEM
// Events that can fire on any page
// ═══════════════════════════════════════════════════════════════════════════════

export const GLOBAL_EVENTS = {
  /** User clicked "Logout" in the header */
  USER_LOGOUT: 'user_logout',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO-CAPTURED (by PostHog SDK — not in code, but listed for completeness)
// ═══════════════════════════════════════════════════════════════════════════════
//
// | Event              | Description                                        |
// |--------------------|----------------------------------------------------|
// | $pageview          | Fired on every route change (SPA-accurate)         |
// | $pageleave         | Fired when user navigates away from a page         |
// | $autocapture       | Clicks, form submits, input changes on UI elements |
// | $exception         | JS errors and unhandled promise rejections          |
// | $web_vitals        | LCP, FID, CLS performance metrics                  |
// | $session_recording | Session replay data (not a discrete event)         |

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROPERTIES (set via posthog.identify)
// ═══════════════════════════════════════════════════════════════════════════════
//
// | Property          | Type    | Description                          | Example              |
// |-------------------|---------|--------------------------------------|----------------------|
// | email             | string  | User's email address                 | "user@gmail.com"     |
// | name              | string  | Full name from auth provider         | "Harsimar Singh"     |
// | avatar_url        | string  | Profile photo URL                    | "https://lh3..."     |
// | provider          | string  | Auth provider used to sign up        | "google", "email"    |
// | created_at        | string  | ISO timestamp of account creation    | "2026-03-25T..."     |

// ═══════════════════════════════════════════════════════════════════════════════
// SUPER PROPERTIES (auto-attached to every event)
// ═══════════════════════════════════════════════════════════════════════════════
//
// | Property          | Type    | Description                          | Example              |
// |-------------------|---------|--------------------------------------|----------------------|
// | user_provider     | string  | Auth provider of current user        | "google"             |
// | user_email_domain | string  | Domain of user's email               | "gmail.com"          |
