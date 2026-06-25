const {
  tokenize, buildTfIdfVector, getTfIdfVector, cosineSimilarity,
  jaccardSimilarity,
} = require('../services/embeddings');

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'need',
  'we', 'you', 'they', 'he', 'she', 'it', 'this', 'that', 'these', 'those',
  'am', 'our', 'your', 'their', 'his', 'her', 'its', 'all', 'each', 'every',
  'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not',
  'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'also', 'about',
  'above', 'after', 'again', 'between', 'down', 'during', 'into', 'through',
  'before', 'without', 'over', 'out', 'off', 'up', 'under', 'while',
]);

const SKILL_KEYWORDS = [
  'react', 'angular', 'vue', 'node', 'python', 'java', 'go', 'rust',
  'typescript', 'javascript', 'html', 'css', 'sass', 'less', 'graphql',
  'rest', 'api', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform',
  'ansible', 'jenkins', 'ci/cd', 'git', 'github', 'gitlab', 'mongodb',
  'postgresql', 'mysql', 'redis', 'elasticsearch', 'kafka', 'rabbitmq',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow',
  'pytorch', 'scikit-learn', 'pandas', 'numpy', 'sql', 'nosql', 'linux',
  'bash', 'powershell', 'agile', 'scrum', 'jira', 'figma', 'sketch',
  'photoshop', 'illustrator', 'ui/ux', 'product design', 'wireframe',
  'prototype', 'unit testing', 'integration testing', 'e2e', 'jest',
  'mocha', 'cypress', 'selenium', 'webpack', 'vite', 'babel', 'eslint',
  'prettier', 'redux', 'mobx', 'rxjs', 'next.js', 'nuxt.js', 'express',
  'django', 'flask', 'spring boot', 'laravel', 'rails', 'asp.net',
  'hadoop', 'spark', 'airflow', 'snowflake', 'bigquery', 'tableau',
  'power bi', 'excel', 'leadership', 'communication', 'teamwork',
  'problem solving', 'critical thinking', 'project management',
  'data analysis', 'data engineering', 'data science', 'devops', 'sre',
  'blockchain', 'web3', 'solidity', 'react native', 'flutter', 'swift',
  'kotlin', 'android', 'ios', 'mobile', 'responsive', 'accessibility',
  'seo', 'performance', 'optimization', 'microservices', 'serverless',
  'asynchronous', 'concurrency', 'multithreading', 'oauth', 'jwt',
  'websockets', 'grpc', 'restful', 'soap', 'json', 'xml', 'yaml',
  'toml', 'markdown', 'latex', 'software development', 'sdlc',
  'cicd', 'monitoring', 'logging', 'tracing', 'prometheus', 'grafana',
  'datadog', 'new relic', 'sentry', 'rollbar', 'pagerduty',
];

class ATSMatcher {
  constructor() {
    this.skillPattern = new RegExp(
      `\\b(${SKILL_KEYWORDS.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
      'gi'
    );
  }

  extractSkills(text) {
    if (!text) return [];
    const matches = new Set();
    const lower = text.toLowerCase();
    for (const skill of SKILL_KEYWORDS) {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`\\b${escaped}\\b`, 'i');
      if (re.test(lower)) {
        const idx = SKILL_KEYWORDS.indexOf(skill);
        matches.add(SKILL_KEYWORDS[idx]);
      }
    }
    return [...matches];
  }

  async match(resumeText, job) {
    const resumeSkills = this.extractSkills(resumeText);
    const jobSkills = new Set((job.skills || []).map(s => s.toLowerCase().trim()));

    const descriptionSkills = this.extractSkills(job.description || '');
    descriptionSkills.forEach(s => jobSkills.add(s.toLowerCase().trim()));

    const resumeSkillSet = new Set(resumeSkills.map(s => s.toLowerCase().trim()));

    const commonSkills = [...resumeSkillSet].filter(s => jobSkills.has(s));
    const missingSkills = [...jobSkills].filter(s => !resumeSkillSet.has(s));

    const allJobSkills = jobSkills.size;
    const matchRate = allJobSkills > 0 ? (commonSkills.length / allJobSkills) : 0;

    const resumeTokens = tokenize(resumeText);
    const jobTokens = tokenize(`${job.title} ${job.description || ''} ${[...jobSkills].join(' ')}`);

    const resumeFiltered = resumeTokens.filter(t => !STOP_WORDS.has(t));
    const jobFiltered = jobTokens.filter(t => !STOP_WORDS.has(t));

    const docs = [resumeFiltered.join(' '), jobFiltered.join(' ')];
    let textSimilarity = 0;
    try {
      const tfidf = buildTfIdfVector(docs);
      const vec1 = getTfIdfVector(resumeFiltered.join(' '), tfidf, 0);
      const vec2 = getTfIdfVector(jobFiltered.join(' '), tfidf, 1);
      textSimilarity = cosineSimilarity(vec1, vec2);
    } catch {
      const resumeSet = new Set(resumeFiltered);
      const jobSet = new Set(jobFiltered);
      textSimilarity = jaccardSimilarity(resumeSet, jobSet);
    }

    const weights = { skillMatch: 0.50, textSimilarity: 0.30, titleOverlap: 0.10, experienceFit: 0.10 };
    const titleTokens = tokenize(job.title || '');
    const resumeTokensLower = new Set(resumeFiltered.map(t => t.toLowerCase()));
    const titleOverlap = titleTokens.length > 0
      ? titleTokens.filter(t => resumeTokensLower.has(t.toLowerCase())).length / titleTokens.length
      : 0;

    let experienceFit = 0.5;
    if (job.experience) {
      const expText = job.experience.toLowerCase();
      const resumeHasSenior = /\b(senior|sr|lead|staff|principal|architect)\b/i.test(resumeText);
      const resumeHasJunior = /\b(junior|jr|fresher|intern|entry)\b/i.test(resumeText);
      if (expText.includes('senior') && resumeHasSenior) experienceFit = 1.0;
      else if (expText.includes('mid') && !resumeHasSenior && !resumeHasJunior) experienceFit = 0.8;
      else if (expText.includes('fresher') && resumeHasJunior) experienceFit = 1.0;
      else if (expText.includes('senior') && !resumeHasSenior) experienceFit = 0.3;
    }

    const matchScore = Math.round(
      (matchRate * weights.skillMatch + textSimilarity * weights.textSimilarity +
       titleOverlap * weights.titleOverlap + experienceFit * weights.experienceFit) * 100
    );

    const suggestedSkills = missingSkills.slice(0, 10).map(skill => {
      const demand = this.getSkillDemand(skill);
      return { skill, demandScore: demand };
    });

    return {
      matchScore: Math.min(100, Math.max(0, matchScore)),
      matchedSkills: commonSkills,
      missingSkills: suggestedSkills,
      matchRate: Math.round(matchRate * 100),
      textSimilarity: Math.round(textSimilarity * 100),
      titleOverlap: Math.round(titleOverlap * 100),
      experienceFit: Math.round(experienceFit * 100),
      suggestions: this.generateSuggestions(matchScore, commonSkills, missingSkills),
    };
  }

  getSkillDemand(skill) {
    const demandMap = {
      'aws': 95, 'docker': 90, 'kubernetes': 88, 'python': 92, 'react': 90,
      'typescript': 88, 'node': 85, 'go': 80, 'rust': 75, 'machine learning': 85,
      'data science': 80, 'devops': 85, 'terraform': 78, 'graphql': 70,
      'redis': 72, 'kafka': 70, 'mongodb': 78, 'postgresql': 80,
      'react native': 72, 'flutter': 68, 'swift': 65, 'kotlin': 70,
    };
    return demandMap[skill.toLowerCase()] || 50;
  }

  generateSuggestions(matchScore, commonSkills, missingSkills) {
    const suggestions = [];
    if (matchScore < 40) {
      suggestions.push('Your resume needs significant alignment with this role');
    } else if (matchScore < 70) {
      suggestions.push('Build skills in: ' + missingSkills.slice(0, 3).map(s => s.skill).join(', '));
    } else {
      suggestions.push('Strong match! Highlight your ' + commonSkills.slice(0, 3).join(', ') + ' experience in the interview');
    }
    if (missingSkills.length > 5) {
      suggestions.push('Consider focusing on ' + missingSkills.slice(0, 5).map(s => s.skill).join(', ') + ' for this role');
    }
    if (commonSkills.length >= 3) {
      suggestions.push('Your expertise in ' + commonSkills.slice(0, 3).join(', ') + ' is valuable for this position');
    }
    return suggestions;
  }
}

module.exports = new ATSMatcher();
