import { onRequestGet as __api_erothots_getFree_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getFree.js"
import { onRequestGet as __api_erothots_getHot_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getHot.js"
import { onRequestGet as __api_erothots_getNew_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getNew.js"
import { onRequestGet as __api_erothots_getSearch_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getSearch.js"
import { onRequestGet as __api_erothots_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getVideo.js"
import { onRequestGet as __api_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\getVideo.js"
import { onRequestGet as __api_scrapeDESI_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\scrapeDESI.js"

export const routes = [
    {
      routePath: "/api/erothots/getFree",
      mountPath: "/api/erothots",
      method: "GET",
      middlewares: [],
      modules: [__api_erothots_getFree_js_onRequestGet],
    },
  {
      routePath: "/api/erothots/getHot",
      mountPath: "/api/erothots",
      method: "GET",
      middlewares: [],
      modules: [__api_erothots_getHot_js_onRequestGet],
    },
  {
      routePath: "/api/erothots/getNew",
      mountPath: "/api/erothots",
      method: "GET",
      middlewares: [],
      modules: [__api_erothots_getNew_js_onRequestGet],
    },
  {
      routePath: "/api/erothots/getSearch",
      mountPath: "/api/erothots",
      method: "GET",
      middlewares: [],
      modules: [__api_erothots_getSearch_js_onRequestGet],
    },
  {
      routePath: "/api/erothots/getVideo",
      mountPath: "/api/erothots",
      method: "GET",
      middlewares: [],
      modules: [__api_erothots_getVideo_js_onRequestGet],
    },
  {
      routePath: "/api/getVideo",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_getVideo_js_onRequestGet],
    },
  {
      routePath: "/api/scrapeDESI",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_scrapeDESI_js_onRequestGet],
    },
  ]