const crypto = require('crypto');

class JobNormalizer {
  constructor() {
    this.titleNormalizations = {
      'sde': 'Software Development Engineer',
      'sde-1': 'Software Development Engineer 1',
      'sde-2': 'Software Development Engineer 2',
      'sde-3': 'Software Development Engineer 3',
      'swe': 'Software Engineer',
      'swe-1': 'Software Engineer 1',
      'swe-2': 'Software Engineer 2',
      'swe-3': 'Software Engineer 3',
      'mle': 'Machine Learning Engineer',
      'ml': 'Machine Learning',
      'ai': 'Artificial Intelligence',
      'devops': 'DevOps',
      'sre': 'Site Reliability Engineer',
      'pm': 'Product Manager',
      'tl': 'Tech Lead',
      'em': 'Engineering Manager',
      'ds': 'Data Scientist',
      'de': 'Data Engineer',
      'fe': 'Frontend',
      'be': 'Backend',
      'fs': 'Full Stack',
      'fullstack': 'Full Stack',
      'full-stack': 'Full Stack',
      'frontend': 'Frontend',
      'front-end': 'Frontend',
      'backend': 'Backend',
      'back-end': 'Backend',
      'reactjs': 'React',
      'react.js': 'React',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
    };
  }

  normalize(job) {
    const n = { ...job };
    n.title = this._normalizeTitle(n.title || '');
    n.company = this._normalizeCompany(n.company || '');
    n.companySlug = n.companySlug || this._toSlug(n.company);
    n.location = this._normalizeLocation(n.location || '');
    n.remote = this._isRemote(n);
    n.skills = this._normalizeSkills(n.skills || []);
    n.experience = this._normalizeExperience(n);
    n.salaryMin = Number(n.salaryMin) || 0;
    n.salaryMax = Number(n.salaryMax) || 0;
    n.source = this._normalizeSource(n.source || '');
    n.applyUrl = this._normalizeUrl(n.applyUrl || '');
    n.postedAt = n.postedAt ? new Date(n.postedAt) : new Date();
    n.lastSeenAt = new Date();
    n.active = n.active !== false;
    n.tags = this._generateTags(n);
    n.hash = this._generateHash(n);
    n.description = this._normalizeDescription(n.description || '');
    return n;
  }

  _normalizeTitle(title) {
    let t = title.trim();
    const lower = t.toLowerCase();
    for (const [abbr, full] of Object.entries(this.titleNormalizations)) {
      const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
      if (regex.test(lower)) {
        t = t.replace(regex, full);
      }
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  _normalizeCompany(company) {
    return company.trim().replace(/\s+/g, ' ').replace(/\.$/, '').trim();
  }

  _normalizeLocation(location) {
    let loc = location.trim().replace(/\s+/g, ' ');
    const lower = loc.toLowerCase();
    if (lower === 'remote' || lower === 'work from home' || lower === 'wfh' || lower === 'anywhere') {
      return 'Remote';
    }
    if (lower.endsWith(', india')) loc = loc.replace(/,\s*India$/i, '');
    if (lower.startsWith('in ') || lower.startsWith('at ')) loc = loc.substring(3);
    loc = loc.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    const cityAliases = {
      'bengaluru': 'Bangalore',
      'blr': 'Bangalore',
      'bangalore urban': 'Bangalore',
      'bombay': 'Mumbai',
      'new delhi': 'Delhi',
      'delhi ncr': 'Delhi NCR',
      'ncr': 'Delhi NCR',
      'gurgaon': 'Gurugram',
      'gurugram': 'Gurugram',
      'noida': 'Noida',
      'hyderabad': 'Hyderabad',
      'hyd': 'Hyderabad',
      'secunderabad': 'Hyderabad',
      'chennai': 'Chennai',
      'madras': 'Chennai',
      'kolkata': 'Kolkata',
      'pune': 'Pune',
      'ahmedabad': 'Ahmedabad',
      'jaipur': 'Jaipur'
    };
    const locLower = loc.toLowerCase().trim();
    for (const [alias, canonical] of Object.entries(cityAliases)) {
      if (locLower === alias || locLower.startsWith(alias + ',')) {
        loc = loc.replace(new RegExp(alias, 'i'), canonical);
        break;
      }
    }
    return loc || 'Remote';
  }

  _isRemote(job) {
    const loc = (job.location || '').toLowerCase();
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    if (loc === 'remote' || loc.includes('remote') || loc === 'anywhere') return true;
    if (title.includes('remote') || desc.includes('remote')) return true;
    return false;
  }

  _normalizeSkills(skills) {
    const normalized = [];
    for (const s of skills) {
      const cleaned = s.trim().toLowerCase();
      if (!cleaned || cleaned.length < 2) continue;
      const skillAliases = {
        'reactjs': 'React', 'react.js': 'React', 'react native': 'React Native',
        'nodejs': 'Node.js', 'node.js': 'Node.js', 'node': 'Node.js',
        'typescript': 'TypeScript', 'ts': 'TypeScript',
        'javascript': 'JavaScript', 'js': 'JavaScript',
        'python': 'Python', 'py': 'Python',
        'postgresql': 'PostgreSQL', 'postgres': 'PostgreSQL',
        'mongodb': 'MongoDB', 'mongo': 'MongoDB',
        'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes',
        'gcp': 'Google Cloud', 'aws': 'AWS', 'azure': 'Azure',
        'golang': 'Go', 'golang ': 'Go',
      };
      normalized.push(skillAliases[cleaned] || cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
    }
    return [...new Set(normalized)].slice(0, 20);
  }

  _normalizeExperience(job) {
    if (job.experience) return job.experience;
    const title = (job.title || '').toLowerCase();
    if (title.includes('senior') || title.includes('lead') || title.includes('principal') || title.includes('architect') || title.includes('staff') || title.includes('head of')) return 'Senior';
    if (title.includes('fresher') || title.includes('entry') || title.includes('junior') || title.includes('trainee') || title.includes('intern') || title.includes('graduate')) return 'Fresher';
    if (title.includes('mid') || title.includes('ii') || title.includes('2')) return 'Mid-level';
    return 'Mid-level';
  }

  _normalizeSource(source) {
    const sourceMap = {
      'ycombinator': 'YCombinator',
      'y combinator': 'YCombinator',
      'yc': 'YCombinator',
      'lever': 'Lever',
      'greenhouse': 'Greenhouse',
      'ashby': 'Ashby',
      'workable': 'Workable',
      'teamtailor': 'Teamtailor',
    };
    return sourceMap[source.toLowerCase().trim()] || source;
  }

  _normalizeUrl(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      const cleanParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'source'];
      for (const param of cleanParams) parsed.searchParams.delete(param);
      return parsed.toString().replace(/\/+$/, '');
    } catch {
      return url.startsWith('http') ? url : '';
    }
  }

  _normalizeDescription(desc) {
    return desc.replace(/\s+/g, ' ').trim();
  }

  _generateHash(job) {
    const raw = [
      job.title.toLowerCase().trim(),
      job.company.toLowerCase().trim(),
      job.location.toLowerCase().trim()
    ].join('|||');
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  _generateTags(job) {
    const tags = new Set();
    const title = (job.title || '').toLowerCase();
    const desc = (job.description || '').toLowerCase();
    const skills = (job.skills || []).map(s => s.toLowerCase());

    const roleTags = ['frontend', 'backend', 'fullstack', 'devops', 'data', 'ml', 'ai', 'mobile', 'design', 'product', 'qa', 'security'];
    for (const tag of roleTags) {
      if (title.includes(tag) || skills.includes(tag)) tags.add(tag);
    }

    for (const skill of skills) {
      if (['react', 'angular', 'vue', 'node.js', 'python', 'java', 'golang', 'rust', 'typescript'].includes(skill)) {
        tags.add(skill);
      }
    }

    if (job.remote) tags.add('remote');
    if (title.includes('intern')) tags.add('internship');
    if (job.experience === 'Fresher') tags.add('entry-level');

    return Array.from(tags);
  }

  _toSlug(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
}

module.exports = new JobNormalizer();
