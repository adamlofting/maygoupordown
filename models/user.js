module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    email: DataTypes.STRING,
    username: DataTypes.STRING
  });
};
