import { onRequestGet as __api_moviesdrive_getStream_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\moviesdrive\\getStream.js"
import { onRequest as __api_dramacool_beta_doc_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\doc.js"
import { onRequest as __api_dramacool_beta_getm3u8_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\getm3u8.js"
import { onRequest as __api_dramacool_beta_getVideo_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\getVideo.js"
import { onRequest as __api_dramacool_beta_getVideoTest_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\getVideoTest.js"
import { onRequest as __api_dramacool_beta_play_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\play.js"
import { onRequest as __api_dramacool_beta_recent_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\recent.js"
import { onRequest as __api_dramacool_beta_stream_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool_beta\\stream.js"
import { onRequest as __api_dramacool_discover_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\discover.js"
import { onRequest as __api_dramacool_discover_info_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\discover-info.js"
import { onRequest as __api_dramacool_doc_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\doc.js"
import { onRequest as __api_dramacool_home_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\home.js"
import { onRequest as __api_dramacool_info_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\info.js"
import { onRequest as __api_dramacool_latest_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\latest.js"
import { onRequest as __api_dramacool_latest_kshow_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\latest_kshow.js"
import { onRequest as __api_dramacool_popular_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\popular.js"
import { onRequest as __api_dramacool_search_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\search.js"
import { onRequest as __api_dramacool_stream_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\stream.js"
import { onRequest as __api_dramacool_upcoming_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\upcoming.js"
import { onRequest as __api_katmovies_getDetail_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\katmovies\\getDetail.js"
import { onRequest as __api_katmovies_getHome_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\katmovies\\getHome.js"
import { onRequest as __api_kisskh_home_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\kisskh\\home.js"

export const routes = [
    {
      routePath: "/api/moviesdrive/getStream",
      mountPath: "/api/moviesdrive",
      method: "GET",
      middlewares: [],
      modules: [__api_moviesdrive_getStream_js_onRequestGet],
    },
  {
      routePath: "/api/dramacool_beta/doc",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_doc_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/getm3u8",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_getm3u8_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/getVideo",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_getVideo_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/getVideoTest",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_getVideoTest_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/play",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_play_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/recent",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_recent_js_onRequest],
    },
  {
      routePath: "/api/dramacool_beta/stream",
      mountPath: "/api/dramacool_beta",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_beta_stream_js_onRequest],
    },
  {
      routePath: "/api/dramacool/discover",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_discover_js_onRequest],
    },
  {
      routePath: "/api/dramacool/discover-info",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_discover_info_js_onRequest],
    },
  {
      routePath: "/api/dramacool/doc",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_doc_js_onRequest],
    },
  {
      routePath: "/api/dramacool/home",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_home_js_onRequest],
    },
  {
      routePath: "/api/dramacool/info",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_info_js_onRequest],
    },
  {
      routePath: "/api/dramacool/latest",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_latest_js_onRequest],
    },
  {
      routePath: "/api/dramacool/latest_kshow",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_latest_kshow_js_onRequest],
    },
  {
      routePath: "/api/dramacool/popular",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_popular_js_onRequest],
    },
  {
      routePath: "/api/dramacool/search",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_search_js_onRequest],
    },
  {
      routePath: "/api/dramacool/stream",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_stream_js_onRequest],
    },
  {
      routePath: "/api/dramacool/upcoming",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_upcoming_js_onRequest],
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
  {
      routePath: "/api/kisskh/home",
      mountPath: "/api/kisskh",
      method: "",
      middlewares: [],
      modules: [__api_kisskh_home_js_onRequest],
    },
  ]