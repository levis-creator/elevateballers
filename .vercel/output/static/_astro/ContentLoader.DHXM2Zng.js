import{j as e}from"./jsx-runtime.D_zvdyIk.js";function p({message:i="Loading...",size:t="medium",centered:r=!0}){const s={small:{spinner:"30px",fontSize:"14px"},medium:{spinner:"50px",fontSize:"16px"},large:{spinner:"70px",fontSize:"18px"}},{spinner:n,fontSize:o}=s[t],a={display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"2rem",...r&&{width:"100%",minHeight:"200px"}};return e.jsxs("div",{style:a,children:[e.jsx("div",{style:{width:n,height:n,border:"4px solid #f3f3f3",borderTop:"4px solid #dd3333",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:"1rem"}}),e.jsx("p",{style:{fontFamily:"Rubik, sans-serif",fontSize:o,color:"#363f48",margin:0},children:i}),e.jsx("style",{children:`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `})]})}export{p as default};
