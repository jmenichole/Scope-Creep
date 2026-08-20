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
 * Alert Service
 * Sends alerts and notifications for scope creep detection
 */

class AlertService {
  constructor() {
    this.alerts = [];
  }

  /**
   * Send scope creep alert
   */
  async sendScopeCreepAlert(projectId, analysis) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type: 'scope_awareness',
      severity: this.calculateSeverity(analysis),
      title: this.generateAlertTitle(analysis),
      message: this.generateAlertMessage(analysis),
      analysis,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    // In production, send actual notifications (email, SMS, webhook)
    console.log('✨ Scope Awareness:', alert.title);
    console.log('   Message:', analysis.message);
    console.log('   Estimated hours:', analysis.estimatedAdditionalHours);
    console.log('   Recommended action:', analysis.recommendedAction);
    
    return alert;
  }

  /**
   * Calculate alert severity
   */
  calculateSeverity(analysis) {
    if (analysis.estimatedAdditionalHours > 10) {
      return 'needs-attention';
    } else if (analysis.estimatedAdditionalHours > 5) {
      return 'notable';
    } else if (analysis.estimatedAdditionalHours > 2) {
      return 'gentle-reminder';
    } else {
      return 'awareness';
    }
  }

  /**
   * Generate alert title
   */
  generateAlertTitle(analysis) {
    const hours = analysis.estimatedAdditionalHours;
    
    if (hours > 10) {
      return `💫 Significant scope adjustment noticed (${hours}+ hours)`;
    } else if (hours > 5) {
      return `⚠️ Pending negotiation: Scope adjustment detected (${hours} hours)`;
    } else if (hours > 0) {
      return `🌿 Scope shift detected (${hours} hours)`;
    } else {
      return `✨ All within scope — monitoring patterns`;
    }
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(analysis) {
    let message = `A scope adjustment has been gently detected in the project message.\n\n`;
    message += `Original message: "${analysis.message}"\n\n`;
    message += `Estimated additional work: ${analysis.estimatedAdditionalHours} hours\n`;
    message += `Confidence: ${analysis.confidence}%\n`;
    message += `Flags: ${analysis.flags.join(', ')}\n\n`;
    message += `Recommended action: ${analysis.recommendedAction}\n`;
    
    return message;
  }

  /**
   * Send renegotiation request
   */
  async sendRenegotiationRequest(projectId, renegotiation) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type: 'renegotiation_request',
      severity: 'gentle-reminder',
      title: '🌸 Terms Update Suggested',
      message: this.generateRenegotiationMessage(renegotiation),
      renegotiation,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    console.log('🌸 Terms Update Suggested:', renegotiation);
    
    return alert;
  }

  /**
   * Generate renegotiation message
   */
  generateRenegotiationMessage(renegotiation) {
    return `
Your client has kindly requested additional work that suggests updating the terms:

Additional Work: ${renegotiation.additionalWork}
Original Budget: $${renegotiation.originalBudget}
Updated Proposal: $${renegotiation.newQuote}
Additional Investment: $${renegotiation.additionalCost}

Please review and consider this adjustment to continue our collaboration.
    `.trim();
  }

  /**
   * Send project pause notification
   */
  async sendPauseNotification(projectId, reason) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type: 'project_paused',
      severity: 'needs-attention',
      title: '☁️ Project Paused',
      message: `Project has entered a mindful pause: ${reason}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    console.log('☁️ Project Paused:', reason);
    
    return alert;
  }

  /**
   * Get alerts for a project
   */
  getAlerts(projectId, unreadOnly = false) {
    let alerts = this.alerts.filter(a => a.projectId === projectId);
    
    if (unreadOnly) {
      alerts = alerts.filter(a => !a.read);
    }
    
    return alerts.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * Mark alert as read
   */
  markAsRead(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.read = true;
      alert.readAt = new Date().toISOString();
    }
    return alert;
  }
}

export const alertService = new AlertService();
