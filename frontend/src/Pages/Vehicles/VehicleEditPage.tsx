import { useParams } from "react-router-dom";
import VehicleFormPage from "./VehicleFormPage";

const VehicleEditPage = () => {
  const { id } = useParams<{ id: string }>();

  return <VehicleFormPage mode="edit" vehicleId={id} />;
};

export default VehicleEditPage;
