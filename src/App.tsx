import LyricsSync from "./components/LyricsSyncOverlay";
import { ToastContainer } from "./components/Toast";

function App() {
  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <LyricsSync />
      <ToastContainer />
    </div>
  );
}

export default App;
