const  colors = { 
  start: 'rgba(219, 10, 91, 0.8)',  // border color of the starting hold
  top:   'rgba(123, 1, 123, 0.8)',  // border color of the top hold
  hold:  'rgba(245, 229, 27, 0.8)', // border color od the simple hold
  white: 'rgba(255, 255, 255, 1)',
  black: 'rgba(0, 0, 0, 1)', 
  transparent: 'rgba(255, 255, 255, 1)', 
  blurr_background: 'rgba(200, 200, 200, 0.30)' 
} 
// defaults for HoldsPinner
const defaults = {
  width: 1024,
  height: 1024,
  target: 'canvasDiv', 
  editable: false,  // Konva draggable
  numerable: false, // simple holds have a number
  size_ratio: 70,   // (this.width + this.height) / this.size_ratio
}

class HoldLabel {
  constructor (x, y, label_text, size, editable) {
    console.log(`new HoldLabel: x=${x} y=${y} label_text=${label_text} size=${size} editable==${editable}`)

    this.c = 'HoldLabel' // necessary h.constructor.name not working after compression...
    this.x = x
    this.y = y
    this.label_text = label_text
    this.size = size
    this.fillcolor = (this.label_text === 'TOP') ? colors['top']   : colors['transparent']
    this.textcolor = (this.label_text === 'TOP') ? colors['white'] : colors['black']

    // real position
    var x1 = this.x
    var y1 = this.y
    if (this.label_text === 'TOP') {
      x1 = x1 + this.size + 10
      y1 = y1 - this.size
    } else {
      x1 = x1 - this.size   
      y1 = y1 - this.size 
    }

    this.shape = new Konva.Label({
      x: x1,
      y: y1,
      opacity: 1,
      draggable: editable,
      width: this.size * 2
    })

    this.shape.add(
      new Konva.Tag({
        fill: this.fillcolor,
        cornerRadius: this.size
      })
    )

    this.shape.add(
      new Konva.Text({
        text: this.label_text,
        fontFamily: 'Calibri',
        fontSize: this.size * 0.75,
        padding: 2, 
        fill: this.textcolor, 
        align: 'center'
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
  constructor(x, y, type, size, number, editable) {
    this.c = 'Hold' // necessary h.constructor.name not working after compression...
    this.x = x
    this.y = y
    this.type = type
    this.size = size
    this.number = number || 0

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
    return(colors[this.type])
  }

  label_text() {
    if (this.type === "top") {
      return("TOP")
    } else if (this.type === "start") {
      return(0)
    } else {
      return(this.number)
    }
  }
}

export default class HoldsPinner {
  constructor(options) {
    let o = Object.assign({}, defaults, options)
    console.log(o);
    this.target = o.target
    this.width  = o.width
    this.height = o.height
    this.editable = o.editable
    this.numerable  = o.numerable
    this.size_ratio = o.size_ratio
    this.hold_size  = options.hold_size || Math.floor((this.width + this.height) / this.size_ratio)

    this.actual_hold_type = 'start'
    this.actual_number = 0

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
    holdsData.forEach(hold_hash => {
      if (hold_hash.c === 'Hold') {
        this.add_hold(new Hold(hold_hash.x, hold_hash.y, hold_hash.type, hold_hash.size, hold_hash.number || 0, this.editable))
        if (this.numerable && hold_hash.number > this.actual_number) {
          this.actual_number = hold_hash.number;
        }
      }
    })
  }

  add_hold_event(e) {
    console.log(`Adding hold from event (e.x, e.y):(${e.evt.layerX}, ${e.evt.layerY})`)

    const x = e.evt.layerX
    const y = e.evt.layerY

    // only simple holds have number
    var num = 0
    if (this.actual_hold_type === 'hold' && this.numerable) {
      this.actual_number = this.actual_number + 1
      num = this.actual_number
    }

    this.add_hold(new Hold(x, y, this.actual_hold_type, this.hold_size, num, this.editable))
    console.log(this.pins)
  }

  add_hold(hold) {
    console.log(`new hold: x=${hold.x} y=${hold.y} type=${hold.type} size=${hold.size} number=${hold.number}`)

    this.pins.push(hold)
    this.layer.add(hold.shape).draw()

    // only start has no label
    if ((hold.type == 'top') || (hold.type == 'hold' && this.numerable)) {
      var hold_label = new HoldLabel(hold.x, hold.y, hold.label_text(), hold.size, this.editable) 
      this.pins.push(hold_label)
      this.layer.add(hold_label.shape).draw()
    }
  }

  get_hold_type() {
    return this.actual_hold_type
  }

  change_hold_type(th) {
    this.actual_hold_type = th
  }

  increase_size() {
    this.hold_size = Math.floor(this.hold_size * 1.3)
    // const p = this.pins[this.pins.length - 1]
    // p.size = Math.floor(p.size * 1.3)
    // p.shape.scale({
    //      x: 1.3,
    //      y: 1.3
    // })
    // this.layer.draw()
  }

  decrease_size() {
    this.hold_size = Math.floor(this.hold_size / 1.3)
    // const p = this.pins[this.pins.length - 1]
    // p.size = Math.floor(p.size / 1.3)
    // p.shape.scale({
    //      x: 1/1.3,
    //      y: 1/1.3
    // })
    // this.layer.draw()
  }

  get_holds() {
    // console.log('in get_holds()')
    // console.log(this.pins)
    return this.pins.filter(h => h.x !== 0).map(h => ({
      c: h.c, 
      x: h.x, 
      y: h.y, 
      type: h.type, 
      size: h.size, 
      number: h.number
    }))
  }
  
  // see
  // https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html
  // for saving as image
  export_image() {
    return(this.stage.toDataURL())
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
    // when deleting the label delete also the hold
    if (last.c === 'HoldLabel') {
      console.log('hided label, now hide hold')
      last = this.pins.pop()
      if (last.c === 'Hold' && this.numerable) {
        this.actual_number = this.actual_number - 1
        console.log('decresed actual_number to ' + this.actual_number)
      }
      last.shape.hide()
    }
    this.layer.draw()
  }
}





