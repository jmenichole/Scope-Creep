import { describe, it } from 'node:test';
import assert from 'node:assert';
import { scopeCreepDetector } from '../src/ai/scopeCreepDetector.js';

describe('Scope Creep Detector', () => {
  it('should detect scope creep patterns', async () => {
    const result = await scopeCreepDetector.analyzeMessage(
      'proj_123',
      'Hey can we just add a quick contact form? Real quick!',
      'client'
    );
    
    assert.strictEqual(result.isScopeCreep, true);
    assert.ok(result.confidence > 50);
    assert.ok(result.estimatedAdditionalHours > 0);
  });

  it('should not flag normal messages', async () => {
    const result = await scopeCreepDetector.analyzeMessage(
      'proj_123',
      'The project looks great! Thanks for the update.',
      'client'
    );
    
    assert.strictEqual(result.isScopeCreep, false);
  });

  it('should estimate work hours correctly', () => {
    const message = 'Can you add a new page with forms and mobile responsive design?';
    const hours = scopeCreepDetector.estimateAdditionalWork(message);
    
    assert.ok(hours > 10); // Should detect 'page', 'form', 'mobile', 'responsive'
  });

  it('should detect passive-aggressive language', async () => {
    const result = await scopeCreepDetector.analyzeMessage(
      'proj_123',
      'I thought this would be included already. Obviously everyone else does it.',
      'client'
    );
    
    assert.strictEqual(result.isPassiveAggressive, true);
  });

  it('should translate casual to legal English', async () => {
    const result = await scopeCreepDetector.translateToLegalEnglish(
      'Can we just add a few animations? Real quick!'
    );
    
    assert.ok(result.formalVersion.includes('REQUEST FOR SCOPE MODIFICATION'));
    assert.ok(result.billableHours > 0);
  });
});
