//# sourceURL=Main
version = 8;
codepage = "⁰¹²³⁴⁵⁶⁷⁸⁹¶\n＋－（）［］｛｝＜＞‰ø＾◂←↑→↓↔↕ !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~┌┐└┘├┤┬┴╴╵╶╷╋↖↗↘↙×÷±«»≤≥≡≠ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ０１２３４５６７８９‟‼¼½¾√／＼∑∙‽‾⇵∔：；⟳⤢⌐ŗ“”„？＊↶↷＠＃％！─│┼═║╫╪╬αω";
const baseChars = [...codepage].filter(c => !"„“”‟\n".includes(c));
const baseChar = c => [].indexOf.bind(baseChars)(c);
let compressionChars = "ZQJKVBPYGFWMUCLDRHSNIATEXOzqjkvbpygfwmucldrhsniatexo~!$%&=?@^()<>[]{};:9876543210#*\"'`.,+\\/_|-\nŗ ";
let compressionModes = 5;
let boxChars=" \n-|/\\_";

var debugCompression = false;
var compressionParts;

const shortNumbers = {};
let simpleNumbers;
let compressedNumberStart;
{
  simpleNumbers = {
    '０': 0,
    '１': 1,
    '２': 2,
    '３': 3,
    '４': 4,
    '５': 5,
    '６': 6,
    '７': 7,
    '８': 8,
    '９': 9,
    'Ａ': 10,
    '６«':12,
    '７«':14,
    '８«':16,
    '９«':18,
    'Ａ«':20,
  };
  let cnum = 0;
  let skippable = Object.entries(simpleNumbers).map(c=>c[1]);
  baseChars.forEach(chr=>{
    cnum++;
    while(skippable.includes(cnum)) cnum++;
    shortNumbers["‾"+chr] = cnum;
  });
  compressedNumberStart = cnum+1;
}
if (module) {
  var Big = require('./bigDecimal');
  var debug = false;
  var stepping = false;
  var running = false;
  const AA = require('./asciiart');
  var smartRotate = AA.smartRotate;
  var smartOverlapDef = AA.smartOverlapDef;
  var smartOverlapBehind = AA.smartOverlapBehind;
  var smartOverlap = AA.smartOverlap;
  var noBGOverlap = AA.noBGOverlap;
  var simpleOverlap = AA.simpleOverlap;
  eval("var Canvas = AA.Canvas;");
  var debugLog = console.warn;
}
var stringChars;
{
  let printableAsciiArr=[];
  for (let i = 32; i < 127; i++) printableAsciiArr.push(String.fromCharCode(i));
  let printableAscii = printableAsciiArr.join("");
  stringChars = printableAscii + "¶ŗ";
}


async function redrawDebug(selStart, selEnd, state) {
  result.value = state.printableOut;
  let program = state.program;
  codeState.innerHTML = '<span class="code">' + program.substring(0,selStart) + '</span>'
                      + '<span class="code sel">' + program.substring(selStart,selEnd) + '</span>'
                      + '<span class="code">' + program.substring(selEnd) + '</span>';
  stateX.innerText = arrRepr(state.vars.x);
  stateY.innerText = arrRepr(state.vars.y);
  const lastOfLA = state.lastArgs.slice(-2);
  stateAlpha.innerText = arrRepr(lastOfLA[0]);
  stateOmega.innerText = arrRepr(lastOfLA[1]);
  stateRemainders.innerText = arrRepr(state.remainders.slice(-3));
  stateSups.innerText = state.supVals.map((c,i)=>["¹²³⁴⁵⁶⁷⁸⁹"[i] + ":", c]).filter(c=>typeof c[1] !== 'function').map(c=>c[0] + arrRepr(c[1])).join(", ");
  bgState.innerText = quotify(state.background, `"`);
  ptrstackState.innerText = state.ptrs.map(c=>c.toDebug()).join("\n");
  let ar, width;
  stackState.innerHTML = state.stack.map(c => (
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
  while (!stepNow) await sleep(33);
  stepNow = false;
}
class Pointer {
  /* class meant for extention
      stores the pointer info needed for program structures
  */
  // ?..]..}..]..}..}
  //  |  |  |  |  |
  // sptr points to starting char (or -1)
  // eptr points to last bracket (or program.length)
  // p = parent CanvasCode class instance
  constructor (program, p, sptr, eptr = p.endPt(sptr, false, false, program)) {
    if (debug>1) console.log(`pointer added ${sptr}-${eptr} of \`${program}\``);
    this.sptr = sptr;
    this.eptr = eptr;
    this.p = p;
    this.program = program;
    this.ptr = sptr + 1;
    this.finished = false;
    this.inParent = true;
    if (sptr>=0) {
      this.endpts = this.p.endPt(this.sptr, false, true, this.program);
      this.endpts.forEach((c,i)=>c.index=i);
      let is = [{i:sptr}].concat(this.endpts);
      this.branches = is.slice(0,-1).map((c,i)=>({i: c.i+1, c: is[i+1].c, index:i}));
    } else {
      this.endpts = [{i:eptr, c:undefined, index:0}];
      this.branches = [{i:sptr+1, c:undefined, index:0}];
    }
    this.endptrs = this.endpts.map(c=>c.i);
  }
  async next() {
    if (this.finished) return this.break();
    await this.exec();
    this.iter();
  }
  iter() {
    this.ptr = this.p.nextIns(this.ptr, this.program);
    const ending = this.endptrs.indexOf(this.ptr);
    if (ending !== -1) this.continue(this.endpts[ending]);
    else if (this.ptr >= this.eptr) this.continue(this.endpts[this.endpts.length]);
  }
  update(newPtr) {
    this.ptr = newPtr;
    if (this.ptr >= this.eptr) this.continue(this.endpts[this.endptrs.indexOf(this.ptr)]);
  }
  continue() {
    this.break();
  }
  branch(index) {
    this.ptr = this.branches[index].i;
  }
  break() {
    this.finished = true;
    this.onBreak();
    this.p.break(this.eptr, this);
  }
  onBreak() {}
  init() {}
  toString() {
    return `@${this.ptr} pointer; ${this.sptr}-${this.eptr}`;
  }
  toDebug() { return this.toString(); }
  
  async exec (index = this.ptr) {
    let eindex = this.p.nextIns(index, this.program);
    let instr = this.program.slice(index, eindex);
    if (instr.length > 0 && [...instr].every(c=>stringChars.includes(c))) {
      this.p.push(this.p.prepareStr(instr.replace(/¶/g,"\n")));
    } else if (instr[0] === '“') {
      let str = instr.slice(1, -1);
      switch (instr[instr.length-1]) {
        case "”":
          this.p.push(str);
        break;
        case "„": {
          let num = [...str].map(baseChar);
          if (debug && num.some(c => c===-1)) console.log(str+" contained non-compression chars "+num.map((c,i)=>[c,i]).filter(c=>c[0]===-1).map(c=>str[c[1]]));
          this.p.push(fromBijective(num, baseChars.length).plus(compressedNumberStart));
        } break;
        case "‟": {
          let num = [...str].map(baseChar);
          if (debug && num.some(c => c===-1)) console.log(str+" contained non-compression chars");
          num = fromBijective(num, baseChars.length);
          let mode;
          let string = "";
          let popped = []; // yes, for debugging only
          function pop(base) {
            let arr = num.divideAndRemainder(base);
            popped.push(arr[1]+"/"+base);
            num = arr[0];
            return arr[1].intValue();
          }
          function popChar(chars) {
            return chars[pop(chars.length)];
          }
          while (num.gt(Big.ZERO)) {
            let mode = pop(compressionModes);
            popped = [];
            switch (mode) {
              case 0: // char
                for (let len = pop(2) + 1; len > 0; len--) {
                  string+= popChar(compressionChars);
                }
              break;
              case 1:
                for (let len = pop(16) + 3; len > 0; len--) {
                  string+= popChar(compressionChars);
                }
              break;
              case 2: {
                let pos = -1;
                let chars = "";
                while (pos < compressionChars.length) {
                  if (pos>=0) chars = compressionChars[pos] + chars;
                  pos = pos + 1 + pop(compressionChars.length - pos - (pos===-1));
                }
                let lbit = pop(2);
                let len = chars.length + 1;
                if (lbit) len+= pop(128)+16;
                else len+= pop(16);
                if (debugCompression) console.log("dict: " + chars + " len: " + len);
                for (; len > 0; len--) {
                  string+= popChar(chars);
                }
              } break;
              case 3: {
                let chars = "";
                for (let c of boxChars) if (pop(2)) chars+= c;
                let lbit = pop(2);
                let len = chars.length + 1;
                if (lbit) len+= pop(128)+16;
                else len+= pop(16);
                if (debugCompression) console.log("boxdict: " + chars + " len: " + len);
                for (; len > 0; len--) {
                  string+= popChar(chars);
                }
              } break;
            }
            if (debug>1) console.log(mode + "  " + popped.join(" "));
          }
          this.p.push(this.p.prepareStr(string));
        } break;
      }
    } else if (instr[0] === "‾") {
      this.p.push(shortNumbers[instr]);
    } else {
      let func = this.p.builtins[instr];
      if (func === undefined) {
        if (debug) console.warn(`the function ${instr}@${index} doesn't exist`);
        this.p.push(instr); // idk why k
      } else {
        try {
          func();
        } catch (e) {
          if (debug) {
            console.warn(`error ${instr}@${index} failed on line ${errorLN(e)}`);
            console.warn(e);
          }
        }
      }
    }
    if (!this.p.cpo) return; // i have no idea
    if (this !== this.p.cpo && !this.p.cpo.inParent) index = eindex = 0; // WARNING destructive; for the stepper to start normally; TODO fix ⁷V5±‟⁸｛↔
    if (this.p.debug) debugLog(`${instr}@${index}${eindex-index===1||(eindex===0&&index===0)?'':"-"+(eindex-1)}: ${arrRepr(this.p.stack)}`);
    if (stepping) await redrawDebug(index, eindex, this.p);
  }
}

// a class to put on the stack - a marker of where `）` or `］` should end
class Break {
  // 0 - user created
  // 1 - for loops
  constructor (id) {
    this.id = id;
  }
  toString() {
    return "("+ "⁰¹²³⁴⁵⁶⁷⁸⁹"[this.id];
  }
}

async function run (program, inputs = []) {
  if (!module) result.value = "";
  return new CanvasCode(program, bigify(inputs)).run();
}
CanvasCode = class {
  constructor (wholeProgram, inputs) {
    // ALL of the state of the program
    this.implicitOut = true;
    this.stack = [];
    this.output = "";
    this.background = " ";
    
    this.vars = {};
    this.remainders = [];
    this.lastArgs = [];
    this.supVals = bigify([Infinity, 256, 13, 64, 11, 12, 16, 128, 0]);
    
    this.inpCtr = 0;
    this.inputs = inputs.map(c=>c instanceof Canvas? (c.p = this, c) : c);
    
    this.ptrs = [];
    
    
    // fuck you `this.`
    const get = this.get.bind(this);
    const pop = this.pop.bind(this);
    const push = this.push.bind(this);
    const currInp = this.currInp.bind(this);
    const remainderPalindromize = this.remainderPalindromize.bind(this);
    const cast = this.cast.bind(this);
    const getRemainder = this.getRemainder.bind(this);
    const remainders = this.remainders;
    const lastArgs = this.lastArgs;
    
    
    
    
    // function creation
    this.builtins = {
      "｛": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.level = this.p.ptrs.length-2;
            this.obj = this.p.pop();
            this.collect = this.branches.slice(-1)[0].c === "］";
            this.canvas = isArt(this.obj);
            if (this.canvas) {
              this.result = new Canvas([], this.obj.p);
            } else this.collected = [];
            this.array = !isNum(this.obj) && !this.canvas;
            this.endCount = this.canvas? new Big(this.obj.width * this.obj.height) : this.array? new Big(this.obj.length) : this.obj.round(0, Big.ROUND_FLOOR);
            this.index = 0;
            this.continue(undefined, true);
          }
          
          iter() {
            this.ptr = this.p.nextIns(this.ptr, this.program);
            if (this.ptr >= this.eptr) this.continue();
          }
          
          continue(ending, first = false) {
            this.ptr = this.branches[0].i;
            if (!first && this.collect) {
              let added = this.p.collectToArray();
              if (this.canvas) {
                for (let item of added) this.result.overlap(new Canvas(item, this.p), this.obj.sx + this.x, this.obj.sy + this.y);
              } else this.collected.push(...added);
            }
            if (this.index >= this.endCount.intValue()) return this.break();
            
            if (this.collect) {
              this.p.push(new Break(1));
            }
  
            let newItem, x, y;
            if (this.canvas) {
              this.x = this.index%this.obj.width;
              this.y = 0 | this.index/this.obj.width;
            }
            // console.log(this.x,this.y,this.obj,this.index,+this.endCount);
            if (this.array) newItem = this.obj[this.index];
            else if (this.canvas) newItem = this.obj.repr[this.y][this.x] || this.obj.background;
            else newItem = new Big(this.index+1);
            this.p.push(newItem);
            if (this.canvas) {
              this.p.setSup(this.level, newItem);
              this.p.setSup(this.level+1, this.x);
              this.p.setSup(this.level+2, this.y);
            } else {
              this.p.setSup(this.level, newItem);
              this.p.setSup(this.level+1, this.index + (this.array? 1 : 0));
            }
            
            this.index++;
          }
          onBreak() {
            if (this.collect) {
              if (this.canvas) {
                this.p.push(this.result);
              } else this.p.push(this.collected);
            }
          }
          toString() {
            return `@${this.ptr} loop; ${this.sptr}-${this.eptr}${this.collect? ' '+ arrRepr(this.collected) : ''}`;
          }
          
        }
      )(this.program, this, this.cpo.ptr)),
      
      "Ｈ": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.level = this.p.ptrs.length-2;
            this.obj = this.p.pop();
            this.p.push(this.p.blank);
            this.collect = this.branches.slice(-1)[0].c === "］";
            this.canvas = isArt(this.obj);
            if (this.canvas) {
              this.result = new Canvas([], this.obj.p);
            } else this.collected = [];
            this.array = !isNum(this.obj) && !this.canvas;
            this.endCount = this.canvas? new Big(this.obj.width * this.obj.height) : this.array? new Big(this.obj.length) : this.obj.round(0, Big.ROUND_FLOOR);
            this.index = 0;
            this.continue(undefined, true);
          }
          
          iter() {
            this.ptr = this.p.nextIns(this.ptr, this.program);
            if (this.ptr >= this.eptr) this.continue();
          }
          
          continue(ending, first = false) {
            this.ptr = this.branches[0].i;
            if (!first && this.collect) {
              let added = this.p.collectToArray();
              if (this.canvas) {
                for (let item of added) this.result.overlap(new Canvas(item, this.p), this.obj.sx + this.x, this.obj.sy + this.y);
              } else this.collected.push(...added);
            }
            if (this.index >= this.endCount.intValue()) return this.break();
            
            if (this.collect) {
              this.p.push(new Break(1));
            }
  
            let newItem, x, y;
            if (this.canvas) {
              this.x = this.index%this.obj.width;
              this.y = 0 | this.index/this.obj.width;
            }
            // console.log(this.x,this.y,this.obj,this.index,+this.endCount);
            if (this.array) newItem = this.obj[this.index];
            else if (this.canvas) newItem = this.obj.repr[this.y][this.x] || this.obj.background;
            else newItem = new Big(this.index+1);
            this.p.push(newItem);
            if (this.canvas) {
              this.p.setSup(this.level, newItem);
              this.p.setSup(this.level+1, this.x);
              this.p.setSup(this.level+2, this.y);
            } else {
              this.p.setSup(this.level, newItem);
              this.p.setSup(this.level+1, this.index + (this.array? 1 : 0));
            }
            
            this.index++;
          }
          onBreak() {
            if (this.collect) {
              if (this.canvas) {
                this.p.push(this.result);
              } else this.p.push(this.collected);
            }
          }
          toString() {
            return `@${this.ptr} loop; ${this.sptr}-${this.eptr}${this.collect? ' '+ arrRepr(this.collected) : ''}`;
          }
          
        }
      )(this.program, this, this.cpo.ptr)),
      "［": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.level = this.p.ptrs.length-2;
            this.obj = this.p.pop();
            this.prefix = [];
            this.collect = this.branches.slice(-1)[0].c === "］";
            this.collected = [];
            this.array = !isNum(this.obj);
            this.endCount = this.array? this.obj.length : +this.obj.round(0, Big.ROUND_FLOOR);
            this.index = 0;
            this.continue(undefined, true);
          }
          
          iter() {
            this.ptr = this.p.nextIns(this.ptr, this.program);
            if (this.ptr >= this.eptr) this.continue();
          }
          
          continue(ending, first = false) {
            this.ptr = this.branches[0].i;
            if (!first && this.collect) this.collected.push(...this.p.collectToArray());
            if (this.index >= this.endCount) return this.break();
            
            if (this.collect) this.p.push(new Break(1));
            
            if (this.array) {
              if (isStr(this.obj)) this.prefix+=this.obj[this.index];
              else this.prefix.push(this.obj[this.index]);
              this.p.push(this.prefix);
              this.p.setSup(this.level, this.obj[this.index]);
              this.p.setSup(this.level+1, this.prefix);
              this.p.setSup(this.level+2, this.index+(this.array? 1 : 0));
            } else {
              this.p.setSup(this.level, this.index+1);
              this.p.setSup(this.level+1, this.index);
            }
            
            this.index++;
          }
          onBreak() {
            if (this.collect) this.p.push(this.collected);
          }
          toString() {
            return `@${this.ptr} loop; ${this.sptr}-${this.eptr} depth ${this.level}`;
          }
          
        }
      )(this.program, this, this.cpo.ptr)),
      "Ｗ": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.doWhile = this.branches.slice(-1)[0].c !== "］";
            this.continue(undefined, false);
          }
          
          iter() {
            this.ptr = this.p.nextIns(this.ptr, this.program);
            if (this.ptr >= this.eptr) this.continue();
          }
          
          continue(ending, back = true) {
            this.ptr = this.branches[0].i;
            if (!this.doWhile || back) {
              if (falsy(this.doWhile? this.p.pop() : this.p.get()))
                return this.break();
            }
          }
          toString() {
            return `@${this.ptr} loop; ${this.sptr}-${this.eptr}`;
          }
        }
      )(this.program, this, this.cpo.ptr)),
      
      "？": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.level = this.p.ptrs.length-2;
            this.obj = this.p.pop();
            this.p.setSup(this.level, this.obj);
            
            this.switch = this.branches[0].c === "］";
            if (this.switch) {
              if (falsy(this.obj)) this.branch(1);
              else if (this.endpts.length === 2) this.branch(0);
              else if (isNum(this.obj) && this.obj.gt(0) && this.obj.lt(this.branches.length-1)) this.branch(this.obj.round(0, Big.ROUND_FLOOR).plus(1));
              else this.branch(0);
            } else if(falsy(this.obj)) this.finished = true;
          }
          toString() {
            return `@${this.ptr} ${this.switch? "switch" : "if"}; ${this.sptr}-${this.eptr}`;
          }
          
        }
      )(this.program, this, this.cpo.ptr)),
      
      "‽": () => this.addPtr(new (
        class extends Pointer {
          init() {
            this.level = this.p.ptrs.length-2;
            this.obj = this.p.pop();
            this.p.setSup(this.level, this.obj);
            
            this.switch = this.branches[0].c === "］";
            if (this.switch) {
              this.branchf(0);
            } else if(truthy(this.obj)) this.finished = true;
          }
          
          branchf (ending) {
            if (ending%2 === 0 || ending === this.endpts.length-1) this.p.push(new Break(1));
            this.branch(ending);
          }
          
          continue(ending) {
            ending = ending.index;
             if (ending%2 === 1 || ending === this.endpts.length-1) this.break();
             else {
               let results = this.p.collectToArray();
               if (results.some(c=>equal(c, this.obj))) this.branchf(ending+1);
               else                                     this.branchf(ending+2);
               //else if (ending == this.endpts.length-3) branchf(ending+2);
             }
          }
          
          toString() {
            return `@${this.ptr} ${this.switch? "switch" : "if not"}; ${this.sptr}-${this.eptr}`;
          }
          
        }
      )(this.program, this, this.cpo.ptr)),
      
      "ω": () => push(this.lastArgs.slice(-1)[0]),
      "α": () => push(this.lastArgs.slice(-2)[0]),
      "ｇ": () => push(this.remainders.slice(-2)[0]),
      "⁰": () => {
        let utype = type(get(1));
        let res = [];
        while (type(get(1)) === utype && this.stack.length > 0) {
          res.splice(0, 0, pop());
        }
        push(res);
      },
      "（": () => push(new Break(0)),
      "＃": () => {
        let I = $('#inputs')[0].value;
        let P = $('#program')[0].value;
        let E = eval;
        let p = new (class{
          get p() { return pop(); }
          get f() { program.focus(); }
          get F() { $('#inputs')[0].focus(); }
        });
        let res = eval(this.pop());
        if (res !== undefined) this.push(res);
      },
      "｝": () => {},
      "］": () => {},
      "ｗ": () => {this.vars.y = get();}
    };
    
    // simple functions
    let simpleBuiltins = {
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
        AS: (a, s) => (a.push(s), a),
        SA: (s, a) => (a.splice(0, 0, s), a),
        aa: (a, b) => a.appendVertically(b),
        AN: (a, b) => (a.push(b), a),
        NA: (a, b) => (b.splice(0, 0, a), b),
      },
      "－": {
        NN: (a, b) => a.minus(b),
        AA: (a, b) => b.concat(a),
        aa: (a, b) => b.appendVertically(a),
      },
      "×": {
        NN: (a, b) => a.multiply(b),
        SS: (a, b) => b+a,
        SN: (s, n) => s.repeat(n),
        NS: (n, s, ex) => ex("SN", s,n),
        AN: (a, n, ex) => {
          if (a.some(c=>!isStr(c))) ex("aN");
          let max = 0;
          for (let {length} of a) max = Math.max(max, length);
          return a.map(ln => (ln+" ".repeat(max-ln.length)).repeat(n.intValue()))
        },
        NA: (n, a, ex) => ex("AN", a, n),
        aN: (a, n) => {
          let na = this.blank;
          for (let i = 0; i < n; i++) {
            na.appendHorizontally(a);
          }
          return na;
        },
        Na: (n, a, ex) => ex("aN", a, n),
        aa: (a, b) => b.appendHorizontally(a),
      },
      "＊": {
        SS: (a, b) => [...a].join(b),
        AS: (a, s) => a.join(s),
        SA: (s, a) => a.join(s),
        aS: (a, s) => a.toString().split('\n').map(ln=>[...ln].join(s)),
        Sa: (s, a) => a.toString().split('\n').map(ln=>[...ln].join(s)),
        
        SN: (s, n) => new Array(+n).fill(s),
        NS: (n, s, ex) => ex("SN", s, n),
        
        AN: (a, n) => new Array(n*a.length).fill(0).map((_,i)=>a[i%a.length]),
        NA: (n, a, ex) => ex("AN", a, n),
        
        aN: (a, n) => {
          let na = this.blank;
          for (let i = 0; i < n; i++) {
            na.appendVertically(a);
          }
          return na;
        },
        Na: (n, a, ex) => ex("aN", a, n),
        aNN: (a, w, h) => {
          let na = this.blank;
          a.forEach((chr, x, y) => {
            for (let xp = 0; xp < w; xp++)
              for (let yp = 0; yp < h; yp++)
                na.set(x*w + xp, y*h + yp, chr);
          });
          return na;
        },
      },
      "÷" : (a,b) => b.eq(0)? a : a.divide(b),
      "％": (a,b) => a.remainder(b).plus(b).remainder(b),
      "√": (a) => a.sqrt(),
      "＾": (a, b) => a.pow(b.floatValue()),
      "＜": (a, b) => +a.lt(b),
      "＞": (a, b) => +a.gt(b),
      "≡": (a, b) => + equal(a,b),
      "≠": (a, b) => +!equal(a,b),
      "┬": (a, b) => {
        const res = [];
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
          const checkIsNums = (a) => isArr(a) ? a.every(checkIsNums) : isNum(a);
          let reduceType;
          if (checkIsNums(a)) reduceType = (a,b) => a.plus(b);
          else reduceType = (a,b) => a+""+b;
          const sumArr = (a) => a.map(c => isArr(c) ? sumArr(c) : c).reduce(reduceType);
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
        S: (s) => new Canvas(s, this).horizReverse().toString(), // [...s].reduce((a,b)=>b+a)
        N: (n) => new Big(0).minus(n),
        A: (a) => new Canvas(a, this).horizReverse().toArr(),
        a: (a) => a.horizReverse(),
      },
      "╋": {
        SSS: (a,b,c) => a.split(b).join(c),
        aaa: (a,b,c) => {
          let res = new Canvas(a);
          for (let y = a.sy-b.sy; y < a.ey+b.ey; y++) {
            for (let x = a.sx-b.sx; x < a.ex+b.ex; x++) {
              if (equal(a.subsection(x, y, x+b.width, y+b.height), b)) {
                res.overlap(c, x, y);
              }
            }
          }
          return res;
        },
        aaNN: (a, b, x, y) => a.overlap(b, x.minus(1), y.minus(1), smartOverlap),
        length: 4,
        default: (a, b, c, d, ex) => ex("aaNN", ...this.orderAs("aaNN", a, b, c, d)),
      },
      "╋╋": {
        aaNN: (a, b, x, y) => a.overlap(b, x.minus(1), y.minus(1), simpleOverlap),
        length: 4,
        default: (a, b, c, d, ex) => ex("aaNN", ...this.orderAs("aaNN", a, b, c, d)),
      },
      "⇵": {
        N: (n) => {var a=n.divideAndRemainder(2); remainders.push(a[1]); return a[0].plus(a[1])},
        A: (a) => a.reverse(),
        a: (a) => a.vertReverse(),
      },
      "↔": {
        a: (a) => a.horizMirror(),
      },
      "↕": {
        a: (a) => a.vertMirrorSmart(smartOverlapBehind),
        N: (n) => {let a=n.divideAndRemainder(2); remainders.push(a[1]); return a[0].add(1)},
      },
      "ｍ": {
        SN: (s, n) => s.repeat(Math.ceil(n/s.length)).substring(0, +n),
        AN: (a, n) => new Array(+n).fill().map((_,i) => a[i%a.length]),
        aN: (a, n) => a.repeatingSubsection(+n, a.repr.length),
        
        NS: (n, s, ex) => ex("SN", s, n),
        NA: (n, a, ex) => ex("AN", a, n),
        Na: (n, a, ex) => ex("aN", a, n),
        NN: (a, b) => a.gt(b)? b : a,
      },
      "Ｍ": {
        NN: (a, b) => a.gt(b)? a : b,
      },
      "ｎ": {
        AN: (a, n) => {
          // n = n.intValue();
          const out = [];
          let curr = [];
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
        SN: (s, n, ex) => ex("AN", [...s], n).map(c => c.join("")),
        NS: (n, s, ex) => ex("SN", s, n),
        aa: (a, b) => a.overlap(b, 0, 0, smartOverlap),
        NN: (a, b) => {push(...a.divideAndRemainder(b));},
      },
      "⤢": {
        // TODO: A:
        a: (a) => a.rotate(1).horizReverse(),
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
          var res = s.slice(0, 1);
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
          var res = s.slice(-1);
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
      "Ｄ": { // TODO strings
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
        S: (s) => +(s.length !== 0),
        a: (a) => new Canvas(a.repr, this),
      },
      "！": {
        N: (n) => +n.eq(0),
        S: (s) => +(s.length === 0),
        a: (a) => a.rotate(3).horizReverse(),
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
        S: (s) => s.length===1? s.charCodeAt(0) : [...s].map(chr=>chr.charCodeAt(0)),
        a: (a) => a.repr.map(ln=>ln.map(chr=>chr? chr.charCodeAt(0) : 0)),
      },
      // "ｆ": {
      //   TTT: (s, o, r) {
      //     function vreplace(s, o, r) {
      //
      //     }
      //     vreplace(s, o, r);
      //   },
      // },
      
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
      
      
      // "╬│": {
      //   a: (a) => a.palindromize(H, "mirror", getRemainder(0), smartOverlap, V, smartOverlapBehind, 0, smartOverlap),
      // },
      "╬┼": {
        a: (a) => a.palindromize(H, "mirror", getRemainder(1), smartOverlap, V, smartOverlapBehind, getRemainder(0), smartOverlap)
      },
      "┼╬": {
        a: (a) => a.palindromize(H, "mirror", getRemainder(0), smartOverlap, V, smartOverlapBehind, getRemainder(1), smartOverlap)
      },
      
      
      "║│": {
        a: (a) => remainderPalindromize(a, 2,null),
      },
      "═─": {
        a: (a) => remainderPalindromize(a, null,2),
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
        aN: (a, n) => a.rotate(-n, smartRotate),
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
        N: (n) => {var a=n.divideAndRemainder(2); remainders.push(a[1]); return a[0]},
        S: (s) => s.slice(-1).concat(s.slice(0,-1)),
        A: (a) => a.slice(-1)+a.slice(0,-1),
        a: (a) => a.subsection(-1, 0).appendHorizontally(a.subsection(0, 0, -1)),
      },
      "╵": {
        N: (n) => n.plus(1),
        S: (s) => s.replace(/(^\s*|[.?!]\s*)(\w)/g, (a,b,c)=>b+c.toUpperCase()),
        A: "vectorize",
      },
      "╷": {
        N: (n) => n.minus(1),
        S: (s) => s.replace(/(^|\W)(\w)/g, (a,b,c)=>b+c.toUpperCase()),
        A: "vectorize",
      },
      "├": {
        N: (n) => n.plus(2),
        S: (s) => s.replace(/([^\w_]*)(\w)/, (a,b,c)=>b+c.toUpperCase()),
        A: "vectorize",
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
        A: "vectorize",
      },
      
      // stack manipulation
      "）": this.collectToArray.bind(this),
      "；": (a,b) => {push(b); push(a)},
      "：": () => {push(get(1));},
      "⌐": () => {push(get(1)); push(get(1))},
      "┌": () => (push(get(2))),
      "┐": (_) => {},
      "└": (a, b, c) => {push(b); push(a); push(c)},
      "┘": (a, b, c) => {push(b); push(c); push(a)},
      
      
      // generators
      "∙": () => {
        if (stringChars.includes(this.program[this.cpo.ptr-1]) ^ stringChars.includes(this.program[this.cpo.ptr+1])) return " ";
      },
      "ｒ": {
        N: (a) => lrange(a),
        aS: (a, S) => (a.background=S, a),
        a: (a) => {
          const res = this.blank;
          let longest = 0;
          let start = Infinity;
          for (let y = a.sy; y < a.ey; y++) {
            const ln = a.trimmedLine(y);
            if (ln.length > longest) longest = ln.length;
            const s = a.repr[y - a.sy];
            let st = 0;
            while (st < s.length && s[st] === undefined) st++;
            if (start > st) start = st;
          }
          for (let y = a.sy; y < a.ey; y++) {
            const ln = a.trimmedLine(y);
            for (let x = 0; x < ln.length; x++) {
              res.set(Math.floor((longest-ln.length)/2)+x, y, ln[x]);
            }
          }
          return res;
        },
      },
      "Ｒ": {
        N: (a) => urange(a),
        S: (s) => {this.background = s},
      },
      "╶": this.nextInp.bind(this),
      "╴": () => currInp(),
      "Ａ": () => 10,
      "ø": () => this.blank,
      "ｚ": () => "abcdefghijklmnopqrstuvwxyz",
      "Ｚ": () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "◂": () => "0123456789",
      "◂◂": () => ["1234567890","qwertyuiop","asdfghjkl","zxcvbnm"],
      "Ｃ": () => " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~",
      "＼": {
        S: (s) => {
          const res = this.blank;
          // new Canvas(Array.from(s).map((c, i) => " ".repeat(s.length-i-1)+c), this),
          for (let i = 0; i < s.length; i++) res.set(i, i, s[i]);
          return res;
        },
        a: (a) => {
          const res = this.blank;
          a.forEachChar((chr, x, y) => res.set(x+y, y, chr));
          return res;
        },
        N: (n, ex) => ex("S", "\\".repeat(n)),
      },
      "／": {
        S: (s) => {
          const res = this.blank;
          // new Canvas(Array.from(s).map((c, i) => " ".repeat(s.length-i-1)+c), this),
          for (let i = 0; i < s.length; i++) res.set(s.length-i-1, i, s[i]);
          return res;
        },
        a: (a) => {
          const res = this.blank;
          a.forEachChar((chr, x, y) => res.set(x-y-1+a.height, y, chr));
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
      "ｘ": () => this.vars.x,
      "ｙ": () => this.vars.y,
      "Ｘ": (a) => {this.vars.x = a},
      "Ｙ": (a) => {this.vars.y = a},
      "Ｖ": () => {
        if (this.vars.x === undefined) this.vars.x = new Big(0);
        this.vars.x = this.vars.x.plus(1);
      },
      "ｖ": () => {
        // let ToS = get();
        if (this.vars.x === undefined) this.vars.x = Big.ZERO; // isNum(ToS)? new Big(0) : isStr(ToS)? "" : isArt(ToS);
        if (isNum(this.vars.x)) push(this.vars.x = this.vars.x.plus(1));
        else if (isArr(this.vars.x)) this.vars.x.push(pop());
        else if (isArt(this.vars.x)) this.vars.x.appendVertically(new Canvas(pop()));
        else this.vars.x+= pop();
      },
      
      // outputting
      "Ｏ": () => this.outputFS(true, true, false),
      "ｏ": () => this.outputFS(true, false, false),
      "Ｔ": () => this.outputFS(false, true, true),
      "ｔ": () => this.outputFS(false, false, true),
      "Ｑ": () => this.outputFS(false, true, false),
      "ｑ": () => this.outputFS(false, false, false),
      "Ｐ": () => this.outputFS(true, true, true),
      "ｐ": () => this.outputFS(true, false, true),
      
      "Ｅ": code => this.executeHere(code),
      "Ｕ": {
        A: "vectorize",
        S: (a) => a.toUpperCase(),
        N: (a) => a.round(0, Big.ROUND_CEILING),
      },
      "ｕ": {
        A: "vectorize",
        S: (a) => a.toLowerCase(),
        N: (a) => a.round(0, Big.ROUND_FLOOR),
      },
      "ｒａｗ": (a) => arrRepr(a),
    };
    
    // number built-ins
    for (let i = 0; i < 10; i++)
      simpleBuiltins["０１２３４５６７８９"[i]] = () => new Big(i);
      
    // superscript built-ins
    for (let i = 0; i < 9; i++) {
      this.builtins["¹²³⁴⁵⁶⁷⁸⁹"[i]] = () => {
        if (isFn(this.supVals[i])) this.executeHere(this.supVals[i]());
        else push(this.supVals[i]);
      };
    }
    
    // simple built-ins
    
    function exfn(fn, types = new Array(fn.length).fill("T"), body) {
      if (!isFn(fn)) {
        throw new Error("exfn called with non-function");
      }
      let depth = 1;
      let args = new Array(types.length);
      for (let i = types.length-1; i >= 0; i--) {
        let p = types[i];
        let c;
        if (p[0]==="_") c = get(depth++);
        else c = pop(depth);
        args[i] = cast(c, p[p.length-1]);
      }
      lastArgs.push(...args.map(copy));
      let res = fn(...args, (type, ...args) => body[type](...args));
      if (isJSNum(res)) res = new Big(res);
      if (res !== undefined) push(res);
    }
    
    for (let builtin in simpleBuiltins) {
      let obj = simpleBuiltins[builtin];
      this.builtins[builtin] = function () {
        
        
        if (isFn(obj)) {
          return exfn(obj);
        }
        
        let len = Object.keys(obj).map(c => c==="default"? 0 : c.length).reduce((a, b)=>Math.max(a,b));
        let pattern = "";
        for (let i = len; i >= 1; i--) {
          pattern+= type(get(i));
        }
        
        let foundKey;
        function regexify(ptn) {
          return new RegExp(ptn
            .replace(/a/g   , "[aAS]")
            .replace(/[tT]/g, "[aASN]")
            .replace(/s/g   , "[SN]")
            .replace(/_/g   , "")
            +"$");
        }
        for (let key in obj) {
          if (regexify(key).test(pattern)) {
            foundKey = key;
            break;
          }
        }
        let sub;
        
        if (foundKey) {
          sub = obj[foundKey];
          if (debug > 1) console.log("found key "+foundKey+" for "+pattern);
        } else {
          sub = obj.default;
          if (!sub) throw new Error(`key not found and there's no default for ${builtin} on ${pattern}`);
          exfn(sub, new Array(obj.length).fill("T"), obj);
          return;
        }
        
        if (isFn(sub)) {
          exfn(sub, [...foundKey.replace(/[^_]/g, "$&;").split(";").slice(0, -1)], obj);
            // .replace(/[^_]/g, "1").replace(/_1/g, "0")].map(c=>parseInt(c)));
        } else if (sub === "vectorize") {
          function rec(arr) {
            return arr.map( c => {
              if (isArr(c)) return rec(c);
              let t = type(c);
              let found = Object.keys(obj).find(k => regexify(k).test(t));
              if (!found) throw new Error(`Type ${t} not defined for ${builtin}`);
              return obj[found](c);
            });
          }
          push(rec(pop()));
        } else throw new Error("sub wasn't a function or vectorization request");
        
      }.bind(this)
    }
    
    // fix quotes & prepended with `｛`s if needed
    this.functions = wholeProgram.split("\n").map((pr) => {
      var ctr = 0;
      pr = pr
        .replace(/([”‟„]|^)([^“”‟„\n]*)(?=[”‟„])/g, "$1“$2")
        .replace(/“[^“”‟„\n]*$/, "$&”");
      while (this.endPt(-1, true, false, pr) !== undefined && (!debug || (ctr++) <= 100)) pr = "｛"+pr;
      if (ctr>=100 && debug) console.warn("couldn't fix braces after 100 iterations!");
      return pr;
    });
    
    // last sups are the program lines
    for (let i = 0; i < this.functions.length; i++) {
      this.setSup(9-this.functions.length+i, () => this.functions[i]);
    }
    // remaining last sups are the inputs
    for (let i = 0; i < Math.min(inputs.length, 9); i++) {
      this.setSup(8-this.functions.length-i,this.inputs[i]);
    }
    
    
    
  }
  
  
  async run (debug = 0, step = false, sleepUpdate = true) {
    if (running) throw new Error("already running!");
    else running = true;
    this.sleepUpdate = sleepUpdate;
    this.debug = debug;
    this.step = step;
    
    if (!module) result.placeholder="Running...";
    var main = this.functions[this.functions.length-1];
    this.ptrs.push(new (
      class extends Pointer {
        toDebug () { return `@${this.ptr}: main program`; }
      }
    )(main, this, -1, main.length));
    var counter = 0;
    try {
      while (this.ptrs.length > 0) {
        if (sleepUpdate && counter%100 === 0) await sleep(0);
        counter++;
        await this.cpo.next();
        if (!running) break;
      }
      if (this.implicitOut) this.outputFS(false, true, false);
      if (!module) {
        result.placeholder=running? "No output was returned" : "No output on premature stop";
        result.value = this.printableOut;
      }
    } catch (e) {
      console.error(e);
      if (!module) result.placeholder = "The interpreter errored during the execution";
      if (!stepping && devMode && this.cpo) {
        enterStepping();
        await redrawDebug(this.cpo.ptr, this.endPt(this.cpo.ptr), this);
        stopStepping();
      }
    }
    
    running = false;
    if (stepping) stopStepping();
    return this.printableOut;
  }
  
  setSup (i, v) {
    if (i>8 || i < 0) return;
    if (isJSNum(v)) v = new Big(v);
    this.supVals[i] = v;
  }
  
  addPtr(ptr) {
    this.ptrs.push(ptr);
    ptr.init();
  }
  
  get blank() {
    return new Canvas(undefined, this);
  }
  
  remainderPalindromize (canvas, x, y) {
    var xa = [], ya = [];
    if (x!==null) xa = [H, "mirror", x===2? this.getRemainder(0) : x, smartOverlap];
    if (y!==null) ya = [V, smartOverlapBehind, y===2? this.getRemainder(0) : y, smartOverlap];
    return canvas.palindromize(...xa, ...ya);
  }
  // output with 2 trailing and leading newlines removed
  get printableOut() {
    return this.output.replace(/^\n{0,2}|\n{0,2}$/g,"");
  }
  getRemainder (ift = 1) {
    return this.remainders[this.remainders.length-1 - (ift%this.remainders.length)];
  }
  
  get cpo() {
    return this.ptrs[this.ptrs.length-1];
  }
  get program() {
    return this.cpo.program;
  }
  endPt (sindex, undefinedOnProgramEnd = false, allEnds = false, program = this.program) {
    var ind = sindex;
    var ends = [];
    var bstk = [{ c:program[ind], s:0 }];
    var lvl = 1;
    while (lvl > 0) {
      ind = this.nextIns(ind, program);
      if ("［｛Ｈ？‽Ｗ".includes(program[ind])) {
        bstk.push({ c:program[ind], s:0 });
        lvl++;
      }
      let echr = program[ind];
      if (echr === "｝" || echr === "］") {
        let back = false;
        let br = bstk[bstk.length-1];
        switch (br.c) {
          case "［":
          case "｛":
            back = true;
          break;
          case "‽":
            if (br.s === 0) {
              if (echr === "｝") back = true;
              else br.s = 2; // case value named
            } else if (br.s === 2) { // action end; case value named
              if (echr === "｝") br.s = 1; // case action defined
              else back = true; // `］］` means no default case
            } else if (br.s === 1) { // case action defined
              if (echr === "｝") back = true;
              else br.s = 2;
            }
          break;
          case "？":
            if (echr === "｝") back = true;
          break;
          default:
            back = true;
        }
        if (lvl === 1) ends.push({i:ind, c:echr});
        if (back) {
          lvl--;
          bstk.pop();
        }
      }
      if (lvl > 0 && ind >= program.length) return allEnds? (ends.push({i:ind, c:"｝"}), ends) : undefinedOnProgramEnd? undefined : program.length;
    }
    return allEnds? ends : ind;
  }
  nextIns (index, program = this.program) {
    if (stringChars.includes(program[index])) {
      while (stringChars.includes(program[index+1])) index++;
      return index+1;
    }
    if (program[index] === "‾") return index+2;
    if (program[index] === '“') {
      while (index < program.length && !'“„”‟'.includes(program[index+1])) index++;
      return index+2;
    }
    let multibyte = Object.keys(this.builtins).filter(c => c.length>1).find(key =>
      [...key].every((char,i)=>
           program[index+i] === char
      ) // && this.builtins[key].length > 0
        // && this.builtins[key](2)
    );
    if (multibyte) {
      return index+multibyte.length;
    }
    return index+1;
  }
  
  
  
  break(newPtr, who) {
    if (debug > 1) debugLog(`break from ${this.ptrs.length} to ${newPtr}`);
    var ptr = this.ptrs.indexOf(who);
    this.ptrs.splice(ptr, 1);
    // if (debug > 1 && who !== ptr) console.warn("break who != last ptr");
    if (this.ptrs.length === 0) return;
    if (who.inParent && ptr != 0) this.ptrs[ptr-1].update(newPtr);
  }
  
  executeHere (newPr) {
    newPr = newPr+"";
    this.addPtr(new (
      class extends Pointer {
        init() { this.inParent = false; }
        toDebug () { return `@${this.ptr}: helper function`; }
      }
    )(newPr, this, -1, newPr.length));
  }
  
  outputFS (shouldPop, newline, noImpOut) { // output from stack
    let item;
    if (shouldPop) item = this.pop();
    else item = this.get();
    if (noImpOut) this.implicitOut = false;
    if (newline) this.println(item);
    else this.print(item);
  }
  print (what) {
    this.output+= strRepr(what);
  }
  println (what) {
    this.output+= "\n"+strRepr(what);
  }
  
  currInp (next) {
    if (!next) next = 0;
    return copy(this.inputs[(this.inpCtr+next-1)%this.inputs.length]);
  }
  
  nextInp() {
    let out = this.currInp(1);
    this.inpCtr++;
    this.inpCtr%= this.inputs.length;
    return out;
  }
  get(ift = 1) { // item from top; 1 = top, 2 = 2nd from top, ect.
    let ptr = this.stack.length;
    while (ptr > 0 && ift !== 0) {
      ptr--;
      if (!(this.stack[ptr] instanceof Break)) ift--;
    }
    if (ift === 0) return this.stack[ptr];
    return this.currInp(ift);
  }
  pop(ift = 1) { // item from top; 1 = top, 2 = 2nd from top, ect.
    // var ptr = stack.length-1;
    // while (ptr >= 0) {
    //   if (!(stack[ptr] instanceof Break)) return stack.splice(ptr,1)[0];
    //   ptr--;
    // }
    // return nextInp();
    let item = this.get(ift);
    this.remove(ift);
    return item;
  }
  remove(ift = 1) {
    let ptr = this.stack.length;
    while (ptr > 0 && ift > 0) {
      ptr--;
      if (!(this.stack[ptr] instanceof Break)) ift--;
    }
    while (ift > 0) {
      this.stack.splice(0, 0, this.nextInp());
      ift--;
    }
    return this.stack.splice(ptr,1)[0];
  }
  push (...item) {
    this.stack.push(...item.map(c=>
      isStr(c) && c.includes("\n")?
        new Canvas(c, this) : copy(c, this)
      )
    );
  }
  collectToArray() {
    const collected = [];
    while (this.stack.length > 0 && !(this.stack[this.stack.length-1] instanceof Break)) {
      collected.splice(0, 0, this.stack.pop());
    }
    this.stack.pop();
    return collected;
  }
  orderAs (order, ...params) {
    let ppt = params.map((c) => [c, type(c)]); //params plus type
    for (let i = 0; i < ppt.length; i++) {
      let curType = ppt[1];
      let resType = order[i];
      if (!subType(curType, resType)) {
        let index = i + ppt.slice(i).findIndex(c=>subType(c[1], resType));
        ppt.splice(i,0,ppt.splice(index,1)[0]);
      }
    }
    return ppt.map((c, i) => this.cast(c[0], order[i]))
  }
  cast (item, rt, p) {
    if (type(item) === rt || rt === "T") return item;
    if (rt === 'N') return new Big(item.toString().replace(",","."));
    if (rt === 'a' || rt === 't') return new Canvas(item, this);
    if (rt === 'S' || rt === 's') return rt.toString();
    throw new Error(`cast error from ${type(item)} to ${rt}: ${item} (probably casting to array which is strange & unsupported)`);
  }
  prepareStr (str) {
    return str.replace(/ŗ/g, () => this.pop());
  }
} // END OF CanvasCode










function copy (item) {
  if (isArr(item)) return item.map((c) => copy(c));
  if (isArt(item)) return new Canvas(item);
  if (isNum(item) || isJSNum(item)) return new Big(item);
  return item;
}
function equal(a, b) {
  if (type(a)!==type(b)) return false;
  if (isArr(a)) return a.length === b.length && a.every((c,i) => equal(c, b[i]));
  if (isNum(a)) return a.eq(b);
  if (isJSNum(a)) return new Big(a).eq(b);
  if (isStr(a)) return a===b;
  if (isArt(a)) return equal(a.stringForm(), b.stringForm());
  throw new Error("no eq test for "+a+";"+b);
}
function subType (a, b) { // is `a` a subtype of `b`?
  if (a===b) return true;
  if (b==="a" && "AS".includes(a)) return true;
  
  return false;
}

function irange (s, e) {//inclusive range
  const out = [];
  for (let b = new Big(s); b.lte(e); b = b.plus(1)) {
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

function B (what) {
  if (!Number.isFinite(what)) return what;
  return new Big(what);
}


//https://stackoverflow.com/a/39914235/7528415
async function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
  const ml = what.includes("\n");
  return (qt+qt+qt+"\n").slice(0, ml? 4 : 1) + what + ("\n"+qt+qt+qt).slice(ml? 0 : 3)
}
function bigify (item) {
  const out = [];
  for (citem of item) {
    if (isArr(citem)) citem = bigify(citem);
    if (isJSNum(citem) && Number.isFinite(citem)) citem = new Big(citem);
    out.push(citem);
  }
  return out;
}

function truthy (item) {
  if (isStr(item)) return item.length > 0;
  if (isArr(item)) return item.length > 0;
  if (isNum(item)) return !item.eq(0);
  if (isArt(item)) return item.width>0 && item.height>0;
  return !!item;
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
function errorLN (e) {
  try {
    return e.stack.split("\n")[1].match(/\d+/g).slice(-2,-1).shift();
  } catch (e2) {
    return "unknown";
  }
}

function toBijective (n, b) {
  const res = [];
  while(n.gt(b)) {
    n = n.minus(1);
    let [div, mod] = n.divideAndRemainder(b);
    n = div;
    res.push(mod);
  }
  if (n>0) res.push(n.minus(1));
  return res;
}
function fromBijective (n, b) {
  // return n.reverse().reduce((acc,n) => acc*b + n + 1n, 0n)// + b**BigInt(n.length-1);
  let res = Big.ZERO;
  for (let i = n.length-1; i>=0; i--) {
    res = res.mul(b);
    res = res.plus(Big.ONE.plus(n[i]));
  }
  return res;
}

function compressNum(n) {
  n = new Big(n);
  if (n.lt(compressedNumberStart)) {
    let tn = n.intValue();
    let c = Object.entries(simpleNumbers).find(c=>c[1]===tn);
    if (c) return c[0];
    c = Object.entries(shortNumbers).find(c=>c[1]===tn);
    if (c) return c[0];
    console.warn("< compressed start but not anywhere",n);
  } else return `“${toBijective(n.minus(compressedNumberStart), baseChars.length).map(c=>baseChars[c]).join('')}„`;
}

// function prettyError(e) {console.log(e.stack+"!");
//   if (window.chrome) {
//     try {
//       let t=e.stack.split("\n");
//       // console[level](t[0]);
//       console.groupCollapsed("%c"+t[0]+" @"+t[1].split("main.js:")[1].slice(0,-1), "font-weight:normal;");
//       t.slice(1).map(c=> {
//         let parts = c.split(/    at | \(eval at success \(.+\), <anonymous>:/);
//         console.log(`in ${parts[1]} @${parts[2].slice(0,-1)}`);
//       })
//       console.groupEnd();
//     } catch (well) {
//       console.groupEnd();
//       console.error(e);
//     }
//   } else console.error(e);
// }

function bigLog10(big) {
  return (big+"").length + Math.log10("0."+big)
}

function compressString(arr) {
  compressionParts = [];
  class Part {
    constructor (type) {
      this.type = type;
      this.arr = [];
      // this.score = Big.ONE;
    }
    add(n, b) {
      // this.score = this.score.mul(b).add(n);
      // this.S=+this.score;
      // this.L=Math.log(this.S)/Math.log(252);
      this.arr.push([n, b]);
    }
    finish() {
      let res = Big.ONE; // Big.ZERO;
      for (let i = this.arr.length-1; i >= 0; i--)
        res = res.mul(this.arr[i][1]).plus(this.arr[i][0]);
      this.score = res;
      this.length = bigLog10(this.score)/Math.log10(252);
    }
  }
  // let stack = [new Part()];
  let current;
  let allparts = [];
  function push(n, b) {
    if (debugCompression) console.log(n, b);
    current.add(n, b);
  }
  for (let part of arr) {
    if (!part) continue;
    part = part.replace(/¶/g, "\n");
    if (part.length <= 2) {
      current = new Part("char");
      push(0, compressionModes);
      push(part.length-1, 2);
      for (let c of part) push(compressionChars.indexOf(c), compressionChars.length);
      allparts.push(...current.arr);
      if (debugCompression) compressionParts.push([current]);
      current.finish();
    } else {
      let attempts = [];
      if (part.length <= 18) {
        current = new Part("chars");
        if (debugCompression) console.log("trying raw ASCII");
        push(1, compressionModes);
        push(part.length-3, 16);
        for (let c of part) push(compressionChars.indexOf(c), compressionChars.length);
        attempts.push(current);
        current.finish();
      } else {
        current = new Part("chars");
        if (debugCompression) console.log("trying raw ASCII");
        for (let [subpart] of part.matchAll(".{1,18}")) {
          if (subpart.length <= 2) {
            push(0, compressionModes);
            push(subpart.length-1, 2);
            for (let c of subpart) push(compressionChars.indexOf(c), compressionChars.length);
          } else {
            push(1, compressionModes);
            push(subpart.length-3, 16);
            for (let c of subpart) push(compressionChars.indexOf(c), compressionChars.length);
          }
        }
        
        attempts.push(current);
        current.finish();
      }
      let unique = [...part].filter((c,i,a) => a.indexOf(c) === i);
      if (unique.length < part.length && unique.every(c=>boxChars.includes(c))) {
        let valid = 1;
        current = new Part("boxdict");
        if (debugCompression) console.log("trying boxdict");
        push(3, compressionModes);
        for (let c of boxChars)
          push(+(unique.includes(c)), 2);
        
        let chars = [...boxChars].filter(c=>unique.includes(c));
        
        let slen = part.length-unique.length-1;
        if (slen < 16) {
          push(0, 2);
          push(slen, 16);
        } else {
          push(1, 2);
          if (slen - 16 >= 128) valid = 0;
          push(slen - 16, 128);
        }
        for (let c of part) push(chars.indexOf(c), chars.length);
        if (valid) attempts.push(current);
        current.finish();
        
      }
      if (unique.length < part.length) { // at least 1 thing is repeating
        let valid = 1;
        let indexes = unique.map(c=>compressionChars.indexOf(c)).sort((a,b)=>a-b);
        let map = indexes.map(c=>compressionChars[c]).reverse();
        current = new Part("dict");
        if (debugCompression) console.log("trying dict");
        push(2, compressionModes);
        let curr = -1;
        for (let c of indexes) {
          push(c-curr-1, compressionChars.length - curr - (curr===-1));
          curr = c;
        }
        let end = compressionChars.length - curr;
        push(end-1, end);
        let slen = part.length-unique.length-1;
        if (slen < 16) {
          push(0, 2);
          push(slen, 16);
        } else {
          push(1, 2);
          if (slen - 16 >= 128) valid = 0;
          push(slen - 16, 128);
        }
        for (let c of part) push(map.indexOf(c), map.length);
        if (valid) attempts.push(current);
        current.finish();
      }
      let sorted = attempts.sort((a,b)=>a.score.minus(b.score).intValue());
      allparts.push(...sorted[0].arr);
      if (debugCompression) console.log("possible for part:", sorted);
      if (debugCompression) compressionParts.push(sorted);
    }
  }
  let res = Big.ZERO;
  let ns = allparts;
  if (debugCompression) {
    let p = new Part();
    p.arr = allparts;
    p.finish();
    compressionParts.push(p);
  }
  for (let i = ns.length-1; i>= 0; i--) res = res.mul(ns[i][1]).add(ns[i][0]);
  return '“' + toBijective(res, baseChars.length).map(c=>baseChars[c]).join('') + '‟';
}


if (module) {
  module.exports = {
    CanvasCode: CanvasCode,
    Canvas: Canvas,
    run: run
  };
}