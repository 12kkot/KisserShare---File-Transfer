
const express=require('express');
const multer=require('multer');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const app=express();
const TOKEN=process.env.UPLOAD_TOKEN||'CHANGE_ME';

const uploadDir=path.join(__dirname,'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload=multer({dest:uploadDir});
const files=new Map();

app.use(express.static('public'));

app.post('/upload',upload.single('file'),(req,res)=>{
 const auth=req.headers.authorization||'';

 if(auth!=='Bearer '+TOKEN){
   if(req.file) fs.unlinkSync(req.file.path);
   return res.status(403).send('Forbidden');
 }

 const id=crypto.randomBytes(6).toString('hex');

 files.set(id,{
   path:req.file.path,
   name:req.file.originalname
 });

 setTimeout(()=>{
   const f=files.get(id);
   if(f){
     try{fs.unlinkSync(f.path)}catch(e){}
     files.delete(id);
   }
 },300000);

 res.json({id});
});

app.get('/f/:id',(req,res)=>{
 const f=files.get(req.params.id);
 if(!f) return res.status(404).send('Expired');

 res.download(f.path,f.name,()=>{
   try{fs.unlinkSync(f.path)}catch(e){}
   files.delete(req.params.id);
 });
});

app.listen(process.env.PORT||3000);
