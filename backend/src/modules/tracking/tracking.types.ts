export interface TrackingTimelineEvent {
  id: string;
  stage: string;
  status: string;
  date: string;
  time?: string | null;
  location: string;
  notes?: string | null;
}

export interface TrackingLookupResult {
  trackingNumber: string;
  type: string;
  status: string;
  origin: string;
  destination: string;
  destinationPort: string;
  vesselName?: string | null;
  containerNumber?: string | null;
  etd?: string | null;
  eta?: string | null;
  currentLocation?: string | null;
  events: TrackingTimelineEvent[];
}
