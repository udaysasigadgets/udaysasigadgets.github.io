var req = null;
//Backward compatibility
var americaStrTickers = "INDU,^GSPC,^IXIC,^GSPTSE,^MERV,^BVSP,^IPSA,^MXX,";
var europeStrTickers = "^FTSE,^IETP,^FCHI,^GDAXI,^IBEX,^DKDOW,FTSEMIB.MI,^AEX,^SSMI,^NLDOW,^PSI20,^BFX,^ISEQ,^ATX,^STOXX50E,^NODOW,^OMXSPI,";
var asiaStrTickers = "^BSESN,^NSEI,000001.SS,^JKSE,^KLSE,^N225,^STI,^KS11,^TWII,^HSI,PSEI.PS,^CSE,^TA100,^AORD,^NZ50";


var countrytickers = {};
countrytickers["Argentina"] = "^MERV,";
countrytickers["Australia"] = "^AORD,";
countrytickers["Austria"] = "^ATX,";
countrytickers["Belgium"] = "^BFX,";
countrytickers["Brazil"] = "^BVSP,";
countrytickers["Canada"] = "^GSPTSE,";
countrytickers["Chile"] = "^IPSA,";
countrytickers["China"] = "000001.SS,";
countrytickers["Denmark"] = "^DKDOW,";
countrytickers["France"] = "^FCHI,";
countrytickers["Germany"] = "^GDAXI,";
countrytickers["Hong Kong"] = "^HSI,";
countrytickers["India"] = "^BSESN,^NSEI,";
countrytickers["Indonesia"] = "^JKSE,";
countrytickers["Ireland"] = "^ISEQ,^IETP,";
countrytickers["Israel"] = "^TA100,";
countrytickers["Italy"] = "FTSEMIB.MI,";
countrytickers["Japan"] = "^N225,";
countrytickers["Korea"] = "^KS11,";
countrytickers["Malaysia"] = "^KLSE,";
countrytickers["Mexico"] = "^MXX,";
countrytickers["Netherlands"] = "^NLDOW,^AEX,";
countrytickers["New Zealand"] = "^NZ50,";
countrytickers["Norway"] = "^NODOW,";
countrytickers["Philippines"] = "PSEI.PS,";
countrytickers["Portugal"] = "^PSI20,";
countrytickers["Singapore"] = "^STI,";
countrytickers["Spain"] = "^IBEX,";
countrytickers["Sri Lanka"] = "^CSE,";
countrytickers["Sweden"] = "^OMXSPI,";
countrytickers["Switzerland"] = "^SSMI,^STOXX50E,";
countrytickers["Taiwan"] = "^TWII,";
countrytickers["UK"] = "^FTSE,";
countrytickers["United States"] = "INDU,^GSPC,^IXIC,";

var strTickers = '';

var marketType = localStorage["marketType"];
    if(marketType!=null) {
        if(marketType==1) {
            strTickers = americaStrTickers;
            localStorage["countries"] = 'United States,Canada,Argentina,Brazil,Chile,Mexico';
        } else if(marketType==2) {
            strTickers = europeStrTickers;
            localStorage["countries"] = 'UK,Ireland,France,Germany,Spain,Italy,Switzerland,Portugal,Belgium,Austria,Denmark,Netherlands,Norway';
        } else if(marketType==3) {
            strTickers = asiaStrTickers;
            localStorage["countries"] = 'India,China,Indonesia,Malaysia,Japan,Taiwan,Turkey,Egypt,Singapore,Korea,Myanmar,Hong Kong,Philippines,Sri Lanka,Israel,Australia,New Zealand';
        } else {
            strTickers = americaStrTickers+europeStrTickers+asiaStrTickers;
            localStorage["countries"] = 'United States,Canada,Argentina,Brazil,Chile,Mexico,UK,Ireland,France,Germany,Spain,Italy,Switzerland,Portugal,Belgium,Austria,Denmark,Netherlands,Norway,India,China,Indonesia,Malaysia,Japan,Taiwan,Turkey,Egypt,Singapore,Korea,Myanmar,Hong Kong,Philippines,Sri Lanka,Israel,Australia,New Zealand';
        }

        localStorage.removeItem("marketType");
    } else {
        var localCountries = localStorage["countries"];
        if(localCountries!=null) {
            var countries = localStorage["countries"].split(',');
            for(var i=0;i<countries.length;i++) {
                if(countries[i]!='') {
                    strTickers += countrytickers[countries[i]];
                }
            }
        } else {
            //Default
            strTickers = americaStrTickers;
            localStorage["countries"] = 'United States,Canada,Argentina,Brazil,Chile,Mexico';
        }
    }

var stockTickers = convertToArray(strTickers);
var baseURL = "http://download.finance.yahoo.com/d?s=";
var refreshrate = 10;
var newDate = new Date().getTime();
var reloadId = "0";

var showStrength = 1;

var staticImgUrl = new Array();
for (var u = 0; u < stockTickers.length; u++) {
    staticImgUrl[stockTickers[u].symbol] = "images/"+getAlphaNumericName(stockTickers[u].symbol)+".gif";
}

function getAlphaNumericName(txtString)
{
    txtString = txtString.toLowerCase();
    txtString = txtString.replace(/[^a-zA-Z 0-9]+/g,"");
    return txtString;
}

function convertToArray(str) {
    var returnArray = new Array();
    str = str.replace(/ /g, ",");
    var ticks = str.split(",");
    for (var d = 0; d < ticks.length; d++) {
        var curTicker = ticks[d];
        curTicker = curTicker.toUpperCase();
        if (curTicker == "") {
            continue;
        }
        returnArray.push(new StockTicker(curTicker, "Loading..", "0", "0", "(0%)"));
    }
    return returnArray;
}

function StockTicker(symbol, name, price, change, percent) {
    this.symbol = symbol;
    this.name = name;
    this.price = price;
    this.change = change;
    this.percent = percent;
}
function getSymbolArray() {
    var sa = new Array();
    for (u = 0; u < stockTickers.length; u++) {
        sa = sa.concat(stockTickers[u].symbol);
    }
    return sa;
}

function callServer() {
    var sa = getSymbolArray();
    if (sa.length == 0) {
        return;
    }
    var symbol = "";
    for (var h = 0; h < sa.length - 1; h++) {
        symbol += sa[h] + ",";
    }
    symbol += sa[h];
    newDate = new Date().getTime();
    var financeURL = baseURL + symbol + "&f=snl1c1p2&dummy=" + newDate;


    req = new XMLHttpRequest();
    req.open("GET",financeURL,true);
    req.onload = handleResponse;
    req.send(null);

    //writeLog('Call made to server : '+financeURL);
}
function fixCommas(str) {
    var x = 0;
    while (str.indexOf("\"", x) >= 0) {
        var y = str.indexOf("\"", x);
        var z = str.indexOf("\"", y + 1);
        var w = str.indexOf(",", y);
        if (w > y && w < z) {
            str = str.substring(0, w) + "." + str.substring(w + 1);
        }
        x = z + 1;
    }
    return str;
}
function handleResponse() {
    var responseString = req.responseText;
    refreshrate = 60;
    var result = responseString;
    try {
        var myregexp = new RegExp("\n");
        var quotes = new Array();
        quotes = result.split(myregexp);
        for (var c = 0; c < quotes.length; c++) {
            var curQuote = quotes[c];
            var curQuoteDetail = fixCommas(curQuote).split(",");
            var curQuoteTicker = curQuoteDetail[0];
            curQuoteTicker = getRefinedSymbol(curQuoteTicker);
            curQuoteTicker=curQuoteTicker.replace("^DJI","INDU");
            var pos = getPosition(curQuoteTicker);
            if(pos==-1)
                continue;

            var symbol = curQuoteTicker;

            var nameSpan = document.getElementById(symbol + "NameSpan");
            var priceSpan = document.getElementById(symbol + "PriceSpan");
            var changeSpan = document.getElementById(symbol + "ChangeSpan");
            var percentSpan = document.getElementById(symbol + "PercentSpan");
            var tickerSpan = document.getElementById(symbol + "Span");
            var row = document.getElementById(symbol + "Row");
            var curQuoteName = curQuoteDetail[1];
            curQuoteName = getRefinedName(curQuoteName);
            if (symbol == curQuoteName) {
                curQuoteName = "Invalid symbol";
            }
            curQuoteName = curQuoteName.toUpperCase();
            nameSpan.innerHTML = curQuoteName;
            setName(pos, curQuoteName);
            var curQuotePrice = removeBold(curQuoteDetail[2]);
            curQuotePrice = rcs(curQuotePrice);
            curQuotePrice = removeItalics(curQuotePrice);
            var curQuoteChange = removeBold(curQuoteDetail[3]);
            curQuoteChange = removeItalics(curQuoteChange);
            try {
                curQuotePrice = parseFloat(curQuotePrice);
                if (curQuotePrice > 0.1) {
                    curQuotePrice = roundNumber(curQuotePrice);
                    curQuotePrice = round2Decimals(curQuotePrice);
                }
            }
            catch (e) {
                curQuotePrice = "N/A";
            }

            var curQuotePercentChange ="";
            try {
                curQuotePercentChange = curQuoteDetail[4].substring(1, curQuoteDetail[4].length - 2);
            }
                catch (e) {
                     curQuotePercentChange = "N/A";
                }
            curQuotePercentChange = removeBold(curQuotePercentChange);
            curQuotePercentChange = removeItalics(curQuotePercentChange);
            curQuotePercentChange = trim(curQuotePercentChange);
            try {
                curQuotePercentChange = parseFloat(curQuotePercentChange);
                if (curQuotePrice > 0.1) {
                    curQuotePercentChange = roundNumber(curQuotePercentChange);
                    curQuotePercentChange = round2Decimals(curQuotePercentChange);
                }
            }
            catch (e) {
                curQuotePercentChange = "N/A";
            }
            priceSpan.innerHTML = curQuotePrice;

            var curQuoteOldPrice = getPrice(pos);
            setPrice(pos, curQuotePrice);
            if (isNaN(curQuoteChange)) {
                curQuoteChange = "N/A";
            } else {
                if (curQuotePrice > 0.1) {
                    curQuoteChange = roundNumber(curQuoteChange);
                    curQuoteChange = round2Decimals(curQuoteChange);
                }
            }
            setChange(pos, curQuoteChange);
            if (curQuoteChange != 'N/A' && curQuoteChange >= 0) {
                curQuoteChange = "+" + curQuoteChange;
            }
            changeSpan.innerHTML = curQuoteChange;
            if (isNaN(curQuotePercentChange)) {
                curQuotePercentChange = "N/A";
            } else {
                curQuotePercentChange = roundNumber(curQuotePercentChange);
                curQuotePercentChange = round2Decimals(curQuotePercentChange);
                if (curQuotePercentChange >= 0) {
                    curQuotePercentChange = "+" + curQuotePercentChange;
                }
            }
            setPercentChange(pos, curQuotePercentChange);
            percentSpan.innerHTML = "(" + curQuotePercentChange + "%)";
            if (parseFloat(curQuoteChange) < 0) {
                changeSpan.style.color = "#990000";
                percentSpan.style.color = "#990000";
            } else if (parseFloat(curQuoteChange) > 0) {
                changeSpan.style.color = "#009900";
                percentSpan.style.color = "#009900";
            } else {
                changeSpan.style.color = "#999999";
                percentSpan.style.color = "#999999";
            }
        }

    }
    catch (e) {
        writeLog(e);
    }
}
function getPrice(c) {
    return stockTickers[c].price;
}
function setPrice(c, newPrice) {
    stockTickers[c].price = newPrice;
}
function setPercentChange(c, newPercent) {
    stockTickers[c].percent = newPercent;
}
function setChange(c, newChange) {
    stockTickers[c].change = newChange;
}
function getSymbol(c) {
    if (c < stockTickers.length) {
        return stockTickers[c].symbol;
    } else {
        return "";
    }
}
function setName(c, newName) {
    stockTickers[c].name = newName;
}
function getRefinedSymbol(str) {
    return str.substring(1, str.length - 1);
}
function getRefinedName(str) {
    return str.substring(1, str.length - 1);
}
function trim(str) {
    return str.replace(/^\s*|\s*$/g, "");
}

function paintStockTicker() {
    var hideCols = localStorage["hideColumns"];
    var changedisplay="", percentdisplay="";
    if(hideCols==1)
        changedisplay = "none";
    if(hideCols==2)
        percentdisplay = "none";

    var header = "<table class=\"fixedtable\" align=center style=\"table-layout: fixed; border:0;  font-family: arial,sans-serif;\" width=\"100%\" id=\"contentTable\" cellspacing=0 cellpadding=1>";
    var footer = "</table>";
    var contentText = "";
    var bgcolor="ffffff";
    for (i = 0; i < stockTickers.length; i++) {
        if(i%2==1)
            bgcolor="ffffff";
        else
            bgcolor="f5f5f5";

        contentText += "<tr id=\"" + stockTickers[i].symbol + "Row\" bgcolor=\""+bgcolor+"\" >";
        contentText += "<td width=\"30px\" style=\"padding-right: 3px\" align=\"center\"><img src=\""+staticImgUrl[stockTickers[i].symbol]+"\" width=\"21\" height=\"14\" border=\"1\"/></td>";
        contentText += "<td width=\"100%\" class=\"dynamic\" nowrap style=\"display:\" align=\"left\"><font size=\"-1\"><a class=\"link\" href=\"http://finance.yahoo.com/q?s=" + stockTickers[i].symbol + "\" target=\"blank\"><span style=\"display:\" id=\"" + stockTickers[i].symbol + "NameSpan\">" + stockTickers[i].name + "</span></a></font></td>";
        contentText += "<td width=\"75px\" style=\"padding-right: 0.5em;\" align=\"right\"><font size=\"-1\"><span id=\"" + stockTickers[i].symbol + "PriceSpan\">" + stockTickers[i].price + "</span></font></td>";
        contentText += "<td width=\"65px\" style=\"display:"+changedisplay+";padding-right: 0.5em;\" align=\"right\" nowrap><font size=\"-1\"><span id=\"" + stockTickers[i].symbol + "ChangeSpan\">" + stockTickers[i].change + "</span></font></td>";
        contentText += "<td width=\"65px\" align=\"right\" style=\"display:"+percentdisplay+"\" nowrap><font size=\"-1\"><span id=\"" + stockTickers[i].symbol + "PercentSpan\">" + stockTickers[i].percent + "</span></font></td>";
        contentText += "</tr>";
    }

    document.getElementById("cD").innerHTML = header + contentText + footer;
    try {
        clearTimeout(reloadId);
    }
    catch (e) {
    }
    callServer();
}


function roundNumber(num) {
    var rlength = 2;
    var newnumber = Math.round(num * Math.pow(10, rlength)) / Math.pow(10, rlength);
    return newnumber;
}

function formatData(str) {
    str = str.replace("\n", "").replace("\r", "");
    if (str.indexOf("\"") == -1) {
        return str;
    } else {
        return str.substring(1, str.length - 1);
    }
}
function round2Decimals(n) {
    var stringNumber = "" + n;
    if (stringNumber.indexOf(".") == -1) {
        stringNumber += ".00";
    } else {
        if (stringNumber.substring(stringNumber.indexOf(".") + 1).length == 1) {
            stringNumber += "0";
        }
    }
    return stringNumber;
}

function sortNumber(a,b)
{
    if(a-b)
        return a-b;
    else
        return true;
}

function removeBold(str) {
    var boldIndexStart = str.indexOf("<b>");
    var boldIndexEnd = str.lastIndexOf("</b>");
    if (boldIndexStart == -1) {
        return str;
    }
    var curQuotePrice = str.substring(boldIndexStart + 3, boldIndexEnd);
    return curQuotePrice;
}
function removeItalics(str) {
    var italicIndexStart = str.indexOf("<i>");
    var italicIndexEnd = str.lastIndexOf("</i>");
    if (italicIndexStart == -1) {
        return str;
    }
    var curQuotePrice = str.substring(italicIndexStart + 3, italicIndexEnd);
    return curQuotePrice;
}
function rcs(str) {
    var imgstart = str.indexOf("<img");
    if (imgstart == -1) {
        return str;
    }
    var csis = str.indexOf(">", imgstart);
    var curQuotePrice = str.substring(0,imgstart)+str.substring(csis + 1);
    return curQuotePrice;
}
function joinString(a, b) {
    var onelen = a.length;
    var twolen = (a.length + b.length > 20) ? (20 - a.length) : b.length;
    if (twolen != b.length) {
        b = b.substring(0, twolen) + "..";
    }
    var res = b + " (" + a + ")";
    return res;
}

function getPosition(sym) {
    var pos = 0;
    var arr = stockTickers;
    for(var l = 0; l < arr.length; l++) {
        if(arr[l].symbol.toUpperCase()==sym.toUpperCase())
            return (l);
    }
    return -1;
}

Array.prototype.contains = function(element)   {
    for (var i = 0; i < this.length; i++)
        if (this[i] == element)
            return true;
    return false;
}

paintStockTicker();


//////////////////////////////////

function writeLog(str) {
    document.getElementById("logDiv").innerHTML += str+'<br>';
}

//////////////////////////////////
