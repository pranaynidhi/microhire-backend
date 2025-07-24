'use strict';

const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

class User extends Model {
  // Instance method to get public profile
  getPublicProfile() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.twoFactorSecret;
    delete values.recoveryCodes;
    return values;
  }

  // Instance method to compare password
  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  
  // Associations are defined in src/models/associations.js
}

// Export a function that returns the model definition
module.exports = (sequelize) => {
  User.init(
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
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'bio',
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone',
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'address',
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'city',
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'state',
      },
      country: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'country',
      },
      postalCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'postal_code',
      },
      profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'profile_picture',
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'email_verified',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login',
      },
      twoFactorSecret: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'two_factor_secret',
      },
      twoFactorEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'two_factor_enabled',
      },
      recoveryCodes: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'recovery_codes',
        get() {
          const rawValue = this.getDataValue('recoveryCodes');
          return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
          this.setDataValue('recoveryCodes', JSON.stringify(value));
        },
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'logo_url',
      },
      education: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'education',
        defaultValue: [],
        get() {
          const rawValue = this.getDataValue('education');
          return rawValue || [];
        },
        set(value) {
          this.setDataValue('education', value || []);
        },
      },
      // Notification Preferences
      emailNewInternships: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_new_internships',
      },
      emailApplicationUpdates: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_application_updates',
      },
      emailMessages: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'email_messages',
      },
      emailMarketing: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'email_marketing',
      },
      pushMessages: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'push_messages',
      },
      pushDeadlines: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'push_deadlines',
      },
      // Privacy Settings
      profileVisibility: {
        type: DataTypes.ENUM('public', 'companies', 'private'),
        allowNull: false,
        defaultValue: 'public',
        field: 'profile_visibility',
      },
      showOnlineStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'show_online_status',
      },
      searchEngineIndexing: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'search_engine_indexing',
      },
      // Location (frontend uses a single string)
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'location',
      },
      // Settings change history
      settingsHistory: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        field: 'settings_history',
        get() {
          const rawValue = this.getDataValue('settingsHistory');
          return rawValue || [];
        },
        set(value) {
          this.setDataValue('settingsHistory', value || []);
        },
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  return User;
};
