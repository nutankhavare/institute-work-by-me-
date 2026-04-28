// src/components/travelers/TravellerIndexPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

// Icons
import {
  Search,
  Eye,
  Users,
  IdCard,
  Bluetooth,
  UserRound,
  FileEdit,
  X
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
import type { Traveller } from "./Traveler.types";
import type { PaginatedResponse } from "../../Types/Index";
import { Loader } from "../../Components/UI/Loader";
import { useConfirm } from "../../Context/ConfirmContext";

const TravellerIndexPage = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  // Data State
  const [allTravelers, setAllTravelers] = useState<Traveller[]>([]);
  const [displayTravelers, setDisplayTravelers] = useState<Traveller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [perPage] = useState(15);

  // 1. Fetch Data
  const fetchTravelers = async () => {
    try {
      setLoading(true);

      const response = await tenantApi.get<PaginatedResponse<Traveller>>(
        "/travellers",
        {
          params: {
            page: currentPage,
            per_page: perPage,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const travellers = response.data.data.data || [];
        setAllTravelers(travellers);
        setDisplayTravelers(travellers);

        setTotalPages(response.data.data.last_page);
        setTotalItems(response.data.data.total);
      }
    } catch (err) {
      console.error("Error fetching travellers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelers();
  }, [currentPage, perPage]);

  // 2. Filter Logic (Client-Side for current page / Mixed)
  useEffect(() => {
    let result = allTravelers;

    // Gender Filter
    if (genderFilter) {
      result = result.filter(t => t.gender?.toLowerCase() === genderFilter.toLowerCase());
    }

    // Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((t) =>
        `${t.first_name} ${t.last_name}`.toLowerCase().includes(lowerQuery) ||
        (t.beacon_id ?? "").toLowerCase().includes(lowerQuery) ||
        (t.traveller_uid ?? "").toLowerCase().includes(lowerQuery)
      );
    }

    setDisplayTravelers(result);
  }, [searchQuery, genderFilter, allTravelers]);

  // 3. Handlers
  const handleClearFilters = () => {
    setSearchQuery("");
    setGenderFilter("");
  };

  // Helper: Render Avatar
  const renderAvatar = (row: Traveller) => {
    const imgSrc = row.profile_photo
      ? `${centralAsset}${row.profile_photo}`
      : `https://ui-avatars.com/api/?name=${row.first_name}+${row.last_name}&background=random`;

    return (
      <img
        src={imgSrc}
        alt={`${row.first_name}`}
        className="h-10 w-10 rounded-full object-cover border border-slate-200"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${row.first_name}+${row.last_name}&background=random`;
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white px-2">
      {/* Header */}
      <div className="mx-4">
        <PageHeader title="Traveller Management" />
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
              {/* Search */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  Search Travellers
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name, UID, Beacon ID..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Gender Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase">
                  Gender
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white cursor-pointer"
                  >
                    <option value="">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || genderFilter) && (
              <div className="flex items-center flex-wrap gap-1 mt-3">
                {searchQuery && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold uppercase border border-blue-200">
                    {searchQuery}
                  </span>
                )}
                {genderFilter && (
                  <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold uppercase border border-purple-200">
                    {genderFilter}
                  </span>
                )}

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
              <div className="py-20">
                <Loader />
              </div>
            ) : displayTravelers.length === 0 ? (
              <EmptyState
                title="No Travellers Found"
                description="Try adjusting your search or filters."
                icon={<Users className="text-slate-300 mb-4" size={48} />}
              />
            ) : (
              <>
                <TableContainer maxHeight="71vh">
                  <Table>
                    <Thead>
                      <Th width="5%">S.No</Th>
                      <Th>Traveller Name</Th>
                      <Th>UID</Th>
                      <Th>Beacon ID</Th>
                      <Th align="center">Gender</Th>

                      <Th align="center">Actions</Th>
                    </Thead>

                    <Tbody>
                      {displayTravelers.map((row, index) => (
                        <Tr key={row.id}>
                          {/* S.No */}
                          <Td isMono className="font-bold text-slate-500">
                            {(currentPage - 1) * Number(perPage) + index + 1}
                          </Td>

                          {/* Name & Avatar */}
                          <Td>
                            <div className="flex items-center gap-3">
                              {renderAvatar(row)}
                              <div>
                                <div className="font-bold text-slate-800 uppercase text-sm">
                                  {row.first_name} {row.last_name}
                                </div>
                                {row.relationship && (
                                  <span className="text-xs text-slate-500 font-semibold uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                    {row.relationship}
                                  </span>
                                )}
                              </div>
                            </div>
                          </Td>

                          <Td>
                            <div className="flex items-center gap-2">
                              <IdCard size={14} className="text-slate-400" />
                              <span className="font-mono text-sm text-slate-700 font-medium">
                                {row.traveller_uid || "—"}
                              </span>
                            </div>
                          </Td>

                          {/* Beacon ID */}
                          <Td>
                            {row.beacon_id ? (
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                <Bluetooth size={10} />
                                <span className="text-xs font-bold font-mono">
                                  {row.beacon_id}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Not Assigned</span>
                            )}
                          </Td>

                          {/* Gender */}
                          <Td align="center">
                            <span className="text-sm text-slate-700 capitalize">
                              {row.gender == "Male" ? (
                                <label className="bg-amber-100 text-amber-800 font-semibold px-4 py-1 rounded-lg">{row.gender}</label>
                              ) : (<label className="bg-pink-50 text-pink-900 font-semibold px-4 py-1 rounded-lg">{row.gender}</label>)}
                            </span>
                          </Td>


                          {/* Actions */}
                          <Td>
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/travellers/show/${row.id}`}
                                className="p-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-200 shadow-sm"
                                title="View Details"
                              >
                                <Eye size={14} />
                              </Link>

                              <button
                                onClick={async () => {
                                  if(await confirm("Modify this traveller record?")) {
                                    navigate(`/travellers/edit/${row.id}`);
                                  }
                                }}
                                className="p-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-200 shadow-sm"
                                title="Edit"
                              >
                                <FileEdit size={14} />
                              </button>
                            </div>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Pagination (Conditional) */}
                {totalPages > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={setCurrentPage}
                    itemName="Travellers"
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

export default TravellerIndexPage;