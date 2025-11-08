# Scope Creep Insurance

**Tagline:** "Secure your scope. Save your sanity."

## What It Is

AI-powered tool that auto-enforces freelance contracts. When a client adds non-agreed tasks, the system flags it, sends alerts, or locks the project until renegotiation.

## 🎯 Features

### 1. **AI Scope Creep Detection**
- Automatically detects when clients ask for more than agreed
- Recognizes patterns like "Can we also just...", "Real quick...", "Shouldn't be hard..."
- Analyzes message sentiment and passive-aggressive language
- Estimates additional hours required

### 2. **Automated Renegotiation Flow**
- "Client added 3 hours of work. Here's the new quote."
- Generates formal renegotiation requests automatically
- Tracks all scope changes and associated costs
- Maintains audit trail of modifications

### 3. **Kill-Switch / Project Pause**
- Pause work immediately when scope creep detected
- Lock milestone payments until terms are adjusted
- Protect your time and sanity
- Resume only after renegotiation approval

### 4. **Escrow Mode**
- Milestone-based payment tracking
- Freeze payouts if terms aren't respected
- Release payments only when milestones met
- Full transparency on payment status

### 5. **Passive-Aggressive Translation (Bonus)**
- Takes client scope creep messages
- Auto-rewrites them in legally binding English
- Converts casual requests to formal contract amendments
- Example: "Can we just add..." → "REQUEST FOR SCOPE MODIFICATION: I request..."

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Start the Server

```bash
npm start
```

The API will be available at `http://localhost:3000`

### Development Mode

```bash
npm run dev
```

## 📡 API Endpoints

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "clientId": "client123",
  "freelancerId": "freelancer456",
  "scope": "Build a landing page with 5 sections",
  "budget": 5000,
  "milestones": []
}
```

### Analyze Message for Scope Creep
```http
POST /api/analyze-message
Content-Type: application/json

{
  "projectId": "proj_123",
  "message": "Hey can we also just add a quick contact form? Real quick, shouldn't be hard!",
  "sender": "client"
}
```

**Response:**
```json
{
  "isScopeCreep": true,
  "confidence": 85,
  "estimatedAdditionalHours": 3,
  "flags": ["🚨 SCOPE_CREEP_DETECTED", "📝 MINOR_ADDITIONAL_WORK"],
  "recommendedAction": "SEND_RENEGOTIATION_REQUEST"
}
```

### Translate Message to Legal English
```http
POST /api/translate-message
Content-Type: application/json

{
  "message": "Can we just add a few animations? Real quick, while you're at it!"
}
```

**Response:**
```json
{
  "original": "Can we just add a few animations? Real quick, while you're at it!",
  "translated": "REQUEST FOR SCOPE MODIFICATION:\n\nI would like to request add a few animations? an additional task, Additionally, I request!\n\nThis request constitutes a change to the original scope of work and may require adjustment to timeline and compensation.",
  "billableHours": 4
}
```

### Pause Project (Kill-Switch)
```http
POST /api/projects/{projectId}/pause
Content-Type: application/json

{
  "reason": "Client making excessive scope change requests"
}
```

### Create Renegotiation
```http
POST /api/projects/{projectId}/renegotiate
Content-Type: application/json

{
  "additionalWork": "Add contact form with email integration",
  "newQuote": 5750
}
```

## 💰 Monetization

### 1. **Monthly Subscription**
- Basic: $29/month (10 projects)
- Pro: $79/month (unlimited projects, priority support)
- Enterprise: Custom pricing (API access, white-label)

### 2. **Per-Project Percentage**
- Take 2-3% of project value
- Only charged on completed projects
- No subscription required

### 3. **Marketplace Add-on**
- Integrate with Upwork, Fiverr, Freelancer.com
- Sell as premium feature
- Revenue share with platforms

## 🎯 Target Users

**Everyone who's heard "this'll just take five minutes" and aged 12 years.**

Perfect for:
- 👨‍💻 Web developers
- 🎨 Graphic designers  
- ✍️ Content writers
- 📊 Consultants
- 🎥 Video editors
- 📸 Photographers
- 💼 Any freelancer dealing with scope creep

## 🧠 How It Works

### Scope Creep Detection

The AI analyzes client messages using pattern matching and keyword analysis:

1. **Pattern Recognition**: Detects phrases like "can we just", "real quick", "while you're at it"
2. **Work Estimation**: Calculates additional hours based on mentioned features
3. **Confidence Scoring**: Assigns confidence level (0-100%) to detection
4. **Action Recommendation**: Suggests next steps (alert, pause, renegotiate)

### Example Flow

```
Client: "Hey can we just add a few animations? Real quick!"
   ↓
AI Detects: Scope creep (85% confidence), 4 additional hours
   ↓
System Action: Send alert to freelancer
   ↓
Freelancer: Reviews, clicks "Pause & Renegotiate"
   ↓
System: Pauses project, locks milestone payments
   ↓
Auto-generated: "Client requested animation work (+4 hours). New quote: $5,750"
   ↓
Client: Reviews and approves
   ↓
System: Resumes project, updates budget, unlocks payments
```

## 🔒 Key Benefits

✅ **Save Time**: No more arguing about scope changes  
✅ **Get Paid Fairly**: Automatic quotes for additional work  
✅ **Protect Your Sanity**: Kill-switch when clients get unreasonable  
✅ **Professional**: Converts casual requests to formal amendments  
✅ **Transparent**: Complete audit trail of all changes  
✅ **Automated**: Works 24/7, even while you sleep  

## 📊 Tech Stack

- **Backend**: Node.js + Express
- **AI/ML**: Pattern matching and NLP-inspired detection
- **Storage**: In-memory (can be extended to PostgreSQL/MongoDB)
- **API**: RESTful JSON API

## 🛣️ Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] Real email/SMS notifications
- [ ] Stripe integration for payments
- [ ] Browser extension for Gmail/Slack
- [ ] Machine learning model training
- [ ] Mobile app (iOS/Android)
- [ ] Marketplace integrations
- [ ] Multi-language support

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! This is a SaaS application, not a blockchain project.

## ⚠️ Disclaimer

This tool helps detect and manage scope creep but doesn't replace professional legal advice or formal contracts. Always use proper written agreements for freelance work.

---

**Built for freelancers, by someone who's been there. 🙌**
