import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

let languages = {};
let colors = {};
let paths = {};
let supportedLanguages = {};

$(function () {
	$("footer > p").text("Made by hvox on Jule 1, 2024.");
	$("#languages > li").on("click", clickLanguage);

	$("#new-language-select").on("keypress", function (e) {
		if (e.which == 13) {
			let chosen = this.value.toLowerCase();
			let value = null;
			let minDistance = 1e9;
			for (let language in supportedLanguages) {
				let distance = levenshtein(chosen, language.toLowerCase());
				if (language.toLowerCase().match(chosen) != null) {
					distance = Math.abs(language.length - chosen.length) / 10;
				}
				if (distance < minDistance) {
					minDistance = distance;
					value = language;
				}
			}
			addLanguage(value);
			this.value = "";
			$("#popup").hide();
			$("#back").remove();
		}
	});

	fetch("data/countries.json")
		.then((response) => response.json())
		.then((json) => initializeCountries(json));
});


function clickLanguage(event) {
	if (this.id == "addlang") {
		$("<div id=back></div>").appendTo($("body"));
		$("#popup").show();
		$("#new-language-select")[0].focus();
	} else {
		deleteLanguage(this.innerText);
	}
}


function initializeCountries(countries) {
	window.countries = countries;
	let canvas = d3.select("#langmap");


	for (let country in countries) {
		countries[country].languages.forEach((language, i) => {
			supportedLanguages[language] = i;
		});

		let data = countries[country].border.map(line => "M" + line).join(" ");

		let red = (deterministicRandom() % 128 + 128).toString(16).padStart(2, "0");
		let green = (deterministicRandom() % 128 + 128).toString(16).padStart(2, "0");
		let blue = (deterministicRandom() % 128 + 128).toString(16).padStart(2, "0");
		let color = `#${red}${green}${blue}`;

		let path = canvas
			.append("path")
			.attr("stroke-width", 1)
			.attr("stroke", "#fff")
			.attr("d", data)
			.attr("title", country);
		path.append("title")
			.text(country);

		colors[country] = color;
		paths[country] = path;
	}
	updateCountries();

	for (let language in supportedLanguages) {
		$("#language-list").append(`<option value="${language}">`)
	}
}


function deleteLanguage(language) {
	delete languages[language];
	$("#languages > li").each(function () {
		if (this.innerText == language) {
			$(this).remove();
		}
	});
	updateCountries();
}


function addLanguage(language) {
	languages[language] = languages.length;
	$(`<li>${language}</li>`)
		.on("click", clickLanguage)
		.appendTo($("#languages"));
	updateCountries();
}


function updateCountries() {
	let countries = window.countries;

	for (let country in countries) {
		let path = paths[country];
		let color = colors[country];

		let hasSpokenLanguage = false;
		countries[country].languages.forEach((language) => {
			if (language in languages) {
				hasSpokenLanguage = true;
			}
		});

		if (hasSpokenLanguage) {
			path.attr("fill", color);
		} else {
			path.attr("fill", "#000");
		}
	}
}


function deterministicRandom() {
	deterministicRandom.counter = (deterministicRandom.counter ?? 123) + 1;
	return hash(deterministicRandom.counter);
}

function hash(object) {
	let string = object + "hash";
	let hash = 0;

	for (let i = 0; i < string.length; i++) {
		hash = Math.imul(hash, 0xAEC2E3ED) + string.charCodeAt(i);
		hash &= hash; // Convert to 32bit integer
	}

	return Math.abs(hash) * 2 + (hash > 0 ? 1 : 0);
}


function levenshtein(str1, str2) {
	function min(distance0, distance1, distance2, bx, ay) {
		return distance0 < distance1 || distance2 < distance1
			? distance0 > distance2
				? distance2 + 1
				: distance0 + 1
			: bx === ay
				? distance1
				: distance1 + 1;
	}

	if (str1 === str2) {
		return 0;
	}

	if (str1.length > str2.length) {
		var tmp = str1;
		str1 = str2;
		str2 = tmp;
	}

	var la = str1.length;
	var lb = str2.length;

	while (la > 0 && (str1.charCodeAt(la - 1) === str2.charCodeAt(lb - 1))) {
		la--;
		lb--;
	}

	var offset = 0;

	while (offset < la && (str1.charCodeAt(offset) === str2.charCodeAt(offset))) {
		offset++;
	}

	la -= offset;
	lb -= offset;

	if (la === 0 || lb < 3) {
		return lb;
	}

	var x = 0;
	var y;
	var d0;
	var d1;
	var d2;
	var d3;
	var dd;
	var dy;
	var ay;
	var bx0;
	var bx1;
	var bx2;
	var bx3;

	var vector = [];

	for (y = 0; y < la; y++) {
		vector.push(y + 1);
		vector.push(str1.charCodeAt(offset + y));
	}

	var len = vector.length - 1;

	for (; x < lb - 3;) {
		bx0 = str2.charCodeAt(offset + (d0 = x));
		bx1 = str2.charCodeAt(offset + (d1 = x + 1));
		bx2 = str2.charCodeAt(offset + (d2 = x + 2));
		bx3 = str2.charCodeAt(offset + (d3 = x + 3));
		dd = (x += 4);
		for (y = 0; y < len; y += 2) {
			dy = vector[y];
			ay = vector[y + 1];
			d0 = min(dy, d0, d1, bx0, ay);
			d1 = min(d0, d1, d2, bx1, ay);
			d2 = min(d1, d2, d3, bx2, ay);
			dd = min(d2, d3, dd, bx3, ay);
			vector[y] = dd;
			d3 = d2;
			d2 = d1;
			d1 = d0;
			d0 = dy;
		}
	}

	for (; x < lb;) {
		bx0 = str2.charCodeAt(offset + (d0 = x));
		dd = ++x;
		for (y = 0; y < len; y += 2) {
			dy = vector[y];
			vector[y] = dd = min(dy, d0, dd, bx0, vector[y + 1]);
			d0 = dy;
		}
	}

	return dd;
}
