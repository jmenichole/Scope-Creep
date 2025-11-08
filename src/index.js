import express from 'express';
import { scopeCreepDetector } from './ai/scopeCreepDetector.js';
import { agreementManager } from './services/agreementManager.js';
import { alertService } from './services/alertService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Scope Creep Insurance' });
});

// Create a new project/agreement
app.post('/api/projects', async (req, res) => {
  try {
    const { clientId, freelancerId, scope, budget, milestones } = req.body;
    const project = await agreementManager.createProject({
      clientId,
      freelancerId,
      scope,
      budget,
      milestones
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analyze message for scope creep
app.post('/api/analyze-message', async (req, res) => {
  try {
    const { projectId, message, sender } = req.body;
    const analysis = await scopeCreepDetector.analyzeMessage(projectId, message, sender);
    
    if (analysis.isScopeCreep) {
      // Send alert and trigger renegotiation flow
      await alertService.sendScopeCreepAlert(projectId, analysis);
    }
    
    res.json(analysis);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get project status
app.get('/api/projects/:projectId', async (req, res) => {
  try {
    const project = await agreementManager.getProject(req.params.projectId);
    res.json(project);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Trigger kill-switch (pause project)
app.post('/api/projects/:projectId/pause', async (req, res) => {
  try {
    const { reason } = req.body;
    const project = await agreementManager.pauseProject(req.params.projectId, reason);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Renegotiate terms
app.post('/api/projects/:projectId/renegotiate', async (req, res) => {
  try {
    const { additionalWork, newQuote } = req.body;
    const renegotiation = await agreementManager.createRenegotiation(
      req.params.projectId,
      additionalWork,
      newQuote
    );
    res.json(renegotiation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Translate passive-aggressive message
app.post('/api/translate-message', async (req, res) => {
  try {
    const { message } = req.body;
    const translated = await scopeCreepDetector.translateToLegalEnglish(message);
    res.json({ original: message, translated });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Scope Creep Insurance API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
