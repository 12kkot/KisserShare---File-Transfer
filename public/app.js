
let uploadToken = "";

document.body.insertAdjacentHTML("beforeend", `
<div class="modal" id="loginModal">
 <div class="modal-content">
   <h3>Authentication</h3>
   <input type="password" id="tokenInput" placeholder="Upload password">
   <button id="loginBtn">Login</button>
 </div>
</div>

<div class="modal" id="linkModal">
 <div class="modal-content">
   <h3>Upload Complete</h3>
   <input id="shareLink" readonly>
   <button id="copyBtn">Copy</button>
   <button id="closeBtn">Close</button>
 </div>
</div>
`);

const loginModal=document.getElementById("loginModal");
const linkModal=document.getElementById("linkModal");
const drop=document.getElementById("drop");
const progress=document.getElementById("prog");
const label=document.querySelector(".xp-progress-wrapper label");

loginModal.style.display="flex";

document.getElementById("loginBtn").onclick=()=>{
 uploadToken=document.getElementById("tokenInput").value.trim();
 if(!uploadToken) return;
 loginModal.style.display="none";
};

document.getElementById("copyBtn").onclick=()=>{
 navigator.clipboard.writeText(document.getElementById("shareLink").value);
};

document.getElementById("closeBtn").onclick=()=>{
 linkModal.style.display="none";
};

drop.addEventListener("dragover",e=>e.preventDefault());

drop.addEventListener("drop",e=>{
 e.preventDefault();

 if(!uploadToken){
   loginModal.style.display="flex";
   return;
 }

 const file=e.dataTransfer.files[0];
 if(!file) return;

 const form=new FormData();
 form.append("file",file);

 const xhr=new XMLHttpRequest();
 xhr.open("POST","/upload");
 xhr.setRequestHeader("Authorization","Bearer "+uploadToken);

 xhr.upload.onprogress=(ev)=>{
   if(ev.lengthComputable){
      const p=Math.round((ev.loaded/ev.total)*100);
      progress.value=p;
      label.textContent="Status: Uploading "+p+"%";
   }
 };

 xhr.onload=()=>{
   if(xhr.status!==200){
      alert("Upload failed");
      return;
   }

   const data=JSON.parse(xhr.responseText);
   const url=location.origin+"/f/"+data.id;

   document.getElementById("shareLink").value=url;
   linkModal.style.display="flex";
 };

 xhr.send(form);
});
