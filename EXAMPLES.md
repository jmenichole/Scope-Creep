# Scope Creep Insurance - Examples

## Example 1: Basic Scope Creep Detection

### Scenario
Client sends a message that contains scope creep language.

### API Request
```bash
curl -X POST http://localhost:3000/api/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_123",
    "message": "Hey can we also just add a quick contact form? Real quick, shouldn'\''t be hard!",
    "sender": "client"
  }'
```

### Response
```json
{
  "projectId": "proj_123",
  "message": "Hey can we also just add a quick contact form? Real quick, shouldn't be hard!",
  "sender": "client",
  "isScopeCreep": true,
  "isPassiveAggressive": false,
  "confidence": 80,
  "matchedPatterns": [
    "/can we (also|just|quickly)/i",
    "/real quick/i",
    "/shouldn't be (too )?hard/i"
  ],
  "estimatedAdditionalHours": 3,
  "flags": [
    "🚨 SCOPE_CREEP_DETECTED",
    "📝 MINOR_ADDITIONAL_WORK"
  ],
  "recommendedAction": "SEND_RENEGOTIATION_REQUEST"
}
```

## Example 2: Passive-Aggressive Message Translation

### Scenario
Client sends a passive-aggressive message that needs translation to formal language.

### API Request
```bash
curl -X POST http://localhost:3000/api/translate-message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can we just add a few animations? Real quick, while you'\''re at it!"
  }'
```

### Response
```json
{
  "original": "Can we just add a few animations? Real quick, while you're at it!",
  "translated": "REQUEST FOR SCOPE MODIFICATION:\n\nI would like to request add a few animations? an additional task, Additionally, I request!\n\nThis request constitutes a change to the original scope of work and may require adjustment to timeline and compensation.",
  "analysis": "Message contains language that suggests scope modification. Translated to formal contract language.",
  "billableHours": 4
}
```

## Example 3: Full Project Lifecycle

### Step 1: Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "client_abc",
    "freelancerId": "freelancer_xyz",
    "scope": "Build a landing page with 5 sections: Hero, Features, Pricing, Testimonials, Contact",
    "budget": 5000,
    "milestones": [
      { "id": "m1", "name": "Design mockups", "amount": 1500 },
      { "id": "m2", "name": "Development", "amount": 2500 },
      { "id": "m3", "name": "Testing & Launch", "amount": 1000 }
    ]
  }'
```

### Step 2: Client Requests Additional Work
Client message: "Oh by the way, can we also just add a blog section? Should be easy!"

```bash
curl -X POST http://localhost:3000/api/analyze-message \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj_1699564800_abc123",
    "message": "Oh by the way, can we also just add a blog section? Should be easy!",
    "sender": "client"
  }'
```

**AI Detection Result:**
- Scope creep detected: YES
- Estimated hours: 10+ (blog requires significant work)
- Recommended action: PAUSE_AND_RENEGOTIATE

### Step 3: Pause Project (Kill-Switch)
```bash
curl -X POST http://localhost:3000/api/projects/proj_1699564800_abc123/pause \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Client requested additional blog section (10+ hours) not in original scope"
  }'
```

### Step 4: Create Renegotiation
```bash
curl -X POST http://localhost:3000/api/projects/proj_1699564800_abc123/renegotiate \
  -H "Content-Type: application/json" \
  -d '{
    "additionalWork": "Blog section with post listing, single post pages, categories, and admin interface",
    "newQuote": 7500
  }'
```

### Step 5: Check Project Status
```bash
curl http://localhost:3000/api/projects/proj_1699564800_abc123
```

**Response:**
```json
{
  "id": "proj_1699564800_abc123",
  "status": "paused",
  "scopeChangeCount": 1,
  "budget": 5000,
  "renegotiations": [
    {
      "additionalWork": "Blog section...",
      "newQuote": 7500,
      "additionalCost": 2500,
      "status": "pending"
    }
  ],
  "milestones": [
    {
      "id": "m1",
      "name": "Design mockups",
      "amount": 1500,
      "paymentLocked": true,
      "lockReason": "Client requested additional blog section..."
    }
  ]
}
```

## Example 4: Multiple Scope Changes

### Scenario
Client keeps adding "quick" tasks. After 3 changes, project auto-pauses.

```bash
# Change 1
curl -X POST http://localhost:3000/api/projects/proj_123/renegotiate \
  -d '{"additionalWork": "Add animations", "newQuote": 5500}'

# Change 2  
curl -X POST http://localhost:3000/api/projects/proj_123/renegotiate \
  -d '{"additionalWork": "Add mobile menu", "newQuote": 6000}'

# Change 3 - AUTO-PAUSE TRIGGERED
curl -X POST http://localhost:3000/api/projects/proj_123/renegotiate \
  -d '{"additionalWork": "Add newsletter integration", "newQuote": 6800}'
```

**System Action:** Project automatically paused due to excessive scope changes.

## Example 5: Scope Creep Phrases Detected

### Common Phrases That Trigger Detection

| Client Says | AI Detects | Estimated Hours |
|------------|------------|-----------------|
| "Can we just add..." | ✅ High confidence | 3+ hours |
| "Real quick..." | ✅ High confidence | 2-5 hours |
| "While you're at it..." | ✅ High confidence | Variable |
| "Shouldn't be too hard" | ✅ Medium confidence | Variable |
| "One more thing..." | ✅ Medium confidence | 2+ hours |
| "Just a small tweak..." | ✅ Medium confidence | 1-3 hours |
| "Everyone else does it..." | ✅ Passive-aggressive | Variable |
| "I thought this would..." | ✅ Passive-aggressive | Variable |

## Example 6: Health Score Monitoring

```bash
curl http://localhost:3000/api/projects/proj_123/stats
```

**Response:**
```json
{
  "projectId": "proj_123",
  "status": "active",
  "scopeChangeCount": 2,
  "originalBudget": 5000,
  "currentBudget": 6000,
  "additionalCost": 1000,
  "milestonesCompleted": 1,
  "totalMilestones": 3,
  "healthScore": 70
}
```

### Health Score Breakdown
- 100: Perfect, no scope changes
- 85-99: Minor adjustments, healthy project
- 70-84: Some scope creep, monitor closely
- 50-69: Multiple scope changes, at risk
- 0-49: Critical, consider pausing or renegotiating

## Testing Locally

Start the server:
```bash
npm start
```

Run automated tests:
```bash
npm test
```

## Integration Examples

### Slack Bot Integration
Monitor Slack messages for scope creep:

```javascript
import { scopeCreepDetector } from './ai/scopeCreepDetector.js';

slackBot.on('message', async (msg) => {
  if (msg.user === clientId) {
    const analysis = await scopeCreepDetector.analyzeMessage(
      projectId,
      msg.text,
      'client'
    );
    
    if (analysis.isScopeCreep) {
      await slackBot.sendAlert(freelancerId, analysis);
    }
  }
});
```

### Email Parser Integration
Parse client emails for scope creep:

```javascript
import { scopeCreepDetector } from './ai/scopeCreepDetector.js';

emailParser.on('email', async (email) => {
  if (email.from === clientEmail) {
    const analysis = await scopeCreepDetector.analyzeMessage(
      projectId,
      email.body,
      'client'
    );
    
    if (analysis.recommendedAction === 'PAUSE_AND_RENEGOTIATE') {
      await pauseProject(projectId);
      await sendRenegotiationEmail(clientEmail, analysis);
    }
  }
});
```

## Tips for Freelancers

1. **Set Up Auto-Monitoring**: Connect to your communication channels
2. **Define Clear Scope**: The AI works best with well-defined project scope
3. **Act on Alerts**: Don't ignore scope creep warnings
4. **Use Kill-Switch Wisely**: Pause immediately when client becomes unreasonable
5. **Document Everything**: All changes tracked automatically for your protection
