'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class translation extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.translation.belongsTo(models.user)
    }
  };
  translation.init({
    rootText: DataTypes.TEXT,
    rootLanguage: DataTypes.STRING,
    targetText: DataTypes.TEXT,
    targetLanguage: DataTypes.STRING,
    collectionId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'translation',
  });
  return translation;
};