export const BASE=(import.meta.env.VITE_API_URL||'http://localhost:5000').replace(/\/$/,'');
export async function api(path,{method='GET',body,token,upload=false}={}){
 const headers={}; if(token) headers.Authorization=`Bearer ${token}`;
 if(body!==undefined&&!upload)headers['Content-Type']='application/json';
 let response;
 try {response=await fetch(BASE+path,{method,headers,body:upload?body:body!==undefined?JSON.stringify(body):undefined});}
 catch{throw new Error('Cannot reach the backend. Start it on port 5000 and check VITE_API_URL.');}
 const data=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(data.message||`Request failed (${response.status})`);
 return data;
}
export const uploadImage=async(file,token)=>{const form=new FormData();form.append('image',file);return api('/api/uploads/image',{method:'POST',body:form,token,upload:true});};
export const idOf=v=>typeof v==='string'?v:v?._id||v?.id||'';
