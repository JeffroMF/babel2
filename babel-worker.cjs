const { transformSync } = require("@babel/core");
const { mkdirSync, statSync, readFileSync, writeFileSync } = require("fs");
const { dirname } = require("path");
const fancyLog = require("fancy-log");

let chalk;
const chalkP = import("chalk").then(ns => {
  chalk = ns.default;
});

function needCompile(src, dest) {
  let destStat;
  try {
    destStat = statSync(dest);
  } catch (err) {
    if (err.code === "ENOENT") {
      return true;
    } else {
      throw err;
    }
  }
  const srcStat = statSync(src);
  return srcStat.mtimeMs > destStat.mtimeMs;
}

exports.transform = function transform(src, dest) {
  if (!chalk) return chalkP.then(() => transform(src, dest));

  mkdirSync(dirname(dest), { recursive: true });
  if (!needCompile(src, dest)) {
    return;
  }
  fancyLog(`Compiling '${chalk.cyan(src)}'...`);
  const content = readFileSync(src, { encoding: "utf8" });
  const { code } = transformSync(content, {
    filename: src,
    caller: {
      // We have wrapped packages/babel-core/src/config/files/configuration.js with feature detection
      supportsDynamicImport: true,
      name: "babel-worker",
    },
  });

  writeFileSync(dest, code, "utf8");
};
