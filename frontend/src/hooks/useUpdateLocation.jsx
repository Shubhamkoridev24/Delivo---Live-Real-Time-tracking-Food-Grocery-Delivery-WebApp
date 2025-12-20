import { useEffect } from "react"
import axios from "axios"
import { useSelector } from "react-redux"
import { serverUrl } from "../App"

function useUpdateLocation() {
  const userData = useSelector(state => state.user.userData)

  useEffect(() => {
    if (!userData) return

    const watcher = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await axios.post(
            `${serverUrl}/api/user/update-location`,
            {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            },
            { withCredentials: true }
          )
        } catch (err) {
          console.error("Location update failed")
        }
      },
      () => {},                 // ❌ ignore error
      { enableHighAccuracy: false }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [userData])
}

export default useUpdateLocation
