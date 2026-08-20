import { listAlerts, markAlertRead } from './actions';

export const dynamic = 'force-dynamic';

export default async function AlertsPage() {
  const alerts = await listAlerts();

  async function markRead(formData: FormData) {
    'use server';
    await markAlertRead(String(formData.get('id')));
  }

  return (
    <section>
      <h1>Alerts</h1>
      {alerts.length === 0 ? <p className="muted">No alerts yet.</p> : (
        <ul className="list">
          {alerts.map((alert) => (
            <li key={alert.id} className="card">
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
              {alert.read ? <span className="muted">read</span> : (
                <form action={markRead}>
                  <input type="hidden" name="id" value={alert.id} />
                  <button type="submit">Mark read</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
