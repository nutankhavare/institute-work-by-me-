// // src/Pages/GpsDevices/EditPage.tsx
// import { useForm, type SubmitHandler } from "react-hook-form";
// import { useParams, useNavigate } from "react-router-dom";
// import PageHeaderBack from "../../Components/UI/PageHeaderBack";
// import type { Beacon } from "../../Types/Index";
// import { useEffect } from "react";
// import { assignedBeacons } from "../../Data/Index";

// const BeaconEditPage = () => {
//   const { id } = useParams<{ id: string }>(); // This is the 'uid' from the data
//   const navigate = useNavigate();
//   const {
//     register,
//     handleSubmit,
//     reset, // The 'reset' function is used to populate the form
//     formState: { errors },
//   } = useForm<Beacon>();

//   // Find the device and populate the form on component load
//   useEffect(() => {
//     const device = assignedBeacons.find((d) => d.id === id);
//     if (device) {
//       // The keys in this object must match the form input names
//       reset({
//         name: device.name,
//         imei_number: device.imei_number,
//       });
//     }
//   }, [id, reset]);

//   // Handle form submission
//   const onSubmit: SubmitHandler<Beacon> = (data) => {
//     console.log("Updated Data:", data);
//     alert(`Device "${data.name}" updated successfully!`);
//     navigate("/beacons");
//   };

//   return (
//     <div className="px-4 bg-white min-h-screen">
//       <PageHeaderBack title="Edit GPS Device" buttonLink="/beacons" />

//       <div className="p-8 max-w-2xl mx-auto rounded-lg shadow-sm">
//         <form onSubmit={handleSubmit(onSubmit)}>
//           {/* Title Field */}
//           <div className="mb-6">
//             <label
//               htmlFor="name"
//               className="block text-purple-950 uppercase font-bold mb-2"
//             >
//               Title
//             </label>
//             <input
//               type="text"
//               id="name"
//               {...register("name", { required: "Title is required." })}
//               className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
//             />
//             {errors.name && (
//               <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
//             )}
//           </div>

//           {/* Device ID Field */}
//           <div className="mb-6">
//             <label
//               htmlFor="id"
//               className="block text-purple-950 uppercase font-bold mb-2"
//             >
//               Device ID
//             </label>
//             <input
//               type="text"
//               id="id"
//               {...register("imei_number", {
//                 required: "Device ID is required.",
//               })}
//               className="w-full px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
//             />
//             {errors.id && (
//               <p className="text-red-500 text-sm mt-1">{errors.id.message}</p>
//             )}
//           </div>

//           <button
//             type="submit"
//             className="bg-purple-200 text-purple-900 font-bold py-2 px-6 rounded-lg hover:bg-purple-300 uppercase transition-colors"
//           >
//             SAVE
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default BeaconEditPage;
