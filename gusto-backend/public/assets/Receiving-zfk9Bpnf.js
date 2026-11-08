import{u as _e,b as ke,a as Ne,k as ze,V as T,c as p,d as w,e as Ve,G as Pe,H as Q,g as H,m as K,a6 as $,j as b,L as R,a2 as Ce,x as X,T as De,i as Fe,M as j,N as Z,_ as ee,r as z}from"./index-B6lqdK3e.js";import{a as Se}from"./dateFormatter-CFVLCaSe.js";import{_ as Qe,l as te}from"./_plugin-vue_export-helper-8yoCcMaT.js";import{H as Re,e as ae,A as Ie}from"./AppLayout-nZqXTxNb.js";import{H as V}from"./PhCheckCircle.vue-DsPKNuGF.js";import{I as Be}from"./PhClock.vue-BLpwWj9j.js";import{I as oe}from"./PhEye.vue-C_C57yUp.js";import{H as Ae}from"./PhPhone.vue-UDpqrJfI.js";import{I as se}from"./PhPrinter.vue-CU74pqBP.js";import{J as Le}from"./PhStack.vue-ZIeCg8Hv.js";import{o as Te,L as v,M as h,N as o,O as a,G as s,P as c,aG as l,bl as u,V as G,cg as _,cf as ie,ag as He,ci as $e,q as P,r as m}from"./vuetify-BVA7vC6K.js";import"./pdf-CDdaJDAX.js";const je={class:"d-flex align-center justify-space-between flex-wrap",style:{position:"relative","z-index":"2"}},Ge={class:"d-flex align-center flex-wrap"},Oe=["src"],Ee={class:"flex-grow-1"},Ue={class:"text-h4 font-weight-bold text-white mb-2",style:{"letter-spacing":"-0.5px"}},Me={class:"text-body-2 text-white",style:{opacity:"0.85"}},qe={class:"font-weight-bold",style:{color:"#046375"}},Ye={class:"text-caption",style:{color:"var(--t-text-dim)"}},Je={class:"font-weight-medium"},We={key:0,class:"text-caption text-grey"},Ke={class:"font-weight-bold text-h6",style:{color:"#046375"}},Xe={class:"text-center"},Ze={class:"d-flex ga-2"},et={style:{background:"#046375",padding:"24px"}},tt={class:"d-flex align-center"},at={style:{width:"48px",height:"48px","border-radius":"10px",background:"rgba(255,255,255,0.2)",display:"flex","align-items":"center","justify-content":"center","margin-left":"12px"}},ot={class:"font-weight-bold mb-1"},st={class:"font-weight-bold"},it={class:"text-caption text-grey"},lt={class:"font-weight-bold"},rt={class:"font-weight-medium text-success"},nt={style:{background:"#046375",padding:"24px"}},dt={class:"d-flex align-center"},ct={style:{width:"48px",height:"48px","border-radius":"10px",background:"rgba(255,255,255,0.2)",display:"flex","align-items":"center","justify-content":"center","margin-left":"12px"}},ut={class:"font-weight-bold text-h6 mb-3"},pt={class:"font-weight-medium mb-3"},gt={class:"font-weight-medium mb-3"},vt={class:"font-weight-medium mb-3"},mt={class:"font-weight-medium mb-3"},bt={class:"font-weight-bold text-h5 mb-3",style:{color:"#046375"}},ft={class:"mb-3"},xt={class:"font-weight-medium"},ht={class:"text-caption text-grey"},yt={class:"font-weight-bold"},wt={class:"font-weight-medium"},_t={class:"font-weight-bold",style:{color:"#046375"}},kt={__name:"Receiving",setup(Nt){_e();const f=ke(),le=Ne(),re=P(()=>Se()),x=m([]),C=m("pending"),I=m({purchases:!1}),D=m(!1),k=m(!1),B=m(!1),y=m(null),n=m(null),N=m({items:[]}),ne=P(()=>x.value.filter(i=>i.status==="pending").length),de=P(()=>x.value.filter(i=>i.status==="partially_received").length),ce=P(()=>x.value.filter(i=>i.status==="received").length),ue=P(()=>C.value==="all"?x.value:x.value.filter(i=>i.status===C.value)),pe=[{title:"رقم الأمر",key:"purchaseNumber",width:"15%"},{title:"المورد",key:"supplierName",width:"20%"},{title:"المبلغ الإجمالي",key:"totalAmount",align:"center",width:"15%"},{title:"الحالة",key:"status",align:"center",width:"12%"},{title:"عدد الأصناف",key:"itemsCount",align:"center",width:"10%"},{title:"إجراءات",key:"actions",sortable:!1,align:"center",width:"15%"}],ge=[{title:"المكون",key:"ingredientName",width:"30%"},{title:"الكمية المطلوبة",key:"orderedQuantity",align:"center"},{title:"الكمية المستلمة",key:"receivedQuantity",align:"center"},{title:"سعر الوحدة",key:"unitPrice",align:"center"},{title:"المجموع",key:"totalPrice",align:"center"}],ve={required:i=>!!i||"مطلوب"},O=async()=>{I.value.purchases=!0;try{const i=await z.getAll();x.value=i.data}catch(i){f.error("فشل تحميل أوامر الشراء"),console.error(i)}finally{I.value.purchases=!1}},E=async i=>{try{const e=await z.getOne(i.idPurchase);y.value=e.data,N.value.items=e.data.items.map(t=>({...t,newReceived:0})),D.value=!0,k.value=!1}catch(e){f.error("فشل تحميل تفاصيل الأمر"),console.error(e)}},U=()=>{D.value=!1,y.value=null,N.value.items=[]},me=async()=>{var e,t;console.log("🔍 Frontend: confirmReceive called"),console.log("📋 receiveForm.items:",N.value.items);const i=N.value.items.filter(r=>r.newReceived>0).map(r=>{const g=parseFloat(r.receivedQuantity)||0,F=parseFloat(r.newReceived)||0,S=g+F;return console.log(`  Item ${r.idPurchaseItem}:`,{ingredientName:r.ingredientName,oldReceived:g,newReceived:F,totalReceived:S,ordered:r.orderedQuantity}),{idPurchaseItem:r.idPurchaseItem,ingredientId:r.ingredientId,receivedQuantity:S}});if(console.log("📤 Sending to backend:",i),i.length===0){f.error("يجب تحديد كمية مستلمة لصنف واحد على الأقل");return}B.value=!0;try{const r=await z.receive(y.value.idPurchase,{items:i});console.log("✅ Backend response:",r.data),f.success("✅ تم تأكيد الاستلام وتحديث المخزون"),await O(),U()}catch(r){console.error("❌ Receive error:",r),f.error(((t=(e=r.response)==null?void 0:e.data)==null?void 0:t.message)||"فشل تأكيد الاستلام")}finally{B.value=!1}},be=async i=>{try{const e=await z.getOne(i.idPurchase);n.value=e.data,k.value=!0}catch(e){f.error("فشل تحميل تفاصيل الأمر"),console.error(e)}},M=async i=>{let e=i;if(!i.items||i.items.length===0)try{e=(await z.getOne(i.idPurchase)).data}catch(d){console.error("Failed to load purchase details:",d),f.error("فشل تحميل تفاصيل الأمر");return}const t=d=>String(d??"").replace(/[&<>"']/g,L=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[L]),r=e.supplierName||i.supplierName||"غير محدد",g=d=>Number(d.receivedQuantity||0)*Number(d.unitPrice||0),F=e.items.reduce((d,L)=>d+g(L),0),S=e.items.filter(d=>Number(d.receivedQuantity||0)>0).length,he=e.items.map(d=>"<tr><td>"+t(d.ingredientName)+"</td><td>"+t(d.unit)+"</td><td>"+t(d.orderedQuantity)+"</td><td><strong>"+t(Number(d.receivedQuantity||0))+"</strong></td><td>"+Number(d.unitPrice||0).toLocaleString()+" د.ع</td><td><strong>"+g(d).toLocaleString()+" د.ع</strong></td></tr>").join(""),ye=e.notes?'<div class="notes-section"><h4>📝 ملاحظات:</h4><div class="notes-content">'+t(e.notes)+"</div></div>":"";e.status==="received"||e.status;const W=window.open("","","height=842,width=595"),we='<!DOCTYPE html><html dir="rtl" lang="ar"><head>  <meta charset="UTF-8">  <title>إيصال استلام - '+t(e.purchaseNumber)+"</title>  <style>"+`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      direction: rtl;
      padding: 30px;
      background: var(--t-surface);
      color: #333;
    }
    
    .invoice-container {
      max-width: 210mm;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      border: 2px solid #023F4B;
      padding: 0;
      background: var(--t-surface);
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    .invoice-header {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-bottom: 4px solid #1F7F90;
    }
    
    .cafe-logo {
      width: 80px;
      height: 80px;
      margin: 0 auto 15px;
      background: var(--t-surface);
      padding: 10px;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .company-name {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .company-tagline {
      font-size: 16px;
      opacity: 0.9;
      margin-bottom: 15px;
      font-style: italic;
    }
    
    .document-title {
      font-size: 24px;
      font-weight: bold;
      background: rgba(255,255,255,0.2);
      padding: 10px 30px;
      display: inline-block;
      border-radius: 8px;
      margin-top: 10px;
    }
    
    .info-section {
      padding: 30px;
      background: #f9f9f9;
    }
    
    .info-box {
      background: var(--t-surface);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .info-box h3 {
      color: #023F4B;
      font-size: 16px;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1F7F90;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #eee;
    }
    
    .info-row:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-weight: bold;
      color: #666;
    }
    
    .info-value {
      color: #333;
    }
    
    .purchase-number {
      font-size: 20px;
      color: #023F4B;
      font-weight: bold;
    }
    
    .items-section {
      padding: 30px;
    }
    
    .items-section h3 {
      color: #023F4B;
      font-size: 18px;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1F7F90;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    
    thead {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
    }
    
    th {
      padding: 15px;
      text-align: center;
      font-weight: bold;
      font-size: 14px;
    }
    
    tbody tr {
      border-bottom: 1px solid #e0e0e0;
    }
    
    tbody tr:nth-child(even) {
      background: #f9f9f9;
    }
    
    tbody tr:hover {
      background: #f0f0f0;
    }
    
    td {
      padding: 12px;
      text-align: center;
    }
    
    td:first-child {
      text-align: right;
      font-weight: 500;
    }
    
    .totals-section {
      padding: 20px 30px 30px;
      background: #f9f9f9;
    }
    
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      margin-bottom: 10px;
      background: var(--t-surface);
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    
    .total-row.grand-total {
      background: linear-gradient(135deg, #023F4B 0%, #046375 100%);
      color: white;
      font-size: 20px;
      font-weight: bold;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .total-label {
      font-weight: bold;
    }
    
    .total-amount {
      font-family: 'Courier New', monospace;
    }
    
    .invoice-footer {
      padding: 30px;
      background: #f9f9f9;
      border-top: 2px solid #1F7F90;
    }
    
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
      margin-top: 50px;
    }
    
    .signature-box {
      text-align: center;
    }
    
    .signature-line {
      border-top: 2px solid #333;
      margin-bottom: 10px;
      padding-top: 5px;
    }
    
    .signature-label {
      font-weight: bold;
      color: #666;
      font-size: 14px;
    }
    
    .notes-section {
      margin-bottom: 30px;
    }
    
    .notes-section h4 {
      color: #023F4B;
      margin-bottom: 10px;
    }
    
    .notes-content {
      background: var(--t-surface);
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      min-height: 60px;
    }
    
    .stamp-area {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      color: #999;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .invoice-container {
        border: none;
      }
      
      @page {
        margin: 10mm;
      }
    }
    
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    
    .status-pending {
      background: #fff3cd;
      color: #856404;
    }
    
    .status-received {
      background: #d4edda;
      color: #155724;
    }
    
    .status-partial {
      background: #d1ecf1;
      color: #0c5460;
    }
  `+'</style></head><body>  <div class="invoice-container">    <!-- Header -->    <div class="invoice-header">      <div class="cafe-logo">        <img src="'+te+'" alt="Gusto Restaurant" style="width: 100%; height: 100%; object-fit: contain;" />      </div>      <div class="company-name">مطعم جوستو</div>      <div class="company-tagline">Gusto Restaurant</div>      <div class="document-title">إيصال استلام - Goods Received Note</div>    </div>    <!-- Info Section -->    <div class="info-section">      <div class="info-box" style="max-width: 600px; margin: 0 auto;">        <h3>📋 معلومات الاستلام</h3>        <div class="info-row">          <span class="info-label">رقم الأمر:</span>          <span class="info-value purchase-number">'+t(e.purchaseNumber)+'</span>        </div>        <div class="info-row">          <span class="info-label">المورد:</span>          <span class="info-value">'+t(r)+'</span>        </div>        <div class="info-row">          <span class="info-label">تاريخ الطلب:</span>          <span class="info-value">'+J(e.purchaseDate)+'</span>        </div>        <div class="info-row">          <span class="info-label">تاريخ التسليم المتوقع:</span>          <span class="info-value">'+(e.expectedDeliveryDate?J(e.expectedDeliveryDate):"غير محدد")+"</span>        </div>"+(e.receivedByName?'        <div class="info-row">          <span class="info-label">المستلم:</span>          <span class="info-value">'+t(e.receivedByName)+"</span>        </div>":"")+'      </div>    </div>    <!-- Items Section -->    <div class="items-section">      <h3>📦 الأصناف المستلمة</h3>      <table>        <thead>          <tr>            <th>اسم الصنف</th>            <th>الوحدة</th>            <th>الكمية المطلوبة</th>            <th>الكمية المستلمة</th>            <th>سعر الوحدة</th>            <th>قيمة المستلم</th>          </tr>        </thead>        <tbody>'+he+'        </tbody>      </table>    </div>    <!-- Totals Section -->    <div class="totals-section">      <div class="total-row">        <span class="total-label">عدد الأصناف المستلمة:</span>        <span class="total-amount">'+S+" من "+e.items.length+' صنف</span>      </div>      <div class="total-row">        <span class="total-label">قيمة أمر الشراء:</span>        <span class="total-amount">'+Number(e.totalAmount||0).toLocaleString()+' د.ع</span>      </div>      <div class="total-row grand-total">        <span class="total-label">💰 إجمالي قيمة المستلم:</span>        <span class="total-amount">'+F.toLocaleString()+' د.ع</span>      </div>    </div>    <!-- Footer -->    <div class="invoice-footer">'+ye+'            <div class="signatures">        <div class="signature-box">          <div class="signature-line">التوقيع</div>          <div class="signature-label">المستلم</div>        </div>        <div class="signature-box">          <div class="signature-line">التاريخ</div>          <div class="signature-label">تاريخ الاستلام</div>        </div>      </div>    </div>  </div>    <script>    window.onload = function() {      window.print();    }  <\/script></body></html>';W.document.write(we),W.document.close()},q=i=>({pending:"warning",partially_received:"info",received:"success",cancelled:"error"})[i]||"grey",fe=i=>({pending:"mdi-clock-outline",partially_received:"mdi-package-variant",received:"mdi-check-circle",cancelled:"mdi-close-circle"})[i]||"mdi-help-circle",Y=i=>({pending:"قيد الانتظار",partially_received:"مستلم جزئياً",received:"مستلم بالكامل",cancelled:"ملغي"})[i]||i,A=i=>i?new Date(i).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"",J=i=>{if(!i)return"";const e=new Date(i),t=String(e.getDate()).padStart(2,"0"),r=String(e.getMonth()+1).padStart(2,"0"),g=e.getFullYear();return t+"/"+r+"/"+g},xe=()=>{};return Te(()=>{O()}),(i,e)=>(v(),h(Ie,null,{default:o(()=>[a(ze,{fluid:"",class:"pa-6"},{default:o(()=>[a(T,{class:"mb-6"},{default:o(()=>[a(p,{cols:"12"},{default:o(()=>[a(w,{class:"pa-6 page-banner",elevation:"0"},{default:o(()=>{var t;return[e[7]||(e[7]=s("div",{style:{position:"absolute",top:"-40px",right:"-40px",width:"160px",height:"160px","border-radius":"50%",background:"rgba(255,255,255,0.08)"}},null,-1)),e[8]||(e[8]=s("div",{style:{position:"absolute",bottom:"-30px",left:"-30px",width:"120px",height:"120px","border-radius":"50%",background:"rgba(255,255,255,0.08)"}},null,-1)),s("div",je,[s("div",Ge,[a(Ve,{size:"80",class:"ml-6 elevation-4",color:"white",style:{"border-radius":"12px"}},{default:o(()=>[s("img",{src:c(te),alt:"جوستو",style:{width:"100%",height:"100%","object-fit":"contain",padding:"8px"}},null,8,Oe)]),_:1}),s("div",Ee,[s("h1",Ue," مرحباً، "+l((t=c(le).user)==null?void 0:t.fullName)+" 👋 ",1),e[6]||(e[6]=s("p",{class:"text-body-1 text-white mb-1",style:{opacity:"0.95"}}," استلام المواد والمخزون ",-1)),s("p",Me,l(re.value),1)])])])]}),_:1})]),_:1})]),_:1}),a(w,{elevation:"0",style:{background:"var(--t-surface)",border:"1px solid var(--t-border)","border-radius":"12px"},class:"mb-4"},{default:o(()=>[a(Pe,{modelValue:C.value,"onUpdate:modelValue":[e[0]||(e[0]=t=>C.value=t),xe],"bg-color":"transparent",color:"#046375",grow:""},{default:o(()=>[a(Q,{value:"all"},{default:o(()=>[a(c(Le),{size:20,class:"ml-2"}),u(" الكل ("+l(x.value.length)+") ",1)]),_:1}),a(Q,{value:"pending"},{default:o(()=>[a(c(Be),{size:20,class:"ml-2"}),u(" قيد الانتظار ("+l(ne.value)+") ",1)]),_:1}),a(Q,{value:"partially_received"},{default:o(()=>[a(c(Re),{size:20,class:"ml-2"}),u(" مستلم جزئياً ("+l(de.value)+") ",1)]),_:1}),a(Q,{value:"received"},{default:o(()=>[a(c(V),{size:20,class:"ml-2"}),u(" مستلم بالكامل ("+l(ce.value)+") ",1)]),_:1})]),_:1},8,["modelValue"])]),_:1}),a(w,{elevation:"0",style:{background:"var(--t-surface)",border:"1px solid var(--t-border)","border-radius":"12px"}},{default:o(()=>[a(H,{class:"pa-0"},{default:o(()=>[a(K,{headers:pe,items:ue.value,"items-per-page":15,loading:I.value.purchases,class:"elevation-0 purchases-table"},{"item.purchaseNumber":o(({item:t})=>[s("div",qe,l(t.purchaseNumber),1),s("div",Ye,l(A(t.purchaseDate)),1)]),"item.supplierName":o(({item:t})=>[s("div",null,[s("div",Je,l(t.supplierName),1),t.supplierPhone?(v(),ie("div",We,[a(c(Ae),{size:12,weight:"bold"}),u(" "+l(t.supplierPhone),1)])):_("",!0)])]),"item.totalAmount":o(({item:t})=>[s("div",Ke,l(Number(t.totalAmount).toLocaleString())+" د.ع ",1)]),"item.status":o(({item:t})=>[a(R,{color:q(t.status),size:"small",variant:"flat",style:{"font-weight":"bold"}},{prepend:o(()=>[a(Ce,{size:"16"},{default:o(()=>[u(l(fe(t.status)),1)]),_:2},1024)]),default:o(()=>[u(" "+l(Y(t.status)),1)]),_:2},1032,["color"])]),"item.itemsCount":o(({item:t})=>[s("div",Xe,[a(R,{size:"small",style:{background:"var(--t-border-subtle)",color:"#046375"}},{default:o(()=>[u(l(t.itemsCount)+" صنف ",1)]),_:2},1024)])]),"item.actions":o(({item:t})=>[s("div",Ze,[a($,{text:"عرض التفاصيل",location:"top"},{activator:o(({props:r})=>[a(b,G(r,{icon:"",size:"small",variant:"text",color:"primary",onClick:g=>be(t),"aria-label":"عرض التفاصيل"}),{default:o(()=>[a(c(oe),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024),t.status==="pending"||t.status==="partially_received"?(v(),h($,{key:0,text:"استلام",location:"top"},{activator:o(({props:r})=>[a(b,G(r,{icon:"",size:"small",variant:"text",color:"success",onClick:g=>E(t),"aria-label":"استلام"}),{default:o(()=>[a(c(V),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024)):_("",!0),a($,{text:"طباعة",location:"top"},{activator:o(({props:r})=>[a(b,G(r,{icon:"",size:"small",variant:"text",color:"secondary",onClick:g=>M(t),"aria-label":"طباعة"}),{default:o(()=>[a(c(se),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024)])]),_:1},8,["items","loading"])]),_:1})]),_:1})]),_:1}),a(X,{modelValue:D.value,"onUpdate:modelValue":e[1]||(e[1]=t=>D.value=t),"max-width":"800",persistent:"",scrollable:""},{default:o(()=>[a(w,{elevation:"0",style:{"border-radius":"16px",overflow:"hidden"}},{default:o(()=>[s("div",et,[s("div",tt,[s("div",at,[a(c(V),{size:24,weight:"bold",color:"white"})]),e[9]||(e[9]=s("div",null,[s("h3",{class:"text-h6 font-weight-bold text-white mb-1"}," استلام أمر الشراء "),s("p",{class:"text-body-2 text-white mb-0",style:{opacity:"0.9"}}," Receive Purchase Order - Confirm Quantities ")],-1))])]),y.value?(v(),h(H,{key:0,class:"pa-6",style:{"max-height":"600px",background:"var(--t-surface)"}},{default:o(()=>[a(De,{type:"info",variant:"tonal",class:"mb-6",style:{"border-radius":"8px"}},{default:o(()=>[s("div",ot,"رقم الأمر: "+l(y.value.purchaseNumber),1),s("div",null,"المورد: "+l(y.value.supplierName),1),e[10]||(e[10]=s("div",{class:"text-caption"},"تأكد من الكميات المستلمة قبل الحفظ - سيتم تحديث المخزون تلقائياً",-1))]),_:1}),e[13]||(e[13]=s("div",{class:"text-h6 font-weight-bold mb-4",style:{color:"var(--t-text)"}}," الأصناف المستلمة: ",-1)),(v(!0),ie(He,null,$e(N.value.items,(t,r)=>(v(),h(w,{key:r,variant:"outlined",class:"mb-3 pa-4",style:{"border-color":"#E5E7EB","border-radius":"12px"}},{default:o(()=>[a(T,{align:"center"},{default:o(()=>[a(p,{cols:"12",md:"4"},{default:o(()=>[s("div",st,l(t.ingredientName),1),s("div",it,l(t.unit),1)]),_:2},1024),a(p,{cols:"12",md:"3"},{default:o(()=>[e[11]||(e[11]=s("div",{class:"text-caption text-grey"},"الكمية المطلوبة",-1)),s("div",lt,l(t.orderedQuantity),1)]),_:2},1024),a(p,{cols:"12",md:"3"},{default:o(()=>[e[12]||(e[12]=s("div",{class:"text-caption text-grey"},"مستلم سابقاً",-1)),s("div",rt,l(t.receivedQuantity||0),1)]),_:2},1024),a(p,{cols:"12",md:"2"},{default:o(()=>[a(Fe,{modelValue:t.newReceived,"onUpdate:modelValue":g=>t.newReceived=g,modelModifiers:{number:!0},label:"الكمية المستلمة",type:"number",variant:"outlined",density:"compact",rules:[ve.required],max:t.orderedQuantity-(t.receivedQuantity||0),color:"#046375"},null,8,["modelValue","onUpdate:modelValue","rules","max"])]),_:2},1024)]),_:2},1024)]),_:2},1024))),128))]),_:1})):_("",!0),a(j),a(Z,{class:"pa-4",style:{background:"var(--t-surface-high)"}},{default:o(()=>[a(b,{variant:"text",size:"large",onClick:U,style:{color:"var(--t-text-dim)"}},{default:o(()=>[a(c(ae),{size:20,weight:"bold",class:"ml-1"}),e[14]||(e[14]=u(" إلغاء ",-1))]),_:1}),a(ee),a(b,{color:"#046375",variant:"flat",size:"large",loading:B.value,onClick:me,style:{"border-radius":"8px"}},{default:o(()=>[a(c(V),{size:20,weight:"bold",class:"ml-1"}),e[15]||(e[15]=u(" تأكيد الاستلام ",-1))]),_:1},8,["loading"])]),_:1})]),_:1})]),_:1},8,["modelValue"]),a(X,{modelValue:k.value,"onUpdate:modelValue":e[5]||(e[5]=t=>k.value=t),"max-width":"900",scrollable:""},{default:o(()=>[a(w,{elevation:"0",style:{"border-radius":"16px",overflow:"hidden"}},{default:o(()=>[s("div",nt,[s("div",dt,[s("div",ct,[a(c(oe),{size:24,weight:"bold",color:"white"})]),e[16]||(e[16]=s("div",null,[s("h3",{class:"text-h6 font-weight-bold text-white mb-1"}," تفاصيل أمر الشراء "),s("p",{class:"text-body-2 text-white mb-0",style:{opacity:"0.9"}}," Purchase Order Details ")],-1))])]),n.value?(v(),h(H,{key:0,class:"pa-6",style:{background:"var(--t-surface)"}},{default:o(()=>[a(T,null,{default:o(()=>[a(p,{cols:"12",md:"6"},{default:o(()=>[e[17]||(e[17]=s("div",{class:"text-caption text-grey"},"رقم الأمر",-1)),s("div",ut,l(n.value.purchaseNumber),1)]),_:1}),a(p,{cols:"12",md:"6"},{default:o(()=>[e[18]||(e[18]=s("div",{class:"text-caption text-grey"},"الحالة",-1)),a(R,{color:q(n.value.status),class:"mb-3"},{default:o(()=>[u(l(Y(n.value.status)),1)]),_:1},8,["color"])]),_:1}),a(p,{cols:"12",md:"6"},{default:o(()=>[e[19]||(e[19]=s("div",{class:"text-caption text-grey"},"المورد",-1)),s("div",pt,l(n.value.supplierName),1)]),_:1}),a(p,{cols:"12",md:"6"},{default:o(()=>[e[20]||(e[20]=s("div",{class:"text-caption text-grey"},"هاتف المورد",-1)),s("div",gt,l(n.value.supplierPhone||"غير محدد"),1)]),_:1}),a(p,{cols:"12",md:"6"},{default:o(()=>[e[21]||(e[21]=s("div",{class:"text-caption text-grey"},"تاريخ الطلب",-1)),s("div",vt,l(A(n.value.purchaseDate)),1)]),_:1}),a(p,{cols:"12",md:"6"},{default:o(()=>[e[22]||(e[22]=s("div",{class:"text-caption text-grey"},"تاريخ التسليم المتوقع",-1)),s("div",mt,l(n.value.expectedDeliveryDate?A(n.value.expectedDeliveryDate):"غير محدد"),1)]),_:1}),a(p,{cols:"12"},{default:o(()=>[e[23]||(e[23]=s("div",{class:"text-caption",style:{color:"var(--t-text-dim)"}},"المبلغ الإجمالي",-1)),s("div",bt,l(Number(n.value.totalAmount).toLocaleString())+" د.ع ",1)]),_:1}),n.value.notes?(v(),h(p,{key:0,cols:"12"},{default:o(()=>[e[24]||(e[24]=s("div",{class:"text-caption text-grey"},"ملاحظات",-1)),s("div",ft,l(n.value.notes),1)]),_:1})):_("",!0)]),_:1}),a(j,{class:"my-4"}),e[25]||(e[25]=s("div",{class:"text-h6 font-weight-bold mb-4"},"الأصناف:",-1)),a(K,{headers:ge,items:n.value.items||[],"items-per-page":-1,class:"elevation-0",density:"comfortable"},{"item.ingredientName":o(({item:t})=>[s("div",xt,l(t.ingredientName),1),s("div",ht,l(t.unit),1)]),"item.orderedQuantity":o(({item:t})=>[s("div",yt,l(t.orderedQuantity),1)]),"item.receivedQuantity":o(({item:t})=>[a(R,{color:t.receivedQuantity>=t.orderedQuantity?"success":t.receivedQuantity>0?"warning":"grey",size:"small"},{default:o(()=>[u(l(t.receivedQuantity||0)+" / "+l(t.orderedQuantity),1)]),_:2},1032,["color"])]),"item.unitPrice":o(({item:t})=>[s("div",wt,l(Number(t.unitPrice).toLocaleString())+" د.ع",1)]),"item.totalPrice":o(({item:t})=>[s("div",_t,l((t.orderedQuantity*t.unitPrice).toLocaleString())+" د.ع ",1)]),_:1},8,["items"])]),_:1})):_("",!0),a(j),a(Z,{class:"pa-4",style:{background:"var(--t-surface-high)"}},{default:o(()=>[a(b,{variant:"text",size:"large",onClick:e[2]||(e[2]=t=>k.value=!1),style:{color:"var(--t-text-dim)"}},{default:o(()=>[a(c(ae),{size:20,weight:"bold",class:"ml-1"}),e[26]||(e[26]=u(" إغلاق ",-1))]),_:1}),a(ee),n.value&&(n.value.status==="pending"||n.value.status==="partially_received")?(v(),h(b,{key:0,color:"#046375",variant:"flat",size:"large",onClick:e[3]||(e[3]=t=>E(n.value)),style:{"border-radius":"8px"}},{default:o(()=>[a(c(V),{size:20,weight:"bold",class:"ml-1"}),e[27]||(e[27]=u(" استلام ",-1))]),_:1})):_("",!0),a(b,{color:"#046375",variant:"outlined",size:"large",onClick:e[4]||(e[4]=t=>M(n.value)),style:{"border-radius":"8px","border-color":"#046375"}},{default:o(()=>[a(c(se),{size:20,weight:"bold",class:"ml-1"}),e[28]||(e[28]=u(" طباعة ",-1))]),_:1})]),_:1})]),_:1})]),_:1},8,["modelValue"])]),_:1}))}},Tt=Qe(kt,[["__scopeId","data-v-ab87824c"]]);export{Tt as default};
