import { onRequestGet as __api_moviesdrive_getStream_js_onRequestGet } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\moviesdrive\\getStream.js"
import { onRequest as __api_dramacool_doc_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\doc.js"
import { onRequest as __api_dramacool_getm3u8_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\getm3u8.js"
import { onRequest as __api_dramacool_getVideo_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\getVideo.js"
import { onRequest as __api_dramacool_getVideoTest_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\getVideoTest.js"
import { onRequest as __api_dramacool_play_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\play.js"
import { onRequest as __api_dramacool_stream_js_onRequest } from "C:\\Users\\theju\\Desktop\\xyra-api\\functions\\api\\dramacool\\stream.js"
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
      routePath: "/api/dramacool/doc",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_doc_js_onRequest],
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
      routePath: "/api/dramacool/play",
      mountPath: "/api/dramacool",
      method: "",
      middlewares: [],
      modules: [__api_dramacool_play_js_onRequest],
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
  {
      routePath: "/api/kisskh/home",
      mountPath: "/api/kisskh",
      method: "",
      middlewares: [],
      modules: [__api_kisskh_home_js_onRequest],
    },
  ]