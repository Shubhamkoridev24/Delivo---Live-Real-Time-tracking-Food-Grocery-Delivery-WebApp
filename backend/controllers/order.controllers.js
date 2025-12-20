import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Item from "../models/item.model.js";
import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import dotenv from "dotenv";

// ✅ SOCKET HELPERS (FINAL)
// import { getIO, getUserSocketId } from "../socket.js";

dotenv.config();

/* ========================= PLACE ORDER ========================= */
export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!deliveryAddress?.text || !deliveryAddress?.latitude || !deliveryAddress?.longitude) {
      return res.status(400).json({ message: "Incomplete delivery address" });
    }

    /* ---------- GROUP ITEMS BY SHOP ---------- */
    const groupItemsByShop = {};

    for (const item of cartItems) {
      let shopId = item.shop || item.shopId || null;

      if (!shopId) {
        const itemId = item._id || item.id || item.item;
        if (itemId) {
          const itemDoc = await Item.findById(itemId).populate("shop");
          if (!itemDoc || !itemDoc.shop) {
            return res.status(400).json({
              message: `Item shop not found for itemId ${itemId}`
            });
          }
          shopId = itemDoc.shop._id.toString();

        }
      }

      if (!shopId) {
        return res.status(400).json({
          message: `Missing shopId for item '${item.name || "unknown"}'`
        });
      }

      if (!groupItemsByShop[shopId]) groupItemsByShop[shopId] = [];
      groupItemsByShop[shopId].push({
        item: item.item || item._id,   // ✅ ALWAYS PRODUCT ID
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      });

    }

    /* ---------- CREATE SHOP ORDERS ---------- */
    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) throw new Error(`Shop not found: ${shopId}`);

        const items = groupItemsByShop[shopId];
        const subTotal = items.reduce(
          (sum, i) => sum + Number(i.price) * Number(i.quantity),
          0
        );

        return {
          shop: shop._id,
          owner: shop.owner._id,
          subTotal,
          shopOrderItems: items.map(i => ({
            item: i.item,
            price: i.price,
            quantity: i.quantity,
            name: i.name,
            image: i.image
          }))
        };
      })
    );

    /* ---------- SAVE ORDER ---------- */
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
      payment: paymentMethod === "cod"
    });

    /* ================= SOCKET EMIT ================= */
    /* ================= SOCKET EMIT ================= */
    /* ================= SOCKET EMIT ================= */
    const io = req.app.get("io");

    // 🔁 Populate order before emitting
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("user", "fullName email mobile")
      .populate("shopOrders.shop", "name");


    // USER → live order
    io.to(`user_${req.userId}`).emit("newOrder", populatedOrder);

    // OWNER(s) → live order
    populatedOrder.shopOrders.forEach(shopOrder => {
      io.to(`owner_${shopOrder.owner}`).emit("newOrder", {
        _id: populatedOrder._id,
        paymentMethod: populatedOrder.paymentMethod,
        user: populatedOrder.user,          // ✅ NOW FULL USER OBJECT
        shopOrders: shopOrder,
        createdAt: populatedOrder.createdAt,
        deliveryAddress: populatedOrder.deliveryAddress
      });
    });



    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder._id
    });

  } catch (error) {
    console.error("placeOrder error:", error);
    return res.status(500).json({
      message: `place order error ${error.message}`
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
        const io = req.app.get("io");

    const { orderId, shopId } = req.params;
    let { status } = req.body;

    if (status === "out of delivery") status = "out for delivery";

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const shopOrder = order.shopOrders.find(
      so => so.shop.toString() === shopId
    );
    if (!shopOrder) {
      return res.status(404).json({ message: "Shop order not found" });
    }

    shopOrder.status = status;

    let availableBoys = [];

    if (status === "out for delivery") {

      const allDeliveryBoys = await User.find({ role: "deliveryBoy" })
        .select("_id fullName mobile");

      const busyAssignments = await DeliveryAssignment.find({
        status: "assigned"
      }).select("assignedTo");

      const busyBoyIds = new Set(
        busyAssignments.map(a => a.assignedTo.toString())
      );

      availableBoys = allDeliveryBoys.filter(
        boy => !busyBoyIds.has(boy._id.toString())
      );

      for (const boy of availableBoys) {

        const assignment = await DeliveryAssignment.create({
          order: order._id,
          shopOrderId: shopOrder._id,
          broadcastedTo: boy._id,
          status: "broadcasted"
        });

        // 🔥 LIVE EMIT TO DELIVERY BOY
        io.to(`deliveryBoy_${boy._id}`).emit("newDeliveryAssignment", {
          assignmentId: assignment._id
        });
      }

    }

    await order.save();


    io.to(`user_${order.user}`).emit("orderStatusUpdated", {
      orderId,
      shopId,
      status
    });

    io.to(`owner_${shopOrder.owner}`).emit("orderStatusUpdated", {
      orderId,
      shopId,
      status
    });

    return res.json({
      success: true,
      status,
      availableBoys
    });

  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ message: error.message });
  }
};



// ---------------------- GET MY ORDERS ----------------------
export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("user", "fullName email mobile");

      return res.status(200).json(orders);
    }

    if (user.role === "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("user", "fullName email mobile");

      const filtered = orders.map(order => {
        const shopOrder = order.shopOrders.find(
          o => String(o.owner) === String(req.userId)
        );

        return {
          _id: order._id,
          paymentMethod: order.paymentMethod,
          user: order.user,
          shopOrders: shopOrder,
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress
        };
      });

      return res.status(200).json(filtered);
    }

    return res.status(400).json({ message: "Invalid role" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ---------------------- DELIVERY BOY ASSIGNMENT ----------------------
export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    const deliveryBoyId = req.userId;

    const assignments = await DeliveryAssignment.find({
      broadcastedTo: deliveryBoyId,
      status: { $in: ["broadcasted", "assigned"] }
    })
      .populate({
        path: "order",
        populate: [
          { path: "shopOrders.shop", select: "name" },
          { path: "shopOrders.shopOrderItems.item", select: "name image price" },
          { path: "shopOrders.assignedDeliveryBoy", select: "fullName mobile" }
        ]
      });

    const formatted = assignments
      .filter(a => a.order)
      .map(a => {
        const shopOrder = a.order.shopOrders.find(
          so => so._id.toString() === a.shopOrderId.toString()
        );

        return {
          assignmentId: a._id,
          orderId: a.order._id,
          shopName: shopOrder?.shop?.name || "Unknown",
          deliveryAddress: a.order?.deliveryAddress || {},
          items: shopOrder?.shopOrderItems || [],
          subtotal: shopOrder?.subTotal || 0
        };
      });

    return res.status(200).json(formatted);

  } catch (error) {
    return res.status(500).json({ message: `get assignment error: ${error.message}` });
  }
};



// ---------------------- ACCEPT ORDER ----------------------
export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params
    const assignment = await DeliveryAssignment.findById(assignmentId)
    if (!assignment) return res.status(400).json({ message: "assignment not found" });

    if (assignment.status !== "broadcasted") return res.status(400).json({ message: "assignment is expired" });

    const alreadyAssigned = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned"
    });

    if (alreadyAssigned) return res.status(400).json({ message: "You are already assigned to another active order" });

    assignment.assignedTo = req.userId;
    assignment.status = 'assigned';
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = await Order.findById(assignment.order);
    if (!order) return res.status(400).json({ message: "order not found" });

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    shopOrder.assignedDeliveryBoy = req.userId;
    await order.save();

    return res.status(200).json({ message: 'order accepted' });

  } catch (error) {
    return res.status(500).json({ message: `accept order error: ${error.message}` });
  }
};


// ---------------------- CURRENT ORDER ----------------------
export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned"
    })
      .populate("shop", "name")
      .populate("assignedTo", "fullName email mobile location")
      .populate({
        path: "order",
        populate: [{ path: "user", select: "fullName email location mobile" }]
      });

    if (!assignment) {
      return res.status(400).json({ message: "assignment not found" });
    }

    const shopOrder = assignment.order.shopOrders.find(
      so => String(so._id) === String(assignment.shopOrderId)
    );

    const deliveryBoyLocation = { lat: null, lon: null };
    if (assignment.assignedTo.location.coordinates.length == 2) {
      deliveryBoyLocation.lat = assignment.assignedTo.location.coordinates[1];
      deliveryBoyLocation.lon = assignment.assignedTo.location.coordinates[0];
    }

    let customerLocation = { lat: null, lon: null };
    if (assignment.order.deliveryAddress) {
      customerLocation.lat = assignment.order.deliveryAddress.latitude;
      customerLocation.lon = assignment.order.deliveryAddress.longitude;
    }

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress,
      deliveryBoyLocation,
      customerLocation
    });

  } catch (error) {
    return res.status(500).json({ message: `current order error ${error}` });
  }
};


// ---------------------- GET ORDER BY ID ----------------------
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate("user")
      .populate({
        path: "shopOrders.shop",
        model: "Shop"
      })
      .populate({
        path: "shopOrders.assignedDeliveryBoy",
        model: "User"
      })
      .populate({
        path: "shopOrders.shopOrderItems.item",
        model: "Item"
      })
      .lean();

    if (!order) {
      return res.status(400).json({ message: "order not found" });
    }
    return res.status(200).json(order);

  } catch (error) {
    return res.status(500).json({ message: `get by id order error ${error}` });
  }
};


// ---------------------- SEND DELIVERY OTP ----------------------
export const sendDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId } = req.body;

    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderId" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    shopOrder.deliveryOtp = otp;
    shopOrder.otpExpires = Date.now() + 5 * 60 * 1000;
    await order.save();

    await sendDeliveryOtpMail(order.user, otp);

    return res.status(200).json({ message: `Otp sent Successfully` });

  } catch (error) {
    return res.status(500).json({ message: `delivery otp error ${error}` });
  }
};


// ---------------------- VERIFY DELIVERY OTP ----------------------
export const verifyDeliveryOtp = async (req, res) => {
  try {
    const { orderId, shopOrderId, otp } = req.body;

    const order = await Order.findById(orderId).populate("user");
    const shopOrder = order.shopOrders.id(shopOrderId);

    if (!order || !shopOrder) {
      return res.status(400).json({ message: "enter valid order/shopOrderId" });
    }

    if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid/Expired Otp" });
    }

    shopOrder.status = "delivered";
    shopOrder.deliveredAt = Date.now();
    await order.save();
    const io = getIO();

    // USER
    const userSocketId = getUserSocketId(order.user._id.toString());
    if (userSocketId) {
      io.to(userSocketId).emit("orderStatusUpdated", {
        orderId: order._id,
        shopOrderId,
        status: "delivered"
      });
    }

    // OWNER
    io.to(`owner_${shopOrder.owner}`).emit("orderStatusUpdated", {
      orderId: order._id,
      shopOrderId,
      status: "delivered"
    });


    await DeliveryAssignment.deleteOne({
      shopOrderId: shopOrder._id,
      order: order._id,
      assignedTo: shopOrder.assignedDeliveryBoy
    });

    return res.status(200).json({ message: "order delivered successfully!" });

  } catch (error) {
    return res.status(400).json({ message: "verify delivery otp error" });
  }
};
