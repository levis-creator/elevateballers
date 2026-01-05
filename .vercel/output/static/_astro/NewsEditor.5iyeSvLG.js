const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["_astro/quill.5Z8gbLrS.js","_astro/index.Z6aMusZW.js","_astro/_id_.CTpA5PSA.css","_astro/quill-embeds.Cc3R2264.js","_astro/quill-horizontal-rule.WU7klVM1.js","_astro/quill-toolbar-icons.DI9vQx2T.js","_astro/preload-helper.BlTxHScW.js","_astro/quill-table.72sPgVim.js"])))=>i.map(i=>d[i]);
import{_ as h}from"./preload-helper.BlTxHScW.js";import{j as e}from"./jsx-runtime.D_zvdyIk.js";import{r as n}from"./index.Z6aMusZW.js";import{r as P}from"./types.DS8deZaU.js";import{B as A}from"./button.BWaXVklz.js";import{I as w}from"./input.DYfGnR1o.js";import{L as m}from"./label.ByuxEscq.js";import{T as I}from"./textarea.ntLCWltE.js";import{C as T,b as E,c as S,d as L,a as R}from"./card.CoMIDSCG.js";import{A as V,a as z}from"./alert.BWe5-cIC.js";import{S as F}from"./skeleton.B3vSOSjr.js";import{C as H}from"./checkbox.D89wNvvK.js";import{S as O,a as B,b as U,c as Q,d as K}from"./select.C_1Jy99F.js";import{F as Y}from"./file-text.CSp1dnUh.js";import{A as $}from"./arrow-left.DTOvvTq7.js";import{C as W}from"./circle-alert.DSB0BqUH.js";import{C as Z}from"./circle-check-big.C0mK4qk5.js";import{I as M}from"./info.COjwR0tB.js";import{L as D}from"./loader-circle.DAcaG-Yh.js";import{S as J}from"./save.BcFhAao1.js";import{X}from"./x.B_0Xwiyu.js";import"./utils.CDN07tui.js";import"./index.CO5Cc353.js";import"./index.EfZGvMir.js";import"./index.lnW5t9aA.js";import"./index.D9ngwW3m.js";import"./index.DUJzU2eK.js";import"./check.BilKxX2O.js";import"./createLucideIcon.DXTouTbc.js";import"./Combination.LMohFq6j.js";import"./chevron-up.BnPhcTyb.js";function G(s){return s.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}function ee({content:s,onChange:x,disabled:b}){const a=n.useRef(null),d=n.useRef(null),p=n.useRef(!1),f=n.useRef(x),[j,g]=n.useState(!0);return n.useEffect(()=>{f.current=x},[x]),n.useEffect(()=>{if(typeof window>"u"||d.current)return;const l=async()=>{if(!a.current){requestAnimationFrame(l);return}if(!d.current)try{const o=(await h(async()=>{const{default:i}=await import("./quill.5Z8gbLrS.js");return{default:i}},__vite__mapDeps([0,1]))).default;await h(()=>Promise.resolve({}),__vite__mapDeps([2])),await h(()=>import("./quill-embeds.Cc3R2264.js"),__vite__mapDeps([3,0,1])),await h(()=>import("./quill-horizontal-rule.WU7klVM1.js"),__vite__mapDeps([4,0,1]));const{YouTubeVideo:y,VimeoVideo:q}=await h(async()=>{const{YouTubeVideo:i,VimeoVideo:C}=await import("./quill-embeds.Cc3R2264.js");return{YouTubeVideo:i,VimeoVideo:C}},__vite__mapDeps([3,0,1])),{HorizontalRule:_}=await h(async()=>{const{HorizontalRule:i}=await import("./quill-horizontal-rule.WU7klVM1.js");return{HorizontalRule:i}},__vite__mapDeps([4,0,1]));o.register(y,!0),o.register(q,!0),o.register(_,!0),typeof window<"u";const{setupCustomToolbarIcons:N}=await h(async()=>{const{setupCustomToolbarIcons:i}=await import("./quill-toolbar-icons.DI9vQx2T.js");return{setupCustomToolbarIcons:i}},__vite__mapDeps([5,6]));await N();const{VideoEmbedHandler:r}=await h(async()=>{const{VideoEmbedHandler:i}=await import("./quill-embeds.Cc3R2264.js");return{VideoEmbedHandler:i}},__vite__mapDeps([3,0,1])),{TableModule:t}=await h(async()=>{const{TableModule:i}=await import("./quill-table.72sPgVim.js");return{TableModule:i}},__vite__mapDeps([7,0,1])),{HorizontalRuleHandler:k}=await h(async()=>{const{HorizontalRuleHandler:i}=await import("./quill-horizontal-rule.WU7klVM1.js");return{HorizontalRuleHandler:i}},__vite__mapDeps([4,0,1]));if(!a.current){console.error("Editor ref lost during Quill import"),g(!1);return}const u=new o(a.current,{theme:"snow",modules:{toolbar:{container:[[{header:[1,2,3,4,5,6,!1]}],["bold","italic","underline","strike"],[{list:"ordered"},{list:"bullet"}],[{align:[]}],["blockquote","code-block"],["link"],["image","youtube","vimeo"],["table","horizontal-rule"],[{indent:"-1"},{indent:"+1"}],[{script:"sub"},{script:"super"}],[{size:["small",!1,"large","huge"]}],[{color:[]},{background:[]}],["clean"],["undo","redo"]],handlers:{youtube:function(){},vimeo:function(){},table:function(){},"horizontal-rule":function(){}}},keyboard:{bindings:{undo:{key:"z",shortKey:!0,handler:function(){this.quill.history.undo()}},redo:{key:"z",shortKey:!0,shiftKey:!0,handler:function(){this.quill.history.redo()}}}},history:{delay:1e3,maxStack:100,userOnly:!0}},placeholder:"Write your article content here..."});d.current=u,setTimeout(()=>{const i=u.getModule("toolbar");i&&i.container&&i.container.querySelectorAll("button").forEach(c=>{const v=c.className;v.includes("ql-youtube")&&!c.querySelector("svg")?c.innerHTML=`
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
                    <path d="m10 15 5-3-5-3z"/>
                  </svg>
                `:v.includes("ql-vimeo")&&!c.querySelector("svg")?c.innerHTML=`
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                `:v.includes("ql-table")&&!c.querySelector("svg")?c.innerHTML=`
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v18"/>
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M3 15h18"/>
                  </svg>
                `:v.includes("ql-horizontal-rule")&&!c.querySelector("svg")&&(c.innerHTML=`
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/>
                  </svg>
                `)})},100),new r(u,{}),new t(u,{}),new k(u),g(!1),s&&(p.current=!0,u.root.innerHTML=s,p.current=!1),u.on("text-change",()=>{if(!p.current){const i=u.root.innerHTML;f.current(i)}})}catch(o){console.error("Failed to load Quill:",o),g(!1)}};return requestAnimationFrame(l),()=>{d.current&&d.current.off("text-change")}},[]),n.useEffect(()=>{d.current&&s!==d.current.root.innerHTML&&(p.current=!0,d.current.root.innerHTML=s||"",p.current=!1)},[s]),n.useEffect(()=>{d.current&&d.current.enable(!b)},[b]),e.jsxs("div",{className:"rich-text-editor-wrapper",style:{position:"relative"},children:[j&&e.jsxs("div",{className:"rich-text-editor-loading",style:{position:"absolute",top:0,left:0,right:0,bottom:0,display:"flex",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255, 255, 255, 0.9)",zIndex:10},children:[e.jsx(D,{size:24,className:"spinning"}),e.jsx("span",{style:{marginLeft:"0.5rem"},children:"Loading editor..."})]}),e.jsx("div",{ref:a,className:"quill-editor"})]})}function Le({articleId:s}){const[x,b]=n.useState(!!s),[a,d]=n.useState(!1),[p,f]=n.useState(""),[j,g]=n.useState(!1),[l,o]=n.useState({title:"",slug:"",content:"",excerpt:"",category:"Interviews",image:"",published:!1,feature:!1,publishedAt:""});n.useEffect(()=>{s&&y()},[s]);const y=async()=>{try{b(!0);const r=await fetch(`/api/news/${s}`);if(!r.ok)throw new Error("Failed to fetch article");const t=await r.json();o({title:t.title,slug:t.slug,content:t.content,excerpt:t.excerpt||"",category:P[t.category],image:t.image||"",published:t.published,feature:t.feature||!1,publishedAt:t.publishedAt?new Date(t.publishedAt).toISOString().split("T")[0]:""})}catch(r){f(r.message||"Failed to load article")}finally{b(!1)}},q=r=>{o(t=>({...t,title:r,slug:t.slug||G(r)}))},_=async r=>{r.preventDefault(),d(!0),f(""),g(!1);try{if(!l.content.trim()||l.content==="<p></p>"){f("Content is required"),d(!1);return}const t=s?`/api/news/${s}`:"/api/news",k=s?"PUT":"POST",u={...l,publishedAt:l.publishedAt||void 0},i=await fetch(t,{method:k,headers:{"Content-Type":"application/json"},body:JSON.stringify(u)});if(!i.ok){const c=await i.json();throw new Error(c.error||"Failed to save article")}const C=await i.json();g(!0),setTimeout(()=>{window.location.href="/admin/news"},1500)}catch(t){f(t.message||"Failed to save article")}finally{d(!1)}};if(x)return e.jsxs("div",{className:"space-y-4",children:[e.jsx(F,{className:"h-12 w-full"}),e.jsx(F,{className:"h-64 w-full"}),e.jsx(F,{className:"h-12 w-full"})]});const N=["Interviews","Championships","Match report","Analysis"];return e.jsxs("div",{className:"space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300",children:[e.jsxs("div",{className:"flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-6 border-b",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-3xl font-heading font-semibold mb-2 text-foreground flex items-center gap-2",children:[e.jsx(Y,{className:"h-8 w-8"}),s?"Edit Article":"Create New Article"]}),e.jsx("p",{className:"text-muted-foreground",children:s?"Update article details and content":"Add a new news article to your site"})]}),e.jsx(A,{variant:"outline",asChild:!0,children:e.jsxs("a",{href:"/admin/news","data-astro-prefetch":!0,children:[e.jsx($,{className:"mr-2 h-4 w-4"}),"Back to List"]})})]}),p&&e.jsxs(V,{variant:"destructive",children:[e.jsx(W,{className:"h-4 w-4"}),e.jsxs(z,{children:[e.jsx("strong",{children:"Error:"})," ",p]})]}),j&&e.jsxs(V,{className:"border-green-500 bg-green-50 text-green-900",children:[e.jsx(Z,{className:"h-4 w-4"}),e.jsxs(z,{children:[e.jsx("strong",{children:"Success!"})," Article saved successfully! Redirecting..."]})]}),e.jsxs("form",{onSubmit:_,className:"space-y-6",children:[e.jsxs(T,{children:[e.jsxs(E,{children:[e.jsx(S,{children:"Basic Information"}),e.jsx(L,{children:"Article title, slug, category, and featured image"})]}),e.jsxs(R,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs(m,{htmlFor:"title",children:["Title ",e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsx(w,{id:"title",type:"text",value:l.title,onChange:r=>q(r.target.value),required:!0,disabled:a,placeholder:"Enter article title"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(m,{htmlFor:"slug",children:"Slug (URL)"}),e.jsx(w,{id:"slug",type:"text",value:l.slug,onChange:r=>o(t=>({...t,slug:r.target.value})),disabled:a,placeholder:"article-url-slug"}),e.jsxs("p",{className:"text-sm text-muted-foreground flex items-center gap-2",children:[e.jsx(M,{className:"h-4 w-4"}),"Auto-generated from title if left empty"]})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs(m,{htmlFor:"category",children:["Category ",e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsxs(O,{value:l.category,onValueChange:r=>o(t=>({...t,category:r})),required:!0,disabled:a,children:[e.jsx(B,{id:"category",children:e.jsx(U,{placeholder:"Select a category"})}),e.jsx(Q,{children:N.map(r=>e.jsx(K,{value:r,children:r},r))})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsx(m,{htmlFor:"image",children:"Featured Image URL"}),e.jsx(w,{id:"image",type:"url",value:l.image,onChange:r=>o(t=>({...t,image:r.target.value})),disabled:a,placeholder:"https://example.com/image.jpg"})]})]}),l.image&&e.jsx("div",{className:"mt-2 border rounded-lg overflow-hidden",children:e.jsx("img",{src:l.image,alt:"Preview",className:"w-full max-h-[300px] object-contain",onError:r=>{r.target.style.display="none"}})})]})]}),e.jsxs(T,{children:[e.jsxs(E,{children:[e.jsx(S,{children:"Content"}),e.jsx(L,{children:"Article excerpt and main content"})]}),e.jsxs(R,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx(m,{htmlFor:"excerpt",children:"Excerpt"}),e.jsx(I,{id:"excerpt",rows:3,value:l.excerpt,onChange:r=>o(t=>({...t,excerpt:r.target.value})),disabled:a,placeholder:"Brief summary of the article (optional)"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"This will be displayed in article listings and previews"})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs(m,{htmlFor:"content",children:["Content ",e.jsx("span",{className:"text-destructive",children:"*"})]}),e.jsx("div",{className:"rich-text-editor-wrapper",children:e.jsx(ee,{content:l.content,onChange:r=>o(t=>({...t,content:r})),disabled:a})}),e.jsxs("p",{className:"text-sm text-muted-foreground flex items-center gap-2",children:[e.jsx(M,{className:"h-4 w-4"}),"WordPress-like editor: Format text, embed YouTube/Vimeo videos, insert tables, add horizontal lines, and more. Use keyboard shortcuts (Ctrl+Z for undo, Ctrl+Shift+Z for redo)."]})]})]})]}),e.jsxs(T,{children:[e.jsxs(E,{children:[e.jsx(S,{children:"Publishing"}),e.jsx(L,{children:"Control article visibility and featured status"})]}),e.jsxs(R,{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-start space-x-3 space-y-0 rounded-md border p-4",children:[e.jsx(H,{id:"published",checked:l.published,onCheckedChange:r=>o(t=>({...t,published:r===!0})),disabled:a}),e.jsxs("div",{className:"space-y-1 leading-none",children:[e.jsx(m,{htmlFor:"published",className:"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",children:"Publish this article"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Make it visible on the website"})]})]}),e.jsxs("div",{className:"flex items-start space-x-3 space-y-0 rounded-md border p-4",children:[e.jsx(H,{id:"feature",checked:l.feature,onCheckedChange:r=>o(t=>({...t,feature:r===!0})),disabled:a}),e.jsxs("div",{className:"space-y-1 leading-none",children:[e.jsx(m,{htmlFor:"feature",className:"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",children:"Feature this article"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"Highlight this article as featured content"})]})]}),l.published&&e.jsxs("div",{className:"space-y-2",children:[e.jsx(m,{htmlFor:"publishedAt",children:"Published Date"}),e.jsx(w,{id:"publishedAt",type:"date",value:l.publishedAt,onChange:r=>o(t=>({...t,publishedAt:r.target.value})),disabled:a})]})]})]}),e.jsxs("div",{className:"flex gap-3 pt-4",children:[e.jsx(A,{type:"submit",disabled:a,children:a?e.jsxs(e.Fragment,{children:[e.jsx(D,{className:"mr-2 h-4 w-4 animate-spin"}),"Saving..."]}):e.jsxs(e.Fragment,{children:[e.jsx(J,{className:"mr-2 h-4 w-4"}),s?"Update Article":"Create Article"]})}),e.jsx(A,{type:"button",variant:"outline",asChild:!0,children:e.jsxs("a",{href:"/admin/news","data-astro-prefetch":!0,children:[e.jsx(X,{className:"mr-2 h-4 w-4"}),"Cancel"]})})]})]}),e.jsx("style",{children:`
        /* Quill editor wrapper styles */
        .rich-text-editor-wrapper {
          border: 1px solid hsl(var(--input));
          border-radius: calc(var(--radius) - 2px);
          overflow: hidden;
          background: hsl(var(--background));
        }

        .rich-text-editor-wrapper:focus-within {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
        }

        .quill-editor {
          min-height: 400px;
        }

        /* Quill editor styles */
        .quill-editor .ql-container {
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .quill-editor .ql-editor {
          min-height: 400px;
        }

        .quill-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        /* Video embeds in editor */
        .quill-editor .ql-editor .ql-video-embed {
          margin: 1.5rem 0;
        }

        .quill-editor .ql-editor .video-embed-wrapper {
          position: relative;
          padding-bottom: 56.25%;
          height: 0;
          overflow: hidden;
          max-width: 100%;
          border-radius: 8px;
          background: #000;
        }

        .quill-editor .ql-editor .video-embed-wrapper iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        /* Table styles in editor */
        .quill-editor .ql-editor table.ql-table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          border: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-editor table.ql-table td,
        .quill-editor .ql-editor table.ql-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          min-width: 100px;
        }

        .quill-editor .ql-editor table.ql-table th {
          background: hsl(var(--muted));
          font-weight: 600;
        }

        /* Horizontal rule styles in editor */
        .quill-editor .ql-editor hr.ql-horizontal-rule,
        .quill-editor .ql-editor .ql-horizontal-rule {
          margin: 2rem 0;
          border: none;
          border-top: 2px solid hsl(var(--border));
          background: none;
        }

        .quill-editor .ql-toolbar {
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--muted) / 0.5);
          padding: 0.75rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        /* Toolbar button groups */
        .quill-editor .ql-toolbar .ql-formats {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-right: 0.5rem;
          padding-right: 0.5rem;
          border-right: 1px solid hsl(var(--border));
        }

        .quill-editor .ql-toolbar .ql-formats:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }

        /* Better button styling */
        .quill-editor .ql-toolbar button {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .quill-editor .ql-toolbar button:hover {
          background: hsl(var(--accent));
        }

        .quill-editor .ql-toolbar button.ql-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary-foreground));
        }

        .quill-editor .ql-toolbar .ql-stroke {
          stroke: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar .ql-fill {
          fill: hsl(var(--muted-foreground));
        }

        .quill-editor .ql-toolbar button:hover .ql-stroke,
        .quill-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }

        .quill-editor .ql-toolbar button:hover .ql-fill,
        .quill-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }

        .quill-editor .ql-container {
          border: none;
        }

        .quill-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @media (max-width: 768px) {
          .quill-editor .ql-toolbar {
            flex-wrap: wrap;
            padding: 0.5rem;
            gap: 0.125rem;
          }

          .quill-editor .ql-toolbar .ql-formats {
            margin-right: 0.25rem;
            padding-right: 0.25rem;
            border-right: 1px solid hsl(var(--border));
          }

          .quill-editor .ql-toolbar button {
            width: 28px;
            height: 28px;
          }

          .rich-text-editor-wrapper {
            border-radius: 6px;
          }
        }

        @media (max-width: 480px) {
          .quill-editor .ql-editor {
            min-height: 300px;
            font-size: 0.9rem;
          }
        }
      `})]})}export{Le as default};
