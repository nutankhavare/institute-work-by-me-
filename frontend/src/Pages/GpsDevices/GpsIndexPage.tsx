// import { useState } from "react"; // Import useState
// import PageHeader from "../../Components/UI/PageHeader"; // Upgraded from PageTitle for consistency
// import Table from "../../Components/UI/Table";
// import { assignedGps } from "../../Data/Index";
// import type { Gps } from "../../Types/Index";
// import SearchComponent from "../../Components/UI/SearchComponents";

// // Column definitions remain the same
// const columns = [
//   {
//     key: "sno",
//     label: "SNo",
//     render: (_: Gps, index: number) => index + 1,
//   },
//   { key: "name", label: "Model" },
//   { key: "imei_number", label: "Device ID" },
// ];

// // Placeholder for the delete action
// // const handleDelete = (device: Gps) => {
// //   console.log("Delete device:", device);
// //   alert(`Deleting ${device.name}`);
// // };

// const GpsIndexPage = () => {
//   // State to hold the list of GPS devices that will be displayed
//   const [filteredGps, setFilteredGps] = useState<Gps[]>(assignedGps);

//   // The search handler function
//   const handleSearch = (query: string) => {
//     if (!query) {
//       setFilteredGps(assignedGps);
//       return;
//     }

//     const lowercasedQuery = query.toLowerCase();
//     const filtered = assignedGps.filter(
//       (gps) =>
//         (gps.name ?? "").toLowerCase().includes(lowercasedQuery) ||
//         (gps.imei_number ?? "").toLowerCase().includes(lowercasedQuery)
//     );
//     setFilteredGps(filtered);
//   };

//   return (
//     <div className="px-4 bg-white min-h-screen">
//       <PageHeader
//         title="GPS Devices"
//         // buttonText="Add Device"
//         // buttonLink="/gps/create"
//       />

//       {/* Add the SearchComponent */}
//       <div className="my-4">
//         <SearchComponent
//           onSearch={handleSearch}
//           placeholder="Search by Model, Device ID..."
//         />
//       </div>

//       <Table<Gps>
//         list={filteredGps} // <-- Use the filtered state here
//         columns={columns}
//         // editUrl="/gps/edit"
//         // onDelete={handleDelete}
//       />
//     </div>
//   );
// };

// export default GpsIndexPage;
