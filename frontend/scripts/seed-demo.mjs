// Optional: upload sample photos and create posts using YOUR backend API.
// Usage: DEMO_EMAIL=... DEMO_PASSWORD=... npm run seed
import {readFile} from 'node:fs/promises';
const BASE=process.env.API_URL||'http://localhost:5000';
const email=process.env.DEMO_EMAIL,password=process.env.DEMO_PASSWORD;
if(!email||!password){console.error('Set DEMO_EMAIL and DEMO_PASSWORD for an existing account.');process.exit(1)}
async function call(path,options={}){const res=await fetch(BASE+path,options);const data=await res.json();if(!res.ok)throw Error(data.message||String(res.status));return data}
const {token}=await call('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
const auth={Authorization:`Bearer ${token}`};
const posts=[
 ['city-nights','City lights and endless possibilities. 🌃 #CityLife'],
 ['coffee-corner','Good coffee, great ideas. ☕ #CafeDays'],
 ['mountain-escape','A little mountain air goes a long way. 🏔️ #Travel'],
 ['workspace','Slow mornings and a fresh start. ✨ #Workspace'],
 ['colorful-streets','Getting lost in the most beautiful streets. 🌺 #Explore'],
 ['sunset-coast','Sunsets are proof that endings can be beautiful. 🌅 #Nature']
];
for(const [file,text] of posts){
 try{
  const bytes=await readFile(new URL(`../public/sample-photos/${file}.jpg`,import.meta.url));
  const form=new FormData();form.append('image',new Blob([bytes],{type:'image/jpeg'}),`${file}.jpg`);
  const uploaded=await call('/api/uploads/image',{method:'POST',headers:auth,body:form});
  await call('/api/posts',{method:'POST',headers:{...auth,'Content-Type':'application/json'},body:JSON.stringify({text,image:uploaded.url})});
  console.log('Created post:',file);
 }catch(e){console.error('Failed:',file,e.message)}
}
