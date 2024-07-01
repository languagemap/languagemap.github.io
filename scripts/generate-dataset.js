import { readFile, writeFile } from "fs/promises";
import {
	countries, // truncated list
	countriesExpanded, // full list
} from "@locale-tools/countries";
import { forCountry } from "world-geojson";
console.log(forCountry);
if (true) {
	throw 123;
}

const PRECISION = 0;

let geojson = JSON.parse(
	await readFile(
		new URL("../data/geojson.json", import.meta.url),
	),
)["features"];

let geometry = {};
for (let country of geojson) {
	let name = country["properties"]["name"];
	let border = country["geometry"]["coordinates"];
	geometry[name] = country["geometry"]["type"] === "Polygon"
		? border
		: border.map((line) => line[0]);
}
geometry = Object.fromEntries(Object.entries(geometry).sort());
let min_x = Math.min(
	...Object.values(geometry).flat().flat().map(([x, _]) => x),
);
let max_x = Math.max(
	...Object.values(geometry).flat().flat().map(([x, _]) => x),
);
let min_y = Math.min(
	...Object.values(geometry).flat().flat().map(([_, y]) => y),
);
let max_y = Math.max(
	...Object.values(geometry).flat().flat().map(([_, y]) => y),
);

geometry = Object.fromEntries(
	Object.entries(geometry).map((
		[country, border],
	) => [
			country,
			{ "languages": [], "border": border.map((line) => line.flatMap((point) => normalize(point))) },
		]),
);

let languages = {};
countriesExpanded.default.forEach((country, i) => {
	let name = country.name.common;
	let countryLanguages = country.languages.official.map((lang) => lang.name.common);
	if (name in geometry) {
		console.log(name, ":", countryLanguages.join(", "));
		geometry[name].languages = countryLanguages;
		for (let language of countryLanguages) {
			languages[language] = i;
		}
	} else {
		name = country.name.official;
		if (name in geometry) {
			console.log(name, ":", countryLanguages.join(", "));
			geometry[name].languages = countryLanguages;
			for (let language of countryLanguages) {
				languages[language] = i;
			}
		}
	}
});

writeFile(
	new URL("../data/countries.json", import.meta.url),
	JSON.stringify(geometry).replace(new RegExp("},", "g"), "},\n")
);

languages = Object.keys(languages);
languages.sort();
writeFile(
	new URL("../data/languages.json", import.meta.url),
	JSON.stringify(languages)
);

console.log("Number of supported languages:", languages.length);

function normalize(point) {
	let [x, y] = point;
	x = (x - min_x) / (max_x - min_x);
	y = 1 - (y - min_y) / (max_y - min_y);
	return [+(2560 * x).toFixed(PRECISION), +(1080 * y).toFixed(PRECISION)];
}
