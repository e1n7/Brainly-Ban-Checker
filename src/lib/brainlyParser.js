/**
 * Brainly Answer Parser and Rich Text Renderer
 * 
 * This module extracts answer content from Brainly HTML and converts it to rich text
 * while preserving all formatting (bold, italic, lists, links, etc.)
 */

/**
 * Sanitize HTML by removing dangerous elements while preserving formatting
 * @param {string} html - Raw HTML string
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  if (!html || typeof html !== "string") return "";

  // Create a temporary container
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Remove dangerous elements: script, iframe, style, object, embed
  const dangerousSelectors = ["script", "iframe", "style", "object", "embed"];
  dangerousSelectors.forEach((selector) => {
    temp.querySelectorAll(selector).forEach((el) => el.remove());
  });

  // Remove event handlers and dangerous attributes
  temp.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on") || attr.name === "data-testid") {
        el.removeAttribute(attr.name);
      }
    });
  });

  return temp.innerHTML;
}

/**
 * Extract answer content from Brainly HTML structure
 * Looks for common Brainly answer container selectors
 * @param {string} html - Raw HTML from Brainly
 * @returns {string} Extracted answer content HTML
 */
function extractAnswerContent(html) {
  if (!html || typeof html !== "string") return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Try multiple selectors for Brainly answer containers
  const selectors = [
    '[data-testid="answer_box_text"]',
    ".js-answer-content",
    '[class*="answer-content"]',
    '[class*="answer-text"]',
    ".brn-answer__content",
    ".answer-content",
  ];

  for (const selector of selectors) {
    const answerElement = temp.querySelector(selector);
    if (answerElement && answerElement.textContent.trim().length > 0) {
      return answerElement.innerHTML;
    }
  }

  // Fallback: if no specific container found, try to extract the main content
  // Remove common non-content elements
  const nonContentSelectors = [
    ".author-info",
    ".user-info",
    ".rating",
    ".comments",
    ".advertisement",
    ".ad",
    "[class*='placeholder']",
    "[class*='loading']",
    ".button",
    ".btn",
    ".footer",
    ".header",
  ];

  nonContentSelectors.forEach((selector) => {
    temp.querySelectorAll(selector).forEach((el) => el.remove());
  });

  return temp.innerHTML;
}

/**
 * Convert HTML to rich text representation
 * Preserves formatting without using Markdown syntax
 * @param {string} html - HTML content
 * @returns {string} Rich text content
 */
function htmlToRichText(html) {
  if (!html || typeof html !== "string") return "";

  const temp = document.createElement("div");
  temp.innerHTML = html;

  let richText = "";

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text.trim()) {
        richText += text;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();

      switch (tag) {
        case "p":
          richText += processChildren(node);
          richText += "\n";
          break;

        case "br":
          richText += "\n";
          break;

        case "strong":
        case "b":
          richText += processChildren(node);
          break;

        case "em":
        case "i":
          richText += processChildren(node);
          break;

        case "u":
          richText += processChildren(node);
          break;

        case "sup":
          richText += processChildren(node);
          break;

        case "sub":
          richText += processChildren(node);
          break;

        case "a":
          richText += processChildren(node);
          break;

        case "ul":
        case "ol":
          richText += processListItems(node, tag === "ol");
          break;

        case "li":
          richText += processChildren(node);
          break;

        case "blockquote":
          richText += processChildren(node);
          richText += "\n";
          break;

        case "div":
        case "span":
          richText += processChildren(node);
          break;

        case "img":
          // Skip images but preserve alt text if available
          const alt = node.getAttribute("alt");
          if (alt) {
            richText += `[Image: ${alt}]`;
          }
          break;

        default:
          richText += processChildren(node);
          break;
      }
    }
  }

  function processChildren(node) {
    let result = "";
    node.childNodes.forEach((child) => {
      const before = richText.length;
      processNode(child);
      result += richText.substring(before);
    });
    return result;
  }

  function processListItems(listNode, isOrdered) {
    let result = "";
    let index = 1;

    listNode.childNodes.forEach((child) => {
      if (child.tagName && child.tagName.toLowerCase() === "li") {
        const marker = isOrdered ? `${index}. ` : "• ";
        result += marker;
        result += child.textContent.trim();
        result += "\n";
        index++;
      }
    });

    return result;
  }

  temp.childNodes.forEach((child) => {
    processNode(child);
  });

  // Clean up excessive whitespace
  richText = richText
    .replace(/\n\n\n+/g, "\n\n") // Replace multiple newlines with double newline
    .trim();

  return richText;
}

/**
 * Parse Brainly HTML and return formatted content
 * @param {string} html - Raw HTML from Brainly
 * @returns {object} { text: string, richText: string, isValid: boolean }
 */
export function parseBrainlyAnswer(html) {
  try {
    if (!html || typeof html !== "string") {
      return {
        text: "",
        richText: "",
        isValid: false,
        error: "Invalid input: HTML string expected",
      };
    }

    // Sanitize the HTML first
    const sanitized = sanitizeHTML(html);

    // Extract answer content
    const answerContent = extractAnswerContent(sanitized);

    if (!answerContent || answerContent.trim().length === 0) {
      return {
        text: "",
        richText: "",
        isValid: false,
        error: "No answer content found in the provided HTML",
      };
    }

    // Convert to rich text
    const richText = htmlToRichText(answerContent);

    return {
      text: richText,
      richText: richText,
      isValid: true,
      error: null,
    };
  } catch (error) {
    console.error("Error parsing Brainly answer:", error);
    return {
      text: "",
      richText: "",
      isValid: false,
      error: `Error parsing HTML: ${error.message}`,
    };
  }
}

/**
 * Detect if input is HTML or plain text
 * @param {string} input - User input
 * @returns {boolean} True if input appears to be HTML
 */
export function isHTML(input) {
  if (!input || typeof input !== "string") return false;
  const htmlRegex = /<[a-z][\s\S]*>/i;
  return htmlRegex.test(input);
}

/**
 * Render rich text as HTML with proper formatting
 * Used for display in the preview pane
 * @param {string} richText - Rich text content
 * @returns {string} HTML for display
 */
export function renderRichTextAsHTML(richText) {
  if (!richText || typeof richText !== "string") return "";

  let html = richText;

  // Escape HTML special characters first
  html = html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // Convert newlines to <br> tags
  html = html.replace(/\n/g, "<br>");

  // Preserve multiple spaces
  html = html.replace(/  +/g, (match) => "&nbsp;".repeat(match.length));

  return html;
}

/**
 * Extract plain text from rich text for analysis
 * @param {string} richText - Rich text content
 * @returns {string} Plain text
 */
export function extractPlainText(richText) {
  if (!richText || typeof richText !== "string") return "";

  // Remove all formatting markers and return plain text
  return richText
    .replace(/\[Image: [^\]]*\]/g, "") // Remove image placeholders
    .trim();
}
