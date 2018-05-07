var codepage = "⁰¹²³⁴⁵⁶⁷⁸⁹¶\n＋－（）［］｛｝＜＞‰ø＾◂←↑→↓↔↕ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~┌┐└┘├┤┬┴╴╵╶╷╋↖↗↘↙×÷±«»≤≥≡≠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９§‼¼½¾√／＼∑∙‽‾⇵∔：；⟳⤢⌐ŗ“”■？＊↶↷＠＃％！─│┼═║╫╪╬αω";

var version = 2;

var printableAsciiArr=[];
var sleepUpdate = true;
for (let i = 32; i < 127; i++) printableAsciiArr.push(String.fromCharCode(i));
var printableAscii = printableAsciiArr.join("");
var cPA = printableAscii + "¶ŗ"; // printable ascii in code

// a class to put on the stack - a marker of where `）` or `］` should end
function Break (id) {
  // 0 - user created
  // 1 - for loops
  this.id = id;
  this.toString = () => "("+ "⁰¹²³⁴⁵⁶⁷⁸⁹"[id];
}

async function run (program, inputs) {
  running = true;
  Canvas.background = " ";
  // program state variables
  var output = "";
  var vars = {};
  var inpCtr = 0;
  var remainders = [];
  var error;
  inputs = bigify(inputs);
  var programs = program.split("\n");
  var supVals = bigify([Infinity, 256, 13, 64, 11, 12, 16, 128, 0]);
  // the lines of a program go in items x-8, so main program is ⁹, ect.
  // inputs go below that, in reverse order - if there's only 1 line of program, the 1st input is ⁸ second - ⁷, ect.
  // each loop can modify its depthth item and the one after that in the above array.
  var setSup = (i, v) => {
    if (i>8 || i < 0) return;
    if (isJSNum(v)) v = B(v);
    supVals[i] = v;
  }
  for (let i = 0; i < programs.length; i++) {
    setSup(9-programs.length+i, () => programs[i]);
  }
  for (let i = 0; i < Math.min(inputs.length, 9); i++) {
    setSup(8-programs.length-i,inputs[i]);
  }
  function remainderPalindromize (art, x, y) {
    var xa = [], ya = [];
    if (x!=9) xa = [H, "mirror", x==2? getRemainder(0) : x, smartOverlap];
    if (y!=9) ya = [V, smartOverlapBehind, y==2? getRemainder(0) : y, smartOverlap];
    return art.palindromize(...xa, ...ya);
  }
  
  var ptrs;
  var cpo;
  
  var implicitOut = true;
  var stack = [];

  //function creation
  var lastArgs = [];
  var functions = {
    "｛": () => addPtr(new (function (init) {
      this.ptr = cpo.ptr;
      this.moveTo = function (where) {
        this.ptr = where;
        if (this.ptr >= this.endpt) {
          this.continue();
          this.ptr++;
          return "{"+(this.collect?"]":"}");
        }
      }
      this.obj = isNum(init)? urange(init) : init;
      this.iterptr = -1;
      this.endpt = endPt(this.ptr);
      this.startpt = this.ptr;
      
      // collection init
      this.collect = program[this.endpt]=="］";
      this.collectOne = program[this.endpt-1] == '：';
      if (this.collect) this.collection = [];
      
      this.continue = function(first) {
        
        if (this.collect && !first) {
          if (this.collectOne) this.collection.push(pop());
          else this.collection.push(...collectToArray());
        }
        
        this.iterptr++;
        if (debug > 1) console.log("`{` continue",this.obj.toString(), this.iterptr);
        if (this.iterptr >= this.obj.length) {
         this.break();
        } else {
          if (this.collect && !this.collectOne) push(new Break(1));
          push(this.obj[this.iterptr]);
          setSup(ptrs.length-2, this.obj[this.iterptr]);
          setSup(ptrs.length-1, this.iterptr+(isNum(init)? 0 : 1));
          this.ptr = this.startpt;
        }
      }
      this.break = function() {
        if (debug > 1) console.log("`{` break to", this.endpt+1, ptrs+"");
        layerDown(this.endpt+1);
        
        if (this.collect) push(this.collection); // collection end
      }
      this.init = () => this.continue(true);
      this.toString = () => `{loop "{${program[this.endpt]=="］"? "]" : "}"}"@${this.ptr} ${this.startpt}-${this.endpt}}`;
      this.toDebug = () => `@${this.ptr}, ${this.startpt}-${this.endpt}: loop {...${program[this.endpt]=="］"? "]" : "}"}` + (this.collect? ". Collected "+arrRepr(this.collection) : "");
    })(pop())),
    "［": () => addPtr(new (function (init) {
      this.ptr = cpo.ptr; 
      this.moveTo = function (where) {
        // console.log("moveTo",JSON.stringify(this.obj),this.iterptr,this.obj.length);
        this.ptr = where;
        if (this.ptr >= this.endpt) {
          this.continue();
          this.ptr++;
          return "["+(this.collect?"]":"}");
        }
      }
      this.obj = init;
      this.iterptr = B(isNum(this.obj)? 0 : -1);
      this.endpt = endPt(this.ptr);
      this.startpt = this.ptr;
      
      // collection init
      this.collect = program[this.endpt]=="］";
      this.collectOne = program[this.endpt-1] == '：';
      if (this.collect) this.collection = [];
      
      this.continue = function(first) {
        
        if (this.collect && !first) {
          if (this.collectOne) this.collection.push(pop());
          else this.collection.push(...collectToArray());
        }
        
        this.iterptr = this.iterptr.plus(1);
        if (debug > 1) console.log(`\`[${this.collect? "]": "}"}\` continue obj`,this.obj.toString(), "iptr", this.iterptr.toString());
        if (isArr(this.obj) || isStr(this.obj)) {
          if (this.iterptr.lt(this.obj.length)) {
            if (this.collect && !this.collectOne) push(new Break(1));
            push(this.obj.slice(0,+this.iterptr + 1));
            this.ptr = this.startpt;
            setSup(ptrs.length-2, this.obj[this.iterptr]);
            setSup(ptrs.length-1, this.obj.slice(0,+this.iterptr + 1));
            setSup(ptrs.length, this.iterptr.plus(1));
          } else this.break();
        } else {
          if (this.iterptr.lte(this.obj)) {
            if (this.collect && !this.collectOne) push(new Break(1));
            //push(this.obj[this.iterptr]);
            this.ptr = this.startpt;
            setSup(ptrs.length-2, this.iterptr);
            setSup(ptrs.length-1, this.iterptr.minus(1));
          } else this.break();
        }
      }
      this.break = function() {
        if (debug > 1) console.log(`\`[${this.collect? "]": "}"}\` break to`, this.endpt+1, JSON.stringify(ptrs));
        layerDown(this.endpt+1);
        
        if (this.collect) push(this.collection); // collection end
      }
      this.init = () => this.continue(true);
      this.toString = () => `{loop "[${program[this.endpt]=="］"? "]" : "}"}"@${this.ptr} ${this.startpt}-${this.endpt}}`
    })(pop())),
    "？": () => addPtr(new (function (init) {
      this.ptr = cpo.ptr; 
      this.moveTo = function (where) {
        // console.log("moveTo",JSON.stringify(this.obj),this.iterptr,this.obj.length);
        this.ptr = where;
        if (this.ptr >= this.endpt) {
          this.break();
          this.ptr++;
        }
      }
      this.obj = init;
      this.endpt = endPt(this.ptr);
      this.startpt = this.ptr;
      this.continue = function() {
        this.ptr = this.startpt;
      }
      this.break = function() {
        if (debug > 1) console.log("`[` break to", this.endpt+1, JSON.stringify(ptrs));
        layerDown(this.endpt+1);
      }
      this.init = () => truthy(this.obj)? this.continue() : this.break();
      this.toString = () => `?if "[${program[this.endpt]=="］"? "]" : "}"}"@${this.ptr} ${this.startpt}-${this.endpt}}`
    })(pop())),
    "‽": () => addPtr(new (function (init) {
      this.ptr = cpo.ptr;
      this.moveTo = function (where) {
        // console.log("moveTo",JSON.stringify(this.obj),this.iterptr,this.obj.length);
        this.ptr = where;
        if (this.ptr >= this.endpt) {
          this.break();
          this.ptr++;
        }
      }
      this.obj = init;
      this.endpt = endPt(this.ptr);
      this.startpt = this.ptr;
      this.continue = function() {
        this.ptr = this.startpt;
      }
      this.break = function() {
        if (debug > 1) console.log("`[` break to", this.endpt+1, JSON.stringify(ptrs));
        layerDown(this.endpt+1);
      }
      this.init = () => falsy(this.obj)? this.continue() : this.break();
      this.toString = () => `?if "[${program[this.endpt]=="］"? "]" : "}"}"@${this.ptr} ${this.startpt}-${this.endpt}}`
    })(pop())),
    
    "Ｗ": () => addPtr(new (function (init) {
      this.ptr = cpo.ptr;
      this.moveTo = function (where) { // console.log("moveTo",JSON.stringify(this.obj),this.iterptr,this.obj.length);
        this.ptr = where;
        if (this.ptr >= this.endpt) {
          this.continue();
          this.ptr++;
        }
      }
      this.iterptr = -1;
      this.endpt = endPt(this.ptr);
      this.startpt = this.ptr;
      
      this.mode = program[this.endpt]=="］"; // TODO
      
      this.continue = function(first) {
        
        this.iterptr++;
        if (debug > 1) console.log("`Ｗ` continue",this.obj.toString(), this.iterptr);
        if (falsy(pop())) {
         this.break();
        } else {
          setSup(ptrs.length-2, this.iterptr+1);
          this.ptr = this.startpt;
        }
      }
      this.break = function() {
        if (debug > 1) console.log("`Ｗ` break to", this.endpt+1, ptrs+"");
        layerDown(this.endpt+1);
        
      }
      this.init = () => this.continue(true);
      this.toString = () => `{loop "{${program[this.endpt]=="］"? "]" : "}"}"@${this.ptr} ${this.startpt}-${this.endpt}}`
    })(pop())),
    "ω": () => push(lastArgs.slice(-1)[0]),
    "α": () => push(lastArgs.slice(-2)[0]),
    "⁰": () => {
      let utype = type(get(1));
      let res = [];
      while (type(get(1)) == utype) {
        res.splice(0, 0, pop());
      }
      push(res);
    },
    "（": () => push(new Break(0)),
    "＃": () => {
      let res = eval(pop());
      if (res != undefined) push(res);
    },
    "｝": () => {},
    "］": () => {},
  }
  
  //simple functions
  var simpleFunctions = {
    // math
    "＋": {
      NN: (a, b) => a.plus(b),
      SS: (a, b) => a+b,
      NS: (a, b) => a+b,
      SN: (a, b) => a+b,
      tt: (a, b) => a.appendHorizontally(b),
      // default: (a, b) => (isArr(a)? a : [a]).concat(b),
    },
    "∔": {
      NN: (a, b) => b.subtract(a),
      AA: (a, b) => a.concat(b),
      AT: (a, b) => (a.push(b), a),
      TA: (a, b) => (b.splice(0, 0, a), b),
      aa: (a, b) => a.appendVertically(b),
    },
    "－": (a, b) => a.minus(b),
    "×": {
      NN: (a, b) => a.multiply(b),
      SN: (s, n) => s.repeat(n),
      NS: (n, s, ex) => ex("SN", s,n),
      aN: (a, n) => {
        let na = new Canvas();
        for (let i = 0; i < n; i++) {
          na.appendHorizontally(a);
        }
        return na;
      },
      Na: (n, a, ex) => ex("aN", a, n),
      aa: (a, b) => b.appendHorizontally(a),
    },
    "＊": {
      // TODO: AN, NA
      SS: (a, b) => [...a].join(b),
      AS: (a, s) => a.join(s),
      SA: (s, a) => a.join(s),
      aa: (a, b, ex) => ex("SS", a.toString(), b.toString()),
      aN: (a, n) => {
        let na = new Canvas();
        for (let i = 0; i < n; i++) {
          na.appendVertically(a);
        }
        return na;
      },
      Na: (n, a, ex) => ex("aN", a, n),
      aNN: (a, w, h) => {
        let na = new Canvas();
        a.forEach((chr, x, y) => {
          for (let xp = 0; xp < w; xp++)
            for (let yp = 0; yp < h; yp++)
              na.set(x*w + xp, y*h + yp, chr);
        });
        return na;
      },
    },
    "÷" : (a,b) => b.eq(0)? a : a.divide(b),
    "％": (a,b) => a.remainder(b),
    "√": (a) => a.sqrt(),
    "＾": (a, b) => a.pow(b.floatValue()),
    "＜": (a, b) => +a.lt(b),
    "＞": (a, b) => +a.gt(b),
    "≡": (a, b) => + equal(a,b),
    "≠": (a, b) => +!equal(a,b),
    "┬": (a, b) => {
      var res = [];
      if (b.eq(1)) return new Array(+a).fill(Big.ONE);
      while (!a.eq(0)) {
        res.push(a.mod(b));
        a = a.divide(b).round(0, Big.ROUND_FLOOR);
      }
      return res.length? res.reverse() : [Big.ZERO];
    },
    "┴": {
      AN: (a, b) => a.reduce((crnt,dig)=>crnt.mul(b).add(dig), Big.ZERO),
      NA: (b, a, ex) => ex("AN", a, b),
    },
    
    // array & ascii-art manipulation
    "∑": {
      A: (a) => {
        checkIsNums = (a) => isArr(a)? a.every(checkIsNums) : isNum(a);
        let reduceType;
        if (checkIsNums(a)) reduceType = (a,b) => a.plus(b);
        else reduceType = (a,b) => a+""+b;
        sumArr = (a) => a.map(c => isArr(c)? sumArr(c) : c).reduce(reduceType);
        return sumArr(a);
      }
    },
    "＠": {
      AN: (a, n) => a[((n.intValue()-1)%a.length+a.length)%a.length],
      NA: (n, a, ex) => ex("AN", a, n),
      NS: (n, s, ex) => ex("AN", s, n),
      SN: (s, n, ex) => ex("AN", s, n),
      aNN: (a, x, y) => a.getChr(x.intValue()-1, y.intValue()-1),
      aNNNN: (a, x, y, w, h) => a.subsection(x.intValue()-1, y.intValue()-1, x.intValue()-1+w.intValue(), y.intValue()-1+h.intValue()),
    },
    "±": {
      S: (s) => new Canvas(s).horizReverse().toString(), // [...s].reduce((a,b)=>b+a)
      N: (n) => B(0).minus(n),
      A: (a) => new Canvas(a).horizReverse().toArr(),
      a: (a) => a.horizReverse(),
    },
    "╋": {
      SSS: (a,b,c) => a.split(b).join(c),
      aaNN: (a, b, x, y) => a.overlap(b, x.minus(1), y.minus(1), smartOverlap),
      length: 4,
      default: (a, b, c, d, ex) => ex("aaNN", ...orderAs("aaNN", a, b, c, d)),
    },
    "╋╋": {
      aaNN: (a, b, x, y) => a.overlap(b, x.minus(1), y.minus(1), simpleOverlap),
      length: 4,
      default: (a, b, c, d, ex) => ex("aaNN", ...orderAs("aaNN", a, b, c, d)),
    },
    "⇵": {
      N: (n) => (a=n.divideAndRemainder(2), remainders.push(a[1]), a[0].plus(a[1])),
      A: (a) => a.reverse(),
      a: (a) => a.vertReverse(),
    },
    "↔": {
      a: (a) => a.horizMirror(),
    },
    "↕": {
      a: (a) => a.vertMirrorSmart(smartOverlapBehind),
      N: (n) => (a=n.divideAndRemainder(2), remainders.push(a[1]), a[0]),
    },
    "ｍ": {
      SN: (s, n) => s.substring(0, +n),
      AN: (a, n) => a.slice(0, n),
      aN: (a, n) => a.subsection(0, 0, +n).toString(),
      
      NS: (n, s, ex) => ex("SN", s, n),
      NA: (n, a, ex) => ex("AN", a, n),
      Na: (n, a, ex) => ex("aN", a, n),
    },
    "ｎ": {
      AN: (a, n) => {
        var out = [];
        var curr = [];
        for (let i = 0; i < a.length; i++) {
          if (i%n === 0 && i !== 0) {
            out.push(curr);
            curr = [];
          }
          curr.push(a[i]);
        }
        if (curr.length > 0) out.push(curr);
        return out;
      },
      NA: (n, a, ex) => ex("AN", a, n),
      SN: (s, n, ex) => ex("AN", s.split(""), n).map(c => c.join("")),
      NS: (n, s, ex) => ex("SN", s, n),
      aa: (a, b) => a.overlap(b, 0, 0, smartOverlap),
      NN: (a, b) => {push(...a.divideAndRemainder(b));},
    },
    "⤢": {
      // TODO: A:
      a: (a) => a.horizMirror().vertMirror(),
      N: (n) => n.abs(),
    },
    "ｊ": {
      _A: (a) => {a.splice(0, 1)},
      S: (s) => s.slice(1),
      a: (a) => (a.repr.splice(0, 1), a.ey--, a),
    },
    "ｋ": {
      _A: (a) => {a.pop()},
      S: (s) => s.slice(0, -1),
      a: (a) => (a.repr.pop(), a.ey--, a),
    },
    "Ｊ": {
      _A: (a) => (a.splice(0, 1)[0]),
      S: (s) => {
        res = a.slice(0, 1);
        push(s.slice(1));
        push(...res);
      },
      a: (a) => {
        let i = a.subsection(-a.sx,-a.sy,a.width-a.sx,1-a.sy);
        a.repr.shift();
        a.ey--;
        push(a);
        push(i.toString());
      },
    },
    "Ｋ": {
      _A: (a) => (a.pop()),
      S: (s) => {
        res = s.slice(-1);
        push(s.slice(0, -1));
        push(res);
      },
      a: (a) => {
        let i = a.subsection(-a.sx,a.height-1-a.sy,a.width-a.sx,a.height-a.sy).toString();
        a.repr.pop();
        a.ey--;
        push(a);
        push(i);
      },
    },
    "Ｄ": {
      A: (a) => {
        let out = [];
        for (let item of a) {
          if (out.every((c) => !equal(c, item))) out.push(item);
        }
        return out;
      },
    },
    "ｅ": {
      aa: (a, s) => s.copy().appendHorizontally(a).appendHorizontally(s),
    },
    "‼": {
      N: (n) => +!n.eq(0),
      S: (s) => s.length != 0,
      a: (a) => new Canvas(a.repr),
    },
    // string manipulation
    "Ｓ": {
      S: (s) => s.split(" "),
    },
    "ｓ": {
      SS: (a, b) => a.split(b),
      SN: (a, b) => a.split(b),
    },
    "ｃ": {
      N: (n) => String.fromCodePoint(n),
      S: (s) => s.length==1? s.charCodeAt(0) : [...s].map(chr=>chr.charCodeAt(0)),
      a: (a) => a.repr.map(ln=>ln.map(chr=>chr? chr.charCodeAt(0) : 0)),
    },
    
    
    //palindromizators
    "─": {
      a: (a) => a.palindromize(V, smartOverlapBehind, 1, smartOverlap),
    },
    "──": {
      a: (a) => a.palindromize(V, "reverse", 1, simpleOverlap),
    },
    "═": {
      a: (a) => a.palindromize(V, smartOverlapBehind, 0, smartOverlap),
    },
    "══": {
      a: (a) => a.palindromize(V, "reverse", 0, simpleOverlap),
    },
    "│": {
      a: (a) => a.palindromize(H, "mirror", 1, smartOverlap),
    },
    "││": {
      a: (a) => a.palindromize(H, "reverse", 1, simpleOverlap),
    },
    "║": {
      a: (a) => a.palindromize(H, "mirror", 0, smartOverlap),
    },
    "║║": {
      a: (a) => a.palindromize(H, "reverse", 0, simpleOverlap),
    },
    "┼": {
      a: (a) => a.palindromize(H, "mirror", 1, smartOverlap, V, smartOverlapBehind, 1, smartOverlap),
    },
    "┼┼": {
      a: (a) => a.palindromize(H, "reverse", 1, simpleOverlap, V, "reverse", 1, simpleOverlap),
    },
    "╫": {
      a: (a) => a.palindromize(H, "mirror", 0, smartOverlap, V, smartOverlapBehind, 1, smartOverlap),
    },
    "╫╫": {
      a: (a) => a.palindromize(H, "reverse", 0, simpleOverlap, V, "reverse", 1, simpleOverlap),
    },
    "╪": {
      a: (a) => a.palindromize(H, "mirror", 1, smartOverlap, V, smartOverlapBehind, 0, smartOverlap),
    },
    "╪╪": {
      a: (a) => a.palindromize(H, "reverse", 1, simpleOverlap, V, "reverse", 0, simpleOverlap),
    },
    "╬": {
      a: (a) => a.palindromize(H, "mirror", 0, smartOverlap, V, smartOverlapBehind, 0, smartOverlap),
    },
    "╬╬": {
      a: (a) => a.palindromize(H, "reverse", 0, simpleOverlap, V, "reverse", 0, simpleOverlap),
    },
    
    
    "╬│": {
      a: (a) => a.palindromize(H, "mirror", getRemainder(0), smartOverlap, V, smartOverlapBehind, 0, smartOverlap),
    },
    "╬┼": {
      a: (a) => a.palindromize(H, "mirror", getRemainder(1), smartOverlap, V, smartOverlapBehind, getRemainder(0), smartOverlap)
    },
    "┼╬": {
      a: (a) => a.palindromize(H, "mirror", getRemainder(0), smartOverlap, V, smartOverlapBehind, getRemainder(1), smartOverlap)
    },
    
    
    "║│": {
      a: (a) => remainderPalindromize(a, 2,9),
    },
    "═─": {
      a: (a) => remainderPalindromize(a, 9,2),
    },
    "╬─": {
      a: (a) => remainderPalindromize(a, 0,2),
    },
    "╪─": {
      a: (a) => remainderPalindromize(a, 1,2),
    },
    "╬│": {
      a: (a) => remainderPalindromize(a, 2,0),
    },
    "╫│": {
      a: (a) => remainderPalindromize(a, 2,1),
    },
    
    // rotators
    "⟳": {
      a: (a) => a.rotate(1),
      aN: (a, n) => a.rotate(n),
    },
    "↶": {
      a: (a) => a.rotate(-1, smartRotate),
    },
    "↷": {
      a: (a) => a.rotate(1, smartRotate),
      aN: (a, n) => a.rotate(n, smartRotate),
    },
    
    // useful shorter math stuff
    "«": {
      N: (n) => n.multiply(2),
      S: (s) => s.substring(1)+s.charAt(0),
      A: (a) => a.slice(1).concat(a[0]),
      a: (a) => a.subsection(1, 0).appendHorizontally(a.subsection(0, 0, 1)),
    },
    "»": {
      N: (n) => (a=n.divideAndRemainder(2), remainders.push(a[1]), a[0]),
      S: (s) => s.slice(-1).concat(s.slice(0,-1)),
      A: (a) => a.slice(-1)+a.slice(0,-1),
      a: (a) => a.subsection(-1, 0).appendHorizontally(a.subsection(0, 0, -1)),
    },
    "╵": {
      N: (n) => n.plus(1),
      S: (s) => s.replace(/(^|[.?!]\s*)(\w)/g, (a,b,c)=>b+c.toUpperCase()),
    },
    "╷": {
      N: (n) => n.minus(1),
      S: (s) => s.replace(/(^|\W)(\w)/g, (a,b,c)=>b+c.toUpperCase()),
    },
    "├": {
      N: (n) =>  n.plus(2),
    },
    "┤": {
      N: (n) => n.minus(2),
      S: (s) => new Big(s),
      A: (a) => {
        for (let item of a) push(item);
      },
    },
    "½": {
      N: (n) => n.divide(2),
    },
    
    // stack manipulation
    "）": collectToArray,
    "；": (a,b) => {push(b); push(a)},
    "：": () => {push(get(1));},
    "⌐": () => {push(get(1)); push(get(1))},
    "┌": () => (push(get(2))),
    "┐": (_) => {},
    "└": (a, b, c) => {push(b); push(a); push(c)},
    "┘": (a, b, c) => {push(b); push(c); push(a)},
    
    
    // generators
    "∙": () => {
      if (cPA.includes(program[cpo.ptr-1]) ^ cPA.includes(program[cpo.ptr+1])) return " ";
    },
    "ｒ": {
      n: (a) => lrange(a),
      aS: (a, S) => (a.background=S, a),
      a: (a) => {
        var res = new Canvas();
        var longest = 0;
        var start = Infinity;
        for (let y = a.sy; y < a.ey; y++) {
          var ln = a.trimmedLine(y);
          if (ln.length > longest) longest = ln.length;
          var s = a.repr[y-a.sy];
          var st = 0;
          while (st < s.length && s[st] === undefined) st++;
          if (start > st) start = st;
        }
        for (let y = a.sy; y < a.ey; y++) {
          var ln = a.trimmedLine(y);
          for (let x = 0; x < ln.length; x++) {
            res.set(Math.floor((longest-ln.length)/2)+x, y, ln[x]);
          }
        }
        return res;
      },
    },
    "Ｒ": {
      N: (a) => urange(a),
      S: (s) => {Canvas.background = s},
    },
    "╶": nextInp,
    "╴": () => currInp(),
    "Ａ": () => 10,
    "ø": () => new Canvas(),
    "ｚ": () => "abcdefghijklmnopqrstuvwxyz",
    "Ｚ": () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    "◂": () => "0123456789",
    "◂◂": () => ["1234567890","qwertyuiop","asdfghjkl","zxcvbnm"],
    "Ｃ": () => " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
    "＼": {
      S: (s) => {
        var res = new Canvas();
        // new Canvas(Array.from(s).map((c, i) => " ".repeat(s.length-i-1)+c)),
        for (let i = 0; i < s.length; i++) res.set(i, i, s[i]);
        return res;
      },
      a: (a) => {
        var res = new Canvas();
        a.forEachChar((chr, x, y) => res.set(x+y, y, chr));
        return res;
      },
      N: (n, ex) => ex("S", "\\".repeat(n)),
    },
    "／": {
      S: (s) => {
        var res = new Canvas();
        // new Canvas(Array.from(s).map((c, i) => " ".repeat(s.length-i-1)+c)),
        for (let i = 0; i < s.length; i++) res.set(s.length-i-1, i, s[i]);
        return res;
      },
      a: (a) => {
        var res = new Canvas();
        a.forEachChar((chr, x, y) => res.set(a.width-y+x-1, y, chr));
        return res;
      },
      N: (n, ex) => ex("S", "/".repeat(n)),
    },
    
    "ｌ": {
      _S: (a) => a.length,
      _A: (a) => a.length,
      _N: (a) => a.toString().length,
      _a: (a) => a.height,
    },
    "Ｌ": {
      S: (a) => a.length,
      A: (a) => a.length,
      N: (a) => a.toString().length,
      _a: (a) => a.width,
    },
    
    //variables
    "ｘ": () => vars['x'],
    "ｙ": () => vars['y'],
    "Ｘ": (a) => {vars['x'] = a},
    "Ｙ": (a) => {vars['y'] = a},
    
    
    // outputing
    "Ｏ": () => outputFS(true, true, false),
    "ｏ": () => outputFS(true, false, false),
    "Ｔ": () => outputFS(false, true, true),
    "ｔ": () => outputFS(false, false, true),
    "Ｑ": () => outputFS(false, true, false),
    "ｑ": () => outputFS(false, false, false),
    "Ｐ": () => outputFS(true, true, true),
    "ｐ": () => outputFS(true, false, true),
    
    
    "Ｕ": {
      A: "vectorise",
      S: (a) => a.toUpperCase(),
      N: (a) => a.round(0, Big.ROUND_CEILING),
    },
    "ｕ": {
      A: "vectorise",
      S: (a) => a.toLowerCase(),
      N: (a) => a.round(0, Big.ROUND_FLOOR),
    },
    "ｒａｗ": (a) => {
      println(arrRepr(a));
    }
  }
  // if (debug > 1) console.log("simple functions:",Object.keys(simpleFunctions).map(c=>c+":"+simpleFunctions[c].length));
  
  //add numbers to simple functions
  for (let i = 0; i < 10; i++)
    simpleFunctions["０１２３４５６７８９"[i]] = () => new Big(i);
  for (let i = 0; i < 9; i++)
    functions["¹²³⁴⁵⁶⁷⁸⁹"[i]] = () => {
      if (isFn(supVals[i])) executeHere(supVals[i]());
      else push(supVals[i]);
    };
  
  for (let key in simpleFunctions) {
    functions[key] = function (mode) {
      // mode 1 = return function TODO
      // mode 2 = is non-default function available
      let fn = simpleFunctions[key];
      let ofn = fn;
      let matchingKey;
      if (mode == 2 && isFn(fn)) return true;
      if (!isFn(fn)) {
        let paramTypes = "";
        for (let i = 0; i < 4; i++) {
          let item = get(i+1);
          paramTypes = type(item)+paramTypes;
        }
        let newfn;
        for (let currentKey in fn) {
          let regkey = currentKey.replace(/a/g, "[aAS]").replace(/[tT]/g, "[aASN]").replace(/s/g, "[SN]").replace(/_/g, "")+"$";
          if (debug > 2) console.log(regkey, "tested on", paramTypes);
          if (new RegExp(regkey).test(paramTypes)) {
            matchingKey = currentKey;
            newfn = fn[matchingKey];
            break;
          }
        }
        if (isFn(newfn)) {
          if (mode == 2) return true;
          fn = newfn;
        } else {
          if (mode == 2) return false;
          fn = fn.default;
          if (!isFn(fn)) {
            console.log("no appropriate function found for "+key+" with params "+paramTypes);
          }
        }
      }
      let params = [];
      let popCtr = 1;
      let toRemove = [];
      let rawTypes;
      if (matchingKey) rawTypes = matchingKey.replace(/_/g, "");
      for (let i = 0; i < Math.min(ofn.length? ofn.length : 10, ((matchingKey || fn).length)); i++) {
        let item = get(popCtr);
        if (matchingKey && matchingKey[i] == "_") i++;
        else toRemove.splice(0, 0, popCtr);
        if (matchingKey) item = cast(item, rawTypes[rawTypes.length-popCtr]);
        params.push(item);
        popCtr++;
      }
      params.reverse();
      for (let fromTop of toRemove) {
        remove(fromTop);
      }
      lastArgs.push(...params.map(copy));
      //console.log("simpleFunction params: ",params,lastArgs);
      let ex = (which, ...newParams) => ofn[which](...newParams);
      let res = fn(...params, ex);
      if (isJSNum(res)) res = B(res);
      if (res !== undefined) push(res);
    }
  }
  if (debug > 1) console.log("functions:",Object.keys(functions));
  
  
  
  // PREPROCESSING
  
  programs = programs.map((cl) => {
    program = cl;
    while (endPt(-1, true) !== undefined) program = "｛"+program;
    return program;
  });
  
  if (debug) console.log("programs: ",programs);
  
  program = programs[programs.length-1];
  
  ptrs = [{
    ptr:0,
    startpt:0,
    endpt:program.length,
    continue: () => {layerDown(cpo.endpt)},
    moveTo: function (where) {cpo.ptr = where; if (cpo.ptr >= cpo.endpt) return cpo.continue();},
    toString: () => "{mptr}",
    toDebug: () => `@${ptrs[0].ptr}, 0-${ptrs[0].endpt}: main program`,
  }];
  cpo = ptrs[0];
  
  function redrawDebug(name) {
    var selStart = pptr;
    var selEnd = nextIns(pptr);
    if (cpo.ptr < pptr || !gotoNextIns) { selStart++; selEnd++ }
    codeState.innerHTML = '<span class="code">' + program.substring(0,selStart) + '</span>'
                        + '<span class="code sel">' + program.substring(selStart,selEnd) + '</span>'
                        + '<span class="code">' + program.substring(selEnd) + '</span>';
    stateX.innerText = arrRepr(vars.x);
    stateY.innerText = arrRepr(vars.y);
    var lastOfLA = lastArgs.slice(-2);
    stateAlpha.innerText = arrRepr(lastOfLA[0]);
    stateOmega.innerText = arrRepr(lastOfLA[1]);
    stateRemainders.innerText = arrRepr(remainders.slice(-3));
    stateSups.innerText = supVals.map((c,i)=>["¹²³⁴⁵⁶⁷⁸⁹"[i] + ":", c]).filter(c=>typeof c[1] !== 'function').map(c=>c[0] + arrRepr(c[1])).join(", ");
    bgState.innerText = quotify(Canvas.background, `"`);
    
    ptrstackState.innerText = ptrs.map(c=>c.toDebug? c.toDebug() : c.toString()).join("\n");
    var ar, width;
    stackState.innerHTML = stack.map(c => (
      ar=c instanceof Canvas? c.toDebugString(true) : arrRepr(c),
      width=Math.max(50,
          Math.min(250,
            ar.split("\n").map(
              c=>c.length
            ).reduce(
              (a,b)=>Math.max(a,b), 0
            )*8.7
          )
        ),
      `<textarea class="stackItem" style="width:${width}px;height:${Math.min(250,Math.max(50,Math.max(ar.split("\n").length*17+30, ar.length/(width/8.7)*17+30)))}px" readonly>${ar}</textarea>`
    )).join("");
  }
  
  async function debugIns(name) {
    if (!debug) return;
    
    if (stepping) redrawDebug(name);
    if (!name) name = program[pptr];
    if (name !== "redraw")
      console.log(`${name} @${pptr}${(pptr != cpo.ptr && gotoNextIns)? `-${cpo.ptr}` : pptr != nextIns(pptr)-1? `-${nextIns(pptr)-1}` : ""}: ${arrRepr(stack, true)}`+(debug>1? `    depth = ${ptrs.length} current pointer: ${cpo.startpt}-${cpo.endpt}` : ""));
    if (stepping) {
      while (!stepNow) await sleep(33);
      stepNow = false;
    }
  }
  await debugIns("redraw");
  //===================================================PROGRAM EXECUTION===================================================
  var gotoNextIns = true;
  while (ptrs.length > 0 && program.length > 0) {
    if (sleepUpdate) await sleep(0);
    let executeNow = cpo.ptr < program.length;
    error = "";
    var nextInsPtr = nextIns(cpo.ptr);
    if (executeNow) {
      try {
        if (debug > 2) console.log("before exec: ptr", cpo.ptr, "endpt", cpo.endpt);
        if (debug) var pptr = cpo.ptr; // previous pointer
        execAt(cpo.ptr);
      } catch (e) {
        console.log(error+":");
        console.log(e);
      }
    }
    if (executeNow) await debugIns();
    if (gotoNextIns) {
      let temp = cpo.moveTo(nextInsPtr);
      if (temp) await debugIns(temp);
    }
    else if (debug > 2) console.log("gotoNextIns skipped");
    if (cpo.afterDebug) cpo.afterDebug();
    gotoNextIns = true;
  }
  if (implicitOut) outputFS(true,true,true);
  result.value = printableOut();
  
  await debugIns("redraw");
  running = false;
  if (stepping) stopStepping();
  //helper functions
  function layerDown(ptr) {
    ptrs.pop();
    if (ptrs.length === 0) return;
    cpo = ptrs[ptrs.length-1];
    if (ptr !== undefined) cpo.moveTo(ptr);
    if (debug > 1) console.log("layer down to layer",ptrs.length,"@"+cpo.ptr);
    gotoNextIns = false;
  }
  function executeHere (newPr) {
    addPtr(new (function (myPr, oldPr) {
      this.ptr = 0;
      this.moveTo = function (where) {
        this.ptr = where;
        if (this.ptr >= this.endpt) return this.continue();
      }
      this.startpt = 0;
      this.oldPr = oldPr;
      this.myPr = myPr;
      this.endpt = this.myPr.length;
      
      this.initialized = false;
      this.endNow = false;
      
      this.continue = function() {
        this.break();
      }
      this.break = function() {
        this.endNow = true;
      }
      this.init = () => {
        gotoNextIns = false;
      };
      this.afterDebug = () => {
        if (this.endNow) {
          program = this.oldPr;
          layerDown();
          toNextIns();
          if (debug > 1) console.log("exiting helper program");
        }
        if (!this.initialized) {
          this.initialized = true;
          program = this.myPr;
          if (debug) console.log("executing helper program", program);
        }
      }
      this.toString = () => `{eH @${this.ptr} ${this.startpt}-${this.endpt}}`
    })(newPr, program));
  }
  function addPtr (po) {
    ptrs.push(po);
    cpo = po;
    cpo.init();
  }
  function nextIns (index) {
    if (cPA.includes(program[index])) {
      while (cPA.includes(program[index+1])) index++;
      return index+1;
    }
    let multibyte = Object.keys(functions).filter(c => c.length>1).find(key => key.split("").every((char,i)=>program[index+i] == char) && functions[key].length > 0 && functions[key](2));
    if (multibyte) {
      return index+multibyte.length;
    }
    return index+1;
  }
  function toNextIns() {
    cpo.moveTo(nextIns(cpo.ptr));
  }
  
  function execAt (index) {
    var exc = program.slice(index, nextIns(index));
    if (exc.length > 0 && exc.split("").every(c=>cPA.includes(c))) {
      push(prepareStr(program.substring(index, nextIns(index)).replace(/¶/g,"\n")));
      return;
    }
    if (functions[exc] === undefined) {
      console.log(`the function ${exc}@${index} doesn't exist`);
      push(exc);
    } else {
      let func = functions[exc];
      error = `call to ${exc}@${index} failed`;
      func();
    }
  }
  
  function outputFS (shouldPop, newline, noImpOut) { // output from stack
    var item = pop();
    if (!shouldPop) push(item);
    if (noImpOut) implicitOut = false;
    if (newline) println(item);
    else print(item);
  }
  function print (what) {
    output+= strRepr(what);
  }
  function println (what) {
    output+= "\n"+strRepr(what);
  }
  
  function currInp (next) {
    if (!next) next = 0;
    return inputs[(inpCtr+next-1)%inputs.length];
  }
  
  function nextInp() {
    out = currInp(1);
    inpCtr++;
    inpCtr%= inputs.length;
    return out;
  }
  
  // gets an item from the stack
  function get(ift) { // item from top; 1 = top, 2 = 2nd from top, ect.
    if (!ift) ift = 1;
    var ptr = stack.length;
    while (ptr > 0 && ift != 0) {
      ptr--;
      if (!(stack[ptr] instanceof Break)) ift--;
    }
    if (ift == 0) return stack[ptr];
    return currInp(ift);
  }
  function equal(a, b) {
    if (type(a)!=type(b)) return false;
    if (isArr(a)) return a.every((c,i)=>equal(c,b[i]));
    if (isNum(a)) return a.eq(b);
    if (isStr(a)) return a===b;
    if (isArt(a)) return equal(a.repr, b.repr);// TODO: this should be improved (i'm lazy)
    throw "no eq test for "+a+";"+b;
  }
  function pop(ift) { // item from top; 1 = top, 2 = 2nd from top, ect.
    // var ptr = stack.length-1;
    // while (ptr >= 0) {
    //   if (!(stack[ptr] instanceof Break)) return stack.splice(ptr,1)[0];
    //   ptr--;
    // }
    // return nextInp();
    if (!ift) ift = 1;
    let item = get(ift);
    remove(ift);
    return item;
  }
  function remove(ift) {
    if (!ift) ift = 1;
    var ptr = stack.length;
    while (ptr > 0 && ift > 0) {
      ptr--;
      if (!(stack[ptr] instanceof Break)) ift--;
    }
    while (ift > 0) {
      stack.splice(0, 0, nextInp());
      ift--;
    }
    return stack.splice(ptr,1)[0];
  }
  function push (...item) {
    stack.push(...item.map(c=>
      isStr(c) && c.includes("\n")?
        new Canvas(c) : copy(c)
      )
    );
  }
  function collectToArray() {
    var collected = [];
    while (stack.length > 0 && !(stack[stack.length-1] instanceof Break)) {
      collected.splice(0, 0, stack.pop());
    }
    stack.pop();
    return collected;
  }
  
  function endPt (sindex, undefinedOnProgramEnd) {
    var ind = sindex;
    var bstk = [];
    var lvl = 1;
    while (lvl > 0) { // console.log(lvl, ind, program[ind], bstk);
      ind = nextIns(ind);
      if (program[ind] === "［" || program[ind] === "｛" || program[ind] === "？" || program[ind] === "‽") {
        bstk.push(program[ind]);
        lvl++;
      }
      if (program[ind] === "｝" || program[ind] === "］") {
        let echr = program[ind];
        let back = false;
        switch (bstk[bstk.length-1]) {
          case "［":
          case "｛":
          case "‽":
            back = true;
          break;
          case "？":
            if (echr === "｝") back = true;
          break;
          default:
            back = true;
        }
        if (back) {
          lvl--;
          bstk.pop();
        }
      }
      if (ind >= program.length) return undefinedOnProgramEnd? undefined : program.length;
    }
    return ind;
  }
  
  function printableOut() { // output with 2 trailing and leading newlines removed
    return output.replace(/^\n{0,2}|\n{0,2}$/g,"");
  }
  function getRemainder (ift) {
    return remainders[remainders.length-1 - (ift%remainders.length)];
  }
  
  function prepareStr (str) {
    return str.replace(/ŗ/g, () => pop());
  }
  function cast (item, rt) {
    if (type(item) == rt || rt == "T") return item;
    if (rt == 'N') return B(item.toString().replace(",","."));
    if (rt == 'a' || rt == 't') return new Canvas(item);
    if (rt == 'S' || rt == 's') return rt.toString();
    throw `cast error from ${type(item)} to ${rt}: ${item} (probably casting to array which is strange & unsupported)`;
  }
  function copy (item) {
    if (isArr(item)) return item.map((c) => copy(c));
    if (isArt(item)) return new Canvas(item);
    if (isNum(item)) return new Big(item);
    return item;
  }
  function orderAs (order, ...params) {
    let ppt = params.map((c) => [c, type(c)]); //params plus type
    for (let i = 0; i < ppt.length; i++) {
      let curType = ppt[1];
      let resType = order[i];
      if (!subType(curType, resType)) {
        let index = i + ppt.slice(i).findIndex(c=>subType(c[1], resType));
        ppt.splice(i,0,ppt.splice(index,1)[0]);
      }
    }
    return ppt.map((c) => c[0])
  }
  function subType (a, b) { // is `a` a subtype of `b`?
    if (a==b) return true;
    if (b=="a" && "AS".includes(a)) return true;
    return false;
  }
  
  function irange (s, e) {//inclusive range
    var out = [];
    for (let b = B(s); b.lte(e); b = b.plus(1)) {
      out.push(b);
    }
    return out;
  }
  function urange (e) { // upper range - range [1; arg]
    return irange(1, e);
  }
  function lrange (e) { // lower range - range [1; arg]
    return irange(0, e.minus(1));
  }
  
  function isArr (item) {
    return item instanceof Array;
  }
  function isArt (item) {
    return item instanceof Canvas;
  }
  function isStr (item) {
    return typeof item === "string";
  }
  function isNum (item) {
    return item instanceof Big;
  }
  
  
  function isJSNum (item) {
    return typeof item === "number";
  }
  function isFn (item) {
    return item instanceof Function
  }
  
  function type (item) {
    if (isArt(item)) return "a";
    if (isArr(item)) return "A";
    if (isStr(item)) return "S";
    if (isNum(item)) return "N";
  }
  
  function strRepr (item) {
    if (isArr(item)) return item.map(join).join("\n");
    else return item.toString();
  }
  function arrRepr (item) {
    if (item === undefined) return "---";
    if (isArr(item)) return `[${item.map(arrRepr).join(", ")}]`;
    if (isArt(item)) return quotify(item, "`");
    if (isStr(item)) return quotify(item, `"`);
    if (isNum(item)) return item+"";
    return item.toString();
  }
  function quotify (what, qt) {
    if (isArt(what)) what = what.toDebugString();
    else what = what.toString();
    var ml = what.includes("\n");
    return (qt+qt+qt+"\n").slice(0, ml? 4 : 1) + what + ("\n"+qt+qt+qt).slice(ml? 0 : 3)
  }
  function bigify (item) {
    var out = [];
    for (citem of item) {
      if (isArr(citem)) citem = bigify(citem);
      if (isJSNum(citem)) citem = B(citem);
      out.push(citem);
    }
    return out;
  }
  
  function truthy (item) {
    if (isStr(item)) return item.length > 0;
    if (isArr(item)) return item.length > 0;
    if (isNum(item)) return !item.eq(0);
  }
  function falsy (item) {
    return !truthy(item);
  }
  function join (item) {
    if (isArr(item)) return item.map(join).join("");
    else return item.toString();
  }
  function flatten (arr) {
    return arr.map((ca) => isArr(ca)? flatten(ca) : [ca]).reduce((a,b) => a.concat(b))
  }
  
  
  function B (what) {
    if (!Number.isFinite(what)) return what;
    return new Big(what);
  }
  
  //golfing JS functions
  function P() {
    var out = pop();
    if (isNum(out)) return +out;
    return out;
  }
}
//https://stackoverflow.com/a/39914235/7528415
async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}