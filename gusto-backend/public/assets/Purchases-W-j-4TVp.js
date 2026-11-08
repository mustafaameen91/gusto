import{u as $e,b as Le,a as He,k as je,V as A,c as d,d as h,e as Ee,j as g,G as Ge,H as $,g as L,m as ue,a6 as J,L as H,a2 as Oe,x as K,i as w,U as ce,w as qe,R as Me,W as We,M as j,N as X,_ as Z,T as Ye,r as z,n as Je,a7 as Ke}from"./index-B6lqdK3e.js";import{t as pe,a as Xe}from"./dateFormatter-CFVLCaSe.js";import{_ as Ze,l as me}from"./_plugin-vue_export-helper-8yoCcMaT.js";import{H as ve,G as et,e as ee,A as tt}from"./AppLayout-nZqXTxNb.js";import{H as P}from"./PhCheckCircle.vue-DsPKNuGF.js";import{I as at}from"./PhClock.vue-BLpwWj9j.js";import{I as ge}from"./PhEye.vue-C_C57yUp.js";import{H as lt}from"./PhPhone.vue-UDpqrJfI.js";import{I as fe}from"./PhPlus.vue-ClSLp09g.js";import{I as be}from"./PhPrinter.vue-CU74pqBP.js";import{J as ot}from"./PhStack.vue-ZIeCg8Hv.js";import{G as st}from"./PhTrash.vue-BT6Hx9eQ.js";import{r as f,o as it,L as b,M as _,N as l,O as t,G as o,P as u,aG as i,bl as c,V as E,cg as k,cf as R,ag as xe,ci as ye,q as C}from"./vuetify-BVA7vC6K.js";import"./pdf-CDdaJDAX.js";const rt={class:"d-flex align-center justify-space-between flex-wrap",style:{position:"relative","z-index":"2"}},nt={class:"d-flex align-center flex-wrap"},dt=["src"],ut={class:"flex-grow-1"},ct={class:"text-h4 font-weight-bold text-white mb-2",style:{"letter-spacing":"-0.5px"}},pt={class:"text-body-2 text-white",style:{opacity:"0.85"}},mt={class:"font-weight-bold",style:{color:"#046375"}},vt={class:"text-caption",style:{color:"var(--t-text-dim)"}},gt={class:"font-weight-medium"},ft={key:0,class:"text-caption text-grey"},bt={class:"font-weight-bold text-h6",style:{color:"#046375"}},xt={class:"text-center"},yt={class:"d-flex ga-2"},ht={style:{background:"#046375",padding:"24px"}},wt={class:"d-flex align-center"},_t={style:{width:"48px",height:"48px","border-radius":"10px",background:"rgba(255,255,255,0.2)",display:"flex","align-items":"center","justify-content":"center","margin-left":"12px"}},kt={class:"mb-6"},Vt={key:0,class:"text-caption mt-1",style:{color:"var(--t-text-dim)"}},zt={class:"text-h6 font-weight-bold mb-4 d-flex align-center justify-space-between",style:{color:"var(--t-text)"}},Nt={key:0,class:"text-center pa-8",style:{background:"var(--t-surface-high)",border:"1px solid var(--t-border)","border-radius":"12px"}},Dt={style:{background:"#046375",padding:"24px"}},Pt={class:"d-flex align-center"},Ct={style:{width:"48px",height:"48px","border-radius":"10px",background:"rgba(255,255,255,0.2)",display:"flex","align-items":"center","justify-content":"center","margin-left":"12px"}},It={class:"font-weight-bold mb-1"},Ft={class:"font-weight-bold"},St={class:"text-caption text-grey"},Qt={class:"font-weight-bold"},At={class:"font-weight-medium text-success"},Rt={style:{background:"#046375",padding:"24px"}},Tt={class:"d-flex align-center"},Ut={style:{width:"48px",height:"48px","border-radius":"10px",background:"rgba(255,255,255,0.2)",display:"flex","align-items":"center","justify-content":"center","margin-left":"12px"}},Bt={class:"font-weight-bold text-h6 mb-3"},$t={class:"font-weight-medium mb-3"},Lt={class:"font-weight-medium mb-3"},Ht={class:"font-weight-medium mb-3"},jt={class:"font-weight-medium mb-3"},Et={class:"font-weight-bold text-h5 mb-3",style:{color:"#046375"}},Gt={class:"mb-3"},Ot={class:"font-weight-medium"},qt={class:"text-caption text-grey"},Mt={class:"font-weight-bold"},Wt={class:"font-weight-medium"},Yt={class:"font-weight-bold",style:{color:"#046375"}},Jt={__name:"Purchases",setup(Kt){$e();const v=Le(),G=He(),he=C(()=>Xe()),V=f([]),te=f([]),T=f("all"),O=f({purchases:!1}),U=f(!1),B=f(!1),I=f(!1),N=f(!1),D=f(null),m=f(null),n=f({purchaseNumber:"",supplierId:null,supplierName:"",supplierPhone:"",purchaseDate:pe(),expectedDeliveryDate:"",totalAmount:0,paymentType:"credit",notes:"",items:[]}),q=f([]),F=f({items:[]}),we=C(()=>V.value.filter(s=>s.status==="pending").length),_e=C(()=>V.value.filter(s=>s.status==="partially_received").length),ke=C(()=>V.value.filter(s=>s.status==="received").length),Ve=C(()=>T.value==="all"?V.value:V.value.filter(s=>s.status===T.value)),ae=C(()=>{var s,e;return((s=G.user)==null?void 0:s.role)==="admin"||((e=G.user)==null?void 0:e.role)==="storage"}),ze=[{title:"رقم الأمر",key:"purchaseNumber",width:"15%"},{title:"المورد",key:"supplierName",width:"20%"},{title:"المبلغ الإجمالي",key:"totalAmount",align:"center",width:"15%"},{title:"الحالة",key:"status",align:"center",width:"12%"},{title:"عدد الأصناف",key:"itemsCount",align:"center",width:"10%"},{title:"إجراءات",key:"actions",sortable:!1,align:"center",width:"15%"}],Ne=[{title:"المكون",key:"ingredientName",width:"30%"},{title:"الكمية المطلوبة",key:"orderedQuantity",align:"center"},{title:"الكمية المستلمة",key:"receivedQuantity",align:"center"},{title:"سعر الوحدة",key:"unitPrice",align:"center"},{title:"المجموع",key:"totalPrice",align:"center"}],S={required:s=>!!s||"مطلوب"},M=async()=>{O.value.purchases=!0;try{const s=await z.getAll();V.value=s.data}catch(s){v.error("فشل تحميل أوامر الشراء"),console.error(s)}finally{O.value.purchases=!1}},De=async()=>{try{const s=await Je.getAll();te.value=s.data}catch(s){v.error("فشل تحميل المكونات"),console.error(s)}},Pe=async()=>{try{const s=await z.generateNumber();n.value={purchaseNumber:s.data.purchaseNumber,supplierId:null,purchaseDate:pe(),expectedDeliveryDate:"",totalAmount:0,paymentType:"credit",notes:"",items:[]},U.value=!0}catch(s){v.error("فشل إنشاء رقم الأمر"),console.error(s)}},le=()=>{U.value=!1,n.value.items=[]},Ce=()=>{n.value.items.push({ingredientId:null,orderedQuantity:0,unitPrice:0,notes:""})},Ie=s=>{n.value.items.splice(s,1),W()},W=()=>{const s=n.value.items.reduce((e,a)=>e+a.orderedQuantity*a.unitPrice,0);n.value.totalAmount=s},Fe=async()=>{var s,e;if(!n.value.supplierId){v.error("يجب اختيار المورد من القائمة");return}if(n.value.items.length===0){v.error("يجب إضافة صنف واحد على الأقل");return}N.value=!0;try{await z.create(n.value),v.success("✅ تم إنشاء أمر الشراء بنجاح"),await M(),le()}catch(a){v.error(((e=(s=a.response)==null?void 0:s.data)==null?void 0:e.message)||"فشل حفظ أمر الشراء"),console.error(a)}finally{N.value=!1}},oe=async s=>{try{const e=await z.getOne(s.idPurchase);D.value=e.data,F.value.items=e.data.items.map(a=>({...a,newReceived:0})),B.value=!0,I.value=!1}catch(e){v.error("فشل تحميل تفاصيل الأمر"),console.error(e)}},se=()=>{B.value=!1,D.value=null,F.value.items=[]},Se=async()=>{var e,a;console.log("🔍 Frontend: confirmReceive called"),console.log("📋 receiveForm.items:",F.value.items);const s=F.value.items.filter(r=>r.newReceived>0).map(r=>{const p=parseFloat(r.receivedQuantity)||0,y=parseFloat(r.newReceived)||0,Q=p+y;return console.log(`  Item ${r.idPurchaseItem}:`,{ingredientName:r.ingredientName,oldReceived:p,newReceived:y,totalReceived:Q,ordered:r.orderedQuantity}),{idPurchaseItem:r.idPurchaseItem,ingredientId:r.ingredientId,receivedQuantity:Q}});if(console.log("📤 Sending to backend:",s),s.length===0){v.error("يجب تحديد كمية مستلمة لصنف واحد على الأقل");return}N.value=!0;try{const r=await z.receive(D.value.idPurchase,{items:s});console.log("✅ Backend response:",r.data),v.success("✅ تم تأكيد الاستلام وتحديث المخزون"),await M(),se()}catch(r){console.error("❌ Receive error:",r),v.error(((a=(e=r.response)==null?void 0:e.data)==null?void 0:a.message)||"فشل تأكيد الاستلام")}finally{N.value=!1}},Qe=async s=>{try{const e=await z.getOne(s.idPurchase);m.value=e.data,I.value=!0}catch(e){v.error("فشل تحميل تفاصيل الأمر"),console.error(e)}},ie=async s=>{let e=s;if(!s.items||s.items.length===0)try{e=(await z.getOne(s.idPurchase)).data}catch(x){console.error("Failed to load purchase details:",x),v.error("فشل تحميل تفاصيل الأمر");return}const a=x=>String(x??"").replace(/[&<>"']/g,Be=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[Be]),r=e.supplierName||s.supplierName||"غير محدد",p=e.items.map(x=>"<tr><td>"+a(x.ingredientName)+"</td><td>"+a(x.unit)+"</td><td>"+x.orderedQuantity+"</td><td>"+Number(x.unitPrice).toLocaleString()+" د.ع</td><td><strong>"+(x.orderedQuantity*x.unitPrice).toLocaleString()+" د.ع</strong></td></tr>").join(""),y=e.notes?'<div class="notes-section"><h4>📝 ملاحظات:</h4><div class="notes-content">'+a(e.notes)+"</div></div>":"";e.status==="received"||e.status;const Q=window.open("","","height=842,width=595"),Ue='<!DOCTYPE html><html dir="rtl" lang="ar"><head>  <meta charset="UTF-8">  <title>أمر شراء - '+a(e.purchaseNumber)+"</title>  <style>"+`
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
  `+'</style></head><body>  <div class="invoice-container">    <!-- Header -->    <div class="invoice-header">      <div class="cafe-logo">        <img src="'+me+'" alt="Gusto Restaurant" style="width: 100%; height: 100%; object-fit: contain;" />      </div>      <div class="company-name">مطعم جوستو</div>      <div class="company-tagline">Gusto Restaurant</div>      <div class="document-title">أمر شراء - Purchase Order</div>    </div>    <!-- Info Section -->    <div class="info-section">      <div class="info-box" style="max-width: 600px; margin: 0 auto;">        <h3>📋 معلومات أمر الشراء</h3>        <div class="info-row">          <span class="info-label">رقم الأمر:</span>          <span class="info-value purchase-number">'+a(e.purchaseNumber)+'</span>        </div>        <div class="info-row">          <span class="info-label">المورد:</span>          <span class="info-value">'+a(r)+'</span>        </div>        <div class="info-row">          <span class="info-label">تاريخ الطلب:</span>          <span class="info-value">'+de(e.purchaseDate)+'</span>        </div>        <div class="info-row">          <span class="info-label">تاريخ التسليم المتوقع:</span>          <span class="info-value">'+(e.expectedDeliveryDate?de(e.expectedDeliveryDate):"غير محدد")+'</span>        </div>      </div>    </div>    <!-- Items Section -->    <div class="items-section">      <h3>📦 الأصناف المطلوبة</h3>      <table>        <thead>          <tr>            <th>اسم الصنف</th>            <th>الوحدة</th>            <th>الكمية المطلوبة</th>            <th>سعر الوحدة</th>            <th>المجموع</th>          </tr>        </thead>        <tbody>'+p+'        </tbody>      </table>    </div>    <!-- Totals Section -->    <div class="totals-section">      <div class="total-row">        <span class="total-label">عدد الأصناف:</span>        <span class="total-amount">'+e.items.length+' صنف</span>      </div>      <div class="total-row grand-total">        <span class="total-label">💰 المبلغ الإجمالي:</span>        <span class="total-amount">'+Number(e.totalAmount).toLocaleString()+' د.ع</span>      </div>    </div>    <!-- Footer -->    <div class="invoice-footer">'+y+'            <div class="signatures">        <div class="signature-box">          <div class="signature-line">التوقيع</div>          <div class="signature-label">المشتري</div>        </div>        <div class="signature-box">          <div class="signature-line">التاريخ</div>          <div class="signature-label">تاريخ الاستلام</div>        </div>      </div>    </div>  </div>    <script>    window.onload = function() {      window.print();    }  <\/script></body></html>';Q.document.write(Ue),Q.document.close()},re=s=>({pending:"warning",partially_received:"info",received:"success",cancelled:"error"})[s]||"grey",Ae=s=>({pending:"mdi-clock-outline",partially_received:"mdi-package-variant",received:"mdi-check-circle",cancelled:"mdi-close-circle"})[s]||"mdi-help-circle",ne=s=>({pending:"قيد الانتظار",partially_received:"مستلم جزئياً",received:"مستلم بالكامل",cancelled:"ملغي"})[s]||s,Y=s=>s?new Date(s).toLocaleDateString("ar-EG",{year:"numeric",month:"long",day:"numeric"}):"",de=s=>{if(!s)return"";const e=new Date(s),a=String(e.getDate()).padStart(2,"0"),r=String(e.getMonth()+1).padStart(2,"0"),p=e.getFullYear();return a+"/"+r+"/"+p},Re=()=>{},Te=async()=>{try{const s=await Ke.getAll();q.value=s.data||[]}catch{q.value=[]}};return it(()=>{M(),De(),Te()}),(s,e)=>(b(),_(tt,null,{default:l(()=>[t(je,{fluid:"",class:"pa-6"},{default:l(()=>[t(A,{class:"mb-6"},{default:l(()=>[t(d,{cols:"12"},{default:l(()=>[t(h,{class:"pa-6 page-banner",elevation:"0"},{default:l(()=>{var a;return[e[16]||(e[16]=o("div",{style:{position:"absolute",top:"-40px",right:"-40px",width:"160px",height:"160px","border-radius":"50%",background:"rgba(255,255,255,0.08)"}},null,-1)),e[17]||(e[17]=o("div",{style:{position:"absolute",bottom:"-30px",left:"-30px",width:"120px",height:"120px","border-radius":"50%",background:"rgba(255,255,255,0.08)"}},null,-1)),o("div",rt,[o("div",nt,[t(Ee,{size:"80",class:"ml-6 elevation-4",color:"white",style:{"border-radius":"12px"}},{default:l(()=>[o("img",{src:u(me),alt:"جوستو",style:{width:"100%",height:"100%","object-fit":"contain",padding:"8px"}},null,8,dt)]),_:1}),o("div",ut,[o("h1",ct," مرحباً، "+i((a=u(G).user)==null?void 0:a.fullName)+" 👋 ",1),e[14]||(e[14]=o("p",{class:"text-body-1 text-white mb-1",style:{opacity:"0.95"}}," أوامر الشراء والاستلام ",-1)),o("p",pt,i(he.value),1)])]),t(g,{onClick:Pe,color:"orange",variant:"flat",size:"large",style:{"border-radius":"12px",color:"#046375","font-weight":"600"}},{default:l(()=>[t(u(fe),{size:20,weight:"bold",class:"ml-1"}),e[15]||(e[15]=c(" إنشاء أمر شراء جديد ",-1))]),_:1})])]}),_:1})]),_:1})]),_:1}),t(h,{elevation:"0",style:{background:"var(--t-surface)",border:"1px solid var(--t-border)","border-radius":"12px"},class:"mb-4"},{default:l(()=>[t(Ge,{modelValue:T.value,"onUpdate:modelValue":[e[0]||(e[0]=a=>T.value=a),Re],"bg-color":"transparent",color:"#046375",grow:""},{default:l(()=>[t($,{value:"all"},{default:l(()=>[t(u(ot),{size:20,class:"ml-2"}),c(" الكل ("+i(V.value.length)+") ",1)]),_:1}),t($,{value:"pending"},{default:l(()=>[t(u(at),{size:20,class:"ml-2"}),c(" قيد الانتظار ("+i(we.value)+") ",1)]),_:1}),t($,{value:"partially_received"},{default:l(()=>[t(u(ve),{size:20,class:"ml-2"}),c(" مستلم جزئياً ("+i(_e.value)+") ",1)]),_:1}),t($,{value:"received"},{default:l(()=>[t(u(P),{size:20,class:"ml-2"}),c(" مستلم بالكامل ("+i(ke.value)+") ",1)]),_:1})]),_:1},8,["modelValue"])]),_:1}),t(h,{elevation:"0",style:{background:"var(--t-surface)",border:"1px solid var(--t-border)","border-radius":"12px"}},{default:l(()=>[t(L,{class:"pa-0"},{default:l(()=>[t(ue,{headers:ze,items:Ve.value,"items-per-page":15,loading:O.value.purchases,class:"elevation-0 purchases-table"},{"item.purchaseNumber":l(({item:a})=>[o("div",mt,i(a.purchaseNumber),1),o("div",vt,i(Y(a.purchaseDate)),1)]),"item.supplierName":l(({item:a})=>[o("div",null,[o("div",gt,i(a.supplierName),1),a.supplierPhone?(b(),R("div",ft,[t(u(lt),{size:12,weight:"bold"}),c(" "+i(a.supplierPhone),1)])):k("",!0)])]),"item.totalAmount":l(({item:a})=>[o("div",bt,i(Number(a.totalAmount).toLocaleString())+" د.ع ",1)]),"item.status":l(({item:a})=>[t(H,{color:re(a.status),size:"small",variant:"flat",style:{"font-weight":"bold"}},{prepend:l(()=>[t(Oe,{size:"16"},{default:l(()=>[c(i(Ae(a.status)),1)]),_:2},1024)]),default:l(()=>[c(" "+i(ne(a.status)),1)]),_:2},1032,["color"])]),"item.itemsCount":l(({item:a})=>[o("div",xt,[t(H,{size:"small",style:{background:"var(--t-border-subtle)",color:"#046375"}},{default:l(()=>[c(i(a.itemsCount)+" صنف ",1)]),_:2},1024)])]),"item.actions":l(({item:a})=>[o("div",yt,[t(J,{text:"عرض التفاصيل",location:"top"},{activator:l(({props:r})=>[t(g,E(r,{icon:"",size:"small",variant:"text",color:"primary",onClick:p=>Qe(a),"aria-label":"عرض التفاصيل"}),{default:l(()=>[t(u(ge),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024),(a.status==="pending"||a.status==="partially_received")&&ae.value?(b(),_(J,{key:0,text:"استلام",location:"top"},{activator:l(({props:r})=>[t(g,E(r,{icon:"",size:"small",variant:"text",color:"success",onClick:p=>oe(a),"aria-label":"استلام"}),{default:l(()=>[t(u(P),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024)):k("",!0),t(J,{text:"طباعة",location:"top"},{activator:l(({props:r})=>[t(g,E(r,{icon:"",size:"small",variant:"text",color:"secondary",onClick:p=>ie(a),"aria-label":"طباعة"}),{default:l(()=>[t(u(be),{size:20,weight:"bold"})]),_:1},16,["onClick"])]),_:2},1024)])]),_:1},8,["items","loading"])]),_:1})]),_:1})]),_:1}),t(K,{modelValue:U.value,"onUpdate:modelValue":e[8]||(e[8]=a=>U.value=a),"max-width":"900",persistent:"",scrollable:""},{default:l(()=>[t(h,{elevation:"0",style:{"border-radius":"16px",overflow:"hidden"}},{default:l(()=>[o("div",ht,[o("div",wt,[o("div",_t,[t(u(et),{size:24,weight:"bold",color:"white"})]),e[18]||(e[18]=o("div",null,[o("h3",{class:"text-h6 font-weight-bold text-white mb-1"}," إنشاء أمر شراء جديد "),o("p",{class:"text-body-2 text-white mb-0",style:{opacity:"0.9"}}," Create New Purchase Order ")],-1))])]),t(L,{class:"pa-6",style:{"max-height":"600px",background:"var(--t-surface)"}},{default:l(()=>[o("div",kt,[e[19]||(e[19]=o("div",{class:"text-h6 font-weight-bold mb-4",style:{color:"var(--t-text)"}}," معلومات الأمر ",-1)),t(A,null,{default:l(()=>[t(d,{cols:"12",md:"6"},{default:l(()=>[t(w,{modelValue:n.value.purchaseNumber,"onUpdate:modelValue":e[1]||(e[1]=a=>n.value.purchaseNumber=a),label:"رقم الأمر",variant:"outlined",density:"comfortable",readonly:"",color:"#046375"},null,8,["modelValue"])]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[t(w,{modelValue:n.value.purchaseDate,"onUpdate:modelValue":e[2]||(e[2]=a=>n.value.purchaseDate=a),label:"تاريخ الطلب",type:"date",variant:"outlined",density:"comfortable",color:"#046375"},null,8,["modelValue"])]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[t(ce,{modelValue:n.value.supplierId,"onUpdate:modelValue":e[3]||(e[3]=a=>n.value.supplierId=a),items:q.value,"item-title":"supplierName","item-value":"idSupplier",label:"المورد *",variant:"outlined",density:"comfortable",rules:[S.required],color:"#046375",clearable:"",placeholder:"اختر المورد"},null,8,["modelValue","items","rules"])]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[t(qe,{modelValue:n.value.paymentType,"onUpdate:modelValue":e[4]||(e[4]=a=>n.value.paymentType=a),items:[{title:"آجل (دفع لاحقاً)",value:"credit"},{title:"دفع نقدي الآن",value:"cash"}],"item-title":"title","item-value":"value",label:"طريقة الدفع",variant:"outlined",density:"comfortable",color:"#046375"},null,8,["modelValue"]),n.value.paymentType==="credit"?(b(),R("p",Vt," آجل: يُسجّل كدين على المورد حتى التسديد ")):k("",!0)]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[t(w,{modelValue:n.value.expectedDeliveryDate,"onUpdate:modelValue":e[5]||(e[5]=a=>n.value.expectedDeliveryDate=a),label:"تاريخ التسليم المتوقع",type:"date",variant:"outlined",density:"comfortable",color:"#046375"},null,8,["modelValue"])]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[t(w,{modelValue:n.value.totalAmount,"onUpdate:modelValue":e[6]||(e[6]=a=>n.value.totalAmount=a),modelModifiers:{number:!0},label:"المبلغ الإجمالي",type:"number",variant:"outlined",density:"comfortable",suffix:"د.ع",readonly:"",color:"#046375"},null,8,["modelValue"])]),_:1}),t(d,{cols:"12"},{default:l(()=>[t(Me,{modelValue:n.value.notes,"onUpdate:modelValue":e[7]||(e[7]=a=>n.value.notes=a),label:"ملاحظات",variant:"outlined",density:"comfortable",rows:"2",color:"#046375"},null,8,["modelValue"])]),_:1})]),_:1})]),o("div",null,[o("div",zt,[e[21]||(e[21]=o("div",null,"الأصناف",-1)),t(g,{color:"#046375",variant:"flat",size:"small",onClick:Ce,style:{"border-radius":"8px"}},{default:l(()=>[t(u(fe),{size:18,weight:"bold",class:"ml-1"}),e[20]||(e[20]=c(" إضافة صنف ",-1))]),_:1})]),n.value.items.length===0?(b(),R("div",Nt,[t(u(ve),{size:48,weight:"thin",color:"#9CA3AF",class:"mb-3"}),e[22]||(e[22]=o("p",{style:{color:"var(--t-text-dim)"}},"لم يتم إضافة أي صنف بعد",-1))])):k("",!0),(b(!0),R(xe,null,ye(n.value.items,(a,r)=>(b(),_(h,{key:r,variant:"outlined",class:"mb-3 pa-4",style:{"border-color":"#E5E7EB","border-radius":"12px"}},{default:l(()=>[t(A,{align:"center"},{default:l(()=>[t(d,{cols:"12",md:"4"},{default:l(()=>[t(ce,{modelValue:a.ingredientId,"onUpdate:modelValue":p=>a.ingredientId=p,items:te.value,"item-title":"ingredientName","item-value":"idIngredient",label:"المكون *",variant:"outlined",density:"compact",rules:[S.required],color:"#046375"},{item:l(({props:p,item:y})=>[t(We,E({ref_for:!0},p),{title:l(()=>[c(i(y.raw.ingredientName),1)]),subtitle:l(()=>[c(i(y.raw.currentStock)+" "+i(y.raw.unit)+" متوفر ",1)]),_:2},1040)]),_:2},1032,["modelValue","onUpdate:modelValue","items","rules"])]),_:2},1024),t(d,{cols:"12",md:"2"},{default:l(()=>[t(w,{modelValue:a.orderedQuantity,"onUpdate:modelValue":p=>a.orderedQuantity=p,modelModifiers:{number:!0},label:"الكمية *",type:"number",variant:"outlined",density:"compact",rules:[S.required],onInput:W,color:"#046375"},null,8,["modelValue","onUpdate:modelValue","rules"])]),_:2},1024),t(d,{cols:"12",md:"2"},{default:l(()=>[t(w,{modelValue:a.unitPrice,"onUpdate:modelValue":p=>a.unitPrice=p,modelModifiers:{number:!0},label:"سعر الوحدة *",type:"number",variant:"outlined",density:"compact",suffix:"د.ع",rules:[S.required],onInput:W,color:"#046375"},null,8,["modelValue","onUpdate:modelValue","rules"])]),_:2},1024),t(d,{cols:"12",md:"2"},{default:l(()=>[t(w,{"model-value":(a.orderedQuantity*a.unitPrice).toFixed(2),label:"المجموع",variant:"outlined",density:"compact",suffix:"د.ع",readonly:"",color:"#046375"},null,8,["model-value"])]),_:2},1024),t(d,{cols:"12",md:"2",class:"text-center"},{default:l(()=>[t(g,{icon:"",size:"small",color:"error",variant:"text",onClick:p=>Ie(r),"aria-label":"حذف الصنف"},{default:l(()=>[t(u(st),{size:20,weight:"bold"})]),_:1},8,["onClick"])]),_:2},1024)]),_:2},1024)]),_:2},1024))),128))])]),_:1}),t(j),t(X,{class:"pa-4",style:{background:"var(--t-surface-high)"}},{default:l(()=>[t(g,{variant:"text",size:"large",onClick:le,style:{color:"var(--t-text-dim)"}},{default:l(()=>[t(u(ee),{size:20,weight:"bold",class:"ml-1"}),e[23]||(e[23]=c(" إلغاء ",-1))]),_:1}),t(Z),t(g,{color:"#046375",variant:"flat",size:"large",loading:N.value,onClick:Fe,style:{"border-radius":"8px"}},{default:l(()=>[t(u(P),{size:20,weight:"bold",class:"ml-1"}),e[24]||(e[24]=c(" حفظ الأمر ",-1))]),_:1},8,["loading"])]),_:1})]),_:1})]),_:1},8,["modelValue"]),t(K,{modelValue:B.value,"onUpdate:modelValue":e[9]||(e[9]=a=>B.value=a),"max-width":"800",persistent:"",scrollable:""},{default:l(()=>[t(h,{elevation:"0",style:{"border-radius":"16px",overflow:"hidden"}},{default:l(()=>[o("div",Dt,[o("div",Pt,[o("div",Ct,[t(u(P),{size:24,weight:"bold",color:"white"})]),e[25]||(e[25]=o("div",null,[o("h3",{class:"text-h6 font-weight-bold text-white mb-1"}," استلام أمر الشراء "),o("p",{class:"text-body-2 text-white mb-0",style:{opacity:"0.9"}}," Receive Purchase Order - Confirm Quantities ")],-1))])]),D.value?(b(),_(L,{key:0,class:"pa-6",style:{"max-height":"600px",background:"var(--t-surface)"}},{default:l(()=>[t(Ye,{type:"info",variant:"tonal",class:"mb-6",style:{"border-radius":"8px"}},{default:l(()=>[o("div",It,"رقم الأمر: "+i(D.value.purchaseNumber),1),o("div",null,"المورد: "+i(D.value.supplierName),1),e[26]||(e[26]=o("div",{class:"text-caption"},"تأكد من الكميات المستلمة قبل الحفظ - سيتم تحديث المخزون تلقائياً",-1))]),_:1}),e[29]||(e[29]=o("div",{class:"text-h6 font-weight-bold mb-4",style:{color:"var(--t-text)"}}," الأصناف المستلمة: ",-1)),(b(!0),R(xe,null,ye(F.value.items,(a,r)=>(b(),_(h,{key:r,variant:"outlined",class:"mb-3 pa-4",style:{"border-color":"#E5E7EB","border-radius":"12px"}},{default:l(()=>[t(A,{align:"center"},{default:l(()=>[t(d,{cols:"12",md:"4"},{default:l(()=>[o("div",Ft,i(a.ingredientName),1),o("div",St,i(a.unit),1)]),_:2},1024),t(d,{cols:"12",md:"3"},{default:l(()=>[e[27]||(e[27]=o("div",{class:"text-caption text-grey"},"الكمية المطلوبة",-1)),o("div",Qt,i(a.orderedQuantity),1)]),_:2},1024),t(d,{cols:"12",md:"3"},{default:l(()=>[e[28]||(e[28]=o("div",{class:"text-caption text-grey"},"مستلم سابقاً",-1)),o("div",At,i(a.receivedQuantity||0),1)]),_:2},1024),t(d,{cols:"12",md:"2"},{default:l(()=>[t(w,{modelValue:a.newReceived,"onUpdate:modelValue":p=>a.newReceived=p,modelModifiers:{number:!0},label:"الكمية المستلمة",type:"number",variant:"outlined",density:"compact",rules:[S.required],max:a.orderedQuantity-(a.receivedQuantity||0),color:"#046375"},null,8,["modelValue","onUpdate:modelValue","rules","max"])]),_:2},1024)]),_:2},1024)]),_:2},1024))),128))]),_:1})):k("",!0),t(j),t(X,{class:"pa-4",style:{background:"var(--t-surface-high)"}},{default:l(()=>[t(g,{variant:"text",size:"large",onClick:se,style:{color:"var(--t-text-dim)"}},{default:l(()=>[t(u(ee),{size:20,weight:"bold",class:"ml-1"}),e[30]||(e[30]=c(" إلغاء ",-1))]),_:1}),t(Z),t(g,{color:"#046375",variant:"flat",size:"large",loading:N.value,onClick:Se,style:{"border-radius":"8px"}},{default:l(()=>[t(u(P),{size:20,weight:"bold",class:"ml-1"}),e[31]||(e[31]=c(" تأكيد الاستلام ",-1))]),_:1},8,["loading"])]),_:1})]),_:1})]),_:1},8,["modelValue"]),t(K,{modelValue:I.value,"onUpdate:modelValue":e[13]||(e[13]=a=>I.value=a),"max-width":"900",scrollable:""},{default:l(()=>[t(h,{elevation:"0",style:{"border-radius":"16px",overflow:"hidden"}},{default:l(()=>[o("div",Rt,[o("div",Tt,[o("div",Ut,[t(u(ge),{size:24,weight:"bold",color:"white"})]),e[32]||(e[32]=o("div",null,[o("h3",{class:"text-h6 font-weight-bold text-white mb-1"}," تفاصيل أمر الشراء "),o("p",{class:"text-body-2 text-white mb-0",style:{opacity:"0.9"}}," Purchase Order Details ")],-1))])]),m.value?(b(),_(L,{key:0,class:"pa-6",style:{background:"var(--t-surface)"}},{default:l(()=>[t(A,null,{default:l(()=>[t(d,{cols:"12",md:"6"},{default:l(()=>[e[33]||(e[33]=o("div",{class:"text-caption text-grey"},"رقم الأمر",-1)),o("div",Bt,i(m.value.purchaseNumber),1)]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[e[34]||(e[34]=o("div",{class:"text-caption text-grey"},"الحالة",-1)),t(H,{color:re(m.value.status),class:"mb-3"},{default:l(()=>[c(i(ne(m.value.status)),1)]),_:1},8,["color"])]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[e[35]||(e[35]=o("div",{class:"text-caption text-grey"},"المورد",-1)),o("div",$t,i(m.value.supplierName),1)]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[e[36]||(e[36]=o("div",{class:"text-caption text-grey"},"هاتف المورد",-1)),o("div",Lt,i(m.value.supplierPhone||"غير محدد"),1)]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[e[37]||(e[37]=o("div",{class:"text-caption text-grey"},"تاريخ الطلب",-1)),o("div",Ht,i(Y(m.value.purchaseDate)),1)]),_:1}),t(d,{cols:"12",md:"6"},{default:l(()=>[e[38]||(e[38]=o("div",{class:"text-caption text-grey"},"تاريخ التسليم المتوقع",-1)),o("div",jt,i(m.value.expectedDeliveryDate?Y(m.value.expectedDeliveryDate):"غير محدد"),1)]),_:1}),t(d,{cols:"12"},{default:l(()=>[e[39]||(e[39]=o("div",{class:"text-caption",style:{color:"var(--t-text-dim)"}},"المبلغ الإجمالي",-1)),o("div",Et,i(Number(m.value.totalAmount).toLocaleString())+" د.ع ",1)]),_:1}),m.value.notes?(b(),_(d,{key:0,cols:"12"},{default:l(()=>[e[40]||(e[40]=o("div",{class:"text-caption text-grey"},"ملاحظات",-1)),o("div",Gt,i(m.value.notes),1)]),_:1})):k("",!0)]),_:1}),t(j,{class:"my-4"}),e[41]||(e[41]=o("div",{class:"text-h6 font-weight-bold mb-4"},"الأصناف:",-1)),t(ue,{headers:Ne,items:m.value.items||[],"items-per-page":-1,class:"elevation-0",density:"comfortable"},{"item.ingredientName":l(({item:a})=>[o("div",Ot,i(a.ingredientName),1),o("div",qt,i(a.unit),1)]),"item.orderedQuantity":l(({item:a})=>[o("div",Mt,i(a.orderedQuantity),1)]),"item.receivedQuantity":l(({item:a})=>[t(H,{color:a.receivedQuantity>=a.orderedQuantity?"success":a.receivedQuantity>0?"warning":"grey",size:"small"},{default:l(()=>[c(i(a.receivedQuantity||0)+" / "+i(a.orderedQuantity),1)]),_:2},1032,["color"])]),"item.unitPrice":l(({item:a})=>[o("div",Wt,i(Number(a.unitPrice).toLocaleString())+" د.ع",1)]),"item.totalPrice":l(({item:a})=>[o("div",Yt,i((a.orderedQuantity*a.unitPrice).toLocaleString())+" د.ع ",1)]),_:1},8,["items"])]),_:1})):k("",!0),t(j),t(X,{class:"pa-4",style:{background:"var(--t-surface-high)"}},{default:l(()=>[t(g,{variant:"text",size:"large",onClick:e[10]||(e[10]=a=>I.value=!1),style:{color:"var(--t-text-dim)"}},{default:l(()=>[t(u(ee),{size:20,weight:"bold",class:"ml-1"}),e[42]||(e[42]=c(" إغلاق ",-1))]),_:1}),t(Z),m.value&&(m.value.status==="pending"||m.value.status==="partially_received")&&ae.value?(b(),_(g,{key:0,color:"#046375",variant:"flat",size:"large",onClick:e[11]||(e[11]=a=>oe(m.value)),style:{"border-radius":"8px"}},{default:l(()=>[t(u(P),{size:20,weight:"bold",class:"ml-1"}),e[43]||(e[43]=c(" استلام ",-1))]),_:1})):k("",!0),t(g,{color:"#046375",variant:"outlined",size:"large",onClick:e[12]||(e[12]=a=>ie(m.value)),style:{"border-radius":"8px","border-color":"#046375"}},{default:l(()=>[t(u(be),{size:20,weight:"bold",class:"ml-1"}),e[44]||(e[44]=c(" طباعة ",-1))]),_:1})]),_:1})]),_:1})]),_:1},8,["modelValue"])]),_:1}))}},ma=Ze(Jt,[["__scopeId","data-v-a8281d1b"]]);export{ma as default};
