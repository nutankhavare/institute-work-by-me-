import { useState, useEffect } from "react";
import { Radio, Bluetooth, Search } from "lucide-react";
import PageHeader from "../../Components/UI/PageHeader";
import LoadingSpinner from "../../Components/UI/LoadingSpinner";
import tenantApi from "../../Services/ApiService";

interface GpsDevice {
  id: string;
  device_id: string;
  sim_number: string;
  network_provider: string;
  device_health: string;
  status: string;
  assigned_to: string | null;
  assigned_type: string | null;
  is_active: boolean;
  synced_at: string;
}

interface BeaconDevice {
  id: string;
  device_id: string;
  sequence_id: number;
  status: string;
  device_type: string;
  battery_level: number;
  battery_status: string;
  device_health: string;
  assigned_to: string | null;
  assigned_type: string | null;
  is_active: boolean;
  synced_at: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const isActive = status?.toLowerCase() === "active";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-[800] uppercase tracking-wider ${
      isActive
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
        : "bg-slate-50 text-slate-500 border border-slate-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
      {status}
    </span>
  );
};

const AssignmentBadge = ({ assignedTo, assignedType }: { assignedTo: string | null; assignedType: string | null }) => {
  if (!assignedTo) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-[800] uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
        <span className="material-symbols-outlined text-[12px]">link_off</span>
        Unassigned
      </span>
    );
  }
  const icon = assignedType === "vehicle" ? "directions_bus" : assignedType === "driver" ? "person" : "link";
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-[800] uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
      <span className="material-symbols-outlined text-[12px]">{icon}</span>
      {assignedTo}
    </span>
  );
};

const BatteryBadge = ({ level }: { level: number }) => {
  const color = level > 60 ? "#10b981" : level > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${level}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-[800] text-slate-600">{level}%</span>
    </div>
  );
};

const DeviceManagementIndexPage = () => {
  const [activeTab, setActiveTab] = useState<"gps" | "beacon">("gps");
  const [gpsDevices, setGpsDevices] = useState<GpsDevice[]>([]);
  const [beaconDevices, setBeaconDevices] = useState<BeaconDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const [gpsRes, beaconRes] = await Promise.all([
          tenantApi.get("/devices/gps"),
          tenantApi.get("/devices/beacons"),
        ]);
        setGpsDevices(Array.isArray(gpsRes.data) ? gpsRes.data : gpsRes.data?.data || []);
        setBeaconDevices(Array.isArray(beaconRes.data) ? beaconRes.data : beaconRes.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch devices:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const filteredGps = gpsDevices.filter(
    (d) =>
      d.device_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.sim_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBeacons = beaconDevices.filter(
    (d) =>
      d.device_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const gpsAssigned = gpsDevices.filter((d) => d.assigned_to).length;
  const beaconAssigned = beaconDevices.filter((d) => d.assigned_to).length;

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="page-body pb-10">
      <PageHeader
        title="Device Management"
        icon="devices"
        breadcrumb="IoT Management / Devices"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={16} className="text-blue-600" />
            <span className="text-[10px] font-[900] uppercase tracking-wider text-blue-600">GPS Total</span>
          </div>
          <p className="text-2xl font-[900] text-blue-800">{gpsDevices.length}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-4 border border-emerald-100">
          <div className="flex items-center gap-2 mb-2">
            <Radio size={16} className="text-emerald-600" />
            <span className="text-[10px] font-[900] uppercase tracking-wider text-emerald-600">GPS Assigned</span>
          </div>
          <p className="text-2xl font-[900] text-emerald-800">{gpsAssigned}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-2xl p-4 border border-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <Bluetooth size={16} className="text-violet-600" />
            <span className="text-[10px] font-[900] uppercase tracking-wider text-violet-600">Beacons Total</span>
          </div>
          <p className="text-2xl font-[900] text-violet-800">{beaconDevices.length}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl p-4 border border-amber-100">
          <div className="flex items-center gap-2 mb-2">
            <Bluetooth size={16} className="text-amber-600" />
            <span className="text-[10px] font-[900] uppercase tracking-wider text-amber-600">Beacons Assigned</span>
          </div>
          <p className="text-2xl font-[900] text-amber-800">{beaconAssigned}</p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="px-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("gps")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-[900] uppercase tracking-wider transition-all ${
                activeTab === "gps"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Radio size={14} />
              GPS Devices
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-[900] ${
                activeTab === "gps" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
              }`}>{gpsDevices.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("beacon")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-[900] uppercase tracking-wider transition-all ${
                activeTab === "beacon"
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Bluetooth size={14} />
              Beacon Devices
              <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] font-[900] ${
                activeTab === "beacon" ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-500"
              }`}>{beaconDevices.length}</span>
            </button>
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devices..."
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] font-[600] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 w-full sm:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* GPS Table */}
      {activeTab === "gps" && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Device ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">SIM Number</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Health</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredGps.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">gps_off</span>
                        No GPS devices found
                      </td>
                    </tr>
                  ) : (
                    filteredGps.map((device, index) => (
                      <tr key={device.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-[700] text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                              <Radio size={14} className="text-blue-600" />
                            </div>
                            <span className="text-[12px] font-[800] text-slate-800">{device.device_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] font-[600] text-slate-600">{device.sim_number || "—"}</td>
                        <td className="px-4 py-3 text-[11px] font-[700] text-slate-600 capitalize">{device.device_health || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
                        <td className="px-4 py-3"><AssignmentBadge assignedTo={device.assigned_to} assignedType={device.assigned_type} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Beacon Table */}
      {activeTab === "beacon" && (
        <div className="px-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">#</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Device ID</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Battery</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Health</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-[900] uppercase tracking-wider text-slate-500">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBeacons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                        <span className="material-symbols-outlined text-4xl block mb-2 text-slate-300">sensors_off</span>
                        No Beacon devices found
                      </td>
                    </tr>
                  ) : (
                    filteredBeacons.map((device, index) => (
                      <tr key={device.id} className="hover:bg-violet-50/30 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-[700] text-slate-400">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                              <Bluetooth size={14} className="text-violet-600" />
                            </div>
                            <span className="text-[12px] font-[800] text-slate-800">{device.device_id}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><BatteryBadge level={device.battery_level || 0} /></td>
                        <td className="px-4 py-3 text-[11px] font-[700] text-slate-600 capitalize">{device.device_health || "—"}</td>
                        <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
                        <td className="px-4 py-3"><AssignmentBadge assignedTo={device.assigned_to} assignedType={device.assigned_type} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagementIndexPage;