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
    // 镜子物理宽高 522 * 934 mm
    this.mirror = {
      width: 522,
      height: 934,
    };
    // 镜子分辨率 2160 * 3840 px
    this.mirrorPixel = {
      width: 2160,
      height: 3840,
    };
    // 对焦校准的阈值 总时长 200ms * threshold
    this.threshold = 5;
    // 角加速度失焦阈值
    this.angleThreshold = 2;
    // 角加速度失焦时间阈值 4m
    this.angleTimeThreshold = 20;
    // 失焦角加速的的累计 x, y 轴超过 angleThreshold 则失焦
    this.angleOffset = {
      x: 0,
      y: 0,
      z: 0,
    };
    // 1秒钟清除一次 angleCounter
    this.angleCounter = 0;
    // 移动阈值 超过阈值触发移动
    this.distanceOffset = 0.01;
    // 最大校准次数
    this.maxFocus = 20;
    // 校准次数
    this.focusCounter = 0;
    // 三个维度的偏移量校准
    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };
    // 空间向量
    this.coordinate = {
      // 第几次时间返回 间隔约等于200ms
      time: 0,
      // 当前点的速度
      velocity: {
        x: 0,
        y: 0,
      },
      // 空间坐标
      position: {
        x: 0,
        y: 0,
      },
      mirrorPos: {
        x: 0,
        y: 0,
      },
      // 上一次的加速度 默认初始值
      lastAcc: {
        x: 0,
        y: 0,
        z: -this.gravity,
      },
    };
    this.lastAcc = {
      x: 0,
      y: 0,
      z: -this.gravity,
    };
    // 收集偏移量校准数组
    this.offsetArr = [];
    // 上一次的三维角加速度
    this.lastGyr = {
      x: 0,
      y: 0,
      z: 0,
    };
    // tracker 画笔状态 0 失焦 1 校准中 2 校准完成等待绘画 3 绘画中
    this.status = 0;
    wx.onAccelerometerChange((res) => {
      this.onAccelerometerChange(res);
    });
    // 角速度变化 判断失焦状态
    wx.onGyroscopeChange((res) => {
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
    this.initData();
    this.status = 0;
    this.statusCallback(this.status);
  }
  // 触发校准
  focus() {
    this.initData();
    this.status = 1;
    this.statusCallback(this.status);
  }
  // init data source
  initData() {
    this.offset = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.coordinate = {
      time: 0,
      velocity: {
        x: 0,
        y: 0,
      },
      position: {
        x: 0,
        y: 0,
      },
      mirrorPos: {
        x: 0,
        y: 0,
      },
      lastAcc: {
        x: 0,
        y: 0,
        z: -this.gravity,
      },
    };
    this.angleOffset = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.lastGyr = {
      x: 0,
      y: 0,
      z: 0,
    };
    this.lastAcc = {
      x: 0,
      y: 0,
      z: -this.gravity,
    };
    this.offsetArr = [];
    this.focusCounter = 0;
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
    wx.startAccelerometer({
      interval: "normal",
    });
    wx.startGyroscope({
      interval: "normal",
    });
  }
  // 退出页面 停止监听
  stopTracking() {
    wx.stopAccelerometer();
    wx.stopGyroscope();
  }
  // 加速度变化
  onAccelerometerChange(res) {
    // 开始调焦
    if (this.status === 1) {
      this.doFocusing(res);
    } else if (this.status === 2 && this.recordCoordinate(res)) {
      // 开始跟踪 并推送记录点
      this.coordinateCallback(this.coordinate.mirrorPos);
    } else if (this.status === 3 && this.recordCoordinate(res)) {
      // 开始绘画 并推送记录点
      this.coordinateCallback(this.coordinate.mirrorPos);
    }
  }
  // 物理坐标转换镜子坐标
  transfer(pos) {
    return {
      x: (pos.x / this.mirror.width) * this.mirrorPixel.width,
      y: (pos.y / this.mirror.height) * this.mirrorPixel.height,
    };
  }
  // 失焦检查
  focusCheck(res) {
    const aOff = this.angleOffset;
    const l = this.lastGyr;

    aOff.x += res.x - l.x;
    aOff.y += res.y - l.y;
    aOff.z += res.z - l.z;
    this.lastGyr = res;
    if (
      Math.abs(aOff.x) > this.angleThreshold ||
      Math.abs(aOff.y) > this.angleThreshold
    ) {
      return true;
    }
    // 一秒钟清空一次 角加速度的累积
    if (this.angleCounter > this.angleTimeThreshold) {
      this.angleOffset = {
        x: 0,
        y: 0,
        z: 0,
      };
      this.angleCounter = 0;
    }
    this.angleCounter++;
    return false;
  }
  // 校准过程
  doFocusing(res) {
    const arr = this.offsetArr;
    const len = arr.length;

    if (!len) {
      this.offsetArr.push(res);
    } else if (
      this.checkStable([res, arr[len - 1]], 0.01) ||
      this.focusCounter > this.maxFocus
    ) {
      this.offsetArr.push(res);
    } else {
      this.offsetArr = [res];
    }
    this.focusCounter++;
    // 初始化移量校准 并进入等待绘画状态
    if (len === this.threshold) {
      this.initOffset();
      this.status = 2;
      this.statusCallback(this.status);
    }
  }
  // 计算物理距离 更新坐标点 并过滤掉噪声点
  recordCoordinate(res) {
    // const c = this.coordinate;
    const l = this.lastAcc;
    const o = this.offset;
    const r = {
      x: res.x - l.x - o.x,
      y: res.y - l.y - o.y,
      z: res.z - l.z - o.z,
    };

    // 滤掉微弱抖动 不更新
    if (
      Math.abs(r.x) < this.distanceOffset &&
      Math.abs(r.z) < this.distanceOffset
    ) {
      return false;
    }
    // 更新 coordinate
    this.coordinate.time++;
    this.lastAcc = res;
    // s (mm) = v0t + 1/2*at^
    // this.coordinate.position.x +=
    //   this.coordinate.velocity.x * 200 + 0.5 * this.accTransfer(res.x, 'x') * Math.pow(200, 2);
    // this.coordinate.position.y +=
    //   this.coordinate.velocity.y * 200 + 0.5 * this.accTransfer(res.z, 'y') * Math.pow(200, 2);
    // // mm/ms
    // this.coordinate.velocity.x += res.x * 10 * 0.2;
    // this.coordinate.velocity.y += (res.z + this.gravity) * 10 * 0.2;
    // this.coordinate.lastAcc = res;
    const preX = {
      a: this.coordinate.lastAcc.x,
      v: this.coordinate.velocity.x,
      s: this.coordinate.position.x,
    };
    const nextX = this.getNextState(preX, res.x * 10); // 0.98 * 10 = 9.8 m/s^2
    const preY = {
      a: this.coordinate.lastAcc.y,
      v: this.coordinate.velocity.y,
      s: this.coordinate.position.y,
    };
    const nextY = this.getNextState(preY, (res.z + this.gravity) * 10); // 考虑重力加速度 0.98 * 10 = 9.8 m/s^2

    // 加速度，单位 m/s^2
    this.coordinate.lastAcc = {
      x: nextX.a,
      y: nextY.a,
    };
    // 速度，单位 m/s
    this.coordinate.velocity = {
      x: nextX.v,
      y: nextY.v,
    };
    // 位移，单位 m
    this.coordinate.position = {
      x: nextX.s,
      y: nextY.s,
    };
    // 镜子尺寸位置，单位 mm, 1m = 1000 mm
    this.coordinate.mirrorPos = this.transfer({
      x: this.coordinate.position.x * 1000,
      y: this.coordinate.position.y * 1000,
    });
    return true;
  }
  getNextState = (pre, next) => {
    // pre 是上次的位置数据，next 是当前位置的传感器数据。
    // 数据准备
    // 固定数据
    const t = 0.2; // 单位：s， 200 ms = 0.2 s
    // 上一个位置的数据
    const a0 = pre.a; // 单位：m/s^2
    const v0 = pre.v; // 单位：m/s
    const s0 = pre.s; // 单位：m
    // 当前位置的数据
    const a1 = next; // 单位：m/s^2

    // 数据计算
    const averageA = 0.5 * (a0 + a1); // 平均加速度
    const v1 = v0 + averageA * t; // v0 初速度，v1 末速度
    const averageV = 0.5 * (v0 + v1); // 平均速度
    const s1 = s0 + averageV * t; // s0 初位移，s1 末位移

    return {
      a: a1,
      v: v1,
      s: s1,
    };
  };
  // 加速度转换
  accTransfer(acc, type) {
    if (type === "x") {
      return (acc * 10) / 1000; // todo 这里应该是乘以 1000;
    } else if (type === "y") {
      return ((acc + this.gravity) * 10) / 1000; // todo 这里应该是乘以 1000;
    }
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
      z: (r.zMax - r.zMin) / 2,
    };
  }
}
