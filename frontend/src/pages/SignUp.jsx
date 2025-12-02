import React, { useState } from 'react';
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router-dom';
import axios from "axios"
import { serverUrl } from '../App';
import { auth } from "../../firebase";
import ClipLoader from "react-spinners/ClipLoader";


import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { setUserData } from '../redux/userSlice';
function SignUp() {
    const primaryColor = "#ff4d2d";
    // const hoverColor = "#e64323";
    const bgColor = "#fff9f6";
    const borderColor = "#ddd";
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("user");
    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [mobile, setMobile] = useState("");
     const [err,setErr]=useState("")
     const [loading,setLoading]=useState(false);
    const dispatch = useDispatch()
    // ------- ADDED STATES (only these lines added) -------
    const [errorMsg, setErrorMsg] = useState(null);
    // ------------------------------------------------------

   const handleSignUp = async () => {
  setErr("");
  setLoading(true)

  // simple client-side checks
  if (!fullName.trim() || !email.trim() || !password.trim() || !mobile.trim()) {
    return setErr("All fields are required");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return setErr("Please enter a valid email address");
  }

  if (password.length < 6) {
    return setErr("Password must be at least 6 characters long");
  }

  const payload = { fullName, email, password, mobile, role };

  try {
    const result = await axios.post(`${serverUrl}/api/auth/signup`, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    dispatch(setUserData(result.data))
    // console.log("Signup success:", result.data);
    setErr("");
    setLoading(false)
    navigate("/signin");
  } catch (error) {
    console.error("Signup error:", error);
    setLoading(false)

    if (error.response && error.response.data && error.response.data.message) {
      setErr(error.response.data.message); // e.g. "Email already exists"
    } else {
      setErr("Something went wrong. Please try again.");
    }
  }
};

    const handleGoogleAuth = async () => {
        if(!mobile){
            return setErr("mobile no is required")
        }
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)

        try {
            const {data} = await axios.post(`${serverUrl}/api/auth/google-auth`,{
                fullName:result.user.displayName,
                email:result.user.email,
                role,
                mobile
            },{withCredentials:true})
                dispatch(setUserData(data))

            // console.log(data)
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
                    Create your account to get started with delicious food deliveries
                </p>

                {/* fullName */}
                <div className="mb-4">
                    <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-500"
                        placeholder="Enter your full name"
                        style={{ border: `1px solid ${borderColor}` }}
                        onChange={(e) => setFullName(e.target.value)}
                        value={fullName}
                        required
                    />
                </div>

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

                {/* Mobile */}
                <div className="mb-4">
                    <label htmlFor="mobile" className="block text-gray-700 font-medium mb-2">
                        Mobile
                    </label>
                    <input
                        type="text"  /* changed from number -> text */
                        id="mobile"
                        name="mobile"
                        className="w-full px-4 py-2 border rounded-lg focus:border-orange-500"
                        placeholder="Enter your mobile number"
                        style={{ border: `1px solid ${borderColor}` }}
                        onChange={(e) => setMobile(e.target.value)}
                        value={mobile}
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

                {/* Role */}
                <div className="mb-4">
                    <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
                        Role
                    </label>
                    <div className="flex gap-2">
                        {["user", "owner", "deliveryBoy"].map((r) => (
                            <button
                                key={r}
                                className="flex-1 border rounded-lg px-3 py-2 text-center font-medium transition-colors cursor-pointer"
                                onClick={() => setRole(r)}
                                style={
                                    role === r
                                        ? { backgroundColor: primaryColor, color: "white" }
                                        : { border: `1px solid ${primaryColor}`, color: primaryColor }
                                }
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>

                {/* show server/client error if any (only this block added) */}
                {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

                {/* Buttons */}
                <button
                    type="button"
                    disabled={loading}
                    className={`w-full font-semibold py-2 rounded-lg transition duration-200 ${loading ? "opacity-60 cursor-not-allowed" : "bg-[#ff4d2d] hover:bg-[#e64323]"} text-white`}
                    onClick={handleSignUp} >
                    {loading ?<ClipLoader size={20} color='white'/>:"Sign Up"}
                  
                </button>

                {err && <p className='text-red-500 text-center my-[10px]'>{err}</p>}

                <button className="w-full mt-4 flex items-center justify-center gap-2 rounded-lg border px-4 py-2 cursor-pointer transition duration-200 border-gray-400 hover:bg-gray-100" onClick={handleGoogleAuth}>
                    <FcGoogle size={20} />
                    <span>Sign Up with Google</span>
                </button>

                <p className="text-center mt-6 cursor-pointer" onClick={() => navigate("/signin")}>
                    Already have an account?{" "}
                    <span className="text-[#ff4d2d]">Sign In</span>
                </p>
            </div>
        </div>
    );
}

export default SignUp;
