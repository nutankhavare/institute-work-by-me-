import React, { useState, useEffect } from "react";
import { IoSearchCircle } from "react-icons/io5";
import useDebounce from "../../Hooks/useDebounce";

type SearchComponentProps = {
  onSearch: (query: string) => void;
  placeholder?: string;
  delay?: number; // Optional delay prop
};

const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearch,
  placeholder = "Search...",
  delay = 300, // Default delay of 300ms
}) => {
  const [query, setQuery] = useState("");

  // 1. Get the debounced value from our custom hook
  const debouncedQuery = useDebounce(query, delay);

  // 2. Use useEffect to call onSearch ONLY when the debounced value changes
  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]); // Dependency array ensures this runs only when needed

  // The input now only updates the local 'query' state immediately
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    // The form is kept for accessibility (allowing Enter key submission)
    <form onSubmit={(e) => e.preventDefault()} className="w-full max-w-sm">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="w-full px-4 py-2 text-sm uppercase pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="absolute right-2 text-purple-400">
          <IoSearchCircle size={30} />
        </div>
      </div>
    </form>
  );
};

export default SearchComponent;
