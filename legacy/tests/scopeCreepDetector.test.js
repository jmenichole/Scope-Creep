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
    
    assert.ok(result.formalVersion.includes('REQUEST FOR SCOPE ADJUSTMENT'));
    assert.ok(result.billableHours > 0);
  });
});
