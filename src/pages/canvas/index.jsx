import React, { useState, useEffect, useRef } from "react";
import Taro from "@tarojs/taro";
import { View, Button, Canvas } from "@tarojs/components";

import "./index.scss";

export default function canvas() {
  const [canvasw, setCanvasw] = useState(0);
  const [canvash, setCanvash] = useState(0);
  const [isButtonDown, setIsButtonDown] = useState(false);
  const [context, setContext] = useState(null);
  const arrx = useRef([]);
  const arry = useRef([]);
  const arrz = useRef([]);
  useEffect(() => {
    startCanvas();
  }, []);
  useEffect(() => {
    if (context) {
      context.beginPath();
      context.setStrokeStyle("#000000");
      context.setLineWidth(4);
      context.setLineCap("round");
      context.setLineJoin("round");
    }
  }, [context]);
  const startCanvas = () => {
    //获取系统信息
    Taro.getSystemInfo({
      success: function(res) {
        setCanvasw(res.windowWidth - 0);
        setCanvash(res.windowHeight - 80);
        //创建canvas
        initCanvas();
      },
    });
  };
  const cleardraw = () => {
    //清除画布
    arrx.current = [];
    arry.current = [];
    arrz.current = [];
    context.clearRect(0, 0, canvasw, canvash);
    context.draw(true);
  };
  const initCanvas = () => {
    // 使用 Taro.createContext 获取绘图上下文 context
    setContext(Taro.createCanvasContext("canvas"));
  };
  const canvasStart = (event) => {
    setIsButtonDown(true);
    arrx.current.push(event.changedTouches[0].x);
    arry.current.push(event.changedTouches[0].y);
    arrz.current.push(0);
  };
  const canvasMove = (event) => {
    if (isButtonDown) {
      arrx.current.push(event.changedTouches[0].x);
      arry.current.push(event.changedTouches[0].y);
      arrz.current.push(1);
    }

    for (var i = 0; i < arrx.current.length; i++) {
      if (arrz[i] == 0) {
        context.moveTo(arrx.current[i], arry.current[i]);
      } else {
        context.lineTo(arrx.current[i], arry.current[i]);
      }
    }
    context.clearRect(0, 0, canvasw, canvash);

    context.setStrokeStyle("#000000");
    context.setLineWidth(4);
    context.setLineCap("round");
    context.setLineJoin("round");
    context.stroke();

    context.draw(false);
  };
  const canvasEnd = (event) => {
    setIsButtonDown(false);
  };
  return (
    <View class="container">
      <View>画布（请在下方区域手写内容）</View>
      <Canvas
        style={{ width: `${canvasw}px`, height: `${canvash}px` }}
        class="canvas"
        id="canvas"
        canvas-id="canvas"
        disable-scroll={true}
        onTouchStart={canvasStart}
        onTouchMove={canvasMove}
        onTouchEnd={canvasEnd}
        onTouchCancel={canvasEnd}
      ></Canvas>
      <View class="btns canvaspd">
        <Button onClick={cleardraw}>清除画板</Button>
      </View>
    </View>
  );
}
