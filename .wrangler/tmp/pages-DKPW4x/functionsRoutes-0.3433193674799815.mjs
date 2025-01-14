import { onRequestGet as __api_desipin_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\desipin\\getVideo.js"
import { onRequestGet as __api_desipin_scrapeDESI_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\desipin\\scrapeDESI.js"
import { onRequestGet as __api_erothots_getFree_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getFree.js"
import { onRequestGet as __api_erothots_getHot_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getHot.js"
import { onRequestGet as __api_erothots_getNew_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getNew.js"
import { onRequestGet as __api_erothots_getSearch_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getSearch.js"
import { onRequestGet as __api_erothots_getVideo_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\erothots\\getVideo.js"
import { onRequestGet as __api_moviesdrive_getStream_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\moviesdrive\\getStream.js"
import { onRequest as __api_dramacool_getm3u8_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\dramacool\\getm3u8.js"
import { onRequest as __api_dramacool_getVideo_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\dramacool\\getVideo.js"
import { onRequest as __api_dramacool_getVideoTest_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\dramacool\\getVideoTest.js"
import { onRequest as __api_dramacool_stream_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\dramacool\\stream.js"
import { onRequest as __api_katmovies_getDetail_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\katmovies\\getDetail.js"
import { onRequest as __api_katmovies_getHome_js_onRequest } from "C:\\Users\\theju\\Desktop\\fmhub x erothot\\functions\\api\\katmovies\\getHome.js"

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
  {
      routePath: "/api/moviesdrive/getStream",
      mountPath: "/api/moviesdrive",
      method: "GET",
      middlewares: [],
      modules: [__api_moviesdrive_getStream_js_onRequestGet],
    },
  {
      routePath: "/api/dramacool/getm3u8",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_getm3u8_js_onRequest],
    },
  {
      routePath: "/api/dramacool/getVideo",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_getVideo_js_onRequest],
    },
  {
      routePath: "/api/dramacool/getVideoTest",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_getVideoTest_js_onRequest],
    },
  {
      routePath: "/api/dramacool/stream",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_stream_js_onRequest],
    },
  {
      routePath: "/api/katmovies/getDetail",
      mountPath: "/api/katmovies",
      method: "",
      middlewares: [],
      modules: [__api_katmovies_getDetail_js_onRequest],
    },
  {
      routePath: "/api/katmovies/getHome",
      mountPath: "/api/katmovies",
      method: "",
      middlewares: [],
      modules: [__api_katmovies_getHome_js_onRequest],
    },
  ]