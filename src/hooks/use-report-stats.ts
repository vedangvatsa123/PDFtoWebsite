'use client';
import { useState, useEffect } from 'react';

export interface ReportStats {
  totalJobs: number;
  totalCompanies: number;
  remoteJobs: number;
  remotePercent: number;
  aiJobs: number;
  aiPercent: number;
  engineerJobs: number;
  managerJobs: number;
  designerJobs: number;
  topCompanies: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
  topTags: { name: string; count: number }[];
  seniority: Record<string, number>;
  updatedAt: string;
}

export function useReportStats() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/report-stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { stats, loading };
}
