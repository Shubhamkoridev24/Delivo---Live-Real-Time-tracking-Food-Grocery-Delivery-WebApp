import { createSlice } from "@reduxjs/toolkit"

const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
        city: null,
        currentState: null,
        currentAddress: null,
        shopInMyCity: [],
        itemsInMyCity: [],
        cartItems: [],
        totalAmount: 0,
        myOrders: null,
        searchItems:null
    },


    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload
        },
        setCurrentCity: (state, action) => {
            state.currentCity = action.payload
        },
        setCurrentState: (state, action) => {
            state.currentState = action.payload
        },
        setCurrentAddress: (state, action) => {
            state.currentAddress = action.payload
        },
        setShopsInMyCity: (state, action) => {
            state.shopInMyCity = action.payload; // ✅ match the initial state key
        },
        setItemsInMyCity: (state, action) => {
            state.itemsInMyCity = action.payload; // ✅ match the initial state key
        },

        addToCart: (state, action) => {
            const cartItem = action.payload
            const existingItem = state.cartItems.find(i => i.id == cartItem.id)
            if (existingItem) {
                existingItem.quantity += cartItem.quantity
            } else {
                state.cartItems.push(cartItem)
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
        },
        updateQuantity: (state, action) => {
            const { id, quantity } = action.payload
            const item = state.cartItems.find(i => i.id == id)
            if (item) {
                item.quantity = quantity
            }
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

        },

        removeCartItem: (state, action) => {
            state.cartItems = state.cartItems.filter(i => i.id !== action.payload)
            state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

        },

        setMyOrders: (state, action) => {
            state.myOrders = action.payload
        },
        addMyOrder:(state,action)=>{
            state.myOrders = [action.payload,...state.myOrders]
        },
    updateOrderStatus: (state, action) => {
  const { orderId, shopId, status } = action.payload;
  const order = state.myOrders.find(o => o._id === orderId);

  if (order && order.shopOrders) {
    // Agar shopOrders ek array hai
    if (Array.isArray(order.shopOrders)) {
      const shopOrder = order.shopOrders.find(
        s => s.shop?._id === shopId || s.shop === shopId
      );
      if (shopOrder) {
        shopOrder.status = status;
      }
    } 
    // Agar shopOrders ek single object hai
    else if (order.shopOrders.shop?._id === shopId || order.shopOrders.shop === shopId) {
      order.shopOrders.status = status;
    }
  }
},
setSearchItems:(state,action)=>{
    state.searchItems=action.payload
}

    }
})

export const { setUserData, setCurrentCity, setCurrentState, setCurrentAddress, setShopsInMyCity, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, setMyOrders,addMyOrder,setSearchItems ,updateOrderStatus} = userSlice.actions
export default userSlice.reducer