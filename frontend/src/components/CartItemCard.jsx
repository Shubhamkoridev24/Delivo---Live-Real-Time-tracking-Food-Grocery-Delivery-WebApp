import React from "react";
import { FaMinus, FaPlus } from "react-icons/fa";
import { CiTrash } from "react-icons/ci";
import { useDispatch } from "react-redux";
import { removeCartItem, updateQuantity } from "../redux/userSlice";

function CartItemCard({ data }) {
  const dispatch = useDispatch();

  const increase = () => {
    dispatch(updateQuantity({
      _id: data._id,
      quantity: data.quantity + 1
    }));
  };

  const decrease = () => {
    if (data.quantity > 1) {
      dispatch(updateQuantity({
        _id: data._id,
        quantity: data.quantity - 1
      }));
    }
  };

  const remove = () => {
    dispatch(removeCartItem(data._id));
  };

  return (
    <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow border">
      <div className="flex items-center gap-4">
        <img
          src={data.image}
          alt=""
          className="w-20 h-20 object-cover rounded-lg border"
        />
        <div>
          <h1 className="font-medium text-gray-800">{data.name}</h1>
          <p className="text-sm text-gray-500">
            ₹{data.price} × {data.quantity}
          </p>
          <p className="font-bold text-gray-900">
            ₹ {data.price * data.quantity}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={decrease} className="p-2 bg-gray-200 rounded-full">
          <FaMinus size={12} />
        </button>

        <span className="font-semibold">{data.quantity}</span>

        <button onClick={increase} className="p-2 bg-gray-200 rounded-full">
          <FaPlus size={12} />
        </button>

        <button onClick={remove} className="p-2 bg-red-100 text-red-600 rounded-full">
          <CiTrash size={18} />
        </button>
      </div>
    </div>
  );
}

export default CartItemCard;
