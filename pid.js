// based on implementation by Tim Wescott
// https://www.wescottdesign.com/articles/pid/pidWithoutAPhd.pdf

const WINDUP_GUARD_GAIN = 100.0

var targetTemp;
var iState = 0;
var lastTemp = 0;

var pgain, igain, dgain;

var windupGaurd;

// with this setup, you pass the addresses for the PID algorithm to use to 
// for storing the gain settings.  This way wastes 6 bytes to store the addresses,
// but its nice because you can keep all the EEPROM address allocaton in once place.

function PID(_targetTemp, _p, _i, _d) {
  targetTemp = _targetTemp;
  
  pgain = _p
  igain = _i
  dgain = _d

  // windup guard values are relative to the current iGain
  windupGaurd = WINDUP_GUARD_GAIN / igain;  
}

function getP() {
  return pgain;
}

function getI() {
  return igain;
}

function getD() {
  return dgain;
}

function setP(p) {
  pgain = p; 
}

function setI(i) {
  igain = i; 
  windupGaurd = WINDUP_GUARD_GAIN / igain;
}

function setD(d) {
  dgain = d; 
}

// to prevent iTerm from getting huge we use a "windup guard" 
// (this happens when the machine is first turned on and
// it cant help be cold despite its best efforts)

function windupGaurdLimit(value) {
  if (value > windupGaurd) 
    return windupGaurd;
  else if (value < -windupGaurd) 
    return -windupGaurd;
  return value;
}

function updatePID(curTemp) {
  var error = targetTemp - curTemp;  // how far off are we

  // pTerm is the view from now
  // pgain shows how much we care about error in this instant
  var pTerm = pgain * error;
  
  iState += error;    // accumulated error
  iState = windupGaurdLimit(iState);
  var iTerm = igain * iState;

  // dTerm - the difference between the temperature now and our last reading, 
  // shows the "speed" or how quickly the temp is changing. (aka. Differential)
  var dTerm = dgain * (curTemp - lastTemp);
  lastTemp = curTemp;

  return  pTerm + iTerm - dTerm;
}
