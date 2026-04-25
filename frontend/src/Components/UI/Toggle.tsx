import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <span className="slider"></span>
  </label>
);
