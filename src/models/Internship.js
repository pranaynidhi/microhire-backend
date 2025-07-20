'use strict';

const { Model, DataTypes } = require('sequelize');

class Internship extends Model {
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  Internship.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id',
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [5, 200],
      },
      field: 'title',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      field: 'description',
    },
    requirements: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'requirements',
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'location',
    },
    stipend: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'stipend',
    },
    duration: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'duration',
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: () => new Date().toISOString(),
      },
      field: 'deadline',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
      field: 'company_id',
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users', // Must match the actual table name in the database
        key: 'id',
      },
      field: 'student_id',
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'draft'),
      defaultValue: 'active',
      field: 'status',
    },
    type: {
      type: DataTypes.ENUM('remote', 'onsite', 'hybrid'),
      defaultValue: 'onsite',
      field: 'type',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'category',
    },
    maxApplicants: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_applicants',
    },
  }, {
    sequelize,
    modelName: 'Internship',
    tableName: 'internships',
    timestamps: true,
    underscored: true,
  });
  
  return Internship;
};