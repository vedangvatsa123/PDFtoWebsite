"use client";

import { useEffect } from 'react';
import TemplateMonochrome from './templates/monochrome-professional';
import TemplateModern from './templates/modern-creative';
import TemplateClassic from './templates/classic-minimalist';
import type { ServerProfileData } from '@/lib/firebase-rest';

interface Props {
  data: ServerProfileData;
  slug: string;
}

export default function ProfilePageClient({ data, slug }: Props) {
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: 'POST' }).catch(console.error);
  }, [slug]);

  const { themeId = 'modern-creative' } = data.profile;

  switch (themeId) {
    case 'monochrome-professional':
      return <TemplateMonochrome {...data} />;
    case 'classic-minimalist':
      return <TemplateClassic {...data} />;
    case 'modern-creative':
    default:
      return <TemplateModern {...data} />;
  }
}
