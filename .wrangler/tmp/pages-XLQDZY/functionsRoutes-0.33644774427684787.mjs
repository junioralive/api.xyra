import { onRequestGet as __api_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\getVideo.js"
import { onRequestGet as __api_getVideoEro_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\getVideoEro.js"
import { onRequestGet as __api_scrapeDESI_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\scrapeDESI.js"
import { onRequestGet as __api_scrapeERO_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\scrapeERO.js"

export const routes = [
    {
      routePath: "/api/getVideo",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_getVideo_js_onRequestGet],
    },
  {
      routePath: "/api/getVideoEro",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_getVideoEro_js_onRequestGet],
    },
  {
      routePath: "/api/scrapeDESI",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrapeDESI_js_onRequestGet],
    },
  {
      routePath: "/api/scrapeERO",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrapeERO_js_onRequestGet],
    },
  ]