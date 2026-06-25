const pipelineValidator = require('../../../pipeline/processors/validator');

class ValidationService {
  validate(job) {
    return pipelineValidator.validate(job);
  }

  filterValid(jobs) {
    const valid = [];
    const rejected = [];
    for (const job of jobs) {
      const result = this.validate(job);
      if (result.valid) valid.push(job);
      else rejected.push({ job, reasons: result.errors });
    }
    return { valid, rejected };
  }
}

module.exports = new ValidationService();
