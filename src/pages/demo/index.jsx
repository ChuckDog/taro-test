/* eslint-disable no-undef */
import React, { useState, useEffect, useCallBack, useRef } from "react";
// import Taro from "@tarojs/taro";
import { View } from "@tarojs/components";
import tracker from "../../utils/spaceTracker";

import "taro-ui/dist/style/components/button.scss"; // 按需引入
import "./index.scss";

export default function Demo() {
  const [status, setStatus] = useState(0);
  const [btn, setBtn] = useState(false);
  const t = useRef(null);

  const statusCallback = useCallBack((status) => {
    setStatus(status);
  });
  const coordinateCallback = useeCallBack((coordinate) => {
    console.log(`moving to x: ${coordinate.x}mm; y: ${coordinate.y}mm`);
  });
  useEffect(() => {
    t.current = tracker({
      statusCallback,
      coordinateCallback,
    });
    return () => {
      t.current.stopTracking();
    };
  }, []);
  useEffect(() => {
    if (!btn) return;
    if (status === 0) {
      t.current.focus();
    } else if (status === 2) {
      t.current.drawStart();
    } else if (status === 3) {
      t.current.drawEnd();
    }
  }, [status, btn]);
  const getBtnTerm = () => {
    if (status === 0) {
      return "校准";
    } else if (status === 1) {
      return "校准中...";
    } else if (status === 2) {
      return "绘画";
    } else if (status === 3) {
      return "绘画中...";
    }
  };

  return (
    <View className="index">
      <View
        className="btn"
        onTouchStart={() => {
          setBtn(true);
        }}
        onTouchEnd={() => {
          setBtn(false);
        }}
        style={{ backgroundColor: btn ? "red" : "", marginBottom: "20px" }}
      >
        {getBtnTerm()}
      </View>
    </View>
  );
}
