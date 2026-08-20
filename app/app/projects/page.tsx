import Link from 'next/link';
import { listProjects } from './actions';
import { pauseProject, resumeProject } from '../renegotiations/actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <section>
      <div className="row">
        <h1>Projects</h1>
        <Link href="/app/projects/new" className="button">+ New Project</Link>
      </div>
      {projects.length === 0 ? <p className="muted">No projects yet.</p> : null}
      <ul className="list">
        {projects.map((project) => (
          <li key={project.id} className="card">
            <strong>{project.client_name}</strong> — ${Number(project.budget).toLocaleString()} — {project.status} — health {project.health_score}%
            <p className="muted">{project.scope}</p>
            <div className="row">
              {project.status === 'paused' ? (
                <form action={async () => { 'use server'; await resumeProject(project.id); }}>
                  <button type="submit">Resume</button>
                </form>
              ) : (
                <form action={async () => { 'use server'; await pauseProject(project.id, 'Paused from dashboard'); }}>
                  <button type="submit" className="secondary">Pause</button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
