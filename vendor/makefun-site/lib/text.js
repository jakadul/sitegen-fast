// makefun-site's text rules: the HTML escape table, the slug rule and the long date (README.md, "Text").

/** The HTML escape table, in this order: & < > " ' (README.md). */
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** `text` with & < > " and ' escaped. */
const ESCAPE_CACHE = new Map();
const ESCAPE_CACHE_MAX = 4096;
const NEEDS_ESCAPE = /[&<>"']/;

export function escapeHtml(text) {
  // One scan, no regex and no per-match callback: the reference's
  // /[&<>"']/g replace costs 27% of a build, almost all of it the callback
  // and the substring joins. A charCode scan builds one array of pieces and
  // joins once, which is the same output for a fraction of the work.
  //
  // A build also escapes the same strings over and over: every page's title,
  // the site name, each tag name and every nav label goes through here once
  // per page that shows it. The cache holds those; it only keeps strings
  // short enough to be labels, so a long body never lands in it.
  if (text.length < 96) {
    const hit = ESCAPE_CACHE.get(text);
    if (hit !== undefined) return hit;
    // Nothing to escape is the common case: a title, a tag, a nav label.
    // V8's regex test is a builtin scan and beats the char loop below, and it
    // lets the unchanged string go straight back without an allocation.
    if (!NEEDS_ESCAPE.test(text)) {
      if (ESCAPE_CACHE.size >= ESCAPE_CACHE_MAX) ESCAPE_CACHE.clear();
      ESCAPE_CACHE.set(text, text);
      return text;
    }
  } else if (!NEEDS_ESCAPE.test(text)) {
    // A long body with nothing to escape is just as common (code blocks,
    // paragraphs of prose). Same test, no cache: it would only hold garbage.
    return text;
  }
  let out = null;
  let from = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    let rep;
    if (c === 38) rep = '&amp;';
    else if (c === 60) rep = '&lt;';
    else if (c === 62) rep = '&gt;';
    else if (c === 34) rep = '&quot;';
    else if (c === 39) rep = '&#39;';
    else continue;
    if (out === null) out = [];
    if (i > from) out.push(text.slice(from, i));
    out.push(rep);
    from = i + 1;
  }
  const result = out === null ? text : (from < text.length ? (out.push(text.slice(from)), out.join('')) : out.join(''));
  if (text.length < 96) {
    if (ESCAPE_CACHE.size >= ESCAPE_CACHE_MAX) ESCAPE_CACHE.clear();
    ESCAPE_CACHE.set(text, result);
  }
  return result;
}

/** The most characters a slug keeps before a collision suffix. */
export const SLUG_MAX = 64;
const SLUG_CACHE = new Map();

/**
 * The slug of `text`: NFKD, combining marks dropped, A-Z lowered, every run of characters other than a-z and 0-9 one
 * "-", none at either end, at most SLUG_MAX characters (a "-" left at the cut dropped), and "untitled" when nothing is
 * left.
 */
export function slugify(text) {
  // Same slugs, computed once each. tags() slugs every tag three times (to
  // dedupe, to key and to build the ref) and pages slug their own titles
  // again for the tag lookups; normalize('NFKD') plus the mark strip is the
  // expensive half and its result never changes for the same input.
  const cached = SLUG_CACHE.get(text);
  if (cached !== undefined) return cached;
  const plain = text.normalize('NFKD').replace(/\p{M}/gu, '');
  let out = '';
  let gap = false;
  for (const ch of plain) {
    let keep = null;
    if (ch >= 'A' && ch <= 'Z') keep = ch.toLowerCase();
    else if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9')) keep = ch;
    if (keep === null) {
      gap = out.length > 0;
      continue;
    }
    if (gap) out += '-';
    gap = false;
    out += keep;
  }
  out = out.slice(0, SLUG_MAX).replace(/-+$/, '');
  const slug = out === '' ? 'untitled' : out;
  if (SLUG_CACHE.size < 8192) SLUG_CACHE.set(text, slug);
  return slug;
}

/** `slug` made unique against `taken` (and added to it): the first of slug, slug-2, slug-3 ... not taken. */
export function uniqueSlug(slug, taken) {
  let out = slug;
  for (let n = 2; taken.has(out); n++) out = `${slug}-${n}`;
  taken.add(out);
  return out;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A YYYY-MM-DD date in words, from the string alone: "2026-11-09" is "9 November 2026". */
export function longDate(date) {
  const [y, m, d] = date.split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}
