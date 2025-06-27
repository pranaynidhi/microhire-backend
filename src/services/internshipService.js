const { Internship, User, Application } = require('../models');
const { Op } = require('sequelize');
const withTransaction = require('../utils/transaction');
const cache = require('../utils/cache');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

class InternshipService {
  static async createInternship(data, companyId) {
    return withTransaction(async (transaction) => {
      const internship = await Internship.create({
        ...data,
        companyId
      }, { transaction });

      await cache.del(`company:${companyId}:internships`);
      return internship;
    });
  }

  static async getInternshipById(id, includeCompany = true) {
    const cacheKey = `internship:${id}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const internship = await Internship.findByPk(id, {
      include: includeCompany ? [{
        model: User,
        as: 'company',
        attributes: ['id', 'companyName', 'email', 'logoUrl']
      }] : []
    });

    if (internship) {
      await cache.set(cacheKey, internship, 300);
    }

    return internship;
  }

  static async updateInternship(id, data, companyId) {
    return withTransaction(async (transaction) => {
      const internship = await Internship.findOne({
        where: { id, companyId },
        transaction
      });

      if (!internship) {
        throw new AppError('Internship not found', 404);
      }

      await internship.update(data, { transaction });
      await cache.del(`internship:${id}`);
      await cache.del(`company:${companyId}:internships`);

      return internship;
    });
  }

  static async deleteInternship(id, companyId) {
    return withTransaction(async (transaction) => {
      const internship = await Internship.findOne({
        where: { id, companyId },
        transaction
      });

      if (!internship) {
        throw new AppError('Internship not found', 404);
      }

      await internship.update({ status: 'deleted' }, { transaction });
      await cache.del(`internship:${id}`);
      await cache.del(`company:${companyId}:internships`);

      return true;
    });
  }

  static async searchInternships(filters, page = 1, limit = 10) {
    const cacheKey = `internships:search:${JSON.stringify(filters)}:${page}:${limit}`;
    const cachedData = await cache.get(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const whereClause = {
      status: 'active',
      deadline: { [Op.gt]: new Date() }
    };

    if (filters.category) {
      whereClause.category = filters.category;
    }

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.location) {
      whereClause.location = filters.location;
    }

    if (filters.query) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${filters.query}%` } },
        { description: { [Op.like]: `%${filters.query}%` } }
      ];
    }

    const result = await Internship.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'company',
        attributes: ['id', 'companyName', 'email', 'logoUrl']
      }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    const response = {
      internships: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(result.count / parseInt(limit)),
        totalItems: result.count,
        itemsPerPage: parseInt(limit)
      }
    };

    await cache.set(cacheKey, response, 300);
    return response;
  }
}

module.exports = InternshipService;
