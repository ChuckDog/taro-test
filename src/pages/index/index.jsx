/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Button } from "@tarojs/components";

import "taro-ui/dist/style/components/button.scss"; // 按需引入
import "./index.scss";

let counter = 0;
let recordAccelerometer = {};
let recordGyroscope = {};

export default function Index() {
  const RecorderManager = Taro.getRecorderManager();
  const [status, setStatus] = useState(false);
  useEffect(() => {
    // RecorderManager.onStop(rsp => {
    //   console.log('==========================onStopRecord================================');
    //   console.log(`this is record stop: ${rsp}`);
    // });
    // Taro.onAccelerometerChange((res) => {
    //   console.log('==================onAccelerometerChange===============================');
    //   console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
    //   recordAccelerometer[counter].push(res);
    // });
    // Taro.onGyroscopeChange((res) => {
    //   console.log('========================onGyroscopeChange=============================');
    //   console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
    //   recordGyroscope[counter].push(res);
    // });
  }, [RecorderManager]);
  useEffect(() => {
    if (status) {
      console.log(counter, "-------------------> counter end");
      Taro.startAccelerometer({
        interval: "normal",
        // success: rsp => {
        //   console.log(`this is accelerometer tracker: ${rsp}`);
        // },
        // fail: err => {
        //   console.log(`accelerometer tracker fail: ${err}`);
        // },
        // complete: rsp => {
        //   console.log(`this is accelerometer tracker done: ${rsp}`);
        // }
      });
      Taro.startGyroscope({
        interval: "normal",
        // success: rsp => {
        //   console.log(`this is gyroscope tracker: ${rsp}`);
        // },
        // fail: err => {
        //   console.log(`gyroscope tracker fail: ${err}`);
        // },
        // complete: rsp => {
        //   console.log(`this is gyroscope tracker done: ${rsp}`);
        // }
      });
      // RecorderManager.start({ duration: 5000 });
    } else {
      Taro.stopAccelerometer();
      Taro.stopGyroscope();
      setTimeout(function() {
        counter++;
        // console.log(counter, "-------------------> counter end");
        recordAccelerometer[counter] = [];
        recordGyroscope[counter] = [];
      }, 2000);
      // RecorderManager.stop();
    }
  }, [RecorderManager, status]);

  const doExport = () => {
    let r = {};
    let temp = undefined;
    let tempObj = {
      x: 0,
      y: 0,
      z: 0,
      zz: [],
      zzz: [],
    };

    console.log(
      "======================= result record =============================="
    );
    console.log({
      recordAccelerometer,
      recordGyroscope,
      counter,
    });
    (recordGyroscope[counter].length
      ? recordGyroscope[counter]
      : recordGyroscope[counter - 1]
    ).forEach((res) => {
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
      // if (temp) {
      //   console.log(
      //     `offset: x: ${Math.abs(res.x - temp.x)};----- y: ${Math.abs(
      //       res.y - temp.y
      //     )}, yNext: ${res.y}, ylast: ${temp.y};----- z: ${Math.abs(
      //       res.z - temp.z
      //     )};`
      //   );
      //   tempObj.x.push(Math.abs(res.x - temp.x));
      //   tempObj.y.push(Math.abs(res.y - temp.y));
      //   tempObj.z.push(Math.abs(res.z - temp.z));
      // }
      tempObj.x += res.x;
      tempObj.y += res.y;
      tempObj.z += res.z;
      // temp = res;
    });
    // console.log(
    //   `recordAccelerometer range: ${counter} x: ${Math.max(
    //     ...tempObj.x
    //   )}; y: ${Math.max(...tempObj.y)}; z: ${Math.max(...tempObj.z)}`
    // );
    console.log(
      `range: ${counter} x: ${tempObj.x}; y: ${tempObj.y}; z: ${tempObj.z}`
    );
  };

  const doClean = () => {
    console.log(
      "======================= data clean =============================="
    );
    counter = 1;
    recordAccelerometer = { 1: [] };
    recordGyroscope = { 1: [] };
  };

  return (
    <View className="index">
      <View
        className="btn"
        onTouchStart={() => {
          setStatus(true);
        }}
        onTouchEnd={() => {
          setStatus(false);
        }}
        style={{ backgroundColor: status ? "red" : "", marginBottom: "20px" }}
      >
        {status ? "开启" : "关闭"}
      </View>
      <Button
        className="btn-max-w"
        plain
        type="primary"
        style={{ marginBottom: "20px" }}
        onClick={doExport}
      >
        导出
      </Button>
      <Button
        className="btn-max-w"
        plain
        type="primary"
        style={{ marginBottom: "20px" }}
        onClick={doClean}
      >
        清除
      </Button>
      <Button
        className="btn-max-w"
        plain
        type="primary"
        style={{ marginBottom: "20px" }}
        onClick={() => {
          Taro.navigateTo({ url: "/pages/demo/index" });
        }}
      >
        demo
      </Button>
    </View>
  );
}
