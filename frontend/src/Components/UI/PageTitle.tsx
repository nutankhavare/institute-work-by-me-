import React from "react";

interface PageTitleProps {
  title: string;
}

const PageTitle: React.FC<PageTitleProps> = ({ title }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-md font-bold text-purple-950 uppercase">{title}</h1>
    </div>
  );
};

export default PageTitle;
