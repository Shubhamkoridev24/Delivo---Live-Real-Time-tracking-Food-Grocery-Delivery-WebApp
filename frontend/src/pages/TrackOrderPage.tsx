import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../App'
import { IoIosArrowRoundBack } from 'react-icons/io'
import DeliveryBoyTracking from '../components/DeliveryBoyTracking'

function TrackOrderPage() {
    const { orderId } = useParams();
    const [currentOrder, setCurrentOrder] = useState(null);
    const navigate = useNavigate();

    const handleGetOrder = async () => {
        try {
            const result = await axios.get(
                `${serverUrl}/api/order/get-order-by-id/${orderId}`,
                { withCredentials: true }
            );
            setCurrentOrder(result.data);
            console.log("TRACK ORDER:", result.data);
        } catch (error) {
            console.log("TRACK ERROR:", error.response?.data || error);
        }
    };

    useEffect(() => {
        if (orderId) handleGetOrder();
    }, [orderId]);

    return (
        <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">

            {/* BACK BUTTON */}
            <div
                className="relative flex items-center gap-4 top-[20px] left-[20px] 
                z-[10] mb-[10px] cursor-pointer"
                onClick={() => navigate("/")}
            >
                <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
                <h1 className="text-2xl font-bold md:text-center">Track Order</h1>
            </div>

            {/* If order not loaded yet */}
            {!currentOrder && (
                <p className="text-center text-gray-500 mt-10">Loading order...</p>
            )}

            {/* ORDER DETAILS */}
            {currentOrder?.shopOrders?.map((shopOrder, index) => {
                const deliveryBoy = shopOrder?.assignedDeliveryBoy;

                return (
                    <div
                        className="bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4"
                        key={index}
                    >
                        {/* SHOP INFO */}
                        <div>
                            <p className="text-lg font-bold mb-2 text-[#ff4d2d]">
                                {shopOrder?.shop?.name || "Shop Name"}
                            </p>

                            {/* ITEMS */}
                            <p className="font-semibold">
                                <span>Items: </span>
                                {shopOrder?.shopOrderItems
                                    ?.map(i => i?.name || i?.item?.name)
                                    .join(", ")}
                            </p>

                            {/* FIXED — SUBTOTAL (your DB uses subTotal not subtotal) */}
                            <p className="mt-2">
                                <span className="font-semibold">Subtotal: </span>
                                ₹{shopOrder?.subTotal || shopOrder?.subtotal || 0}
                            </p>

                            {/* DELIVERY ADDRESS */}
                            <p className="mt-6">
                                <span className="font-semibold">Delivery Address: </span>
                                {currentOrder?.deliveryAddress?.text}
                            </p>
                        </div>

                        {/* DELIVERY BOY DETAILS */}
                        {shopOrder?.status !== "delivered" ? (
                            deliveryBoy ? (
                                <div className="text-sm text-gray-700">
                                    <p className="font-semibold">
                                        <span>Delivery Boy Name: </span>
                                        {deliveryBoy?.fullName}
                                    </p>
                                    <p className="font-semibold">
                                        <span>Contact No: </span>
                                        {deliveryBoy?.mobile}
                                    </p>
                                </div>
                            ) : (
                                <p className="font-semibold">
                                    Delivery Boy is not assigned yet.
                                </p>
                            )
                        ) : (
                            <p className="text-green-600 font-semibold text-lg">
                                Delivered
                            </p>
                        )}

                        {/* MAP TRACKING */}
                        {deliveryBoy?.location && (
                            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
                                <DeliveryBoyTracking
                                    deliveryBoyLocation={{
                                        lat:
                                            deliveryBoy?.location?.coordinates?.[1] ||
                                            currentOrder?.deliveryAddress?.latitude,
                                        lon:
                                            deliveryBoy?.location?.coordinates?.[0] ||
                                            currentOrder?.deliveryAddress?.longitude,
                                    }}
                                    customerLocation={{
                                        lat: currentOrder?.deliveryAddress?.latitude,
                                        lon: currentOrder?.deliveryAddress?.longitude
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default TrackOrderPage;
