'use client'
import { useEffect, useState } from 'react'
import axios from "axios";
import { createUser } from '../../(action)/createUser'
//import { createUserLog } from '../../(action)/createUserLog'
import { useRouter  } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select'
import { BASE_URL } from '../../lib/util';

////////////////////
function LoginReg() {

  const router = useRouter()
  const [MemberID , setMemberID] = useState('')
  const [UserName , setUserName] = useState('')
  const [Password , setPassword] = useState('')
  const [IsActive , serIsActive]=useState(0)
  const [PostID   , setPostID] = useState('')
  const [NameFull , setNameFull]=useState('')
  const [loading  , setLoading] = useState(false)
  const [message  , setMessage] = useState('')



  const handleSendOtp = async () => {
    const formData = new FormData()
    formData.append('phone', phone)
     formData.append('catid', catid)
    setLoading(true)
    setMessage('')
    try {
      const result = await createUser(formData)
      setUserID(result.userID)
      setMessage(result.message)
      setOtpSent(true)
    } catch (error) {
      setMessage('خطا در ارسال کد')
    } finally {
      setLoading(false)
    }
  }
 useEffect(() => {
      
      axios.get(`${BASE_URL}/enum`,{params:{groupname:'enterType',},})
      .then(province =>setCats(province.data)).catch(err=>console.log(err));
     
    }, []);
  const handleLogin = async () => {
         
              try {
            
            const result = await createUserLog(userID,otp)
           if (result.success) 
            {
             alert("شما با موفقیت وارد شدید")
            router.push('/')
            }
            else
              alert("خطا در ورود")
          } catch (error) {
            
            alert('user failed from component'+error)
          }
        }

  return (
    <div className="min-h-screen flex items-center  justify-center bg-white px-4" dir="rtl">
      <div className="w-full max-w-sm bg-white border  border-gray-200 rounded-xl shadow-md p-6 space-y-5">
        <h2 className="text-xl font-bold text-center text-[#355e50]">ورود کاربران</h2>

        <input
          
          type="text"
          placeholder="شماره تلفن را وارد کنید"
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#355e50]"
          maxLength={11}
          pattern="\d{11}"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
             <div className="relative mb-6 text-black">
         <Select 
          name="province"
          value={catid}
          onValueChange={setCatID}
          dir='rtl'
          
          
        >
          <SelectTrigger>
            <SelectValue placeholder="نوع ورود را انتخاب کنید"/>
          </SelectTrigger>
          <SelectContent>
            { cats.map((item)=>
            <SelectItem  key={item.id} value={String(item.id)}> {item.name}</SelectItem>
)}
          </SelectContent>
        </Select>
    </div>
        <button
          onClick={handleSendOtp}
          disabled={loading || phone.length !== 11}
          className="w-full py-2 bg-[#355e50] text-gray-100 rounded-md hover:bg-[#2c4f43] transition"
        >
          {loading ? 'در حال ارسال...' : 'ارسال رمز یکبار مصرف'}
        </button>

        {otpSent && (
          <>
            <input 
              type="text"
              placeholder="کد را وارد کنید"
              className="w-full px-4 py-2 border border-gray-300 rounded-md  text-gray-700  focus:outline-none focus:ring-2 focus:ring-[#355e50]"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(parseInt(e.target.value))}
            />

            <button
              onClick={handleLogin}
              className="w-full py-2 bg-[#355e50] text-white rounded-md hover:bg-[#2c4f43] transition"
            >
              ورود
            </button>
          </>
        )}

        {message && (
          <div className="text-sm text-center text-[#355e50]  bg-[#e6f2ee] py-2 px-3 rounded-md">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default LoginReg
