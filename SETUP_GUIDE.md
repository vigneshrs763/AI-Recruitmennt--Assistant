# AI Recruitment Assistant - Setup & Deployment Guide

## ✅ Project Status: Complete & Ready for Deployment

This is a comprehensive AI-powered recruitment platform built with React, Node.js, TypeScript, and MongoDB. The application follows the complete workflow from landing page through candidate hiring.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (LTS recommended)
- MongoDB Atlas account (or local MongoDB)
- npm or pnpm package manager
- Git

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment (already set up in .env)
cat .env

# Start development server
npm run dev

# Server runs on: http://localhost:5000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (already done: .env.local)
cat .env.local

# Start development server
npm run dev

# Frontend runs on: http://localhost:5173
```

---

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new recruiter account
- `POST /api/auth/login` - Login to workspace
- `POST /api/auth/logout` - Logout from session
- `GET /api/auth/profile` - Get current user profile

### Jobs
- `GET /api/jobs` - List all jobs (requires auth)
- `POST /api/jobs` - Create new job (requires auth)
- `GET /api/jobs/:id` - Get specific job (requires auth)
- `PATCH /api/jobs/:id` - Update job (requires auth)
- `DELETE /api/jobs/:id` - Delete job (requires auth)

### Candidates
- `GET /api/candidates` - List all candidates (requires auth)
- `POST /api/candidates` - Create candidate (requires auth)
- `GET /api/candidates/:id` - Get candidate details (requires auth)
- `PATCH /api/candidates/:id` - Update candidate (requires auth)
- `PATCH /api/candidates/:id/status` - Update candidate status (requires auth)
- `DELETE /api/candidates/:id` - Delete candidate (requires auth)

### Resumes
- `GET /api/resumes` - List uploaded resumes (requires auth)
- `POST /api/resumes/upload` - Upload and process resume (requires auth)
- `GET /api/resumes/:id` - Get resume details (requires auth)
- `DELETE /api/resumes/:id` - Delete resume (requires auth)

### Workspace
- `GET /api/workspace` - Get complete workspace data (requires auth)
- `GET /api/health` - Health check endpoint

---

## 🎯 Complete Workflow Implementation

### 1. **Landing Page**
✅ Animated background with brand messaging
✅ Login/Signup routes
✅ Feature highlights

### 2. **Authentication System**
✅ Sign Up with email, name, company, password
✅ Login with JWT tokens
✅ Password hashing with bcrypt
✅ Session persistence with localStorage
✅ Protected routes

### 3. **Dashboard**
✅ Key metrics display (Jobs, Candidates, Resumes)
✅ Candidate status distribution (Strong Hire, Hire, Consider)
✅ Resume status tracking
✅ Hiring funnel visualization
✅ Live demo mode
✅ Interactive charts and analytics

### 4. **Job Management**
✅ Create job with multi-step form
✅ Auto-generated job descriptions
✅ Skill requirements management
✅ Job listing and details view
✅ Edit/Delete jobs
✅ AI-powered description generation

### 5. **Resume Upload & Analysis**
✅ File upload with drag-and-drop
✅ Resume text extraction
✅ AI-powered skill detection
✅ Automatic candidate profile generation
✅ Score calculation based on keywords
✅ Experience level inference
✅ Job compatibility assessment

### 6. **Candidate Management**
✅ Candidate list with filters
✅ Candidate profile view
✅ Skills and experience display
✅ AI confidence scoring
✅ Status management (Strong Hire, Hire, Consider)
✅ Missing skills identification

### 7. **Interview Features**
✅ Interview questions generation
✅ AI interview feedback system
✅ Question types (Technical, Coding, HR)
✅ PDF export capability

### 8. **Advanced Features**
✅ Hindsight Memory System - Stores recruiter preferences and history
✅ cascadeflow Integration - Intelligent model routing for cost optimization
✅ Candidate Ranking - AI-powered candidate scoring
✅ Notifications System - Real-time updates
✅ Settings Panel - Configuration options

---

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcrypt
- **AI Integration**: Groq API, cascadeflow, Hindsight
- **Additional**: Passport.js (OAuth ready), CORS, dotenv

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router v6
- **HTTP Client**: Fetch API

### Infrastructure
- **Database**: MongoDB Atlas (cloud)
- **API Port**: 5000 (configurable)
- **Frontend Port**: 5173 (Vite default)

---

## 📊 Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  companyName: String,
  password: String (hashed),
  role: String (default: "recruiter"),
  githubId: String (optional),
  githubUsername: String (optional),
  timestamps: true
}
```

### Jobs Collection
```javascript
{
  title: String,
  company: String,
  location: String,
  description: String,
  createdBy: ObjectId (User),
  userId: ObjectId (User),
  companyId: ObjectId (User),
  timestamps: true
}
```

### Candidates Collection
```javascript
{
  id: Number,
  name: String,
  email: String,
  resumeUrl: String,
  status: String (new, strong_hire, hire, consider),
  score: Number (60-95),
  role: String,
  experience: String,
  location: String,
  skills: [String],
  missing: [String],
  education: String,
  summary: String,
  aiConfidence: Number,
  jobId: ObjectId (Job),
  userId: ObjectId (User),
  companyId: ObjectId (User),
  timestamps: true
}
```

### Resumes Collection
```javascript
{
  filename: String,
  originalName: String,
  size: String,
  status: String (uploaded, processing, complete),
  score: Number,
  userId: ObjectId (User),
  companyId: ObjectId (User),
  timestamps: true
}
```

---

## 🔐 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret-key-here
GROQ_API_KEY=gsk_...
HINDSIGHT_API_KEY=hsk_...
CASCADEFLOW_API_KEY=...
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
```

---

## 🧪 Testing the Application

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:5173`

### 4. Test Workflow
1. **Sign Up**: Create new recruiter account
2. **Create Job**: Add job requirement with skills
3. **Upload Resume**: Upload candidate resume
4. **View Candidates**: See AI-analyzed candidates
5. **Candidate Ranking**: View ranked candidates
6. **Interview Questions**: Generate interview questions
7. **Dashboard**: Monitor hiring metrics

---

## 📈 Key Features Implemented

### ✅ Authentication & Authorization
- JWT-based authentication
- Secure password hashing
- Protected API routes
- Session management

### ✅ AI Integration
- Resume text extraction and analysis
- Skill detection from resume content
- Candidate scoring algorithm
- Experience level inference
- Job description generation prompts

### ✅ Data Management
- Full CRUD operations for jobs
- Full CRUD operations for candidates
- Full CRUD operations for resumes
- Real-time workspace synchronization

### ✅ Analytics & Reporting
- Dashboard KPI cards
- Candidate distribution charts
- Hiring funnel visualization
- Resume status tracking
- Cost savings calculation

### ✅ UI/UX
- Dark mode support
- Responsive design
- Glassmorphism design system
- Smooth animations
- Intuitive navigation
- Real-time feedback

---

## 🔧 Development Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev         # Start development server
npm run start       # Start production server
```

### Frontend
```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

---

## 📚 API Usage Examples

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Create Job
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"title":"Senior Developer","company":"TechCorp","location":"San Francisco","description":"..."}'
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"resume.pdf","originalName":"John_Resume.pdf","text":"..."}'
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Update `JWT_SECRET` to strong random value
- [ ] Update `MongoDB` connection string
- [ ] Set `NODE_ENV=production`
- [ ] Update API URL in frontend
- [ ] Add HTTPS certificates
- [ ] Configure CORS for production domain
- [ ] Set up error logging
- [ ] Configure CDN for static assets

### Recommended Hosting
- **Backend**: Heroku, AWS, DigitalOcean, Railway
- **Frontend**: Vercel, Netlify, AWS S3+CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

---

## 📝 Notes

- All passwords are hashed using bcrypt with 10 salt rounds
- JWT tokens expire in 7 days
- Resume scoring uses keyword matching algorithm
- Candidate status updates are tracked with timestamps
- All API routes are protected with authentication middleware
- CORS is enabled for development (configure for production)

---

## 🤝 Contributing

To extend this application:

1. **Add new AI models**: Update the cascadeflow integration
2. **Custom scoring**: Modify resume analysis in `resumeController.js`
3. **UI customization**: Tailwind CSS classes in React components
4. **Database fields**: Update Mongoose schemas

---

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify MongoDB connection
3. Ensure all environment variables are set
4. Check API health endpoint: `http://localhost:5000/api/health`

---

## ✨ Workflow Summary

```
Landing Page
    ↓
Sign Up / Login
    ↓
Dashboard (Overview)
    ↓
Create Job + Upload Resumes (Parallel)
    ↓
AI Analysis (Groq)
    ↓
Resume Matching
    ↓
Candidate Ranking (cascadeflow)
    ↓
Interview Questions Generation
    ↓
Conduct Interview
    ↓
Save Feedback (Hindsight Memory)
    ↓
Generate Offer Letter
    ↓
Hire Candidate
```

---

**Version**: 1.0.0  
**Last Updated**: July 2026  
**Status**: ✅ Production Ready
