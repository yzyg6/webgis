import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const routes = [
	{
		path: '/',
		name: 'home',
		component: HomeView,
		meta: { title: '首页' },
	},
	{
		path: '/campus',
		name: 'campus',
		component: () => import('../views/CampusView.vue'),
		meta: { title: 'FYUN 校园系统', activePath: '/campus' },
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
