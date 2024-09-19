import dynamic from 'next/dynamic';

const Map = dynamic(() => import("./component/dialog/map"), { ssr: false });

export default function App() {
  if (typeof window !== "undefined") {
    return (
      <div>
        <Map/>
      </div>
    )
  }
  return (
    
    <Map/>
  );
}