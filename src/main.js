import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import axios from 'axios'
import '@/assets/css/global.less'
import '@/assets/font/iconfont.css'//引入字体文件
import SocketService from '@/utils/socket_service';

//对服务端进行 WebSocket 的一个连接
SocketService.Instance.connect()
//其它组件通过 this.$socket 更好的使用 SocketService 中定义的方法
Vue.prototype.$socket = SocketService.Instance;

//将全局的echarts对象挂载到Vue 的原型对象上,别的组件可以通过使用 this.$echarts引入
Vue.prototype.$echarts = window.echarts;
Vue.config.productionTip = false;

//请求基准路径的配置
axios.defaults.baseURL = 'http://127.0.0.1:8989/api/'
Vue.prototype.$http = axios

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
