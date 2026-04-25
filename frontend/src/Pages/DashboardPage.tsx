// src/Pages/DashboardPage.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadScript } from "@react-google-maps/api";
import { useAuth } from "../Context/AuthContext";
import tenantApi from "../Services/ApiService";

// Components
import GoogleMapDisplay from "../Components/Map/GoogleMapDisplay";
import PageHeader from "../Components/UI/PageHeader";
import EmptyState from "../Components/UI/EmptyState";
import { Loader } from "../Components/UI/Loader";

// Icons
import { 
  LayoutDashboard, 
  Gavel, 
  RefreshCw, 
  Battery, 
  Activity, 
  Monitor, 
  Clock, 
  AlertTriangle,
  User as UserIcon,
  Users as UsersIcon,
  MapPin,
  IdCard as IdIcon,
  LogOut,
  Truck,
  Bus
} from "lucide-react";
import type { LiveVehicle } from "../Types/Index";
import { formatTime } from "../Utils/Toolkit";

const STORAGE_KEY = "dashboard_cooldown_timestamp";
const COOLDOWN_DURATION = 300; // 5 Minutes

/* ── STAT CARD COMPONENT ── */
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, delay = 0 }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white rounded-[14px] p-6 border border-[#e8edf5] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(124,58,237,0.08)] transition-all group"
  >
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-[12px] ${colorClass} transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[11px] font-[800] text-[#94a3b8] uppercase tracking-wider mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-[900] text-[#1e293b]">{value}</h4>
          {subtext && <span className="text-[11px] font-[700] text-[#059669]">{subtext}</span>}
        </div>
      </div>
    </div>
  </motion.div>
);

const DashboardPage = () => {
  const { tenantId } = useAuth();

  // State
  // State
  const [vehicles, setVehicles] = useState<LiveVehicle[]>([]);
  const [staffCount, setStaffCount] = useState<number>(0);
  const [driverCount, setDriverCount] = useState<number>(0);
  const [selectedVehicleNumber, setSelectedVehicleNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialFetch, setHasInitialFetch] = useState(false);
  const [address, setAddress] = useState<string>("Select a vehicle to view location");
  const [addressLoading, setAddressLoading] = useState(false);

  // Timer State
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // --- General Stats Fetching ---
  const fetchGeneralStats = useCallback(async () => {
    if (!tenantId) return;
    setStatsLoading(true);
    try {
      const [staffRes, driverRes] = await Promise.all([
        tenantApi.get("/employees", { params: { per_page: 1 } }),
        tenantApi.get("/drivers", { params: { per_page: 1 } })
      ]);

      if (staffRes.data.success) {
        // Based on StaffIndexPage logic: response.data.data.total
        setStaffCount(staffRes.data.data?.total || 0);
      }
      if (driverRes.data.success) {
        // Based on DriverIndexPage logic: response.data.data.total
        setDriverCount(driverRes.data.data?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch general stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, [tenantId]);

  // --- 1. Timer Logic ---
  const startTimerInterval = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const endTime = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));

      setCountdown(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        localStorage.removeItem(STORAGE_KEY);
        setIsButtonDisabled(false);
      }
    }, 1000);
  };

  const initCooldown = () => {
    const endTime = Date.now() + (COOLDOWN_DURATION * 1000);
    localStorage.setItem(STORAGE_KEY, endTime.toString());
    setCountdown(COOLDOWN_DURATION);
    setIsButtonDisabled(true);
    startTimerInterval();
  };

  // --- 2. Address Fetching ---
  const fetchAddress = useCallback(async (lat: number, lng: number) => {
    if (!googleMapsApiKey) return;

    setAddressLoading(true);
    setAddress("Fetching location...");

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleMapsApiKey}`
      );
      const data = await response.json();

      if (data.results && data.results[0]) {
        setAddress(data.results[0].formatted_address);
      } else {
        setAddress("Address not found");
      }
    } catch (error) {
      console.error("Address fetch error:", error);
      setAddress("Location info unavailable");
    } finally {
      setAddressLoading(false);
    }
  }, [googleMapsApiKey]);

  // --- 3. Fetch address when vehicle is selected ---
  useEffect(() => {
    const selectedVehicle = vehicles.find(v => v.vehicle_number === selectedVehicleNumber);

    if (selectedVehicle && selectedVehicle.gps) {
      fetchAddress(selectedVehicle.gps.lat, selectedVehicle.gps.lng);
    } else {
      setAddress("Select a vehicle to view location");
    }
  }, [selectedVehicleNumber, vehicles, fetchAddress]);

  // --- 4. Data Fetching ---
  const fetchLiveVehicles = useCallback(async () => {
    if (!tenantId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await tenantApi.get(`/vehicles/live/location/${tenantId}`);

      if (response.data.success && response.data.data) {
        setVehicles(response.data.data); // This is an array of vehicles
        initCooldown();
      } else {
        setError("Vehicle tracking data not available.");
      }
      
      // Also refresh general stats on live sync
      void fetchGeneralStats();
    } catch (err: any) {
      console.error("Failed to fetch vehicles:", err);
      setError(err.response?.data?.message || "Connection error. Please try again.");
      initCooldown();
    } finally {
      setLoading(false);
      setHasInitialFetch(true);
    }
  }, [tenantId, fetchGeneralStats]);

  // --- 5. Initial Lifecycle ---
  useEffect(() => {
    if (!tenantId) return;

    const initializePage = () => {
      const storedTimestamp = localStorage.getItem(STORAGE_KEY);
      
      // Initial fetch of non-live stats
      void fetchGeneralStats();

      if (storedTimestamp) {
        const endTime = parseInt(storedTimestamp, 10);
        const now = Date.now();
        const remainingSeconds = Math.ceil((endTime - now) / 1000);

        if (remainingSeconds > 0) {
          // Restore Timer
          setCountdown(remainingSeconds);
          setIsButtonDisabled(true);
          startTimerInterval();

          // Silent fetch if no data
          if (vehicles.length === 0 && !hasInitialFetch) {
            setLoading(true);
            tenantApi.get(`/vehicles/live/location/${tenantId}`)
              .then(res => {
                if (res.data.success) {
                  setVehicles(res.data.data);
                }
              })
              .catch(() => setError("Failed to restore data."))
              .finally(() => {
                setLoading(false);
                setHasInitialFetch(true);
              });
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
          fetchLiveVehicles();
        }
      } else {
        fetchLiveVehicles();
      }
    };

    initializePage();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tenantId, fetchLiveVehicles, fetchGeneralStats]);

  // Prevent Refresh Warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isButtonDisabled) {
        e.preventDefault();
        e.returnValue = "Please wait for the timer to finish.";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isButtonDisabled]);

  // --- Helpers ---
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleVehicleSelect = (vehicle_number: string) => {
    setSelectedVehicleNumber((prevId) => (prevId === vehicle_number ? null : vehicle_number));
  };

  const selectedVehicle = vehicles.find((v) => v.vehicle_number === selectedVehicleNumber) || null;
  const drivers = selectedVehicle?.beacons.filter(b => b.type.toLowerCase() === 'driver') || [];
  const passengers = selectedVehicle?.beacons.filter(b => b.type.toLowerCase() === 'traveller') || [];

  if (!googleMapsApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <EmptyState title="Configuration Error" description="Google Maps API Key is missing." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-2">
      <div className="mx-4">
        <PageHeader 
          title="Dashboard" 
          icon={<LayoutDashboard size={18} />}
        />
      </div>

      <div className="px-4 pb-10">
        <div className="space-y-6">

          {/* Stat Grid Section - High Fidelity Card Style */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
              title="Total Vehicles" 
              value={vehicles.length} 
              icon={Truck} 
              colorClass="bg-[#ede9fe] text-[#7c3aed]" 
              delay={0}
            />
            <StatCard 
              title="Total Staff" 
              value={staffCount} 
              icon={UsersIcon} 
              colorClass="bg-[#ecfdf5] text-[#059669]" 
              subtext={statsLoading ? "Syncing..." : "Administrative Staff"}
              delay={0.05}
            />
            <StatCard 
              title="Total Drivers" 
              value={driverCount} 
              icon={UserIcon} 
              colorClass="bg-[#fffbeb] text-[#d97706]" 
              subtext={statsLoading ? "Syncing..." : "Fleet Personnel"}
              delay={0.1}
            />
            <StatCard 
              title="Alerts" 
              value={vehicles.filter(v => (v.battery || 100) < 20).length} 
              icon={AlertTriangle} 
              colorClass="bg-[#fef2f2] text-[#dc2626]" 
              subtext="Low Battery"
              delay={0.15}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-50">
            {/* Refresh Action Bar */}
            <div className="flex justify-end items-center gap-4">
              {statsLoading && (
                <span className="text-[11px] font-bold text-slate-400 uppercase animate-pulse">
                  Updating Registry...
                </span>
              )}
              <button
                onClick={fetchLiveVehicles}
                disabled={isButtonDisabled || loading}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase transition-all shadow-sm border
                  ${isButtonDisabled || loading
                    ? 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-500 hover:text-blue-600 active:scale-95'
                  }`}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                {loading ? "Syncing..." : isButtonDisabled ? `Sync in ${formatCountdown(countdown)}` : "Live Sync"}
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-md flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>

          {/* 2. Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-280px)] min-h-[80vh]">

            {/* Map Area */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-slate-200 relative">

              <LoadScript googleMapsApiKey={googleMapsApiKey}>
                <GoogleMapDisplay
                  vehicles={vehicles}
                  selectedVehicleNumber={selectedVehicleNumber}
                  onVehicleSelect={handleVehicleSelect}
                />
              </LoadScript>

              {/* Loading Overlay */}
              {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-20 flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-full shadow-md border border-slate-200 flex items-center gap-2">
                    <Loader />
                    <span className="text-xs font-bold text-indigo-900 uppercase">Updating Fleet...</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!loading && vehicles.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 z-10 pointer-events-none">
                  <EmptyState
                    title="No Vehicles Active"
                    description="Your fleet seems to be offline or empty."
                    icon={<Truck className="text-slate-300 mb-4" size={48} />}
                  />
                </div>
              )}
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {selectedVehicle ? (
                <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200">

                  {/* Header */}
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800 uppercase">{selectedVehicle.vehicle_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded">
                          {selectedVehicle.vehicle_number || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full shadow-sm">
                      <Bus size={25} />
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-white p-3 mx-4 mt-2 rounded-lg border border-slate-200 flex gap-2">
                    <MapPin className="text-red-500 shrink-0 mt-0.5" size={14} />
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {addressLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-pulse">Loading address...</span>
                        </span>
                      ) : (
                        address
                      )}
                    </p>
                  </div>

                  <div className="flex-1 p-4 space-y-6 overflow-y-auto">

                    {/* Telemetry */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Activity className="text-blue-400" size={14} />
                          <span className="text-xs font-bold text-slate-600 uppercase">Speed</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md shadow-sm">
                          {selectedVehicle.gps.speed} km/h
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Battery className="text-emerald-500" size={14} />
                          <span className="text-xs font-bold text-slate-600 uppercase">Battery</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-sm">
                          {selectedVehicle.battery}%
                        </span>
                      </div>
                    </div>

                    {/* Last Update */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Clock size={12} />
                      Updated: {formatTime(selectedVehicle.gps.timestamp)}
                    </div>

                    {/* Driver Info */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <UserIcon size={14} /> Driver
                      </label>

                      {drivers.length > 0 ? (
                        <div className="space-y-2">
                          {drivers.map(driver => (
                            <div key={driver.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors bg-white shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 font-bold">
                                  {driver.name.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-800 uppercase">{driver.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                    <IdIcon size={10} /> {driver.id}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">On Board</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                          <p className="text-xs text-slate-400 italic">No driver beacon detected</p>
                        </div>
                      )}
                    </div>

                    {/* Passengers */}
                    <div className="flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-3 shrink-0">
                        <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                          <UsersIcon size={14} /> Passengers
                        </label>
                        <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Total: {passengers.length}
                        </span>
                      </div>

                      <div className="border border-slate-200 rounded-lg bg-white">
                        {passengers.length > 0 ? (
                          <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {passengers.map(pax => (
                              <div key={pax.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-100">
                                    {pax.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-700 uppercase">{pax.name}</p>
                                    <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1 rounded">ID: {pax.id}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded">
                                    <Clock size={10} /> {formatTime(pax.lastSeen)}
                                  </span>
                                  {pax.rssi && (
                                    <div className="flex items-center gap-1">
                                      <Activity size={10} className={pax.rssi > -60 ? "text-green-500" : "text-amber-500"} />
                                      <span className="text-[10px] text-slate-400 font-mono">{pax.rssi}dBm</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-slate-50/50">
                            <p className="text-xs text-slate-400 italic">No passengers onboarded</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="h-full bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border border-slate-200">
                    <MapPin size={32} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase">Select a Vehicle</h3>
                  <p className="text-xs uppercase text-slate-500 max-w-[200px]">
                    Click on a vehicle  on the map to view details.
                  </p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
