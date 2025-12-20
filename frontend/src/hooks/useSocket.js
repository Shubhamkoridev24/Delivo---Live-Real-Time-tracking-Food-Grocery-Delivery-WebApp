import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { socket } from "../socket";
import { addMyOrder, updateOrderStatus } from "../redux/userSlice";

const useSocket = () => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state.user.userData);

  useEffect(() => {
    if (!userData?._id) return;

    // 🔌 connect socket
    socket.connect();

    // 👤 join user room
    if (userData.role === "user") {
  socket.emit("user-join", userData._id);
}

if (userData.role === "owner") {
  socket.emit("owner-join", userData._id);
}

    // 🆕 new order (COD / online both)
    socket.on("newOrder", (order) => {
      dispatch(addMyOrder(order));
    });

    // 🔄 order status update
    socket.on("orderStatusUpdated", (payload) => {
      console.log("📡 LIVE STATUS UPDATE:", payload);
      dispatch(updateOrderStatus(payload));
    });

    
    return () => {
      socket.off("newOrder");
      socket.off("orderStatusUpdated");
    //   socket.disconnect();
    };
  }, [userData?._id]);
};

export default useSocket;
