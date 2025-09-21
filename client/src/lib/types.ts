export interface DashboardStats {
  totalSpots: number;
  availableSpots: number;
  occupiedSpots: number;
  reservedSpots: number;
  activeReservations: number;
  todayReservations: number;
  occupancyRate: number;
}

export interface WebSocketMessage {
  type: 'spot_updated' | 'reservation_created' | 'reservation_updated' | 'reservation_deleted';
  data: any;
}

export interface QuickReserveData {
  spotId: string;
  duration: number; // in minutes
  email?: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
