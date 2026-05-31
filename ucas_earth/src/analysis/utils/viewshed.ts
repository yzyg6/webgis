import * as Cesium from 'cesium'

export interface ViewshedOptions {
  /** 观察者高度偏移（m） */
  qdOffset?: number
  /** 目标高度偏移（m） */
  zdOffset?: number
  /** 分析半径（m） */
  radius?: number
  /** 可见区域颜色 */
  visibleColor?: Cesium.Color
  /** 不可见区域颜色 */
  invisibleColor?: Cesium.Color
}

export class Viewshed {
  private viewer: Cesium.Viewer
  private qdOffset: number
  private zdOffset: number
  private radius: number
  private visibleColor: Cesium.Color
  private invisibleColor: Cesium.Color
  private entities: Cesium.Entity[] = []
  private pointEntity: Cesium.Entity | null = null

  constructor(viewer: Cesium.Viewer, options: ViewshedOptions = {}) {
    this.viewer = viewer
    this.qdOffset = options.qdOffset ?? 2
    this.zdOffset = options.zdOffset ?? 2
    this.radius = options.radius ?? 500
    this.visibleColor = options.visibleColor ?? Cesium.Color.GREEN.withAlpha(0.4)
    this.invisibleColor = options.invisibleColor ?? Cesium.Color.RED.withAlpha(0.4)
  }

  /**
   * 更新参数
   */
  updateParams(params: { qdOffset?: number; zdOffset?: number; radius?: number }): void {
    if (params.qdOffset !== undefined) this.qdOffset = params.qdOffset
    if (params.zdOffset !== undefined) this.zdOffset = params.zdOffset
    if (params.radius !== undefined) this.radius = params.radius
  }

  /**
   * 执行可视域分析
   * @param observerPosition 观察点笛卡尔坐标
   */
  analyse(observerPosition: Cesium.Cartesian3): void {
    this.clear()

    const scene = this.viewer.scene

    // 计算观察者位置（加上观察者高度偏移）
    const cartographic = Cesium.Cartographic.fromCartesian(observerPosition)
    const observerCartesian = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height + this.qdOffset
    )

    // 添加观察点标记
    this.pointEntity = this.viewer.entities.add({
      position: observerCartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.NONE,
      },
      label: {
        text: '观察点',
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -15),
      },
    })

    // 采样参数
    const gridSize = 60 // 每个方向的采样数
    const step = (this.radius * 2) / gridSize

    // 计算观察者在地表的参考点（用于生成网格）
    const surfaceCartesian = Cesium.Cartesian3.fromRadians(
      cartographic.longitude,
      cartographic.latitude,
      cartographic.height
    )

    // 获取局部坐标系
    const enuMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(surfaceCartesian)
    const inverseEnuMatrix = Cesium.Matrix4.inverse(enuMatrix, new Cesium.Matrix4())

    // 网格采样与射线检测
    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const localX = -this.radius + i * step
        const localY = -this.radius + j * step

        // 跳过半径外的点
        const dist = Math.sqrt(localX * localX + localY * localY)
        if (dist > this.radius) continue

        // 计算目标点在 ENU 局部坐标中的位置
        const localPos = new Cesium.Cartesian3(localX, localY, 0)
        const targetSurface = Cesium.Matrix4.multiplyByPoint(enuMatrix, localPos, new Cesium.Cartesian3())

        // 目标点加上目标高度偏移
        const targetCartographic = Cesium.Cartographic.fromCartesian(targetSurface)
        const targetCartesian = Cesium.Cartesian3.fromRadians(
          targetCartographic.longitude,
          targetCartographic.latitude,
          targetCartographic.height + this.zdOffset
        )

        // 射线检测
        const direction = Cesium.Cartesian3.subtract(targetCartesian, observerCartesian, new Cesium.Cartesian3())
        Cesium.Cartesian3.normalize(direction, direction)
        const ray = new Cesium.Ray(observerCartesian, direction)

        let isVisible = true
        const result = scene.pickFromRay(ray, undefined, Cesium.Scene.CLAMP_TO_HEIGHT)
        if (Cesium.defined(result) && Cesium.defined(result.position)) {
          // 计算命中点与观察者的距离
          const hitDistance = Cesium.Cartesian3.distance(observerCartesian, result.position)
          const targetDistance = Cesium.Cartesian3.distance(observerCartesian, targetCartesian)
          // 如果命中点比目标点近，说明目标被遮挡
          if (hitDistance < targetDistance * 0.95) {
            isVisible = false
          }
        }

        // 渲染采样格子
        const halfStep = step / 2
        const corners = [
          Cesium.Matrix4.multiplyByPoint(enuMatrix, new Cesium.Cartesian3(localX - halfStep, localY - halfStep, 0), new Cesium.Cartesian3()),
          Cesium.Matrix4.multiplyByPoint(enuMatrix, new Cesium.Cartesian3(localX + halfStep, localY - halfStep, 0), new Cesium.Cartesian3()),
          Cesium.Matrix4.multiplyByPoint(enuMatrix, new Cesium.Cartesian3(localX + halfStep, localY + halfStep, 0), new Cesium.Cartesian3()),
          Cesium.Matrix4.multiplyByPoint(enuMatrix, new Cesium.Cartesian3(localX - halfStep, localY + halfStep, 0), new Cesium.Cartesian3()),
        ]

        const hierarchy = new Cesium.PolygonHierarchy(corners)
        const entity = this.viewer.entities.add({
          polygon: {
            hierarchy,
            material: isVisible ? this.visibleColor : this.invisibleColor,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        })
        this.entities.push(entity)
      }
    }
  }

  /**
   * 清除所有分析结果
   */
  clear(): void {
    for (const entity of this.entities) {
      this.viewer.entities.remove(entity)
    }
    this.entities = []

    if (this.pointEntity) {
      this.viewer.entities.remove(this.pointEntity)
      this.pointEntity = null
    }
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.clear()
  }
}
