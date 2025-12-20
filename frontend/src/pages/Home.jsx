import React from 'react'
import { useSelector } from 'react-redux'
import UserDashboard from '../components/UserDashboard'
import OwnerDashboard from '../components/OwnerDashboard'
import DeliveryBoy from '../components/DeliveryBoy'

// ✅ CALL HOOKS HERE
import useGetCity from '../hooks/useGetCity'
import useGetShopByCity from '../hooks/useGetShopByCity'
import useGetItemByCity from '../hooks/useGetItemByCity'

function Home() {
  const { userData } = useSelector(state => state.user)

  // 🔥 IMPORTANT
  useGetCity()
  useGetShopByCity()
  useGetItemByCity()

  if (!userData) return null

  return (
    <div>
      {userData.role === "user" && <UserDashboard />}
      {userData.role === "owner" && <OwnerDashboard />}
      {userData.role === "deliveryBoy" && <DeliveryBoy />}
    </div>
  )
}

export default Home
