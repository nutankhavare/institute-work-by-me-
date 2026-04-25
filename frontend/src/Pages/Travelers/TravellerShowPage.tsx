// src/components/travelers/TravelerShowPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Icons
import {
  FaBluetoothB,
  FaMapMarkerAlt,
  FaBus,
  FaCheckCircle,
  FaUser,
  FaHistory,
  FaEdit
} from "react-icons/fa";
import { MdEventSeat, MdOutlineFamilyRestroom } from "react-icons/md";

// Components
import { Loader } from "../../Components/UI/Loader";
import EmptyState from "../../Components/UI/EmptyState";
import PageHeaderBack from "../../Components/UI/PageHeaderBack";
import { DataBlock } from "../../Components/UI/DetailItem"; // Reusing the InfoCard pattern
import tenantApi, { centralAsset, centralUrl } from "../../Services/ApiService";

// Types
import type { AppUser, Traveller } from "./Traveler.types";
import type { Booking } from "../Bookings/Booking.types";
import { FaUserTag } from "react-icons/fa6";
import { DUMMY_USER_IMAGE, formatDate } from "../../Utils/Toolkit";
import axios from "axios";



const getStatusStyles = (status: string) => {
  switch (status) {
    case "Active": return "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100";
    case "Approved": return "bg-green-50 text-green-700 border-green-200 ring-green-100";
    case "Completed": return "bg-purple-50 text-purple-700 border-purple-200 ring-purple-100";
    case "Cancelled": return "bg-red-50 text-red-700 border-red-200 ring-red-100";
    default: return "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100";
  }
};

// --- Sub-Components ---
const BookingCard = ({ booking }: { booking: Booking }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-md transition-shadow group flex flex-col h-full">
    <div className="flex justify-between items-start mb-3">
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${getStatusStyles(booking.status)}`}>
        {booking.status}
      </span>
      <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">ID: {booking.id}</span>
    </div>

    <div className="mb-4 flex-grow space-y-2">
      <div className="flex items-start gap-2">
        <FaMapMarkerAlt className="text-red-500 shrink-0 mt-0.5" size={12} />
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase">Pickup Location</p>
          <p className="text-xs font-bold text-slate-800 uppercase line-clamp-2 leading-snug">
            {booking.pickup_location_name}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {booking.pickup_location_city}, {booking.pickup_location_state}
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase block">Date</span>
        <span className="font-semibold text-slate-700">{formatDate(booking.created_at)}</span>
      </div>
      <div className="overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 uppercase block">Vehicle</span>
        <span className="font-semibold text-slate-700 flex items-center gap-1 truncate" title={booking.assigned_vehicle || "-"}>
          <FaBus className="text-indigo-400 shrink-0" size={10} /> {booking.assigned_vehicle || "-"}
        </span>
      </div>
    </div>

    {booking.approver && (
      <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-100 mt-auto">
        <FaCheckCircle className="shrink-0" size={10} />
        <span className="truncate uppercase">Approved by <span className="font-bold">{booking.approver.name}</span></span>
      </div>
    )}
  </div>
);

const TravellerShowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [traveller, setTraveler] = useState<Traveller | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'bookings'>('details');

  useEffect(() => {
    const fetchTraveler = async () => {
      try {
        setLoading(true);
        const response = await tenantApi.get<{ success: boolean; data: Traveller }>(`/travellers/${id}`);
        if (response.data.success) {
          setTraveler(response.data.data);
        }
        const traveller_uid = response.data.data.traveller_uid;

        if (traveller_uid) {
          const userRes = await axios.get<{ success: boolean; data: AppUser }>(`${centralUrl}/traveller/app/user/details/${traveller_uid}`);
          if (userRes.data.success) {
            setAppUser(userRes.data.data);
          }
        }

      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTraveler();
  }, [id]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader /></div>;

  if (error || !traveller) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white gap-4 p-4 text-center">
        <EmptyState title="Profile Not Found" description={error || "Traveller data unavailable"} />
        <button onClick={() => navigate("/travellers")} className="text-indigo-600 font-bold hover:underline uppercase text-xs">Go Back</button>
      </div>
    );
  }

  const activeBookings = traveller.bookings?.filter(b => ["Active", "Approved",].includes(b.status)) || [];
  const pastBookings = traveller.bookings?.filter(b => ["Completed", "Cancelled", "Pending"].includes(b.status)) || [];

  return (
    <div className="min-h-screen bg-white pb-12 overflow-x-hidden">

      {/* 1. Sticky Header */}
      <div className="sticky top-0 z-50 bg-white shadow-sm">
        <PageHeaderBack title="Back" buttonLink="/travellers" />
      </div>


      {/* 2. Hero Section */}
      <div className="bg-white ">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="relative w-24 h-24 rounded-full p-1 bg-white border border-slate-200 shadow-xl overflow-hidden flex items-center justify-center">
                <img
                  src={`${centralAsset}${traveller.profile_photo}`}
                  alt={traveller.first_name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = DUMMY_USER_IMAGE; }}
                />
              </div>
            </div>

            {/* Info Block */}
            <div className="flex-1 text-center md:text-left pt-2 min-w-0">
              <h1 className="text-lg font-extrabold text-slate-800 uppercase tracking-tight truncate">
                {traveller.first_name} <span className="text-indigo-600">{traveller.last_name}</span>
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase border border-blue-100">
                  <FaBluetoothB size={10} /> Beacon Uid : {traveller.beacon_id || "None"}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold uppercase border border-slate-200">
                  <MdEventSeat size={12} /> Total Bookings : {traveller.bookings?.length || 0}
                </span>
              </div>
            </div>
            {/* Action Button (Optional Edit) */}
            <button
              onClick={() => navigate(`/travellers/edit/${id}`)}
              className=" text-blue-700 text-xs font-bold uppercase rounded-lg p-1 hover:bg-blue-100 transition-colors"
            >
              <FaEdit size={20} />
            </button>
          </div>


        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl bg-blue-50 mx-auto px-6 flex gap-10 p-3 border border-gray-200 rounded-md overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('details')}
            className={` text-sm font-bold uppercase tracking-wide border-b-[3px] transition-all whitespace-nowrap ${activeTab === 'details' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={` text-sm font-bold uppercase tracking-wide border-b-[3px] transition-all whitespace-nowrap ${activeTab === 'bookings' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Bookings
          </button>
        </div>
      </div>

      {/* 3. Content Area */}
      <div className="flex-1 overflow-y-auto max-h-[66vh]">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'details' && (
            <div className="animate-fadeIn mt-8">
              {/* Single Unified Card */}
              <div className="transition-all duration-300 overflow-hidden">

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 m-2">

                  {/* Personal Details Section */}
                  <div className="space-y-5 border border-gray-300 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
                      <FaUser className="text-blue-500 text-lg" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Personal Details</h3>
                    </div>

                    <div className="grid grid-cols-2">
                      <DataBlock label="First Name" value={traveller.first_name} />
                      <DataBlock label="Last Name" value={traveller.last_name} />
                      <DataBlock label="Relationship" value={traveller.relationship} />
                      <DataBlock label="Gender" value={traveller.gender} />
                      <DataBlock label="Dob" value={formatDate(traveller.date_of_birth)} />
                      <DataBlock label="Blood Group" value={traveller.blood_group} />
                    </div>

                  </div>

                  {/* System Identifiers Section */}
                  <div className="space-y-5 border border-gray-300 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50">
                      <FaUserTag className="text-amber-500 text-lg" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Other Details</h3>
                    </div>

                    <div className="grid grid-cols-1">
                      <DataBlock label="Traveller Uid" value={traveller.traveller_uid} />
                      <DataBlock label="Beacon id" value={traveller.beacon_id} />
                      <DataBlock label="aadhaar number" value={traveller.aadhaar_number} />
                    </div>
                  </div>

                  {/* Parent Account Section */}
                  <div className="space-y-5 border border-gray-300 rounded-lg shadow-md">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-50">
                      <MdOutlineFamilyRestroom className="text-purple-500 text-lg" />
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Primary User</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2">
                        <DataBlock label="First Name" value={appUser?.first_name} />
                        <DataBlock label="Last Name" value={appUser?.last_name} />
                        <DataBlock label="Email" value={appUser?.email} />
                        <DataBlock label="Mobile Number" value={appUser?.mobile_number} />
                        <DataBlock label="Alternate Number" value={formatDate(appUser?.alternate_mobile_number)} />
                        <div className="col-span-2">
                          <DataBlock label="Address" value={`${appUser?.address_line_1}, ${appUser?.address_line_2}, ${appUser?.landmark}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="space-y-8 animate-fadeIn mt-10 pb-5">

              {/* Active Bookings Section */}
              <div className="">
                {activeBookings.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><MdEventSeat size={16} /></div>
                      <h3 className="text-sm font-bold uppercase">Active / Approved Bookings</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                      {activeBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                    </div>
                  </div>
                )}
              </div>

              <div className="">
                {pastBookings.length > 0 && (
                  <div>   <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 text-red-500 rounded-md"><FaHistory size={16} /></div>
                    <h3 className="text-sm font-bold uppercase">Booking History</h3>
                  </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">

                      {pastBookings.map(booking => <BookingCard key={booking.id} booking={booking} />)}
                    </div>
                  </div>
                )}

                {traveller.bookings?.length == 0 && (
                  <div>
                    <EmptyState title="No Bookings Found..." description="" />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default TravellerShowPage;