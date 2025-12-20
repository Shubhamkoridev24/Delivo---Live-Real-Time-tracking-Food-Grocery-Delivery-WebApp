import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyShopData } from "../redux/ownerSlice";
import { serverUrl } from "../App";

function useGetMyShop() {
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);

  useEffect(() => {
    // ✅ ONLY OWNER
    if (!userData || userData.role !== "owner") {
      dispatch(setMyShopData(null));
      return;
    }

    const fetchShop = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/get-my`,
          { withCredentials: true }
        );

        dispatch(setMyShopData(result.data || null));
      } catch (error) {
        console.error("Error fetching shop:", error.message);
        dispatch(setMyShopData(null));
      }
    };

    fetchShop();
  }, [userData?._id]);

}

export default useGetMyShop;
