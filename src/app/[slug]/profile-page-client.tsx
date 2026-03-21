"use client";

import { useEffect } from 'react';
import TemplateModern from './templates/modern-creative';
import type { ServerProfileData } from '@/lib/supabase-server';

interface Props {
  data: ServerProfileData;
  slug: string;
}

export default function ProfilePageClient({ data, slug }: Props) {
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(console.error);
  }, [slug]);

  return <TemplateModern {...data} />;
}
