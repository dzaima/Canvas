const Big = require('./bigDecimal');
const main = require('./main');
var CanvasCode = main.CanvasCode;
var running = false;
const fs = require('fs');
const getStdin = require('get-stdin');
var debug = false;
getStdin().then(inp => {
  var inputstrs = inp.split("\n");
  var inputsParsed = [];
  var cres = "";
  for (var i = 0; i < inputstrs.length; i++) {
    var cl = inputstrs[i];
    if (cl == "```") {
      var arr = [];
      i++;
      while (i < inputstrs.length && inputstrs[i] != "```") {
        arr.push(inputstrs[i]);
        i++;
      }
      cres = new Canvas(arr.join("\n"), null);
    } else {
      var ev;
      try {
        ev = eval(cl);
      } catch (e) {
        ev = undefined;
      }
      if (typeof ev == "number") ev = new Big(cl);
      cres = ev == undefined? cl : ev;
    }
    inputsParsed.push(cres);
  }
  var debug = 0;
  for (var i = 3; i < process.argv.length; i++) {
    arg = process.argv[i];
    if (arg == '-d') debug = 1;
    else if (arg.startsWith('-d')) debug = Number.parseInt(arg.substring(3));
  }
  fs.readFile(process.argv[2], 'utf8', async function (err,file) {
    if (err) {
      return console.err(err);
    }
    var code = new CanvasCode(file, inputsParsed);
    var output = await code.run(debug, false, false);
    process.stdout.write(output);
  });
});