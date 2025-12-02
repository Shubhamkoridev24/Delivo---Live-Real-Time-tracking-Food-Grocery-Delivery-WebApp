import React, { useEffect, useState } from "react";
import Nav from "./Nav";
import { useDispatch, useSelector } from "react-redux";
import { FaUtensils, FaPen } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { setMyShopData } from "../redux/ownerSlice";
import axios from "axios";
import { serverUrl } from "../App";
import OwnerItemCard from "./ownerItemCard";

function OwnerDashboard() {
  const { myShopData } = useSelector((state) => state.owner);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-my`, { withCredentials: true });
        const shop = result.data || null;
        if (shop && Object.keys(shop).length > 0) {
          dispatch(setMyShopData(shop));
        }
      } catch (err) {
        console.log("Error fetching shop:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [dispatch]);

  if (loading)
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const shopExists = myShopData && myShopData.name;

return (
  <div className="w-full min-h-screen bg-[#fff9f6] flex flex-col items-center">
    <Nav />

    {!shopExists ? (
      <div className="flex justify-center items-center flex-1 mt-20">
        <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 text-center max-w-xs sm:max-w-sm">
          <FaUtensils className="text-[#ff4d2d] w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Add Your Restaurant</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Join our food delivery platform and reach thousands of hungry customers every day.
          </p>
          <button
            className="bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 mt-4 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200"
            onClick={() => navigate("/create-edit-shop")}
          >
            Get Started
          </button>
        </div>
      </div>
    ) : (
      <div className="w-full flex flex-col items-center gap-12 px-4 sm:px-6 mt-20 pb-8">
        {/* Shop Header */}
        <h1 className="text-3xl sm:text-4xl text-gray-900 flex flex-col sm:flex-row items-center gap-4 text-center">
          <FaUtensils className="text-[#ff4d2d] w-16 h-16" />
          <span>Welcome to {myShopData.name}</span>
        </h1>

        {/* Shop Card */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-orange-100 hover:shadow-2xl transition-all duration-300 w-full max-w-3xl relative mb-6">
          <div
            className="absolute top-4 right-4 bg-[#ff4d2d] text-white p-2 rounded-full shadow-md hover:bg-orange-600 transition-colors cursor-pointer"
            onClick={() => navigate("/create-edit-shop")}
          >
            <FaPen />
          </div>
          <img
            src={myShopData.image}
            alt={myShopData.name}
            className="w-full h-48 sm:h-64 object-cover"
          />
          <div className="p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{myShopData.name}</h1>
            <p className="text-gray-500">{myShopData.city}, {myShopData.state}</p>
            <p className="text-gray-500 mb-4">{myShopData.address}</p>
          </div>
        </div>

        {/* Add Food Item Section */}
        {myShopData.items.length === 0 && (
          <div className="flex justify-center items-center w-full ">
            <div className="bg-white shadow-md rounded-xl p-6 sm:p-8 border border-gray-100 hover:shadow-lg transition-all duration-300 text-center max-w-xs sm:max-w-sm">
              <FaUtensils className="text-[#ff4d2d] w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3" />
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">Add Your Restaurant</h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Join our food delivery platform and reach thousands of hungry customers every day.
              </p>
              <button
                className="bg-[#ff4d2d] text-white px-5 sm:px-6 py-2 mt-4 rounded-full font-medium shadow-md hover:bg-orange-600 transition-colors duration-200"
                onClick={() => navigate("/add-item")}
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </div>
    )}

    {myShopData.items.length > 0 && (
      <div className="flex flex-col items-center gap-6 w-full max-w-3xl mt-10 pb-12">
        {myShopData.items.map((item, index) => (
          <OwnerItemCard data={item} key={index} />
        ))}
      </div>
    )}
  </div>
);

}

export default OwnerDashboard;
