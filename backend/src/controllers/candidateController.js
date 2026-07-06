import Candidate from '../models/Candidate.js';

export const listCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({
      userId: req.user._id
    }).sort({ createdAt: -1 });

    res.json({ candidates });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch candidates',
      error: error.message
    });
  }
};

export const getCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ candidate });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch candidate',
      error: error.message
    });
  }
};

export const createCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.create({
      id: Date.now() + Math.floor(Math.random() * 10000),
      ...req.body,
      userId: req.user._id,
      companyId: req.user._id
    });

    res.status(201).json({
      message: 'Candidate created successfully',
      candidate
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to create candidate',
      error: error.message
    });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate updated successfully', candidate });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to update candidate',
      error: error.message
    });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to delete candidate',
      error: error.message
    });
  }
};