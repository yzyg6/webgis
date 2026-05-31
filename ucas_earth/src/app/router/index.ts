import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'home',
		component: () => import('../views/HomeView.vue'),
		meta: { title: '首页' },
	},
	{
		path: '/campus',
		name: 'campus',
		component: () => import('../../campus/CampusView.vue'),
		meta: { title: 'Cesium Learn&Show', activePath: '/campus' },
	},
	{
		path: '/mars',
		name: 'mars',
		component: () => import('../../mars/MarsView.vue'),
		meta: { title: '火星探索', activePath: '/mars' },
	},
	{
		path: '/city',
		name: 'city',
		component: () => import('../../city/CityRoamingView.vue'),
		meta: { title: '城市漫游', activePath: '/city' },
	},
	{
		path: '/analysis',
		name: 'analysis',
		component: () => import('../../analysis/AnalysisView.vue'),
		meta: { title: '空间分析', activePath: '/analysis' },
	},
]

const router = createRouter({
	history: createWebHistory(),
	routes,
})

export default router
