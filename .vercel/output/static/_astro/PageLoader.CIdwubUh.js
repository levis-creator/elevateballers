import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as i}from"./index.Z6aMusZW.js";function d(){const[r,t]=i.useState(!0);return i.useEffect(()=>{const o=()=>{t(!1)};if(document.readyState==="complete")t(!1);else{window.addEventListener("load",o);const n=setTimeout(()=>{t(!1)},3e3);return()=>{window.removeEventListener("load",o),clearTimeout(n)}}},[]),r?e.jsxs("div",{id:"page-loader",style:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(255, 255, 255, 0.95)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,transition:"opacity 0.3s ease-out"},children:[e.jsxs("div",{style:{textAlign:"center"},children:[e.jsx("div",{style:{width:"50px",height:"50px",border:"4px solid #f3f3f3",borderTop:"4px solid #dd3333",borderRadius:"50%",animation:"spin 1s linear infinite",margin:"0 auto 1rem"}}),e.jsx("p",{style:{fontFamily:"Rubik, sans-serif",fontSize:"16px",color:"#363f48",margin:0},children:"Loading..."})]}),e.jsx("style",{children:`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `})]}):null}export{d as default};
