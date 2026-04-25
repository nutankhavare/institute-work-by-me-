// src/components/bookings/BookingIndexPage.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Icons
import {
  Search,
  Eye,
  MapPin,
  Bus,
  Building,
  UserCircle,
  X,
  Armchair
} from "lucide-react";

// Components
import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";
import { Pagination } from "../../Components/Table/Pagination";
import {
  TableDiv,
  TableContainer,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "../../Components/Table/Table";

// Services & Utils
import tenantApi, { centralAsset } from "../../Services/ApiService";
import type { Booking } from "./Booking.types";
import { Loader } from "../../Components/UI/Loader";

// Helper: Status Styles
const getStatusStyles = (status: string) => {
  switch (status) {
    case "Approved": return "bg-green-50 text-green-700 border-green-200";
    case "Active": return "bg-blue-50 text-blue-700 border-blue-200";
    case "Completed": return "bg-purple-50 text-purple-700 border-purple-200";
    case "Cancelled": return "bg-red-50 text-red-700 border-red-200";
    default: return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
};

const BookingIndexPage = () => {
  // Data State
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [displayBookings, setDisplayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  // 1. Fetch Data
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Fetching 50 as per original logic, but we will paginate client-side for the view
      const response = await tenantApi.get("/bookings", {
        params: {
          per_page: 100, // Fetch a larger batch
          status: statusFilter,
        },
      });

      if (response.data.success) {
        const bookings = response.data.data.data || [];
        setAllBookings(bookings);
        setDisplayBookings(bookings);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  // 2. Filter Logic (Search)
  useEffect(() => {
    let result = allBookings;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((b) =>
        `${b.traveller_first_name} ${b.traveller_last_name}`.toLowerCase().includes(lowerQuery) ||
        (b.employee_id ?? "").toLowerCase().includes(lowerQuery) ||
        (b.pickup_location_name ?? "").toLowerCase().includes(lowerQuery) ||
        (b.assigned_vehicle ?? "").toLowerCase().includes(lowerQuery)
      );
    }

    setDisplayBookings(result);
    setCurrentPage(1); // Reset to page 1 on search
  }, [searchQuery, allBookings]);

  // 3. Pagination Logic (Client-Side Slicing)
  const indexOfLastItem = currentPage * perPage;
  const indexOfFirstItem = indexOfLastItem - perPage;
  const currentItems = displayBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(displayBookings.length / perPage);

  // 4. Handlers
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  // Helper: Render Avatar
  const renderAvatar = (row: Booking) => {
    const imgSrc = row.traveller_profile_photo
      ? `${centralAsset}${row.traveller_profile_photo}`
      : `https://ui-avatars.com/api/?name=${row.traveller_first_name}+${row.traveller_last_name}&background=random`;

    return (
      <img
        src={imgSrc}
        alt="Traveller"
        className="h-10 w-10 rounded-full object-cover border border-slate-200"
        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${row.traveller_first_name}+${row.traveller_last_name}&background=random`; }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white px-2">
      {/* Header */}
      <div className="mx-4">
        <PageHeader title="Booking Management" />
      </div>

      <div className="px-4 pb-10">
        <div className="mx-auto space-y-4">

          {/* Search & Filter Card */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-linear-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                <Search className="text-white" size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 uppercase">Search & Filter</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  Search Bookings
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Traveller, Location, Vehicle..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>        
            </div>

            {/* Active Filters */}
            {(searchQuery || statusFilter) && (
              <div className="flex items-center flex-wrap gap-1 mt-2">
                {searchQuery && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold uppercase border border-amber-200">
                    {searchQuery}
                  </span>
                )}
                {statusFilter && <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase border border-blue-200">{statusFilter}</span>}

                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-bold uppercase hover:bg-red-100 transition-all flex items-center gap-1 border border-red-200"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            )}
          </div>

          {/* Table Section */}
          <TableDiv>
            {loading ? (
              <div className="py-20"><Loader /></div>
            ) : displayBookings.length === 0 ? (
              <EmptyState
                title="No Bookings Found.."
                description=""
                icon={<Armchair className="text-amber-300" size={48} />}
              />
            ) : (
              <>
                <TableContainer maxHeight="71vh">
                  <Table>
                    <Thead>
                      <Th>S.No</Th>
                      <Th>Traveller</Th>
                      <Th>Pickup Info</Th>
                      <Th>Vehicle</Th>
                      <Th>Status</Th>

                      <Th align="center">Actions</Th>
                    </Thead>

                    <Tbody>
                      {currentItems.map((row, index) => (
                        <Tr key={row.id}>
                          {/* S.No */}
                          <Td isMono className="font-bold text-slate-500">
                            {(currentPage - 1) * Number(perPage) + index + 1}
                          </Td>

                          {/* Traveller */}
                          <Td>
                            <div className="flex items-center gap-3">
                              {renderAvatar(row)}
                              <div>
                                <div className="font-bold text-slate-800 uppercase text-sm">
                                  {row.traveller_first_name} {row.traveller_last_name}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold mt-0.5">
                                  <UserCircle size={12} className="text-slate-400" />
                                  {row.employee_id || "--"}
                                </div>
                              </div>
                            </div>
                          </Td>

                          {/* Pickup Info */}
                          <Td>
                            <div className="flex flex-col">
                              <span className="flex items-center gap-1.5 font-bold text-slate-700 text-sm">
                                <MapPin size={12} className="text-red-400" />
                                {row.pickup_location_name}
                              </span>
                              <span className="text-xs text-slate-500 pl-4 uppercase">
                                {row.pickup_location_city}
                              </span>
                            </div>
                          </Td>

                          {/* Transport (Org + Vehicle) */}
                          <Td>
                            <div className="flex flex-col gap-1">
                              {row.organisation_name && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium uppercase">
                                  <Building size={12} className="text-slate-400" />
                                  {row.organisation_name}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-xs text-indigo-700 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded w-fit">
                                <Bus size={12} />
                                {row.assigned_vehicle || "Unassigned"}
                              </div>
                            </div>
                          </Td>

                          {/* Status */}
                          <Td>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${getStatusStyles(row.status)}`}>
                              {row.status}
                            </span>
                          </Td>



                          {/* Actions */}
                          <Td align="center">
                            <Link
                              to={`/bookings/show/${row.id}`}
                              className="inline-flex p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-200 shadow-sm"
                              title="View Booking"
                            >
                              <Eye size={14} />
                            </Link>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Pagination (Conditionally Rendered) */}
                {totalPages > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={displayBookings.length}
                    onPageChange={setCurrentPage}
                    itemName="Bookings"
                  />
                )}
              </>
            )}
          </TableDiv>

        </div>
      </div>
    </div>
  );
};

export default BookingIndexPage;