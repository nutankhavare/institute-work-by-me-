import { MdDevices } from "react-icons/md";

import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";

const DeviceManagementIndexPage = () => {
  return (
    <div className="min-h-screen bg-white px-2">
      <div className="mx-4">
        <PageHeader title="Device Management" />
      </div>

      <div className="px-4 pb-10">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100">
          <EmptyState
            title="No Devices Yet"
            description="Device data will be added here later."
            icon={<MdDevices className="text-slate-300 text-6xl mb-4" />}
          />
        </div>
      </div>
    </div>
  );
};

export default DeviceManagementIndexPage;