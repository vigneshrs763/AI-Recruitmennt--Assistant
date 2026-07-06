# AI Recruitment Assistant - Developer Quick Reference

## 🚀 Quick Start (5 minutes)

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
# ✅ Server on http://localhost:5000
```

### 2. Start Frontend  
```bash
cd frontend
npm install
npm run dev
# ✅ App on http://localhost:5173
```

### 3. Open Browser
```
http://localhost:5173
```

### 4. Test Workflow
```
Sign Up → Create Job → Upload Resume → View Candidate → Check Dashboard
```

---

## 📡 API Quick Reference

### Authentication
```bash
# Sign Up
POST /api/auth/signup
Body: { name, email, companyName, password, confirmPassword }

# Login
POST /api/auth/login
Body: { email, password }
Response: { token, user }

# Get Profile (requires token)
GET /api/auth/profile
Header: Authorization: Bearer <token>
```

### Jobs
```bash
# List Jobs (requires token)
GET /api/jobs
Header: Authorization: Bearer <token>

# Create Job (requires token)
POST /api/jobs
Header: Authorization: Bearer <token>
Body: { title, company, location, description, requirements }

# Get Job (requires token)
GET /api/jobs/:id
Header: Authorization: Bearer <token>

# Update Job (requires token)
PATCH /api/jobs/:id
Header: Authorization: Bearer <token>
Body: { title, location, ... }

# Delete Job (requires token)
DELETE /api/jobs/:id
Header: Authorization: Bearer <token>
```

### Candidates
```bash
# List Candidates (requires token)
GET /api/candidates
Header: Authorization: Bearer <token>

# Create Candidate (requires token)
POST /api/candidates
Header: Authorization: Bearer <token>
Body: { name, email, role, skills, ... }

# Get Candidate (requires token)
GET /api/candidates/:id
Header: Authorization: Bearer <token>

# Update Candidate (requires token)
PATCH /api/candidates/:id
Header: Authorization: Bearer <token>
Body: { role, status, score, ... }

# Update Candidate Status (requires token)
PATCH /api/candidates/:id/status
Header: Authorization: Bearer <token>
Body: { status, score }

# Delete Candidate (requires token)
DELETE /api/candidates/:id
Header: Authorization: Bearer <token>
```

### Resumes
```bash
# List Resumes (requires token)
GET /api/resumes
Header: Authorization: Bearer <token>

# Upload Resume (requires token)
POST /api/resumes/upload
Header: Authorization: Bearer <token>
Body: { filename, originalName, text }

# Get Resume (requires token)
GET /api/resumes/:id
Header: Authorization: Bearer <token>

# Delete Resume (requires token)
DELETE /api/resumes/:id
Header: Authorization: Bearer <token>
```

### Workspace
```bash
# Get Complete Workspace (requires token)
GET /api/workspace
Header: Authorization: Bearer <token>
Response: { user, jobs, candidates, resumes }

# Health Check (no auth needed)
GET /api/health
Response: { status, database }
```

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── passport.js        # OAuth config
│   ├── controllers/
│   │   ├── authController.js  # Auth logic
│   │   ├── jobController.js   # Job CRUD
│   │   ├── candidateController.js # Candidate CRUD
│   │   ├── resumeController.js    # Resume CRUD
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   ├── Candidate.js
│   │   ├── Resume.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── jobs.js
│   │   ├── candidates.js
│   │   ├── resumes.js
│   ├── middleware/
│   │   ├── auth.js
├── .env
├── package.json

frontend/
├── src/
│   ├── main.tsx              # Entry point
│   ├── app/
│   │   ├── App.tsx           # Main app with pages
│   │   ├── auth.tsx          # Auth context
│   │   ├── api.ts            # API client
│   │   ├── ProtectedRoute.tsx
│   │   ├── components/       # UI components
│   ├── styles/               # CSS files
├── .env.local
├── package.json
```

---

## 🔑 Key Files to Edit

### To Add New API Endpoint:
1. Create function in `backend/src/controllers/<name>Controller.js`
2. Add route in `backend/src/routes/<name>.js`
3. Wrap with `authMiddleware` if auth needed

### To Add New Frontend Page:
1. Create function component in `frontend/src/app/App.tsx`
2. Add page type in `Page` type definition
3. Add case in `renderPage()` switch
4. Add navigation item in `NAV_ITEMS`

### To Modify Database Schema:
1. Update `backend/src/models/<Name>.js`
2. Add migration if needed
3. Update API controllers

---

## 🧪 Testing Endpoints

### Using cURL
```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "companyName": "TechCorp",
    "password": "Password123!",
    "confirmPassword": "Password123!"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123!"
  }'

# List Jobs (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman
1. Create POST request to `http://localhost:5000/api/auth/login`
2. Add JSON body with email and password
3. Copy token from response
4. Create GET request to `http://localhost:5000/api/jobs`
5. Add header: `Authorization: Bearer <token>`

---

## 🔍 Debugging Tips

### Backend Issues
```bash
# Check server is running
curl http://localhost:5000

# Check database connection
curl http://localhost:5000/api/health

# View server logs
npm run dev

# Test specific endpoint
curl -X GET http://localhost:5000/api/jobs \
  -H "Authorization: Bearer TOKEN"
```

### Frontend Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Check browser console for errors
F12 → Console tab
```

### Database Issues
```bash
# Check MongoDB connection in .env
# Verify MONGODB_URI is correct
# Test connection with MongoDB Compass

# Check user ownership in queries
# All queries should filter by userId
```

---

## 📊 Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your-secret-key
GROQ_API_KEY=gsk_...
HINDSIGHT_API_KEY=hsk_...
CASCADEFLOW_API_KEY=...
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
```

---

## 🔐 Authentication Flow

```
User Input Email/Password
        ↓
POST /api/auth/login
        ↓
Validate credentials
        ↓
Generate JWT token
        ↓
Return token + user
        ↓
Store in localStorage
        ↓
Add to all API requests
Header: Authorization: Bearer <token>
        ↓
authMiddleware validates
        ↓
Route handler executes
```

---

## 📦 Adding Dependencies

### Backend
```bash
cd backend
npm install <package>
npm run dev  # Restart server
```

### Frontend
```bash
cd frontend
npm install <package>
npm run dev  # Vite auto-reloads
```

---

## 🚀 Deployment Commands

### Build for Production
```bash
# Backend (no build needed, uses Node.js directly)
cd backend
npm run start  # Runs with NODE_ENV=production

# Frontend
cd frontend
npm run build
# Output: dist/
```

### Deploy Frontend (Vercel)
```bash
npm i -g vercel
vercel
# Follow prompts
```

### Deploy Backend (Heroku)
```bash
heroku login
heroku create <app-name>
git push heroku main
```

---

## 💡 Common Tasks

### Add New Job Fields
1. Update Job model schema
2. Update createJob controller
3. Update frontend CreateJobPage form

### Change Password Hashing
1. Modify bcrypt config in User model
2. Update password comparison logic
3. Test login after change

### Add New API Validation
1. Add validation in controller
2. Return 400 with error message
3. Test with invalid data

### Style UI Changes
1. Edit Tailwind classes in components
2. Use existing Tailwind config
3. Dark mode works automatically

---

## 🎯 Architecture Overview

```
Frontend (React)
    ↓
API Client (fetch + JWT)
    ↓
Backend (Express)
    ↓
Middleware (auth, error handling)
    ↓
Routes (REST endpoints)
    ↓
Controllers (business logic)
    ↓
Models (Mongoose schemas)
    ↓
MongoDB (data storage)
```

---

## 📈 Performance Checklist

- [ ] API responses < 200ms
- [ ] Frontend loads < 3s
- [ ] Database queries indexed
- [ ] User isolation enforced
- [ ] Error messages logged
- [ ] No N+1 queries
- [ ] CORS configured
- [ ] HTTPS enabled (production)

---

## 🆘 Get Help

### Error: "Cannot find module 'express'"
```bash
cd backend
npm install
```

### Error: "MongoDB connection failed"
- Check MONGODB_URI in .env
- Verify internet connection
- Check MongoDB Atlas credentials

### Error: "JWT token invalid"
- Check token is included in Authorization header
- Verify JWT_SECRET is same in all places
- Check token hasn't expired

### Error: "Port 5000 already in use"
```bash
# Find process on port 5000
lsof -i :5000
# Kill process
kill -9 <PID>
```

---

## ✨ Pro Tips

1. **Use Thunder Client or Postman** for API testing
2. **Check browser Network tab** for API errors
3. **Use MongoDB Compass** to view data
4. **Enable debug logging** in controllers
5. **Test auth flow** first before other endpoints
6. **Use .env.local** for sensitive local config
7. **Restart servers** after .env changes
8. **Clear localStorage** to test login flow

---

## 📚 Resources

- Express.js Docs: https://expressjs.com/
- MongoDB Docs: https://docs.mongodb.com/
- React Docs: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/
- Mongoose: https://mongoosejs.com/

---

**Last Updated: July 5, 2026**
**Status: ✅ Production Ready**
