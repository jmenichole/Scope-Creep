import { expect, test } from '@playwright/test';

test('create project → analyze → alert', async ({ page }) => {
  const email = `e2e_${Date.now()}@t.dev`;
  const password = 'Passw0rd!';
  const login = await page.request.post('/api/test-login', { data: { email, password } });
  expect(login.ok()).toBeTruthy();

  await page.goto('/app/projects/new');
  await page.fill('input[name="clientName"]', 'acme');
  await page.fill('input[name="freelancerName"]', 'me');
  await page.fill('textarea[name="scope"]', 'Build a 5-page site');
  await page.fill('input[name="budget"]', '6000');
  await page.click('button:has-text("Create Project")');

  await page.goto('/app/analyze');
  await page.selectOption('select[name="projectId"]', { index: 1 });
  await page.fill('textarea[name="message"]', 'Can we also just add a quick blog? Real quick!');
  await page.click('button:has-text("Analyze Message")');
  await expect(page.getByText('Scope Check Detected')).toBeVisible();

  await page.goto('/app/alerts');
  await expect(page.getByText('Scope Check Detected')).toBeVisible();
});
