const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { User, Internship, Application, Review } = require('../models');
const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour
  checkperiod: 600 // Check for expired keys every 10 minutes
});

class RecommendationService {
  // Get recommended internships for a user
  static async getRecommendedInternships(userId, limit = 10) {
    try {
      const cacheKey = `recommendations:${userId}`;
      const cachedRecommendations = cache.get(cacheKey);

      if (cachedRecommendations) {
        return cachedRecommendations;
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user's skills and preferences
      const userSkills = user.skills || [];
      const userPreferences = user.preferences || {};

      // Get internships that match user's criteria
      const internships = await Internship.find({
        status: 'open',
        deadline: { $gt: new Date() },
        skills: { $in: userSkills }
      })
        .sort({ deadline: 1 })
        .limit(limit * 2); // Get more than needed for filtering

      // Score and rank internships
      const scoredInternships = internships.map(internship => {
        const score = this.calculateInternshipScore(internship, userSkills, userPreferences);
        return { ...internship.toObject(), score };
      });

      // Sort by score and take top recommendations
      const recommendations = scoredInternships
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache recommendations
      cache.set(cacheKey, recommendations);

      logger.info('Generated internship recommendations:', {
        userId,
        count: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Error getting recommended internships:', error);
      throw error;
    }
  }

  // Calculate internship score based on user preferences
  static calculateInternshipScore(internship, userSkills, userPreferences) {
    let score = 0;

    // Skill match score (0-40 points)
    const skillMatchCount = internship.skills.filter(skill => userSkills.includes(skill)).length;
    score += (skillMatchCount / internship.skills.length) * 40;

    // Location preference score (0-20 points)
    if (userPreferences.location && internship.location === userPreferences.location) {
      score += 20;
    }

    // Type preference score (0-20 points)
    if (userPreferences.type && internship.type === userPreferences.type) {
      score += 20;
    }

    // Duration preference score (0-10 points)
    if (userPreferences.duration && internship.duration <= userPreferences.duration) {
      score += 10;
    }

    // Stipend score (0-10 points)
    if (userPreferences.minStipend && internship.stipend >= userPreferences.minStipend) {
      score += 10;
    }

    return score;
  }

  // Get recommended candidates for an internship
  static async getRecommendedCandidates(internshipId, limit = 10) {
    try {
      const cacheKey = `candidates:${internshipId}`;
      const cachedCandidates = cache.get(cacheKey);

      if (cachedCandidates) {
        return cachedCandidates;
      }

      const internship = await Internship.findById(internshipId);
      if (!internship) {
        throw new AppError('Internship not found', 404);
      }

      // Get candidates with matching skills
      const candidates = await User.find({
        role: 'student',
        status: 'active',
        skills: { $in: internship.skills }
      })
        .limit(limit * 2);

      // Score and rank candidates
      const scoredCandidates = await Promise.all(
        candidates.map(async candidate => {
          const score = await this.calculateCandidateScore(candidate, internship);
          return { ...candidate.toObject(), score };
        })
      );

      // Sort by score and take top recommendations
      const recommendations = scoredCandidates
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache recommendations
      cache.set(cacheKey, recommendations);

      logger.info('Generated candidate recommendations:', {
        internshipId,
        count: recommendations.length
      });

      return recommendations;
    } catch (error) {
      logger.error('Error getting recommended candidates:', error);
      throw error;
    }
  }

  // Calculate candidate score based on internship requirements
  static async calculateCandidateScore(candidate, internship) {
    let score = 0;

    // Skill match score (0-40 points)
    const skillMatchCount = internship.skills.filter(skill => candidate.skills.includes(skill)).length;
    score += (skillMatchCount / internship.skills.length) * 40;

    // Experience score (0-20 points)
    if (candidate.experience) {
      score += Math.min(candidate.experience * 4, 20);
    }

    // Education score (0-20 points)
    if (candidate.education) {
      score += Math.min(candidate.education.length * 5, 20);
    }

    // Application history score (0-10 points)
    const successfulApplications = await Application.countDocuments({
      userId: candidate._id,
      status: 'accepted'
    });
    score += Math.min(successfulApplications * 2, 10);

    // Review score (0-10 points)
    const reviews = await Review.find({ userId: candidate._id });
    if (reviews.length > 0) {
      const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
      score += averageRating * 2;
    }

    return score;
  }

  // Clear recommendation cache
  static clearCache(userId = null, internshipId = null) {
    if (userId) {
      cache.del(`recommendations:${userId}`);
    }
    if (internshipId) {
      cache.del(`candidates:${internshipId}`);
    }
    if (!userId && !internshipId) {
      cache.flushAll();
    }
  }
}

module.exports = RecommendationService; 