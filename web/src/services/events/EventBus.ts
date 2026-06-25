type EventCallback = (payload: unknown) => void;

export enum AppEvents {
  PROJECT_CREATED = 'PROJECT_CREATED',
  RESEARCH_COMPLETED = 'RESEARCH_COMPLETED',
  PRD_GENERATED = 'PRD_GENERATED',
  TRD_GENERATED = 'TRD_GENERATED',
  EXPORT_COMPLETED = 'EXPORT_COMPLETED',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
}

class EventBusService {
  private listeners: Map<string, EventCallback[]> = new Map();

  subscribe(event: AppEvents, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event)?.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event) || [];
      this.listeners.set(event, callbacks.filter(cb => cb !== callback));
    };
  }

  publish(event: AppEvents, payload?: unknown): void {
    const callbacks = this.listeners.get(event);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

export const EventBus = new EventBusService();
