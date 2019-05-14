const colors = {
  start: 'rgba(219, 10, 91, 0.8)',
  top: 'rgba(123, 1, 123, 0.8)',
  hold: 'rgba(245, 229, 27, 0.8)',
  blurr_background: 'rgba(200, 200, 200, 0.30)'
}

class HoldLabel {
  constructor (x, y, type, editable) {
    this.x = x
    this.y = y
    this.type = type

    this.label = new Konva.Label({
      x: this.x - 150,
      y: this.y - 15,
      opacity: 0.85,
      draggable: editable
    })

    this.label.add(
      new Konva.Tag({
        fill: 'rgba(123, 1, 123, 1)',
        cornerRadius: 5
      })
    )

    this.label.add(
      new Konva.Text({
        text: this.type,
        fontFamily: 'Calibri',
        fontSize: 38,
        padding: 15,
        fill: 'white',
        align: 'right'
      })
    );

    this.label.on('dragend', () => {
      if (this.label.x() < 10) {
        this.x = 0
        this.y = 0
      } else {
        this.x = this.label.x()
        this.y = this.label.y()
      }
    })
  }

  move(x, y) {
    this.x = x
    this.y = y
    this.label.x(this.x - 120)
    this.label.y(this.y - 15)
    this.label.draw()
  }
}

class Hold {
  constructor(x, y, type, size, editable) {
    this.x = x
    this.y = y
    this.type = type

    const common = {
      x: this.x,
      y: this.y,
      strokeWidth: 8,
      stroke: this.color(),
      draggable: editable,
      fill: colors.blurr_background
    }

    if (type === 'start') {
      this.pin = new Konva.Star({
        ...common, ...{ numPoints: 4, innerRadius: size, outerRadius: size - 10 },
      })
    } else if (type === 'hold') {
      this.pin = new Konva.Circle({
        ...common, ...{ radius: size },
      })
    } else if (type === 'top') {
      this.pin = new Konva.Star({
        ...common, ...{ numPoints: 5, innerRadius: size, outerRadius: size - 10  },
      })
    }

    this.pin.on('dragend', () => {
      if (this.pin.x() < 10) {
        this.x = 0
        this.y = 0
      } else {
        this.x = this.pin.x()
        this.y = this.pin.y()
      }
    })
  }

  color() {
    return colors[this.type]
  }
}

export default class HoldsPinner {
  constructor(target, width, height) {
    this.target = target;
    this.width = width;
    this.height = height;
    this.hold_size = (width + height) / 50  
    this.actual_hold_type = 'start';
    this.editable = false;

    this.result = [];

    this.valid = false;
    this.dragging = false;

    this.stage = new Konva.Stage({
      container: target,
      width: this.width,
      height: this.height,
    });

    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

  }

  setup(holdsData) {
    holdsData.forEach(hold => {
      if (hold.c === 'Hold') {
        this.add_hold(hold.x, hold.y, hold.type);
      }
    });
  }

  set_editable() {
    this.editable = true;
    this.stage.on('click', (e) => {
      this.add_hold_event(e);
    });
  };

  add_hold_event(e) {
    console.log(e);
    console.log(`adding hold from event e.x, e.y:${e.evt.layerX}:${e.evt.layerY}`);

    const x = e.evt.layerX;
    const y = e.evt.layerY;

    const hold = this.add_hold(x, y, this.actual_hold_type);

    this.actual_hold = hold;
    console.log(this.result);
  }

  add_hold(x, y, hold_type) {
    const hold = new Hold(x, y, hold_type, this.hold_size, this.editable);
    console.log(`new hold: hold.x=${hold.x} hold.y=${hold.y} hold.type=${hold.type}`);
    this.layer.add(hold.pin).draw();
    this.result.push(hold);

    if (hold.type === 'top') {
      const hold_label = new HoldLabel(x, y, hold_type, this.editable);
      this.layer.add(hold_label.label).draw();
      this.result.push(hold_label);
      // FIXME: pull out of here this code, probably use a label inside Hold is a better choice.
      hold.pin.on('dragmove', () => {
        hold_label.move(hold.pin.x(), hold.pin.y());
      });
    }
    return hold;
  }

  change_hold_type(th) {
    this.actual_hold_type = th;
  }

  get_holds() {
    console.log(this.result);
    return this.result.filter(h => h.x !== 0).map(h => ({
      c: h.constructor.name, x: h.x, y: h.y, type: h.type,
    }));
  }
  
  // see
  // https://konvajs.org/docs/data_and_serialization/Stage_Data_URL.html
  // for saving as image
  export_image() {
    var dataURL = this.stage.toDataURL();
    return dataURL;
  }

  // thanks to https://konvajs.org/docs/sandbox/Responsive_Canvas.html
  fitStageIntoParentContainer() {
    var container = document.querySelector(`#${this.target}`);

    var containerWidth = container.offsetWidth;
    var scale = containerWidth / this.width;
    console.log(`containerWidth: ${containerWidth}, this.width: ${this.width}, scale: ${scale}`);
    console.log(container);
    console.log(container.clientWidth);

    this.stage.width(this.width * scale);
    this.stage.height(this.height * scale);
    this.stage.scale({ x: scale, y: scale });

    this.stage.draw();
  }
}


