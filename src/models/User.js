const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id',
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
      field: 'full_name',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      field: 'email',
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [8, 255],
        is: {
          args: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\]{};':"|,.<>/?])[A-Za-z\d!@#$%^&*()_+\-=\]{};':"|,.<>/?]{8,}$/,
          msg: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        },
      },
      field: 'password',
    },
    role: {
      type: DataTypes.ENUM('student', 'business', 'admin'),
      allowNull: false,
      field: 'role',
    },
    // Student-specific fields
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'bio',
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'skills',
    },
    resumeUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'resume_url',
    },
    // Business-specific fields
    companyName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'company_name',
    },
    contactPerson: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'contact_person',
    },
    companyDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'company_description',
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'website',
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'phone',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    logoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'logo_url',
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified',
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'email_verification_token',
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'password_reset_token',
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires',
    },
    lastPasswordChange: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_password_change',
    },
    // 2FA fields
    twoFASecret: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'two_fa_secret',
    },
    twoFAEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'two_fa_enabled',
    },
  },
  {
    timestamps: true,
    underscored: true,
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// Instance method to get public profile
User.prototype.getPublicProfile = function () {
  const userObject = this.toJSON();
  delete userObject.password;
  return userObject;
};

User.prototype.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
