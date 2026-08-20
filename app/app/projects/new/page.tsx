import { redirect } from 'next/navigation';
import { createProject } from '../actions';

export default function NewProjectPage() {
  async function action(formData: FormData) {
    'use server';
    await createProject({
      clientName: formData.get('clientName'),
      freelancerName: formData.get('freelancerName'),
      scope: formData.get('scope'),
      budget: formData.get('budget'),
    });
    redirect('/app/projects');
  }

  return (
    <form action={action} className="card stack">
      <h1>New Project</h1>
      <input name="clientName" placeholder="Client name" required />
      <input name="freelancerName" placeholder="Your name" required />
      <textarea name="scope" placeholder="Scope of work" required />
      <input name="budget" type="number" placeholder="Budget" min="0" step="1" required />
      <button type="submit">Create Project</button>
    </form>
  );
}
