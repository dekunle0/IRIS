import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#059669]/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <h1 className="text-6xl font-black mb-6 z-10">
        KytoLabx <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#34D399] to-[#059669]">IRIS</span>
      </h1>
      <p className="text-xl text-slate-400 max-w-2xl mb-10 z-10 font-medium">
        Intelligent Real-time Imaging System. The complete offline clinical workstation.
      </p>
      
      <Link 
        href="/downloads" 
        className="z-10 bg-[#059669] hover:bg-[#047857] text-white px-8 py-4 rounded-2xl font-extrabold text-lg transition-all shadow-[0_8px_20px_rgba(5,150,105,0.25)] hover:-translate-y-1"
      >
        Get IRIS Desktop
      </Link>
    </div>
  );
}