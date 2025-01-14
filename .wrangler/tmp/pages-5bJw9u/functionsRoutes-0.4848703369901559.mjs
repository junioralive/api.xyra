import { onRequestGet as __api_get_video_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\get_video.js"
import { onRequestGet as __api_image_proxy_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\image-proxy.js"
import { onRequestGet as __api_scrape_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\scrape.js"

export const routes = [
    {
      routePath: "/api/get_video",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_get_video_js_onRequestGet],
    },
  {
      routePath: "/api/image-proxy",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_image_proxy_js_onRequestGet],
    },
  {
      routePath: "/api/scrape",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrape_js_onRequestGet],
    },
  ]