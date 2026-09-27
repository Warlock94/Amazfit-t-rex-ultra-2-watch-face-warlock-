// TACTICAL WARLOCK 480 — Amazfit T-Rex Ultra 2 (480×480, Zepp OS 5/6).
// Digits, date and system metrics are bound to watchface widgets so the
// runtime updates them. Seconds ride IMG_TIME (1 Hz only while the screen is on).
// Bars refresh on sensor events, never on a 1-second timer.

const timeDigits = seq("digits/time/", 10)
const dataDigits = seq("digits/data/", 10)
const secDigits = seq("digits/sec/", 10)
const goalDigits = seq("digits/goal/", 10)
const weekImages = seq("week/", 7)
const hrImages = seq("level/hr/", 11)
const stepImages = seq("level/step/", 11)
const batImages = seq("level/bat/", 11)

let built = false
let heartSensor = null
let stepSensor = null
let batterySensor = null
let weatherSensor = null
let timeSensor = null
let hrWidget = null
let stepWidget = null
let batWidget = null
let weatherWidget = null

function seq(prefix, count) {
  const list = []
  for (let i = 0; i < count; i++) list.push(prefix + i + ".png")
  return list
}

function sensor(id) {
  try {
    return hmSensor.createSensor(id)
  } catch (e) {
    return null
  }
}

function setLevel(widget, lit) {
  if (!widget) return
  const level = Math.max(0, Math.min(10, lit)) + 1
  try {
    widget.setProperty(hmUI.prop.LEVEL, level)
  } catch (e) {
    try {
      widget.setProperty(hmUI.prop.MORE, { level: level })
    } catch (err) {}
  }
}

function syncHeart() {
  const bpm = heartSensor && heartSensor.last
  if (!bpm || bpm < 20) {
    setLevel(hrWidget, 0)
    return
  }
  setLevel(hrWidget, Math.round(((bpm - 45) / 120) * 10))
}

function syncStep() {
  const current = stepSensor ? stepSensor.current || 0 : 0
  const target = stepSensor ? stepSensor.target || 0 : 0
  if (!target) {
    setLevel(stepWidget, 0)
    return
  }
  setLevel(stepWidget, Math.round(Math.max(0, Math.min(1, current / target)) * 10))
}

function syncBattery() {
  const pct = batterySensor ? batterySensor.current : 0
  if (typeof pct !== "number") {
    setLevel(batWidget, 0)
    return
  }
  setLevel(batWidget, Math.round(Math.max(0, Math.min(100, pct)) / 10))
}

function syncWeather() {
  if (!weatherWidget) return
  let code = -1
  try {
    const pack = weatherSensor && weatherSensor.getForecastWeather()
    const row = pack && pack.forecastData && pack.forecastData.data && pack.forecastData.data[0]
    if (row && typeof row.index === "number") code = row.index
  } catch (e) {
    code = -1
  }
  const src = code >= 0 && code <= 28 ? "weather/" + code + ".png" : "weather/none.png"
  try {
    weatherWidget.setProperty(hmUI.prop.MORE, { src: src })
  } catch (e) {}
}

function onMinute() {
  if (timeSensor && timeSensor.minute % 30 === 0) syncWeather()
}

function listen(target, eventName, handler) {
  if (!target || !hmSensor.event || !hmSensor.event[eventName]) return
  try {
    target.addEventListener(hmSensor.event[eventName], handler)
  } catch (e) {}
}

function unlisten(target, eventName, handler) {
  if (!target || !hmSensor.event || !hmSensor.event[eventName]) return
  try {
    target.removeEventListener(hmSensor.event[eventName], handler)
  } catch (e) {}
}

function buildFace() {
  if (built) return
  built = true

  hmUI.createWidget(hmUI.widget.IMG, { x: 0, y: 0, src: "bg.png" })

  hmUI.createWidget(hmUI.widget.IMG_TIME, {
    hour_zero: 1,
    hour_startX: 68,
    hour_startY: 140,
    hour_array: timeDigits,
    hour_space: 0,
    hour_align: hmUI.align.LEFT,
    minute_zero: 1,
    minute_follow: 0,
    minute_startX: 268,
    minute_startY: 140,
    minute_array: timeDigits,
    minute_space: 0,
    minute_align: hmUI.align.LEFT,
    second_zero: 1,
    second_follow: 0,
    second_startX: 216,
    second_startY: 250,
    second_array: secDigits,
    second_space: 0,
    second_align: hmUI.align.LEFT,
  })

  hmUI.createWidget(hmUI.widget.IMG_WEEK, {
    x: 40,
    y: 286,
    week_en: weekImages,
    week_sc: weekImages,
    week_tc: weekImages,
  })

  hmUI.createWidget(hmUI.widget.IMG_DATE, {
    day_startX: 86,
    day_startY: 356,
    day_align: hmUI.align.LEFT,
    day_space: 0,
    day_zero: 1,
    day_follow: 0,
    day_en_array: dataDigits,
    day_sc_array: dataDigits,
    day_tc_array: dataDigits,
    month_startX: 218,
    month_startY: 356,
    month_align: hmUI.align.LEFT,
    month_space: 0,
    month_zero: 1,
    month_follow: 0,
    month_en_array: dataDigits,
    month_sc_array: dataDigits,
    month_tc_array: dataDigits,
    year_startX: 320,
    year_startY: 356,
    year_align: hmUI.align.LEFT,
    year_space: 0,
    year_zero: 1,
    year_follow: 0,
    year_en_array: dataDigits,
    year_sc_array: dataDigits,
    year_tc_array: dataDigits,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: 108,
    y: 86,
    w: 66,
    h: 34,
    font_array: dataDigits,
    type: hmUI.data_type.HEART,
    h_space: 0,
    align_h: hmUI.align.LEFT,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: 286,
    y: 88,
    w: 110,
    h: 34,
    font_array: dataDigits,
    type: hmUI.data_type.STEP,
    h_space: 0,
    align_h: hmUI.align.LEFT,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: 352,
    y: 122,
    w: 50,
    h: 16,
    font_array: goalDigits,
    type: hmUI.data_type.STEP_TARGET,
    h_space: 0,
    align_h: hmUI.align.LEFT,
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: 300,
    y: 284,
    w: 88,
    h: 34,
    font_array: dataDigits,
    type: hmUI.data_type.WEATHER_CURRENT,
    h_space: 0,
    align_h: hmUI.align.LEFT,
    negative_image: "digits/data/minus.png",
    unit_en: "unit/degree.png",
    unit_sc: "unit/degree.png",
    unit_tc: "unit/degree.png",
  })

  hmUI.createWidget(hmUI.widget.TEXT_IMG, {
    x: 214,
    y: 408,
    w: 110,
    h: 34,
    font_array: dataDigits,
    type: hmUI.data_type.BATTERY,
    h_space: 0,
    align_h: hmUI.align.LEFT,
    unit_en: "unit/percent.png",
    unit_sc: "unit/percent.png",
    unit_tc: "unit/percent.png",
  })

  hrWidget = hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
    x: 96,
    y: 126,
    w: 96,
    h: 12,
    image_array: hrImages,
    image_length: hrImages.length,
    level: 1,
  })

  stepWidget = hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
    x: 286,
    y: 128,
    w: 62,
    h: 7,
    image_array: stepImages,
    image_length: stepImages.length,
    level: 1,
  })

  batWidget = hmUI.createWidget(hmUI.widget.IMG_LEVEL, {
    x: 168,
    y: 444,
    w: 144,
    h: 10,
    image_array: batImages,
    image_length: batImages.length,
    level: 1,
  })

  weatherWidget = hmUI.createWidget(hmUI.widget.IMG, {
    x: 386,
    y: 280,
    src: "weather/none.png",
  })

  heartSensor = sensor(hmSensor.id.HEART)
  stepSensor = sensor(hmSensor.id.STEP)
  batterySensor = sensor(hmSensor.id.BATTERY)
  weatherSensor = sensor(hmSensor.id.WEATHER)
  timeSensor = sensor(hmSensor.id.TIME)

  syncHeart()
  syncStep()
  syncBattery()
  syncWeather()

  listen(heartSensor, "LAST", syncHeart)
  listen(stepSensor, "CHANGE", syncStep)
  listen(batterySensor, "CHANGE", syncBattery)
  listen(timeSensor, "MINUTEEND", onMinute)
}

function destroyFace() {
  unlisten(heartSensor, "LAST", syncHeart)
  unlisten(stepSensor, "CHANGE", syncStep)
  unlisten(batterySensor, "CHANGE", syncBattery)
  unlisten(timeSensor, "MINUTEEND", onMinute)
}

WatchFace({
  onInit() {},
  build() {
    buildFace()
  },
  onDestroy() {
    destroyFace()
  },
})
