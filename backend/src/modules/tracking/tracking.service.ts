import { TrackingRepository, trackingRepository } from './tracking.repository.js';
import { TrackingLookupResult } from './tracking.types.js';
import { NotFoundError } from '../../common/errors/not-found-error.js';

export class TrackingService {
  constructor(private readonly repo: TrackingRepository = trackingRepository) {}

  async track(trackingNumber: string): Promise<TrackingLookupResult> {
    const data = await this.repo.findByTrackingNumber(trackingNumber);
    
    if (!data) {
      throw new NotFoundError(`Tracking information for "${trackingNumber}"`);
    }

    const { shipment, events } = data;

    const timeline = events.length > 0
      ? events.map((e) => ({
          id: e.id,
          stage: e.stage,
          status: e.status,
          date: e.eventDate,
          time: e.eventTime,
          location: e.location,
          notes: e.notes,
        }))
      : (shipment.trackingCheckpoints as any[]) || [
          { id: 'ev-1', stage: 'Cargo Received CFS Miami', status: 'Completed', date: shipment.createdDate || '2026-08-28', location: shipment.origin || 'Miami CFS' },
          { id: 'ev-2', stage: 'Vessel Departed Origin', status: 'Active', date: shipment.etd || '2026-09-02', location: shipment.vesselName || 'M/V Tropic Sun' }
        ];

    return {
      trackingNumber: shipment.trackingNumber,
      type: shipment.type,
      status: shipment.status,
      origin: shipment.origin,
      destination: shipment.destination,
      destinationPort: shipment.destinationPort,
      vesselName: shipment.vesselName,
      voyageNumber: shipment.voyageNumber,
      containerNumber: shipment.containerNumber,
      etd: shipment.etd,
      eta: shipment.eta,
      currentLocation: shipment.currentLocation || 'In Transit',
      events: timeline,
    };
  }
}

export const trackingService = new TrackingService();
