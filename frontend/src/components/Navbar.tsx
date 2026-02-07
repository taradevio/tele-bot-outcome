import { House } from "lucide-react";
import { LucideReceiptText } from "lucide-react";
import { ChartColumn } from "lucide-react";
import { User } from "lucide-react";

const menu = [
  { id: 1, name: "Home", icon: House },
  { id: 2, name: "Receipts", icon: LucideReceiptText },
  { id: 3, name: "Stats", icon: ChartColumn },
  { id: 4, name: "Profile", icon: User },
];

export const Navbar = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full border-t-2 border-amber-600">
      <nav>
        <ul className="flex justify-around items-center">
          {menu.map((item) => (
            <div key={item.id} className="p-2">
              <li className="text-center items-center flex flex-col">
                <span className="">{item.icon && <item.icon className="w-6 h-6" />}</span>
                {item.name}
              </li>
            </div>
          ))}
          {/* <div>
            <li>
              <House className="w-6 h-6" />
              Home
            </li>
          </div>
          <li>Receipts</li>
          <li>Stats</li>
          <li>Profile</li> */}
        </ul>
      </nav>
    </div>
  );
};
