import React, { useEffect, useState } from 'react';
import Nav from './Nav';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import DeliveryBoyTracking from './DeliveryBoyTracking';
import { socket } from "../socket";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import ClipLoader from 'react-spinners/ClipLoader';

function DeliveryBoy() {
  const { userData } = useSelector(state => state.user);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [currentOrder, setCurrentOrder] = useState()
  const [showOtpBox, setShowOtpBox] = useState(false)
  const [otp, setOtp] = useState("")
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const getAssignments = async () => {
    console.log("🔹 Fetching assignments for delivery boy:", userData?._id);

    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true });
      console.log("✅ Assignments fetched:", result.data);

      // Debug: check for null orders
      const nullOrders = result.data.filter(a => !a.orderId || !a.items);
      if (nullOrders.length > 0) {
        console.warn("⚠️ Some assignments have missing order or items:", nullOrders);
      }

      setAvailableAssignments(result.data);
    } catch (error) {
      console.error("❌ ASSIGNMENT FETCH ERROR:", error.message, error.response?.data);
    }
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true });
      setCurrentOrder(result.data)

      // setAvailableAssignments(result.data);
    } catch (error) {
      console.error("❌ current FETCH ERROR:", error);
    }
  }

  const acceptOrder = async (assignmentId) => {
    console.log("🔹 Attempting to accept order with assignmentId:", assignmentId);

    try {
      const result = await axios.post(
        `${serverUrl}/api/order/accept-order/${assignmentId}`,
        {},
        { withCredentials: true }
      );
      console.log("✅ Order accepted:", result.data);
      await getCurrentOrder()
      // Refresh assignments
      getAssignments();
    } catch (error) {
      console.error("❌ ACCEPT ORDER ERROR:", error.message, error.response?.data);
    }
  };


  const sendOtp = async () => {
    setLoading(true)
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/send-delivery-otp`,
        {
          orderId: currentOrder?._id,
          shopOrderId: currentOrder?.shopOrder?._id
        },
        { withCredentials: true }
      );
      setLoading(false)
      setShowOtpBox(true);
      console.log(result.data);

    } catch (error) {
      console.log("SEND OTP ERROR:", error.response?.data || error);
      setLoading(false)
    }
  };

  const verifyOtp = async () => {
    setMessage("")
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/verify-delivery-otp`,
        {
          orderId: currentOrder?._id,
          shopOrderId: currentOrder?.shopOrder?._id,
          otp
        },
        { withCredentials: true }
      );

      console.log("OTP SUCCESS:", result.data);
      setMessage(result.data.message)


      location.reload()
      // setCurrentOrder(null);
      // setShowOtpBox(false);
      // setOtp("");
      // await handleTodayDeliveries();
      // await getAssignments();
    } catch (error) {
      console.log("VERIFY OTP ERROR:", error.response?.data || error);
    }
  };
  const handleTodayDeliveries = async () => {

    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-today-deliveries`,

        { withCredentials: true }
      );

      console.log(result.data);
      setTodayDeliveries(result.data.stats)
    } catch (error) {
      console.log(error.response?.data || error);
    }
  };
  useEffect(() => {
    if (!userData?._id) return;

    socket.connect();
    socket.emit("deliveryboy-join", userData._id);

    socket.on("newDeliveryAssignment", () => {
      console.log("📡 Live assignment received");
      getAssignments();
    });

    return () => {
      socket.off("newDeliveryAssignment");
    };
  }, [userData?._id]);


  useEffect(() => {
    if (!currentOrder?._id) return;

    socket.emit("join-order-room", currentOrder._id);
    console.log("🚚 Delivery boy joined order room:", currentOrder._id);
  }, [currentOrder?._id]);

  useEffect(() => {
    if (!currentOrder?._id) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // 🔥 UPDATE LOCAL STATE
        setLiveLocation({ lat, lon });

        // 🔥 SEND TO SERVER
        socket.emit("delivery-location-update", {
          orderId: currentOrder._id,
          lat,
          lon
        });
      },
      (err) => console.error("GPS error:", err),
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentOrder?._id]);


  useEffect(() => {
    if (userData) {
      console.log("📌 User data available, fetching assignments");
      getAssignments();
      getCurrentOrder();
      handleTodayDeliveries();
    }
  }, [userData]);


  const ratePerDelivery = 50
  const totalEarning = todayDeliveries.reduce((sum, d) => sum + d.count * ratePerDelivery, 0)


  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />

      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center mt-20'>

        {/* WELCOME CARD */}
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>
            Welcome, {userData?.fullName || "Delivery Partner"}
          </h1>

          {(liveLocation || userData?.location) && (
            <p className='text-[#ff4d2d]'>
              <span className='font-semibold'>Latitude: </span>
              {liveLocation?.lat || userData?.location?.coordinates?.[1]},
              <span className='font-semibold'> Longitude: </span>
              {liveLocation?.lon || userData?.location?.coordinates?.[0]}
            </p>
          )}

        </div>

        <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100'>
          <h1 className='text-lg font-bold mb-3 text-[#ff4d2d]'>Today Deliveries</h1>
          {todayDeliveries.length === 0 ? (
            <p className="text-center text-gray-400">
              No deliveries today yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={todayDeliveries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ff4d2d" />
              </BarChart>
            </ResponsiveContainer>
          )}


          <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
            <h1 className='text-xl font-semibold text-gray-800 mb-2'>Today's Earnings</h1>
            <span className='text-3xl font-bold text-green-600'> ₹{totalEarning}</span>

          </div>
        </div>

        {/* AVAILABLE ORDERS */}
        {!currentOrder && <div className="bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100">
          <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Orders</h1>

          <div className="space-y-4">
            {availableAssignments.length > 0 ? (
              availableAssignments.map((a, index) => (
                <div className='border rounded-lg p-4 flex justify-between items-center' key={index}>
                  <div>
                    <p className="text-sm font-semibold">{a?.shopName}</p>
                    <p className='text-sm text-gray-500'>
                      <span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress?.text || "N/A"}
                    </p>
                    <p className="text-xs text-gray-600">Order ID: {a.orderId}</p>
                    <p className='text-xs text-gray-400'>{a.items?.length || 0} items | {a.subtotal || 0}</p>
                  </div>
                  <button
                    className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600'
                    onClick={() => acceptOrder(a.assignmentId)}
                  >
                    Accept
                  </button>
                </div>
              ))
            ) : (
              <p className='text-gray-400 text-sm'>No Available Orders</p>
            )}
          </div>


        </div>}


        {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>

          <h2 className='text-lg font-bold mb-3'>📦Current Order</h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-semibold text-sm'>{currentOrder?.shopOrder.shop.name}</p>
            <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress.text}</p>
            <p className='text-xs text-gray-400'>{currentOrder.shopOrder.shopOrderItems.length} items | {currentOrder.shopOrder.subTotal}</p>
          </div>
          <DeliveryBoyTracking
            deliveryBoyLocation={{
              lat: liveLocation?.lat || userData?.location?.coordinates?.[1],
              lon: liveLocation?.lon || userData?.location?.coordinates?.[0],
            }}
            customerLocation={{
              lat: currentOrder?.deliveryAddress?.latitude,
              lon: currentOrder?.deliveryAddress?.longitude
            }}
          />



          {!showOtpBox ? <button className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md
hover:bg-green-600 active:scale-95 transition-all duration-200' onClick={sendOtp} disabled={loading}>
            {loading ? <ClipLoader size={20} color='white' /> : "Mark As Delivered"}
          </button> : <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
            <p className='text-sm font-semibold mb-2'>Enter Otp send to  <span className='text-orange-500'>{currentOrder.user.fullName}</span></p>
            <input type="text" className='w-full border px-3 rounded-lg py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400' placeholder='Enter OTP ' onChange={(e) => setOtp(e.target.value)} value={otp} />
            {message && <p className='text-center text-green-400'>{message}</p>}
            <button className='w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all' onClick={verifyOtp}>Submit OTP</button>
          </div>}
        </div>}


      </div>
    </div>
  );
}

export default DeliveryBoy;
