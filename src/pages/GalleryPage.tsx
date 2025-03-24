import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Loader } from 'lucide-react';

// Gallery image data with descriptions
const galleryImages = [
  { src: '/.netlify/images?url=/images/DSC_0250.jpg', alt: 'Custom rifle with desert tan camouflage pattern' },
  { src: '/.netlify/images?url=/images/DSC_0268.jpg', alt: 'Precision bolt action rifle with custom finish' },
  { src: '/.netlify/images?url=/images/DSC_0311.jpg', alt: 'Tactical rifle with advanced camouflage design' },
  { src: '/.netlify/images?url=/images/DSC_0314.jpg', alt: 'Custom firearm with specialized coating' },
  { src: '/.netlify/images?url=/images/DSC_0319.jpg', alt: 'Professional grade rifle with durable finish' },
  { src: '/.netlify/images?url=/images/DSC_0323.jpg', alt: 'High-performance firearm with custom paint' },
  { src: '/.netlify/images?url=/images/DSC_0328.jpg', alt: 'Precision shooting platform with unique design' },
  { src: '/.netlify/images?url=/images/DSC_0331.jpg', alt: 'Custom built rifle with professional finish' },
  { src: '/.netlify/images?url=/images/DSC_0332.jpg', alt: 'Tactical weapon system with advanced coating' },
  { src: '/.netlify/images?url=/images/DSC_0334.jpg', alt: 'Competition grade rifle with custom work' },
  { src: '/.netlify/images?url=/images/DSC_0338.jpg', alt: 'Custom rifle with specialized camouflage pattern' },
  { src: '/.netlify/images?url=/images/DSC_0340.jpg', alt: 'Precision firearm with advanced finish' },
  { src: '/.netlify/images?url=/images/DSC_0358.jpg', alt: 'Tactical rifle with custom coating' },
  { src: '/.netlify/images?url=/images/DSC_0361.jpg', alt: 'Professional grade weapon with unique finish' },
  { src: '/.netlify/images?url=/images/DSC_0362.jpg', alt: 'Custom built firearm with specialized design' },
  { src: '/.netlify/images?url=/images/DSC_0364.jpg', alt: 'High-performance rifle with custom work' },
  { src: '/.netlify/images?url=/images/DSC_0379.jpg', alt: 'Precision shooting platform with advanced coating' },
  { src: '/.netlify/images?url=/images/DSC_0382.jpg', alt: 'Custom rifle with professional finish' },
  { src: '/.netlify/images?url=/images/DSC_0383.jpg', alt: 'Tactical weapon with specialized pattern' },
  { src: '/.netlify/images?url=/images/DSC_0391.jpg', alt: 'Competition grade firearm with custom design' },
  { src: '/.netlify/images?url=/images/DSC_0392.jpg', alt: 'Professional rifle with unique coating' },
  { src: '/.netlify/images?url=/images/DSC_0393.jpg', alt: 'Custom built weapon with advanced finish' },
  { src: '/.netlify/images?url=/images/DSC_0404.jpg', alt: 'Precision firearm with specialized work' },
  { src: '/.netlify/images?url=/images/DSC_0405.jpg', alt: 'Tactical rifle with custom pattern' },
  { src: '/.netlify/images?url=/images/DSC_0408.jpg', alt: 'High-performance weapon with professional coating' },
  { src: '/.netlify/images?url=/images/DSC_0409.jpg', alt: 'Custom rifle with advanced design' },
  { src: '/.netlify/images?url=/images/DSC_0412.jpg', alt: 'Precision shooting platform with unique finish' },
  { src: '/.netlify/images?url=/images/DSC_0428.jpg', alt: 'Professional grade firearm with custom work' },
  { src: '/.netlify/images?url=/images/DSC_0442.jpg', alt: 'Tactical weapon system with specialized coating' },
  { src: '/.netlify/images?url=/images/DSC_0449.jpg', alt: 'Custom built rifle with advanced pattern' },
  { src: '/.netlify/images?url=/images/DSC_0451.jpg', alt: 'Competition grade weapon with unique design' },
  { src: '/.netlify/images?url=/images/DSC_0453.jpg', alt: 'Precision firearm with professional finish' },
  { src: '/.netlify/images?url=/images/DSC_0483.jpg', alt: 'Custom rifle with specialized work' },
  { src: '/.netlify/images?url=/images/DSC_0488.jpg', alt: 'Tactical weapon with advanced coating' },
  { src: '/.netlify/images?url=/images/DSC_0493.jpg', alt: 'High-performance firearm with custom pattern' },
  { src: '/.netlify/images?url=/images/DSC_0494.jpg', alt: 'Professional grade rifle with unique finish' },
  { src: '/.netlify/images?url=/images/DSC_0495.jpg', alt: 'Custom built weapon with specialized design' },
  { src: '/.netlify/images?url=/images/DSC_0497.jpg', alt: 'Precision shooting platform with advanced work' },
  { src: '/.netlify/images?url=/images/DSC_0501.jpg', alt: 'Tactical rifle with professional coating' },
  { src: '/.netlify/images?url=/images/DSC_0510.jpg', alt: 'Custom firearm with unique pattern' },
  { src: '/.netlify/images?url=/images/DSC_0512.jpg', alt: 'Competition grade weapon with specialized finish' },
  { src: '/.netlify/images?url=/images/DSC_0513.jpg', alt: 'Professional rifle with advanced design' },
  { src: '/.netlify/images?url=/images/DSC_0519.jpg', alt: 'Custom built firearm with custom work' },
  { src: '/.netlify/images?url=/images/DSC_0529.jpg', alt: 'Tactical weapon system with unique coating' },
  { src: '/.netlify/images?url=/images/DSC_0532.jpg', alt: 'Precision rifle with specialized pattern' },
  { src: '/.netlify/images?url=/images/DSC_0542.jpg', alt: 'High-performance weapon with professional finish' },
  { src: '/.netlify/images?url=/images/DSC_0543.jpg', alt: 'Custom firearm with advanced design' },
  { src: '/.netlify/images?url=/images/DSC_0554.jpg', alt: 'Tactical rifle with unique work' },
  { src: '/.netlify/images?url=/images/DSC_0558.jpg', alt: 'Professional grade weapon with specialized coating' },
  { src: '/.netlify/images?url=/images/DSC_0563.jpg', alt: 'Custom built rifle with advanced pattern' },
  { src: '/.netlify/images?url=/images/DSC_0564.jpg', alt: 'Precision firearm with custom finish' },
  { src: '/.netlify/images?url=/images/DSC_0566.jpg', alt: 'Competition grade weapon with unique design' },
  { src: '/.netlify/images?url=/images/DSC_0567.jpg', alt: 'Tactical rifle with professional work' },
  { src: '/.netlify/images?url=/images/DSC_0569.jpg', alt: 'Custom firearm with specialized coating' },
  { src: '/.netlify/images?url=/images/DSC_0571.jpg', alt: 'High-performance weapon with advanced pattern' },
  { src: '/.netlify/images?url=/images/DSC_0572.jpg', alt: 'Professional grade rifle with unique finish' },
  { src: '/.netlify/images?url=/images/DSC_0573.jpg', alt: 'Custom built firearm with specialized design' },
  { src: '/.netlify/images?url=/images/DSC_0575.jpg', alt: 'Precision shooting platform with custom work' },
  { src: '/.netlify/images?url=/images/DSC_0577.jpg', alt: 'Tactical weapon with professional coating' },
  
  // Dated photos
  { src: '/.netlify/images?url=/images/Photo Apr 10, 1 49 05 PM.jpg', alt: 'Custom rifle with desert camouflage finish and tactical accessories' },
  { src: '/.netlify/images?url=/images/Photo Apr 10, 1 53 03 PM.jpg', alt: 'Precision rifle showcasing intricate camouflage pattern detail' },
  { src: '/.netlify/images?url=/images/Photo Apr 12, 3 36 17 PM.jpg', alt: 'Tactical firearm with custom Duracoat application' },
  { src: '/.netlify/images?url=/images/Photo Apr 12, 3 37 05 PM.jpg', alt: 'Professional grade weapon system with specialized finish' },
  { src: '/.netlify/images?url=/images/Photo Apr 12, 3 47 06 PM.jpg', alt: 'Custom built rifle featuring unique camouflage design' },
  { src: '/.netlify/images?url=/images/Photo Apr 12, 5 48 50 PM.jpg', alt: 'High-performance firearm with advanced coating system' },
  { src: '/.netlify/images?url=/images/Photo Apr 15, 2 22 59 PM.jpg', alt: 'Precision shooting platform with custom paint application' },
  { src: '/.netlify/images?url=/images/Photo Apr 15, 2 23 15 PM.jpg', alt: 'Tactical weapon with specialized desert camouflage' },
  { src: '/.netlify/images?url=/images/Photo Apr 15, 2 25 41 PM.jpg', alt: 'Competition grade rifle with professional finish' },
  { src: '/.netlify/images?url=/images/Photo Apr 15, 2 27 05 PM.jpg', alt: 'Custom firearm showcasing detailed pattern work' },
  { src: '/.netlify/images?url=/images/Photo May 02, 3 38 22 PM.jpg', alt: 'Precision rifle with advanced camouflage application' },
  { src: '/.netlify/images?url=/images/Photo May 02, 3 38 56 PM.jpg', alt: 'Tactical weapon system with custom coating' },
  { src: '/.netlify/images?url=/images/Photo May 11, 6 19 29 PM.jpg', alt: 'Professional grade firearm with specialized finish' },
  { src: '/.netlify/images?url=/images/Photo May 11, 6 19 55 PM.jpg', alt: 'Custom built rifle with unique pattern design' },
  { src: '/.netlify/images?url=/images/Photo May 11, 6 27 39 PM.jpg', alt: 'High-performance weapon with detailed camouflage' },
  { src: '/.netlify/images?url=/images/Photo May 17, 12 25 53 PM.jpg', alt: 'Precision shooting platform with custom work' },
  { src: '/.netlify/images?url=/images/Photo May 21, 11 55 51 AM.jpg', alt: 'Tactical rifle with advanced finish application' },
  { src: '/.netlify/images?url=/images/Photo May 21, 11 57 22 AM.jpg', alt: 'Custom firearm with specialized coating system' },
  { src: '/.netlify/images?url=/images/Photo May 21, 11 57 31 AM.jpg', alt: 'Professional grade weapon with unique design' },
  { src: '/.netlify/images?url=/images/Photo May 21, 11 58 22 AM.jpg', alt: 'Competition rifle with custom camouflage pattern' },
  { src: '/.netlify/images?url=/images/Photo May 21, 12 10 28 PM.jpg', alt: 'Precision firearm with advanced coating work' },
  { src: '/.netlify/images?url=/images/Photo May 21, 12 23 23 PM.jpg', alt: 'Tactical weapon with specialized finish' },
  { src: '/.netlify/images?url=/images/Photo May 21, 12 33 54 PM.jpg', alt: 'Custom built rifle with professional coating' },
  { src: '/.netlify/images?url=/images/Photo May 21, 12 43 47 PM.jpg', alt: 'High-performance firearm with detailed pattern' },
  { src: '/.netlify/images?url=/images/Photo May 21, 12 44 26 PM.jpg', alt: 'Precision shooting platform with custom design' },
  { src: '/.netlify/images?url=/images/Photo May 24, 2 57 34 PM.jpg', alt: 'Professional grade weapon with specialized camouflage' }
];

const GalleryPage: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => new Set(prev).add(src));
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="mb-16">
          <motion.h1 
            className="font-heading text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Our <span className="text-tan">Gallery</span>
          </motion.h1>
          <motion.div 
            className="w-24 h-0.5 bg-tan mb-8"
            initial={{ width: 0 }}
            animate={{ width: 96 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          ></motion.div>
          <motion.p
            className="text-xl max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Explore our collection of custom firearms, showcasing the artistry and precision of our craftsmanship.
          </motion.p>
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="flex flex-col items-center justify-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader className="w-10 h-10 text-tan animate-spin mb-4" />
              <p className="text-gray-400">Loading gallery...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoading ? 0 : 1 }}
          transition={{ duration: 0.6 }}
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.src}
              className="relative group cursor-pointer overflow-hidden rounded-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: loadedImages.has(image.src) ? 1 : 0,
                y: loadedImages.has(image.src) ? 0 : 20
              }}
              transition={{ duration: 0.6, delay: loadedImages.has(image.src) ? index * 0.1 : 0 }}
              onClick={() => setSelectedImage(image.src)}
            >
              <div className="aspect-w-3 aspect-h-2">
                <img
                  src={`/.netlify/images?url=/img/gallery/${image.src}`}
                  alt={image.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                  onLoad={() => handleImageLoad(image.src)}
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={24} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
            >
              <motion.div
                className="relative max-w-7xl w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  className="absolute top-4 right-4 text-white hover:text-tan transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(null);
                  }}
                >
                  <X size={24} />
                </button>
                <img
                  src={`/.netlify/images?url=/img/gallery/${selectedImage}`}
                  alt={galleryImages.find(img => img.src === selectedImage)?.alt}
                  className="w-full h-auto rounded-sm shadow-luxury"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GalleryPage;