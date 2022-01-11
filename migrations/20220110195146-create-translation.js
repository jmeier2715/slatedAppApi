'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('translations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      rootText: {
        type: Sequelize.TEXT
      },
      rootLanguage: {
        type: Sequelize.STRING
      },
      targetText: {
        type: Sequelize.TEXT
      },
      targetLanguage: {
        type: Sequelize.STRING
      },
      collectionId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('translations');
  }
};