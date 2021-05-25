const inquirer = require('inquirer');

module.exports = {
  register: () => {
    const player = [
      {
        name: 'playername',
        type: 'input',
        message: 'Name of player:',
        validate: function( name ) {
          if (name.length) {
            return true;
          } else {
            return 'Please enter your name.';
          }
        }
      },
      {
        name: 'game',
        type: 'input',
        message: 'Enter game name:',
        validate: function(game) {
          if (game.length) {
            return true;
          } else {
            return 'Please enter the name of the game to enter.';
          }
        }
      }
    ];

    return inquirer.prompt(player);
  },
};