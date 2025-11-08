/**
 * AI-powered Scope Creep Detector
 * Analyzes client messages to detect scope creep patterns
 */

class ScopeCreepDetector {
  constructor() {
    // Common scope creep phrases and patterns
    this.scopeCreepPatterns = [
      /can we (also|just|quickly)/i,
      /while you're at it/i,
      /one more (thing|quick thing)/i,
      /just takes? (five|5|ten|10) minutes?/i,
      /real quick/i,
      /shouldn't be (too )?hard/i,
      /easy change/i,
      /small tweak/i,
      /minor adjustment/i,
      /quick fix/i,
      /add(ing)? (a |one )?few/i,
      /could we (also|just)/i,
      /before we launch/i,
      /forgot to mention/i,
      /oh (and|also|by the way)/i,
    ];

    this.passiveAggressivePatterns = [
      /i thought (this|you) would/i,
      /i assumed/i,
      /obviously/i,
      /surely/i,
      /everyone else does/i,
      /this should have been/i,
      /why (isn't|wasn't) this/i,
    ];
  }

  /**
   * Analyze a message for scope creep indicators
   */
  async analyzeMessage(projectId, message, sender) {
    const lowerMessage = message.toLowerCase();
    
    // Check for scope creep patterns
    const scopeCreepMatches = this.scopeCreepPatterns.filter(pattern => 
      pattern.test(message)
    );
    
    const passiveAggressiveMatches = this.passiveAggressivePatterns.filter(pattern =>
      pattern.test(message)
    );
    
    const isScopeCreep = scopeCreepMatches.length > 0;
    const isPassiveAggressive = passiveAggressiveMatches.length > 0;
    
    // Estimate additional hours based on message content
    const estimatedHours = this.estimateAdditionalWork(message);
    
    // Calculate confidence score
    const confidence = this.calculateConfidence(scopeCreepMatches, passiveAggressiveMatches, message);
    
    return {
      projectId,
      message,
      sender,
      isScopeCreep,
      isPassiveAggressive,
      confidence,
      matchedPatterns: scopeCreepMatches.map(p => p.source),
      estimatedAdditionalHours: estimatedHours,
      flags: this.generateFlags(isScopeCreep, isPassiveAggressive, estimatedHours),
      recommendedAction: this.recommendAction(isScopeCreep, estimatedHours, confidence),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Estimate additional work hours from message
   */
  estimateAdditionalWork(message) {
    const workKeywords = {
      'page': 4,
      'feature': 6,
      'integration': 8,
      'api': 6,
      'redesign': 20,
      'animation': 4,
      'form': 2,
      'button': 0.5,
      'color': 0.5,
      'mobile': 10,
      'responsive': 8
    };
    
    let hours = 0;
    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, keywordHours] of Object.entries(workKeywords)) {
      if (lowerMessage.includes(keyword)) {
        hours += keywordHours;
      }
    }
    
    // If phrases like "just" or "quick" but no specific work, estimate 3 hours
    if (hours === 0 && /just|quick|small|minor|tiny/.test(lowerMessage)) {
      hours = 3;
    }
    
    return hours;
  }

  /**
   * Calculate confidence score (0-100)
   */
  calculateConfidence(scopeMatches, passiveMatches, message) {
    let score = 0;
    
    // Base score on pattern matches
    score += scopeMatches.length * 25;
    score += passiveMatches.length * 15;
    
    // Check message length (longer = more likely to be scope creep)
    if (message.length > 200) score += 10;
    
    // Check for question marks (scope creep often phrased as questions)
    const questionMarks = (message.match(/\?/g) || []).length;
    score += Math.min(questionMarks * 5, 20);
    
    return Math.min(score, 100);
  }

  /**
   * Generate warning flags
   */
  generateFlags(isScopeCreep, isPassiveAggressive, hours) {
    const flags = [];
    
    if (isScopeCreep) {
      flags.push('✨ SCOPE_AWARENESS');
    }
    
    if (isPassiveAggressive) {
      flags.push('⚠️ TONE_NOTED');
    }
    
    if (hours > 10) {
      flags.push('💫 SIGNIFICANT_ADDITIONAL_WORK');
    } else if (hours > 5) {
      flags.push('🌿 MODERATE_ADDITIONAL_WORK');
    } else if (hours > 0) {
      flags.push('📝 MINOR_ADDITIONAL_WORK');
    }
    
    return flags;
  }

  /**
   * Recommend action based on analysis
   */
  recommendAction(isScopeCreep, hours, confidence) {
    if (!isScopeCreep) {
      return 'CONTINUE';
    }
    
    if (confidence > 75 && hours > 5) {
      return 'PAUSE_AND_RENEGOTIATE';
    } else if (confidence > 50 && hours > 2) {
      return 'SEND_RENEGOTIATION_REQUEST';
    } else {
      return 'SEND_ALERT';
    }
  }

  /**
   * Translate passive-aggressive messages to legal English
   */
  async translateToLegalEnglish(message) {
    // Remove passive-aggressive tone
    let translated = message;
    
    const translations = {
      "can we just": "I would like to request",
      "real quick": "an additional task",
      "shouldn't be hard": "would require",
      "easy change": "modification to the agreed scope",
      "quick fix": "amendment",
      "while you're at it": "Additionally, I request",
      "just takes five minutes": "requires additional work estimated at",
      "i thought this would": "I kindly request that",
      "obviously": "Respectfully,",
      "surely": "I believe",
      "forgot to mention": "I am now requesting",
      "oh and": "Additionally,",
      "one more thing": "An additional requirement:",
    };
    
    for (const [casual, formal] of Object.entries(translations)) {
      const regex = new RegExp(casual, 'gi');
      translated = translated.replace(regex, formal);
    }
    
    // Add formal structure
    return {
      formalVersion: `REQUEST FOR SCOPE ADJUSTMENT:\n\n${translated}\n\nThis request represents a change to the original scope of work and may require adjustment to timeline and compensation.`,
      casualVersion: message,
      analysis: "Message contains language that suggests scope adjustment. Translated to professional contract language.",
      billableHours: this.estimateAdditionalWork(message)
    };
  }
}

export const scopeCreepDetector = new ScopeCreepDetector();
