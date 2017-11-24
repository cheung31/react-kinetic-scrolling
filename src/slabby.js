import React from 'react';

class Slabby extends React.Component {
    constructor(props) {
        super(props);

        let count, images, dim, offset, center, angle, dist, shift,
            pressed, reference, amplitude, target, velocity, timeConstant,
            xform, frame, timestamp, ticker;

        xform = 'transform';
        ['webkit', 'Moz', 'O', 'ms'].every(function (prefix) {
            var e = prefix + 'Transform';
            if (typeof document.body.style[e] !== 'undefined') {
                xform = e;
                return false;
            }
            return true;
        });

        this.state = {
            count: 9,
            images: [],
            dim: 200,
            offset: 0,
            center,
            angle: -60,
            dist: -150,
            shift: 10,
            pressed: false,
            reference,
            amplitude,
            target: 0,
            velocity,
            timeConstant: 250, // ms
            xform,
            frame,
            timestamp,
            ticker,
        };
    }

    // Event Handlers
    xpos(e) {
        // touch event
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0].clientX;
        }

        // mouse event
        return e.clientX;
    }

    track() {
        let now, elapsed, delta, v;

        now = Date.now();
        elapsed = now - this.timestamp;
        this.setState({ timestamp: now });
        delta = this.offset - this.frame;
        this.setState({ frame: this.offset });

        v = 1000 * delta / (1 + elapsed);
        this.setState({ velocity: 0.8 * v + 0.2 * this.velocity });
    }

    onTap(e) {
        this.setState({
            pressed: true,
            reference: this.xpos(e),
            velocity: 0,
            amplitude: 0,
            frame: this.offset,
            timestamp: Date.now(),
        });

        clearInterval(this.ticker);
        this.setState({
            ticket: setInterval(this.track.bind(this), 100),
        });

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    onDrag(e) {
        let x;
        let delta;
        if (this.pressed) {
            x = this.xpos(e);
            delta = this.reference - x;
            if (delta > 2 || delta < -2) {
                this.setState({ reference: x });
                this.scroll(this.offset + delta);
            }
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    onRelease(e) {
        this.setState({
            pressed: false,
            target: this.offset,
        });

        clearInterval(this.ticker);
        if (this.velocity > 10 || this.velocity < -10) {
            let amplitude = 0.9 * this.velocity;
            let target = this.offset + amplitude;
            target = Math.round(target / this.dim) * this.dim;
            amplitude = target - this.offset;

            this.setState({
                amplitude,
                target,
                timestamp: Date.now(),
            });
        }

        requestAnimationFrame(this.autoScroll.bind(this));

        e.preventDefault();
        e.stopPropagation();
        return false;
    }

    onKeyDown(e) {
        if (!this.pressed && (this.target === this.offset)) {
            // Space or PageDown or RightArrow or DownArrow
            if ([32, 34, 39, 40].indexOf(e.which) >= 0) {
                this.setState({ target: this.offset + this.dim });
            }
            // PageUp or LeftArrow or UpArrow
            if ([33, 37, 38].indexOf(e.which) >= 0) {
                this.setState({ target: this.offset - this.dim });
            }
            if (offset !== target) {
                this.setState({
                    amplitude: this.target - this.offset,
                    timestamp: Date.now(),
                });
                requestAnimationFrame(this.autoScroll.bind(this));
                return true;
            }
        }
    }

    wrap(x) {
        return (x >= this.count) ? (x % this.count) : (x < 0) ? this.wrap(this.count + (x % this.count)) : x;
    }

    autoScroll() {
        let elapsed, delta;

        if (this.amplitude) {
            elapsed = Date.now() - this.timestamp;
            delta = this.amplitude * Math.exp(-elapsed / this.timeConstant);
            if (delta > 4 || delta < -4) {
                this.scroll(this.target - delta);
                requestAnimationFrame(this.autoScroll.bind(this));
            } else {
                this.scroll(target);
            }
        }
    }

    scroll(x) {
        let i, half, delta, dir, tween, el, alignment;

        this.setState({
            offset: (typeof x === 'number') ? x : this.offset,
            center: Math.floor((this.offset + this.dim / 2) / this.dim),
        });

        delta = this.offset - this.center * this.dim;
        dir = (delta < 0) ? 1 : -1;
        tween = -dir * delta * 2 / this.dim;

        alignment = 'translateX(' + (innerWidth - this.dim) / 2 + 'px) ';
        alignment += 'translateY(' + (innerHeight - this.dim) / 2 + 'px)';

        // center
        el = this.refs[`image-${this.wrap(this.center)}`];
        el.style[this.xform] = alignment +
            ' translateX(' + (-delta / 2) + 'px)' +
            ' translateX(' + (dir * this.shift * tween) + 'px)' +
            ' translateZ(' + (this.dist * tween) + 'px)' +
            ' rotateY(' + (dir * this.angle * tween) + 'deg)';
        el.style.zIndex = 0;
        el.style.opacity = 1;

        half = this.count >> 1;
        for (i = 1; i <= half; ++i) {
            // right side
            el = this.refs[`image-${this.wrap(this.center + i)}`];
            el.style[this.xform] = alignment +
                ' translateX(' + (this.shift + (this.dim * i - delta) / 2) + 'px)' +
                ' translateZ(' + this.dist + 'px)' +
                ' rotateY(' + this.angle + 'deg)';
            el.style.zIndex = -i;
            el.style.opacity = (i === half && delta < 0) ? 1 - tween : 1;

            // left side
            el = this.refs[`image-${this.wrap(this.center - i)}`];
            el.style[this.xform] = alignment +
                ' translateX(' + (-this.shift + (-this.dim * i - delta) / 2) + 'px)' +
                ' translateZ(' + this.dist + 'px)' +
                ' rotateY(' + -this.angle + 'deg)';
            el.style.zIndex = -i;
            el.style.opacity = (i === half && delta > 0) ? 1 - tween : 1;
        }

        // center
        el = this.refs[`image-${this.wrap(this.center)}`];
        el.style[this.xform] = alignment +
            ' translateX(' + (-delta / 2) + 'px)' +
            ' translateX(' + (dir * this.shift * tween) + 'px)' +
            ' translateZ(' + (this.dist * tween) + 'px)' +
            ' rotateY(' + (dir * this.angle * tween) + 'deg)';
        el.style.zIndex = 0;
        el.style.opacity = 1;
    }

    setupEvents() {
        console.log(this.refs);
        const view = this.refs.content;
        const onTap = this.onTap.bind(this);
        const onDrag = this.onDrag.bind(this);
        const onRelease = this.onRelease.bind(this);
        const onKeyDown = this.onKeyDown.bind(this);

        if (typeof window.ontouchstart !== 'undefined') {
            view.addEventListener('touchstart', onTap);
            view.addEventListener('touchmove', onDrag);
            view.addEventListener('touchend', onRelease);
        }
        view.addEventListener('mousedown', onTap);
        view.addEventListener('mousemove', onDrag);
        view.addEventListener('mouseup', onRelease);
        document.addEventListener('keydown', onKeyDown);
    }

    componentDidMount() {
        console.log('component did mount');
        this.setupEvents();
    }

    render() {
        const {
            images,
            style,
        } = this.props;

        return (
            <div style={style}>
                <div className="pure-g cover" ref="content">
                    {this.props.children}
                </div>
                <div ref="stash"></div>
            </div>
        );
    }
}

export default Slabby;

