/**
 * Robust JSON parser that extracts, repairs, and parses JSON data from LLM responses,
 * even when wrapped in markdown code fences, containing trailing commas, or truncated
 * by token limit boundaries.
 *
 * @param {string} rawText - Raw text output from LLM
 * @returns {any} parsed JavaScript object or array
 * @throws {Error} if valid JSON cannot be found or parsed
 */

/**
 * Sanitizes and repairs common LLM JSON syntax quirks:
 * - Trailing commas before } or ]
 * - Trailing commas at end of properties
 */
const sanitizeJSONString = (str) => {
  return str
    .replace(/,\s*([\]}])/g, '$1')
    .replace(/,\s*$/, '');
};

export const extractJSONFromLLMResponse = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('LLM returned an empty or invalid response.');
  }

  let text = rawText.trim();

  // 1. Remove markdown code block wrappers (```json ... ``` or ``` ...)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  } else {
    // If opening fence exists without closing fence (e.g. truncated output)
    text = text.replace(/^```(?:json)?\s*/i, '').trim();
  }

  // 2. Direct JSON.parse attempt
  try {
    return JSON.parse(text);
  } catch (initialErr) {
    // 3. Fallback: Search for outer JSON boundaries (either [] for arrays or {} for objects)
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    // Prioritize array if brackets exist
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const arraySubstring = text.slice(firstBracket, lastBracket + 1);
      try {
        return JSON.parse(arraySubstring);
      } catch {
        try {
          return JSON.parse(sanitizeJSONString(arraySubstring));
        } catch {
          // Continue to salvage attempt
        }
      }
    }

    // Try object boundaries
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const objectSubstring = text.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(objectSubstring);
      } catch {
        try {
          return JSON.parse(sanitizeJSONString(objectSubstring));
        } catch {
          // Continue to salvage attempt
        }
      }
    }

    // 4. Salvage truncated array (e.g. when LLM reached token limit before closing array)
    if (firstBracket !== -1) {
      const arrayText = text.slice(firstBracket);
      const lastObjEnd = arrayText.lastIndexOf('}');
      if (lastObjEnd !== -1) {
        const salvagedSlice = arrayText.slice(0, lastObjEnd + 1);
        const candidate = sanitizeJSONString(salvagedSlice) + ']';
        try {
          const salvaged = JSON.parse(candidate);
          if (Array.isArray(salvaged) && salvaged.length > 0) {
            console.log(`[JSON Parser] Salvaged ${salvaged.length} completed items from truncated response.`);
            return salvaged;
          }
        } catch {
          // Fall through to error
        }
      }
    }

    throw new Error(`Failed to parse structured JSON from LLM: ${initialErr.message}`);
  }
};
