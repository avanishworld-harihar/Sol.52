import fs from "fs";

const LIVE = ":global([data-proposal-live='true'])";
const SHELL_LIVE = ".root[data-proposal-live='true']";

function prefixSelectors(selectors, prefix) {
  return selectors
    .split(",")
    .map((sel) => {
      const s = sel.trim();
      if (!s) return s;
      if (s.startsWith("@")) return s;
      if (prefix === SHELL_LIVE && s === ".root") {
        return SHELL_LIVE;
      }
      if (prefix === SHELL_LIVE && s.startsWith(".root ")) {
        return s.replace(/^\.root\b/, SHELL_LIVE);
      }
      if (prefix === SHELL_LIVE && s.startsWith(".root:")) {
        return s.replace(/^\.root\b/, SHELL_LIVE);
      }
      return `${prefix} ${s}`;
    })
    .join(",\n  ");
}

function transformMediaBlocks(css, prefix) {
  const mediaRe = /@media screen[^{]+\{/g;
  let result = "";
  let lastIndex = 0;
  let match;

  while ((match = mediaRe.exec(css)) !== null) {
    const mediaStart = match.index;
    const bodyStart = match.index + match[0].length;
    result += css.slice(lastIndex, mediaStart);

    let depth = 1;
    let i = bodyStart;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth += 1;
      if (css[i] === "}") depth -= 1;
      i += 1;
    }
    const bodyEnd = i - 1;
    const mediaHeader = css.slice(mediaStart, bodyStart);
    const body = css.slice(bodyStart, bodyEnd);

    let transformed = "";
    const lines = body.split("\n");
    let j = 0;
    while (j < lines.length) {
      const trimmed = lines[j].trim();
      if (!trimmed || trimmed.startsWith("/*")) {
        transformed += `${lines[j]}\n`;
        j += 1;
        continue;
      }

      const selectorParts = [];
      while (j < lines.length) {
        const t = lines[j].trim();
        if (!t || t.startsWith("/*")) {
          j += 1;
          continue;
        }
        if (t.startsWith("@")) break;
        selectorParts.push(t.replace(/\s*\{\s*$/, ""));
        if (t.includes("{")) {
          j += 1;
          break;
        }
        j += 1;
      }
      if (selectorParts.length === 0) continue;

      const selectorText = prefixSelectors(selectorParts.join(" "), prefix);
      transformed += `  ${selectorText} {\n`;
      while (j < lines.length) {
        if (lines[j].trim() === "}") {
          transformed += `${lines[j]}\n`;
          j += 1;
          break;
        }
        transformed += `${lines[j]}\n`;
        j += 1;
      }
    }

    result += mediaHeader + transformed + "}\n";
    lastIndex = i;
  }

  result += css.slice(lastIndex);
  return result;
}

const luxePath = "components/proposals/luxe-noir/luxe.module.css";
const shellPath = "components/proposals/luxe-noir/luxe-noir-shell.module.css";

fs.writeFileSync(
  luxePath,
  transformMediaBlocks(fs.readFileSync(luxePath, "utf8").replace(/\r\n/g, "\n"), LIVE)
);
fs.writeFileSync(
  shellPath,
  transformMediaBlocks(fs.readFileSync(shellPath, "utf8").replace(/\r\n/g, "\n"), SHELL_LIVE)
);

console.log("Scoped tablet/phone preview CSS to live proposal root.");
