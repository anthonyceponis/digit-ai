"use client";

import { useEffect, useRef, useState } from "react";
import { Layer, Line, Stage, Text } from "react-konva";
import { DigitPredictions } from "./digit-probabilities";
import { Button } from "@/components/ui/button";

export default function Page() {
    const [tool, setTool] = useState("pen");
    const [lines, setLines] = useState<any[]>([]);
    const isDrawing = useRef(false);
    const stageRef = useRef<any>(null);
    const mnistRef = useRef<any>(null);
    const probabilities_zero = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const [probabilities, setProbabilities] =
        useState<number[]>(probabilities_zero);

    useEffect(() => {
        if (!stageRef.current) return;
        const canvas = stageRef.current.getContent().firstElementChild;
        canvas.style.border = "solid 1px gray";
    }, [stageRef]);

    const handleMouseDown = (e: any) => {
        isDrawing.current = true;
        const pos = e.target.getStage().getPointerPosition();
        setLines([...lines, { tool, points: [pos.x, pos.y] }]);
    };

    const handleMouseMove = (e: any) => {
        // no drawing - skipping
        if (!isDrawing.current) {
            return;
        }
        const stage = e.target.getStage();
        const point = stage.getPointerPosition();
        let lastLine = lines[lines.length - 1];
        // add point
        lastLine.points = lastLine.points.concat([point.x, point.y]);

        // replace last
        lines.splice(lines.length - 1, 1, lastLine);
        setLines(lines.concat());
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const detect = () => {
        if (!stageRef.current) return;
        const uri = stageRef.current.toDataURL({ pixelRatio: 0.125 });
        const canvas = mnistRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.onload = () => {
            if (!ctx) return;
            // Draw the image on the off-screen canvas.
            ctx.drawImage(img, 0, 0);

            const width = 28;
            const height = 28;

            // Extract image data.
            let imageData = ctx.getImageData(0, 0, 28, 28);
            let data = imageData.data;

            // Find the bounding box of the digit.
            let minX = width,
                minY = height,
                maxX = 0,
                maxY = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const alpha = data[index];
                    if (alpha > 0) {
                        // Non-transparent pixel
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            // Calculate the dimensions of the bounding box.
            const digitWidth = maxX - minX;
            const digitHeight = maxY - minY;

            // Calculate offset to center the digit.
            const offsetX = width / 2 - digitWidth / 2;
            const offsetY = height / 2 - digitHeight / 2;

            // Get the image data of the digit inside the bounding box.
            const digitImageData = ctx.getImageData(
                minX,
                minY,
                digitWidth,
                digitHeight
            );

            ctx.clearRect(0, 0, width, height);

            // Redraw the digit at the center of the canvas.
            ctx.putImageData(digitImageData, offsetX, offsetY);

            imageData = ctx.getImageData(0, 0, width, height);
            data = imageData.data;

            // Convert to grayscale
            const grayscaleData = [];
            for (let i = 0; i < data.length; i += 4) {
                // Calculate grayscale value
                const r = data[i];
                grayscaleData.push(r);
            }

            const postData = {
                bitmap: grayscaleData,
            };

            fetch("http://localhost:5000/api/digit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postData),
            }).then(async (res: Response) => {
                if (!res.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await res.json();
                const parsed_data = [];
                for (let prob of data["result"])
                    parsed_data.push(parseFloat(prob));
                setProbabilities(parsed_data);
            });
        };
        img.src = uri;
    };

    const reset = () => {
        // Clear drawing canvas.
        stageRef.current.clear();

        // Clear mnist preview canvas.
        const canvas = mnistRef.current;
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Reset probabilties.
        setProbabilities(probabilities_zero);
        setLines([]);
    };

    return (
        <div className="bg-neutral-950 text-neutral-400 h-screen overflow-auto text-center font-mono">
            <div className="flex flex-col gap-3 items-center">
                <div className="py-7 w-full max-w-2xl mx-auto">
                    <h1 className="text-5xl font-semibold text-white mb-3">
                        Digit Recognition AI
                    </h1>
                    <p>
                        I implemented a simple neural network to identify
                        handwritten digits using the MNIST dataset. All
                        necessary algorithms, like stochastic gradient decent
                        and back propagation, were implemented with just python
                        and numpy.
                    </p>
                </div>
                <div className="flex flex-col gap-3 items-center">
                    <div>
                        <div className="text-white text-lg font-semibold">
                            Guess:{" "}
                            {probabilities.length === 0
                                ? null
                                : probabilities.reduce(
                                      (iMax, x, i, arr) =>
                                          x > arr[iMax] ? i : iMax,
                                      0
                                  )}
                        </div>
                        <div className="text-xs">Tip: Draw nice and big.</div>
                    </div>
                    <Stage
                        width={224}
                        height={224}
                        onMouseDown={handleMouseDown}
                        onMousemove={handleMouseMove}
                        onMouseup={handleMouseUp}
                        ref={stageRef}
                    >
                        <Layer>
                            {lines.map((line, i) => (
                                <Line
                                    key={i}
                                    points={line.points}
                                    stroke="#ff0000"
                                    strokeWidth={15}
                                    tension={0.5}
                                    lineCap="round"
                                    lineJoin="round"
                                    globalCompositeOperation={
                                        line.tool === "eraser"
                                            ? "destination-out"
                                            : "source-over"
                                    }
                                />
                            ))}
                        </Layer>
                    </Stage>
                    <div className="flex gap-3">
                        <Button onClick={detect} variant={"secondary"}>
                            Predict
                        </Button>
                        <Button onClick={reset} variant={"destructive"}>
                            Clear
                        </Button>
                    </div>
                    <div className="flex gap-3 justify-center items-center">
                        <div>MNIST formatted digit:</div>
                        <canvas
                            width={28}
                            height={28}
                            id="centered"
                            ref={mnistRef}
                            className="border"
                        />
                    </div>
                </div>
                <div>
                    <DigitPredictions probabilities={probabilities} />
                </div>
            </div>
        </div>
    );
}
