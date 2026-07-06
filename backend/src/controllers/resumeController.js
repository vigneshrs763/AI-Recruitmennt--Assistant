import Resume from '../models/Resume.js';
import Candidate from '../models/Candidate.js';

// ─── Email helpers ────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

/**
 * Attempt to extract an email address from free-form resume text.
 * Returns the first match found, or null.
 */
const extractEmailFromText = (text = '') => {
  const match = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : null;
};

const RESUME_KEYWORDS = {
  react: { weight: 18, skill: 'React' },
  typescript: { weight: 16, skill: 'TypeScript' },
  javascript: { weight: 12, skill: 'JavaScript' },
  node: { weight: 14, skill: 'Node.js' },
  express: { weight: 10, skill: 'Express' },
  mongodb: { weight: 10, skill: 'MongoDB' },
  docker: { weight: 10, skill: 'Docker' },
  aws: { weight: 9, skill: 'AWS' },
  graphql: { weight: 9, skill: 'GraphQL' },
  leadership: { weight: 8, skill: 'Leadership' },
  testing: { weight: 8, skill: 'Testing' },
  python: { weight: 8, skill: 'Python' }
};

const inferResumeScore = (sourceText = '') => {
  const normalizedText = sourceText.toLowerCase();
  let score = 52;

  Object.entries(RESUME_KEYWORDS).forEach(([keyword, info]) => {
    if (normalizedText.includes(keyword)) {
      score += info.weight;
    }
  });

  if (normalizedText.length > 120) {
    score += 6;
  }

  if (score >= 85) {
    return 95;
  }

  return Math.min(94, Math.max(60, score));
};

const buildCandidateProfile = ({ candidateName, originalName, resumeText, score }) => {
  const sourceText = `${candidateName} ${originalName} ${resumeText}`.toLowerCase();
  const skills = Object.entries(RESUME_KEYWORDS)
    .filter(([keyword]) => sourceText.includes(keyword))
    .map(([, info]) => info.skill)
    .slice(0, 6);

  const role = skills.includes('React') || skills.includes('TypeScript')
    ? 'Frontend Engineer'
    : skills.includes('Node.js')
      ? 'Full Stack Engineer'
      : 'Software Engineer';

  const experience = score >= 90 ? '5+ years' : score >= 80 ? '3+ years' : '1-2 years';
  const status = score >= 90 ? 'strong_hire' : score >= 80 ? 'hire' : 'consider';
  const aiConfidence = Math.min(99, Math.max(70, score + 4));
  const summary = `AI reviewed ${candidateName} and found strong evidence for ${skills.slice(0, 3).join(', ') || 'core engineering fundamentals'}.`;
  const missing = ['System Design', 'Leadership'].filter((skill) => !skills.includes(skill));

  return {
    role,
    experience,
    location: 'Remote / US',
    skills: skills.length ? skills : ['Problem Solving', 'Communication'],
    missing,
    education: 'Relevant technical education',
    summary,
    aiConfidence,
    status
  };
};

export const listResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json({ resumes });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Failed to fetch resumes',
      error: error.message
    });
  }
};

export const createResume = async (req, res) => {
  try {
    const filename = req.body?.filename || `resume-${Date.now()}.pdf`;
    const originalName = req.body?.originalName || filename;
    const size = req.body?.size || 'Unknown';
    const status = req.body?.status || 'uploaded';
    const resumeText = req.body?.text || req.body?.content || req.body?.resumeText || '';
    const requestedScore = typeof req.body?.score === 'number' ? req.body.score : null;
    const computedScore = requestedScore ?? inferResumeScore(`${filename} ${originalName} ${resumeText}`);

    const resume = await Resume.create({
      ...req.body,
      filename,
      originalName,
      size,
      status,
      score: computedScore,
      userId: req.user._id,
      companyId: req.user._id
    });

    const candidateName = req.body?.name || originalName.replace(/\.(pdf|docx?|txt)$/i, '');

    // Prefer explicitly provided email; fall back to auto-extraction from resume text.
    const candidateEmail = (req.body?.email?.trim()) ||
      extractEmailFromText(`${resumeText} ${originalName}`);

    // Validate — reject the request if no real email is available.
    if (!candidateEmail || !EMAIL_REGEX.test(candidateEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid candidate email address. You can enter it manually or make sure the resume contains one.'
      });
    }
    const candidateProfile = buildCandidateProfile({
      candidateName,
      originalName,
      resumeText,
      score: computedScore
    });

    let candidate = await Candidate.findOne({
      email: candidateEmail,
      userId: req.user._id
    });

    if (!candidate) {
      candidate = await Candidate.create({
        id: Date.now() + Math.floor(Math.random() * 10000),
        name: candidateName,
        email: candidateEmail,
        resumeUrl: filename,
        score: computedScore,
        userId: req.user._id,
        companyId: req.user._id,
        ...candidateProfile
      });
    } else {
      candidate.score = computedScore;
      candidate.status = candidateProfile.status;
      candidate.role = candidateProfile.role;
      candidate.experience = candidateProfile.experience;
      candidate.location = candidateProfile.location;
      candidate.skills = candidateProfile.skills;
      candidate.missing = candidateProfile.missing;
      candidate.education = candidateProfile.education;
      candidate.summary = candidateProfile.summary;
      candidate.aiConfidence = candidateProfile.aiConfidence;
      await candidate.save();
    }

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume,
      candidate
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Resume upload failed',
      error: error.message
    });
  }
};

export const uploadResume = async (req, res) => {
  return createResume(req, res);
};

export const getResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json({ resume });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch resume',
      error: error.message
    });
  }
};

export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete resume',
      error: error.message
    });
  }
};

export const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, score } = req.body;

    const candidate = await Candidate.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      {
        ...(status ? { status } : {}),
        ...(typeof score === 'number' ? { score } : {})
      },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate updated successfully', candidate });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update candidate', error: error.message });
  }
};