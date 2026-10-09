/**
 * Utility for consolidating fragmented line breaks and pdftotext output into coherent, complete resume bullet points.
 */

const ACTION_VERB_REGEX =
  /^(Designed|Developed|Built|Engineered|Implemented|Architected|Created|Led|Drove|Integrated|Spearheaded|Collaborated|Managed|Authored|Established|Configured|Delivered|Orchestrated|Automated|Maintained|Shipped|Resolved|Upgraded|Pioneered|Championed|Formulated|Executed|Constructed|Transformed|Streamlined|Reduced|Increased|Accelerated)\b/i;

const TITLE_PREFIX_REGEX = /^([A-Za-z0-9\s\(\)\/\.\,]+[—–\-])\s*[A-Z]/;
const LABEL_PREFIX_REGEX = /^[A-Z][a-zA-Z\s]{2,25}:\s+/;
const BULLET_SYMBOL_REGEX = /^[•·*–—▪▫◦►✓○\u2022\u25E6\u25AA\u25CF\u25CB\u2043\u2219\u25B6\-]\s*/;
const LIST_NUMBER_REGEX = /^\d+[\.\)]\s+/;
const DANGLING_END_REGEX =
  /([,\/:\(;]|\b(and|or|in|to|for|with|by|on|at|of|from|the|a|an|as|via|across|into|through|including|such as))\s*$/i;

export function consolidateBullets(rawLines: string[] | string | null | undefined): string[] {
  if (!rawLines) return [];

  const lines = Array.isArray(rawLines)
    ? rawLines.flatMap((item) => (typeof item === 'string' ? item.split('\n') : []))
    : typeof rawLines === 'string'
      ? rawLines.split('\n')
      : [];

  const result: string[] = [];

  for (const line of lines) {
    const rawTrimmed = line.trim();
    if (!rawTrimmed) continue;

    const hasExplicitBullet = BULLET_SYMBOL_REGEX.test(rawTrimmed) || LIST_NUMBER_REGEX.test(rawTrimmed);
    const cleaned = rawTrimmed
      .replace(BULLET_SYMBOL_REGEX, '')
      .replace(LIST_NUMBER_REGEX, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) continue;

    if (result.length === 0) {
      result.push(cleaned);
      continue;
    }

    const prev = result[result.length - 1];
    const prevEndsHyphen = /-$/.test(prev);
    const prevEndsDangling = DANGLING_END_REGEX.test(prev);
    const prevEndsTerminal = /[\.!?:;]\s*$/.test(prev);
    const prevEndsParen = /\)\s*$/.test(prev);
    const currStartsLower = /^[a-z]/.test(cleaned);
    const currStartsContinuationPunct = /^[\)\]\},;]/.test(cleaned);
    const currStartsActionVerb = ACTION_VERB_REGEX.test(cleaned);
    const currStartsTitlePrefix = TITLE_PREFIX_REGEX.test(cleaned);
    const currStartsLabelPrefix = LABEL_PREFIX_REGEX.test(cleaned);

    let isContinuation = false;
    if (prevEndsHyphen) {
      isContinuation = true;
    } else if (prevEndsDangling) {
      isContinuation = true;
    } else if (currStartsLower || currStartsContinuationPunct) {
      isContinuation = true;
    } else if (hasExplicitBullet) {
      isContinuation = false;
    } else if (currStartsActionVerb || currStartsTitlePrefix || currStartsLabelPrefix) {
      isContinuation = false;
    } else if (prevEndsTerminal || (prevEndsParen && !currStartsLower)) {
      isContinuation = false;
    } else {
      isContinuation = true;
    }

    if (isContinuation) {
      if (prevEndsHyphen) {
        result[result.length - 1] = prev + cleaned;
      } else {
        result[result.length - 1] = `${prev} ${cleaned}`;
      }
    } else {
      result.push(cleaned);
    }
  }

  return result
    .map((b) => b.replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 3);
}
