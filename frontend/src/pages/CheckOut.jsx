  import React, { useEffect, useState } from 'react'

  import { IoIosArrowRoundBack } from "react-icons/io";
  import { useNavigate } from 'react-router-dom';
  import { IoLocationSharp } from 'react-icons/io5';
  import { IoSearchOutline } from "react-icons/io5";
  import { TbCurrentLocation } from "react-icons/tb";
  import { useDispatch, useSelector } from 'react-redux';
  import "leaflet/dist/leaflet.css";
  import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
  import { setAddress, setLocation } from '../redux/mapSlice';
  import axios from 'axios';
  import { MdDeliveryDining } from "react-icons/md";
  import { FaMobileScreenButton } from "react-icons/fa6";
  import { FaCreditCard } from "react-icons/fa";
  import { serverUrl } from '../App';
  import { addMyOrder } from '../redux/userSlice';
  import PayPalButton from "../components/PayPalButton";   // keep as-is

  function RecenterMap({ location }) {
    if (location?.lat && location?.lon) {
      const map = useMap()
      map.setView([location.lat, location.lon], 16, { animate: true })
    }
    return null
  }

  function CheckOut() {
    const navigate = useNavigate()
    const apiKey = import.meta.env.VITE_GEOAPIKEY;
    const dispatch = useDispatch();
    const { location, address } = useSelector(state => state.map)
    const { cartItems = [], totalAmount = 0, userData } = useSelector(state => state.user)

    const [addressInput, setAddressInput] = useState("")
    const [paymentMethod, setPAymentMethod] = useState("cod")
    const [localOrderId, setLocalOrderId] = useState(null)

    const deliveryFee = totalAmount > 500 ? 0 : 40
    const AmountWithDeliveryFee = (Number(totalAmount) || 0) + deliveryFee

    const onDragEnd = (e) => {
      try {
        // safer access to lat/lng depending on event shape
        const latlng = e?.target?.getLatLng ? e.target.getLatLng() : e?.target?._latlng
        const lat = latlng?.lat ?? latlng?.lat
        const lng = latlng?.lng ?? latlng?.lng ?? latlng?.lng
        if (lat == null || lng == null) return
        dispatch(setLocation({ lat, lon: lng }))
        getAddressByLatLng(lat, lng)
      } catch (err) {
        console.error("onDragEnd error", err)
      }
    };

    const getCurrentLocation = () => {
      try {
        if (!userData?.location?.coordinates) {
          // fallback to browser geolocation
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
              const latitude = pos.coords.latitude
              const longitude = pos.coords.longitude
              dispatch(setLocation({ lat: latitude, lon: longitude }))
              getAddressByLatLng(latitude, longitude)
            }, (err) => {
              console.log("Geolocation error", err)
            })
          }
          return
        }

        const latitude = userData.location.coordinates[1]
        const longitude = userData.location.coordinates[0]
        dispatch(setLocation({ lat: latitude, lon: longitude }))
        getAddressByLatLng(latitude, longitude)
      } catch (err) {
        console.error("getCurrentLocation error:", err)
      }
    }

    const getAddressByLatLng = async (lat, lng) => {
      try {
        if (lat == null || lng == null) return
        const response = await axios.get(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`
        );
        const addr = response?.data?.results?.[0]?.address_line2 || response?.data?.results?.[0]?.formatted || "Unknown Location";
        dispatch(setAddress(addr));
        setAddressInput(addr);
      } catch (error) {
        console.log("getAddressByLatLng error:", error)
      }
    }

    const getLatLngByAddress = async () => {
      try {
        if (!addressInput) return
        const result = await axios.get(`https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`)
        const props = result?.data?.features?.[0]?.properties
        if (props && props.lat && props.lon) {
          dispatch(setLocation({ lat: props.lat, lon: props.lon }))
        } else {
          console.warn("No lat/lon returned for address")
        }
      } catch (error) {
        console.log("getLatLngByAddress error:", error)
      }
    }

    // ⭐ PLACE ORDER API CALL
    const handlePlaceOrder = async () => {
      // basic validation before calling API
      if (!addressInput || !location?.lat || !location?.lon) {
        alert("Please select a delivery location/address.")
        return
      }
      if (!cartItems || cartItems.length === 0) {
        alert("Your cart is empty.")
        return
      }

      // normalize cart items shape to ensure backend gets expected ids
      const normalizedCart = cartItems.map(ci => ({
        // keep both keys so backend can find either id or _id
        _id: ci._id ?? ci.id ?? ci.item ?? null,
        id: ci.id ?? ci._id ?? ci.item ?? null,
        name: ci.name,
        price: Number(ci.price) || 0,
        quantity: Number(ci.quantity) || 1,
        image: ci.image,
        shop: ci.shop
      }))

      try {
        console.log("Sending order payload:", {
          paymentMethod,
          deliveryAddress: { text: addressInput, latitude: location.lat, longitude: location.lon },
          totalAmount: AmountWithDeliveryFee, // send amount including delivery fee
          cartItems: normalizedCart
        })

        const result = await axios.post(`${serverUrl}/api/order/place-order`, {
          paymentMethod,
          deliveryAddress: {
            text: addressInput,
            latitude: location.lat,
            longitude: location.lon
          },
          totalAmount: AmountWithDeliveryFee,
          cartItems: normalizedCart
        }, { withCredentials: true })

        console.log("Place order response:", result?.data)

        // ⭐ COD
        if (paymentMethod === "cod") {
          // backend might return order object or { success, orderId } - adapt accordingly
          // if it's order object: dispatch(addMyOrder(result.data))
          // if it's wrapper: dispatch(addMyOrder(order))
          const payload = result.data?.order || result.data
          dispatch(addMyOrder(payload))
          return navigate("/order-placed")
        }

        // ⭐ ONLINE PAYMENT — create order; backend should return orderId or paypal data
        // store local id to show payment widget (PayPal)
        const orderId = result.data?.orderId || result.data?.id || result.data?.order?._id
        setLocalOrderId(orderId)

      } catch (error) {
        // print richer error info to console for debugging backend 500s
        console.error("placeOrder error:", {
          message: error.message,
          responseData: error?.response?.data,
          status: error?.response?.status
        })
        alert("Server error while placing the order. Check console for details.")
      }
    }

    useEffect(() => {
      setAddressInput(address || "")
    }, [address])

    // only render map when we have numeric center
    const hasLocation = location && typeof location.lat === "number" && typeof location.lon === "number"

    return (
      <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>
        <div className='absolute top-[20px] left-[20px] z-[10]' onClick={() => { navigate("/"); }}>
          <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
        </div>

        <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>
          <h1 className="text-2xl font-bold text-gray-800">Checkout</h1>

          <section>
            <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'><IoLocationSharp className='text-[#ff4d2d]' /> Delivery Location</h2>

            <div className='flex gap-2 mb-3'>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                placeholder='Enter your Delivery Address...'
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
              />
              <button className='bg-[#ff4d2d] hover:bg-[#e64526] text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getLatLngByAddress}><IoSearchOutline size={17} /></button>
              <button className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center justify-center' onClick={getCurrentLocation}><TbCurrentLocation size={17} /></button>
            </div>

            <div className='rounded-xl border overflow-hidden'>
              <div className="h-64 w-full flex items-center justify-center">
                {hasLocation ? (
                  <MapContainer className={'w-full h-full'} center={[location.lat, location.lon]} zoom={16}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterMap location={location} />
                    <Marker position={[location.lat, location.lon]} draggable eventHandlers={{ dragend: onDragEnd }} />
                  </MapContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">Map loading... select location</div>
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setPAymentMethod("cod")}>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100'><MdDeliveryDining className='text-green-600 text-xl' /></span>
                <div>
                  <p className='font-medium text-gray-800'>Cash on Delivery</p>
                  <p className='text-xs text-gray-500'>Pay When your food arrives</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${paymentMethod === "online" ? "border-[#ff4d2d] bg-orange-50 shadow" : "border-gray-200 hover:border-gray-300"}`} onClick={() => setPAymentMethod("online")}>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'><FaMobileScreenButton className='text-purple-700 text-lg' /></span>
                <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-purple-100'><FaCreditCard className='text-blue-700 text-lg' /></span>
                <div>
                  <p className='font-medium text-gray-800'>UPI / Credit / Debit Card</p>
                  <p className='text-xs text-gray-500'>Pay Securely Online</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>
            <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>
              {cartItems.map((item, index) => (
                <div key={index} className='flex justify-between text-sm text-gray-700'>
                  <span>{item.name} x {item.quantity}</span>
                  <span>₹ {item.price * item.quantity}</span>
                </div>
              ))}

              <hr className='border-gray-200 my-2' />
              <div className='flex justify-between font-medium text-gray-800'>
                <span>Subtotal</span>
                <span>{totalAmount}</span>
              </div>
              <div className='flex justify-between text-gray-700'>
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "Free" : deliveryFee}</span>
              </div>

              <div className='flex justify-between text-lg font-bold text-[#ff4d2d] pt-2'>
                <span>Total</span>
                <span>₹ {AmountWithDeliveryFee}</span>
              </div>
            </div>
          </section>

          <button className='w-full bg-[#ff4d2d] hover:bg-[#e64526] text-white py-3 rounded-xl font-semibold' onClick={handlePlaceOrder}>
            {paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"}
          </button>

          {/* show PayPalButton if online and we have localOrderId (optional) */}
          {paymentMethod === "online" && localOrderId && (
            <div className="mt-4">
              <PayPalButton
                amount={AmountWithDeliveryFee}
                orderLocalId={localOrderId}
                onSuccess={() => navigate("/order-placed")}
                onError={() => alert("Payment Failed")}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  export default CheckOut
