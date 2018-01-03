console.log("docs.js loaded!");
var data = [];
$.ajax({
  url: "files/chars.txt",
  success: function (chars) {
    console.log("chars.txt loaded!");
    var regex = /^([^\t\n ]{1,3})\t(.+)\n(( {2,}.+\n)*)/gm;
    
    let exampleRegex = / {2,4}`([^`]*)` -> (.+)/;
    var match, cmatch;
    // parsing chars.txt
    while (match = regex.exec(chars)) {
      let obj = {c: match[1], desc:match[2], raw: match[0]};
      let larr = match[3].split("\n");
      let typearr = [];
      let examples = [];
      for (let lid = 0; lid < larr.length; lid++) {
        let line = larr[lid];
        if (cmatch = line.match(exampleRegex)) {
          examples.push({c:cmatch[1], r:cmatch[2]});
        } else if (cmatch = line.match(/  ([NSAa, ]+): (.+)/)) {
          
          let texamples = [];
          let exm;
          while (exm = larr[++lid].match(exampleRegex)) {
            texamples.push({c:exm[1], r:exm[2]});
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
        var regex = /^\|`([^`])+`\s+\|(.+)$/gm;
        var match;
        
        // parsing
        while (match = regex.exec(implemented)) {
          let chr = match[1];
          let cols = match[2].substring(1,match[2].length-2).split(" | ");
          if (cols.length == 3 || cols.length == 1 || cols.length > 5) {
            let dataItem = data.find((item) => item.c === chr);
            if (cols.length > 1) {
              let tarr = cols.length == 3? ["N", "S", "A"] : ["NN", "SS", "AA", "NS", "NA", "SA"];
              cols.forEach((impl, index) => {
                dataItem.types.forEach((type) => {
                  if (type.t.toUpperCase().match(new RegExp("\\b" + tarr[index] + "\\b"))) {
                    type.impl = (impl===" "||impl==="□")? "⨯" : impl;
                  }
                });
              });
            } else {
              dataItem.impl = (cols[0]===" "||cols[0]==="□")? "⨯" : cols[0];
            }
          }else
          console.log(" ignoring",chr);
        }
        console.log("implementation data added!");
        createTable();
      }
    });
  }
});

function searched (sv) {
  lastSearch = sv;
  var scores = {};
  var chararr = [];
  for (let item of data) {
    let score = 0;
    if (!item.raw.includes(sv)) {
      score = -Infinity;
    }
    if (item.c.includes(sv)) score+= 1e15;
    if (item.desc.includes(sv)) score+= 1e14;
    score-= 100*(item.c.length - 1);
    score-= item.desc.length;
    scores[item.c] = score;
    chararr.push(item.c);
  }
  var order = [...document.getElementsByClassName("chrinf")].sort((a, b) => {
    if (a.chr === b.chr) {
      if (a.classList.length > b.classList.length) return 1;
      if (a.classList.length < b.classList.length) return -1;
    } else {
      let sa = scores[a.chr];
      let sb = scores[b.chr];
      if (sa > sb) return 1;
      if (sa < sb) return -1;
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
    desc.innerHTML = '<th><a class="chr" href=""><code>' + item.c + '</code></a></th>';
    desc.insertCell(1).innerHTML = (item.impl? "<code>"+item.impl+"</code> " : " ") + item.desc;
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
        code.innerHTML = '<code class="cv">' + example.c + '</code>'
        let result = exampleRow.insertCell(2);
        result.innerHTML = ' → <code> ' + example.r + '</code>'
      }
    }
    // typed descs & examples
    
    if (item.types.length > 0) {
      let typesRow = docstable.insertRow(-1);
      typesRow.classList.add("chrinf");
      typesRow.chr = item.c;
      let typesCell = typesRow.insertCell(0);
      typesCell.colSpan = 2;
      typesCell.innerHTML = '<table class="dtypetable" style="width:100%"> <col width=40px /> <col width=5px /> <tbody></tbody> </table>';
      let typesTable = typesCell.children[0];
      // type list
      let first = true;
      for (let typeObj of item.types) {
        let typeRow = typesTable.insertRow(-1);
        typeRow.innerHTML = '<th' + (first? '>' : ' class="typecellmid">') + typeObj.t.split(/, ?/).map(c=> '<code>'+c+'</code>').join('<br>') + '</th>';
        let typeImpl = typeRow.insertCell(1);
        typeImpl.innerHTML = typeObj.impl? '<code>' + typeObj.impl + '</code>' : "";
        let typeDesc = typeRow.insertCell(2);
        typeDesc.innerHTML = '<code> ' + typeObj.desc + '</code>'
        // type examples
        
        let examplesRow = typesTable.insertRow(-1);
        examplesRow.innerHTML = '<th></th>';
        let examplesCell = examplesRow.insertCell(1);
        examplesCell.colSpan = 2;
        examplesCell.innerHTML = '<table class="dex"><tbody></tbody></table>';
        let examplesTable = examplesCell.children[0];
        let first2 = true;
        for (let example of typeObj.e) {
          let exampleRow = examplesTable.insertRow(-1);
          let indent = exampleRow.insertCell(0);
          indent.classList.add("dindent");
          if (first2) indent.classList.add("di-t");
          let code = exampleRow.insertCell(1);
          code.innerHTML = '<code class="cv">' + example.c + '</code>'
          let result = exampleRow.insertCell(2);
          result.innerHTML = ' → <code> ' + example.r + '</code>'
          first2 = false;
        }
        first = false;
      }
    }
  }
  // various actions
  $("a.chr").click(function (e) {
    e.preventDefault();
    var startPos = program.selectionStart;
    var endPos = program.selectionEnd;
    program.value = program.value.substring(0, startPos) + e.target.innerText + program.value.substring(endPos, program.value.length);
    program.selectionStart = program.selectionEnd = startPos+e.target.innerText.length;
    program.focus();
    update();
  });
  $(".cv").wrap('<a class="example" href=""> </a>');
  $(".example").click(function (e) {
    e.preventDefault();
    program.value = e.target.innerText;
    program.focus();
    update();
    runUI();
  });
  console.log("table created!");
}