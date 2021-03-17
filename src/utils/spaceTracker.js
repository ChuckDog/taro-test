/**
 * space tracker
 * props:
 * statusCallback: function 当画笔状态改变时触发; 0 失焦 1 校准中 2 校准完成等待绘画 3 绘画中
 * coordinateCallback: function 开始绘制 返回物理坐标
 *
 * methods:
 * focus: 触发校准
 * drawStart: 开始绘画
 * drawEnd: 绘画完成
 * stopTracking: 离开页面 停止监听
 */
export default class spaceTracker {
  constructor({ statusCallback, coordinateCallback }) {
    // 重力加速度
    this.gravity = 0.98;
    // 对焦校准的阈值 总时长 200ms * threshold
    this.threshold = 5;
    // 角加速度失焦阈值
    this.angleOffset = 2;
    // 移动阈值 超过阈值触发移动 mm
    this.distanceOffset = 10;
    // 三个维度的偏移量校准
    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };
    // 空间向量
    this.coordinate = {
      x: 0,
      y: 0,
      z: 0,
    };
    // 失焦角加速的的累计 x, y 轴超过 angleOffset 则失焦
    this.offsetAngle = {
      x: 0,
      y: 0,
      z: 0,
    };
    // 收集偏移量校准数组
    this.offsetArr = [];
    // tracker 画笔状态 0 失焦 1 校准中 2 校准完成等待绘画 3 绘画中
    this.status = 0;
    Taro.onAccelerometerChange((res) => {
      this.onAccelerometerChange(res);
    });
    // 角速度变化 判断失焦状态
    Taro.onGyroscopeChange((res) => {
      if (this.status && this.focusCheck(res)) {
        this.outOfFocus();
      }
    });
    this.statusCallback = statusCallback;
    this.coordinateCallback = coordinateCallback;
    this.statusCallback(this.status);
    // 开始监听
    this.startTracking();
  }

  // 失焦处理
  outOfFocus() {
    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.coordinate = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.offsetAngle = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.offsetArr = [];
    this.status = 0;
    this.statusCallback(this.status);
  }
  // 触发校准
  focus() {
    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.coordinate = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.offsetAngle = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.offsetArr = [];
    this.status = 1;
    this.statusCallback(this.status);
  }
  // start drawing
  drawStart() {
    if (this.status === 2) {
      this.status = 3;
      this.statusCallback(this.status);
    }
  }
  // end drawing
  drawEnd() {
    if (this.status === 3) {
      this.status = 2;
      this.statusCallback(this.status);
    }
  }
  // 打开传感器
  startTracking() {
    // game 20ms ui 60ms normal 200ms (不准确的)
    Taro.startAccelerometer({
      interval: "normal",
    });
    Taro.startGyroscope({
      interval: "normal",
    });
  }
  // 退出页面 停止监听
  stopTracking() {
    Taro.stopAccelerometer();
    Taro.stopGyroscope();
  }
  // 加速度变化
  onAccelerometerChange(res) {
    const c = this.coordinate;

    // 开始调焦
    if (this.status === 1) {
      this.doFocusing(res);
    } else if (this.status === 2 && this.recordCoordinate(res)) {
      // 开始跟踪 并推送记录点
      this.coordinateCallback({
        x: c.x,
        y: c.z,
      });
    } else if (this.status === 3 && this.recordCoordinate(res)) {
      // 开始绘画 并推送记录点
      this.coordinateCallback({
        x: c.x,
        y: c.z,
      });
    }
  }
  // 失焦检查
  focusCheck(res) {
    const aOff = this.angleOffset;

    aOff.x += res.x;
    aOff.y += res.y;
    aOff.z += res.z;
    if (Math.abs(aOff.x) >= 2 || Math.abs(aOff.y) >= 2) {
      return true;
    }
    return false;
  }
  // 校准过程
  doFocusing(res) {
    const arr = this.offsetArr;
    const len = arr.length;

    if (!len) {
      this.offsetArr.push(res);
    } else if (this.checkStable([res, arr[len - 1]], 0.01)) {
      this.offsetArr.push(res);
    } else {
      this.offsetArr = [res];
    }
    // 初始化移量校准 并进入等待绘画状态
    if (len === this.threshold) {
      this.initOffset();
      this.status = 2;
      this.statusCallback(this.status);
    }
  }
  // 计算物理距离 更新坐标点 并过滤掉噪声点 s = 1/2 * a * 200ms ==> s = 200*a(mm)
  recordCoordinate(res) {
    const c = this.coordinate;
    // TODO: 转换成像素值 对应镜子坐标
    const r = {
      x: (res.x - offset.x) * 200,
      y: (res.y - offset.y) * 200,
      z: (res.z - offset.z) * 200,
    };

    c.x += r.x;
    c.y += r.y;
    c.z += r.z;
    // 移动小于 distanceOffset 不更新
    if (
      Math.sqrt(Math.pow(r.x - c.x, 2) + Math.pow(r.z - c.x, 2)) <
      this.distanceOffset
    ) {
      return false;
    }
    // 更新 coordinate
    return true;
  }
  // 检查两个点间的矢量变化 是否在阈值范围内
  checkStable(ps, t) {
    const p0 = ps[0];
    const p1 = ps[1];

    return (
      Math.abs(p0.x - p1.x) < t &&
      Math.abs(p0.y - p1.y) < t &&
      Math.abs(p0.z - p1.z) < t
    );
  }
  // 初始化偏移量 根据偏移量数字 生成三个维度的偏移量校准对象
  initOffset() {
    const r = {};

    this.offsetArr.forEach((res) => {
      if (!r.xMax || res.x >= r.xMax) {
        r.xMax = res.x;
      }
      if (!r.xMin || res.x < r.xMin) {
        r.xMin = res.x;
      }
      if (!r.yMax || res.y >= r.yMax) {
        r.yMax = res.y;
      }
      if (!r.yMin || res.y < r.yMin) {
        r.yMin = res.y;
      }
      if (!r.zMax || res.z >= r.zMax) {
        r.zMax = res.z;
      }
      if (!r.zMin || res.z < r.zMin) {
        r.zMin = res.z;
      }
    });
    this.offset = {
      x: (r.xMax - r.xMin) / 2,
      y: (r.yMax - r.yMin) / 2,
      z: (r.zMax - r.zMin) / 2 - this.gravity,
    };
  }
}