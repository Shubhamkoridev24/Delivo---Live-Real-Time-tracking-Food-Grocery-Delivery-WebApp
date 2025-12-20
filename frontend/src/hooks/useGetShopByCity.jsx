import axios from "axios"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { serverUrl } from "../App"
import { setShopsInMyCity } from "../redux/userSlice"

function useGetShopByCity() {
  const dispatch = useDispatch()
  const city = useSelector(state => state.user.city)

  useEffect(() => {
    if (!city || city.trim() === "") return

    const fetchShops = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${encodeURIComponent(city)}`,
          { withCredentials: true }
        )

        dispatch(setShopsInMyCity(res.data || []))
      } catch (err) {
        console.error("City shop error:", err)
        dispatch(setShopsInMyCity([]))
      }
    }

    fetchShops()
  }, [city, dispatch])
}

export default useGetShopByCity
