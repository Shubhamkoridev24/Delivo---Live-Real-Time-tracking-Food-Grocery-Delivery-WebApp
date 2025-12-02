import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setMyShopData } from '../redux/ownerSlice'
import { serverUrl } from '../App'

function useGetMyShop() {
  const dispatch = useDispatch()
  const {userData}=useSelector(state=>state.user)

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, {
          withCredentials: true
        })

        const shop = result.data || null
        dispatch(setMyShopData(shop))  // even if null, clears previous shop
      } catch (error) {
        console.error("Error fetching shop:", error)
        dispatch(setMyShopData(null))  // clear state on error
      }
    }

    fetchShop()
  }, [userData])
}

export default useGetMyShop
