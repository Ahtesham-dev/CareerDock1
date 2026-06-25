const axios = require('axios');

const linkedinService = {
  searchJobs: async (query, location = 'India') => {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) return [];
    try {
      const { data } = await axios.get('https://api.linkedin.com/v2/jobSearch', {
        params: { q: query, location, count: 10 },
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      });
      return (data?.elements || []).map(el => ({
        title: el.jobPosting?.title || '',
        company: el.jobPosting?.companyDetails?.company?.name || '',
        location: el.jobPosting?.locationDescription || location,
        externalUrl: el.jobPosting?.applyUrl || ''
      }));
    } catch {
      return [];
    }
  },

  getProfile: async (accessToken) => {
    try {
      const { data } = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      return data;
    } catch {
      return null;
    }
  }
};

module.exports = linkedinService;
