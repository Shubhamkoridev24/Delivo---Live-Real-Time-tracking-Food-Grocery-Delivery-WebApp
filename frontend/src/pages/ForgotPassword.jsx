import axios from 'axios';
import React, { useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import ClipLoader from 'react-spinners/ClipLoader';


function ForgotPassword() {
    const [step, setStep] = useState(1)
    const [email, setEmail] = useState("")

    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const navigate = useNavigate()
    const [err, setErr] = useState("")
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        setLoading(true)
        try {
            const result = await axios.post(`${serverUrl}/api/auth/send-otp`, { email },
                { withCredentials: true }
            )
            console.log(result)
            setErr("")
            setStep(2)
            setLoading(false)
        } catch (error) {
            setErr(error?.response?.data?.message)
            setLoading(false)

        }
    }


    const handleVerifyOtp = async () => {
        setLoading(true)

        try {
            const result = await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp },
                { withCredentials: true }
            )
            console.log(result)
            setErr("")
            setStep(3)
            setLoading(false)

        } catch (error) {
            setErr(error?.response?.data?.message)
        }
    }

    const handleResetPassword = async () => {

        if (newPassword != confirmPassword) {
            return null
        }
        setLoading(true)

        try {
            const result = await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword },
                { withCredentials: true }
            )
            setErr("")
            console.log(result)
            setLoading(false)

            navigate("/signin")
        } catch (error) {
            setErr(error?.response?.data?.message)
        }
    }
    return (
        <div className='flex w-full items-center justify-center min-h-screen p-4 bg-[#fff9f6]'>
            <div className='bg-white rounded-xl shadow-lg w-full max-w-md p-8'>
                <div className='flex items-center gap-4 mb-4'>

                    <IoIosArrowRoundBack size={30} className='text-[#ff4d2d] cursor-pointer' onClick={() => navigate("/signin")} />

                    <h1 className='text-xl font-bold text-center text-[#ff4d2d]'>Forgot-Password</h1>
                </div>

                {step == 1 &&
                    <div>
                        <div className="mb-6">
                            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-4 py-2 border-[1px border-gray-200 rounded-lg focus:outline-none"
                                placeholder="Enter your email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                required
                            />
                        </div>
                        <button
                            type="button"
                            className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323]"} text-white cursor-pointer`} onClick={handleSendOtp} disabled={loading}>
                            
                            {loading ? <ClipLoader size={20} color='white'/> : "Send Otp"}
                        </button>
                        {err && <p className='text-red-500 text-center my-[10px]'>{err}</p>}

                    </div>}

                {step == 2 &&
                    <div>
                        <div className="mb-6">
                            <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">
                                OTP
                            </label>
                            <input
                                type="email"
                                id="otp"
                                name="otp"
                                className="w-full px-4 py-2 border-[1px border-gray-200 rounded-lg focus:outline-none"
                                placeholder="Enter OTP"
                                onChange={(e) => setOtp(e.target.value)}
                                value={otp}
                            />
                        </div>
                        <button
                            type="button"
                            className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323]"} text-white cursor-pointer`} onClick={handleVerifyOtp} disabled={loading}>
                            
                            {loading ? <ClipLoader size={20} color='white'/> : "Verify"}

                           
                        </button>
                        {err && <p className='text-red-500 text-center my-[10px]'>{err}</p>}

                    </div>}

                {step == 3 &&
                    <div>
                        <div className="mb-6">
                            <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                                New Password
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-4 py-2 border-[1px border-gray-200 rounded-lg focus:outline-none"
                                placeholder="Enter New Password"
                                onChange={(e) => setNewPassword(e.target.value)}
                                value={newPassword}
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="ConfirmPassword" className="block text-gray-700 font-medium mb-2">
                                Confirm Password
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className="w-full px-4 py-2 border-[1px border-gray-200 rounded-lg focus:outline-none"
                                placeholder="Confirm Password"
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                value={confirmPassword}
                            />
                        </div>
                        <button
                            type="button"
                            className={`w-full font-semibold py-2 rounded-lg transition duration-200 bg-[#ff4d2d] hover:bg-[#e64323]"} text-white cursor-pointer`} onClick={handleResetPassword}disabled={loading}>
                            
                            {loading ? <ClipLoader size={20} color='white'/> : "Reset Password"}

                        </button>
                        {err && <p className='text-red-500 text-center my-[10px]'>{err}</p>}

                    </div>}
            </div>
        </div>
    )
}

export default ForgotPassword
