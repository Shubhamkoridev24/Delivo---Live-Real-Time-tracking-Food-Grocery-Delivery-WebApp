import axios from 'axios'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { serverUrl } from '../App'

function useGetCurrentUser() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/user/current`,
          { withCredentials: true }
        )
        dispatch(setUserData(res.data))
      } catch (err) {
        dispatch(setUserData(null)) // ❗ important
      }
    }

    fetchUser()
  }, [dispatch])
}

export default useGetCurrentUser
