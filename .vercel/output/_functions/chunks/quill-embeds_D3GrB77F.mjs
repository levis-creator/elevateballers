import Quill from 'quill';

const BlockEmbed = Quill.import("blots/block/embed");
class BaseVideoEmbed extends BlockEmbed {
  static className = "ql-video-embed";
  static platformName;
  static create(value) {
    const node = super.create();
    const videoId = value.id || this.extractVideoId(value.url || "");
    if (!videoId) {
      return node;
    }
    node.setAttribute("data-video-id", videoId);
    node.setAttribute("data-platform", value.platform || this.platformName);
    node.setAttribute("data-video-url", value.url || "");
    node.classList.add("ql-video-embed");
    if (this.className && this.className !== BaseVideoEmbed.className) {
      node.classList.add(this.className);
    }
    const wrapper = document.createElement("div");
    wrapper.className = "video-embed-wrapper";
    wrapper.style.cssText = `
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
      max-width: 100%;
      margin: 1.5rem 0;
      border-radius: 8px;
      background: #000;
    `;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", this.getEmbedUrl(videoId));
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    wrapper.appendChild(iframe);
    node.appendChild(wrapper);
    return node;
  }
  static value(node) {
    const videoId = node.getAttribute("data-video-id");
    const url = node.getAttribute("data-video-url") || "";
    const platform = node.getAttribute("data-platform") || "";
    return { id: videoId, url, platform };
  }
}
class YouTubeVideo extends BaseVideoEmbed {
  static blotName = "youtube";
  static tagName = "div";
  static className = "ql-youtube-video";
  static platformName = "youtube";
  static getEmbedUrl(videoId) {
    return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  }
  static extractVideoId(url) {
    if (!url) return "";
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    return "";
  }
}
class VimeoVideo extends BaseVideoEmbed {
  static blotName = "vimeo";
  static tagName = "div";
  static className = "ql-vimeo-video";
  static platformName = "vimeo";
  static getEmbedUrl(videoId) {
    return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
  }
  static extractVideoId(url) {
    if (!url) return "";
    const patterns = [
      /(?:vimeo\.com\/)(\d+)/,
      /(?:vimeo\.com\/video\/)(\d+)/,
      /(?:player\.vimeo\.com\/video\/)(\d+)/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    if (/^\d+$/.test(url)) {
      return url;
    }
    return "";
  }
}
class VideoEmbedHandler {
  quill;
  options;
  constructor(quill, options) {
    this.quill = quill;
    this.options = options;
    this.attach();
  }
  attach() {
    try {
      const toolbar = this.quill.getModule("toolbar");
      if (!toolbar) {
        console.error("Toolbar module not found");
        return;
      }
      toolbar.addHandler("youtube", () => this.handleVideo("youtube"));
      toolbar.addHandler("vimeo", () => this.handleVideo("vimeo"));
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.log("Video embed handlers attached:", {
          youtube: typeof toolbar.handlers?.youtube === "function",
          vimeo: typeof toolbar.handlers?.vimeo === "function"
        });
      }
    } catch (error) {
      console.error("Failed to attach video embed handlers:", error);
    }
  }
  handleVideo(platform) {
    try {
      const platformName = platform === "youtube" ? "YouTube" : "Vimeo";
      const url = prompt(`Enter ${platformName} URL or Video ID:`);
      if (!url || !url.trim()) return;
      let videoId;
      if (platform === "youtube") {
        videoId = YouTubeVideo.extractVideoId(url.trim());
      } else {
        videoId = VimeoVideo.extractVideoId(url.trim());
      }
      if (!videoId) {
        alert(`Invalid ${platformName} URL. Please enter a valid ${platformName} video URL or ID.

Examples:
- https://www.youtube.com/watch?v=VIDEO_ID
- https://youtu.be/VIDEO_ID
- VIDEO_ID`);
        return;
      }
      const Quill2 = this.quill.constructor;
      const Parchment = Quill2.import("parchment");
      const BlotRegistry = Parchment?.registry;
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.log("Checking blot registration:", {
          platform,
          blotName: platform,
          registered: !!BlotRegistry?.query(platform),
          quillBlots: Object.keys(Quill2.import("blots/embed") || {})
        });
      }
      let index;
      const range = this.quill.getSelection(true);
      if (range && range.index !== null) {
        index = range.index;
      } else {
        index = Math.max(0, this.quill.getLength() - 1);
      }
      const embedValue = { id: videoId, url: url.trim(), platform };
      this.quill.insertEmbed(index, platform, embedValue, "user");
      this.quill.setSelection(index + 1, "api");
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        console.log(`${platformName} video embedded successfully:`, { videoId, url: url.trim(), index, embedValue });
      }
    } catch (error) {
      console.error(`Error embedding ${platform} video:`, error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        quill: !!this.quill,
        platform
      });
      alert(`Failed to embed ${platform === "youtube" ? "YouTube" : "Vimeo"} video.

Error: ${error?.message || "Unknown error"}

Please check the console for more details.`);
    }
  }
}
if (typeof window !== "undefined") {
  try {
    const QuillGlobal = window.Quill || Quill;
    if (QuillGlobal && QuillGlobal.register) {
      QuillGlobal.register(YouTubeVideo, true);
      QuillGlobal.register(VimeoVideo, true);
    }
  } catch (e) {
  }
}
Quill.register(YouTubeVideo, true);
Quill.register(VimeoVideo, true);

export { VideoEmbedHandler, VimeoVideo, YouTubeVideo };
