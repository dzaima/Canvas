//# sourceURL=Docs

var cycles = [
  
  "AＡ","BＢ","CＣ","DＤ","EＥ","FＦ","GＧ","HＨ","IＩ","JＪ","KＫ","LＬ","MＭ",
  "NＮ","OＯ","PＰ","QＱ","RＲ","SＳ","TＴ","UＵ","VＶ","WＷ","XＸ","YＹ","ZＺ",
  "aａα","bｂ","cｃ","dｄ","eｅ","fｆ","gｇ","hｈ","iｉ","jｊ","kｋ","lｌ","mｍ",
  "nｎ","oｏ","pｐ","qｑ","rｒ√ŗ","sｓ∑","tｔ","uｕ","vｖ","wｗω","xｘ","yｙ","zｚ",
  
  "0０⁰","1１¹","2２²","3３³","4４⁴","5５⁵","6６⁶","7７⁷","8８⁸","9９⁹",
  "!！‼", "@＠", "#＃", "%％", "^＾",
  "+＋╋∔", "-－─∔", "*×＊", "/／÷", "\\＼", "|｜│║",
  ":：", ";；", "?？‽", "\"”‟", "'“„",
  "(（", ")）", "[［", "]］", "{｛", "}｝", "<＜≤«", ">＞≥»",
  "=≡≠═",
  " ∙", "\n¶"
];

var transforms = [];
var otransforms = Object.entries({
  "||-": "╫",
  "--|": "╪",
  "=|": "╪",
  "|": "│",
  "||": "║",
  "-": "─",
  "--": "═",
  "-|": "┼",
  "--||": "╬",
  "=||": "╬",
  "<>": "↔",
  "+-": "±", // also horizontal reverse
  "^v": "↕",
  "rev": "⇵",
  "cw": "↷",
  "ccw": "↶",
  "rot": "⟳",
  "o/":  "ø",  // empty art obj
  "o\\": "ø",
  "new": "ø",
  "pop": "┐", // pop & remove item
  "tri": "⌐", // triplicate
  "dup": "┌", // duplicate 2nd from top
  "g2": "┌", // duplicate 2nd from top
  "3rd": "┘", // duplicate 2nd from top
  "swap": "└",
  "//": "⤢",
  "abs": "⤢",
  "+2":  "├",
  "inc": "╵",
  "+1":  "╵",
  "-1":  "╷",
  "dec": "╷",
  "-2":  "┤",
  "to":  "┬",  // to base (2 nums -> arr)
  "from": "┴", // from base (arr & base -> num)
  "dig": "◂",
  "=/": "≠",
  "!!": "‼",
  "12": "½",
  "1/2": "½",
  "/2": "½",
  "rt": "√",
  "╴": "prev",
  "╶": "next",
  "": "",
});
for (let [k, v] of otransforms) {
  transforms.push([[...k].sort().join(''), v]);
}

transforms.sort((a,b)=>{
  let p1 = b[0].length-a[0].length;
  if (p1) return p1;
  return (b[0]>a[0]) - (b[0]<a[0])
});

console.log("docs.js loaded!");
var data = [];
$.ajax({
  url: "files/chars.txt",
  success: function (chars) {
    console.log("chars.txt loaded!");
    let charRegex = /^([^\t\n ]{1,3})\t(.+)\n(( {2,}.+\n)*)/gm;
    let exampleRegex = / {2,4}`([^`]*)` (.+)/;
    let commentRegex = /\/\/(TODO|KEYW).+$/;
  
    let match, cmatch;
    // parsing chars.txt
    while (match = charRegex.exec(chars)) {
      let obj = {c: match[1], desc:match[2].replace(commentRegex, ""), raw: match[0]};
      let larr = match[3].split("\n");
      let typearr = [];
      let examples = [];
      for (let lid = 0; lid < larr.length; lid++) {
        let line = larr[lid].replace(commentRegex, "");
        if (cmatch = line.match(exampleRegex)) {
          if (!cmatch[2].includes("//TEST")) examples.push({c:cmatch[1], r:cmatch[2].replace(/ ?\/\/(NOTE|NOTTEST)/g, ""), raw: cmatch[2].split("//NOTE")[0].split("→")[1]});
        } else if (cmatch = line.match(/  ([NSAa,¹²³⁴⁵⁶⁷⁸⁹｝］ ]+): (.+)/)) {
          
          let texamples = [];
          let exm;
          while (exm = larr[++lid].match(exampleRegex)) {
            if (!exm[2].includes("//TEST")) texamples.push({c:exm[1], r:exm[2].replace(/ ?\/\/(NOTE|NOTTEST)/g, ""), raw: exm[2].split("//NOTE")[0].split("→")[1]});
          }
          lid--;
          
          typearr.push({t: cmatch[1], desc: cmatch[2], e: texamples});
        }
      }
      obj.examples = examples;
      obj.types = typearr;
      data.push(obj);
    }
    console.log("chars.txt parsed!");
    
    createTable();
    
    
    // loading implemented data
    
    $.ajax({
      url: "files/implemented.md",
      success: function (implemented) {
        console.log("implemented.md loaded!");
        const regex = /^\|`([^`]+)`\s*\|(.+)$/gm;
        let match;
  
        // parsing
        while (match = regex.exec(implemented)) {
          let chr = match[1];
          let cols = match[2].substring(1,match[2].length-2).split(" | ");
          let dataItem = data.find((item) => item.c === chr);
          if (!dataItem) {
            console.warn("char not found: "+chr);
            continue;
          }
          dataItem.impl = {};
          if (cols.length > 1 || cols[0].length > 1) {
            let tarr = cols.length === 5? ["N", "S", "A", "｝", "］"] : cols.length === 3? ["N", "S", "A"] : ["NN", "SS", "AA", "NS", "AN", "AS","_","_","_"].slice(0, cols.length);
            cols.forEach((impl, index) => {
              if (impl.length === 1) dataItem.impl[tarr[index]] = impl==="✓";
              else {
                let parts = impl.split(" ");
                dataItem.impl[parts[0].toUpperCase()] = parts[1]==="✓";
              }
            });
          } else {
            dataItem.impl[""] = cols[0]==="✓";
          }
        }
        console.log("implementation data added!");
        createTable();
        if (search.value !== lastSearch && searched) searched(search.value);
      }
    });
  }
});


function searched (sv) {
  lastSearch = sv;
  const scores = {};
  let i = 0;
  for (let term of sv.split("|")) {
    for (let item of data) {
      let score = 0;
      if (term.length === 1) {
        score = (item.c === term || (item.raw.split("//SUB ")[1]||"").includes(term))? i+1e15 : -Infinity;
        if (!scores[item.c] || scores[item.c] < 0) scores[item.c] = score;
      } else {
        if (!item.raw.toLowerCase().includes(term.toLowerCase())) {
          score = -Infinity;
        }
        if (item.c.includes(term)) score+= 1e14;
        if (item.desc.includes(term)) score+= 1e13;
        score-= 1000000*(item.c.length - 1);
        score-= 10000*item.desc.length;
        score+= codepage.indexOf(item.c);
        scores[item.c] = scores[item.c]? Math.max(scores[item.c], score, scores[item.c] + score) : score;
      }
    }
    i++;
  }
  const order = [...document.getElementsByClassName("chrinf")].sort((a, b) => {
    if (a.chr === b.chr) {
      if (a.classList.length > b.classList.length) return 1;
      if (a.classList.length < b.classList.length) return -1;
    } else {
      let sa = scores[a.chr];
      let sb = scores[b.chr];
      if (sa > sb) return -1;
      if (sa < sb) return 1;
    }
    return 0
  });
  for (let el of order) {
    if (scores[el.chr] > -Infinity) {
      el.style.display = "table-row";
      docstable.children[2].prepend(el);
    } else {
      el.style.display = "none";
    }
  }
}


function createTable() {
  if (!docstable.children[2]) docstable.createTBody();
  docstable.children[2].innerHTML = "";
  for (let item of data) {
    let desc = docstable.children[2].insertRow(-1);
    desc.classList.add("sdesc", "chrinf");
    desc.chr = item.c;
    let title = "";
    otransforms.filter(c=>c[1]==item.c).forEach(c => title+= [...c[0]].join(" ")+" <compose>\n");
    cycles.filter(c => c.includes(item.c)).map(c=> title+= c[0] + " <tab>".repeat(c.indexOf(item.c)) + "\n");
    title = title.replace(/"/g, '&quot;');
    desc.innerHTML = `<th><a class="chr" href="" title="${title}"><code>${item.c}</code></a></th>`;
    desc.insertCell(1).innerHTML = item.desc.replace(/`([^`]+)`/g, '<code class="cv">$1</code>');
    let el = desc.children[0].children[0].children[0];
    if (item.impl !== undefined) el.style.color = Object.values(item.impl).includes(true)? "#55bb55" : "#bb5555";
    // simple examples
    if (item.examples.length > 0) {
      let examplesRow = docstable.insertRow(-1);
      examplesRow.classList.add("chrinf");
      examplesRow.chr = item.c;
      let examplesCell = examplesRow.insertCell(0);
      examplesCell.colSpan = 2;
      examplesCell.innerHTML = '<table class="dex"><col width=40px /><tbody></tbody></table>';
      let examplesTable = examplesCell.children[0];
      for (let example of item.examples) {
        let exampleRow = examplesTable.insertRow(-1);
        let indent = exampleRow.insertCell(0);
        indent.classList.add("dindent");
        let code = exampleRow.insertCell(1);
        code.innerHTML = '<code class="cv ex">' + example.c + '</code>'
        let result = exampleRow.insertCell(2);
        result.innerHTML = ' <code> ' + example.r + '</code>'
      }
    }
    // typed descs & examples
    
    if (item.types.length > 0) {
      let typesRow = docstable.insertRow(-1);
      typesRow.classList.add("chrinf");
      typesRow.chr = item.c;
      let typesCell = typesRow.insertCell(0);
      typesCell.colSpan = 2;
      typesCell.innerHTML = '<table class="dtypetable" style="width:100%"> <col width=40px /> <tbody></tbody> </table>';
      let typesTable = typesCell.children[0];
      // type list
      let first = true;
      for (let typeObj of item.types) {
        let typeRow = typesTable.insertRow(-1);
        typeRow.innerHTML = '<th' + (first? '>' : ' class="typecellmid">') + typeObj.t.split(/, ?/).map(c=> '<code>'+c+'</code>').join('<br>') + '</th>';
        if (item.impl !== undefined) {
          for (let el of typeRow.children[0].children) {
            let key = item.impl[[...el.innerText.toUpperCase()].sort().join("")];
            if (key !== undefined) el.style.color = key? "#55bb55" : "#bb5555";
          }
        }
        let typeDesc = typeRow.insertCell(1);
        typeDesc.innerHTML = '<code> ' + typeObj.desc + '</code>';
        // type examples
        
        typeDesc.innerHTML+= '<table class="dex"><tbody></tbody></table>';
        let examplesTable = typeDesc.children[1];
        let first2 = true;
        for (let example of typeObj.e) {
          let exampleRow = examplesTable.insertRow(-1);
          let indent = exampleRow.insertCell(0);
          indent.classList.add("dindent");
          if (first2) indent.classList.add("di-t");
          let code = exampleRow.insertCell(1);
          code.innerHTML = '<code class="cv ex">' + example.c + '</code>';
          let result = exampleRow.insertCell(2);
          result.innerHTML = ' <code> ' + example.r + '</code>';
          first2 = false;
        }
        first = false;
      }
    }
  }
  // various actions
  $("a.chr").click(function (e) {
    e.preventDefault();
    const startPos = program.selectionStart;
    const endPos = program.selectionEnd;
    program.value = program.value.substring(0, startPos) + e.target.innerText + program.value.substring(endPos, program.value.length);
    program.selectionStart = program.selectionEnd = startPos+e.target.innerText.length;
    program.focus();
    update();
  });
  $(".ex").wrap('<a class="example" href=""> </a>');
  $(".example").click(function (e) {
    e.preventDefault();
    program.value = e.target.innerText;
    program.focus();
    update();
    runMain();
  });
  console.log("table created!");
}
let tkey = localStorage.kpr? eval(localStorage.kpr) : c => c.key === "F1" || c.key === "F2";

inputs.onkeydown = program.onkeydown = function (e) {
  // console.log(e);
  let el = e.srcElement
  if (el.selectionStart === el.selectionEnd) {
    if (e.key === "Tab") {
      e.preventDefault();
      var ptr = el.selectionStart;
      var schr = el.value[ptr-1];
      var cycle = cycles.find(c=>c.includes(schr));
      if (!cycle) return;
      var chr = cycle[(cycle.indexOf(schr) + 1) % cycle.length];
      el.value = el.value.substring(0,ptr-1)+chr+el.value.substring(ptr);
      el.selectionStart = el.selectionEnd = ptr;
    } else if (tkey(e)) {
      let ptr = el.selectionStart;
      const PV = el.value;
      for (let [k, v] of transforms) {
        //console.log([...PV.slice(ptr-k.length, ptr)].sort().join(''), k);
        if ([...PV.slice(ptr-k.length, ptr)].sort().join('') === k) {
          el.value = PV.slice(0, ptr-k.length)+v+PV.slice(ptr, PV.length);
          el.selectionStart = el.selectionEnd = ptr-k.length + v.length;
          break;
        }
      }
      e.preventDefault();
    }
  }
}