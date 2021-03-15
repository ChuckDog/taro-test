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
    Taro.onAccelerometerChange((res) => {
      // console.log('==================onAccelerometerChange===============================');
      // console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
      recordAccelerometer[counter].push(res);
    });
    Taro.onGyroscopeChange((res) => {
      // console.log('========================onGyroscopeChange=============================');
      // console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
      recordGyroscope[counter].push(res);
    });
  }, [RecorderManager]);
  useEffect(() => {
    if (status) {
      console.log(counter, "-------------------> counter end");
      Taro.startAccelerometer({
        interval: "ui",
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
        interval: "ui",
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
        console.log(counter, "-------------------> counter end");
        recordAccelerometer[counter] = [];
        recordGyroscope[counter] = [];
      }, 2000);
      // RecorderManager.stop();
    }
  }, [RecorderManager, status]);

  const doExport = () => {
    console.log(
      "======================= result record =============================="
    );
    console.log({
      recordAccelerometer,
      recordGyroscope,
    });
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
    </View>
  );
}
