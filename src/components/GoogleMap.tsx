import React, { useEffect, useRef } from 'react';

interface GoogleMapProps {
  className?: string;
}

const GoogleMap: React.FC<GoogleMapProps> = ({ className = '' }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create and load the API loader script
    const apiLoader = document.createElement('gmpx-api-loader');
    apiLoader.setAttribute('key', 'AIzaSyDEGr1R3707u7ruivVw5BlBU-jcPsrAX5U');
    apiLoader.setAttribute('solution-channel', 'GMP_QB_locatorplus_v11_c');
    document.head.appendChild(apiLoader);

    // Create and load the Extended Component Library script
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js';
    document.head.appendChild(script);

    // Wait for script to load then initialize map
    script.onload = async () => {
      if (!mapContainerRef.current) return;

      // Create store locator element
      const storeLocator = document.createElement('gmpx-store-locator');
      storeLocator.setAttribute('map-id', 'DEMO_MAP_ID');
      storeLocator.style.width = '100%';
      storeLocator.style.height = '400px';
      mapContainerRef.current.appendChild(storeLocator);

      // Wait for custom element to be defined
      await customElements.whenDefined('gmpx-store-locator');

      // Configure the store locator
      const configuration = {
        locations: [
          {
            title: "Carnimore, LLC.",
            address1: "42526 N 18th St",
            address2: "Phoenix, AZ 85086, USA",
            coords: {
              lat: 33.87151412412327,
              lng: -112.0438067067459
            },
            placeId: "ChIJKzs_RVR9K4cR1hM4tl55mJc"
          }
        ],
        mapOptions: {
          center: { 
            lat: 33.87151412412327, 
            lng: -112.0438067067459 
          },
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 15,
          zoomControl: true,
          maxZoom: 17,
          mapId: "efa854521ffb11f1"
        },
        mapsApiKey: import.meta.env.MAPS_API_KEY,
        capabilities: {
          input: false,
          autocomplete: false,
          directions: false,
          distanceMatrix: false,
          details: false,
          actions: false
        }
      };

      // @ts-ignore - configureFromQuickBuilder exists but isn't in types
      storeLocator.configureFromQuickBuilder(configuration);
    };

    // Cleanup
    return () => {
      document.head.removeChild(apiLoader);
      if (script.parentNode) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainerRef}
        className="w-full h-[400px] rounded-sm overflow-hidden"
      />
    </div>
  );
};

export default GoogleMap;