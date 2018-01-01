function Canvas (preset) {
  this.repr = [];
  this.possiblyMultiline = false;
  this.background = " ";
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
    preset = preset.repr;
  }
  if (Array.isArray(preset)) {
    this.ey = preset.length;
    let longestLine = 0;
    this.repr = preset.map((line) => {
      if (typeof line === "string") {
        if (line.length > longestLine) longestLine = line.length;
        return line.split("");
      } else {
        let out = [];
        flatten(line).forEach((part) => {
          if (part == undefined) out.push(undefined);
          else out = out.concat(part.toString().split(""));
        });
        if (out.length > longestLine) longestLine = out.length;
        return out;
      }
    });
    this.repr = this.repr.map((line) => {
      while (line.length < longestLine) line.push(undefined);
      return line;
    })
    this.ex = longestLine;
  }
  this.toString = function () {
    var res = "";
    this.repr.forEach((line) => {
      line.forEach((chr) => {
        if (chr != undefined) res+= chr;
        else res+= this.background;
      });
      res+= "\n";
    });
    return res.slice(0,-1);
  }
  this.toDebugString = function () {
    var temp = this.background;
    if (this.background == ' ') this.background = '∙'
    var out = this.toString();
    this.background = temp;
    return out+`<${this.sy};${this.ey}>`;
  }
  
  this.toArr = function () {
    var res = [];
    this.repr.forEach((line) => {
      var cline = "";
      line.forEach((chr) => {
        if (chr != undefined) cline+= chr;
        else cline+= this.background;
      });
      res.push(cline);
    });
    return res;
  }
  
  this.width = () => this.ex-this.sx;
  this.height = () => this.ey-this.sy;
  
  this.copy = function () {
    let res = new Canvas(this.repr);
    res.sx = this.sx;
    res.sy = this.sy;
    res.ex = this.ex;
    res.ey = this.ey;
    res.background = this.background;
    res.possiblyMultiline = this.possiblyMultiline;
    return res;
  }
  
  this.get = (x, y) => (this.repr[y-this.sy] == undefined || this.repr[y-this.sy][x-this.sx] == undefined)? undefined : (this.repr[y-this.sy][x-this.sx]);
  
  this.set = function (x, y, chr, leaveSize) {
    this.allocate(x, y, leaveSize);
    this.repr[y-this.sy][x-this.sx] = chr;
    return this;
  }
  
  this.translate = function (x, y) {
    this.sx+= x;
    this.sy+= y;
    this.ex+= x;
    this.ey+= y;
  }
  
  this.allocate = function (x, y, leaveSize) {
    if (x < this.sx) {
      let spacing = [];
      for (let i = 0; i < this.sx - x; i++) spacing[i] = undefined;
      this.repr = this.repr.map((line) => spacing.slice().concat(line))
      this.sx = x;
    }
    if (y < this.sy) {
      let spacing = [];
      for (let i = 0; i < this.width(); i++) spacing[i] = undefined;
      for (let i = 0; i < this.sy - y; i++) this.repr.splice(0,0,spacing.slice());
      this.sy = y;
    }
    
    if (x >= this.ex) {
      let spacing = [];
      for (let i = 0; i < x - this.ex + 1; i++) spacing[i] = undefined;
      this.repr = this.repr.map((line) => line.concat(spacing.slice()))
      if (!leaveSize) this.ex = x+1;
    }
    if (y >= this.ey) {
      let spacing = [];
      for (let i = 0; i < this.width(); i++) spacing[i] = undefined;
      for (let i = 0; i < y - this.ey + 1; i++) this.repr.push(spacing.slice());
      if (!leaveSize) this.ey = y+1;
    }
    
    return this;
  }
  
  this.appendVertically = function (canvas) {
    this.overlap(canvas, this.sx, this.ey);
    return this;
  }
  this.appendHorizontally = function (canvas) {
    this.overlap(canvas, this.ex, this.sy);
    return this;
  }
  this.subsection = function (nsx, nsy, nex, ney) {
    if (nsx != undefined) nsx+= this.sx;
    if (nsy != undefined) nsy+= this.sy;
    if (nex != undefined) nex+= this.sx;
    if (ney != undefined) ney+= this.sy;
    return new Canvas(this.repr.slice(nsy, ney).map(c => c.slice(nsx, nex)));
  }
  this.forEach = function (lambda) {
    for (let x = this.sx; x < this.ex; x++) {
      for (let y = this.sy; y < this.ey; y++) {
        let chr = this.get(x, y);
        lambda(chr, x, y);
      }
    }
  }
  
  this.mapSet = function (lambda) {
    for (let x = this.sx; x < this.ex; x++) {
      for (let y = this.sy; y < this.ey; y++) {
        let chr = this.get(x, y);
        this.set(x, y, lambda(chr, x, y));
      }
    }
  }
  
  
  this.overlap = function (canvas, ox, oy, method) {
    if (method == undefined) method = simpleOverlap;
    if (typeof ox !== "number") ox = Number.parseInt(ox);
    if (typeof oy !== "number") oy = Number.parseInt(oy);
    canvas.forEach((chr, x, y) => {//console.log(chr,x,y,ox,oy);
      this.set(x+ox, y+oy, method(this.get(x+ox, y+oy), chr, x+ox, y+oy));
    });
    return this;
  }
  
  
  this.horizReverse = function () {
    this.repr.forEach((line) => line.reverse());
    this.sx = this.repr.length-this.height();
    this.ex = this.repr.length>0? this.repr[0].length : 0;
    return this;
  }
  this.vertReverse = function () {
    this.repr.reverse();
    this.sy = this.repr.length-this.ey;
    this.ey = this.repr.length+this.sy;
    return this;
  }
  this.horizMirror = function () {
    this.horizReverse();
    this.mapSet((chr) => {
      let mirrorable = "\\/<>(){}[]";
      if (mirrorable.includes(chr)) return mirrorable[mirrorable.indexOf(chr)^1];
      return chr;
    });
    return this;
  }
  this.vertMirror = function (fromSmart) {
    this.vertReverse();
    this.mapSet((chr) => {
      let mirrorable = "\\/^v'.`,V^";
      if (!fromSmart) if (chr == '‾') return "_";
      if (mirrorable.includes(chr)) return mirrorable[mirrorable.indexOf(chr)^1];
      return chr;
    });
    return this;
  }
  
  this.vertMirrorSmart = function (overlapMode) {
    this.vertMirror(true);
    this.forEach((chr, x, y) => {
      if (chr === "_") {
        this.set(x, y, undefined);
        this.set(x, y-1, overlapMode(this.get(x, y-1), "_"), true);
      }
      if (chr == "‾") this.set(x, y, "_");
    });
    return this;
  }
  
  this.rotate = function (times, rotateMode) {
    if (!rotateMode) rotateMode = c=>c;
    for (let i = 0; i < (times%4 + 4)%4; i++) {
      let osx = this.sx,
          osy = this.sy,
          oex = this.ex,
          oey = this.ey;
          
      let newrepr = []
      let orepr = this.repr;
      this.sy = osx;
      this.sx = orepr.length-oey;
      this.ex = this.sx + oey-osy;
      this.ey = this.sy + oex-osx;
      for (let x = 0; x < orepr[0].length; x++) {
        let cline = [];
        for (let y = 0; y < orepr.length; y++) {
          cline.push(smartRotate(orepr[orepr.length-y-1][x]));
        }
        newrepr.push(cline);
      }
      this.repr = newrepr;
    }
    return this;
  }
  
  this.palindromize = function (...args) {
    for (let i = 0; i < args.length; i+= 4) {
      let mode = args[i];
      let mirrormode = args[i+1];
      let overlapSize = args[i+2];
      let overlapMode = args[i+3];
      if (mode == H) {
        let reversed = this.copy();
        if (mirrormode === "mirror") reversed.horizMirror();
        else if (mirrormode === "reverse") reversed.horizReverse();
        else if (mirrormode !== "no") throw "invalid mirror mode " + mirrormode;
        this.overlap(reversed, this.width()-overlapSize, 0, overlapMode);
      } else if (mode == V) {
        let reversed = this.copy();
        if (mirrormode === "mirror") reversed.vertMirror();
        else if (mirrormode === "reverse") reversed.vertReverse();
        else if (typeof mirrormode === "function") reversed.vertMirrorSmart(mirrormode);
        else if (mirrormode !== "no") throw "invalid mirror mode " + mirrormode;
        this.overlap(reversed, 0, this.height()-overlapSize, overlapMode);
      } else throw "invalid palindromizing mode " + mode;
    }
    return this;
  }
  this.c=a=>console.log(this.toDebugString());
}

function flatten (inp) {
  if (Array.isArray(inp)) {
    let out = [];
    for (let item of inp) {
      out = out.concat(flatten(item));
    }
    return out;
  } else return inp;
}
//new Canvas(["/-\\",["|",[" ",[[[["|"]]]]]],"+-+"]).set(-1,-3,'~').set(4,4,'_').get(-1,-3)

var simpleOverlap = (a, b) => {
  return b;
}

var noBGOverlap = (a, b) => {
  if (b == undefined) return a;
  return b;
}

var H = 1,
    V = 2;
var smartOverlap = (a, b) => smartOverlapDef(a, b, b);
var smartOverlapBehind = (a, b) => smartOverlapDef(a, b, a);
var smartOverlapDef = function (a, b, def) {
  if (a===undefined || a===" ") return b;
  if (b===undefined || b===" ") return a;
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
}

// NOTE: rotates clockwise
var smartRotate = function (chr) {
  var cycles = ["-|", "/\\", "<^>v", "_|"];
  var found = cycles.find(c=>c.includes(chr));
  if (found) return found[(found.indexOf(chr)+1) % found.length];
  return chr;
}

// var canvas0 = new Canvas(["/-\\",["|",[undefined,[[[["|"]]]]]],"+-+"]);
// var canvas1 = canvas0.copy().set(-1,-3,'~').set(6,6,'_').set(1,1,undefined);
// var canvas2 = canvas1.copy().overlap(canvas1, -2, 0, smcanvasOverlap).overlap(canvas1, -3, 1, smcanvasOverlap)
// var canvas10 = new Canvas("      _,.-\n   ,-'\\  _\n  /  _ \\  \n ,      \\ \n |-------\\");
// var canvas11 = canvas10.palindromize(H, "mirror", 1, smcanvasOverlap, V, (a, b) => smcanvasOverlapDef(a, b, a), 1, smcanvasOverlap);