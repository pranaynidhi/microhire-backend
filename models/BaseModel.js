const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BaseModel = sequelize.define('BaseModel', {
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    paranoid: true, // Enable soft delete
    timestamps: true
  });

  return BaseModel;
};
