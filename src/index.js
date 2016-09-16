import React from 'react'

const TIME_CONSTANT = 325

class Scrolling extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            pressed: false,
            reference: null,
            offset: 0,
            min: 0,
            max: 0,
        }
        this.prev = this.prev.bind(this)
        this.next = this.next.bind(this)
    }

    componentDidMount() {
        this.setMaxTransform()
    }

    setMaxTransform() {
        const measurement = this.props.horizontal ? 'width' : 'height'

        this.setState({
            max: this.refs.view.getBoundingClientRect()[measurement] -
                 this.refs.base.getBoundingClientRect()[measurement],
        })
    }

    pos(e) {
        // touch event
        const clientPos = this.props.horizontal ? 'clientX' : 'clientY'
        if (e.targetTouches && (e.targetTouches.length >= 1)) {
            return e.targetTouches[0][clientPos]
        }

        // mouse event
        return e[clientPos]
    }

    scrollToItem(idx) {
        this.scroll(idx * this.props.snap)
    }

    scroll(x) {
        const { min, max } = this.state

        let offset = (x > max) ? max : null
        if (!offset) {
            offset = (x < min) ? min : x
        }

        this.refs.view.style.transform = this.props.horizontal ?
                                         `translateX(${-offset}px)` :
                                         `translateY(${-offset}px)`

        this.setState({ offset })
    }

    track() {
        const now = Date.now()
        const elapsed = now - this.state.timestamp
        this.setState({
            timestamp: now,
        })
        const delta = this.state.offset - this.state.frame
        const v = 1000 * delta / (1 + elapsed)

        this.setState({
            frame: this.state.offset,
            velocity: 0.8 * v + 0.2 * this.state.velocity,
        })
    }

    autoScroll() {
        let elapsed
        let delta

        if (this.state.amplitude) {
            elapsed = Date.now() - this.state.timestamp
            delta = -this.state.amplitude * Math.exp(-elapsed / TIME_CONSTANT)

            if (delta > 5 || delta < -5) {
                this.scroll(this.state.target + delta)
                const boundAutoscroll = this.autoScroll.bind(this)
                requestAnimationFrame(boundAutoscroll)
            } else {
                this.scroll(this.state.target)
            }
        }
    }

    tap(e) {
        this.setState({
            pressed: true,
            reference: this.pos(e),
            velocity: 0,
            amplitude: 0,
            timestamp: Date.now(),
            frame: this.state.offset,
        })

        clearInterval(this.ticker)
        const boundTrack = this.track.bind(this)
        this.ticker = setInterval(boundTrack, 100)

        e.preventDefault()
        e.stopPropagation()
        return false
    }

    drag(e) {
        let x
        let delta

        if (this.state.pressed) {
            x = this.pos(e)
            delta = this.state.reference - x

            if (delta > 2 || delta < -2) {
                this.setState({
                    reference: x,
                })
                this.scroll(this.state.offset + delta)
            }
        }

        e.preventDefault()
        e.stopPropagation()
        return false
    }

    release(e) {
        this.setState({
            pressed: false,
        })

        clearInterval(this.ticker)
        if (this.state.velocity > 10 || this.state.velocity < -10) {
            const amplitude = 0.8 * this.state.velocity
            const target = Math.round(this.state.offset + amplitude)

            this.setState({
                target,
                amplitude,
                timestamp: Date.now(),
            })

            const boundAutoscroll = this.autoScroll.bind(this)
            requestAnimationFrame(boundAutoscroll)
        }

        e.preventDefault()
        e.stopPropagation()
        return false
    }

    releaseSnap(e) {
        this.setState({
            pressed: false,
        })

        clearInterval(this.ticker)
        let amplitude
        let target = this.state.offset

        if (this.state.velocity > 10 || this.state.velocity < -10) {
            amplitude = 0.8 * this.state.velocity
            target = Math.round(this.state.offset + amplitude)
        }

        target = Math.round(target / this.props.snap) * this.props.snap
        amplitude = target - this.state.offset

        this.setState({
            target,
            amplitude,
            timestamp: Date.now(),
        })

        const boundAutoscroll = this.autoScroll.bind(this)
        requestAnimationFrame(boundAutoscroll)

        e.preventDefault()
        e.stopPropagation()
        return false
    }

    render() {
        const tapHandler = this.tap.bind(this)
        const moveHandler = this.drag.bind(this)
        const releaseHandler = this.props.snap ?
                               this.releaseSnap.bind(this) :
                               this.release.bind(this)

        const baseStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
        }

        let viewStyle = {
            position: 'absolute',
            top: 0,
            left: 0,
        }

        if (this.props.horizontal) {
            viewStyle = {
                ...viewStyle,
                whiteSpace: 'nowrap',
            }
        }

        return (
            <div style={baseStyle} className={this.props.className} ref="base">
                <div
                  style={viewStyle}
                  ref="view"
                  onMouseDown={tapHandler}
                  onMouseMove={moveHandler}
                  onMouseUp={releaseHandler}
                >
                    {this.props.children}
                </div>
            </div>
        )
    }
}

Scrolling.propTypes = {
    children: React.PropTypes.oneOfType([
        React.PropTypes.array,
        React.PropTypes.string,
    ]).isRequired,
    className: React.PropTypes.string,
    horizontal: React.PropTypes.bool,
    snap: React.PropTypes.number,
}

export default Scrolling
