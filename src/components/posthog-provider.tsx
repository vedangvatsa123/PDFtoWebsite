'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react'
import { useEffect, Suspense } from 'react'
import { useUser } from '@/auth'
import { usePathname, useSearchParams } from 'next/navigation'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      person_profiles: 'identified_only',

      // ── Pageview & navigation ──
      capture_pageview: false,        // We handle manually for SPA accuracy
      capture_pageleave: true,

      // ── Session replay — DISABLED for performance ──
      disable_session_recording: true,

      // ── Autocapture — MINIMAL for performance ──
      autocapture: false,             // We track everything explicitly

      // ── Performance — DISABLED to reduce INP ──
      capture_performance: false,

      // ── Privacy ──
      respect_dnt: false,
      before_send: (event) => {
        if (!event) return event;
        if (event.properties?.['$current_url']) {
          event.properties['$current_url'] = event.properties['$current_url'].replace(/email=[^&]+/g, 'email=REDACTED');
        }
        return event;
      },

      // ── Loading optimization ──
      bootstrap: {},                  // Skip initial decide request
      advanced_disable_decide: true,  // Don't call /decide endpoint
      advanced_disable_feature_flags: true,  // Not using feature flags
      advanced_disable_toolbar_metrics: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      <Suspense fallback={null}>
        <PostHogPageview />
      </Suspense>
      {children}
    </PHProvider>
  )
}

/** Identify logged-in users with rich properties */
function PostHogIdentify() {
  const { user } = useUser()
  const ph = usePostHog()

  useEffect(() => {
    if (user && ph) {
      ph.identify(user.id, {
        email: user.email,
        name: user.user_metadata?.full_name,
        avatar_url: user.user_metadata?.avatar_url,
        provider: user.app_metadata?.provider,
        created_at: user.created_at,
      })

      ph.register({
        user_provider: user.app_metadata?.provider || 'unknown',
        user_email_domain: user.email?.split('@')[1] || 'unknown',
      })
    }
  }, [user, ph])

  return null
}

/** Track pageviews on route changes (SPA-accurate) */
function PostHogPageview() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const ph = usePostHog()

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname
      const search = searchParams?.toString()
      if (search) url += '?' + search

      const utmSource = searchParams?.get('utm_source')
      const utmMedium = searchParams?.get('utm_medium')
      const utmCampaign = searchParams?.get('utm_campaign')
      const utmTerm = searchParams?.get('utm_term')
      const utmContent = searchParams?.get('utm_content')

      const pageviewProps: Record<string, string> = { $current_url: url }
      if (utmSource) pageviewProps.utm_source = utmSource
      if (utmMedium) pageviewProps.utm_medium = utmMedium
      if (utmCampaign) pageviewProps.utm_campaign = utmCampaign
      if (utmTerm) pageviewProps.utm_term = utmTerm
      if (utmContent) pageviewProps.utm_content = utmContent

      ph.capture('$pageview', pageviewProps)

      if (utmSource || document.referrer) {
        ph.setPersonPropertiesForFlags({
          initial_referrer: document.referrer || 'direct',
          initial_referring_domain: document.referrer ? new URL(document.referrer).hostname : 'direct',
          ...(utmSource ? { initial_utm_source: utmSource } : {}),
          ...(utmMedium ? { initial_utm_medium: utmMedium } : {}),
          ...(utmCampaign ? { initial_utm_campaign: utmCampaign } : {}),
        })
      }
    }
  }, [pathname, searchParams, ph])

  return null
}
