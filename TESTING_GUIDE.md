# 🧪 Testing Guide - Hiring Workflow

## 🚀 Quick Start (5 minutes)

### 1. Start Backend
```bash
cd backend
npm install  # if needed
npm run dev
# Expected: "Server running on port 5000", "MongoDB connected"
```

### 2. Start Frontend
```bash
cd frontend
npm install  # if needed
npm run dev
# Expected: "VITE v6.3.5 ready in XXX ms"
# Open: http://localhost:5173
```

### 3. Login
- **Email**: `test@company.com`
- **Password**: `password123`

---

## ✅ Test Case 1: Happy Path Hire

### Scenario: Upload Resume → Review → Hire

```
Step 1: Upload Resume
├─ Go to "Resume Upload" page
├─ Click "Choose File" (or drop file)
├─ Select resume.pdf (any PDF)
├─ Wait for "Resume processed successfully"
└─ Should appear in Candidates list

Step 2: Navigate to Candidates
├─ Click "Candidates" in sidebar
├─ View list with scores
└─ Click candidate with score 75-95

Step 3: Review Candidate
├─ See competency radar chart
├─ See skills assessment
├─ Read AI recommendation summary
└─ Note the score (e.g., 85%)

Step 4: Send Hire Offer
├─ Click emerald "Hire" button (bottom-right)
├─ Wait for "✅ Offer sent!" message
├─ Button should become disabled
├─ Status badge should change to "Offer Sent"
└─ Redirects to candidates list after 2 seconds

Step 5: Verify Backend Activity
├─ Check backend console for email simulation:
│  └─ "📧 SIMULATED EMAIL SENT:"
│     "To: candidate@email.com"
│     "Subject: Offer: [Position Name]"
├─ Or check MongoDB for:
│  - Candidate status = 'offer_sent'
│  - Activity type = 'offer_sent'
│  - HindsightMemory created
└─ Result: ✅ PASS
```

---

## ✅ Test Case 2: Rejection Workflow

### Scenario: Review → Reject → Log Activity

```
Step 1: Navigate to Candidate
├─ Go to Candidates page
├─ Click on candidate with score 45-65 (marginal fit)
└─ Review profile

Step 2: Send Rejection
├─ Click red "Reject" button (bottom-right)
├─ Wait for "✅ Rejection sent" message
├─ Button should become disabled
├─ Status badge changes to "Rejected"
└─ Redirects to candidates list

Step 3: Verify Activity Logged
├─ Check backend console for:
│  └─ "📧 SIMULATED EMAIL SENT:"
│     "To: candidate@email.com"
│     "Subject: Application Status: Better fit found"
├─ Or query MongoDB:
│  ```
│  db.activities.find({ type: 'rejection_sent' })
│  ```
└─ Result: ✅ PASS
```

---

## ✅ Test Case 3: State Management

### Scenario: Verify Button States Persist

```
Step 1: Hire a Candidate
├─ Click "Hire" button
└─ Status becomes 'offer_sent'

Step 2: Navigate Away & Return
├─ Go to Dashboard
├─ Go back to Candidates
├─ Click same candidate
└─ "Hire" button should still be disabled

Step 3: Verify Status
├─ Status badge still shows "Offer Sent"
├─ Buttons remain disabled
└─ Result: ✅ PASS (state persisted in MongoDB)
```

---

## ✅ Test Case 4: Multiple Candidates

### Scenario: Hire/Reject Different Candidates

```
Step 1: Hire Candidate A
├─ Find candidate with 85% score
├─ Click Hire
└─ Wait for success message

Step 2: Reject Candidate B
├─ Find different candidate with 55% score
├─ Click Reject
└─ Wait for success message

Step 3: View Third Candidate
├─ Find third candidate (50-75% score)
├─ Both Hire & Reject buttons should be enabled
├─ Can still perform action on this one
└─ Result: ✅ PASS

Step 4: Verify Activity Count
├─ Check MongoDB Activity collection
├─ Should have at least 2 entries (1 hire, 1 rejection)
├─ Each with correct type and metadata
└─ Result: ✅ PASS
```

---

## ✅ Test Case 5: Hindsight Memory

### Scenario: Verify AI Learns from Hires

```
Step 1: Hire Multiple Candidates
├─ Hire 2-3 candidates with high scores
├─ Note their skills (React, TypeScript, Node.js)
└─ Each hire creates Hindsight memory

Step 2: Query Memory
├─ In backend, run:
│  ```
│  GET http://localhost:5000/api/hiring/memory/all
│  Headers: Authorization: Bearer [TOKEN]
│  ```
├─ Should return array of memory entries
└─ Each entry shows:
   - Type: 'hiring_preference'
   - Skills: ['React', 'TypeScript', 'Node.js', ...]
   - Confidence: ~89%
   - Success: 100%

Step 3: Verify MongoDB
├─ Check HindsightMemory collection:
│  ```
│  db.hindsightmemories.find().pretty()
│  ```
├─ Should have entries for each hire
└─ Result: ✅ PASS
```

---

## 🐛 Debugging Tips

### Issue: "Hire" button not working / showing error

**Check:**
1. Are you logged in? (token in localStorage)
2. Is backend running? (check `http://localhost:5000/api/health`)
3. Is MongoDB connected? (check backend console)
4. Is candidate ID valid? (console.log shows c._id)

**Solution:**
```bash
# Backend console
tail -50 backend-output.log | grep -i error

# Check token
localStorage.getItem('token')

# Check API response
curl -H "Authorization: Bearer TOKEN" http://localhost:5000/api/workspace
```

---

### Issue: Buttons disabled for all candidates

**Cause:** All candidates have status 'hired' or 'offer_sent'

**Solution:**
```bash
# Reset in MongoDB
db.candidates.updateMany(
  { userId: YOUR_ID },
  { $set: { status: 'new' } }
)
```

---

### Issue: Email not appearing in backend console

**Check:**
1. Is backend logging enabled? (check `console.log` in hiringController.js)
2. Backend console output:
```bash
tail -f backend-console.log | grep "SIMULATED EMAIL"
```

**Solution:** Make sure console.log is NOT commented out in sendEmail() function

---

### Issue: Frontend keeps showing "Loading workspace..."

**Cause:** useEffect dependency issue or API timeout

**Solution:**
```bash
# Check network tab
- Should see 1-2 requests to /api/workspace
- Not 2080+ requests

# If stuck
- Clear localStorage: localStorage.clear()
- Refresh page
- Clear browser cache
```

---

## 📋 Verification Checklist

After completing all tests, verify:

### Frontend
- [ ] Login works (token stored)
- [ ] Resume upload works (candidates appear)
- [ ] Candidate list loads (no infinite loading)
- [ ] Candidate detail shows all info
- [ ] Hire button works (status changes)
- [ ] Reject button works (status changes)
- [ ] Buttons stay disabled after action
- [ ] Success messages appear
- [ ] Page redirects after action

### Backend
- [ ] Server starts on port 5000
- [ ] MongoDB connects
- [ ] No 404 errors on API calls
- [ ] Activity logs created for each hire/reject
- [ ] Hindsight memory created for hires
- [ ] Emails simulated in console
- [ ] Token validation works
- [ ] User isolation working (can't see other users' candidates)

### Database
- [ ] Candidates table updated with correct status
- [ ] Activity table has 4+ entries
- [ ] HindsightMemory table has 2+ entries
- [ ] All timestamps are correct (created_at)

### API Endpoints
- [ ] ✅ POST /api/hiring/:id/hire
- [ ] ✅ POST /api/hiring/:id/reject
- [ ] ✅ GET /api/hiring/:id/activity
- [ ] ✅ GET /api/hiring/memory/all
- [ ] ✅ GET /api/workspace (no infinite loop)
- [ ] ✅ GET /api/health returns status

---

## 🎯 Performance Checks

### Workflow Speed
- [ ] Hire button response: < 2 seconds
- [ ] Frontend redirect: < 1 second
- [ ] Candidate list reload: < 500ms
- [ ] Activity log retrieval: < 1 second

### Memory Usage
- [ ] Backend process: < 200MB RAM
- [ ] Frontend bundle: < 1MB JS
- [ ] No memory leaks after 10 cycles

---

## 📊 Success Metrics

When all tests pass, you have successfully implemented:

✅ **Hiring Workflow**
- Upload → Score → Review → Decide → Email → Log → Remember

✅ **Activity Tracking**
- Complete audit trail of all decisions
- Timestamps, recruiter info, reasons logged

✅ **AI Learning System**
- Hindsight memory captures preferences
- Can improve future hiring recommendations

✅ **Email Notifications**
- Simulated email sending (ready for real provider)
- Includes offer/rejection details

✅ **State Management**
- Candidate status updates persist
- Buttons disable appropriately
- Frontend stays in sync with backend

✅ **Security**
- JWT token validation
- User isolation (multi-tenant)
- No data leakage in errors

---

## 📝 Notes

- All timestamps use UTC
- Emails are console.log only (no real sending)
- Activity queries return array of events
- Hindsight memory confidence scores calibrated (0-100)
- To integrate real email: Replace sendEmail() function with actual provider

---

**Last Updated**: 2026-01-14  
**Status**: Ready for Testing  
**Estimated Test Time**: 15-20 minutes
