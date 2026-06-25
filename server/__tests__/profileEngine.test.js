const { getProfile, updateProfile, getPersonalizedJobs } = require('../controllers/profileController');

describe('Profile Engine', () => {
  test('profile controller exports exist', () => {
    expect(getProfile).toBeDefined();
    expect(updateProfile).toBeDefined();
    expect(getPersonalizedJobs).toBeDefined();
  });
});
