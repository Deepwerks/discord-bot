import cron from 'node-cron';
import { logger } from '../..';

export class JobScheduler {
  private jobs: Map<string, cron.ScheduledTask>;

  constructor() {
    this.jobs = new Map();
  }

  // Method to add a job with a cron expression and a task
  addJob(name: string, cronExpression: string, task: () => void) {
    // Check if a job with the same name already exists
    if (this.jobs.has(name)) {
      logger.info(`Job with name ${name} already exists. Updating it.`);
      this.removeJob(name);
    }

    // Schedule the new job
    const job = cron.schedule(cronExpression, task);
    this.jobs.set(name, job);
    logger.info(`Job "${name}" added with cron expression "${cronExpression}".`);

    return this;
  }

  // Method to remove a job by name
  removeJob(name: string) {
    if (this.jobs.has(name)) {
      const job = this.jobs.get(name);
      job?.stop();
      this.jobs.delete(name);
      logger.info(`Job "${name}" removed.`);
    } else {
      logger.info(`Job with name ${name} does not exist.`);
    }
    return this;
  }

  // Method to start all scheduled jobs
  startJobs() {
    this.jobs.forEach((job, name) => {
      job.start();
      logger.info(`Job "${name}" started.`);
    });
    return this;
  }

  // Method to stop all scheduled jobs
  stopJobs() {
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Job "${name}" stopped.`);
    });
    return this;
  }
}
