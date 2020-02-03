
        var app;
        var container;
        var proton;
        var renderer;
        var smokeEmitter;
        var coinEmitter;
        var glodFrame;
        var jumpOver = false;
        var postition = 0,
            pixie,
            background,
            background2,
            foreground,
            foreground2;

        main();

        function main() {
            initPIXI();
            loadAssets();
        }

        function initPIXI() {
            app = new PIXI.Application(1003, 580, { backgroundColor: 0x1099bb });
            container = document.getElementById('container');
            container.appendChild(app.view);

            app.stop();
        }

        function loadAssets() {
            PIXI.loader
                .add('pixie', 'assets/Pixie.json')
                .add('gold', 'image/gold_anim.json')
                .load(onAssetsLoaded);
        }

        function onAssetsLoaded(loader, res) {
            addBackground(loader, res);
            addPixie(loader, res);
            addGlodAnim(loader, res);

            addPixiEventListener();
            app.start();
            app.ticker.add(tick);

            addProton();
            addRain();
            addSmoke();
            addCoin();
        }

        function addPixiEventListener() {
            app.stage.interactive = true;
            app.stage.on('pointerdown', onTouchStart);
        }

        function onTouchStart() {
            if (jumpOver) return;

            pixie.state.setAnimation(0, 'jump', false);
            pixie.state.addAnimation(0, 'running', true, 0);

            smokeEmitter.p.x = pixie.x;
            coinEmitter.p.x = pixie.x + 20;

            smokeEmitter.emit('once');
            coinEmitter.emit(.5);

            TweenLite.to(pixie, .5, {
                y: 490,
                onComplete: function () {
                    TweenLite.to(pixie, .2, { y: 530 });
                }
            });

            setTimeout(function () { jumpOver = false }, 1000);
            jumpOver = true;
        }

        function addBackground(loader, res) {
            background = PIXI.Sprite.fromImage('assets/iP4_BGtile.jpg');
            background2 = PIXI.Sprite.fromImage('assets/iP4_BGtile.jpg');

            foreground = PIXI.Sprite.fromImage('assets/iP4_ground.png');
            foreground2 = PIXI.Sprite.fromImage('assets/iP4_ground.png');
            foreground.y = foreground2.y = 640 - foreground2.height;

            app.stage.addChild(background, background2, foreground, foreground2);
        }

        function addPixie(loader, res) {
            pixie = new PIXI.spine.Spine(res.pixie.spineData);
            pixie.x = 1024 / 3 + 100;
            pixie.y = 530;
            pixie.scale.x = pixie.scale.y = .22;

            app.stage.addChild(pixie);

            pixie.stateData.setMix('running', 'jump', 0.2);
            pixie.stateData.setMix('jump', 'running', 0.4);
            pixie.state.setAnimation(0, 'running', true);
        }

        function addGlodAnim() {
            var frames = [];
            for (var i = 1; i <= 6; i++) {
                frames.push(PIXI.Texture.fromFrame('gold_' + i + '.png'));
            }

            glodFrame = frames;
        }

        function addProton() {
            proton = new Proton;
            renderer = new Proton.PixiRenderer(app.stage);

            var create = renderer.pool.create;
            renderer.pool.create = function (body, particle) {
                if (body.name == 'COIN') {
                    var glodAnim = new PIXI.extras.AnimatedSprite(glodFrame);
                    glodAnim.anchor.set(0.5);
                    glodAnim.animationSpeed = 0.4;
                    glodAnim.play();
                    return glodAnim;
                } else {
                    return create.call(proton.pool, body, particle);
                }
            }

            proton.addRenderer(renderer);
        }

        function addCoin() {
            coinEmitter = new Proton.Emitter();
            coinEmitter.rate = new Proton.Rate(new Proton.Span(2, 3), .1);

            coinEmitter.addInitialize(new Proton.Body({ name: 'COIN' }));
            coinEmitter.addInitialize(new Proton.Mass(1));
            coinEmitter.addInitialize(new Proton.Life(1.3));
            coinEmitter.addInitialize(new Proton.Velocity(new Proton.Span(3, 5), new Proton.Span(0, 60, true), 'polar'));

            coinEmitter.addBehaviour(new Proton.Rotate(Proton.getSpan(0, 360), new Proton.Span([-1, -2, 0, 1, 2]), 'add'));
            //coinEmitter.addBehaviour(new Proton.Alpha(1, 0));
            coinEmitter.addBehaviour(new Proton.Gravity(6));
            coinEmitter.addBehaviour(new Proton.Scale(Proton.getSpan(.2, .5)));

            coinEmitter.p.y = 250;
            proton.addEmitter(coinEmitter);
        }

        function addRain() {
            var emitter = new Proton.Emitter();
            emitter.rate = new Proton.Rate(new Proton.Span(15, 22), new Proton.Span(.1, .3));

            emitter.addInitialize(new Proton.Body('./image/rain.png'));
            emitter.addInitialize(new Proton.Mass(1));
            emitter.addInitialize(new Proton.Life(1, 2));

            var y = 60;
            var d = 800;
            emitter.addInitialize(new Proton.Position(new Proton.LineZone(130, y, app.stage.width + d, y)));
            emitter.addInitialize(new Proton.Velocity(new Proton.Span(6, 12), -130, 'polar'));

            emitter.addBehaviour(new Proton.Alpha(Proton.getSpan(1, 0)));
            emitter.addBehaviour(new Proton.Rotate(130));
            emitter.addBehaviour(new Proton.Scale(Proton.getSpan(.2, .6)));

            y = app.stage.height - 100;
            emitter.addBehaviour(new Proton.CrossZone(new Proton.LineZone(-1000, y, app.stage.width + 1000, y, 'down'), 'dead'));

            emitter.emit();
            proton.addEmitter(emitter);

            emitter.preEmit(1.2);
        }

        function addSmoke() {
            smokeEmitter = new Proton.Emitter();
            smokeEmitter.rate = new Proton.Rate(new Proton.Span(6, 8), 1);

            smokeEmitter.addInitialize(new Proton.Body('./image/smoke.png'));
            smokeEmitter.addInitialize(new Proton.Mass(1));
            smokeEmitter.addInitialize(new Proton.Life(1));
            smokeEmitter.addInitialize(new Proton.Velocity(new Proton.Span(.8, 1.2), new Proton.Span(0, 110, true), 'polar'));

            smokeEmitter.addBehaviour(new Proton.Rotate(0, new Proton.Span([-1, -2, 0, 1, 2]), 'add'));
            smokeEmitter.addBehaviour(new Proton.Scale(Proton.getSpan(.1, .3), .7));
            smokeEmitter.addBehaviour(new Proton.Alpha(1, 0));

            smokeEmitter.p.y = pixie.y;
            proton.addEmitter(smokeEmitter);
        }

        function tick() {
            bgRun();
            proton.update();
            proton.stats.update(2, container);
        }

        function bgRun() {
            postition += 10;

            background.x = -(postition * 0.6);
            background.x %= 1286 * 2;
            if (background.x < 0) {
                background.x += 1286 * 2;
            }
            background.x -= 1286;

            background2.x = -(postition * 0.6) + 1286;
            background2.x %= 1286 * 2;
            if (background2.x < 0) {
                background2.x += 1286 * 2;
            }
            background2.x -= 1286;

            foreground.x = -postition;
            foreground.x %= 1286 * 2;
            if (foreground.x < 0) {
                foreground.x += 1286 * 2;
            }
            foreground.x -= 1286;

            foreground2.x = -postition + 1286;
            foreground2.x %= 1286 * 2;
            if (foreground2.x < 0) {
                foreground2.x += 1286 * 2;
            }

            foreground2.x -= 1286;
        }
    