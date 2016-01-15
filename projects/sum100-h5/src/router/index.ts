import {createRouter, createWebHistory} from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Playground',
    component: () => import('../views/Playground.vue')
  }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router