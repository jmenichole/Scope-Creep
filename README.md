# Boundari.ai

**Tagline:** "Nice freelancer. Mean contracts."

**Theme:** Calm Productivity App with a Backbone

## What It Is

AI-powered tool that gently but firmly enforces freelance agreements. When a client adds non-agreed tasks, the system kindly flags it with soothing notifications while maintaining professional boundaries.

## 🎨 Design Philosophy

**Vibe:** Think Headspace meets Contract Law

Animations and friendly fonts with a hidden undertone of professional boundaries. The interface is soothing enough to look like you're agreeing to changes, but you're actually setting legal boundaries in pastel.

**Color Palette:**
- **Warm Taupe** (#C9B8A8) - Primary background
- **Soft Mint** (#B8DED1) - Success states
- **Ivory** (#F8F6F1) - Content background
- **Moss Green** (#7A9A7E) - Primary actions
- **Muted Teal** (#88B5B5) - Accents
- **Dusty Lavender** (#B5A7C4) - Secondary accents

**Status Messages:**
- ✨ All within scope
- 🌿 Scope aligned
- ⚠️ Pending negotiation
- 💫 Reviewing request
- 🌸 Terms updated
- ☁️ Project paused

*No red alerts, just emotional boundaries.*

## 🎯 Features

### 1. **AI Scope Awareness**
- Gently detects when clients ask for more than agreed
- Recognizes patterns like "Can we also just...", "Real quick...", "While you're at it..."
- Analyzes message sentiment with calm professionalism
- Estimates additional hours required with transparency

### 2. **Gentle Renegotiation Flow**
- "✨ Client requested 3 additional hours. Here's the updated proposal."
- Generates professional renegotiation requests automatically
- Tracks all scope adjustments with mindful transparency
- Maintains complete audit trail of modifications

### 3. **Mindful Pause / Project Breathing Room**
- Pause work gracefully when scope shifts detected
- Hold milestone payments until terms are realigned
- Protect your time with professional boundaries
- Resume seamlessly after renegotiation approval

### 4. **Escrow Mode**
- Milestone-based payment tracking
- Freeze payouts if terms aren't respected
- Release payments only when milestones met
- Full transparency on payment status

### 5. **Professional Translation (Bonus)**
- Takes client scope shift messages
- Kindly rewrites them in professionally binding language
- Converts casual requests to formal contract adjustments
- Example: "Can we just add..." → "REQUEST FOR SCOPE ADJUSTMENT: I kindly request..."

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
  "flags": ["✨ SCOPE_AWARENESS", "📝 MINOR_ADDITIONAL_WORK"],
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
  "translated": "REQUEST FOR SCOPE ADJUSTMENT:\n\nI would like to request add a few animations? an additional task, Additionally, I request!\n\nThis request represents a change to the original scope of work and may require adjustment to timeline and compensation.",
  "billableHours": 4
}
```

### Pause Project (Mindful Pause)
```http
POST /api/projects/{projectId}/pause
Content-Type: application/json

{
  "reason": "Client requesting scope adjustments beyond original agreement"
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
AI Detects: Scope shift (85% confidence), 4 additional hours
   ↓
System Action: Send gentle notification to freelancer
   ↓
Freelancer: Reviews, selects "Pause & Renegotiate"
   ↓
System: Gracefully pauses project, holds milestone payments
   ↓
Auto-generated: "✨ Client requested animation work (+4 hours). Updated proposal: $5,750"
   ↓
Client: Reviews and approves
   ↓
System: Resumes project, updates budget, releases payments
```

## 🔒 Key Benefits

✅ **Save Time**: No more difficult conversations about scope changes  
✅ **Get Paid Fairly**: Gentle but firm quotes for additional work  
✅ **Protect Your Boundaries**: Mindful pause when clients need realignment  
✅ **Stay Professional**: Converts casual requests to formal adjustments  
✅ **Full Transparency**: Complete audit trail of all changes  
✅ **Automated Peace**: Works 24/7, maintaining your boundaries while you rest  

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

This tool helps maintain professional boundaries and manage scope changes with grace, but doesn't replace professional legal advice or formal contracts. Always use proper written agreements for freelance work.

---

**Built for freelancers who believe in being kind but firm. 🌿**
