import { Input } from "./ui/input";
// import { SearchIcon } from "lucide-react";

export const Search = () => {
  return (
    <div>
      <Input
        type="text"
        placeholder="Search..."
        className="w-full md:w-64 lg:w-96"
      />
      {/* <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /> */}
    </div>
  );
};
