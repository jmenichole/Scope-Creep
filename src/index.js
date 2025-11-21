/**
 * Copyright (c) 2024 Scope Creep Insurance
 * 
 * This file is part of Scope Creep Insurance.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import express from 'express';
import { scopeCreepDetector } from './ai/scopeCreepDetector.js';
import { agreementManager } from './services/agreementManager.js';
import { alertService } from './services/alertService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Boundari.ai' });
});

// Create a new project/agreement
app.post('/api/projects', async (req, res) => {
  try {
    const { clientId, freelancerId, scope, budget, milestones } = req.body;
    
    if (!clientId || !freelancerId || !scope || budget === undefined) {
      return res.status(400).json({ error: 'Missing required fields: clientId, freelancerId, scope, budget' });
    }
    
    const project = await agreementManager.createProject({
      clientId,
      freelancerId,
      scope,
      budget,
      milestones
    });
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(400).json({ error: error.message });
  }
});

// Analyze message for scope creep
app.post('/api/analyze-message', async (req, res) => {
  try {
    const { projectId, message, sender } = req.body;
    
    if (!projectId || !message || !sender) {
      return res.status(400).json({ error: 'Missing required fields: projectId, message, sender' });
    }
    
    const analysis = await scopeCreepDetector.analyzeMessage(projectId, message, sender);
    
    if (analysis.isScopeCreep) {
      // Send alert and trigger renegotiation flow
      await alertService.sendScopeCreepAlert(projectId, analysis);
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing message:', error);
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

// List all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await agreementManager.listProjects();
    res.json(projects);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get project statistics
app.get('/api/projects/:projectId/stats', async (req, res) => {
  try {
    const stats = await agreementManager.getProjectStats(req.params.projectId);
    res.json(stats);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Resume a paused project
app.put('/api/projects/:projectId/resume', async (req, res) => {
  try {
    const project = await agreementManager.resumeProject(req.params.projectId);
    res.json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Approve a renegotiation
app.post('/api/renegotiations/:renegotiationId/approve', async (req, res) => {
  try {
    const result = await agreementManager.approveRenegotiation(req.params.renegotiationId);
    res.json(result);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get alerts for a project
app.get('/api/alerts/:projectId', async (req, res) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const alerts = alertService.getAlerts(req.params.projectId, unreadOnly);
    res.json(alerts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark alert as read
app.put('/api/alerts/:alertId/read', async (req, res) => {
  try {
    const alert = alertService.markAsRead(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✨ Boundari.ai API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

export default app;
