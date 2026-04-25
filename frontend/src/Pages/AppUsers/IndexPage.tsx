import { FaUsers } from "react-icons/fa";

import PageHeader from "../../Components/UI/PageHeader";
import EmptyState from "../../Components/UI/EmptyState";

const AppUsersIndexPage = () => {
  return (
    <div className="min-h-screen bg-white px-2">
      <div className="mx-4">
        <PageHeader title="App Users" />
      </div>

      <div className="px-4 pb-10">
        <div className="bg-white rounded-lg shadow-sm border border-slate-100">
          <EmptyState
            title="No App Users Yet"
            description="App user data will be added here later."
            icon={<FaUsers className="text-slate-300 text-6xl mb-4" />}
          />
        </div>
      </div>
    </div>
  );
};

export default AppUsersIndexPage;