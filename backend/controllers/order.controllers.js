import Shop from "../models/shop.model.js";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Item from "../models/item.model.js";   

import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import { sendDeliveryOtpMail } from "../utils/mail.js";
import dotenv from "dotenv";
dotenv.config();



export const placeOrder = async (req, res) => {

  try {
    const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!deliveryAddress?.text || !deliveryAddress?.latitude || !deliveryAddress?.longitude) {
      return res.status(400).json({ message: "Incomplete delivery address" });
    }

    // ========== SAFE GROUPING (async) ==========
    const groupItemsByShop = {};

    for (const item of cartItems) {
      // try to read shop from payload
      let shopId = item.shop || item.shopId || null;

      // if it's missing, try to find the item in DB and read its shop ref
      if (!shopId) {
        const itemId = item._id || item.id || item.item;
        if (itemId) {
          const itemDoc = await Item.findById(itemId).select("shop");
          shopId = itemDoc?.shop?.toString() || null;
        }
      }

      if (!shopId) {
        // don't crash silently — return clear error to client
        return res.status(400).json({ message: `Missing shopId for item '${item.name || itemId || "unknown"}'` });
      }

      if (!groupItemsByShop[shopId]) groupItemsByShop[shopId] = [];
      groupItemsByShop[shopId].push(item);
    }

    // ========== CREATE SHOP ORDERS ==========
    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async (shopId) => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) throw new Error(`Shop not found: ${shopId}`);

        const items = groupItemsByShop[shopId];
        const subTotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

        return {
          shop: shop._id,
          owner: shop.owner._id,
          subTotal,
          shopOrderItems: items.map(i => ({
  item: i._id || i.id || i.item,  
            price: i.price,
            quantity: i.quantity,
            name: i.name,
            image: i.image
          }))
        };
      })
    );

    // ========== SAVE ORDER ==========
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      shopOrders,
      payment: paymentMethod === "cod"
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: newOrder._id,
    });

  } catch (error) {
    console.error("placeOrder error:", error);
    return res.status(500).json({ message: `place order error ${error.message}`, stack: error.stack });
  }
};






// ---------------------- GET MY ORDERS ----------------------
export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // USER
    if (user.role === "user") {
      const orders = await Order.find({ user: req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "name email mobile")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("user", "fullName email mobile");

      return res.status(200).json(orders);
    }

    // OWNER
    if (user.role === "owner") {
      const orders = await Order.find({ "shopOrders.owner": req.userId })
        .sort({ createdAt: -1 })
        .populate("shopOrders.shop", "name")
        .populate("shopOrders.owner", "_id name")
        .populate("shopOrders.shopOrderItems.item", "name image price")
        .populate("user", "fullName email mobile")
        .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

      const filtered = orders.map(order => {
        const shopOrder = order.shopOrders.find(
          (o) => String(o.owner?._id || o.owner) === String(req.userId)
        );

        return {
          _id: order._id,
          paymentMethod: order.paymentMethod,
          user: order.user,
          shopOrders: shopOrder || {
            shopOrderItems: [],
            status: "pending",
            subTotal: 0,
            shop: null
          },
          createdAt: order.createdAt,
          deliveryAddress: order.deliveryAddress
        };
      });

      return res.status(200).json(filtered);
    }

    // DELIVERY BOY
    if (user.role === "deliveryBoy") {
      const assignments = await DeliveryAssignment.find({ broadcastedTo: req.userId })
        .populate({
          path: "order",
          populate: {
            path: "shopOrders.shopOrderItems.item",
            select: "name image price"
          }
        })
        .populate("shop");

      return res.status(200).json(assignments);
    }

    return res.status(400).json({ message: "Invalid user role" });

  } catch (error) {
    return res.status(500).json({ message: `get user order error: ${error.message}` });
  }
};



// ---------------------- UPDATE SHOP ORDER STATUS ----------------------
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    let { status } = req.body;

    if (status === "out of delivery") status = "out for delivery";

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, msg: "Order not found" });

    const shopOrder = order.shopOrders.find((s) => s.shop.toString() === shopId);
    if (!shopOrder) return res.status(404).json({ success: false, msg: "Shop order not found" });

    shopOrder.status = status;

    let availableBoys = [];

    if (status === "out for delivery" && !shopOrder.assignment) {
      const { longitude, latitude } = order.deliveryAddress;

      const nearByDeliveryBoys = await User.find({
        role: "deliveryBoy",
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
            $maxDistance: 5000
          }
        }
      });

      const nearByIds = nearByDeliveryBoys.map(b => b._id);

      const busyIds = await DeliveryAssignment.find({
        assignedTo: { $in: nearByIds },
        status: { $nin: ["broadcasted", "completed"] }
      }).distinct("assignedTo");

      const busySet = new Set(busyIds.map(id => String(id)));

      availableBoys = nearByDeliveryBoys.filter(b => !busySet.has(String(b._id)));

      if (availableBoys.length === 0 && nearByDeliveryBoys.length > 0) {
        availableBoys = [nearByDeliveryBoys[0]];
      }

      if (availableBoys.length > 0) {
        const firstBoy = availableBoys[0];

        const newAssignment = await DeliveryAssignment.create({
          order: order._id,
          shopOrderId: shopOrder._id,
          broadcastedTo: [firstBoy._id],
          status: "broadcasted"
        });

        shopOrder.assignment = newAssignment._id;
      }
    }

    await order.save();

    return res.json({
      success: true,
      message: "Status updated",
      updatedStatus: status,
      availableBoys: availableBoys.map(b => ({
        _id: b._id,
        fullName: b.fullName,
        mobile: b.mobile
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Server error" });
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
