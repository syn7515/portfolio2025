"use client";

import { useState } from 'react';
import LabelIndicatorCarousel from './label_indicator_carousel';
import { ImageUpload } from './image-upload';

interface CarouselItem {
  label: string;
  caption: string;
  imageUrl?: string;
}

export function CarouselWithUpload() {
  const [items, setItems] = useState<CarouselItem[]>([
    { label: "Edit", caption: "Editing robot parameters with guidance" },
    { label: "Create", caption: "Starting from existing parameters and generating firmware" },
    { label: "Review", caption: "Tracking firmware build progress" },
  ]);

  const handleImageUpload = (index: number, url: string) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, imageUrl: url } : item
    ));
  };

  return (
    <div className="space-y-4">
      <LabelIndicatorCarousel
        items={items}
        defaultIndex={0}
        className="h-auto w-full max-w-full overflow-hidden"
        withEdgeBlur
        renderCard={(i, active, item) => (
          <div className="w-full h-full relative">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.label}
                className="w-full h-full object-cover rounded-[8px]"
              />
            ) : (
              <div className="w-full h-full bg-stone-200/60 dark:bg-stone-800 rounded-[8px] flex items-center justify-center">
                <span className="text-stone-500">No image</span>
              </div>
            )}
            {active && (
              <div className="absolute inset-0 ring-2 ring-blue-500 rounded-[8px]" />
            )}
          </div>
        )}
      />
      
      <div className="grid grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-sm font-medium">{item.label}</h3>
            <ImageUpload
              onUpload={(url) => handleImageUpload(index, url)}
              className="text-xs"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
