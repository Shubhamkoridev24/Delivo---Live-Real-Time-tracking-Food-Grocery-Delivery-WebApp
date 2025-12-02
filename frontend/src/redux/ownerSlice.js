import { createSlice } from "@reduxjs/toolkit"

const ownerSlice = createSlice({
    name:"owner", // <-- better to match 'owner'
    initialState:{
        myShopData: null, // <-- capitalize 'S' to match selector
    },
    reducers:{
        setMyShopData:(state,action)=>{
            state.myShopData = action.payload
        },
    }
})

export const { setMyShopData } = ownerSlice.actions
export default ownerSlice.reducer
