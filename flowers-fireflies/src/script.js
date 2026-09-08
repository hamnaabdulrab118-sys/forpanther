document.addEventListener("DOMContentLoaded", function () {
	const primes = [3, 5, 7, 11, 13, 17];

	const flowerStyles = {
		3: {
			colors: ["#ff7eb9", "#ff5c9f"],
			size: 24,
			petals: 5,
			type: "type1",
			center: { color: "#ffea00", size: 8 }
		},
		5: {
			colors: ["#7afcff", "#00d8ff"],
			size: 22,
			petals: 6,
			type: "type2",
			center: { color: "#ffcc00", size: 7 }
		},
		7: {
			colors: ["#feff9c", "#ffd800"],
			size: 28,
			petals: 8,
			type: "type1",
			center: { color: "#ff9900", size: 9 }
		},
		11: {
			colors: ["#ff9a3c", "#ff6e00"],
			size: 26,
			petals: 5,
			type: "type3",
			center: { color: "#5e2f00", size: 8 }
		},
		13: {
			colors: ["#ff65a3", "#ff006e"],
			size: 20,
			petals: 7,
			type: "type4",
			center: { color: "#ffe600", size: 6 }
		},
		17: {
			colors: ["#e2a9ff", "#c840ff"],
			size: 30,
			petals: 6,
			type: "type5",
			center: { color: "#ffdf00", size: 10 }
		}
	};

	const leafTypes = [
		{
			radius: "0 100% 50% 50%",
			gradient: "linear-gradient(135deg, #3a8029, #5cad4a)",
			veinCount: 3,
			veinAngle: -5
		},
		{
			radius: "0 70% 0 50%",
			gradient: "linear-gradient(135deg, #4a9e35, #65c143)",
			veinCount: 5,
			veinAngle: -15
		},
		{
			radius: "50% 100% 50% 30%",
			gradient: "linear-gradient(135deg, #2e5d20, #4a9e35)",
			veinCount: 4,
			veinAngle: 0
		},
		{
			radius: "10% 90% 20% 80%",
			gradient: "linear-gradient(135deg, #3a8029, #65c143)",
			veinCount: 6,
			veinAngle: -10
		},
		{
			radius: "50% 50% 0 50%",
			gradient: "linear-gradient(135deg, #3d8c29, #5cad4a)",
			veinCount: 4,
			veinAngle: -8
		}
	];

	function createNightSky() {
		const starsContainer = document.querySelector(".stars");
		const starCount = 200;

		for (let i = 0; i < starCount; i++) {
			const star = document.createElement("div");
			star.classList.add("star");

			const size = Math.random() * 2 + 1;
			star.style.width = `${size}px`;
			star.style.height = `${size}px`;

			const x = Math.random() * 100;
			const y = Math.random() * 100;
			star.style.left = `${x}%`;
			star.style.top = `${y}%`;

			const duration = 3 + Math.random() * 7;
			const delay = Math.random() * 5;
			const minOpacity = Math.random() * 0.3;
			const maxOpacity = minOpacity + 0.4;

			star.style.setProperty("--twinkle-duration", `${duration}s`);
			star.style.setProperty("--twinkle-delay", `${delay}s`);
			star.style.setProperty("--min-opacity", minOpacity);
			star.style.setProperty("--max-opacity", maxOpacity);

			starsContainer.appendChild(star);
		}
	}

	function createClouds() {
		const cloudsContainer = document.querySelector(".clouds");
		const cloudCount = 8;

		for (let i = 0; i < cloudCount; i++) {
			const cloud = document.createElement("div");
			cloud.classList.add("cloud");

			const width = 100 + Math.random() * 200;
			const height = 50 + Math.random() * 40;
			cloud.style.width = `${width}px`;
			cloud.style.height = `${height}px`;

			const x = Math.random() * 100;
			const y = Math.random() * 50;
			cloud.style.left = `${x}%`;
			cloud.style.top = `${y}%`;

			const opacity = 0.1 + Math.random() * 0.3;
			cloud.style.opacity = opacity;

			const driftDistance = 100 + Math.random() * 100;
			const driftDuration = 100 + Math.random() * 100;
			cloud.style.setProperty("--drift-distance", `${driftDistance}vw`);
			cloud.style.animation = `cloudDrift ${driftDuration}s linear infinite`;

			cloudsContainer.appendChild(cloud);
		}
	}

	function createGarden() {
		const flowerCount = 70;

		for (let i = 0; i < flowerCount; i++) {
			const depthRange = Math.random();

			if (depthRange < 0.3) {
				createFlower(i * 40, null, 0.8, 1.0, 10, 40);
			} else if (depthRange < 0.6) {
				createFlower(i * 40, null, 0.5, 0.7, 25, 45);
			} else if (depthRange < 0.85) {
				createFlower(i * 40, null, 0.3, 0.5, 35, 45);
			} else {
				createFlower(i * 40, null, 0.1, 0.3, 42, 46);
			}
		}

		primes.forEach((prime) => {
			const interval = prime * 3000;
			setTimeout(() => {
				setInterval(() => {
					const depthRand = Math.random();
					if (depthRand < 0.3) {
						createFlower(0, prime, 0.8, 1.0, 10, 40);
					} else if (depthRand < 0.6) {
						createFlower(0, prime, 0.5, 0.7, 25, 45);
					} else if (depthRand < 0.85) {
						createFlower(0, prime, 0.3, 0.5, 35, 45);
					} else {
						createFlower(0, prime, 0.1, 0.3, 42, 46);
					}
				}, interval);
			}, prime * 1000);
		});
	}

	function createFlower(
		delay,
		specificPrime,
		minDepth,
		maxDepth,
		minHeight,
		maxHeight
	) {
		const garden = document.querySelector(".garden");
		const flower = document.createElement("div");
		flower.classList.add("flower");

		const x = 5 + Math.random() * 90;
		const depthFactor = minDepth + Math.random() * (maxDepth - minDepth);

		const yPos = minHeight + Math.random() * (maxHeight - minHeight);

		flower.style.bottom = `${yPos}%`;
		flower.style.left = `${x}%`;

		const scale = 0.7 + depthFactor * 0.6;
		flower.style.setProperty("--scale", scale);
		flower.style.opacity = 0.9 + depthFactor * 0.1;
		flower.style.zIndex = Math.round(10 + depthFactor * 90);

		const prime =
			specificPrime || primes[Math.floor(Math.random() * primes.length)];
		const flowerStyle = flowerStyles[prime];

		const stemHeight = (30 + Math.random() * 50) * (0.8 + depthFactor * 0.4);

		const stem = document.createElement("div");
		stem.classList.add("stem");
		stem.style.height = "0px";
		stem.dataset.fullHeight = `${stemHeight}px`;

		// Add a darker gradient at the bottom of the stem for soil effect
		stem.style.background = `linear-gradient(to top, 
		rgba(30, 20, 10, 0.9) 0%, 
		#2e5d20 5%, 
		#5cad4a 50%, 
		#2e5d20 95%)`;

		const swayDuration = 8 + Math.random() * 5; // 8-13 seconds for a full sway cycle
		const swayDelay = Math.random() * 4; // More varied delays for natural effect

		// Add subtle bend to some stems
		if (Math.random() > 0.3) {
			// 70% of flowers get curved stems
			stem.classList.add("curved");

			// Increase rotations for more visible bend
			const bendAmount = Math.random() * 1.5 + 1.5; // 1.5-3.0 degree rotation

			stem.style.setProperty("--bend-rotation-neg", `-${bendAmount}deg`);
			stem.style.setProperty("--bend-rotation-pos", `${bendAmount}deg`);

			// Add a slight transform origin shift for more realism
			const originShift = Math.random() * 20 + 40; // 40-60% up the stem
			stem.style.transformOrigin = `center ${originShift}%`;

			// Connect the stem bend animation with the flower sway for natural movement
			// Make stem movement slightly slower than flower for organic feel
			const stemDuration = swayDuration * (1.2 + Math.random() * 0.3);
			stem.style.animation = `stemBend ${stemDuration}s ease-in-out infinite`;
			stem.style.animationDelay = `${swayDelay}s`;
		}

		const swayAmount = (Math.random() * 3 - 1.5) * depthFactor;
		flower.style.setProperty("--sway-amount", `${swayAmount}deg`);

		// Apply animation with the same duration/delay as the stem for coordination
		flower.style.animation = `sway ${swayDuration}s ease-in-out infinite`;
		flower.style.animationDelay = `${swayDelay}s`;

		const petalCount = flowerStyle.petals;
		const petalSize = flowerStyle.size / 2;
		const centerSize = flowerStyle.center.size;

		const center = document.createElement("div");
		center.classList.add("center");
		center.style.backgroundColor = flowerStyle.center.color;
		center.style.boxShadow = `0 0 8px ${flowerStyle.center.color}`;
		center.style.width = `${centerSize}px`;
		center.style.height = `${centerSize}px`;
		center.style.bottom = `0px`;
		center.style.left = `${-centerSize / 2}px`;

		for (let j = 0; j < petalCount; j++) {
			const petal = document.createElement("div");
			petal.classList.add("petal", flowerStyle.type);

			const hueShift = Math.floor(Math.random() * 10) - 5;
			const color1 = adjustColor(flowerStyle.colors[0], hueShift);
			const color2 = adjustColor(flowerStyle.colors[1], hueShift);

			const gradient = `linear-gradient(to bottom, ${color1}, ${color2})`;
			petal.style.background = gradient;

			const sizeVariation = 0.9 + Math.random() * 0.2;
			petal.style.width = `${petalSize * sizeVariation}px`;
			petal.style.height = `${petalSize * 1.2 * sizeVariation}px`;

			const angle = (360 / petalCount) * j + (Math.random() * 5 - 2.5);

			petal.style.bottom = `0px`;
			petal.style.left = `${(-petalSize / 2) * sizeVariation}px`;
			petal.style.transformOrigin = `center bottom`;
			petal.dataset.angle = angle;

			flower.appendChild(petal);
		}

		const leafCount = 2 + Math.floor(Math.random() * 2);
		const leafPositions = [];

		for (let j = 0; j < leafCount; j++) {
			const position = 0.1 + j * (0.8 / leafCount) + Math.random() * 0.05;
			leafPositions.push({
				position,
				side: j % 2 === 0 ? -1 : 1
			});
		}

		for (let j = 0; j < leafCount; j++) {
			const leaf = document.createElement("div");
			leaf.classList.add("leaf");

			const leafPos = leafPositions[j];
			const leafHeight = stemHeight * leafPos.position;
			const side = leafPos.side;

			const leafType = leafTypes[Math.floor(Math.random() * leafTypes.length)];

			const leafSize = 12 + Math.random() * 8;
			const leafWidth = leafSize * (0.8 + Math.random() * 0.4);
			leaf.style.width = `${leafWidth}px`;
			leaf.style.height = `${leafSize / 2}px`;
			leaf.style.bottom = `${leafHeight}px`;
			leaf.style.left = `0px`;

			const leafAngle = side * (25 + Math.random() * 20);
			leaf.style.setProperty("--leaf-angle", `${leafAngle}deg`);
			leaf.style.setProperty("--leaf-sway", `${Math.random() * 5 + 3}deg`);

			const leafShape = document.createElement("div");
			leafShape.classList.add("leaf-shape");
			leafShape.style.borderRadius = leafType.radius;
			leafShape.style.background = leafType.gradient;

			const leafStem = document.createElement("div");
			leafStem.classList.add("leaf-stem");
			leafStem.style.background = leafType.gradient
				.split(",")[0]
				.replace("linear-gradient(135deg", "")
				.trim();

			if (side > 0) {
				leaf.style.left = "0px";
				leafShape.style.transform = "scaleX(-1)";
				leafStem.style.left = "-4px";
			} else {
				leaf.style.left = "0px";
				leafStem.style.left = "-4px";
			}

			const mainVein = document.createElement("div");
			mainVein.classList.add("main-vein");
			mainVein.style.background = "rgba(25, 50, 15, 0.3)";
			mainVein.style.transform = `translateY(-50%) rotate(${leafType.veinAngle}deg)`;
			leafShape.appendChild(mainVein);

			for (let v = 1; v <= leafType.veinCount; v++) {
				const sideVein = document.createElement("div");
				sideVein.classList.add("side-vein");
				sideVein.style.background = "rgba(25, 50, 15, 0.2)";
				sideVein.style.top = `${(v * 100) / (leafType.veinCount + 1)}%`;
				const veinAngle = -20 + v * 5 + (Math.random() * 5 - 2.5);
				sideVein.style.transform = `translateY(-50%) rotate(${veinAngle}deg)`;
				sideVein.style.width = `${60 + Math.random() * 20}%`;
				leafShape.appendChild(sideVein);
			}

			leaf.appendChild(leafStem);
			leaf.appendChild(leafShape);
			stem.appendChild(leaf);
		}

		flower.appendChild(stem);
		flower.appendChild(center);
		garden.appendChild(flower);

		const isInitialLoad = delay < 500;
		const actualDelay = isInitialLoad ? 10 : delay;

		setTimeout(() => {
			stem.style.height = stem.dataset.fullHeight;

			const centerDelay = isInitialLoad ? 50 : 800;

			setTimeout(() => {
				center.style.bottom = stem.dataset.fullHeight;

				const petals = flower.querySelectorAll(".petal");
				petals.forEach((petal) => {
					petal.style.bottom = stem.dataset.fullHeight;

					const angle = parseFloat(petal.dataset.angle);
					const radians = (angle * Math.PI) / 180;

					const offsetX = Math.sin(radians) * (centerSize * 0.5);
					const offsetY = Math.cos(radians) * (centerSize * 0.5);

					petal.style.transform = `rotate(${angle}deg) translate(${offsetX}px, ${-offsetY}px) scale(0)`;
				});

				center.style.opacity = "1";
				center.style.transform = "scale(1)";

				const petalDelay = isInitialLoad ? 10 : 80;

				petals.forEach((petal, idx) => {
					setTimeout(() => {
						petal.style.opacity = "1";

						const angle = parseFloat(petal.dataset.angle);
						const radians = (angle * Math.PI) / 180;

						const offsetX = Math.sin(radians) * (centerSize * 0.5);
						const offsetY = Math.cos(radians) * (centerSize * 0.5);

						petal.style.transform = `rotate(${angle}deg) translate(${offsetX}px, ${-offsetY}px) scale(1)`;
					}, idx * petalDelay + (isInitialLoad ? 0 : Math.random() * 40));
				});

				const leaves = stem.querySelectorAll(".leaf");
				const leafDelay = isInitialLoad ? 10 : 100;

				leaves.forEach((leaf, idx) => {
					setTimeout(() => {
						leaf.style.opacity = "1";
						leaf.style.transform = `rotate(${leaf.style.getPropertyValue(
							"--leaf-angle"
						)})`;
						leaf.style.animation = `leafSway ${
							3 + Math.random() * 2
						}s ease-in-out infinite`;
					}, idx * leafDelay + (isInitialLoad ? 0 : Math.random() * 50));
				});
			}, centerDelay);
		}, actualDelay);

		const allFlowers = garden.querySelectorAll(".flower");
		if (allFlowers.length > 100) {
			const oldFlower = allFlowers[0];
			oldFlower.style.animation = "fadeOut 1.5s forwards";
			setTimeout(() => oldFlower.remove(), 1500);
		}
	}

	function adjustColor(hexColor, amount) {
		const r = parseInt(hexColor.slice(1, 3), 16);
		const g = parseInt(hexColor.slice(3, 5), 16);
		const b = parseInt(hexColor.slice(5, 7), 16);

		return `rgb(${clamp(
			r + amount * 3,
			0,
			255
		)}, ${clamp(g + amount * 3, 0, 255)}, ${clamp(b + amount * 3, 0, 255)})`;
	}

	function clamp(num, min, max) {
		return Math.min(Math.max(num, min), max);
	}

	function createFireflies() {
		const container = document.querySelector(".fireflies");
		const firefliesCount = 10;

		const ground = document.querySelector(".ground");
		const groundTop = window.innerHeight - ground.offsetHeight;

		for (let i = 0; i < firefliesCount; i++) {
			const firefly = document.createElement("div");
			firefly.classList.add("firefly");

			const x = Math.random() * 100;
			const maxY = (groundTop / window.innerHeight) * 100;
			const minY = 10;
			const y = minY + Math.random() * (maxY - minY - 15);

			for (let j = 1; j <= 9; j++) {
				const xVar = Math.random() * 6 - 3;
				const yVar = Math.random() * 5 - 4;
				firefly.style.setProperty(`--x${j}`, `${xVar}px`);
				firefly.style.setProperty(`--y${j}`, `${yVar}px`);
			}

			firefly.style.left = `${x}%`;
			firefly.style.top = `${y}%`;

			container.appendChild(firefly);

			setTimeout(() => {
				firefly.style.opacity = "1";

				const duration = 3 + Math.random() * 3;
				firefly.style.animation = `fireflyFloat ${duration}s ease-in-out infinite`;

				const prime = primes[Math.floor(Math.random() * primes.length)];
				setInterval(() => {
					if (firefly.style.opacity !== "0") {
						firefly.style.opacity = "0";

						setTimeout(() => {
							firefly.style.opacity = "1";

							if (Math.random() > 0.7) {
								setTimeout(() => {
									firefly.style.opacity = "0";
									setTimeout(() => {
										firefly.style.opacity = "1";
									}, 100);
								}, 200);
							}
						}, 100 + Math.random() * 200);
					}
				}, prime * 1000 + Math.random() * 3000);

				setInterval(() => {
					if (Math.random() > 0.7) {
						const moveRange = 15;
						const newX =
							parseFloat(firefly.style.left) +
							Math.random() * moveRange -
							moveRange / 2;
						const newY =
							parseFloat(firefly.style.top) +
							Math.random() * moveRange -
							moveRange / 2;

						const safeX = Math.min(Math.max(newX, 0), 100);
						const safeY = Math.min(Math.max(newY, minY), maxY - 15);

						firefly.style.transition = "left 2.5s ease-in-out, top 2.5s ease-in-out";
						firefly.style.left = `${safeX}%`;
						firefly.style.top = `${safeY}%`;

						setTimeout(() => {
							firefly.style.transition = "opacity 0.5s ease";
						}, 2500);
					}
				}, prime * 1000 + Math.random() * 5000);
			}, i * 200 + Math.random() * 1000);
		}
	}

	createNightSky();
	createClouds();
	createGarden();
	setTimeout(createFireflies, 500);
});
