const Chartist = require('./chartist.min')

var temp1 = []
var temp2 = []
var press = []
var labels = range(0, 300, 10)

function range(from, to, step) {
  step = step || 1  
  var result = []
  for (var i = from; i <= to; i += step) {
    var l = i 
    result.push(i)
  }
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
    ticks: range(20, 120, 10),
    low: 20, high: 120, 
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
    nextValue()
    timerId = setInterval(nextValue, 5000);
  }
}

function nextValue() {
  if (temp1.length == 61) {
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

var startButton, stopButton, portsSelect, haat1Button, haat2Button
var temp1Display, temp2Display, temp3Display, pressDisplay

var inputP, inputI, inputD, inputTT, setParamsButton

window.onload = () => {
  startButton = document.getElementById('start')
  stopButton = document.getElementById('stop')
  portsSelect = document.getElementById('ports')
  startButton.addEventListener('click', startDisplay)
  stopButton.addEventListener('click', stopDisplay)

  haat1Button = document.getElementById('heat1')
  haat1Button.addEventListener('click', heat1)

  haat2Button = document.getElementById('heat2')
  haat2Button.addEventListener('click', heat2)
  
  temp1Display = document.getElementById('temp1')
  temp2Display = document.getElementById('temp2')
  temp3Display = document.getElementById('temp3')
  pressDisplay = document.getElementById('press')

  relaySelect = document.getElementById('relay')
  relaySelect.addEventListener('change', event => {
    let relay =  event.target.value
    sendCommand('n' + relay)
  })
  inputP   = document.getElementById('p')
  inputI  = document.getElementById('i')
  inputD  = document.getElementById('d')
  inputTT = document.getElementById('tt')
  setParamsButton = document.getElementById('set_params')
  setParamsButton.addEventListener('click', setParams)

  disableInputs(true)
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
  portsSelect.addEventListener('change', event => {
    let com =  event.target.value
    if (com == '...')  {
      if (serialport && serialport.isOpen) {
        serialport.close()
        serialport = undefined
      }
      disableInputs(true)
      displayValues(['', '', '', ''])     
    } else {
      initPort(com)
      disableInputs(false)
    }
  })
  
  ports.forEach(p => {
    var opt = document.createElement("option");
    opt.value = p;
    opt.innerHTML = p;
    portsSelect.appendChild(opt);
  })
}

function disableInputs(state) {
  startButton.disabled = state
  stopButton.disabled = state
  haat1Button.disabled = state
  haat2Button.disabled = state
  setParamsButton.disabled = state
  inputP.disabled = state
  inputI.disabled = state
  inputD.disabled = state
  inputTT.disabled = state
}

var serialport
let t1, t2, t3, p

function initPort(com) {
  if (serialport)
    serialport.close()
  serialport = new SerialPort(com, {baudRate: 115200, parity: 'none', stopBits: 1})
  serialport.on('error', err => console.error(err))

  let re = /([\d.]+)/g

  const text = serialport.pipe(new Readline())
  text.on('data', (data) => {
    //console.log(data)
    var ch = data.charAt(0);
    if (ch != '#') {
      console.log('>> ', data)
      return
    }
    let values = []
    var matches
    while(matches = re.exec(data))
      values.push(matches[1])
    //console.log('values', values)
    if (values) 
      displayValues(values)
    else 
      console.error('data format error')
    
    heating1 = values[4]
    let color = heating1 == '1' ? 'red' : ''
    haat1Button.style['background-color'] = color

    heating2 = values[5]
    color = heating2 == '1' ? 'red' : ''
    haat2Button.style['background-color'] = color
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

var heating1 = false, heating2 = false;
function heat1() {
  heating1 = !heating1
  let command = 'r' + (heating1 ? '1' : '0')
  sendCommand(command)
}

function heat2() {
  heating2 = !heating2
  let command = 'r' + (heating2 ? '1' : '0')
  sendCommand(command)
}

function setParams() {
  var valueP = inputP.value.trim();
  var valueI = inputI.value.trim();
  var valueD = inputD.value.trim();
  var valueTT = inputTT.value.trim();

  console.log('params', valueP, valueI, valueD, valueTT)

  if (valueP != '')
    sendCommand('p' + valueP)
  if (valueI != '')
    sendCommand('i' + valueI)
  if (valueD != '')
    sendCommand('d' + valueD)
  if (valueTT != '')
    sendCommand('t' + valueTT)

  if (valueP == '' && valueP == '' && valueD == '' && valueTT == '')
    sendCommand('x')

  setParamsButton.disabled = true;
  setTimeout(_ => setParamsButton.disabled = false, 1000)
}

function sendCommand(cmd) {
  serialport.write(cmd + '\n', err =>  console.log('cmd', cmd))
}