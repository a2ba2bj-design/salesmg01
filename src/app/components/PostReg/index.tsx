"use client"
import axios from "axios";
import { BASE_URL } from "../../lib/util";
import React, {useEffect,  useMemo,  useState} from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/select'
const PostForm  = () => {
// const [showForm, setShowForm] = useState(true);
  const containerStyle = useMemo(() => ({ width: "100%", height: "100vh" }), []);
  const [name,setName]=useState('')
  const [nameFull,setNameFull]=useState('')
  const [parentPostID,setParentPostID]=useState("")
  const [postCode,setPostCode]=useState('')
  const [description,setDescription]=useState('')
  const [isActive,setIsActive]=useState("1")
  const [parentPosts, setParentPosts] = useState([])
  
  async function addPost  (){
    const formData = new FormData()
    formData.append("Name",name)
    formData.append("NameFull",nameFull)
    formData.append("ParentPostID",parentPostID)
    formData.append("PostCode",postCode)
    formData.append("Description",description)
    formData.append("ISActive",isActive)
    formData.append("CreateDate", new Date().toISOString().split('T')[0])
   
    axios.post(`${BASE_URL}/api/posts`,formData).then(res=>{window.alert(res.status==201?"پست شما اضافه شد":"دوباره تلاش کنید")}).catch(err=>(window.alert(err)))
  }
  
 useEffect(() => {
      axios.get(`${BASE_URL}/api/posts`).then(res=>setParentPosts(res.data)).catch(err=>console.log(err));
    
    }, []);

  return (
    <div style={containerStyle}>
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
         {/* پاپ‌آپ ایجاد پست */}
       
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-[600px] max-h-[90vh] overflow-y-auto p-6 shadow-xl">
            <h2 className="text-green-500 text-xl font-semibold mb-8">
              ایجاد پست جدید
            </h2>
            
                <input
                type="text"
                placeholder="نام پست"
                value={name}
                onChange={(e) => setName( e.target.value )}
                className="w-full h-12 mb-3 text-gray-600 shadow-md rounded-full border border-gray-200 pr-4"
              />
              
                <input
                type="text"
                placeholder="نام کامل پست"
                value={nameFull}
                onChange={(e) => setNameFull( e.target.value )}
                className="w-full h-12 mb-3 text-gray-600 shadow-md rounded-full border border-gray-200 pr-4"
              />
              
                <input
                type="number"
                placeholder="کد پست"
                value={postCode}
                onChange={(e) => setPostCode( e.target.value )}
                className="w-full h-12 mb-3 text-gray-600 shadow-md rounded-full border border-gray-200 pr-4"
              />
              
              <textarea
                placeholder="توضیحات"
                value={description}
                onChange={(e) => setDescription( e.target.value )}
                className="w-full h-24 mb-3 text-gray-600 shadow-md rounded-lg border border-gray-200 pr-4 py-3"
              />
              
                     <div className="relative mb-6">
        <Select 
          value={parentPostID}
          onValueChange={setParentPostID}
          dir='rtl'
        >
          <SelectTrigger>
            <SelectValue placeholder="پست والد را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            { parentPosts.map((item)=>
            <SelectItem  key={item.PostID} value={String(item.PostID)}> {item.Name}</SelectItem>
)}
          </SelectContent>
        </Select>
              </div>
              
                     <div className="relative mb-6">
        <Select 
          value={isActive}
          onValueChange={setIsActive}
          dir='rtl'
        >
          <SelectTrigger>
            <SelectValue placeholder="وضعیت را انتخاب کنید" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">فعال</SelectItem>
            <SelectItem value="0">غیرفعال</SelectItem>
          </SelectContent>
        </Select>
              </div>
                                
              <div className="flex justify-end mt-4">
                <button
                  className="px-4 py-2 bg-emerald-500 text-white rounded ml-2"
                  onClick={addPost}
                >
                  ذخیره
                </button>
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded"
                  onClick={()=>{} }
                >
                  لغو
                </button>
              </div>
            </div>
          </div>
     
      </div>
      </div>
  );
};

export default PostForm;