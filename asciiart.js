//# sourceURL=Canvas
if (module) var Big = require('./bigDecimal');
// undefined - background
// null - wasn't there originally - e.g. edges on a ragged array
class Canvas {
  
  constructor (preset, p = preset.p) {
    if (p === undefined) throw new Error("no parent");
    this.p = p;
    this.repr = [];
    this.possiblyMultiline = false;
    this.background = p? p.background : " ";
    this.sx = 0;
    this.sy = 0;
    this.ex = 0;
    this.ey = 0;
    if (typeof preset === "number" || preset instanceof Big) {
      preset = preset.toString();
    }
    if (typeof preset === "string") {
      preset = preset.split("\n");
    }
    if (preset instanceof Canvas) {
      this.repr = preset.repr.slice().map(c => c.slice());
      this.sx = preset.sx;
      this.sy = preset.sy;
      this.ex = preset.ex;
      this.ey = preset.ey;
      this.background = preset.background;
    }
    if (Array.isArray(preset)) {
      const na = [];
      for (const c of preset) {
        if (isArt(c)) na.push(...c.repr);
        else na.push(c);
      }
      preset = na;
      this.ey = preset.length;
      let longestLine = 0;
      this.repr = preset.map((line) => {
        if (typeof line === "string" || isNum(line) || isJSNum(line)) {
          line = ""+line;
          if (line.length > longestLine) longestLine = line.length;
          return line.split("");
        } else {
          let out = [];
          flatten(line).forEach((part) => {
            if (part === undefined) out.push(undefined);
            if (part === null) out.push(null);
            else out = out.concat(part.toString().split(""));
          });
          if (out.length > longestLine) longestLine = out.length;
          return out;
        }
      });
      this.repr = this.repr.map((line) => {
        while (line.length < longestLine) line.push(null);
        return line;
      });
      this.ex = longestLine;
    }
  }
  toString(nullChr = this.background) {
    let res = "";
    this.repr.forEach((line) => {
      line.forEach((chr) => {
             if (chr === undefined) res+= this.background; // this probably
        else if (chr === null     ) res+= nullChr        ; // shouldn't  be
        else                        res+=     chr        ; // this  aligned
      });
      res+= "\n";
    });
    return res.slice(0,-1);
  }
  toDebugString(descLine) {
    const temp = this.background;
    if (this.background === ' ') this.background = '∙';
    const out = this.toString('•');
    this.background = temp;
    return out+(descLine? "\n" : "")+`<${this.sx};${this.sy},${this.ex};${this.ey} "${this.background}">`;
  }
  
  toArr() {
    const res = [];
    this.repr.forEach((line) => {
      let cline = "";
      line.forEach((chr) => {
        if (chr === undefined || chr === null) cline+= this.background;
        else cline+= chr;
      });
      res.push(cline);
    });
    return res;
  }
  
  get width() { return this.ex-this.sx }
  get height() { return this.ey-this.sy }
  
  stringForm() {
    var res = "";
    for (let y = 0; y < this.ey; y++) {
      for (let x = 0; x < this.ex; x++) {
        res+= this.getChr(x, y);
      }
      res+= "\n";
    }
    return res.substring(0, res.length-1);
  }
  
  copy() {
    let res = new Canvas(this);
    res.sx = this.sx;
    res.sy = this.sy;
    res.ex = this.ex;
    res.ey = this.ey;
    res.background = this.background;
    res.possiblyMultiline = this.possiblyMultiline;
    return res;
  }
  
  get (x, y) { 
    return (this.repr[y-this.sy] === undefined || this.repr[y-this.sy][x-this.sx] === undefined)? undefined : (this.repr[y-this.sy][x-this.sx])
  }
  getChr (x,y) {
    return this.get(x,y) || this.background;
  }
  
  set (x, y, chr, leaveSize) {
    this.allocate(x, y, leaveSize);
    this.repr[y-this.sy][x-this.sx] = chr;
    return this;
  }
  
  included (x, y) {
    return y>this.ey && x>this.ex;
  }
  
  translate (x, y) {
    this.sx+= x;
    this.sy+= y;
    this.ex+= x;
    this.ey+= y;
  }
  
  allocate (x, y, leaveSize) {
    if (x < this.sx) {
      let spacing = new Array(this.sx - x).fill(null);
      this.repr = this.repr.map((line) => spacing.slice().concat(line));
      this.sx = x;
      // console.log("a<sx");
    }
    if (y < this.sy) {
      let spacing = new Array(this.width).fill(null);
      for (let i = 0; i < this.sy - y; i++) this.repr.unshift(spacing);
      this.sy = y;
      // console.log("y<sy");
    }
    
    if (x >= this.ex) {
      let spacing = new Array(x - this.ex + 1).fill(null);
      this.repr = this.repr.map((line) => line.concat(spacing.slice()));
      if (!leaveSize) this.ex = x+1;
      // console.log("x>=ex");
    }
    if (y >= this.ey) {
      let spacing = new Array(this.width).fill(null);
      for (let i = 0; i < y - this.ey + 1; i++) this.repr.push(spacing.slice());
      if (!leaveSize) this.ey = y+1;
      // console.log("y>=ey");
    }
    
    return this;
  }
  
  appendVertically (canvas) {
    this.overlap(canvas, this.sx, this.ey);
    return this;
  }
  appendHorizontally (canvas) {
    this.overlap(canvas, this.ex, this.sy);
    return this;
  }
  subsection (nsx, nsy, nex, ney) {
    if (nsx !== undefined) nsx+= this.sx;
    if (nsy !== undefined) nsy+= this.sy;
    // if (nex !== undefined) nex+= this.sx;
    // if (ney !== undefined) ney+= this.sy;
    // return new Canvas(this.repeatingSubsection(nex, ney).repr.slice(nsy).map(c => c.slice(nsx)), this.p);
    let resc = new Canvas(this);
    resc.allocate(nex, ney);
    return new Canvas(resc.repr.slice(nsy, ney).map(c => c.slice(nsx, nex)), this.p);
  }
  repeatingSubsection (x, y) {
    var r = this.repr;
    while (r.length < y) r = r.concat(this.repr);
    return new Canvas(r.slice(0, y).map(c => {
      var cr = c;
      while (cr.length < x) cr = cr.concat(c);
      return cr.slice(0, x);
    }), this.p);
  }
  forEach (lambda) {
    for (let x = this.sx; x < this.ex; x++) {
      for (let y = this.sy; y < this.ey; y++) {
        let chr = this.get(x, y);
        lambda(chr, x, y);
      }
    }
  }
  forEachChar (lambda) {
    for (let x = this.sx; x < this.ex; x++) {
      for (let y = this.sy; y < this.ey; y++) {
        let chr = this.get(x, y);
        if (chr !== null) lambda(chr, x, y);
      }
    }
  }
  
  mapSet (lambda) {
    for (let x = this.sx; x < this.ex; x++) {
      for (let y = this.sy; y < this.ey; y++) {
        let chr = this.get(x, y);
        this.set(x, y, lambda(chr, x, y));
      }
    }
  }
  
  
  overlap (canvas, ox, oy, method = simpleOverlap) {
    if (typeof ox !== "number") ox = Number.parseInt(ox);
    if (typeof oy !== "number") oy = Number.parseInt(oy);
    canvas.forEach((chr, x, y) => {//console.log(chr,x,y,ox,oy);
      this.set(x+ox, y+oy, method(this.get(x+ox, y+oy), chr, x+ox, y+oy));
    });
    return this;
  }
  
  trimmedLine (y) {
    const res = this.repr[y - this.sy];
    while (res.length > 0 && (res[0] === undefined || res[0] === null)) res.shift();
    while (res.length > 0 && (res[res.length-1] === undefined || res[res.length-1] === null)) res.pop();
    return res;
  }
  
  horizReverse () {
    this.repr.forEach((line) => line.reverse());
    this.sx = this.repr.length-this.height;
    this.ex = this.repr.length>0? this.repr[0].length : 0;
    return this;
  }
  vertReverse () {
    this.repr.reverse();
    this.sy = this.repr.length-this.ey;
    this.ey = this.repr.length+this.sy;
    return this;
  }
  horizMirror () {
    this.horizReverse();
    this.mapSet((chr) => {
      let mirrorable = "\\/<>(){}[]";
      if (mirrorable.includes(chr)) return mirrorable[mirrorable.indexOf(chr)^1];
      return chr;
    });
    return this;
  }
  vertMirror (fromSmart) {
    this.vertReverse();
    this.mapSet((chr) => {
      let mirrorable = "\\/^v'.`,V^";
      if (!fromSmart) if (chr === '‾') return "_";
      if (mirrorable.includes(chr)) return mirrorable[mirrorable.indexOf(chr)^1];
      return chr;
    });
    return this;
  }
  
  vertMirrorSmart (overlapMode) {
    this.vertMirror(true);
    this.forEach((chr, x, y) => {
      if (chr === "_") {
        this.set(x, y, undefined);
        this.set(x, y-1, overlapMode(this.get(x, y-1), "_"), true);
      }
      if (chr === "‾") this.set(x, y, "_");
    });
    return this;
  }
  
  rotate (times, rotateMode) {
    if (!rotateMode) rotateMode = c=>c;
    for (let i = 0; i < (times%4 + 4)%4; i++) {
      let osx = this.sx,
          osy = this.sy,
          oex = this.ex,
          oey = this.ey;
          
      let newrepr = [];
      let orepr = this.repr;
      this.sy = osx;
      this.sx = orepr.length-oey;
      this.ex = this.sx + oey-osy;
      this.ey = this.sy + oex-osx;
      const len = orepr[0] === undefined ? 0 : orepr[0].length;
      for (let x = 0; x < len; x++) {
        let cline = [];
        for (let y = 0; y < orepr.length; y++) {
          cline.push(rotateMode(orepr[orepr.length-y-1][x]));
        }
        newrepr.push(cline);
      }
      this.repr = newrepr;
    }
    return this;
  }
  
  palindromize (...args) {
    for (let i = 0; i < args.length; i+= 4) {
      let mode = args[i];
      let mirrormode = args[i+1];
      let overlapSize = args[i+2];
      let overlapMode = args[i+3];
      if (mode === H) {
        let reversed = this.copy();
        if (mirrormode === "mirror") reversed.horizMirror();
        else if (mirrormode === "reverse") reversed.horizReverse();
        else if (mirrormode !== "no") throw "invalid mirror mode " + mirrormode;
        this.overlap(reversed, this.width-overlapSize, 0, overlapMode);
      } else if (mode === V) {
        let reversed = this.copy();
        if (mirrormode === "mirror") reversed.vertMirror();
        else if (mirrormode === "reverse") reversed.vertReverse();
        else if (typeof mirrormode === "function") reversed.vertMirrorSmart(mirrormode);
        else if (mirrormode !== "no") throw "invalid mirror mode " + mirrormode;
        this.overlap(reversed, 0, this.height-overlapSize, overlapMode);
      } else throw "invalid palindromizing mode " + mode;
    }
    return this;
  }
  c(){ console.log(this.toDebugString()) }
}

function flatten (inp, rec) {
  if (Array.isArray(inp)) {
    let out = [];
    for (let item of inp) {
      out = out.concat(flatten(item, true));
    }
    return out;
  } else return rec? ((inp===null || inp===undefined)? inp : inp.toString()) : [...inp.toString()];
}
//new Canvas(["/-\\",["|",[" ",[[[["|"]]]]]],"+-+"]).set(-1,-3,'~').set(4,4,'_').get(-1,-3)

var simpleOverlap = (a, b) => {
  return b;
};

var noBGOverlap = (a, b) => {
  if (b === undefined || b === null) return a;
  return b;
};

var H = 1,
    V = 2;
var smartOverlap = (a, b) => smartOverlapDef(a, b, b);
var smartOverlapBehind = (a, b) => smartOverlapDef(a, b, a);
var smartOverlapDef = function (a, b, def) {
  if (a===null || a===undefined || a===" ") return b;
  if (b===null || b===undefined || b===" ") return a;
  if (a==='_' && b!==' ') return b;
  if (b==='_' && a!==' ') return a;
  switch (a+b) {
    case "/\\": return "X";
    case "\\/": return "X";
    case "-|": return "+";
    case "|-": return "+";
    case "_.": return "_";
    case "_,": return "_";
    case "._": return "_";
    case ",_": return "_";
    
    case ",.": return ",";
    case ".,": return ",";
    case ",`": return ";";
    case ",'": return ";";
    case "`,": return ";";
    case "',": return ";";
    case ".`": return ":";
    case ".'": return ":";
    case "`.": return ":";
    case "'.": return ":";
    
    case "‾_": return "=";
    case "_‾": return "=";
    case "": return "";
    default: return def;
  }
};

// NOTE: rotates clockwise
var smartRotate = function (chr) {
  var cycles = ["-|", "/\\", "<^>v", "_|"];
  var found = cycles.find(c=>c.includes(chr));
  if (found) return found[(found.indexOf(chr)+1) % found.length];
  return chr;
};

// var canvas0 = new Canvas(["/-\\",["|",[undefined,[[[["|"]]]]]],"+-+"]);
// var canvas1 = canvas0.copy().set(-1,-3,'~').set(6,6,'_').set(1,1,undefined);
// var canvas2 = canvas1.copy().overlap(canvas1, -2, 0, smcanvasOverlap).overlap(canvas1, -3, 1, smcanvasOverlap)
// var canvas10 = new Canvas("      _,.-\n   ,-'\\  _\n  /  _ \\  \n ,      \\ \n |-------\\");
// var canvas11 = canvas10.palindromize(H, "mirror", 1, smcanvasOverlap, V, (a, b) => smcanvasOverlapDef(a, b, a), 1, smcanvasOverlap);


if (module) {
  module.exports = {
    smartRotate: smartRotate,
    smartOverlapDef: smartOverlapDef,
    smartOverlapBehind: smartOverlapBehind,
    smartOverlap: smartOverlap,
    noBGOverlap: noBGOverlap,
    simpleOverlap: simpleOverlap,
    Canvas: Canvas,
  };
} else window.Canvas = Canvas;