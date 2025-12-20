import React, { useState } from 'react'
import { MdPhone } from "react-icons/md";
import { serverUrl } from '../App';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';

function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([])

  const [orderStatus, setOrderStatus] = useState(data?.shopOrders?.status || "pending")
  const dispatch = useDispatch()

  const handleUpdateStatus = async (orderId, shopId, status) => {
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true }
      )
      dispatch(updateOrderStatus({ orderId, shopId, status }))
      setAvailableBoys(result.data.availableBoys || [])
      if (result.data.success) {
        setOrderStatus(status) // UI update
      }
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
      {/* User Info */}
      <div>
        <h2 className='text-lg font-semibold text-gray-800'>{data?.user?.fullName || "User name not available"}</h2>
        <p className='text-sm text-gray-500'>{data?.user?.email || "Email not available"}</p>
        <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
          <MdPhone /><span>{data?.user?.mobile || "N/A"}</span>
        </p>
      </div>

      {/* Delivery Address */}
      <div className='flex items-start flex-col gap-2 text-gray-600 text-sm'>
        <p>{data?.deliveryAddress?.text}</p>
        <p>Lat: {data?.deliveryAddress?.latitude}, Lon: {data?.deliveryAddress?.longitude}</p>
      </div>

      {/* Items */}
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {data?.shopOrders?.shopOrderItems?.map((item, index) => (
          <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
            <img
              src={item?.image || item?.item?.image}
              alt={item?.name || item?.item?.name}
              className="w-full h-24 object-cover rounded"
            />
            <p className='text-sm font-semibold mt-1'>
              {item?.name || item?.item?.name}
            </p>
            <p className='text-xs text-gray-500'>
              Qty: {item?.quantity} x ₹{item?.price}
            </p>
          </div>
        ))}
      </div>

      {/* Status Update */}
      <div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
        <span className='text-sm'>
          status: <span className='font-semibold capitalize text-[#ff4d2d]'>{orderStatus}</span>
        </span>

        <select
          className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]'
          value={orderStatus}
          onChange={(e) =>
            handleUpdateStatus(
              data?._id,                          // ORDER ID
              data?.shopOrders?.shop?._id,        // ✅ REAL SHOP ID
              e.target.value
            )
          }

        >
          <option value="">Change</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="out for delivery">Out for Delivery</option>
        </select>
      </div>

      {/* Delivery Boys */}
      {/* Delivery Boys Section */}
{(orderStatus === "out for delivery" || orderStatus === "out for delivery") && (
  <div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50">

    {/* Assigned */}
    {data?.shopOrders?.assignedDeliveryBoy ? (
      <>
        <p className="font-semibold mb-1">Assigned Delivery Boy:</p>
        <p>
          {data.shopOrders.assignedDeliveryBoy.fullName} –{" "}
          {data.shopOrders.assignedDeliveryBoy.mobile}
        </p>
      </>
    ) : availableBoys.length > 0 ? (
      <>
        <p className="font-semibold mb-1">Available Delivery Boys:</p>
        {availableBoys.map((b, index) => (
          <p key={b._id || index}>
            {b.fullName} – {b.mobile}
          </p>
        ))}
      </>
    ) : (
      <p>Waiting for delivery boy to accept</p>
    )}

  </div>
)}


      {/* Total */}
      <div className='text-right font-bold text-gray-800 text-sm'>
        Total: ₹{
          data?.shopOrders?.subTotal ??
          data?.shopOrders?.shopOrderItems?.reduce(
            (sum, i) => sum + (Number(i.price) * Number(i.quantity)),
            0
          ) ??
          0
        }
      </div>

    </div>
  )
}

export default OwnerOrderCard
