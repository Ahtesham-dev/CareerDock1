const natural = require('natural');

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

function tokenize(text) {
  return tokenizer.tokenize((text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ')) || [];
}

function buildTfIdfVector(docs) {
  const tfidf = new TfIdf();
  docs.forEach((doc, i) => {
    if (doc) tfidf.addDocument(tokenize(doc).join(' '));
  });
  return tfidf;
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (const key of new Set([...Object.keys(vecA), ...Object.keys(vecB)])) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getTfIdfVector(text, tfidf, docIndex) {
  const vec = {};
  const terms = tokenize(text);
  tfidf.listTerms(docIndex).forEach(item => {
    vec[item.term] = item.tfidf;
  });
  if (terms.length > 0 && Object.keys(vec).length === 0) {
    terms.forEach(t => { vec[t] = 1 / terms.length; });
  }
  return vec;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function levenshteinSimilarity(a, b) {
  if (!a || !b) return 0;
  const dist = natural.LevenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

function ngrams(text, n = 2) {
  const s = text.toLowerCase().replace(/\s+/g, '');
  const result = new Set();
  for (let i = 0; i <= s.length - n; i++) {
    result.add(s.substring(i, i + n));
  }
  return result;
}

function ngramSimilarity(a, b) {
  const ga = ngrams(a || '', 3);
  const gb = ngrams(b || '', 3);
  return jaccardSimilarity(ga, gb);
}

function normalizeTitle(title) {
  if (!title) return '';
  let t = title.toLowerCase().trim();
  t = t.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
  const seniority = /\b(senior|sr\.?|lead|principal|staff|junior|jr\.?|fresher|trainee|intern)\b/gi;
  t = t.replace(seniority, '').trim();
  t = t.replace(/[\d\+\-]+ years?/gi, '');
  t = t.replace(/\b(ii|iii|iv)\b/gi, '');
  t = t.replace(/engineer|developer|programmer/gi, 'dev');
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function normalizeCompany(company) {
  if (!company) return '';
  let c = company.toLowerCase().trim();
  c = c.replace(/\b(pvt|ltd|limited|inc|llc|corp|corporation|technologies|tech|solutions|services|systems|private|company|co)\b/gi, '');
  c = c.replace(/[.,#!$%^&*;:{}=\-_`~()]/g, '');
  c = c.replace(/\s+/g, ' ').trim();
  return c;
}

function salaryOverlap(minA, maxA, minB, maxB) {
  const aMin = minA || 0, aMax = maxA || Infinity;
  const bMin = minB || 0, bMax = maxB || Infinity;
  const overlapStart = Math.max(aMin, bMin);
  const overlapEnd = Math.min(aMax, bMax);
  if (overlapEnd <= overlapStart) return 0;
  const rangeA = (aMax === Infinity ? overlapEnd + 1 : aMax) - aMin;
  const rangeB = (bMax === Infinity ? overlapEnd + 1 : bMax) - bMin;
  if (rangeA <= 0 || rangeB <= 0) return 0;
  const overlap = overlapEnd - overlapStart;
  return (overlap / rangeA + overlap / rangeB) / 2;
}

async function getEmbedding(text) {
  try {
    const { pipeline } = await import('@xenova/transformers');
    if (!getEmbedding.pipe) {
      getEmbedding.pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    const result = await getEmbedding.pipe(text, { pooling: 'mean', normalize: true });
    return Array.from(result.data);
  } catch {
    return null;
  }
}
getEmbedding.pipe = null;

function cosineSimilarityVectors(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

const ROLE_CATEGORIES = {
  frontend: ['frontend', 'front-end', 'front end', 'react', 'vue', 'angular', 'ui', 'web developer', 'html', 'css'],
  backend: ['backend', 'back-end', 'back end', 'node', 'python', 'java', 'go', 'golang', 'rust', 'api', 'server', 'spring boot', 'django', 'flask'],
  fullstack: ['fullstack', 'full-stack', 'full stack', 'mern', 'mean', 'pern'],
  mobile: ['mobile', 'android', 'ios', 'react native', 'flutter', 'swift', 'kotlin'],
  data: ['data', 'data science', 'data engineer', 'machine learning', 'ml', 'ai', 'analyst', 'big data', 'python'],
  devops: ['devops', 'sre', 'platform', 'infrastructure', 'cloud', 'aws', 'docker', 'kubernetes', 'ci/cd'],
  qa: ['qa', 'test', 'quality', 'automation', 'testing', 'sdet'],
  design: ['designer', 'ux', 'ui', 'product design', 'figma', 'graphic'],
  product: ['product manager', 'pm', 'product management', 'program manager'],
  management: ['manager', 'director', 'vp', 'head of', 'lead', 'chief'],
  intern: ['intern', 'internship', 'fresher', 'trainee'],
};

function classifyRole(title) {
  const t = (title || '').toLowerCase();
  for (const [role, keywords] of Object.entries(ROLE_CATEGORIES)) {
    if (keywords.some(k => t.includes(k))) return role;
  }
  return 'general';
}

module.exports = {
  tokenize, buildTfIdfVector, cosineSimilarity, getTfIdfVector,
  jaccardSimilarity, levenshteinSimilarity, ngramSimilarity,
  normalizeTitle, normalizeCompany, salaryOverlap,
  getEmbedding, cosineSimilarityVectors,
  classifyRole, tokenizer, TfIdf,
};
