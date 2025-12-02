import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice'
import { serverUrl } from '../App'

function useGetItemByCity() {
  const dispatch = useDispatch()
  const { currentCity } = useSelector(state => state.user)

  useEffect(() => {
    const fetchItems = async () => {
      if (!currentCity) return

      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-by-city/${currentCity}`)
        const shops = result.data || []

        // collect all items from all shops
        const allItems = shops.flatMap(shop => shop.items || [])
        dispatch(setItemsInMyCity(allItems))

        console.log("Suggested food items:", allItems) // debug
      } catch (error) {
        console.error("Error fetching suggested items:", error)
        dispatch(setItemsInMyCity([])) // clear on error
      }
    }

    fetchItems()
  }, [dispatch, currentCity])
}

export default useGetItemByCity
