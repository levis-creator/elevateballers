const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/quill.5Z8gbLrS.js","_astro/index.Z6aMusZW.js"])))=>i.map(i=>d[i]);
import{_ as s}from"./preload-helper.BlTxHScW.js";async function a(){if(!(typeof window>"u"))try{const t=(await s(async()=>{const{default:l}=await import("./quill.5Z8gbLrS.js");return{default:l}},__vite__mapDeps([0,1]))).default,e=`
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
        <path d="m10 15 5-3-5-3z"/>
      </svg>
    `,n=`
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
    `,i=`
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3v18"/>
        <rect width="18" height="18" x="3" y="3" rx="2"/>
        <path d="M3 9h18"/>
        <path d="M3 15h18"/>
      </svg>
    `,r=`
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
      </svg>
    `,o=t.import("ui/icons");o?(o.youtube=e,o.vimeo=n,o.table=i,o["horizontal-rule"]=r,typeof window<"u"&&window.location.hostname==="localhost"&&console.log("Custom toolbar icons registered:",{youtube:!!o.youtube,vimeo:!!o.vimeo,table:!!o.table,"horizontal-rule":!!o["horizontal-rule"]})):console.warn("Quill icons module not found")}catch(t){console.warn("Failed to setup custom toolbar icons:",t)}}export{a as setupCustomToolbarIcons};
