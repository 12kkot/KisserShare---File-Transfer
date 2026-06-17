
const express=require('express');
const multer=require('multer');
const fs=require('fs');
const crypto=require('crypto');

const app=express();
const TOKEN=process.env.UPLOAD_TOKEN||'CHANGE_ME';
const EXPIRY=parseInt(process.env.FILE_EXPIRY)||300000;

const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:100*1024*1024}});
const files=new Map();

app.use(express.static('public'));

app.get('/health',(req,res)=>res.sendStatus(200));

app.post('/upload',upload.single('file'),(req,res)=>{
 const auth=req.headers.authorization||'';

 if(auth!=='Bearer '+TOKEN){
  return res.status(403).send('Forbidden');
 }

 if(!req.file) return res.status(400).send('No file');

 const id=crypto.randomBytes(6).toString('hex');

 files.set(id,{
  buffer:req.file.buffer,
  name:req.file.originalname,
  mime:req.file.mimetype,
  created:Date.now()
 });

 setTimeout(()=>{
  files.delete(id);
 },EXPIRY);

 res.json({id,expiresIn:EXPIRY});
});

app.get('/f/:id',(req,res)=>{
 const f=files.get(req.params.id);
 if(!f) return res.status(404).send('Expired');

 if(Date.now()-f.created>EXPIRY){
  files.delete(req.params.id);
  return res.status(404).send('Expired');
 }

 res.set({
  'Content-Type':f.mime||'application/octet-stream',
  'Content-Disposition':'attachment; filename="'+encodeURIComponent(f.name)+'"',
  'Content-Length':f.buffer.length
 });
 res.send(f.buffer);

 files.delete(req.params.id);
});

app.listen(process.env.PORT||3000);
