import React from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";
import type { LiveVehicle } from "../../Types/Index";
import { renderToStaticMarkup } from "react-dom/server";
import { BsBusFrontFill } from "react-icons/bs";

// NOTE: The icon definitions have been moved from here...

interface GoogleMapProps {
  vehicles: LiveVehicle[];
  selectedVehicleNumber: string | null;
  onVehicleSelect: (vehicle_number: string) => void;
}

const GoogleMapDisplay: React.FC<GoogleMapProps> = ({
  vehicles,
  selectedVehicleNumber,
  onVehicleSelect,
}) => {
  const createIconFromReactIcon = (color: string, size: number) => {
    const iconMarkup = renderToStaticMarkup(
      <BsBusFrontFill color={color} size={size} />
    );
    const dataUrl = `data:image/svg+xml;base64,${btoa(iconMarkup)}`;

    return {
      url: dataUrl,
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size / 2, size / 2),
    };
  };

  const defaultIcon = createIconFromReactIcon("#007BFF", 32); // Blue, 32px
  const selectedIcon = createIconFromReactIcon("#8A2BE2", 42); // Purple, 42px

  const mapContainerStyle = {
    height: "100%",
    width: "100%",
  };
  // const centerPosition = { lat: 15.8497, lng: 74.4977 }; // Belagavi

  const centerPosition = vehicles.length > 0
    ? vehicles[0].gps
    : { lat: 15.8497, lng: 74.4977 }; // Fallback if no vehicles


  return (

    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={centerPosition}
      zoom={13}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
      }}
    >
      {vehicles.map((vehicle) => (
        <MarkerF
          key={vehicle.vehicle_number}
          position={vehicle.gps}
          icon={
            vehicle.vehicle_number === selectedVehicleNumber ? selectedIcon : defaultIcon
          }
          onClick={() => {
            onVehicleSelect(vehicle.vehicle_number);
          }}
        >
          {/* {vehicle.vehicle_number === selectedVehicleNumber && (
            <InfoWindowF
            
              position={vehicle.gps}
              onCloseClick={() => {
                onVehicleSelect(vehicle.vehicle_number);
              }}
            >
              <div className="">
                <h4 className="font-bold uppercase">{vehicle.vehicle_number}</h4>
                <p className="uppercase">{vehicle.gps.speed} km/h</p>
              </div>
            </InfoWindowF>
          )} */}
        </MarkerF>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapDisplay;
