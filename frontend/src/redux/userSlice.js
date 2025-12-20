import { createSlice } from "@reduxjs/toolkit"

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,

    // ✅ ONLY ONE CITY KEY
    city: null,
    currentState: null,
    currentAddress: null,

    shopInMyCity: [],
    itemsInMyCity: [],

    cartItems: [],
    totalAmount: 0,

    // ✅ MUST BE ARRAY
    myOrders: [],

    searchItems: null
  },

  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
    },

    // ✅ FIXED (city only)
    setCity: (state, action) => {
      state.city = action.payload
    },

    setCurrentState: (state, action) => {
      state.currentState = action.payload
    },

    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload
    },

    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload || []
    },

    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload || []
    },

addToCart: (state, action) => {
  const cartItem = action.payload
  const existingItem = state.cartItems.find(i => i._id === cartItem._id)

  if (existingItem) {
    existingItem.quantity += cartItem.quantity
  } else {
    state.cartItems.push(cartItem)
  }

  state.totalAmount = state.cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  )
},

updateQuantity: (state, action) => {
  const { _id, quantity } = action.payload
  const item = state.cartItems.find(i => i._id === _id)
  if (item) item.quantity = quantity

  state.totalAmount = state.cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  )
},

removeCartItem: (state, action) => {
  state.cartItems = state.cartItems.filter(i => i._id !== action.payload)
  state.totalAmount = state.cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity, 0
  )
},


    setMyOrders: (state, action) => {
      state.myOrders = action.payload || []
    },

    addMyOrder: (state, action) => {
      state.myOrders.unshift(action.payload)
    },

   updateOrderStatus: (state, action) => {
  const { orderId, shopId, status } = action.payload

  const order = state.myOrders.find(o => o._id === orderId)
  if (!order) return

  // ✅ OWNER CASE (shopOrders is OBJECT)
  if (order.shopOrders && !Array.isArray(order.shopOrders)) {
    if (
      order.shopOrders.shop === shopId ||
      order.shopOrders.shop?._id === shopId
    ) {
      order.shopOrders.status = status
    }
    return
  }

  // ✅ USER CASE (shopOrders is ARRAY)
  if (Array.isArray(order.shopOrders)) {
    const shopOrder = order.shopOrders.find(
      s => s.shop === shopId || s.shop?._id === shopId
    )
    if (shopOrder) shopOrder.status = status
  }
},


    setSearchItems: (state, action) => {
      state.searchItems = action.payload
    }
  }
})

export const {
  setUserData,
  setCity,
  setCurrentState,
  setCurrentAddress,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  setSearchItems
} = userSlice.actions

export default userSlice.reducer
