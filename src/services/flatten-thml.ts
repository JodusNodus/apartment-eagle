import * as cheerio from "cheerio";

export function flattenHTML(html: string, indentLevel = 0) {
  const $ = cheerio.load(html);
  const output: string[] = [];

  function processElement(el: any, indent = 0) {
    const tag = el.tagName;
    if (!tag) return;

    const attrs = Object.entries(el.attribs || {})
      .map(([key, val]) => `${key}="${val}"`)
      .join(" ");

    let line = `${"  ".repeat(indent)}[${tag}${attrs ? " " + attrs : ""}]`;

    // If element has only text
    const children = el.children || [];
    const text = $(el).text().trim();
    const hasOnlyText = children.length === 1 && children[0].type === "text";

    if (hasOnlyText) {
      line += `: ${text}`;
      output.push(line);
    } else {
      output.push(line);
      for (const child of children) {
        if (child.type === "text") {
          const trimmed = child.data.trim();
          if (trimmed) {
            output.push(`${"  ".repeat(indent + 1)}${trimmed}`);
          }
        } else if (child.type === "tag") {
          processElement(child, indent + 1);
        }
      }
    }
  }

  $("body")
    .children()
    .each((_, el) => processElement(el, indentLevel));
  return output.join("\n");
}
