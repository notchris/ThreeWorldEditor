import Vue from 'vue'
import splitPane from 'vue-splitpane'
import * as VueWindow from '@hscmap/vue-window'
import App from './App.vue'
import bootstrap from 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import './assets/css/materialdesignicons.min.css'
import './assets/css/style.css'

Vue.use(VueWindow)
Vue.component('split-pane', splitPane);
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
