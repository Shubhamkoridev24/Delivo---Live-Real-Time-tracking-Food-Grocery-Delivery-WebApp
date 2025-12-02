import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { serverUrl } from "../App"
import { setShopsInMyCity } from "../redux/userSlice"

function useGetShopByCity() {
  const dispatch = useDispatch()
  const currentCity = useSelector(state => state.user.currentCity)

  useEffect(() => {
    if (!currentCity) return

    const fetchShops = async () => {
      try {
        console.log("Fetching shops for city:", currentCity) // debug
        const { data } = await axios.get(`${serverUrl}/api/shop/get-by-city/${currentCity}`)
        console.log("Shops received:", data) // debug
        dispatch(setShopsInMyCity(data || []))
      } catch (err) {
        console.log("Error fetching shops by city:", err)
        dispatch(setShopsInMyCity([]))
      }
    }

    fetchShops()
  }, [currentCity, dispatch])
}

export default useGetShopByCity
