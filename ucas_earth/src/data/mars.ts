// 火星相关常量和配置

// Cesium Ion 资产 ID
export const MARS_ION_ASSET_ID = 3644333

// 火星大气配置
export const MARS_ATMOSPHERE = {
  mieCoefficient: [9.0e-5, 2.0e-5, 1.0e-5],
  rayleighCoefficient: [9.0e-6, 2.0e-6, 1.0e-6],
  rayleighScaleHeight: 9000,
  mieScaleHeight: 2700,
  saturationShift: -0.1,
}

// 火星后处理配置
export const MARS_POST_PROCESS = {
  bloom: {
    brightness: -0.5,
    stepSize: 1.0,
    sigma: 3.0,
    delta: 1.5,
  },
  exposure: 1.5,
}

// 火星车配置
export const MARS_ROVERS = [
  {
    id: 'Curiosity',
    name: '好奇号',
    startSol: 3,
    description: 'NASA 的火星探测车，于 2012 年着陆',
  },
  {
    id: 'Perseverance',
    name: '毅力号',
    startSol: 13,
    description: 'NASA 的火星探测车，于 2021 年着陆',
  },
  {
    id: 'Ingenuity',
    name: '机智号',
    description: '火星直升机，仅用于查看',
  },
  {
    id: 'TheMartianJourney',
    name: '火星之旅',
    description: '《火星救援》小说中的路线',
  },
]

// 火星车轨迹文件路径
export const MARS_CZML_PATH = '/data/mars/Mars.czml'

// 火星地标文件路径
export const MARS_LANDMARKS_PATH = '/data/mars/MarsPointsOfInterest.geojson'

// 初始相机位置（火星）
export const MARS_INITIAL_VIEW = {
  longitude: 137.4,
  latitude: -4.5,
  height: 10000000,
}

// Sol 日期转换常量
export const SECONDS_PER_SOL = 24 * 60 * 60 + 39 * 60 + 35

// 轨迹宽度配置
export const ROVER_PATH_WIDTH = {
  near: 0.0,
  nearValue: 15.0,
  far: 1.0e5,
  farValue: 0.0,
}

export const MARTIAN_JOURNEY_WIDTH = {
  near: 0.0,
  nearValue: 10.0,
  far: 1.0e7,
  farValue: 0.0,
}
