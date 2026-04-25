export interface Booking {
  id: number;
  app_user_traveller_id: number;
  traveller_uid: string;
  tenant_id: string;
  purpose?: string;
  employee_id?: string;
  
  // Traveller Info
  traveller_first_name: string;
  traveller_last_name: string;
  traveller_age?: number;
  traveller_profile_photo?: string;
  
  // Organisation
  organisation_name?: string;
  
  // Address
  address_line_1?: string;
  city: string;
  district?: string;
  state?: string;
  pin_code?: string;
  
  // Pickup Location
  pickup_location_name: string;
  pickup_location_city: string;
  pickup_location_district?: string;
  pickup_location_state?: string;
  pickup_location_pin_code?: string;
  pickup_location_latitude?: number;
  pickup_location_longitude?: number;
  
  // Assignment & Schedule
  pickup_time?: string;
  drop_time?: string;
  assigned_vehicle?: string;
  status: string;
  
  // Relationships
  approved_by?: number;
  approver?: {
    id: number;
    name?: string;
    email?: string;
  };
  traveller?: {
    id: number;
    beacon_id?: string;
    first_name: string;
    last_name: string;
  };
  
  created_at?: string;
  updated_at?: string;
}

