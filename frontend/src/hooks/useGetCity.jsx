import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setCity, setCurrentState, setCurrentAddress } from "../redux/userSlice"
import { setAddress, setLocation } from "../redux/mapSlice"

function useGetCity() {
  const dispatch = useDispatch()
  const apiKey = import.meta.env.VITE_GEOAPIKEY
  const city = useSelector(state => state.user.city)

  useEffect(() => {
    if (city) return

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          dispatch(setLocation({ lat: latitude, lon: longitude }))

          const res = await axios.get(
            "https://api.geoapify.com/v1/geocode/reverse",
            {
              params: {
                lat: latitude,
                lon: longitude,
                format: "json",
                apiKey
              }
            }
          )

          const result = res.data?.results?.[0] || {}

          dispatch(setCity(result.city || "Ahmedabad")) // ✅ fallback
          dispatch(setCurrentState(result.state || "Gujarat"))
          dispatch(setCurrentAddress(result.formatted || ""))

          dispatch(setAddress(result.formatted || ""))

        } catch (err) {
          console.error("City API error:", err.message)
          dispatch(setCity("Ahmedabad")) // fallback
        }
      },
      () => {
        // ❌ location fail → fallback city
        dispatch(setCity("Ahmedabad"))
      },
      {
        timeout: 5000,          // ✅ IMPORTANT
        enableHighAccuracy: false
      }
    )
  }, [city, dispatch, apiKey])
}

export default useGetCity
