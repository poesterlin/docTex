import { addDays, differenceInDays, format } from 'date-fns';

export function toSVG(wordHistory: { count: number; date: Date }[]) {
	if (wordHistory?.length < 2) {
		return '';
	}

	// overwrites the last point if it's higher and on the same day
	wordHistory = wordHistory.reduce(
		(acc, current, i) => {
			const last = acc.at(-1);
			if (!last) {
				acc.push(current);
				return acc;
			}

			const isSameDay = differenceInDays(last.date, current.date) === 0;
			const isSameValue = last.count === current.count;
			if (isSameDay || isSameValue) {
				return acc;
			}

			acc.push(current);
			return acc;
		},
		[] as { count: number; date: Date }[]
	);

	// if there's only one point, skip the SVG generation
	if (wordHistory.length < 2) {
		return '';
	}

	const width = 200;
	const height = 100;
	const header = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width + 2} ${height + 2}">`;
	const footer = `</svg>`;


	const countOnly = wordHistory.map((x) => x.count);
	const max = Math.max(...countOnly) + 1;
	const start = wordHistory[0].date;
	const times = wordHistory.map((x) => Math.floor(differenceInDays(x.date, start)));
	const maxTime = Math.max(...times);

	let coords: [number, number][] = [];
	for (let i = 0; i < wordHistory.length; i++) {
		const x = map(times[i], 0, maxTime, 1, width);
		const y = map(countOnly[i], 0, max, height, 1);

		coords.push([x, y]);
	}

	let command: Command = lineCommand;
	if (coords.length > 1) {
		command = bezierCommand;
	}

	const pathString = svgPath(coords, command);

	// Calculate the increase in word count for each day
	const increases = wordHistory.map((entry, i) => {
		if (i === 0) return { ...entry, increase: 0 };
		return { ...entry, increase: entry.count - wordHistory[i - 1].count };
	});

	// Sort the days by the increase in word count
	const topIncreases = increases.sort((a, b) => b.increase - a.increase).slice(0, 5); // Select the top 5 days with the most increase
	
	let tags = '';
	for (let i = 0; i < topIncreases.length; i++) {
		const day = addDays(start, times[i]);
		const formatted = format(day, 'dd. MM.');

		const x = map(times[i], 0, maxTime, 1, width);
		const y = map(countOnly[i], 0, max, height, 1);

		const isLast = i === topIncreases.length - 1;
		const isFirst = i === 0;

		let anchor = 'middle';
		if (isLast) {
			anchor = 'end';
		} else if (isFirst) {
			anchor = 'start';
		}

		tags += `<text x="${x}" y="${y}" font-size="5" text-anchor="${anchor}" fill="white">${formatted}</text>`;
	}

	return header + pathString + tags + footer;
}

function map(x: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// https://francoisromain.medium.com/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74

type Point = [number, number];
type Command = (point: Point, i: number, a: Point[]) => string;

function svgPath(points: Point[], command: Command) {
	// build the d attributes by looping over the points
	const d = points.reduce(
		(acc, point, i, a) =>
			i === 0
				? // if first point
					`M ${point[0]},${point[1]}`
				: // else
					`${acc} ${command(point, i, a)}`,
		''
	);
	return `<path d="${d}" fill="none" stroke="#2175F2" />`;
}

function bezierCommand(point: Point, i: number, a: Point[]) {
	// start control point
	const [cpsX, cpsY] = controlPoint(a[i - 1], a[i - 2], point);
	// end control point
	const [cpeX, cpeY] = controlPoint(point, a[i - 1], a[i + 1], true);
	return `C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
}

function lineCommand(point: Point) {
	return `L ${point[0]} ${point[1]}`;
}

function line(pointA: Point, pointB: Point) {
	const lengthX = pointB[0] - pointA[0];
	const lengthY = pointB[1] - pointA[1];
	return {
		length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
		angle: Math.atan2(lengthY, lengthX)
	};
}

function controlPoint(current: Point, previous: Point, next: Point, reverse = false) {
	// When 'current' is the first or last point of the array
	// 'previous' or 'next' don't exist.
	// Replace with 'current'
	const p = previous || current;
	const n = next || current;

	// The smoothing ratio, anything between 0 and 0.22, the higher the more smoothing
	const smoothing = 0.15;

	// Properties of the opposed-line
	const opposed = line(p, n);
	// If is end-control-point, add PI to the angle to go backward
	const angle = opposed.angle + (reverse ? Math.PI : 0);
	const length = opposed.length * smoothing;
	// The control point position is relative to the current point
	const x = current[0] + Math.cos(angle) * length;
	const y = current[1] + Math.sin(angle) * length;
	return [x, y];
}
