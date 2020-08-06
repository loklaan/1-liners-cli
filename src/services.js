module.exports = {
  highlightedTextToElements,
  fetchOneLinerNames,
  fetchOneLinerCode,
  stripMatchTokens,
  fuzzyFilterList,
  getDesc,
};

function fuzzyFilterList(text, list, pluck = (x) => x) {
  const fuzzy = require("fuzzy");
  const { Tokens } = require("./consts");

  return fuzzy
    .filter(text, list, {
      extract: pluck,
      pre: Tokens.BEFORE,
      post: Tokens.AFTER,
    })
    .map((v) => v.string.replace(Tokens.AFTER + Tokens.BEFORE, ""));
}

function highlightedTextToElements(text) {
  const React = require("react");
  const { Text } = require("ink");
  const { Tokens } = require("./consts");

  return text
    .split("")
    .reduce((parts, char) => {
      if (char === Tokens.BEFORE) {
        const part = { highlighted: true, text: "" };
        parts.push(part);
      } else if (char === Tokens.AFTER) {
        const part = { highlighted: false, text: "" };
        parts.push(part);
      } else if (parts.length === 0) {
        const part = { highlighted: false, text: char };
        parts.push(part);
      } else {
        parts[parts.length - 1].text += char;
      }

      return parts;
    }, [])
    .map((part, i) =>
      React.createElement(
        Text,
        { key: `${i}__${part.text}`, bold: part.highlighted },
        [part.text]
      )
    );
}

function getDesc() {
  const link = require("terminal-link");
  const pkgJson = require("../package");

  const getOneLinerUrl = (v) =>
    `https://github.com/1-liners/1-liners/tree/v${v}/documentation`;
  const oneLinerUrl = getOneLinerUrl(pkgJson.dependencies["1-liners"]);
  return `Find and copy the source of a ${link(
    "1-liners",
    oneLinerUrl
  )} function.`;
}

function getOneLinerDir() {
  const path = require("path");

  return path.resolve(path.dirname(require.resolve("1-liners")), "module");
}

function stripMatchTokens(str) {
  return str.replace(/[<>]/g, "");
}

async function fetchOneLinerNames() {
  const util = require("util");
  const path = require("path");
  const fs = require("fs");
  const readdir = util.promisify(fs.readdir);

  const oneLinersFiles = await readdir(getOneLinerDir());
  const oneLinersNames = oneLinersFiles.map((fileName) =>
    path.basename(fileName, ".js")
  );

  return oneLinersNames;
}

async function fetchOneLinerCode(fnName) {
  const util = require("util");
  const path = require("path");
  const fs = require("fs");
  const babel = require("@babel/core");
  const prettier = require("prettier");
  const babelPluginStripModules = require("./babel-plugin-strip-modules");
  const { codeCache } = require("./consts");
  const readFile = util.promisify(fs.readFile);

  if (!fnName) return "";
  fnName = stripMatchTokens(fnName);
  // So as not to clash with any inbuilts or ponyfills
  const cacheName = `_____${fnName}`;
  if (cacheName in codeCache) return codeCache[cacheName];
  const fnFilePath = path.resolve(getOneLinerDir(), fnName + ".js");
  const fnFileSrc = (await readFile(fnFilePath)).toString();
  const { code } = babel.transform(fnFileSrc, {
    babelrc: false,
    comments: false,
    plugins: [babelPluginStripModules(fnName)],
  });
  const prettiered = prettier.format(code, {
    semi: false,
    parser: "babel",
    printWidth: 40,
  });
  codeCache[cacheName] = prettiered;

  return prettiered;
}
