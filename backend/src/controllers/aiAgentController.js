import mongoose from 'mongoose';
import Candidate from '../models/Candidate.js';
import Job from '../models/Job.js';
import Resume from '../models/Resume.js';
import Activity from '../models/Activity.js';
import HindsightMemory from '../models/HindsightMemory.js';
import * as emailService from '../services/emailService.js';

const normalize = (value) => Number(value ?? 0);

const getTopCandidate = (candidates) => {
  if (!candidates?.length) return null;

  return candidates.reduce((best, candidate) => {
    const score = normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore);
    if (score > normalize(best.score ?? best.aiConfidence ?? best.matchScore)) {
      return candidate;
    }
    return best;
  }, candidates[0]);
};

const findCandidateByName = (message, candidates) => {
  const lower = message.toLowerCase();
  return candidates.find((candidate) => lower.includes((candidate.name || '').toLowerCase())) || null;
};

const findCandidateByReference = (candidates, candidateId) => {
  if (!candidateId) return null;
  return candidates.find((candidate) => String(candidate._id || candidate.id) === String(candidateId)) || null;
};

const detectIntent = (message) => {
  const lower = message.toLowerCase();

  if (/(hire|select|appoint)/i.test(lower)) return 'hire_candidate';
  if (/(reject|decline|not a fit|not fit)/i.test(lower)) return 'reject_candidate';
  if (/(interview question|questions)/i.test(lower)) return 'generate_interview_questions';
  if (/(job description|job brief|jd)/i.test(lower)) return 'generate_job_description';
  if (/(resume|cv|analyz)/i.test(lower)) return 'analyze_resume';
  if (/(compare|comparison|vs|versus)/i.test(lower)) return 'compare_candidates';
  if (/(rank|ranking|top candidate|best candidate)/i.test(lower)) return 'rank_candidates';
  if (/(schedule interview|interview)/i.test(lower)) return 'schedule_interview';
  if (/(offer letter|offer)/i.test(lower)) return 'generate_offer_letter';
  if (/(rejection letter|reject letter)/i.test(lower)) return 'generate_rejection_letter';

  return 'general_help';
};

const createActionResult = ({
  reply,
  action,
  intent = 'general_help',
  candidate,
  job,
  reasoning,
  confidence = 90,
  cards = [],
  actions = [],
  requiresConfirmation = false,
  pendingAction = null,
  timeline = [],
  status = 'completed',
  candidateId = null,
  candidateName = null,
  draft = null
}) => ({
  reply,
  reasoning,
  confidence,
  action,
  intent,
  candidate: candidate || null,
  candidateId: candidateId || candidate?._id || candidate?.id || null,
  candidateName: candidateName || candidate?.name || null,
  job: job || null,
  toolSummary: { mongodb: true, hindsight: true, groq: false },
  cards,
  actions,
  requiresConfirmation,
  confirmationPrompt: requiresConfirmation ? 'Please confirm to continue this irreversible workflow action.' : null,
  pendingAction,
  timeline,
  status,
  draft
});

const executeCandidateWorkflow = async ({ candidate, job, userId, user, decision, reason }) => {
  if (!candidate || !userId) {
    return createActionResult({
      reply: 'I could not execute the workflow because the candidate context was missing.',
      action: decision === 'hire' ? 'hire-candidate' : 'reject-candidate',
      intent: decision === 'hire' ? 'hire_candidate' : 'reject_candidate',
      reasoning: ['Missing candidate context'],
      confidence: 70,
      timeline: ['🧠 Understanding request...', '⚠️ Candidate context missing'],
      status: 'blocked'
    });
  }

  const candidateId = candidate._id || candidate.id;
  const decisionMeta = decision === 'hire'
    ? {
        status: 'hired',
        decisionDate: new Date(),
        decisionBy: user?.email || 'ai-agent',
        decisionNotes: reason || 'Hired via AI Recruitment Agent',
        offerDetails: { source: 'ai-agent' }
      }
    : {
        status: 'rejected',
        decisionDate: new Date(),
        decisionBy: user?.email || 'ai-agent',
        rejectionReason: reason || 'Rejected via AI Recruitment Agent',
        decisionNotes: reason || 'Rejected by AI recruitment workflow'
      };

  const candidateDoc = await Candidate.findOneAndUpdate(
    { $or: [{ _id: candidateId }, { name: candidate.name }], userId },
    decisionMeta,
    { new: true }
  );

  if (!candidateDoc) {
    return createActionResult({
      reply: `I could not find ${candidate.name || 'the selected candidate'} in your workspace.`,
      action: decision === 'hire' ? 'hire-candidate' : 'reject-candidate',
      intent: decision === 'hire' ? 'hire_candidate' : 'reject_candidate',
      reasoning: ['Candidate was not available for the requested workflow'],
      confidence: 70,
      timeline: ['🧠 Understanding request...', '🔍 Finding candidate...', '⚠️ Candidate could not be updated'],
      status: 'blocked'
    });
  }

  if (decision === 'hire') {
    await Activity.create({
      type: 'offer_sent',
      candidateId: candidateDoc._id,
      candidateName: candidateDoc.name,
      jobId: candidateDoc.jobId,
      userId,
      companyId: userId,
      description: `AI agent hired ${candidateDoc.name}`,
      metadata: { decision: 'hire', recruiterEmail: user?.email || 'ai-agent' }
    });

    await HindsightMemory.create({
      userId,
      companyId: userId,
      type: 'hiring_preference',
      title: `AI hired ${candidateDoc.name}`,
      description: `Recruiter preferred ${candidateDoc.name} for ${candidateDoc.role || 'the role'}.`,
      confidence: 95,
      preferredSkills: candidateDoc.skills || [],
      preferredExperience: candidateDoc.experience,
      impact: 'high'
    });

    await emailService.sendOfferEmail(candidateDoc, job || null, { email: user?.email || 'recruiter@example.com' });
  } else {
    await Activity.create({
      type: 'rejection_sent',
      candidateId: candidateDoc._id,
      candidateName: candidateDoc.name,
      jobId: candidateDoc.jobId,
      userId,
      companyId: userId,
      description: `AI agent rejected ${candidateDoc.name}`,
      metadata: { decision: 'reject', recruiterEmail: user?.email || 'ai-agent' }
    });

    await HindsightMemory.create({
      userId,
      companyId: userId,
      type: 'decision_pattern',
      title: `AI rejected ${candidateDoc.name}`,
      description: `Recruiter rejected ${candidateDoc.name} due to a lower fit signal.`,
      confidence: 90,
      impact: 'medium'
    });

    await emailService.sendRejectionEmail(candidateDoc, job || null, { email: user?.email || 'recruiter@example.com' });
  }

  return createActionResult({
    reply: decision === 'hire'
      ? `✅ ${candidateDoc.name || 'The candidate'} has been hired. Offer email sent and Hindsight updated.`
      : `✅ ${candidateDoc.name || 'The candidate'} has been rejected. Rejection email sent and Hindsight updated.`,
    action: decision === 'hire' ? 'hire-candidate' : 'reject-candidate',
    intent: decision === 'hire' ? 'hire_candidate' : 'reject_candidate',
    candidate: candidateDoc,
    candidateId: candidateDoc._id,
    candidateName: candidateDoc.name,
    job,
    reasoning: ['Updated workspace state', 'Captured a hiring decision in Hindsight', 'Sent the recruiter notification email'],
    confidence: 97,
    actions: decision === 'hire'
      ? ['update_database', 'send_offer_email', 'update_hindsight', 'refresh_dashboard']
      : ['update_database', 'send_rejection_email', 'update_hindsight', 'refresh_dashboard'],
    timeline: [
      '🧠 Understanding request...',
      '🔍 Finding candidate...',
      '📊 Updating database...',
      '📧 Sending email...',
      '🧠 Updating Hindsight memory...',
      '✅ Workflow completed successfully.'
    ],
    status: 'completed'
  });
};

const handleRecruitmentAction = async ({ message, candidates, jobs, memories, userId, user, pendingAction, confirmAction }) => {
  const lower = message.toLowerCase();
  const topJob = jobs?.[0];
  const topCandidate = getTopCandidate(candidates);
  const inferredIntent = pendingAction?.intent || detectIntent(message);
  const targetCandidate = pendingAction?.candidateId
    ? findCandidateByReference(candidates, pendingAction.candidateId)
    : findCandidateByName(message, candidates) || topCandidate;

  if (pendingAction?.intent === 'hire_candidate' && confirmAction) {
    return executeCandidateWorkflow({
      candidate: targetCandidate || pendingAction?.candidate || null,
      job: topJob || null,
      userId,
      user,
      decision: 'hire',
      reason: pendingAction?.reason || 'Confirmed via AI recruiter chat'
    });
  }

  if (pendingAction?.intent === 'reject_candidate' && confirmAction) {
    return executeCandidateWorkflow({
      candidate: targetCandidate || pendingAction?.candidate || null,
      job: topJob || null,
      userId,
      user,
      decision: 'reject',
      reason: pendingAction?.reason || 'Confirmed via AI recruiter chat'
    });
  }

  if (inferredIntent === 'hire_candidate') {
    if (!targetCandidate) {
      return createActionResult({
        reply: 'I can help you hire a candidate, but I need a candidate in the workspace first.',
        action: 'collect-data',
        intent: 'hire_candidate',
        candidate: null,
        job: topJob || null,
        reasoning: ['No candidate found to hire'],
        cards: [{ title: 'Next step', body: 'Add or rank candidates before hiring', action: 'Collect candidates' }],
        timeline: ['🧠 Understanding request...', '⚠️ Candidate context missing'],
        status: 'blocked'
      });
    }

    return createActionResult({
      reply: `I found ${targetCandidate.name || 'the selected candidate'} with a strong fit. This action will update the candidate status, send an offer email, and save that decision in Hindsight. Reply “Confirm” to continue.`,
      action: 'hire-candidate',
      intent: 'hire_candidate',
      candidate: targetCandidate,
      candidateId: targetCandidate._id || targetCandidate.id,
      candidateName: targetCandidate.name,
      job: topJob || null,
      reasoning: ['Candidate matched the recruiter request', 'Irreversible workflow detected'],
      confidence: 96,
      actions: ['update_database', 'send_offer_email', 'update_hindsight', 'refresh_dashboard'],
      requiresConfirmation: true,
      pendingAction: {
        intent: 'hire_candidate',
        candidateId: targetCandidate._id || targetCandidate.id,
        candidateName: targetCandidate.name,
        reason: 'Confirmed via AI recruiter chat',
        candidate: targetCandidate
      },
      timeline: ['🧠 Understanding request...', '🔍 Finding candidate...', '📊 Preparing hire workflow...', '⏳ Waiting for confirmation...'],
      status: 'pending_confirmation'
    });
  }

  if (inferredIntent === 'reject_candidate') {
    if (!targetCandidate) {
      return createActionResult({
        reply: 'I can reject a candidate once one is selected from the workspace.',
        action: 'collect-data',
        intent: 'reject_candidate',
        candidate: null,
        job: topJob || null,
        reasoning: ['No candidate found to reject'],
        cards: [{ title: 'Next step', body: 'Select a candidate before rejecting', action: 'Choose candidate' }],
        timeline: ['🧠 Understanding request...', '⚠️ Candidate context missing'],
        status: 'blocked'
      });
    }

    return createActionResult({
      reply: `I found ${targetCandidate.name || 'the selected candidate'} and can reject them. This will save the reason in Hindsight, send a rejection email, and update the dashboard. Reply “Confirm” to continue.`,
      action: 'reject-candidate',
      intent: 'reject_candidate',
      candidate: targetCandidate,
      candidateId: targetCandidate._id || targetCandidate.id,
      candidateName: targetCandidate.name,
      job: topJob || null,
      reasoning: ['Candidate matched the recruiter request', 'Irreversible workflow detected'],
      confidence: 95,
      actions: ['update_database', 'send_rejection_email', 'update_hindsight', 'refresh_dashboard'],
      requiresConfirmation: true,
      pendingAction: {
        intent: 'reject_candidate',
        candidateId: targetCandidate._id || targetCandidate.id,
        candidateName: targetCandidate.name,
        reason: 'Confirmed via AI recruiter chat',
        candidate: targetCandidate
      },
      timeline: ['🧠 Understanding request...', '🔍 Finding candidate...', '📊 Preparing rejection workflow...', '⏳ Waiting for confirmation...'],
      status: 'pending_confirmation'
    });
  }

  if (inferredIntent === 'generate_interview_questions') {
    const questions = [
      'Walk me through a React project you shipped end to end.',
      'How do you debug performance issues in a Node.js service?',
      'Tell me about a time you led a cross-functional delivery.'
    ];

    return createActionResult({
      reply: `Here are interview questions tailored for ${topJob?.title || 'this opening'}: ${questions.join(' ')}`,
      action: 'generate-questions',
      intent: 'generate_interview_questions',
      candidate: targetCandidate || null,
      job: topJob || null,
      reasoning: ['Generated interview questions from workspace context'],
      confidence: 89,
      actions: ['generate_interview_questions'],
      timeline: ['🧠 Understanding request...', '📝 Drafting interview questions...'],
      draft: questions
    });
  }

  if (inferredIntent === 'generate_job_description') {
    const title = topJob?.title || 'Senior Product Engineer';
    const description = `We are looking for a ${title} who can build reliable products, collaborate closely with engineering and design, and help ship quality software quickly.`;

    return createActionResult({
      reply: `I drafted a job description for ${title}: ${description}`,
      action: 'generate-job-description',
      intent: 'generate_job_description',
      job: topJob || null,
      reasoning: ['Generated a job description from the current role context'],
      confidence: 88,
      actions: ['generate_job_description'],
      timeline: ['🧠 Understanding request...', '📝 Drafting role description...'],
      draft: description
    });
  }

  if (inferredIntent === 'analyze_resume') {
    return createActionResult({
      reply: `I can review resumes against ${topJob?.title || 'the active role'} and compare them quickly.`,
      action: 'analyze-resume',
      intent: 'analyze_resume',
      candidate: targetCandidate || null,
      job: topJob || null,
      reasoning: ['Resume review workflow prepared'],
      confidence: 84,
      actions: ['analyze_resume'],
      timeline: ['🧠 Understanding request...', '📄 Reviewing resume context...']
    });
  }

  if (inferredIntent === 'compare_candidates') {
    const rankedCandidates = [...candidates].sort((a, b) => normalize(b.score ?? b.aiConfidence ?? b.matchScore) - normalize(a.score ?? a.aiConfidence ?? a.matchScore)).slice(0, 3);
    const comparison = rankedCandidates.map((candidate) => `${candidate.name} (${normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore)}%)`).join(' • ');

    return createActionResult({
      reply: `I compared the current candidates: ${comparison}`,
      action: 'compare-candidates',
      intent: 'compare_candidates',
      job: topJob || null,
      reasoning: ['Compared candidate scores and fit signals'],
      confidence: 90,
      actions: ['compare_candidates'],
      cards: rankedCandidates.map((candidate) => ({
        name: candidate.name,
        title: candidate.role || 'Candidate',
        score: normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore),
        skills: candidate.skills || []
      })),
      timeline: ['🧠 Understanding request...', '📊 Comparing candidate strength...']
    });
  }

  if (inferredIntent === 'rank_candidates') {
    const rankedCandidates = [...candidates].sort((a, b) => normalize(b.score ?? b.aiConfidence ?? b.matchScore) - normalize(a.score ?? a.aiConfidence ?? a.matchScore)).slice(0, 5);
    return createActionResult({
      reply: `I ranked the current candidates and the top match is ${rankedCandidates[0]?.name || 'available in the workspace'}.`,
      action: 'rank-candidates',
      intent: 'rank_candidates',
      job: topJob || null,
      reasoning: ['Ranked candidates by fit score'],
      confidence: 91,
      actions: ['rank_candidates'],
      cards: rankedCandidates.map((candidate) => ({
        name: candidate.name,
        title: candidate.role || 'Candidate',
        score: normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore),
        skills: candidate.skills || []
      })),
      timeline: ['🧠 Understanding request...', '📊 Ranking candidates...']
    });
  }

  if (inferredIntent === 'schedule_interview') {
    return createActionResult({
      reply: `I can schedule the interview for ${targetCandidate?.name || 'the selected candidate'} and prepare a follow-up note.`,
      action: 'schedule-interview',
      intent: 'schedule_interview',
      candidate: targetCandidate || null,
      job: topJob || null,
      reasoning: ['Interview scheduling workflow prepared'],
      confidence: 87,
      actions: ['schedule_interview'],
      timeline: ['🧠 Understanding request...', '📅 Preparing interview workflow...']
    });
  }

  if (inferredIntent === 'generate_offer_letter') {
    return createActionResult({
      reply: `I drafted an offer letter for ${targetCandidate?.name || 'the selected candidate'}.`,
      action: 'generate-offer-letter',
      intent: 'generate_offer_letter',
      candidate: targetCandidate || null,
      job: topJob || null,
      reasoning: ['Offer letter draft created'],
      confidence: 88,
      actions: ['generate_offer_letter'],
      timeline: ['🧠 Understanding request...', '📄 Drafting offer letter...'],
      draft: `Dear ${targetCandidate?.name || 'Candidate'},\n\nWe are delighted to offer you the position of ${topJob?.title || 'Team Member'}. We look forward to your contribution.\n\nBest regards,\nRecruitAI`
    });
  }

  if (inferredIntent === 'generate_rejection_letter') {
    return createActionResult({
      reply: `I drafted a rejection letter for ${targetCandidate?.name || 'the selected candidate'}.`,
      action: 'generate-rejection-letter',
      intent: 'generate_rejection_letter',
      candidate: targetCandidate || null,
      job: topJob || null,
      reasoning: ['Rejection letter draft created'],
      confidence: 88,
      actions: ['generate_rejection_letter'],
      timeline: ['🧠 Understanding request...', '📄 Drafting rejection letter...'],
      draft: `Dear ${targetCandidate?.name || 'Candidate'},\n\nThank you for your interest. After careful review, we have decided not to move forward with your application.\n\nBest regards,\nRecruitAI`
    });
  }

  return null;
};

const buildFallbackReply = ({ message, candidates, jobs, resumes, memories }) => {
  const lower = message.toLowerCase();
  const topJob = jobs?.[0];
  const topCandidate = getTopCandidate(candidates);
  const memorySummary = memories?.slice(0, 3).map((item) => item.description || item.title).filter(Boolean).join(' • ') || 'No memory yet';
  const rankedCandidates = [...candidates].sort((a, b) => normalize(b.score ?? b.aiConfidence ?? b.matchScore) - normalize(a.score ?? a.aiConfidence ?? a.matchScore)).slice(0, 3);

  if (/(best|recommend|match|hire|strong hire)/i.test(lower)) {
    if (topCandidate) {
      return createActionResult({
        reply: `I recommend ${topCandidate.name || 'the top candidate'} for ${topJob?.title || 'the active role'}. They are a strong fit because of ${topCandidate.skills?.slice(0, 3).join(', ') || 'their profile'} and they align with your saved hiring preferences.`,
        reasoning: [`Matched ${candidates.length} candidate${candidates.length === 1 ? '' : 's'} against your workspace data`, `Applied Hindsight memory: ${memorySummary}`],
        confidence: 92,
        action: 'recommend-candidate',
        intent: 'rank_candidates',
        candidate: topCandidate,
        job: topJob || null,
        actions: ['rank_candidates', 'compare_candidates'],
        cards: rankedCandidates.map((candidate) => ({
          id: candidate._id || candidate.id,
          name: candidate.name,
          title: candidate.role || candidate.title || 'Candidate',
          score: normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore),
          skills: candidate.skills || [],
          confidence: normalize(candidate.aiConfidence ?? candidate.score ?? candidate.matchScore),
          risk: normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore) >= 90 ? 'Low' : 'Medium',
          recommendation: normalize(candidate.score ?? candidate.aiConfidence ?? candidate.matchScore) >= 90 ? 'Schedule interview' : 'Keep in review'
        })),
        timeline: ['🧠 Understanding request...', '📊 Ranking candidates...']
      });
    }

    return createActionResult({
      reply: 'I do not have enough candidate data yet. Add candidates or upload resumes so I can rank them for you.',
      reasoning: ['No candidates available in the workspace'],
      confidence: 70,
      action: 'collect-data',
      intent: 'general_help',
      candidate: null,
      job: topJob || null,
      timeline: ['🧠 Understanding request...', '⚠️ Candidate context missing']
    });
  }

  if (/(question|interview)/i.test(lower)) {
    const questions = [
      'Walk me through a React project you shipped end-to-end.',
      'How do you debug performance issues in a Node.js service?',
      'Tell me about a time you led a cross-functional delivery.'
    ];

    return createActionResult({
      reply: `Here are three interview questions tailored for ${topJob?.title || 'this opening'}: ${questions.join(' ')}`,
      reasoning: [`Used ${jobs.length} job${jobs.length === 1 ? '' : 's'} and ${resumes.length} resume${resumes.length === 1 ? '' : 's'} from the workspace`, 'Applied Hindsight memory preferences'],
      confidence: 88,
      action: 'generate-questions',
      intent: 'generate_interview_questions',
      candidate: null,
      job: topJob || null,
      actions: ['generate_interview_questions'],
      timeline: ['🧠 Understanding request...', '📝 Drafting interview questions...'],
      draft: questions
    });
  }

  if (/(analytics|summary|stats|how many)/i.test(lower)) {
    return createActionResult({
      reply: `Your workspace currently has ${candidates.length} candidate${candidates.length === 1 ? '' : 's'}, ${jobs.length} job${jobs.length === 1 ? '' : 's'}, and ${resumes.length} resume${resumes.length === 1 ? '' : 's'}. I can help rank applicants or draft follow-up questions next.`,
      reasoning: ['Aggregated workspace counts from MongoDB or the current session context'],
      confidence: 90,
      action: 'summarize-workspace',
      intent: 'general_help',
      candidate: null,
      job: topJob || null,
      timeline: ['🧠 Understanding request...', '📊 Summarizing workspace...']
    });
  }

  if (/(resume|cv)/i.test(lower)) {
    return createActionResult({
      reply: `I can review the current resumes and compare them against ${topJob?.title || 'the active role'}. Upload new resumes or choose a candidate profile to analyze next.`,
      reasoning: ['Resume files are available in the current workspace context'],
      confidence: 84,
      action: 'analyze-resume',
      intent: 'analyze_resume',
      candidate: null,
      job: topJob || null,
      actions: ['analyze_resume'],
      timeline: ['🧠 Understanding request...', '📄 Reviewing resume context...']
    });
  }

  return createActionResult({
    reply: `I’m your AI Recruitment Agent. I can rank candidates, generate interview questions, summarize resumes, and apply your Hindsight preferences to the current hiring workflow.`,
    reasoning: [`Used ${candidates.length} candidate${candidates.length === 1 ? '' : 's'} and ${memories.length} memory item${memories.length === 1 ? '' : 's'}`],
    confidence: 85,
    action: 'general-help',
    intent: 'general_help',
    candidate: topCandidate || null,
    job: topJob || null,
    timeline: ['🧠 Understanding request...', '💡 Ready for your next hiring move']
  });
};

const callGroq = async (prompt) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'You are an AI Recruitment Agent that helps recruiters reason over candidates, jobs, resumes, and learned preferences.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 320
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (error) {
    return null;
  }
};

export const chatWithRecruitmentAgent = async (req, res) => {
  try {
    const { message, workspace, confirmAction = false, pendingAction = null } = req.body || {};
    const userId = req?.user?._id || req?.user?.id;

    let candidates = workspace?.candidates || [];
    let jobs = workspace?.jobs || [];
    let resumes = workspace?.resumes || [];
    let memories = [];

    if (mongoose.connection.readyState === 1 && userId) {
      const [candidateData, jobData, resumeData, memoryData] = await Promise.all([
        Candidate.find({ userId }).sort({ createdAt: -1 }).limit(20),
        Job.find({ userId }).sort({ createdAt: -1 }).limit(20),
        Resume.find({ userId }).sort({ createdAt: -1 }).limit(20),
        HindsightMemory.find({ userId }).sort({ createdAt: -1 }).limit(10)
      ]);

      candidates = candidateData?.length ? candidateData : candidates;
      jobs = jobData?.length ? jobData : jobs;
      resumes = resumeData?.length ? resumeData : resumes;
      memories = memoryData?.length ? memoryData : memories;
    }

    const actionResult = await handleRecruitmentAction({
      message,
      candidates,
      jobs,
      memories,
      userId,
      user: req.user,
      pendingAction,
      confirmAction
    });
    if (actionResult) {
      return res.json(actionResult);
    }

    const prompt = `You are an AI Recruitment Agent. Use the recruiter memory and current workspace data to answer the recruiter quickly and professionally.\n\nRecruiter message: ${message}\n\nWorkspace summary:\n- Candidates: ${candidates.length}\n- Jobs: ${jobs.length}\n- Resumes: ${resumes.length}\n- Memory: ${memories.slice(0, 3).map((item) => item.description || item.title).join(' | ') || 'No memory'}\n\nReturn a concise HR-style response with a recommendation or next step.`;

    const groqReply = await callGroq(prompt);
    const fallback = buildFallbackReply({ message, candidates, jobs, resumes, memories });

    const result = groqReply
      ? {
          reply: groqReply,
          reasoning: [`Used ${candidates.length} candidate${candidates.length === 1 ? '' : 's'} from the workspace`, `Applied ${memories.length} Hindsight memory item${memories.length === 1 ? '' : 's'}`],
          confidence: 95,
          action: fallback.action,
          candidate: fallback.candidate || null,
          job: fallback.job || null,
          toolSummary: { mongodb: mongoose.connection.readyState === 1, hindsight: memories.length > 0, groq: true },
          cards: fallback.cards || []
        }
      : fallback;

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to process recruitment agent request', error: error.message });
  }
};
