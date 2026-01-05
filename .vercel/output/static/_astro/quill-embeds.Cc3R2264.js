import d from"./quill.5Z8gbLrS.js";import"./index.Z6aMusZW.js";const h=d.import("blots/block/embed");class l extends h{static className="ql-video-embed";static platformName;static create(e){const t=super.create(),i=e.id||this.extractVideoId(e.url||"");if(!i)return t;t.setAttribute("data-video-id",i),t.setAttribute("data-platform",e.platform||this.platformName),t.setAttribute("data-video-url",e.url||""),t.classList.add("ql-video-embed"),this.className&&this.className!==l.className&&t.classList.add(this.className);const o=document.createElement("div");o.className="video-embed-wrapper",o.style.cssText=`
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      max-width: 100%;
      margin: 1.5rem 0;
      border-radius: 8px;
      background: #000;
    `;const r=document.createElement("iframe");return r.setAttribute("src",this.getEmbedUrl(i)),r.setAttribute("frameborder","0"),r.setAttribute("allow","accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"),r.setAttribute("allowfullscreen","true"),r.style.cssText=`
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `,o.appendChild(r),t.appendChild(o),t}static value(e){const t=e.getAttribute("data-video-id"),i=e.getAttribute("data-video-url")||"",o=e.getAttribute("data-platform")||"";return{id:t,url:i,platform:o}}}class n extends l{static blotName="youtube";static tagName="div";static className="ql-youtube-video";static platformName="youtube";static getEmbedUrl(e){return`https://www.youtube.com/embed/${e}?rel=0&modestbranding=1`}static extractVideoId(e){if(!e)return"";const t=[/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,/youtube\.com\/watch\?.*v=([^&\n?#]+)/,/youtube\.com\/v\/([^&\n?#]+)/];for(const i of t){const o=e.match(i);if(o&&o[1])return o[1]}return/^[a-zA-Z0-9_-]{11}$/.test(e)?e:""}}class u extends l{static blotName="vimeo";static tagName="div";static className="ql-vimeo-video";static platformName="vimeo";static getEmbedUrl(e){return`https://player.vimeo.com/video/${e}?title=0&byline=0&portrait=0`}static extractVideoId(e){if(!e)return"";const t=[/(?:vimeo\.com\/)(\d+)/,/(?:vimeo\.com\/video\/)(\d+)/,/(?:player\.vimeo\.com\/video\/)(\d+)/];for(const i of t){const o=e.match(i);if(o&&o[1])return o[1]}return/^\d+$/.test(e)?e:""}}class y{quill;options;constructor(e,t){this.quill=e,this.options=t,this.attach()}attach(){try{const e=this.quill.getModule("toolbar");if(!e){console.error("Toolbar module not found");return}e.addHandler("youtube",()=>this.handleVideo("youtube")),e.addHandler("vimeo",()=>this.handleVideo("vimeo")),typeof window<"u"&&window.location.hostname==="localhost"&&console.log("Video embed handlers attached:",{youtube:typeof e.handlers?.youtube=="function",vimeo:typeof e.handlers?.vimeo=="function"})}catch(e){console.error("Failed to attach video embed handlers:",e)}}handleVideo(e){try{const t=e==="youtube"?"YouTube":"Vimeo",i=prompt(`Enter ${t} URL or Video ID:`);if(!i||!i.trim())return;let o;if(e==="youtube"?o=n.extractVideoId(i.trim()):o=u.extractVideoId(i.trim()),!o){alert(`Invalid ${t} URL. Please enter a valid ${t} video URL or ID.

Examples:
- https://www.youtube.com/watch?v=VIDEO_ID
- https://youtu.be/VIDEO_ID
- VIDEO_ID`);return}const r=this.quill.constructor,b=r.import("parchment")?.registry;typeof window<"u"&&window.location.hostname==="localhost"&&console.log("Checking blot registration:",{platform:e,blotName:e,registered:!!b?.query(e),quillBlots:Object.keys(r.import("blots/embed")||{})});let a;const c=this.quill.getSelection(!0);c&&c.index!==null?a=c.index:a=Math.max(0,this.quill.getLength()-1);const m={id:o,url:i.trim(),platform:e};this.quill.insertEmbed(a,e,m,"user"),this.quill.setSelection(a+1,"api"),typeof window<"u"&&window.location.hostname==="localhost"&&console.log(`${t} video embedded successfully:`,{videoId:o,url:i.trim(),index:a,embedValue:m})}catch(t){console.error(`Error embedding ${e} video:`,t),console.error("Error details:",{message:t?.message,stack:t?.stack,quill:!!this.quill,platform:e}),alert(`Failed to embed ${e==="youtube"?"YouTube":"Vimeo"} video.

Error: ${t?.message||"Unknown error"}

Please check the console for more details.`)}}}if(typeof window<"u")try{const s=window.Quill||d;s&&s.register&&(s.register(n,!0),s.register(u,!0))}catch{}d.register(n,!0);d.register(u,!0);export{y as VideoEmbedHandler,u as VimeoVideo,n as YouTubeVideo};
