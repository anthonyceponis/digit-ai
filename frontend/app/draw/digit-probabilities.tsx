"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
    probability: {
        label: "probability",
    },
} satisfies ChartConfig;

export function DigitPredictions({
    probabilities,
}: {
    probabilities: number[];
}) {
    return (
        <Card className="w-screen max-w-3xl bg-neutral-950 text-neutral-400">
            <CardHeader>
                <CardTitle>Digit Probabilities</CardTitle>
                <CardDescription>
                    A summary of what the ai thinks your digit is.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={probabilities.map((prob, i) => {
                            return { digit: i, probability: prob };
                        })}
                        layout="vertical"
                        margin={{
                            left: -20,
                        }}
                    >
                        <XAxis type="number" dataKey="probability" hide />
                        <YAxis
                            dataKey="digit"
                            type="category"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="probability" fill="#2662D9" radius={5} />
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
