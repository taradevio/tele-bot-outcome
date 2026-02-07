import { useEffect } from "react";

export const CustomTooltip = ({ active, payload, setFocusedData }: any) => {
  useEffect(() => {
    if (active && payload && payload.length) {
      setFocusedData(payload[0].payload);
    } else {
      setFocusedData(null);
    }
  }, [active, payload, setFocusedData]);

  return null;
};
