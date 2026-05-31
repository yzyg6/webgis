/** 可视域分析参数 */
export interface ViewshedParams {
  /** 观察者高度偏移（m） */
  observerHeight: number
  /** 目标高度偏移（m） */
  targetHeight: number
  /** 分析半径（m） */
  radius: number
}

/** 分析状态 */
export type AnalysisStatus = 'idle' | 'picking' | 'picked' | 'analyzing' | 'done' | 'cleared'

/** 底图类型 */
export type BaseLayerType = 'osm' | 'arcgis' | 'carto' | 'google-satellite'
