import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'
import { serverUrl } from '../App'

function useGetItemByCity() {
  const dispatch = useDispatch()
  const city = useSelector(state => state.user.city)

  useEffect(() => {
    if (!city || city.trim() === "") return

    const fetchItems = async () => {
      try {
        // 🔥 backend se SHOPS lao (items direct ka route nahi hai)
        const res = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${encodeURIComponent(city)}`
        )

        const shops = res.data || []

        // 🔥 saare shops ke items combine karo
        const allItems = shops.flatMap(shop => shop.items || [])

        dispatch(setItemsInMyCity(allItems))
      } catch (err) {
        console.error("Item fetch error:", err)
        dispatch(setItemsInMyCity([]))
      }
    }

    fetchItems()
  }, [city, dispatch])
}

export default useGetItemByCity
