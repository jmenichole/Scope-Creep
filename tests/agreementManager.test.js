import { describe, it } from 'node:test';
import assert from 'node:assert';
import { agreementManager } from '../src/services/agreementManager.js';

describe('Agreement Manager', () => {
  it('should create a new project', async () => {
    const project = await agreementManager.createProject({
      clientId: 'client123',
      freelancerId: 'freelancer456',
      scope: 'Build a landing page',
      budget: 5000,
      milestones: []
    });
    
    assert.ok(project.id);
    assert.strictEqual(project.status, 'active');
    assert.strictEqual(project.budget, 5000);
  });

  it('should pause a project', async () => {
    const project = await agreementManager.createProject({
      clientId: 'client123',
      freelancerId: 'freelancer456',
      scope: 'Test project',
      budget: 1000,
      milestones: []
    });
    
    const paused = await agreementManager.pauseProject(project.id, 'Too many scope changes');
    
    assert.strictEqual(paused.status, 'paused');
    assert.ok(paused.pausedAt);
  });

  it('should create renegotiation', async () => {
    const project = await agreementManager.createProject({
      clientId: 'client123',
      freelancerId: 'freelancer456',
      scope: 'Test project',
      budget: 5000,
      milestones: []
    });
    
    const renegotiation = await agreementManager.createRenegotiation(
      project.id,
      'Add contact form',
      5750
    );
    
    assert.ok(renegotiation.id);
    assert.strictEqual(renegotiation.additionalCost, 750);
  });

  it('should calculate health score', async () => {
    const project = await agreementManager.createProject({
      clientId: 'client123',
      freelancerId: 'freelancer456',
      scope: 'Test project',
      budget: 5000,
      milestones: []
    });
    
    const stats = await agreementManager.getProjectStats(project.id);
    
    assert.strictEqual(stats.healthScore, 100); // New project, perfect health
  });

  it('should auto-pause after 3 scope changes', async () => {
    const project = await agreementManager.createProject({
      clientId: 'client123',
      freelancerId: 'freelancer456',
      scope: 'Test project',
      budget: 5000,
      milestones: []
    });
    
    // Add 3 scope changes
    await agreementManager.createRenegotiation(project.id, 'Change 1', 5500);
    await agreementManager.createRenegotiation(project.id, 'Change 2', 6000);
    await agreementManager.createRenegotiation(project.id, 'Change 3', 6500);
    
    const updated = await agreementManager.getProject(project.id);
    
    assert.strictEqual(updated.status, 'paused');
    assert.strictEqual(updated.scopeChangeCount, 3);
  });
});
