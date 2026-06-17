
const express=require('express');
const multer=require('multer');
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const app=express();
const TOKEN=process.env.UPLOAD_TOKEN||'CHANGE_ME';
const EXPIRY=parseInt(process.env.FILE_EXPIRY)||300000;

const uploadDir=path.join(__dirname,'uploads');
if(!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const metaPath=path.join(__dirname,'files.json');

function loadMeta(){
 try{
  if(fs.existsSync(metaPath)){
   const data=JSON.parse(fs.readFileSync(metaPath,'utf8'));
   return new Map(Object.entries(data));
  }
 }catch(e){}
 return new Map();
}

function saveMeta(){
 const obj={};
 for(const [k,v] of files) obj[k]=v;
 fs.writeFileSync(metaPath,JSON.stringify(obj));
}

const files=loadMeta();

for(const [id,f] of files){
 if(Date.now()-f.created>EXPIRY){
  try{fs.unlinkSync(f.path)}catch(e){}
  files.delete(id);
 } else {
  const remaining=EXPIRY-(Date.now()-f.created);
  setTimeout(()=>{
   const ff=files.get(id);
   if(ff){
    try{fs.unlinkSync(ff.path)}catch(e){}
    files.delete(id);
    saveMeta();
   }
  },remaining);
 }
}
saveMeta();

app.use(express.static('public'));

app.get('/health',(req,res)=>res.sendStatus(200));

app.post('/upload',upload.single('file'),(req,res)=>{
 const auth=req.headers.authorization||'';

 if(auth!=='Bearer '+TOKEN){
  if(req.file) try{fs.unlinkSync(req.file.path)}catch(e){}
  return res.status(403).send('Forbidden');
 }

 const id=crypto.randomBytes(6).toString('hex');

 files.set(id,{
  path:req.file.path,
  name:req.file.originalname,
  created:Date.now()
 });
 saveMeta();

 setTimeout(()=>{
  const f=files.get(id);
  if(f){
   try{fs.unlinkSync(f.path)}catch(e){}
   files.delete(id);
   saveMeta();
  }
 },EXPIRY);

 res.json({id});
});

app.get('/f/:id',(req,res)=>{
 const f=files.get(req.params.id);
 if(!f) return res.status(404).send('Expired');

 if(Date.now()-f.created>EXPIRY){
  try{fs.unlinkSync(f.path)}catch(e){}
  files.delete(req.params.id);
  saveMeta();
  return res.status(404).send('Expired');
 }

 res.download(f.path,f.name,()=>{
  try{fs.unlinkSync(f.path)}catch(e){}
  files.delete(req.params.id);
  saveMeta();
 });
});

app.listen(process.env.PORT||3000);
