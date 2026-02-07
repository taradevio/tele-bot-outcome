import { ChartNoAxesColumnIncreasing } from "lucide-react";

export const Chart = () => {
  return (
    <div className="border-4">
      <div className="flex items-center justify-around">
        <div>
          <h2 className="text-lg">Month over Month</h2>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl font-bold text-blue-500">+12.5%</span>
            <p>vs last month</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <h2 className="text-lg">Total Spent</h2>
          <span className="font-bold text-2xl">$682.5</span>
        </div>
      </div>
      <div className="flex items-center flex-end">
        <div className="">
          <ChartNoAxesColumnIncreasing className="w-6 h-6 mr-2" />
        </div>
        <p className="text-sm text-gray-500">
          Your spending is 12.5% higher than last month
        </p>
      </div>
    </div>
  );
};
