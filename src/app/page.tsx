"use client";

import LabelIndicatorCarousel from "@/components/ui/label_indicator_carousel";

export default function Home() {

  return (


    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen pb-20 gap-16 sm: overflow-x-hidden">
      <main className="w-full flex flex-col gap-[32px] row-start-2 items-center sm:items-start overflow-x-hidden">
        <div className="w-full text-center text-sm font-sans">Robot Firmware Builder</div>
        
        {/* Label Indicator Carousel */}
        <LabelIndicatorCarousel
          items={[
                 { 
                   label: "Edit", 
                   caption: "Editing robot parameters with guidance",
                   imageUrl: "https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/generator-1.jpg" 
                 },
                 { 
                   label: "Create", 
                   caption: "Starting from existing parameters and generating firmware",
                   imageUrl: "https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/generator-2.jpg"
                 },
                 { 
                   label: "Review", 
                   caption: "Tracking firmware build progress",
                   imageUrl: "https://f5uskgwhyu2fi170.public.blob.vercel-storage.com/generator-3.jpg"
                 },
               ]}
        />
        
      </main>
      
    </div>
  );
}
