import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios from "axios"
import { serverUrl } from '../App';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import ClipLoader from "react-spinners/ClipLoader";
import { setUserData } from '../redux/userSlice';
import { useDispatch } from 'react-redux';


function SignIn() {
    const primaryColor = "#ff4d2d";
    // const hoverColor = "#e64323";
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err,setErr] = useState("")
     const [loading,setLoading]=useState(false);
         const dispatch = useDispatch()


  // example handleSignIn — adapt variable names to your component
const handleSignIn = async () => {
  setErr("");
  setLoading(true);

  if (!email?.trim() || !password) {
    setErr("Please enter email and password.");
    setLoading(false);
    return;
  }

  try {
    const payload = { email: email.trim(), password };
    const res = await axios.post(`${serverUrl}/api/auth/signin`, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

        dispatch(setUserData(res.data.user))
    
    navigate("/");

  } catch (error) {
    console.error("Sign in error:", error);

    if (error.response) {
      // backend se status ke hisab se error set karo
      switch (error.response.status) {
        case 404:
          setErr("User does not exist.");
          break;
        case 401:
          setErr("Incorrect password.");
          break;
        case 400:
          setErr("Please enter valid credentials.");
          break;
        default:
          setErr(error.response.data.message || "Something went wrong.");
      }
    } else {
      setErr("Network error. Please try again.");
    }

  } finally {
    setLoading(false);
  }
};



   const handleGoogleAuth = async () => {
       
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)

        try {
            const {data} = await axios.post(`${serverUrl}/api/auth/google-auth`,{
                email:result.user.email,
             
            },{withCredentials:true})

    dispatch(setUserData(data))
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4"
            style={{ backgroundColor: bgColor }}
        >
            <div
                className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 border-[1px]"
                style={{ border: `1px solid ${borderColor}` }}
            >
                <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
                    Delivo
                </h1>
                <p className="text-gray-600 mb-8">
                    Sign In to get started with delicious food deliveries
                </p>

              

                {/* Email */}
                <div className="mb-4">
                    <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-500"
                        placeholder="Enter your email"
                        style={{ border: `1px solid ${borderColor}` }}
                        onChange={(e) => setEmail(e.target.value)}
                        value={email}
                        required
                    />
                </div>

              
                {/* Password */}
                <div className="mb-4 relative">
                    <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
                        Password
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-500"
                        placeholder="Enter your password"
                        style={{ border: `1px solid ${borderColor}` }}
                        onChange={(e) => setPassword(e.target.value)}
                        value={password}
                        required
                    />
                    <span
                        className="absolute right-3 top-10 mt-2 cursor-pointer text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </span>
                </div>

              <div className='text-right mb-4 text-[#ff4d2d] font-medium cursor-pointer' onClick={()=>navigate("/forgot-password")}>
                Forgot Password
              </div>

                {/* Buttons */}
                <button
                    className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] text-white hover:bg-[#e64323] cursor-pointer`} onClick={handleSignIn} disabled={loading}
                >
                    {loading ?<ClipLoader size={20} color='white'/>:"Sign In"}
                   
                </button>
                {err && <p className='text-red-500 text-center my-[10px]'>{err}</p>}


                <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition duration-200 border-gray-400 hover:bg-gray-100" onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign In with Google</span>
                </button>

                <p className="text-center mt-6 cursor-pointer" onClick={() => navigate("/signup")}>
                    Want to create new account?
                    <span className="text-[#ff4d2d]">Sign Up</span>
                </p>
            </div>
        </div>
    );
}

export default SignIn;
