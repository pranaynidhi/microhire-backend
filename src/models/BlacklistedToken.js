'use strict';
const { Model, DataTypes } = require('sequelize');

class BlacklistedToken extends Model {
  // Instance method to set up associations
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  BlacklistedToken.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING(512),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow null for cases where we might blacklist tokens without user context
      references: {
        model: 'users',
        key: 'id'
      }
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expiresAt' // Explicitly set the column name to match the index
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Reason for blacklisting (e.g., logout, password_change)'
    }
  }, {
    sequelize,
    modelName: 'BlacklistedToken',
    tableName: 'blacklisted_tokens',
    timestamps: true,
    paranoid: false,
    indexes: [
      {
        fields: ['token'],
        unique: true
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  return BlacklistedToken;
};
