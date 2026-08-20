'use client';

import { useState } from 'react';
import { analyzeAndStore } from './actions';
import type { Analysis } from '@/lib/domain/types';

type ProjectOption = { id: string; client_name: string };

export default function AnalyzeForm({ projects }: { projects: ProjectOption[] }) {
  const [result, setResult] = useState<(Analysis & { alertCreated: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    try {
      const analysis = await analyzeAndStore({
        projectId: formData.get('projectId'),
        sender: formData.get('sender'),
        message: formData.get('message'),
      });
      setResult(analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    }
  }

  return (
    <>
      <form action={onSubmit} className="card stack">
        <select name="projectId" required defaultValue="">
          <option value="" disabled>Select project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.client_name}</option>
          ))}
        </select>
        <select name="sender" defaultValue="client">
          <option value="client">Client</option>
          <option value="freelancer">Freelancer</option>
        </select>
        <textarea name="message" placeholder="Paste the client message" required />
        <button type="submit">Analyze Message</button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <div className="card">
          <h2>{result.isScopeCheck ? 'Scope Check Detected!' : 'All Clear'}</h2>
          <p>Confidence: {result.confidence}%</p>
          <p>Engine: {result.engine}{result.engine === 'rules' ? ' (AI enhancement unavailable or not configured)' : ''}</p>
          <p>Estimated hours: {result.estimatedAdditionalHours}</p>
          <p>Recommended action: {result.recommendedAction}</p>
          <p>Flags: {result.flags.join(', ') || 'none'}</p>
          {result.alertCreated ? <p>An in-app alert was created.</p> : null}
        </div>
      ) : null}
    </>
  );
}
