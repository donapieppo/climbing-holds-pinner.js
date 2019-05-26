const  colors = { 
  start: 'rgba(219, 10, 91, 0.8)',
  top: 'rgba(123, 1, 123, 0.8)',
  hold: 'rgba(245, 229, 27, 0.8)',
  blurr_background: 'rgba(200, 200, 200, 0.30)' 
} 
const defaults = {
  width: 1024,
  height: 1024,
  target: 'CanvasDiv', 
  editable: false, 
  size_ratio: 70, // (this.width + this.height) / this.size_ratio
}

class HoldLabel {
  constructor (x, y, type, size, editable) {
    this.x = x
    this.y = y
    this.type = type
    this.size = size

    this.shape = new Konva.Label({
      x: this.x - 150,
      y: this.y - 15,
      opacity: 0.85,
      draggable: editable
    })

    this.shape.add(
      new Konva.Tag({
        fill: 'rgba(123, 1, 123, 1)',
        cornerRadius: 5
      })
    )

    this.shape.add(
      new Konva.Text({
        text: this.type,
        fontFamily: 'Calibri',
        fontSize: 38,
        padding: 15,
        fill: 'white',
        align: 'right'
      })
    )

    this.shape.on('dragend', () => {
      if (this.shape.x() < 10) {
        this.x = 0
        this.y = 0
      } else {
        this.x = this.shape.x()
        this.y = this.shape.y()
      }
    })
  }
}

class Hold {
  constructor(x, y, type, size, editable) {
    this.x = x
    this.y = y
    this.type = type
    this.size = size

    const common = {
      x: this.x,
      y: this.y,
      strokeWidth: size / 5,
      stroke: this.color(),
      draggable: editable,
      fill: colors.blurr_background
    }

    if (type === 'start') {
      this.shape = new Konva.Star({
        ...common, ...{ numPoints: 3, innerRadius: size - size/2, outerRadius: size },
      })
    } else if (type === 'hold') {
      this.shape = new Konva.Circle({
        ...common, ...{ radius: size },
      })
    } else if (type === 'top') {
      this.shape = new Konva.Star({
        ...common, ...{ numPoints: 5, innerRadius: size - size/2, outerRadius: size },
      })
    }

    this.shape.on('dragend', () => {
      if (this.shape.x() < 10) {
        this.x = 0
        this.y = 0
      } else {
        this.x = this.shape.x()
        this.y = this.shape.y()
      }
    })
  }

  color() {
    return colors[this.type]
  }
}

export default class HoldsPinner {
  constructor(options) {
    let o = Object.assign({}, defaults, options)
    this.target = o.target
    this.width  = o.width
    this.height = o.height
    this.editable = o.editable
    this.size_ratio = o.size_ratio

    this.actual_hold_type = 'start'

    this.pins = []

    this.valid = false

    this.stage = new Konva.Stage({
      container: this.target,
      width: this.width,
      height: this.height
    })

    this.layer = new Konva.Layer()
    this.stage.add(this.layer)

    this.stage.on('click', (e) => {
      this.add_hold_event(e)
    })
  }

  setup(holdsData) {
    holdsData.forEach(hold => {
      if (hold.c === 'Hold') {
        this.add_hold(hold.x, hold.y, hold.type, hold.size)
      }
    })
  }

  hold_size() {
    return ((this.width + this.height) / this.size_ratio)
  }

  add_hold_event(e) {
    console.log(e)
    console.log(`adding hold from event e.x, e.y:${e.evt.layerX}:${e.evt.layerY}`)

    const x = e.evt.layerX
    const y = e.evt.layerY

    const hold = this.add_hold(x, y, this.actual_hold_type, this.hold_size())

    console.log(this.pins)
  }

  add_hold(x, y, hold_type, size) {
    const hold = new Hold(x, y, hold_type, size, this.editable)
    console.log(`new hold: hold.x=${hold.x} hold.y=${hold.y} hold.type=${hold.type} size=${hold.size}`)
    this.pins.push(hold)

    this.layer.add(hold.shape).draw()

    if (hold.type === 'top') {
      const hold_label = new HoldLabel(x, y, hold_type, size, this.editable)
      this.pins.push(hold_label)

      this.layer.add(hold_label.shape).draw()
    }
    return hold
  }

  get_hold_type() {
    return this.actual_hold_type
  }

  change_hold_type(th) {
    this.actual_hold_type = th
  }

  increase_size() {
    this.size_ratio = this.size_ratio * 0.75
    console.log(`size_ratio: ${this.size_ratio}`)
    // this.pins.forEach( r => { r.shape.scale({
    //     x: 0.75,
    //     y: 0.75
    // })})
    // this.layer.draw()
  }

  decrease_size() {
    this.size_ratio = this.size_ratio * 1.25
    console.log(`size_ratio: ${this.size_ratio}`)
    // this.pins.forEach( r => r.shape.scale({
    //     x: 1.25,
    //     y: 1.25
    // }))
    // this.layer.draw()
  }

  get_holds() {
    console.log('in get_holds()')
    console.log(this.pins)
    return this.pins.filter(h => h.x !== 0).map(h => ({
      c: h.constructor.name, 
      x: h.x, 
      y: h.y, 
      type: h.type, 
      size: h.size
    }))
  }
  
  // see
  // https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html
  // for saving as image
  export_image() {
    var dataURL = this.stage.toDataURL()
    return dataURL
  }

  // thanks to https://konvajs.org/docs/sandbox/Responsive_Canvas.html
  fitStageIntoParentContainer() {
    var container = document.querySelector(`#${this.target}`)

    var containerWidth = container.offsetWidth
    var scale = containerWidth / this.width
    console.log(`containerWidth: ${containerWidth}, this.width: ${this.width}, scale: ${scale}`)
    console.log(container)
    console.log(container.clientWidth)

    this.stage.width(this.width * scale)
    this.stage.height(this.height * scale)
    this.stage.scale({ x: scale, y: scale })

    this.stage.draw()
  }

  undo() {
    console.log("UNDO")
    var last = this.pins.pop()
    last.shape.hide()
    // hide also the label
    if (last.type === 'top') {
      last = this.pins.pop()
      last.shape.hide()
    }
    this.layer.draw()
  }
}





