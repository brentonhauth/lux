import { isDef, isNumber } from '@lux/helpers/is';
import { Action } from './types';
import { error } from './logging';

let _jobId = 0;
let schedulerRunning = false;

interface Job extends Action {
  id: number;
}

export const enum Priority {
  HIGH = 1,
  MEDIUM = 2,
  LOW = 3,
};

const queues: Record<Priority, Array<Job>> = {
  [Priority.HIGH]: [],
  [Priority.MEDIUM]: [],
  [Priority.LOW]: [],
};

const cancelledJobs: Array<number> = [];

const ticker = Promise.resolve();

export const schedule = (priority: Priority, job: Action) => {
  if (!(priority in queues)) {
    return null;
  }
  (job as Job).id = _jobId++;
  queues[priority].push(job as Job);
  if (!schedulerRunning) {
    schedulerRunning = true;
    ticker.then(run);
  }
  return (job as Job).id;
};

export const cancelJob = (id: number) => {
  if (isNumber(id) && id >= 0) {
    cancelledJobs.push(id);
  }
};

const run = () => {
  const job = getNextJob();
  if (isDef(job)) {
    try {
      job();
    } catch (e) {
      error(e);
    } finally {
      ticker.then(run);
    }
  } else {
    schedulerRunning = false;
    cancelledJobs.splice(0, cancelledJobs.length);
  }
};

const getNextJob = (): Job => {
  for (let i = Priority.HIGH; i <= Priority.LOW; ++i) {
    while (queues[i].length) {
      let job = queues[i].shift();
      let j = cancelledJobs.findIndex(id => job.id === id);
      if (j !== -1) {
        cancelledJobs.splice(j, 1);
      } else {
        return job;
      }
    }
  }
  return null;
};
