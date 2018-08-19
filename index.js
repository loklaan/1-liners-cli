#!/usr/bin/env node
'use strict';

const util = require('util');
const path = require('path');
const fs = require('fs');
const meow = require('meow');
const fuzzy = require('fuzzy');
const chalk = require('chalk');
const readFile = util.promisify(fs.readFile);
const readdir = util.promisify(fs.readdir);

const cli = meow(`
	Usage
		$ 1-liners <fnName>
	
	Options
		--print, -p   Print to stdout
		--help        Print this message
	
	Examples
		$ 1-liners throttle
`);

async function main() {
  const oneLinersDir = path.resolve(path.dirname(require.resolve('1-liners')), 'module');
  const oneLinersFiles = await readdir(oneLinersDir);
  const oneLinersNames = oneLinersFiles.map(fileName => path.basename(fileName, '.js'));

  let fnName;
  if (cli.input.length === 0) {
    const inquirer = require('inquirer');
    inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))
    const answers = await inquirer.prompt([{
      type: 'autocomplete',
      name: 'fnName',
      message: `Which one liner function would you like to ${cli.flags.print ? 'print' : 'copy to clipboard'}?`,
      source: (answers, input) => Promise.resolve(
        !input ? oneLinersNames : fuzzy.filter(
          input,
          oneLinersNames
        ).map(v => v.string)
      )
    }]);
    fnName = answers.fnName;
  } else {
    fnName = cli.input[0];
    if (!oneLinersNames.includes(fnName)) {
      const matches = fuzzy.filter(fnName, oneLinersNames).map(v => v.string);
      const closestName = matches[0];
      console.log(`Could not find a function with the name "${chalk.bold.underline(fnName)}".`);
      closestName && console.log(`Did you mean to type "${chalk.bold.underline(closestName)}"?`);
      process.exit(1);
    }
  }

  const fnFilePath = path.resolve(oneLinersDir, fnName + '.js');
  const fnFileSrc = (await readFile(fnFilePath)).toString();
  const {code} = require('@babel/core').transform(fnFileSrc, {
    babelrc: false,
    comments: false,
    plugins: [pluginStripCommentsAndModules(fnName)]
  });
  if (cli.flags.print) {
    console.log(code);
  } else {
    const clip = require('clipboardy');
    clip.writeSync(code);
    console.log(`${chalk.green('✔')} Copied to clipboard!`)
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
});

function pluginStripCommentsAndModules(fnName) {
  return function ({types: t}) {
    return {
      visitor: {
        Program(path) {
          const program = path.parent.program;
          let nodes = program.body;
          let comments = program.body[0].leadingComments;

          // Swap "export default" for const
          let node = nodes[0];
          const isExportDefault = node.type === 'ExportDefaultDeclaration';
          if (isExportDefault) {
            const constNode = t.variableDeclaration(
              'const', [
                t.variableDeclarator(
                  t.identifier(fnName),
                  node.declaration
                )
              ]
            );
            constNode.leaderComments = null;
            constNode.trailingComments = null;
            node = constNode;
          }

          node.leadingComments = comments;

          path.parent.program = t.program([node]);
        }
      }
    };
  }
}
