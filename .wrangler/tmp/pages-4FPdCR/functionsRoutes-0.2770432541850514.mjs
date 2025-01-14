import { onRequestGet as __api_desipin_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\desipin\\getVideo.js"
import { onRequestGet as __api_desipin_scrapeDESI_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\desipin\\scrapeDESI.js"
import { onRequestGet as __api_erothots_getFree_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getFree.js"
import { onRequestGet as __api_erothots_getHot_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getHot.js"
import { onRequestGet as __api_erothots_getNew_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getNew.js"
import { onRequestGet as __api_erothots_getSearch_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getSearch.js"
import { onRequestGet as __api_erothots_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getVideo.js"

export const routes = [
    {
      routePath: "/api/desipin/getVideo",
      mountPath: "/api/desipin",
      method: "GET",
      middlewares: [],
      modules: [__api_desipin_getVideo_js_onRequestGet],
    },
  {
      routePath: "/api/desipin/scrapeDESI",
      mountPath: "/api/desipin",
      method: "GET",
      middlewares: [],
      modules: [__api_desipin_scrapeDESI_js_onRequestGet],
    },
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
  ]