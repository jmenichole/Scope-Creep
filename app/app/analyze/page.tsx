import { listProjects } from '../projects/actions';
import AnalyzeForm from './AnalyzeForm';

export const dynamic = 'force-dynamic';

export default async function AnalyzePage() {
  const projects = await listProjects();
  return (
    <section>
      <h1>Analyze Message for Scope Check</h1>
      {projects.length === 0 ? (
        <p className="muted">Create a project first, then come back to paste a client message.</p>
      ) : (
        <AnalyzeForm projects={projects.map((p) => ({ id: p.id, client_name: p.client_name }))} />
      )}
    </section>
  );
}
