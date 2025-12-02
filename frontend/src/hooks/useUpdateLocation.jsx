import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setLocation } from "../redux/mapSlice";
import { serverUrl } from "../App";

function useUpdateLocation() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData) return; // don't run until user logged in

    const updateLocation = async (lat, lon) => {
      try {
        const result = await axios.post(
          `${serverUrl}/api/user/update-location`,
          { latitude: lat, longitude: lon }, // ✅ FIXED BODY
          { withCredentials: true }
        );

        console.log("📍 Location updated:", result.data);

        // update Redux store
        dispatch(setLocation({ lat, lon }));

      } catch (error) {
        console.error("❌ Error updating location:", error.message);
      }
    };

    // watch user live location
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true }
    );

    // cleanup watcher when component unmount
    return () => navigator.geolocation.clearWatch(watcher);

  }, [userData, dispatch]);
}

export default useUpdateLocation;
