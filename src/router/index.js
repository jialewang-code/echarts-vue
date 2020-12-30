import Vue from "vue";
import VueRouter from "vue-router";
import ScreenPage from '@/views/ScreenPage';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    redirect: '/screenpage'
  },
  {
    path: '/screenpage',
    component: ScreenPage
  },
];

const router = new VueRouter({
  routes
});

export default router;
