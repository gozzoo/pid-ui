const Chartist = require('./chartist.min')

var temp1 = []
var temp2 = []
var press = []
var labels = range(0, 30)

function range(from, to, step) {
  step = step || 1  
  var result = []
  for (var i = from; i <= to; i += step)
    result.push(i)
  return result
}

var tchart = new Chartist.Line('#tchart', {
  labels: labels,
  series: [temp1, temp2]
}, {  
  showPoint: false,
  height: '100%', width: '100%',
  axisY: { 
    type: Chartist.FixedScaleAxis,
    ticks: range(0, 120, 10),
    low: 0, high: 120, 
  },
  fullWidth: true,
  chartPadding: {
    right: 40
  }
});

var pchart = new Chartist.Line('#pchart', {
  labels: labels,
  series: [press]
}, {  
  showPoint: false,
  height: '100%',
  width: '100%',
  axisY: { 
    type: Chartist.FixedScaleAxis,
    ticks: range(0, 15),
    low: 0, high: 15, 
  },
  fullWidth: true,
  chartPadding: {
    right: 40
  }
});

var timerId 

function start() {
  if (!timerId) {
    //nextValue()
    timerId = setInterval(nextValue, 500);
  }
}

function nextValue() {
  if (temp1.length == 31) {
    temp1.shift()
    temp2.shift();
    press.shift();
    
    let last = labels[labels.length-1]
    labels.push(last + 1)
    labels.shift();
  }
  
  temp1.push(t1);
  temp2.push(t2);
  press.push(p);
  tchart.update();
  pchart.update();
}

var startButton, stopButton, portsSelect, haatButton
var temp1Display, temp2Display, temp3Display, pressDisplay

window.onload = () => {
  startButton = document.getElementById('start')
  stopButton = document.getElementById('stop')
  portsSelect = document.getElementById('ports')
  startButton.addEventListener('click', startDisplay)
  stopButton.addEventListener('click', stopDisplay)

  haatButton = document.getElementById('heat')
  haatButton.addEventListener('click', heat)
  
  temp1Display = document.getElementById('temp1')
  temp2Display = document.getElementById('temp2')
  temp3Display = document.getElementById('temp3')
  pressDisplay = document.getElementById('press')

  initPorts()
}

const SerialPort = require('serialport')
const Readline = require('@serialport/parser-readline')

function initPorts() {
  SerialPort.list().then(_ports => {
    console.log('_ports', _ports)
    var ports = _ports.map(port => port.path)
    console.log('ports', ports)
    updatePorts(ports)
  })
}

function updatePorts(ports) {
  ports.unshift('...')
  var listener = portsSelect.addEventListener('change', event => {
    let com =  portsSelect.value    
    if (com == '...')  {
      if (serialport) {
        serialport.close()
        serialport = undefined
      }
      startButton.disabled = true
      stopButton.disabled = true
      haatButton.disabled = true
      displayValues(['', '', '', ''])     
    } else {
      initPort(com)
      startButton.disabled = false
      haatButton.disabled = false
    }
  })
  console.log('listener', listener)
  
  ports.forEach(p => {
    var opt = document.createElement("option");
    opt.value = p;
    opt.innerHTML = p;
    portsSelect.appendChild(opt);
  })
}

var serialport
let t1, t2, t3, p

function initPort(com) {
  if (serialport)
    serialport.close()
  serialport = new SerialPort(com, {baudRate: 115200})

  let re = /([\d.]+)/g

  const text = serialport.pipe(new Readline())
  text.on('data', (data) => {
    console.log('data', data)
    let values = []
    var matches
    while(matches = re.exec(data))
      values.push(matches[1])
    console.log('values', values)
    if (values) 
      displayValues(values)
    else 
      console.error('data format error')
  })
}

function displayValues(values) {
  t1 = values[0]
  t2 = values[1]
  t3 = values[2]
  p = values[3]

  temp1Display.textContent = t1
  temp2Display.textContent = t2
  temp3Display.textContent = t3
  pressDisplay.textContent = p
}

function startDisplay() {
  start()
  startButton.disabled = true
  stopButton.disabled = false
  portsSelect.disabled = true
}

function stopDisplay() {
  if (timerId) {
    temp1.length = 0
    temp2.length = 0
    press.length = 0
    for (i = 0; i < labels.length; i++)
      labels[i] = i
    clearInterval(timerId) 
    timerId = undefined
    startButton.disabled = false
    stopButton.disabled = true
    portsSelect.disabled = false
  }
}

var heating = false
function heat() {
  heating = !heating
  let command = heating ? 't1\n' : 't0\n'
  serialport.write(command)

  let color = heating ? 'red' : ''
  haatButton.style['background-color'] = color
}
