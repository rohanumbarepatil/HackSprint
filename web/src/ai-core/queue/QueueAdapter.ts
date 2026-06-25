import { QueueJob } from '../types';

export interface BackgroundQueue {
  enqueue(job: QueueJob): Promise<string>;
  dequeue(queueName: string): Promise<QueueJob | null>;
  cancel(jobId: string): Promise<boolean>;
  pause(queueName: string): Promise<void>;
  resume(queueName: string): Promise<void>;
}

export class QueueAdapter implements BackgroundQueue {
  private queue: QueueJob[] = [];

  async enqueue(job: QueueJob): Promise<string> {
    // In production, this would interface with Google Cloud Tasks or Pub/Sub.
    this.queue.push(job);
    return job.id;
  }

  async dequeue(queueName: string): Promise<QueueJob | null> {
    const job = this.queue.shift();
    return job || null;
  }

  async cancel(jobId: string): Promise<boolean> {
    const index = this.queue.findIndex(j => j.id === jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      return true;
    }
    return false;
  }

  async pause(queueName: string): Promise<void> {
    console.log(`Queue ${queueName} paused.`);
  }

  async resume(queueName: string): Promise<void> {
    console.log(`Queue ${queueName} resumed.`);
  }
}
