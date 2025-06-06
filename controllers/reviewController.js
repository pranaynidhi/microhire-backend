const Review = require('../models/Review');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const { Op } = require('sequelize');
const ReviewReport = require('../models/ReviewReport');
const sequelize = require('../config/database');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

const reviewController = {
  createReview: async (req, res) => {
    try {
      const result = await withTransaction(async (transaction) => {
        // Check if internship exists and is completed
        const internship = await Internship.findOne({
          where: { 
            id: req.body.internshipId,
            status: 'completed'
          },
          transaction
        });

        if (!internship) {
          throw new AppError('Internship not found or not completed', 404);
        }

        // Check if user is authorized to review
        if (req.user.role === 'student' && internship.studentId !== req.user.id) {
          throw new AppError('Not authorized to review this internship', 403);
        }

        if (req.user.role === 'business' && internship.companyId !== req.user.id) {
          throw new AppError('Not authorized to review this internship', 403);
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
          where: {
            reviewerId: req.user.id,
            internshipId: req.body.internshipId
          },
          transaction
        });

        if (existingReview) {
          throw new AppError('You have already reviewed this internship', 400);
        }

        // Create review
        const review = await Review.create({
          reviewerId: req.user.id,
          revieweeId: req.user.role === 'student' ? internship.companyId : internship.studentId,
          internshipId: req.body.internshipId,
          rating: req.body.rating,
          comment: req.body.comment,
          type: req.user.role
        }, { transaction });

        // Invalidate caches
        await Promise.all([
          cache.del(`internship:${req.body.internshipId}:reviews`),
          cache.del(`user:${review.revieweeId}:reviews`),
          cache.del(`user:${review.reviewerId}:reviews`)
        ]);

        return review;
      });

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: { review: result }
      });
    } catch (error) {
      logger.error('Create review error:', error);
      throw error;
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

      // Get basic stats
      const basicStats = await Review.findAll({
        where: { 
          revieweeId: userId,
          isVisible: true,
          status: 'approved'
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

      // Get recent trends
      const recentTrends = await Review.findAll({
        where: { 
          revieweeId: userId,
          isVisible: true,
          status: 'approved',
          createdAt: {
            [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      // Get category-wise ratings
      const categoryStats = await Review.findAll({
        where: { 
          revieweeId: userId,
          isVisible: true,
          status: 'approved'
        },
        include: [{
          model: Internship,
          attributes: ['category']
        }],
        attributes: [
          [sequelize.col('Internship.category'), 'category'],
          [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount']
        ],
        group: [sequelize.col('Internship.category')]
      });

      res.json({
        success: true,
        data: {
          basicStats: basicStats[0],
          recentTrends,
          categoryStats
        }
      });
    } catch (error) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch review statistics'
      });
    }
  },

  reportReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { reason, description } = req.body;
      const reporterId = req.user.id;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user has already reported this review
      const existingReport = await ReviewReport.findOne({
        where: {
          reviewId,
          reporterId
        }
      });

      if (existingReport) {
        return res.status(409).json({
          success: false,
          message: 'You have already reported this review'
        });
      }

      // Create report
      await ReviewReport.create({
        reviewId,
        reporterId,
        reason,
        description
      });

      // Update review report count
      await review.update({
        reportCount: review.reportCount + 1,
        lastReportedAt: new Date()
      });

      // If report count reaches threshold, hide review
      if (review.reportCount >= 3) {
        await review.update({
          isVisible: false,
          status: 'pending'
        });
      }

      res.json({
        success: true,
        message: 'Review reported successfully'
      });
    } catch (error) {
      console.error('Report review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to report review'
      });
    }
  },

  getReviewReports: async (req, res) => {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (page - 1) * limit;

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }

      const reports = await ReviewReport.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Review,
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
              }
            ]
          },
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'fullName', 'email']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });

      res.json({
        success: true,
        data: {
          reports: reports.rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(reports.count / limit),
            totalItems: reports.count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get review reports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch review reports'
      });
    }
  },

  moderateReview: async (req, res) => {
    try {
      const { reviewId } = req.params;
      const { status, adminNotes } = req.body;

      const review = await Review.findByPk(reviewId);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      await review.update({
        status,
        adminNotes,
        isVisible: status === 'approved'
      });

      // Update all reports for this review
      await ReviewReport.update(
        { status: 'resolved' },
        { where: { reviewId } }
      );

      res.json({
        success: true,
        message: 'Review moderated successfully',
        data: { review }
      });
    } catch (error) {
      console.error('Moderate review error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to moderate review'
      });
    }
  },

  getReviews: async (req, res) => {
    try {
      const cacheKey = `user:${req.params.userId}:reviews:${req.query.page}:${req.query.limit}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        return res.json(cachedData);
      }

      const result = await withTransaction(async (transaction) => {
        const reviews = await Review.findAndCountAll({
          where: { 
            revieweeId: req.params.userId,
            isVisible: true
          },
          include: [{
            model: User,
            as: 'reviewer',
            attributes: ['id', 'fullName', 'role']
          }],
          order: [['createdAt', 'DESC']],
          limit: parseInt(req.query.limit) || 10,
          offset: (parseInt(req.query.page) - 1) * (parseInt(req.query.limit) || 10),
          transaction
        });

        return reviews;
      });

      const response = {
        success: true,
        data: {
          reviews: result.rows,
          pagination: {
            currentPage: parseInt(req.query.page) || 1,
            totalPages: Math.ceil(result.count / (parseInt(req.query.limit) || 10)),
            totalItems: result.count,
            itemsPerPage: parseInt(req.query.limit) || 10
          }
        }
      };

      await cache.set(cacheKey, response, 300); // Cache for 5 minutes

      res.json(response);
    } catch (error) {
      logger.error('Get reviews error:', error);
      throw error;
    }
  }
};

module.exports = reviewController;
