// src/components/bookings/BookingShowPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";

// Icons
import {
  FaUser,
  FaBus,
  FaBluetoothB,
  FaRoad,
  FaCheckCircle
} from "react-icons/fa";
import { MdLocationOn, MdWarning, MdInfoOutline } from "react-icons/md";
import { IoSettings } from "react-icons/io5";

// Components
import PageHeaderBack from "../../Components/UI/PageHeaderBack";
import { Loader } from "../../Components/UI/Loader";
import EmptyState from "../../Components/UI/EmptyState";
import SelectInputField from "../../Components/Form/SelectInputField";

// Services & Utils
import tenantApi, { centralAsset } from "../../Services/ApiService";
import { useAlert } from "../../Context/AlertContext";
import { formatDate, formatDateTime } from "../../Utils/Toolkit";

// Types
import type { Booking } from "./Booking.types";
import type { Vehicle } from "../Vehicles/Vehicle.types";
import type { BeaconDevice } from "../../Types/Index";
import DetailItem, { InfoCard } from "../../Components/UI/DetailItem";
import SaveButton from "../../Components/Form/SaveButton";
import InputField from "../../Components/Form/InputField";

// --- Helpers ---
const getStatusStyles = (status: string) => {
  switch (status.toLowerCase()) {
    case "Approved": return "bg-green-50 text-green-700 border-green-200 ring-green-100";
    case "Completed": return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-100";
    case "Cancelled": return "bg-red-50 text-red-700 border-red-200 ring-red-100";
    case "Rejected": return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100";
    default: return "bg-yellow-50 text-yellow-700 border-yellow-200 ring-yellow-100";
  }
};

// --- Form Types ---
type UpdateFormInputs = {
  pickup_time: string;
  drop_time: string;
  assigned_vehicle: string;
  status: string;
  beacon_id: string;
};

const BookingShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const { showAlert } = useAlert();

  // State
  const [booking, setBooking] = useState<Booking | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [beacons, setBeacons] = useState<BeaconDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'operations'>('overview');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UpdateFormInputs>();

  // Fetch Data
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        // Parallel Fetching
        const [bookingRes, beaconsRes] = await Promise.all([
          tenantApi.get<{ success: boolean; data: { booking: Booking; vehicles: Vehicle[] } }>(`/bookings/${id}`),
          tenantApi.get(`/beacon-device/for/dropdown`)
        ]);

        if (bookingRes.data.success) {
          const bData = bookingRes.data.data.booking;
          setBooking(bData);
          setVehicles(bookingRes.data.data.vehicles);

          // Init Form
          reset({
            pickup_time: bData.pickup_time || "",
            drop_time: bData.drop_time || "",
            assigned_vehicle: bData.assigned_vehicle || "",
            status: bData.status || "Pending",
            beacon_id: bData.traveller?.beacon_id || "",
          });
        }

        if (beaconsRes.data) setBeacons(beaconsRes.data);

      } catch (err: any) {
        console.error(err);
        showAlert("Failed to load booking details.", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) initData();
  }, [id, reset, showAlert]);

  // Handle Update
  const onSubmit = async (data: UpdateFormInputs) => {
    try {
      const response = await tenantApi.put(`/bookings/${id}`, data);
      if (response.data.success) {
        showAlert("Booking updated successfully!", "success");
        // Update local state without full reload
        setBooking(prev => prev ? ({ ...prev, ...data, status: data.status }) : null);
        setActiveTab('overview'); // Switch back to view mode
      }
    } catch (err) {
      showAlert("Failed to update booking.", "error");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader /></div>;
  if (!booking) return <div className="h-screen flex items-center justify-center bg-white"><EmptyState title="Booking Not Found" /></div>;

  const hasBeacon = booking.traveller?.beacon_id;
  const availableBeacons = beacons.filter(b => b.status === "available" || b.device_id === booking.traveller?.beacon_id);

  const statusOptions = [
    { value: 'Approved', label: 'Approve' },
    { value: 'Rejected', label: 'Reject' }
  ];
  const currentStatus = booking.status;

  const getAvailableStatuses = () => {
    if (currentStatus === 'Pending') return statusOptions;
    if (currentStatus === 'Approved') {
      return [{ value: 'Approved', label: 'Approved' }];
    }
    if (currentStatus === 'Rejected') return statusOptions.filter(s => s.value === 'Rejected'); // Read-only
    return statusOptions;
  };

  return (
    <div className="min-h-screen bg-white pb-12">
      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <PageHeaderBack title="Back" buttonLink="/bookings" />
      </div>


      {/* 2. Hero Section */}
      <div className="bg-white ">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden">
                {booking.traveller_profile_photo ? (
                  <img src={`${centralAsset}${booking.traveller_profile_photo}`} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300"><FaUser size={32} /></div>
                )}
              </div>
              <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white shadow-sm ${booking.status === 'Approved' ? 'bg-green-500' : 'bg-slate-400'}`}>
                {booking.status === 'Approved' && <FaCheckCircle className="" />}
              </div>
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-sm font-extrabold text-slate-800 uppercase">
                Booking <span className="text-indigo-600">#{booking.id}</span>
              </h1>
              <p className="text-sm font-bold text-slate-500 uppercase mt-1">
                {booking.traveller_first_name} {booking.traveller_last_name}
                <span className="mx-2 text-slate-300">|</span>
                <span className="font-mono text-slate-400">EMP: {booking.employee_id || "-"}</span>
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase border ${getStatusStyles(booking.status)}`}>
                  {booking.status}
                </span>
                {hasBeacon ? (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-bold uppercase border border-blue-100">
                    <FaBluetoothB />Beacon - {booking.traveller?.beacon_id}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-bold uppercase border border-red-100">
                    <MdWarning />Beacon Not Assigned
                  </span>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl bg-blue-50 mx-auto p-3 flex gap-8 rounded-lg border border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={` text-sm font-bold uppercase tracking-wide border-b-[3px] transition-all ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Booking Overview
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={` text-sm font-bold uppercase tracking-wide border-b-[3px] transition-all ${activeTab === 'operations' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Booking Request
          </button>
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="max-w-6xl mx-auto mt-10  overflow-y-auto max-h-[60vh]">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  gap-6 mb-5">

            {/* Card 1: Trip Info */}
            <InfoCard title="Booking Details" icon={<FaRoad />}>
              <div className="flex items-start gap-3 mb-4">
                <div className="mt-1 p-2 bg-red-50 text-red-500 rounded-full shrink-0">
                  <MdLocationOn size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-400 uppercase">Pickup Location</p>
                  <p className="text-sm font-bold text-slate-800 uppercase leading-snug">{booking.pickup_location_name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {booking.pickup_location_city}, {booking.pickup_location_state} - {booking.pickup_location_pin_code}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <DetailItem label="Pickup Time" value={booking.pickup_time} />
                <DetailItem label="Drop Time" value={booking.drop_time} />
                <DetailItem label="Purpose" value={booking.purpose} />
                <DetailItem label="Booked On" value={formatDate(booking.created_at)} />
              </div>
            </InfoCard>

            {/* Card 2: Transport & Traveller */}
            <InfoCard title="Transport & Identity" icon={<FaBus />}>
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase">Assigned Vehicle</p>
                    <p className="text-sm font-bold text-indigo-900 uppercase flex items-center gap-2">
                      <FaBus /> {booking.assigned_vehicle || "Pending"}
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-indigo-300">
                    <FaBus />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Traveller Age" value={`${booking.traveller_age} Yrs`} />
                  <DetailItem label="Traveller UID" value={booking.traveller?.beacon_id} />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-sm font-bold text-slate-400 uppercase mb-1">Traveller Address</p>
                  <p className="text-sm text-slate-600 leading-relaxed uppercase">
                    {booking.address_line_1}, {booking.city}
                  </p>
                </div>
              </div>
            </InfoCard>

            {/* Card 3: Approval Log */}
            <InfoCard title="System Metadata" icon={<MdInfoOutline />}>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="p-1.5 bg-white text-green-600 rounded-full shadow-sm">
                    <FaCheckCircle size={12} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-green-700 uppercase">Approved By</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{booking.approver?.name || "-"}</p>
                    <p className="text-[10px] text-slate-500 truncate">{booking.approver?.email}</p>
                  </div>
                </div>

                <div className="pt-2 space-y-6">
                  <DetailItem label="Last Updated" value={formatDateTime(booking.updated_at ?? "")} />
                  <DetailItem label="Created At" value={formatDateTime(booking.created_at ?? "")} />
                </div>
              </div>
            </InfoCard>

          </div>
        )}

        {/* TAB 2: OPERATIONS (Edit Form) */}
        {activeTab === 'operations' && (
          <div className="max-w-lg mx-auto mb-5">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
                <div className="p-2 bg-white text-indigo-600 rounded-lg shadow-sm"><IoSettings size={20} /></div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase">Manage Booking Request</h3>
                </div>
              </div>

              <form className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField type="time" label="pickup time" name="pickup_time" register={register} errors={errors} />
                  <InputField type="time" label="drop time" name="drop_time" register={register} errors={errors} />

                  <SelectInputField
                    label="Assign Vehicle"
                    name="assigned_vehicle"
                    register={register}
                    errors={errors}
                    options={vehicles.map(s => ({ label: s.vehicle_number, value: s.vehicle_number }))}
                  />

                  <SelectInputField
                    label="Assign Beacon"
                    name="beacon_id"
                    register={register}
                    errors={errors}
                    options={availableBeacons.map(s => ({ label: s.imei_number, value: s.imei_number }))}
                  />

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-purple-950 uppercase mb-2">Status</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {getAvailableStatuses().map(status => (
                        <label key={status.value} className="cursor-pointer">
                          <input type="radio" value={status.value} {...register("status")} className="peer sr-only" />
                          <div className="px-3 py-2 rounded-lg border border-slate-200 text-center text-sm font-bold uppercase text-slate-500 peer-checked:bg-indigo-500 peer-checked:text-white hover:peer-checked:text-black peer-checked:border-indigo-300 transition-all hover:bg-slate-50">
                            {status.label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {booking.status != "Approved" && booking.status != "Rejected" ? (
                  <div className="pt-6 border-t border-slate-200 flex  gap-3">
                    <SaveButton label="submit" isSaving={isSubmitting} onClick={handleSubmit(onSubmit)} />
                  </div>
                ) : ("")}

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookingShowPage;