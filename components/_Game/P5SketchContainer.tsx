"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import p5Types from "p5";
type Props = {
  // gameState: Game;
  // dispatch: any;
  userId: string;
  gameSketch: P5jsSketch;
};

type P5jsContainerRef = HTMLDivElement;
type P5jsSketch = (
  p: p5Types,
  parentRef: P5jsContainerRef,
  // gameState: Game,
  // dispatch: any,
  userId: string
) => void;

const P5SketchContainer = memo(function P5SketchContainer({
  // gameState,
  // dispatch,
  userId,
  gameSketch,
}: Props) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  
  // on mount
  useEffect(() => {
    setIsMounted(true);
  }, []);
  useEffect(() => {
    if (!isMounted) return;
    let p5instance: p5Types | null = null;

    const initP5 = async () => {
      try {
        // import the p5 and p5-sounds client-side
        const p5 = (await import("p5")).default;
        new p5((p) => {
          if (parentRef.current) {
            gameSketch(p, parentRef.current, userId);
            p5instance = p;
          }
        });
      } catch (error) {
        console.log(error);
      }
    };
    initP5();
    return (p5instance as p5Types | null)?.remove();
  }, [isMounted, gameSketch, userId]);
  return <div className=" h-full w-full" ref={parentRef}></div>;
});

export default P5SketchContainer;
