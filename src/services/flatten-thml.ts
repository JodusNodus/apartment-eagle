import { htmlToText } from "html-to-text";

export function flattenHTML(html: string) {
  return htmlToText(html, {
    wordwrap: 130,
    selectors: [
      { selector: "a", options: { ignoreHref: true } },
      { selector: "img", format: "skip" },
      { selector: "nav", format: "skip" },
      { selector: "footer", format: "skip" },
      { selector: "header", format: "skip" },
      { selector: "aside", format: "skip" },
      { selector: "form", format: "skip" },
      { selector: "input", format: "skip" },
      { selector: "button", format: "skip" },
    ],
  });
}
