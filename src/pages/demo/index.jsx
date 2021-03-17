/* eslint-disable no-undef */
import React, { useState, useEffect, useCallback } from "react";
import { View } from "@tarojs/components";
import tracker from "../../utils/spaceTracker";

import "taro-ui/dist/style/components/button.scss"; // 按需引入
import "./index.scss";

export default function Demo() {
  const [status, setStatus] = useState(0);
  const [btn, setBtn] = useState(false);
  const [t, setT] = useState(null);

  const statusCallback = useCallback((status) => {
    setStatus(status);
  }, []);
  const coordinateCallback = useCallback((coordinate) => {
    console.log(`moving to x: ${coordinate.x}mm; y: ${coordinate.y}mm`);
  }, []);
  useEffect(() => {
    setT(
      new tracker({
        statusCallback,
        coordinateCallback,
      })
    );
    return () => {
      t.stopTracking();
    };
  }, []);
  useEffect(() => {
    console.log(
      status,
      "---------------------> status change <----------------"
    );
    if (!btn) return;
    if (status === 0) {
      t.focus();
    } else if (status === 2) {
      t.drawStart();
    } else if (status === 3) {
      t.drawEnd();
    }
  }, [status, btn, t]);
  const getBtnTerm = useCallback(() => {
    if (status === 0) {
      return "校准";
    } else if (status === 1) {
      return "校准中...";
    } else if (status === 2) {
      return "绘画";
    } else if (status === 3) {
      return "绘画中...";
    }
  }, [status]);

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
