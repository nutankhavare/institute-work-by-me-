// import { useState } from "react"; // Import useState
// import PageHeader from "../../Components/UI/PageHeader"; // Upgraded from PageTitle for consistency
// import Table from "../../Components/UI/Table";
// import { assignedBeacons } from "../../Data/Index";
// import type { Beacon } from "../../Types/Index";
// import SearchComponent from "../../Components/UI/SearchComponents";

// // Column definitions remain the same
// const columns = [
//   {
//     key: "sno",
//     label: "SNo",
//     render: (_: Beacon, index: number) => index + 1,
//   },
//   { key: "name", label: "Model" },
//   { key: "imei_number", label: "Device ID" },
// ];

// // Placeholder for the delete action, to be consistent with other pages
// // const handleDelete = (device: Beacon) => {
// //   console.log("Delete device:", device);
// //   alert(`Deleting ${device.name}`);
// // };

// const BeaconIndexPage = () => {
//   // State to hold the list of beacons that will be displayed
//   const [filteredBeacons, setFilteredBeacons] =
//     useState<Beacon[]>(assignedBeacons);

//   // The search handler function
//   const handleSearch = (query: string) => {
//     if (!query) {
//       setFilteredBeacons(assignedBeacons);
//       return;
//     }

//     const lowercasedQuery = query.toLowerCase();
//     const filtered = assignedBeacons.filter(
//       (beacon) =>
//         (beacon.name ?? "").toLowerCase().includes(lowercasedQuery) ||
//         (beacon.imei_number ?? "").toLowerCase().includes(lowercasedQuery)
//     );
//     setFilteredBeacons(filtered);
//   };

//   return (
//     <div className="px-4 bg-white min-h-screen">
//       <PageHeader
//         title="Beacon Devices"
//         // buttonText="Add Device"
//         // buttonLink="/beacons/create"
//       />

//       {/* Add the SearchComponent */}
//       <div className="my-4">
//         <SearchComponent
//           onSearch={handleSearch}
//           placeholder="Search by Model, Device ID..."
//         />
//       </div>

//       <Table<Beacon>
//         list={filteredBeacons} // <-- Use the filtered state here
//         columns={columns}
//         // editUrl="/beacons/edit"
//         // onDelete={handleDelete}
//       />
//     </div>
//   );
// };

// export default BeaconIndexPage;
