(function() {
    'use strict';

    const Rudiger = {
        vpHeight: null,
        vpWidth: null,
        
        // begin!
        init() {
            // make sure we're scrolled to the top
            window.scrollTo({
                behavior: 'smooth',
                left: 0,
                top: 0
            });

            this.vpHeight = window.innerHeight;
            this.vpWidth = window.innerWidth;
            this.batsFlown = 0;
            this.flash = document.getElementById('flash');
            this.shadow = document.getElementById('shadow');

            setTimeout(() => {
                this.dracula = this.generateDracula();
                this.cave = document.getElementById('cave');
                this.caveDepth = this.calculateCaveDepth(this.vpHeight, this.dracula);
                this.bats = this.placeBats(this.cave, this.dracula, this.vpHeight, this.caveDepth);

                this.activate(this.bats, this.vpHeight);
            }, 1000);
        },

        randomInRange(min, max) {
            return Math.floor(Math.random() * (max - min) + min);
        },

        placeBats(cave, dracula, vpHeight, bodyHeight) {
            const bats = [];
            const numBats = dracula * 20;
            const minTop = vpHeight * .82;
            const maxTop = bodyHeight * .8;
            let batObj;
            let bat;
            let batBod;
            let sideOffset;
            let batImg;

            for (let i = numBats; i > 0; i--) {
                sideOffset = this.randomInRange(0, 30);
                batImg = this.randomInRange(1, 3);

                // create a bat somewhere on the page
                batObj = {
                    // return a random number between minTop and maxTop
                    xPos: this.randomInRange(minTop, maxTop),
                    side: (Math.random() > 0.5) ? 'left' : 'right',
                    id: `bat${i}`
                }

                bat = document.createElement('div');
                bat.classList.add('bat');

                bat.setAttribute('style', `top: ${batObj.xPos}px; ${batObj.side}:${sideOffset}px;`);
                bat.setAttribute('id', batObj.id);

                if (batObj.side === 'right') {
                    bat.classList.add('flipped');
                }

                batBod = document.createElement('div');
                batBod.classList.add('batBod', `batBod${batImg}`);

                bat.appendChild(batBod);

                batObj.dom = bat;

                cave.appendChild(bat);
                bats.push(batObj);
            }
        
            return bats;
        },

        monitorBats() {
            this.batsFlown++;

            const tier = this.bats.length/4;

            if (this.batsFlown === this.bats.length) {
                this.lightning();
                setTimeout(this.reveal, 300);
            } else if (this.batsFlown === tier * 3) {
                this.lightning();
            } else if (this.batsFlown === tier * 2) {
                this.lightning();
            } else if (this.batsFlown === tier) {
                this.lightning();
            }
        },

        lightning() {
            if (Math.random() > 0.5) {
                this.flash.animate([
                    {
                        opacity: 0.8
                    },
                    {
                        opacity: 0.2
                    },
                    {
                        opacity: 0.8
                    }
                ], { 
                    duration: 400,
                    easing: 'ease'
                });
            } else {
                this.flash.animate([
                    {
                        opacity: 0.8
                    },
                    {
                        opacity: 0.2
                    },
                    {
                        opacity: 0.6
                    },
                    {
                        opacity: 0.2
                    },
                    {
                        opacity: 0.8
                    }
                ], { 
                    duration: 700,
                    easing: 'ease'
                });
            }
        },

        reveal() {
            this.shadow.animate([
                {
                    opacity: 0.98
                },
                {
                    opacity: 0
                }
            ], {
                duration: 500,
                easing: 'ease',
                fill: 'forwards'
            });
        },

        activate(bats) {
            // HERE TODO NEXT
            const batViewportOffset = '0px 0px -10% 0px';

            const observerCallback = (changes, observer) => {
                changes.forEach((change) => {
                    if (change.intersectionRatio === 1) {
                        observer.unobserve(change.target);
                        this.flyAwayLittleGuy(change.target);
                        this.monitorBats();
                    }
                });
            }

            const observer = new IntersectionObserver(observerCallback, {
                rootMargin: batViewportOffset,
                threshold: 1.0
            });

            if (bats.length) {
                bats.forEach(function(target) {
                    observer.observe(document.getElementById(target.id));
                });
            }
        },

        flyAwayLittleGuy(bat) {
            const batBod = bat.querySelector('.batBod');

            let yTransform = this.randomInRange(this.vpHeight, this.vpHeight * 2);
            let xTransform = this.randomInRange((this.vpWidth / 2) * 0.95, (this.vpWidth / 2) * 1.05);

            if (bat.getAttribute('style').indexOf('right:') > -1) {
                xTransform *= -1;
            }

            const yDuration = this.randomInRange(2000, 7000);
            const xDuration = this.randomInRange(2000, 6000);

            bat.classList.add('flying');

            bat.animate([
                {
                    opacity: 1,
                    transform: 'translateX(0)'
                },
                {
                    opacity: 0,
                    transform: `translateX(${xTransform}px)` // make this value random
                }
            ], { 
                duration: xDuration,
                easing: 'cubic-bezier(0.3, 0.27, 0.07, 1.64)', // randomize this piece if we have time PROB NOT AM I RIGHT?
                fill: 'forwards'
            });

            batBod.animate([
                {
                    opacity: 1,
                    transform: 'translateY(0)'
                },
                {
                    offset: 0.95,
                    opacity: 1,
                },
                {
                    opacity: 0,
                    transform: `translateY(-${yTransform}px)`
                }
            ], {
                duration: yDuration,
                fill: 'forwards'
            });
        },

        calculateCaveDepth(vpHeight, depthFactor) {
            const depth = (vpHeight * (depthFactor + 1));
            
            // stretch the body out
            document.body.setAttribute('style', `height: ${depth}px`);
            
            return depth;
        },

        generateDracula() {
            let dracula;
            let v;

            // URL HAXXX
            var params = new URLSearchParams(window.location.search);

            if (params.has('v')) {
                v = parseInt(params.get('v'), 10);

                if (v > 0 && v <= 5) {
                    dracula = v;
                }
            }
            
            if (!dracula) {
                // give me a random number between 1 and 5
                dracula = Math.ceil(Math.random() * 5);
            }

            // set up the CSS
            document.body.classList.add(`vamp${dracula}`);

            return dracula;
        }
    };

    Rudiger.init();
})();