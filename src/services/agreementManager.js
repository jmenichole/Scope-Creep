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

/**
 * Agreement Manager
 * Manages project agreements, milestones, and escrow
 */

class AgreementManager {
  constructor() {
    // In-memory storage (in production, use a database)
    this.projects = new Map();
    this.renegotiations = new Map();
  }

  /**
   * Create a new project agreement
   */
  async createProject({ clientId, freelancerId, scope, budget, milestones }) {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const project = {
      id: projectId,
      clientId,
      freelancerId,
      scope,
      budget,
      milestones: milestones || [],
      status: 'active',
      createdAt: new Date().toISOString(),
      scopeChangeCount: 0,
      flags: [],
      escrowStatus: 'pending',
      renegotiations: []
    };
    
    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Get project by ID
   */
  async getProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }
    return project;
  }

  /**
   * Pause project (kill-switch)
   */
  async pauseProject(projectId, reason) {
    const project = await this.getProject(projectId);
    
    project.status = 'paused';
    project.pausedAt = new Date().toISOString();
    project.pauseReason = reason;
    project.flags.push('PROJECT_PAUSED');
    
    // Lock milestone payments
    project.milestones = project.milestones.map(m => ({
      ...m,
      paymentLocked: true,
      lockReason: reason
    }));
    
    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Resume project
   */
  async resumeProject(projectId) {
    const project = await this.getProject(projectId);
    
    if (project.status !== 'paused') {
      throw new Error('Project is not paused');
    }
    
    project.status = 'active';
    project.resumedAt = new Date().toISOString();
    project.flags = project.flags.filter(f => f !== 'PROJECT_PAUSED');
    
    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Create a renegotiation request
   */
  async createRenegotiation(projectId, additionalWork, newQuote) {
    const project = await this.getProject(projectId);
    
    const renegotiationId = `renego_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const renegotiation = {
      id: renegotiationId,
      projectId,
      additionalWork,
      originalBudget: project.budget,
      newQuote,
      additionalCost: newQuote - project.budget,
      status: 'pending',
      createdAt: new Date().toISOString(),
      approvedAt: null
    };
    
    project.renegotiations.push(renegotiation);
    project.scopeChangeCount++;
    
    // Auto-pause if too many scope changes
    if (project.scopeChangeCount >= 3) {
      await this.pauseProject(projectId, 'Multiple scope adjustments suggest terms need realignment');
    }
    
    this.projects.set(projectId, project);
    this.renegotiations.set(renegotiationId, renegotiation);
    
    return renegotiation;
  }

  /**
   * Approve renegotiation
   */
  async approveRenegotiation(renegotiationId) {
    const renegotiation = this.renegotiations.get(renegotiationId);
    if (!renegotiation) {
      throw new Error('Renegotiation not found');
    }
    
    const project = await this.getProject(renegotiation.projectId);
    
    renegotiation.status = 'approved';
    renegotiation.approvedAt = new Date().toISOString();
    
    // Update project budget
    project.budget = renegotiation.newQuote;
    project.scope = `${project.scope}\n\nADDITIONAL WORK (approved ${new Date().toISOString()}):\n${renegotiation.additionalWork}`;
    
    this.renegotiations.set(renegotiationId, renegotiation);
    this.projects.set(project.id, project);
    
    return { renegotiation, project };
  }

  /**
   * Manage escrow for milestones
   */
  async manageMilestoneEscrow(projectId, milestoneId, action) {
    const project = await this.getProject(projectId);
    
    const milestone = project.milestones.find(m => m.id === milestoneId);
    if (!milestone) {
      throw new Error('Milestone not found');
    }
    
    switch (action) {
      case 'lock':
        milestone.paymentLocked = true;
        milestone.lockedAt = new Date().toISOString();
        break;
      case 'unlock':
        milestone.paymentLocked = false;
        milestone.unlockedAt = new Date().toISOString();
        break;
      case 'release':
        if (!milestone.paymentLocked) {
          milestone.paymentReleased = true;
          milestone.releasedAt = new Date().toISOString();
        } else {
          throw new Error('Cannot release locked payment');
        }
        break;
      default:
        throw new Error('Invalid escrow action');
    }
    
    this.projects.set(projectId, project);
    return milestone;
  }

  /**
   * Get project statistics
   */
  async getProjectStats(projectId) {
    const project = await this.getProject(projectId);
    
    return {
      projectId,
      status: project.status,
      scopeChangeCount: project.scopeChangeCount,
      originalBudget: project.budget,
      currentBudget: project.budget,
      additionalCost: project.renegotiations.reduce((sum, r) => 
        sum + (r.status === 'approved' ? r.additionalCost : 0), 0
      ),
      milestonesCompleted: project.milestones.filter(m => m.paymentReleased).length,
      totalMilestones: project.milestones.length,
      healthScore: this.calculateHealthScore(project)
    };
  }

  /**
   * Calculate project health score
   */
  calculateHealthScore(project) {
    let score = 100;
    
    // Deduct for scope changes
    score -= project.scopeChangeCount * 15;
    
    // Deduct if paused
    if (project.status === 'paused') {
      score -= 30;
    }
    
    // Deduct for locked payments
    const lockedPayments = project.milestones.filter(m => m.paymentLocked).length;
    score -= lockedPayments * 10;
    
    return Math.max(0, Math.min(100, score));
  }
}

export const agreementManager = new AgreementManager();
