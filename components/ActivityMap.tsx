import Colors from "@/constants/colors";
import MapView, { Polyline } from "react-native-maps";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface ActivityMapProps {
  location: Coordinate;
  path: Coordinate[];
  isTracking: boolean;
}

export default function ActivityMap({ location, path, isTracking }: ActivityMapProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      region={{
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      showsUserLocation
      showsMyLocationButton
      followsUserLocation={isTracking}
    >
      {path.length > 1 && (
        <Polyline
          coordinates={path}
          strokeColor={Colors.primary}
          strokeWidth={4}
        />
      )}
    </MapView>
  );
}
