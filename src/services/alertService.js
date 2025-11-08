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
      type: 'scope_creep',
      severity: this.calculateSeverity(analysis),
      title: this.generateAlertTitle(analysis),
      message: this.generateAlertMessage(analysis),
      analysis,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    // In production, send actual notifications (email, SMS, webhook)
    console.log('🚨 SCOPE CREEP ALERT:', alert.title);
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
      return 'critical';
    } else if (analysis.estimatedAdditionalHours > 5) {
      return 'high';
    } else if (analysis.estimatedAdditionalHours > 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate alert title
   */
  generateAlertTitle(analysis) {
    const hours = analysis.estimatedAdditionalHours;
    
    if (hours > 10) {
      return `🚨 CRITICAL: Major scope change detected (${hours}+ hours)`;
    } else if (hours > 5) {
      return `⚠️ WARNING: Significant scope change detected (${hours} hours)`;
    } else if (hours > 0) {
      return `📋 NOTICE: Scope modification detected (${hours} hours)`;
    } else {
      return `ℹ️ INFO: Potential scope creep pattern detected`;
    }
  }

  /**
   * Generate alert message
   */
  generateAlertMessage(analysis) {
    let message = `Scope creep detected in project message.\n\n`;
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
      severity: 'medium',
      title: '💰 Renegotiation Required',
      message: this.generateRenegotiationMessage(renegotiation),
      renegotiation,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    console.log('💰 RENEGOTIATION REQUEST:', renegotiation);
    
    return alert;
  }

  /**
   * Generate renegotiation message
   */
  generateRenegotiationMessage(renegotiation) {
    return `
Client has requested additional work that requires renegotiation:

Additional Work: ${renegotiation.additionalWork}
Original Budget: $${renegotiation.originalBudget}
New Quote: $${renegotiation.newQuote}
Additional Cost: $${renegotiation.additionalCost}

Please review and approve this renegotiation to continue work.
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
      severity: 'critical',
      title: '🛑 Project Paused',
      message: `Project has been paused: ${reason}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    this.alerts.push(alert);
    
    console.log('🛑 PROJECT PAUSED:', reason);
    
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
