/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";

import "taro-ui/dist/style/components/button.scss"; // 按需引入
import "./index.scss";

export default function Index() {
  const RecorderManager = Taro.getRecorderManager();
  const [status, setStatus] = useState(false);
  useEffect(() => {
    RecorderManager.onStop(rsp => {
      console.log('==========================onStopRecord================================');
      console.log(`this is record stop: ${rsp}`);
    });
    Taro.onAccelerometerChange((res) => {
      console.log('==================onAccelerometerChange===============================');
      console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
    });
    Taro.onGyroscopeChange((res) => {
      console.log('========================onGyroscopeChange=============================');
      console.log(`x: ${res.x}; y: ${res.y}; z: ${res.z};`);
    });
  }, [RecorderManager]);
  useEffect(() => {
    if (status) {
      Taro.startAccelerometer({
        interval: "game",
        success: rsp => {
          console.log(`this is accelerometer tracker: ${rsp}`);
        },
        fail: err => {
          console.log(`accelerometer tracker fail: ${err}`);
        },
        complete: rsp => {
          console.log(`this is accelerometer tracker done: ${rsp}`);
        }
      });
      Taro.startGyroscope({
        interval: "game",
        success: rsp => {
          console.log(`this is gyroscope tracker: ${rsp}`);
        },
        fail: err => {
          console.log(`gyroscope tracker fail: ${err}`);
        },
        complete: rsp => {
          console.log(`this is gyroscope tracker done: ${rsp}`);
        }
      });
      RecorderManager.start({ duration: 5000 });
    } else {
      Taro.stopAccelerometer();
      Taro.stopGyroscope();
      RecorderManager.stop();
    }
  }, [RecorderManager, status]);

  return (
    <View className='index'>
      <View
        className='btn'
        onTouchStart={() => {
          setStatus(true);
        }}
        onTouchEnd={() => {
          setStatus(false);
        }}
      >
        {status ? "开启" : "关闭"}
      </View>
    </View>
  );
}
