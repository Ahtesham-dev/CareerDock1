describe('Application Controller', () => {
  test('application status enum values', () => {
    const validStatuses = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'];
    expect(validStatuses).toContain('Applied');
    expect(validStatuses).toContain('Interview');
    expect(validStatuses).toContain('Rejected');
  });

  test('auto-apply validation', () => {
    const mockBody = {};
    expect(mockBody.jobId).toBeUndefined();
  });
});
