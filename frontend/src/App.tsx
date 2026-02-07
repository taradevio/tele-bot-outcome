import { Navbar } from "./components/Navbar";
import { Chart } from "./components/Chart";
import { Search } from "./components/Search";

function App() {
  return (
    <div>
      <Search />
      <Chart />
      <Navbar />
    </div>
  );
}

export default App;
