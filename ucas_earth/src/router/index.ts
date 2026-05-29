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
	{
		path: '/mars',
		name: 'mars',
		component: () => import('../views/MarsView.vue'),
		meta: { title: '火星探索', activePath: '/mars' },
	},
	{
		path: '/city',
		name: 'city',
		component: () => import('../views/CityRoamingView.vue'),
		meta: { title: '城市漫游', activePath: '/city' },
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
