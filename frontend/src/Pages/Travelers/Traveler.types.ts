import type { Booking } from "../Bookings/Booking.types";

export interface Traveller {
  id: number;
  traveller_uid?: string;
  first_name: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string;
  profile_photo?: string;
  relationship?: string;
  beacon_id?: string;
  aadhaar_number?: string;
  blood_group?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  bookings?: Booking[];
}

export interface TravellerForm {
  id: number;
  traveller_uid: string;

  // Basic Information
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  profile_photo: FileList;

  // Relationship to User
  relationship: string; // Child/Parent/Worker/Relative/Other

  // Device Tracking
  beacon_id: string;

  // ID Verification
  aadhaar_number: string;

  // Emergency Information
  blood_group: string;

  // Special Instructions
  remarks: string;
  status: string;
}

export interface AppUser {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  alternate_mobile_number: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  city: string;
  state: string;
  district: string;
  pin_code: string
}