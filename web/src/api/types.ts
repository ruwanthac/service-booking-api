export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Service {
  id: string;
  title: string;
  description: string;
  duration: number;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  notes: string | null;
  serviceId: string;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  serviceId: string;
  notes?: string;
}

export interface CreateServiceInput {
  title: string;
  description: string;
  duration: number;
  price: number;
  isActive?: boolean;
}
