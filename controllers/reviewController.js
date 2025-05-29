// controllers/reviewController.js
const Review = require('../models/Review');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { Op } = require('sequelize');

const reviewController = {
  createReview: async (req, res) => {
    try {
      const { revieweeId, internshipId, rating, comment, type } = req.body;

      // Validate that reviewer and reviewee had an internship relationship
      const application = await Application.findOne({
        where: {
          internshipId,
          userId: type === 'student_to_company' ? req.user.id : revieweeId,
          status: 'accepted'
        },
        include: [{
          model: Internship,
          where: {
            companyId: type === 'company_to_student' ? req.user.id : revieweeId
          }
        }]
      });

      if (!application) {
        return res.status(400).json({
          success: false,
          message: 'You can only review users you have worked with'
        });
      }

      // Check if review already exists
      const existingReview = await Review.findOne({
        where: {
          reviewerId: req.user.id,
          revieweeId,
          internshipId
        }
      });

      if (existingReview) {
        return res.status(409).json({
          success: false,
          message: 'You have already reviewed this user for this internship'
        });
      }

      const review = await Review.create({
        reviewerId: req.user.id,
        revieweeId,
        internshipId,
        rating,
        comment,
        type
      });

      const reviewWithDetails = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: User,
            as: 'reviewee',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: Internship,
            attributes: ['id', 'title']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: { review: reviewWithDetails }
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create review'
      });
    }
  },

  getUserReviews: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const reviews = await Review.findAndCountAll({
        where: { 
          revieweeId: userId,
          isVisible: true 
        },
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName', 'companyName']
          },
          {
            model: Internship,
            attributes: ['id', 'title']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(reviews.count / limit),
            totalItems: reviews.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reviews'
      });
    }
  },

  getCompanyReviews: async (req, res) => {
    try {
      const { companyId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const reviews = await Review.findAndCountAll({
        where: { 
          revieweeId: companyId,
          type: 'student_to_company',
          isVisible: true 
        },
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName']
          },
          {
            model: Internship,
            attributes: ['id', 'title']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          reviews: reviews.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(reviews.count / limit),
            totalItems: reviews.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get company reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch company reviews'
      });
    }
  },

  updateReview: async (req, res) => {
    try {
      const { rating, comment } = req.body;

      const review = await Review.findOne({
        where: {
          id: req.params.id,
          reviewerId: req.user.id
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you are not authorized to update it'
        });
      }

      await review.update({ rating, comment });

      const updatedReview = await Review.findByPk(review.id, {
        include: [
          {
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: User,
            as: 'reviewee',
            attributes: ['id', 'fullName', 'email']
          },
          {
            model: Internship,
            attributes: ['id', 'title']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review: updatedReview }
      });
    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update review'
      });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const review = await Review.findOne({
        where: {
          id: req.params.id,
          reviewerId: req.user.id
        }
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you are not authorized to delete it'
        });
      }

      await review.update({ isVisible: false });

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });
    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete review'
      });
    }
  },

  getReviewStats: async (req, res) => {
    try {
      const { userId } = req.params;

      const stats = await Review.findAll({
        where: { 
          revieweeId: userId,
          isVisible: true 
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 5 THEN 1 END')), 'fiveStars'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 4 THEN 1 END')), 'fourStars'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 3 THEN 1 END')), 'threeStars'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 2 THEN 1 END')), 'twoStars'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN rating = 1 THEN 1 END')), 'oneStar']
        ]
      });

      res.json({
        success: true,
        data: { stats: stats[0] }
      });
    } catch (error) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch review statistics'
      });
    }
  }
};

module.exports = reviewController;
