#!/usr/bin/env node

'use strict';

const {windowManager} = require('node-window-manager');
const {hasScreenCapturePermission} = require('mac-screen-capture-permissions');
const inquirer = require('inquirer');

inquirer.registerPrompt('search-list', require('inquirer-search-list'));

const appNameRegex = /([^\/]+?)(?:\.app)?$/i;

function buildName(window) {
  const app = appNameRegex.exec(window.path)[1];
  const title = window.getTitle();

  if (title && title !== app)
    return `${appNameRegex.exec(window.path)[1]} (${window.getTitle()})`;
  else
    return app;
}

async function main() {
  const windows = windowManager.getWindows();
  const choices = windows
    .map((window) => ({
      value: window,
      name: buildName(window),
    }))
    .sort((first, second) => first.name.localeCompare(second.name));

  const numberValidator = (input) => {
    const number = +input;
    if (!isNaN(input) && Number.isInteger(number) && number > 0)
      return true;
    else
      return 'Enter a valid positive integer number';
  };

  const questions = [
    {
      type: 'search-list',
      name: 'app',
      message: 'Select application to resize (input name to filter results)',
      choices: choices,
    },
    {
      type: 'input',
      name: 'width',
      message: 'Width',
      validate: numberValidator,
    },
    {
      type: 'input',
      name: 'height',
      message: 'Height',
      default: (answers) => answers.width,
      validate: numberValidator,
    },
  ];

  const answers = await inquirer.prompt(questions);

  const width = parseInt(answers.width, 10);
  const height = parseInt(answers.height, 10);
  const window = answers.app;

  window.setBounds({x: width, y: height});
  window.bringToTop();
}

console.log(`
  In order to query and resize macOS windows, this application requires accessibility and screen capture permissions.
  Please grant these permissions to the application or else it won't work. The application DOES NOT capture your screen.
`);

// Screen capture permission required on macOS Catalina+ for fetching window titles
windowManager.requestAccessibility();

if (hasScreenCapturePermission()) {
  main();
}
