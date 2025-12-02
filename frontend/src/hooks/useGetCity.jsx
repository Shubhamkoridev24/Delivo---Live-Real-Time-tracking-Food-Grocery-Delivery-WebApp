import axios from "axios";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          // ✅ Store in mapSlice
          dispatch(setLocation({ lat: latitude, lon: longitude }));

          // ✅ Reverse geocoding
          const response = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
          );

          const result = response?.data?.results?.[0] || {};

          // ✅ Extract clean data
          const city = result.city || "";
          const state = result.state || "";
          const address =
            result.address_line2 ||
            result.address_line1 ||
            result.formatted ||
            "";

          console.log(result); // ✅ Fixed (was result.data)

          // ✅ Store in userSlice
          dispatch(setCurrentCity(city));
          dispatch(setCurrentState(state));
          dispatch(setCurrentAddress(address));

          // ✅ Store in mapSlice (for checkout input)
          dispatch(setAddress(address));
        } catch (error) {
          console.error(
            "Error fetching city:",
            error.response?.data || error.message
          );
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
      }
    );
  }, [userData]);
}

export default useGetCity;
