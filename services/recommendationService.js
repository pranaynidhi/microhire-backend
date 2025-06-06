const Internship = require('../models/Internship');
const User = require('../models/User');
const Application = require('../models/Application');
const SearchHistory = require('../models/SearchHistory');
const { Op } = require('sequelize');
const natural = require('natural');
const tfidf = new natural.TfIdf();

class RecommendationService {
  static async generateRecommendations(userId) {
    try {
      // Get user profile and preferences
      const user = await User.findByPk(userId);
      const userSkills = user.skills ? user.skills.toLowerCase().split(',').map(s => s.trim()) : [];
      
      // Get user's search history
      const searchHistory = await SearchHistory.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 10
      });

      // Get user's application history
      const applications = await Application.findAll({
        where: { userId },
        include: [{
          model: Internship,
          attributes: ['id', 'title', 'description', 'requirements', 'category', 'type', 'location']
        }],
        limit: 10
      });

      // Build user profile vector
      const userProfile = this.buildUserProfile(user, userSkills, searchHistory, applications);

      // Get active internships
      const internships = await Internship.findAll({
        where: {
          status: 'active',
          deadline: { [Op.gte]: new Date() }
        },
        include: [{
          model: User,
          as: 'company',
          attributes: ['id', 'companyName', 'email', 'logoUrl']
        }]
      });

      // Calculate similarity scores
      const scoredInternships = internships.map(internship => ({
        internship,
        score: this.calculateSimilarityScore(internship, userProfile)
      }));

      // Sort by score and return top recommendations
      return scoredInternships
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => item.internship);
    } catch (error) {
      console.error('Generate recommendations error:', error);
      throw error;
    }
  }

  static buildUserProfile(user, skills, searchHistory, applications) {
    const profile = {
      skills: new Set(skills),
      categories: new Set(),
      types: new Set(),
      locations: new Set(),
      keywords: new Set()
    };

    // Add keywords from search history
    searchHistory.forEach(search => {
      if (search.query) {
        const words = search.query.toLowerCase().split(/\s+/);
        words.forEach(word => profile.keywords.add(word));
      }
      if (search.filters) {
        if (search.filters.category) profile.categories.add(search.filters.category);
        if (search.filters.type) profile.types.add(search.filters.type);
        if (search.filters.location) profile.locations.add(search.filters.location);
      }
    });

    // Add preferences from applications
    applications.forEach(app => {
      if (app.Internship) {
        profile.categories.add(app.Internship.category);
        profile.types.add(app.Internship.type);
        profile.locations.add(app.Internship.location);
        
        // Extract keywords from internship details
        const text = `${app.Internship.title} ${app.Internship.description} ${app.Internship.requirements}`;
        const words = text.toLowerCase().split(/\s+/);
        words.forEach(word => profile.keywords.add(word));
      }
    });

    return profile;
  }

  static calculateSimilarityScore(internship, userProfile) {
    let score = 0;

    // Category match
    if (userProfile.categories.has(internship.category)) {
      score += 3;
    }

    // Type match
    if (userProfile.types.has(internship.type)) {
      score += 2;
    }

    // Location match
    if (userProfile.locations.has(internship.location)) {
      score += 2;
    }

    // Skills match
    const internshipSkills = internship.requirements.toLowerCase().split(/\s+/);
    userProfile.skills.forEach(skill => {
      if (internshipSkills.includes(skill)) {
        score += 2;
      }
    });

    // Keyword match using TF-IDF
    const internshipText = `${internship.title} ${internship.description} ${internship.requirements}`;
    tfidf.addDocument(internshipText);
    
    userProfile.keywords.forEach(keyword => {
      const keywordScore = tfidf.tfidf(keyword, 0);
      score += keywordScore;
    });

    return score;
  }
}

module.exports = RecommendationService;
