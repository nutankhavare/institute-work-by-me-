// A reusable card component for a single device checkbox
const DeviceCheckboxCard = ({ device, isChecked, onChange }: any) => (
  <label
    className={`
      border border-gray-300 rounded-lg p-3 flex items-center justify-between cursor-pointer transition-all duration-200
      
    `}
  >
    <div className="flex flex-col">
      <span className="font-bold text-sm text-gray-800">{device.name}</span>
      <span className="text-xs text-gray-500">{device.imei_number}</span>
    </div>
    <input
      type="checkbox"
      checked={isChecked}
      onChange={onChange}
      className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
    />
  </label>
);

export default DeviceCheckboxCard;
