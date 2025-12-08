exports.id=3651,exports.ids=[3651],exports.modules={40777:(e,t,i)=>{let r=i(93735),o=i(60975),n=i(12985),a=i(53178);function s(e,t,i,n,a){let s=[].slice.call(arguments,1),l=s.length,c="function"==typeof s[l-1];if(!c&&!r())throw Error("Callback required as last argument");if(c){if(l<2)throw Error("Too few arguments provided");2===l?(a=i,i=t,t=n=void 0):3===l&&(t.getContext&&void 0===a?(a=n,n=void 0):(a=n,n=i,i=t,t=void 0))}else{if(l<1)throw Error("Too few arguments provided");return 1===l?(i=t,t=n=void 0):2!==l||t.getContext||(n=i,i=t,t=void 0),new Promise(function(r,a){try{let a=o.create(i,n);r(e(a,t,n))}catch(e){a(e)}})}try{let r=o.create(i,n);a(null,e(r,t,n))}catch(e){a(e)}}o.create,t.toCanvas=s.bind(null,n.render),s.bind(null,n.renderToDataURL),s.bind(null,function(e,t,i){return a.render(e,i)})},93735:e=>{e.exports=function(){return"function"==typeof Promise&&Promise.prototype&&Promise.prototype.then}},6163:(e,t,i)=>{let r=i(52688).getSymbolSize;t.getRowColCoords=function(e){if(1===e)return[];let t=Math.floor(e/7)+2,i=r(e),o=145===i?26:2*Math.ceil((i-13)/(2*t-2)),n=[i-7];for(let e=1;e<t-1;e++)n[e]=n[e-1]-o;return n.push(6),n.reverse()},t.getPositions=function(e){let i=[],r=t.getRowColCoords(e),o=r.length;for(let e=0;e<o;e++)for(let t=0;t<o;t++)(0!==e||0!==t)&&(0!==e||t!==o-1)&&(e!==o-1||0!==t)&&i.push([r[e],r[t]]);return i}},79447:(e,t,i)=>{let r=i(93066),o=["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"," ","$","%","*","+","-",".","/",":"];function n(e){this.mode=r.ALPHANUMERIC,this.data=e}n.getBitsLength=function(e){return 11*Math.floor(e/2)+e%2*6},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(e){let t;for(t=0;t+2<=this.data.length;t+=2){let i=45*o.indexOf(this.data[t]);i+=o.indexOf(this.data[t+1]),e.put(i,11)}this.data.length%2&&e.put(o.indexOf(this.data[t]),6)},e.exports=n},2265:e=>{function t(){this.buffer=[],this.length=0}t.prototype={get:function(e){let t=Math.floor(e/8);return(this.buffer[t]>>>7-e%8&1)==1},put:function(e,t){for(let i=0;i<t;i++)this.putBit((e>>>t-i-1&1)==1)},getLengthInBits:function(){return this.length},putBit:function(e){let t=Math.floor(this.length/8);this.buffer.length<=t&&this.buffer.push(0),e&&(this.buffer[t]|=128>>>this.length%8),this.length++}},e.exports=t},77610:e=>{function t(e){if(!e||e<1)throw Error("BitMatrix size must be defined and greater than 0");this.size=e,this.data=new Uint8Array(e*e),this.reservedBit=new Uint8Array(e*e)}t.prototype.set=function(e,t,i,r){let o=e*this.size+t;this.data[o]=i,r&&(this.reservedBit[o]=!0)},t.prototype.get=function(e,t){return this.data[e*this.size+t]},t.prototype.xor=function(e,t,i){this.data[e*this.size+t]^=i},t.prototype.isReserved=function(e,t){return this.reservedBit[e*this.size+t]},e.exports=t},41048:(e,t,i)=>{let r=i(36605),o=i(93066);function n(e){this.mode=o.BYTE,"string"==typeof e&&(e=r(e)),this.data=new Uint8Array(e)}n.getBitsLength=function(e){return 8*e},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(e){for(let t=0,i=this.data.length;t<i;t++)e.put(this.data[t],8)},e.exports=n},83192:(e,t,i)=>{let r=i(62543),o=[1,1,1,1,1,1,1,1,1,1,2,2,1,2,2,4,1,2,4,4,2,4,4,4,2,4,6,5,2,4,6,6,2,5,8,8,4,5,8,8,4,5,8,11,4,8,10,11,4,9,12,16,4,9,16,16,6,10,12,18,6,10,17,16,6,11,16,19,6,13,18,21,7,14,21,25,8,16,20,25,8,17,23,25,9,17,23,34,9,18,25,30,10,20,27,32,12,21,29,35,12,23,34,37,12,25,34,40,13,26,35,42,14,28,38,45,15,29,40,48,16,31,43,51,17,33,45,54,18,35,48,57,19,37,51,60,19,38,53,63,20,40,56,66,21,43,59,70,22,45,62,74,24,47,65,77,25,49,68,81],n=[7,10,13,17,10,16,22,28,15,26,36,44,20,36,52,64,26,48,72,88,36,64,96,112,40,72,108,130,48,88,132,156,60,110,160,192,72,130,192,224,80,150,224,264,96,176,260,308,104,198,288,352,120,216,320,384,132,240,360,432,144,280,408,480,168,308,448,532,180,338,504,588,196,364,546,650,224,416,600,700,224,442,644,750,252,476,690,816,270,504,750,900,300,560,810,960,312,588,870,1050,336,644,952,1110,360,700,1020,1200,390,728,1050,1260,420,784,1140,1350,450,812,1200,1440,480,868,1290,1530,510,924,1350,1620,540,980,1440,1710,570,1036,1530,1800,570,1064,1590,1890,600,1120,1680,1980,630,1204,1770,2100,660,1260,1860,2220,720,1316,1950,2310,750,1372,2040,2430];t.getBlocksCount=function(e,t){switch(t){case r.L:return o[(e-1)*4+0];case r.M:return o[(e-1)*4+1];case r.Q:return o[(e-1)*4+2];case r.H:return o[(e-1)*4+3];default:return}},t.getTotalCodewordsCount=function(e,t){switch(t){case r.L:return n[(e-1)*4+0];case r.M:return n[(e-1)*4+1];case r.Q:return n[(e-1)*4+2];case r.H:return n[(e-1)*4+3];default:return}}},62543:(e,t)=>{t.L={bit:1},t.M={bit:0},t.Q={bit:3},t.H={bit:2},t.isValid=function(e){return e&&void 0!==e.bit&&e.bit>=0&&e.bit<4},t.from=function(e,i){if(t.isValid(e))return e;try{return function(e){if("string"!=typeof e)throw Error("Param is not a string");switch(e.toLowerCase()){case"l":case"low":return t.L;case"m":case"medium":return t.M;case"q":case"quartile":return t.Q;case"h":case"high":return t.H;default:throw Error("Unknown EC Level: "+e)}}(e)}catch(e){return i}}},37630:(e,t,i)=>{let r=i(52688).getSymbolSize;t.getPositions=function(e){let t=r(e);return[[0,0],[t-7,0],[0,t-7]]}},61599:(e,t,i)=>{let r=i(52688),o=r.getBCHDigit(1335);t.getEncodedBits=function(e,t){let i=e.bit<<3|t,n=i<<10;for(;r.getBCHDigit(n)-o>=0;)n^=1335<<r.getBCHDigit(n)-o;return(i<<10|n)^21522}},14901:(e,t)=>{let i=new Uint8Array(512),r=new Uint8Array(256);(function(){let e=1;for(let t=0;t<255;t++)i[t]=e,r[e]=t,256&(e<<=1)&&(e^=285);for(let e=255;e<512;e++)i[e]=i[e-255]})(),t.log=function(e){if(e<1)throw Error("log("+e+")");return r[e]},t.exp=function(e){return i[e]},t.mul=function(e,t){return 0===e||0===t?0:i[r[e]+r[t]]}},85271:(e,t,i)=>{let r=i(93066),o=i(52688);function n(e){this.mode=r.KANJI,this.data=e}n.getBitsLength=function(e){return 13*e},n.prototype.getLength=function(){return this.data.length},n.prototype.getBitsLength=function(){return n.getBitsLength(this.data.length)},n.prototype.write=function(e){let t;for(t=0;t<this.data.length;t++){let i=o.toSJIS(this.data[t]);if(i>=33088&&i<=40956)i-=33088;else if(i>=57408&&i<=60351)i-=49472;else throw Error("Invalid SJIS character: "+this.data[t]+"\nMake sure your charset is UTF-8");i=(i>>>8&255)*192+(255&i),e.put(i,13)}},e.exports=n},74154:(e,t)=>{t.Patterns={PATTERN000:0,PATTERN001:1,PATTERN010:2,PATTERN011:3,PATTERN100:4,PATTERN101:5,PATTERN110:6,PATTERN111:7};let i={N1:3,N2:3,N3:40,N4:10};t.isValid=function(e){return null!=e&&""!==e&&!isNaN(e)&&e>=0&&e<=7},t.from=function(e){return t.isValid(e)?parseInt(e,10):void 0},t.getPenaltyN1=function(e){let t=e.size,r=0,o=0,n=0,a=null,s=null;for(let l=0;l<t;l++){o=n=0,a=s=null;for(let c=0;c<t;c++){let t=e.get(l,c);t===a?o++:(o>=5&&(r+=i.N1+(o-5)),a=t,o=1),(t=e.get(c,l))===s?n++:(n>=5&&(r+=i.N1+(n-5)),s=t,n=1)}o>=5&&(r+=i.N1+(o-5)),n>=5&&(r+=i.N1+(n-5))}return r},t.getPenaltyN2=function(e){let t=e.size,r=0;for(let i=0;i<t-1;i++)for(let o=0;o<t-1;o++){let t=e.get(i,o)+e.get(i,o+1)+e.get(i+1,o)+e.get(i+1,o+1);(4===t||0===t)&&r++}return r*i.N2},t.getPenaltyN3=function(e){let t=e.size,r=0,o=0,n=0;for(let i=0;i<t;i++){o=n=0;for(let a=0;a<t;a++)o=o<<1&2047|e.get(i,a),a>=10&&(1488===o||93===o)&&r++,n=n<<1&2047|e.get(a,i),a>=10&&(1488===n||93===n)&&r++}return r*i.N3},t.getPenaltyN4=function(e){let t=0,r=e.data.length;for(let i=0;i<r;i++)t+=e.data[i];return Math.abs(Math.ceil(100*t/r/5)-10)*i.N4},t.applyMask=function(e,i){let r=i.size;for(let o=0;o<r;o++)for(let n=0;n<r;n++)i.isReserved(n,o)||i.xor(n,o,function(e,i,r){switch(e){case t.Patterns.PATTERN000:return(i+r)%2==0;case t.Patterns.PATTERN001:return i%2==0;case t.Patterns.PATTERN010:return r%3==0;case t.Patterns.PATTERN011:return(i+r)%3==0;case t.Patterns.PATTERN100:return(Math.floor(i/2)+Math.floor(r/3))%2==0;case t.Patterns.PATTERN101:return i*r%2+i*r%3==0;case t.Patterns.PATTERN110:return(i*r%2+i*r%3)%2==0;case t.Patterns.PATTERN111:return(i*r%3+(i+r)%2)%2==0;default:throw Error("bad maskPattern:"+e)}}(e,n,o))},t.getBestMask=function(e,i){let r=Object.keys(t.Patterns).length,o=0,n=1/0;for(let a=0;a<r;a++){i(a),t.applyMask(a,e);let r=t.getPenaltyN1(e)+t.getPenaltyN2(e)+t.getPenaltyN3(e)+t.getPenaltyN4(e);t.applyMask(a,e),r<n&&(n=r,o=a)}return o}},93066:(e,t,i)=>{let r=i(35004),o=i(2782);t.NUMERIC={id:"Numeric",bit:1,ccBits:[10,12,14]},t.ALPHANUMERIC={id:"Alphanumeric",bit:2,ccBits:[9,11,13]},t.BYTE={id:"Byte",bit:4,ccBits:[8,16,16]},t.KANJI={id:"Kanji",bit:8,ccBits:[8,10,12]},t.MIXED={bit:-1},t.getCharCountIndicator=function(e,t){if(!e.ccBits)throw Error("Invalid mode: "+e);if(!r.isValid(t))throw Error("Invalid version: "+t);return t>=1&&t<10?e.ccBits[0]:t<27?e.ccBits[1]:e.ccBits[2]},t.getBestModeForData=function(e){return o.testNumeric(e)?t.NUMERIC:o.testAlphanumeric(e)?t.ALPHANUMERIC:o.testKanji(e)?t.KANJI:t.BYTE},t.toString=function(e){if(e&&e.id)return e.id;throw Error("Invalid mode")},t.isValid=function(e){return e&&e.bit&&e.ccBits},t.from=function(e,i){if(t.isValid(e))return e;try{return function(e){if("string"!=typeof e)throw Error("Param is not a string");switch(e.toLowerCase()){case"numeric":return t.NUMERIC;case"alphanumeric":return t.ALPHANUMERIC;case"kanji":return t.KANJI;case"byte":return t.BYTE;default:throw Error("Unknown mode: "+e)}}(e)}catch(e){return i}}},25823:(e,t,i)=>{let r=i(93066);function o(e){this.mode=r.NUMERIC,this.data=e.toString()}o.getBitsLength=function(e){return 10*Math.floor(e/3)+(e%3?e%3*3+1:0)},o.prototype.getLength=function(){return this.data.length},o.prototype.getBitsLength=function(){return o.getBitsLength(this.data.length)},o.prototype.write=function(e){let t,i;for(t=0;t+3<=this.data.length;t+=3)i=parseInt(this.data.substr(t,3),10),e.put(i,10);let r=this.data.length-t;r>0&&(i=parseInt(this.data.substr(t),10),e.put(i,3*r+1))},e.exports=o},50371:(e,t,i)=>{let r=i(14901);t.mul=function(e,t){let i=new Uint8Array(e.length+t.length-1);for(let o=0;o<e.length;o++)for(let n=0;n<t.length;n++)i[o+n]^=r.mul(e[o],t[n]);return i},t.mod=function(e,t){let i=new Uint8Array(e);for(;i.length-t.length>=0;){let e=i[0];for(let o=0;o<t.length;o++)i[o]^=r.mul(t[o],e);let o=0;for(;o<i.length&&0===i[o];)o++;i=i.slice(o)}return i},t.generateECPolynomial=function(e){let i=new Uint8Array([1]);for(let o=0;o<e;o++)i=t.mul(i,new Uint8Array([1,r.exp(o)]));return i}},60975:(e,t,i)=>{let r=i(52688),o=i(62543),n=i(2265),a=i(77610),s=i(6163),l=i(37630),c=i(74154),d=i(83192),u=i(55834),h=i(12285),p=i(61599),g=i(93066),f=i(23559);function w(e,t,i){let r,o;let n=e.size,a=p.getEncodedBits(t,i);for(r=0;r<15;r++)o=(a>>r&1)==1,r<6?e.set(r,8,o,!0):r<8?e.set(r+1,8,o,!0):e.set(n-15+r,8,o,!0),r<8?e.set(8,n-r-1,o,!0):r<9?e.set(8,15-r-1+1,o,!0):e.set(8,15-r-1,o,!0);e.set(n-8,8,1,!0)}t.create=function(e,t){let i,p;if(void 0===e||""===e)throw Error("No input text");let m=o.M;return void 0!==t&&(m=o.from(t.errorCorrectionLevel,o.M),i=h.from(t.version),p=c.from(t.maskPattern),t.toSJISFunc&&r.setToSJISFunction(t.toSJISFunc)),function(e,t,i,o){let p;if(Array.isArray(e))p=f.fromArray(e);else if("string"==typeof e){let r=t;if(!r){let t=f.rawSplit(e);r=h.getBestVersionForData(t,i)}p=f.fromString(e,r||40)}else throw Error("Invalid data");let m=h.getBestVersionForData(p,i);if(!m)throw Error("The amount of data is too big to be stored in a QR Code");if(t){if(t<m)throw Error("\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: "+m+".\n")}else t=m;let b=function(e,t,i){let o=new n;i.forEach(function(t){o.put(t.mode.bit,4),o.put(t.getLength(),g.getCharCountIndicator(t.mode,e)),t.write(o)});let a=(r.getSymbolTotalCodewords(e)-d.getTotalCodewordsCount(e,t))*8;for(o.getLengthInBits()+4<=a&&o.put(0,4);o.getLengthInBits()%8!=0;)o.putBit(0);let s=(a-o.getLengthInBits())/8;for(let e=0;e<s;e++)o.put(e%2?17:236,8);return function(e,t,i){let o,n;let a=r.getSymbolTotalCodewords(t),s=a-d.getTotalCodewordsCount(t,i),l=d.getBlocksCount(t,i),c=a%l,h=l-c,p=Math.floor(a/l),g=Math.floor(s/l),f=g+1,w=p-g,m=new u(w),b=0,y=Array(l),v=Array(l),x=0,$=new Uint8Array(e.buffer);for(let e=0;e<l;e++){let t=e<h?g:f;y[e]=$.slice(b,b+t),v[e]=m.encode(y[e]),b+=t,x=Math.max(x,t)}let k=new Uint8Array(a),C=0;for(o=0;o<x;o++)for(n=0;n<l;n++)o<y[n].length&&(k[C++]=y[n][o]);for(o=0;o<w;o++)for(n=0;n<l;n++)k[C++]=v[n][o];return k}(o,e,t)}(t,i,p),y=new a(r.getSymbolSize(t));return function(e,t){let i=e.size,r=l.getPositions(t);for(let t=0;t<r.length;t++){let o=r[t][0],n=r[t][1];for(let t=-1;t<=7;t++)if(!(o+t<=-1)&&!(i<=o+t))for(let r=-1;r<=7;r++)n+r<=-1||i<=n+r||(t>=0&&t<=6&&(0===r||6===r)||r>=0&&r<=6&&(0===t||6===t)||t>=2&&t<=4&&r>=2&&r<=4?e.set(o+t,n+r,!0,!0):e.set(o+t,n+r,!1,!0))}}(y,t),function(e){let t=e.size;for(let i=8;i<t-8;i++){let t=i%2==0;e.set(i,6,t,!0),e.set(6,i,t,!0)}}(y),function(e,t){let i=s.getPositions(t);for(let t=0;t<i.length;t++){let r=i[t][0],o=i[t][1];for(let t=-2;t<=2;t++)for(let i=-2;i<=2;i++)-2===t||2===t||-2===i||2===i||0===t&&0===i?e.set(r+t,o+i,!0,!0):e.set(r+t,o+i,!1,!0)}}(y,t),w(y,i,0),t>=7&&function(e,t){let i,r,o;let n=e.size,a=h.getEncodedBits(t);for(let t=0;t<18;t++)i=Math.floor(t/3),r=t%3+n-8-3,o=(a>>t&1)==1,e.set(i,r,o,!0),e.set(r,i,o,!0)}(y,t),function(e,t){let i=e.size,r=-1,o=i-1,n=7,a=0;for(let s=i-1;s>0;s-=2)for(6===s&&s--;;){for(let i=0;i<2;i++)if(!e.isReserved(o,s-i)){let r=!1;a<t.length&&(r=(t[a]>>>n&1)==1),e.set(o,s-i,r),-1==--n&&(a++,n=7)}if((o+=r)<0||i<=o){o-=r,r=-r;break}}}(y,b),isNaN(o)&&(o=c.getBestMask(y,w.bind(null,y,i))),c.applyMask(o,y),w(y,i,o),{modules:y,version:t,errorCorrectionLevel:i,maskPattern:o,segments:p}}(e,i,m,p)}},55834:(e,t,i)=>{let r=i(50371);function o(e){this.genPoly=void 0,this.degree=e,this.degree&&this.initialize(this.degree)}o.prototype.initialize=function(e){this.degree=e,this.genPoly=r.generateECPolynomial(this.degree)},o.prototype.encode=function(e){if(!this.genPoly)throw Error("Encoder not initialized");let t=new Uint8Array(e.length+this.degree);t.set(e);let i=r.mod(t,this.genPoly),o=this.degree-i.length;if(o>0){let e=new Uint8Array(this.degree);return e.set(i,o),e}return i},e.exports=o},2782:(e,t)=>{let i="[0-9]+",r="(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+",o="(?:(?![A-Z0-9 $%*+\\-./:]|"+(r=r.replace(/u/g,"\\u"))+")(?:.|[\r\n]))+";t.KANJI=RegExp(r,"g"),t.BYTE_KANJI=RegExp("[^A-Z0-9 $%*+\\-./:]+","g"),t.BYTE=RegExp(o,"g"),t.NUMERIC=RegExp(i,"g"),t.ALPHANUMERIC=RegExp("[A-Z $%*+\\-./:]+","g");let n=RegExp("^"+r+"$"),a=RegExp("^"+i+"$"),s=RegExp("^[A-Z0-9 $%*+\\-./:]+$");t.testKanji=function(e){return n.test(e)},t.testNumeric=function(e){return a.test(e)},t.testAlphanumeric=function(e){return s.test(e)}},23559:(e,t,i)=>{let r=i(93066),o=i(25823),n=i(79447),a=i(41048),s=i(85271),l=i(2782),c=i(52688),d=i(11452);function u(e){return unescape(encodeURIComponent(e)).length}function h(e,t,i){let r;let o=[];for(;null!==(r=e.exec(i));)o.push({data:r[0],index:r.index,mode:t,length:r[0].length});return o}function p(e){let t,i;let o=h(l.NUMERIC,r.NUMERIC,e),n=h(l.ALPHANUMERIC,r.ALPHANUMERIC,e);return c.isKanjiModeEnabled()?(t=h(l.BYTE,r.BYTE,e),i=h(l.KANJI,r.KANJI,e)):(t=h(l.BYTE_KANJI,r.BYTE,e),i=[]),o.concat(n,t,i).sort(function(e,t){return e.index-t.index}).map(function(e){return{data:e.data,mode:e.mode,length:e.length}})}function g(e,t){switch(t){case r.NUMERIC:return o.getBitsLength(e);case r.ALPHANUMERIC:return n.getBitsLength(e);case r.KANJI:return s.getBitsLength(e);case r.BYTE:return a.getBitsLength(e)}}function f(e,t){let i;let l=r.getBestModeForData(e);if((i=r.from(t,l))!==r.BYTE&&i.bit<l.bit)throw Error('"'+e+'" cannot be encoded with mode '+r.toString(i)+".\n Suggested mode is: "+r.toString(l));switch(i!==r.KANJI||c.isKanjiModeEnabled()||(i=r.BYTE),i){case r.NUMERIC:return new o(e);case r.ALPHANUMERIC:return new n(e);case r.KANJI:return new s(e);case r.BYTE:return new a(e)}}t.fromArray=function(e){return e.reduce(function(e,t){return"string"==typeof t?e.push(f(t,null)):t.data&&e.push(f(t.data,t.mode)),e},[])},t.fromString=function(e,i){let o=function(e,t){let i={},o={start:{}},n=["start"];for(let a=0;a<e.length;a++){let s=e[a],l=[];for(let e=0;e<s.length;e++){let c=s[e],d=""+a+e;l.push(d),i[d]={node:c,lastCount:0},o[d]={};for(let e=0;e<n.length;e++){let a=n[e];i[a]&&i[a].node.mode===c.mode?(o[a][d]=g(i[a].lastCount+c.length,c.mode)-g(i[a].lastCount,c.mode),i[a].lastCount+=c.length):(i[a]&&(i[a].lastCount=c.length),o[a][d]=g(c.length,c.mode)+4+r.getCharCountIndicator(c.mode,t))}}n=l}for(let e=0;e<n.length;e++)o[n[e]].end=0;return{map:o,table:i}}(function(e){let t=[];for(let i=0;i<e.length;i++){let o=e[i];switch(o.mode){case r.NUMERIC:t.push([o,{data:o.data,mode:r.ALPHANUMERIC,length:o.length},{data:o.data,mode:r.BYTE,length:o.length}]);break;case r.ALPHANUMERIC:t.push([o,{data:o.data,mode:r.BYTE,length:o.length}]);break;case r.KANJI:t.push([o,{data:o.data,mode:r.BYTE,length:u(o.data)}]);break;case r.BYTE:t.push([{data:o.data,mode:r.BYTE,length:u(o.data)}])}}return t}(p(e,c.isKanjiModeEnabled())),i),n=d.find_path(o.map,"start","end"),a=[];for(let e=1;e<n.length-1;e++)a.push(o.table[n[e]].node);return t.fromArray(a.reduce(function(e,t){let i=e.length-1>=0?e[e.length-1]:null;return i&&i.mode===t.mode?e[e.length-1].data+=t.data:e.push(t),e},[]))},t.rawSplit=function(e){return t.fromArray(p(e,c.isKanjiModeEnabled()))}},52688:(e,t)=>{let i;let r=[0,26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085,1156,1258,1364,1474,1588,1706,1828,1921,2051,2185,2323,2465,2611,2761,2876,3034,3196,3362,3532,3706];t.getSymbolSize=function(e){if(!e)throw Error('"version" cannot be null or undefined');if(e<1||e>40)throw Error('"version" should be in range from 1 to 40');return 4*e+17},t.getSymbolTotalCodewords=function(e){return r[e]},t.getBCHDigit=function(e){let t=0;for(;0!==e;)t++,e>>>=1;return t},t.setToSJISFunction=function(e){if("function"!=typeof e)throw Error('"toSJISFunc" is not a valid function.');i=e},t.isKanjiModeEnabled=function(){return void 0!==i},t.toSJIS=function(e){return i(e)}},35004:(e,t)=>{t.isValid=function(e){return!isNaN(e)&&e>=1&&e<=40}},12285:(e,t,i)=>{let r=i(52688),o=i(83192),n=i(62543),a=i(93066),s=i(35004),l=r.getBCHDigit(7973);function c(e,t){return a.getCharCountIndicator(e,t)+4}t.from=function(e,t){return s.isValid(e)?parseInt(e,10):t},t.getCapacity=function(e,t,i){if(!s.isValid(e))throw Error("Invalid QR Code version");void 0===i&&(i=a.BYTE);let n=(r.getSymbolTotalCodewords(e)-o.getTotalCodewordsCount(e,t))*8;if(i===a.MIXED)return n;let l=n-c(i,e);switch(i){case a.NUMERIC:return Math.floor(l/10*3);case a.ALPHANUMERIC:return Math.floor(l/11*2);case a.KANJI:return Math.floor(l/13);case a.BYTE:default:return Math.floor(l/8)}},t.getBestVersionForData=function(e,i){let r;let o=n.from(i,n.M);if(Array.isArray(e)){if(e.length>1)return function(e,i){for(let r=1;r<=40;r++)if(function(e,t){let i=0;return e.forEach(function(e){let r=c(e.mode,t);i+=r+e.getBitsLength()}),i}(e,r)<=t.getCapacity(r,i,a.MIXED))return r}(e,o);if(0===e.length)return 1;r=e[0]}else r=e;return function(e,i,r){for(let o=1;o<=40;o++)if(i<=t.getCapacity(o,r,e))return o}(r.mode,r.getLength(),o)},t.getEncodedBits=function(e){if(!s.isValid(e)||e<7)throw Error("Invalid QR Code version");let t=e<<12;for(;r.getBCHDigit(t)-l>=0;)t^=7973<<r.getBCHDigit(t)-l;return e<<12|t}},76537:(e,t,i)=>{"use strict";e.exports=i(14690)},12985:(e,t,i)=>{let r=i(86724);t.render=function(e,t,i){var o;let n=i,a=t;void 0!==n||t&&t.getContext||(n=t,t=void 0),t||(a=function(){try{return document.createElement("canvas")}catch(e){throw Error("You need to specify a canvas element")}}()),n=r.getOptions(n);let s=r.getImageWidth(e.modules.size,n),l=a.getContext("2d"),c=l.createImageData(s,s);return r.qrToImageData(c.data,e,n),o=a,l.clearRect(0,0,o.width,o.height),o.style||(o.style={}),o.height=s,o.width=s,o.style.height=s+"px",o.style.width=s+"px",l.putImageData(c,0,0),a},t.renderToDataURL=function(e,i,r){let o=r;void 0!==o||i&&i.getContext||(o=i,i=void 0),o||(o={});let n=t.render(e,i,o),a=o.type||"image/png",s=o.rendererOpts||{};return n.toDataURL(a,s.quality)}},59530:(e,t,i)=>{let r=i(29021),o=i(97836).O,n=i(86724);t.render=function(e,t){let i=n.getOptions(t),r=i.rendererOpts,a=n.getImageWidth(e.modules.size,i);r.width=a,r.height=a;let s=new o(r);return n.qrToImageData(s.data,e,i),s},t.renderToDataURL=function(e,i,r){void 0===r&&(r=i,i=void 0),t.renderToBuffer(e,i,function(e,t){e&&r(e);let i="data:image/png;base64,";i+=t.toString("base64"),r(null,i)})},t.renderToBuffer=function(e,i,r){void 0===r&&(r=i,i=void 0);let o=t.render(e,i),n=[];o.on("error",r),o.on("data",function(e){n.push(e)}),o.on("end",function(){r(null,Buffer.concat(n))}),o.pack()},t.renderToFile=function(e,i,o,n){void 0===n&&(n=o,o=void 0);let a=!1,s=(...e)=>{a||(a=!0,n.apply(null,e))},l=r.createWriteStream(e);l.on("error",s),l.on("close",s),t.renderToFileStream(l,i,o)},t.renderToFileStream=function(e,i,r){t.render(i,r).pack().pipe(e)}},53178:(e,t,i)=>{let r=i(86724);function o(e,t){let i=e.a/255,r=t+'="'+e.hex+'"';return i<1?r+" "+t+'-opacity="'+i.toFixed(2).slice(1)+'"':r}function n(e,t,i){let r=e+t;return void 0!==i&&(r+=" "+i),r}t.render=function(e,t,i){let a=r.getOptions(t),s=e.modules.size,l=e.modules.data,c=s+2*a.margin,d=a.color.light.a?"<path "+o(a.color.light,"fill")+' d="M0 0h'+c+"v"+c+'H0z"/>':"",u="<path "+o(a.color.dark,"stroke")+' d="'+function(e,t,i){let r="",o=0,a=!1,s=0;for(let l=0;l<e.length;l++){let c=Math.floor(l%t),d=Math.floor(l/t);c||a||(a=!0),e[l]?(s++,l>0&&c>0&&e[l-1]||(r+=a?n("M",c+i,.5+d+i):n("m",o,0),o=0,a=!1),c+1<t&&e[l+1]||(r+=n("h",s),s=0)):o++}return r}(l,s,a.margin)+'"/>',h='<svg xmlns="http://www.w3.org/2000/svg" '+(a.width?'width="'+a.width+'" height="'+a.width+'" ':"")+('viewBox="0 0 '+c)+" "+c+'" shape-rendering="crispEdges">'+d+u+"</svg>\n";return"function"==typeof i&&i(null,h),h}},37275:(e,t,i)=>{let r=i(53178);t.render=r.render,t.renderToFile=function(e,r,o,n){void 0===n&&(n=o,o=void 0);let a=i(29021),s=t.render(r,o);a.writeFile(e,'<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'+s,n)}},39061:(e,t,i)=>{let r=i(52472),o=i(29950);t.render=function(e,t,i){return t&&t.small?o.render(e,t,i):r.render(e,t,i)}},29950:(e,t)=>{let i="\x1b[37m",r="\x1b[30m",o="\x1b[0m",n="\x1b[47m"+r,a="\x1b[40m"+i,s=function(e,t,i,r){let o=t+1;return i>=o||r>=o||r<-1||i<-1?"0":i>=t||r>=t||r<0||i<0?"1":e[r*t+i]?"2":"1"},l=function(e,t,i,r){return s(e,t,i,r)+s(e,t,i,r+1)};t.render=function(e,t,s){var c,d;let u=e.modules.size,h=e.modules.data,p=!!(t&&t.inverse),g=t&&t.inverse?a:n,f={"00":o+" "+g,"01":o+(c=p?r:i)+"▄"+g,"02":o+(d=p?i:r)+"▄"+g,10:o+c+"▀"+g,11:" ",12:"▄",20:o+d+"▀"+g,21:"▀",22:"█"},w=o+"\n"+g,m=g;for(let e=-1;e<u+1;e+=2){for(let t=-1;t<u;t++)m+=f[l(h,u,t,e)];m+=f[l(h,u,u,e)]+w}return m+=o,"function"==typeof s&&s(null,m),m}},52472:(e,t)=>{t.render=function(e,t,i){let r=e.modules.size,o=e.modules.data,n="\x1b[47m  \x1b[0m",a="",s=Array(r+3).join(n),l=[,,].join(n);a+=s+"\n";for(let e=0;e<r;++e){a+=n;for(let t=0;t<r;t++)a+=o[e*r+t]?"\x1b[40m  \x1b[0m":n;a+=l+"\n"}return a+=s+"\n","function"==typeof i&&i(null,a),a}},23330:(e,t,i)=>{let r=i(86724),o={WW:" ",WB:"▄",BB:"█",BW:"▀"},n={BB:" ",BW:"▄",WW:"█",WB:"▀"};t.render=function(e,t,i){let a=r.getOptions(t),s=o;("#ffffff"===a.color.dark.hex||"#000000"===a.color.light.hex)&&(s=n);let l=e.modules.size,c=e.modules.data,d="",u=Array(l+2*a.margin+1).join(s.WW);u=Array(a.margin/2+1).join(u+"\n");let h=Array(a.margin+1).join(s.WW);d+=u;for(let e=0;e<l;e+=2){d+=h;for(let t=0;t<l;t++){var p;let i=c[e*l+t],r=c[(e+1)*l+t];d+=(p=s,i&&r?p.BB:i&&!r?p.BW:!i&&r?p.WB:p.WW)}d+=h+"\n"}return d+=u.slice(0,-1),"function"==typeof i&&i(null,d),d},t.renderToFile=function(e,r,o,n){void 0===n&&(n=o,o=void 0);let a=i(29021),s=t.render(r,o);a.writeFile(e,s,n)}},86724:(e,t)=>{function i(e){if("number"==typeof e&&(e=e.toString()),"string"!=typeof e)throw Error("Color should be defined as hex string");let t=e.slice().replace("#","").split("");if(t.length<3||5===t.length||t.length>8)throw Error("Invalid hex color: "+e);(3===t.length||4===t.length)&&(t=Array.prototype.concat.apply([],t.map(function(e){return[e,e]}))),6===t.length&&t.push("F","F");let i=parseInt(t.join(""),16);return{r:i>>24&255,g:i>>16&255,b:i>>8&255,a:255&i,hex:"#"+t.slice(0,6).join("")}}t.getOptions=function(e){e||(e={}),e.color||(e.color={});let t=void 0===e.margin||null===e.margin||e.margin<0?4:e.margin,r=e.width&&e.width>=21?e.width:void 0,o=e.scale||4;return{width:r,scale:r?4:o,margin:t,color:{dark:i(e.color.dark||"#000000ff"),light:i(e.color.light||"#ffffffff")},type:e.type,rendererOpts:e.rendererOpts||{}}},t.getScale=function(e,t){return t.width&&t.width>=e+2*t.margin?t.width/(e+2*t.margin):t.scale},t.getImageWidth=function(e,i){let r=t.getScale(e,i);return Math.floor((e+2*i.margin)*r)},t.qrToImageData=function(e,i,r){let o=i.modules.size,n=i.modules.data,a=t.getScale(o,r),s=Math.floor((o+2*r.margin)*a),l=r.margin*a,c=[r.color.light,r.color.dark];for(let t=0;t<s;t++)for(let i=0;i<s;i++){let d=(t*s+i)*4,u=r.color.light;t>=l&&i>=l&&t<s-l&&i<s-l&&(u=c[n[Math.floor((t-l)/a)*o+Math.floor((i-l)/a)]?1:0]),e[d++]=u.r,e[d++]=u.g,e[d++]=u.b,e[d]=u.a}}},14690:(e,t,i)=>{let r=i(93735),o=i(60975),n=i(59530),a=i(23330),s=i(39061),l=i(37275);function c(e,t,i){if(void 0===e)throw Error("String required as first argument");if(void 0===i&&(i=t,t={}),"function"!=typeof i){if(r())t=i||{},i=null;else throw Error("Callback required as last argument")}return{opts:t,cb:i}}function d(e){switch(e){case"svg":return l;case"txt":case"utf8":return a;default:return n}}function u(e,t,i){if(!i.cb)return new Promise(function(r,n){try{let a=o.create(t,i.opts);return e(a,i.opts,function(e,t){return e?n(e):r(t)})}catch(e){n(e)}});try{let r=o.create(t,i.opts);return e(r,i.opts,i.cb)}catch(e){i.cb(e)}}t.create=o.create,t.toCanvas=i(40777).toCanvas,t.toString=function(e,t,i){let r=c(e,t,i);return u(function(e){switch(e){case"svg":return l;case"terminal":return s;default:return a}}(r.opts?r.opts.type:void 0).render,e,r)},t.toDataURL=function(e,t,i){let r=c(e,t,i);return u(d(r.opts.type).renderToDataURL,e,r)},t.toBuffer=function(e,t,i){let r=c(e,t,i);return u(d(r.opts.type).renderToBuffer,e,r)},t.toFile=function(e,t,i,o){if("string"!=typeof e||!("string"==typeof t||"object"==typeof t))throw Error("Invalid argument");if(arguments.length<3&&!r())throw Error("Too few arguments provided");let n=c(t,i,o);return u(d(n.opts.type||e.slice((e.lastIndexOf(".")-1>>>0)+2).toLowerCase()).renderToFile.bind(null,e),t,n)},t.toFileStream=function(e,t,i){if(arguments.length<2)throw Error("Too few arguments provided");let r=c(t,i,e.emit.bind(e,"error"));u(d("png").renderToFileStream.bind(null,e),t,r)}},36605:e=>{"use strict";e.exports=function(e){for(var t=[],i=e.length,r=0;r<i;r++){var o=e.charCodeAt(r);if(o>=55296&&o<=56319&&i>r+1){var n=e.charCodeAt(r+1);n>=56320&&n<=57343&&(o=(o-55296)*1024+n-56320+65536,r+=1)}if(o<128){t.push(o);continue}if(o<2048){t.push(o>>6|192),t.push(63&o|128);continue}if(o<55296||o>=57344&&o<65536){t.push(o>>12|224),t.push(o>>6&63|128),t.push(63&o|128);continue}if(o>=65536&&o<=1114111){t.push(o>>18|240),t.push(o>>12&63|128),t.push(o>>6&63|128),t.push(63&o|128);continue}t.push(239,191,189)}return new Uint8Array(t).buffer}},33651:(e,t,i)=>{"use strict";i.r(t),i.d(t,{W3mAllWalletsView:()=>tw,W3mConnectingWcBasicView:()=>eS,W3mDownloadsView:()=>tv});var r=i(14243),o=i(20519),n=i(80311),a=i(17008),s=i(70906),l=i(50799),c=i(59682);i(15533);var d=i(61867),u=i(48361),h=i(61009),p=i(6442),g=i(11353),f=i(75761);i(83428);var w=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let m=class extends r.WF{constructor(){super(),this.unsubscribe=[],this.tabIdx=void 0,this.connectors=h.a.state.connectors,this.count=s.N.state.count,this.filteredCount=s.N.state.filteredWallets.length,this.isFetchingRecommendedWallets=s.N.state.isFetchingRecommendedWallets,this.unsubscribe.push(h.a.subscribeKey("connectors",e=>this.connectors=e),s.N.subscribeKey("count",e=>this.count=e),s.N.subscribeKey("filteredWallets",e=>this.filteredCount=e.length),s.N.subscribeKey("isFetchingRecommendedWallets",e=>this.isFetchingRecommendedWallets=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.connectors.find(e=>"walletConnect"===e.id),{allWallets:t}=a.H.state;if(!e||"HIDE"===t||"ONLY_MOBILE"===t&&!n.w.isMobile())return null;let i=s.N.state.featured.length,o=this.count+i,l=o<10?o:10*Math.floor(o/10),c=this.filteredCount>0?this.filteredCount:l,h=`${c}`;this.filteredCount>0?h=`${this.filteredCount}`:c<o&&(h=`${c}+`);let g=p.x.hasAnyConnection(u.o.CONNECTOR_ID.WALLET_CONNECT);return(0,r.qy)`
      <wui-list-wallet
        name="Search Wallet"
        walletIcon="search"
        showAllWallets
        @click=${this.onAllWallets.bind(this)}
        tagLabel=${h}
        tagVariant="info"
        data-testid="all-wallets"
        tabIdx=${(0,d.J)(this.tabIdx)}
        .loading=${this.isFetchingRecommendedWallets}
        ?disabled=${g}
        size="sm"
      ></wui-list-wallet>
    `}onAllWallets(){g.E.sendEvent({type:"track",event:"CLICK_ALL_WALLETS"}),f.I.push("AllWallets",{redirectView:f.I.state.data?.redirectView})}};w([(0,o.MZ)()],m.prototype,"tabIdx",void 0),w([(0,o.wk)()],m.prototype,"connectors",void 0),w([(0,o.wk)()],m.prototype,"count",void 0),w([(0,o.wk)()],m.prototype,"filteredCount",void 0),w([(0,o.wk)()],m.prototype,"isFetchingRecommendedWallets",void 0),m=w([(0,c.EM)("w3m-all-wallets-widget")],m);var b=i(46486),y=i(1702),v=i(86681),x=i(87915);let $=(0,c.AH)`
  :host {
    margin-top: ${({spacing:e})=>e["1"]};
  }
  wui-separator {
    margin: ${({spacing:e})=>e["3"]} calc(${({spacing:e})=>e["3"]} * -1)
      ${({spacing:e})=>e["2"]} calc(${({spacing:e})=>e["3"]} * -1);
    width: calc(100% + ${({spacing:e})=>e["3"]} * 2);
  }
`;var k=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let C=class extends r.WF{constructor(){super(),this.unsubscribe=[],this.connectors=h.a.state.connectors,this.recommended=s.N.state.recommended,this.featured=s.N.state.featured,this.explorerWallets=s.N.state.explorerWallets,this.connections=p.x.state.connections,this.connectorImages=b.j.state.connectorImages,this.loadingTelegram=!1,this.unsubscribe.push(h.a.subscribeKey("connectors",e=>this.connectors=e),p.x.subscribeKey("connections",e=>this.connections=e),b.j.subscribeKey("connectorImages",e=>this.connectorImages=e),s.N.subscribeKey("recommended",e=>this.recommended=e),s.N.subscribeKey("featured",e=>this.featured=e),s.N.subscribeKey("explorerFilteredWallets",e=>{this.explorerWallets=e?.length?e:s.N.state.explorerWallets}),s.N.subscribeKey("explorerWallets",e=>{this.explorerWallets?.length||(this.explorerWallets=e)})),n.w.isTelegram()&&n.w.isIos()&&(this.loadingTelegram=!p.x.state.wcUri,this.unsubscribe.push(p.x.subscribeKey("wcUri",e=>this.loadingTelegram=!e)))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return(0,r.qy)`
      <wui-flex flexDirection="column" gap="2"> ${this.connectorListTemplate()} </wui-flex>
    `}mapConnectorsToExplorerWallets(e,t){return e.map(e=>{if("MULTI_CHAIN"===e.type&&e.connectors){let i=e.connectors.map(e=>e.id),r=e.connectors.map(e=>e.name),o=e.connectors.map(e=>e.info?.rdns),n=t?.find(e=>i.includes(e.id)||r.includes(e.name)||e.rdns&&(o.includes(e.rdns)||i.includes(e.rdns)));return e.explorerWallet=n??e.explorerWallet,e}let i=t?.find(t=>t.id===e.id||t.rdns===e.info?.rdns||t.name===e.name);return e.explorerWallet=i??e.explorerWallet,e})}processConnectorsByType(e,t=!0){let i=x.g.sortConnectorsByExplorerWallet([...e]);return t?i.filter(x.g.showConnector):i}connectorListTemplate(){let e=this.mapConnectorsToExplorerWallets(this.connectors,this.explorerWallets??[]),t=x.g.getConnectorsByType(e,this.recommended,this.featured),i=this.processConnectorsByType(t.announced.filter(e=>"walletConnect"!==e.id)),r=this.processConnectorsByType(t.injected),o=this.processConnectorsByType(t.multiChain.filter(e=>"WalletConnect"!==e.name),!1),a=t.custom,s=t.recent,l=this.processConnectorsByType(t.external.filter(e=>e.id!==u.o.CONNECTOR_ID.COINBASE_SDK)),c=t.recommended,d=t.featured,h=x.g.getConnectorTypeOrder({custom:a,recent:s,announced:i,injected:r,multiChain:o,recommended:c,featured:d,external:l}),p=this.connectors.find(e=>"walletConnect"===e.id),g=n.w.isMobile(),f=[];for(let e of h)switch(e){case"walletConnect":!g&&p&&f.push({kind:"connector",subtype:"walletConnect",connector:p});break;case"recent":x.g.getFilteredRecentWallets().forEach(e=>f.push({kind:"wallet",subtype:"recent",wallet:e}));break;case"injected":o.forEach(e=>f.push({kind:"connector",subtype:"multiChain",connector:e})),i.forEach(e=>f.push({kind:"connector",subtype:"announced",connector:e})),r.forEach(e=>f.push({kind:"connector",subtype:"injected",connector:e}));break;case"featured":d.forEach(e=>f.push({kind:"wallet",subtype:"featured",wallet:e}));break;case"custom":x.g.getFilteredCustomWallets(a??[]).forEach(e=>f.push({kind:"wallet",subtype:"custom",wallet:e}));break;case"external":l.forEach(e=>f.push({kind:"connector",subtype:"external",connector:e}));break;case"recommended":x.g.getCappedRecommendedWallets(c).forEach(e=>f.push({kind:"wallet",subtype:"recommended",wallet:e}));break;default:console.warn(`Unknown connector type: ${e}`)}return f.map((e,t)=>"connector"===e.kind?this.renderConnector(e,t):this.renderWallet(e,t))}renderConnector(e,t){let i,o;let n=e.connector,a=y.$.getConnectorImage(n)||this.connectorImages[n?.imageId??""],s=(this.connections.get(n.chain)??[]).some(e=>v.y.isLowerCaseMatch(e.connectorId,n.id));"multiChain"===e.subtype?(i="multichain",o="info"):"walletConnect"===e.subtype?(i="qr code",o="accent"):"injected"===e.subtype||"announced"===e.subtype?(i=s?"connected":"installed",o=s?"info":"success"):(i=void 0,o=void 0);let l=p.x.hasAnyConnection(u.o.CONNECTOR_ID.WALLET_CONNECT),c=("walletConnect"===e.subtype||"external"===e.subtype)&&l;return(0,r.qy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.J)(a)}
        .installed=${!0}
        name=${n.name??"Unknown"}
        .tagVariant=${o}
        tagLabel=${(0,d.J)(i)}
        data-testid=${`wallet-selector-${n.id.toLowerCase()}`}
        size="sm"
        @click=${()=>this.onClickConnector(e)}
        tabIdx=${(0,d.J)(this.tabIdx)}
        ?disabled=${c}
        rdnsId=${(0,d.J)(n.explorerWallet?.rdns||void 0)}
        walletRank=${(0,d.J)(n.explorerWallet?.order)}
      >
      </w3m-list-wallet>
    `}onClickConnector(e){let t=f.I.state.data?.redirectView;if("walletConnect"===e.subtype){h.a.setActiveConnector(e.connector),n.w.isMobile()?f.I.push("AllWallets"):f.I.push("ConnectingWalletConnect",{redirectView:t});return}if("multiChain"===e.subtype){h.a.setActiveConnector(e.connector),f.I.push("ConnectingMultiChain",{redirectView:t});return}if("injected"===e.subtype){h.a.setActiveConnector(e.connector),f.I.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}if("announced"===e.subtype){if("walletConnect"===e.connector.id){n.w.isMobile()?f.I.push("AllWallets"):f.I.push("ConnectingWalletConnect",{redirectView:t});return}f.I.push("ConnectingExternal",{connector:e.connector,redirectView:t,wallet:e.connector.explorerWallet});return}f.I.push("ConnectingExternal",{connector:e.connector,redirectView:t})}renderWallet(e,t){let i=e.wallet,o=y.$.getWalletImage(i),n=p.x.hasAnyConnection(u.o.CONNECTOR_ID.WALLET_CONNECT),a=this.loadingTelegram,s="recent"===e.subtype?"recent":void 0,l="recent"===e.subtype?"info":void 0;return(0,r.qy)`
      <w3m-list-wallet
        displayIndex=${t}
        imageSrc=${(0,d.J)(o)}
        name=${i.name??"Unknown"}
        @click=${()=>this.onClickWallet(e)}
        size="sm"
        data-testid=${`wallet-selector-${i.id}`}
        tabIdx=${(0,d.J)(this.tabIdx)}
        ?loading=${a}
        ?disabled=${n}
        rdnsId=${(0,d.J)(i.rdns||void 0)}
        walletRank=${(0,d.J)(i.order)}
        tagLabel=${(0,d.J)(s)}
        .tagVariant=${l}
      >
      </w3m-list-wallet>
    `}onClickWallet(e){let t=f.I.state.data?.redirectView;if("featured"===e.subtype){h.a.selectWalletConnector(e.wallet);return}if("recent"===e.subtype){if(this.loadingTelegram)return;h.a.selectWalletConnector(e.wallet);return}if("custom"===e.subtype){if(this.loadingTelegram)return;f.I.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t});return}if(this.loadingTelegram)return;let i=h.a.getConnector({id:e.wallet.id,rdns:e.wallet.rdns});i?f.I.push("ConnectingExternal",{connector:i,redirectView:t}):f.I.push("ConnectingWalletConnect",{wallet:e.wallet,redirectView:t})}};C.styles=$,k([(0,o.MZ)({type:Number})],C.prototype,"tabIdx",void 0),k([(0,o.wk)()],C.prototype,"connectors",void 0),k([(0,o.wk)()],C.prototype,"recommended",void 0),k([(0,o.wk)()],C.prototype,"featured",void 0),k([(0,o.wk)()],C.prototype,"explorerWallets",void 0),k([(0,o.wk)()],C.prototype,"connections",void 0),k([(0,o.wk)()],C.prototype,"connectorImages",void 0),k([(0,o.wk)()],C.prototype,"loadingTelegram",void 0),C=k([(0,c.EM)("w3m-connector-list")],C);var E=i(13610),R=i(85107),I=i(12200),T=i(18863),A=i(63540),M=i(64269),W=i(80644),S=i(90151);i(94282),i(95655);var P=i(19416);let N=(0,P.AH)`
  :host {
    flex: 1;
    height: 100%;
  }

  button {
    width: 100%;
    height: 100%;
    display: inline-flex;
    align-items: center;
    padding: ${({spacing:e})=>e[1]} ${({spacing:e})=>e[2]};
    column-gap: ${({spacing:e})=>e[1]};
    color: ${({tokens:e})=>e.theme.textSecondary};
    border-radius: ${({borderRadius:e})=>e[20]};
    background-color: transparent;
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  button[data-active='true'] {
    color: ${({tokens:e})=>e.theme.textPrimary};
    background-color: ${({tokens:e})=>e.theme.foregroundTertiary};
  }

  button:hover:enabled:not([data-active='true']),
  button:active:enabled:not([data-active='true']) {
    wui-text,
    wui-icon {
      color: ${({tokens:e})=>e.theme.textPrimary};
    }
  }
`;var B=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let L={lg:"lg-regular",md:"md-regular",sm:"sm-regular"},O={lg:"md",md:"sm",sm:"sm"},j=class extends r.WF{constructor(){super(...arguments),this.icon="mobile",this.size="md",this.label="",this.active=!1}render(){return(0,r.qy)`
      <button data-active=${this.active}>
        ${this.icon?(0,r.qy)`<wui-icon size=${O[this.size]} name=${this.icon}></wui-icon>`:""}
        <wui-text variant=${L[this.size]}> ${this.label} </wui-text>
      </button>
    `}};j.styles=[W.W5,W.fD,N],B([(0,o.MZ)()],j.prototype,"icon",void 0),B([(0,o.MZ)()],j.prototype,"size",void 0),B([(0,o.MZ)()],j.prototype,"label",void 0),B([(0,o.MZ)({type:Boolean})],j.prototype,"active",void 0),j=B([(0,S.E)("wui-tab-item")],j);let z=(0,P.AH)`
  :host {
    display: inline-flex;
    align-items: center;
    background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    border-radius: ${({borderRadius:e})=>e[32]};
    padding: ${({spacing:e})=>e["01"]};
    box-sizing: border-box;
  }

  :host([data-size='sm']) {
    height: 26px;
  }

  :host([data-size='md']) {
    height: 36px;
  }
`;var q=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let D=class extends r.WF{constructor(){super(...arguments),this.tabs=[],this.onTabChange=()=>null,this.size="md",this.activeTab=0}render(){return this.dataset.size=this.size,this.tabs.map((e,t)=>{let i=t===this.activeTab;return(0,r.qy)`
        <wui-tab-item
          @click=${()=>this.onTabClick(t)}
          icon=${e.icon}
          size=${this.size}
          label=${e.label}
          ?active=${i}
          data-active=${i}
          data-testid="tab-${e.label?.toLowerCase()}"
        ></wui-tab-item>
      `})}onTabClick(e){this.activeTab=e,this.onTabChange(e)}};D.styles=[W.W5,W.fD,z],q([(0,o.MZ)({type:Array})],D.prototype,"tabs",void 0),q([(0,o.MZ)()],D.prototype,"onTabChange",void 0),q([(0,o.MZ)()],D.prototype,"size",void 0),q([(0,o.wk)()],D.prototype,"activeTab",void 0),D=q([(0,S.E)("wui-tabs")],D);var _=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let U=class extends r.WF{constructor(){super(...arguments),this.platformTabs=[],this.unsubscribe=[],this.platforms=[],this.onSelectPlatfrom=void 0}disconnectCallback(){this.unsubscribe.forEach(e=>e())}render(){let e=this.generateTabs();return(0,r.qy)`
      <wui-flex justifyContent="center" .padding=${["0","0","4","0"]}>
        <wui-tabs .tabs=${e} .onTabChange=${this.onTabChange.bind(this)}></wui-tabs>
      </wui-flex>
    `}generateTabs(){let e=this.platforms.map(e=>"browser"===e?{label:"Browser",icon:"extension",platform:"browser"}:"mobile"===e?{label:"Mobile",icon:"mobile",platform:"mobile"}:"qrcode"===e?{label:"Mobile",icon:"mobile",platform:"qrcode"}:"web"===e?{label:"Webapp",icon:"browser",platform:"web"}:"desktop"===e?{label:"Desktop",icon:"desktop",platform:"desktop"}:{label:"Browser",icon:"extension",platform:"unsupported"});return this.platformTabs=e.map(({platform:e})=>e),e}onTabChange(e){let t=this.platformTabs[e];t&&this.onSelectPlatfrom?.(t)}};_([(0,o.MZ)({type:Array})],U.prototype,"platforms",void 0),_([(0,o.MZ)()],U.prototype,"onSelectPlatfrom",void 0),U=_([(0,c.EM)("w3m-connecting-header")],U);var F=i(34375);i(46764);let Z=(0,P.AH)`
  :host {
    width: var(--local-width);
  }

  button {
    width: var(--local-width);
    white-space: nowrap;
    column-gap: ${({spacing:e})=>e[2]};
    transition:
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: scale, background-color, border-radius;
    cursor: pointer;
  }

  /* -- Sizes --------------------------------------------------- */
  button[data-size='sm'] {
    border-radius: ${({borderRadius:e})=>e[2]};
    padding: 0 ${({spacing:e})=>e[2]};
    height: 28px;
  }

  button[data-size='md'] {
    border-radius: ${({borderRadius:e})=>e[3]};
    padding: 0 ${({spacing:e})=>e[4]};
    height: 38px;
  }

  button[data-size='lg'] {
    border-radius: ${({borderRadius:e})=>e[4]};
    padding: 0 ${({spacing:e})=>e[5]};
    height: 48px;
  }

  /* -- Variants --------------------------------------------------------- */
  button[data-variant='accent-primary'] {
    background-color: ${({tokens:e})=>e.core.backgroundAccentPrimary};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='accent-secondary'] {
    background-color: ${({tokens:e})=>e.core.foregroundAccent010};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button[data-variant='neutral-primary'] {
    background-color: ${({tokens:e})=>e.theme.backgroundInvert};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='neutral-secondary'] {
    background-color: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='neutral-tertiary'] {
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  button[data-variant='error-primary'] {
    background-color: ${({tokens:e})=>e.core.textError};
    color: ${({tokens:e})=>e.theme.textInvert};
  }

  button[data-variant='error-secondary'] {
    background-color: ${({tokens:e})=>e.core.backgroundError};
    color: ${({tokens:e})=>e.core.textError};
  }

  button[data-variant='shade'] {
    background: var(--wui-color-gray-glass-002);
    color: var(--wui-color-fg-200);
    border: none;
    box-shadow: inset 0 0 0 1px var(--wui-color-gray-glass-005);
  }

  /* -- Focus states --------------------------------------------------- */
  button[data-size='sm']:focus-visible:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:focus-visible:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:focus-visible:enabled {
    border-radius: 48px;
  }
  button[data-variant='shade']:focus-visible:enabled {
    background: var(--wui-color-gray-glass-005);
    box-shadow:
      inset 0 0 0 1px var(--wui-color-gray-glass-010),
      0 0 0 4px var(--wui-color-gray-glass-002);
  }

  /* -- Hover & Active states ----------------------------------------------------------- */
  @media (hover: hover) {
    button[data-size='sm']:hover:enabled {
      border-radius: 28px;
    }

    button[data-size='md']:hover:enabled {
      border-radius: 38px;
    }

    button[data-size='lg']:hover:enabled {
      border-radius: 48px;
    }

    button[data-variant='shade']:hover:enabled {
      background: var(--wui-color-gray-glass-002);
    }

    button[data-variant='shade']:active:enabled {
      background: var(--wui-color-gray-glass-005);
    }
  }

  button[data-size='sm']:active:enabled {
    border-radius: 28px;
  }

  button[data-size='md']:active:enabled {
    border-radius: 38px;
  }

  button[data-size='lg']:active:enabled {
    border-radius: 48px;
  }

  /* -- Disabled states --------------------------------------------------- */
  button:disabled {
    opacity: 0.3;
  }
`;var H=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let J={lg:"lg-regular-mono",md:"md-regular-mono",sm:"sm-regular-mono"},K={lg:"md",md:"md",sm:"sm"},V=class extends r.WF{constructor(){super(...arguments),this.size="lg",this.disabled=!1,this.fullWidth=!1,this.loading=!1,this.variant="accent-primary"}render(){this.style.cssText=`
    --local-width: ${this.fullWidth?"100%":"auto"};
     `;let e=this.textVariant??J[this.size];return(0,r.qy)`
      <button data-variant=${this.variant} data-size=${this.size} ?disabled=${this.disabled}>
        ${this.loadingTemplate()}
        <slot name="iconLeft"></slot>
        <wui-text variant=${e} color="inherit">
          <slot></slot>
        </wui-text>
        <slot name="iconRight"></slot>
      </button>
    `}loadingTemplate(){if(this.loading){let e=K[this.size],t="neutral-primary"===this.variant||"accent-primary"===this.variant?"invert":"primary";return(0,r.qy)`<wui-loading-spinner color=${t} size=${e}></wui-loading-spinner>`}return null}};V.styles=[W.W5,W.fD,Z],H([(0,o.MZ)()],V.prototype,"size",void 0),H([(0,o.MZ)({type:Boolean})],V.prototype,"disabled",void 0),H([(0,o.MZ)({type:Boolean})],V.prototype,"fullWidth",void 0),H([(0,o.MZ)({type:Boolean})],V.prototype,"loading",void 0),H([(0,o.MZ)()],V.prototype,"variant",void 0),H([(0,o.MZ)()],V.prototype,"textVariant",void 0),V=H([(0,S.E)("wui-button")],V),i(54491),i(27949),i(8224);let Y=(0,P.AH)`
  :host {
    display: block;
    width: 100px;
    height: 100px;
  }

  svg {
    width: 100px;
    height: 100px;
  }

  rect {
    fill: none;
    stroke: ${e=>e.colors.accent100};
    stroke-width: 3px;
    stroke-linecap: round;
    animation: dash 1s linear infinite;
  }

  @keyframes dash {
    to {
      stroke-dashoffset: 0px;
    }
  }
`;var G=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let Q=class extends r.WF{constructor(){super(...arguments),this.radius=36}render(){return this.svgLoaderTemplate()}svgLoaderTemplate(){let e=this.radius>50?50:this.radius,t=36-e;return(0,r.qy)`
      <svg viewBox="0 0 110 110" width="110" height="110">
        <rect
          x="2"
          y="2"
          width="106"
          height="106"
          rx=${e}
          stroke-dasharray="${116+t} ${245+t}"
          stroke-dashoffset=${360+1.75*t}
        />
      </svg>
    `}};Q.styles=[W.W5,Y],G([(0,o.MZ)({type:Number})],Q.prototype,"radius",void 0),Q=G([(0,S.E)("wui-loading-thumbnail")],Q),i(38137),i(55865),i(63189);let X=(0,P.AH)`
  wui-flex {
    width: 100%;
    height: 52px;
    box-sizing: border-box;
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    padding-left: ${({spacing:e})=>e[3]};
    padding-right: ${({spacing:e})=>e[3]};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${({spacing:e})=>e[6]};
  }

  wui-text {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  wui-icon {
    width: 12px;
    height: 12px;
  }
`;var ee=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let et=class extends r.WF{constructor(){super(...arguments),this.disabled=!1,this.label="",this.buttonLabel=""}render(){return(0,r.qy)`
      <wui-flex justifyContent="space-between" alignItems="center">
        <wui-text variant="lg-regular" color="inherit">${this.label}</wui-text>
        <wui-button variant="accent-secondary" size="sm">
          ${this.buttonLabel}
          <wui-icon name="chevronRight" color="inherit" size="inherit" slot="iconRight"></wui-icon>
        </wui-button>
      </wui-flex>
    `}};et.styles=[W.W5,W.fD,X],ee([(0,o.MZ)({type:Boolean})],et.prototype,"disabled",void 0),ee([(0,o.MZ)()],et.prototype,"label",void 0),ee([(0,o.MZ)()],et.prototype,"buttonLabel",void 0),et=ee([(0,S.E)("wui-cta-button")],et);let ei=(0,c.AH)`
  :host {
    display: block;
    padding: 0 ${({spacing:e})=>e["5"]} ${({spacing:e})=>e["5"]};
  }
`;var er=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eo=class extends r.WF{constructor(){super(...arguments),this.wallet=void 0}render(){if(!this.wallet)return this.style.display="none",null;let{name:e,app_store:t,play_store:i,chrome_store:o,homepage:a}=this.wallet,s=n.w.isMobile(),l=n.w.isIos(),d=n.w.isAndroid(),u=[t,i,a,o].filter(Boolean).length>1,h=c.Zv.getTruncateString({string:e,charsStart:12,charsEnd:0,truncate:"end"});return u&&!s?(0,r.qy)`
        <wui-cta-button
          label=${`Don't have ${h}?`}
          buttonLabel="Get"
          @click=${()=>f.I.push("Downloads",{wallet:this.wallet})}
        ></wui-cta-button>
      `:!u&&a?(0,r.qy)`
        <wui-cta-button
          label=${`Don't have ${h}?`}
          buttonLabel="Get"
          @click=${this.onHomePage.bind(this)}
        ></wui-cta-button>
      `:t&&l?(0,r.qy)`
        <wui-cta-button
          label=${`Don't have ${h}?`}
          buttonLabel="Get"
          @click=${this.onAppStore.bind(this)}
        ></wui-cta-button>
      `:i&&d?(0,r.qy)`
        <wui-cta-button
          label=${`Don't have ${h}?`}
          buttonLabel="Get"
          @click=${this.onPlayStore.bind(this)}
        ></wui-cta-button>
      `:(this.style.display="none",null)}onAppStore(){this.wallet?.app_store&&n.w.openHref(this.wallet.app_store,"_blank")}onPlayStore(){this.wallet?.play_store&&n.w.openHref(this.wallet.play_store,"_blank")}onHomePage(){this.wallet?.homepage&&n.w.openHref(this.wallet.homepage,"_blank")}};eo.styles=[ei],er([(0,o.MZ)({type:Object})],eo.prototype,"wallet",void 0),eo=er([(0,c.EM)("w3m-mobile-download-links")],eo);let en=(0,c.AH)`
  @keyframes shake {
    0% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(3px);
    }
    50% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
    100% {
      transform: translateX(0);
    }
  }

  wui-flex:first-child:not(:only-child) {
    position: relative;
  }

  wui-wallet-image {
    width: 56px;
    height: 56px;
  }

  wui-loading-thumbnail {
    position: absolute;
  }

  wui-icon-box {
    position: absolute;
    right: calc(${({spacing:e})=>e["1"]} * -1);
    bottom: calc(${({spacing:e})=>e["1"]} * -1);
    opacity: 0;
    transform: scale(0.5);
    transition-property: opacity, transform;
    transition-duration: ${({durations:e})=>e.lg};
    transition-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    will-change: opacity, transform;
  }

  wui-text[align='center'] {
    width: 100%;
    padding: 0px ${({spacing:e})=>e["4"]};
  }

  [data-error='true'] wui-icon-box {
    opacity: 1;
    transform: scale(1);
  }

  [data-error='true'] > wui-flex:first-child {
    animation: shake 250ms ${({easings:e})=>e["ease-out-power-2"]} both;
  }

  [data-retry='false'] wui-link {
    display: none;
  }

  [data-retry='true'] wui-link {
    display: block;
    opacity: 1;
  }

  w3m-mobile-download-links {
    padding: 0px;
    width: 100%;
  }
`;var ea=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};class es extends r.WF{constructor(){super(),this.wallet=f.I.state.data?.wallet,this.connector=f.I.state.data?.connector,this.timeout=void 0,this.secondaryBtnIcon="refresh",this.onConnect=void 0,this.onRender=void 0,this.onAutoConnect=void 0,this.isWalletConnect=!0,this.unsubscribe=[],this.imageSrc=y.$.getConnectorImage(this.connector)??y.$.getWalletImage(this.wallet),this.name=this.wallet?.name??this.connector?.name??"Wallet",this.isRetrying=!1,this.uri=p.x.state.wcUri,this.error=p.x.state.wcError,this.ready=!1,this.showRetry=!1,this.label=void 0,this.secondaryBtnLabel="Try again",this.secondaryLabel="Accept connection request in the wallet",this.isLoading=!1,this.isMobile=!1,this.onRetry=void 0,this.unsubscribe.push(p.x.subscribeKey("wcUri",e=>{this.uri=e,this.isRetrying&&this.onRetry&&(this.isRetrying=!1,this.onConnect?.())}),p.x.subscribeKey("wcError",e=>this.error=e)),(n.w.isTelegram()||n.w.isSafari())&&n.w.isIos()&&p.x.state.wcUri&&this.onConnect?.()}firstUpdated(){this.onAutoConnect?.(),this.showRetry=!this.onAutoConnect}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),p.x.setWcError(!1),clearTimeout(this.timeout)}render(){this.onRender?.(),this.onShowRetry();let e=this.error?"Connection can be declined if a previous request is still active":this.secondaryLabel,t="";return this.label?t=this.label:(t=`Continue in ${this.name}`,this.error&&(t="Connection declined")),(0,r.qy)`
      <wui-flex
        data-error=${(0,d.J)(this.error)}
        data-retry=${this.showRetry}
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="6"
      >
        <wui-flex gap="2" justifyContent="center" alignItems="center">
          <wui-wallet-image size="lg" imageSrc=${(0,d.J)(this.imageSrc)}></wui-wallet-image>

          ${this.error?null:this.loaderTemplate()}

          <wui-icon-box
            color="error"
            icon="close"
            size="sm"
            border
            borderColor="wui-color-bg-125"
          ></wui-icon-box>
        </wui-flex>

        <wui-flex flexDirection="column" alignItems="center" gap="6"> <wui-flex
          flexDirection="column"
          alignItems="center"
          gap="2"
          .padding=${["2","0","0","0"]}
        >
          <wui-text align="center" variant="lg-medium" color=${this.error?"error":"primary"}>
            ${t}
          </wui-text>
          <wui-text align="center" variant="lg-regular" color="secondary">${e}</wui-text>
        </wui-flex>

        ${this.secondaryBtnLabel?(0,r.qy)`
                <wui-button
                  variant="neutral-secondary"
                  size="md"
                  ?disabled=${this.isRetrying||this.isLoading}
                  @click=${this.onTryAgain.bind(this)}
                  data-testid="w3m-connecting-widget-secondary-button"
                >
                  <wui-icon
                    color="inherit"
                    slot="iconLeft"
                    name=${this.secondaryBtnIcon}
                  ></wui-icon>
                  ${this.secondaryBtnLabel}
                </wui-button>
              `:null}
      </wui-flex>

      ${this.isWalletConnect?(0,r.qy)`
              <wui-flex .padding=${["0","5","5","5"]} justifyContent="center">
                <wui-link
                  @click=${this.onCopyUri}
                  variant="secondary"
                  icon="copy"
                  data-testid="wui-link-copy"
                >
                  Copy link
                </wui-link>
              </wui-flex>
            `:null}

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links></wui-flex>
      </wui-flex>
    `}onShowRetry(){if(this.error&&!this.showRetry){this.showRetry=!0;let e=this.shadowRoot?.querySelector("wui-button");e?.animate([{opacity:0},{opacity:1}],{fill:"forwards",easing:"ease"})}}onTryAgain(){p.x.setWcError(!1),this.onRetry?(this.isRetrying=!0,this.onRetry?.()):this.onConnect?.()}loaderTemplate(){let e=F.W.state.themeVariables["--w3m-border-radius-master"],t=e?parseInt(e.replace("px",""),10):4;return(0,r.qy)`<wui-loading-thumbnail radius=${9*t}></wui-loading-thumbnail>`}onCopyUri(){try{this.uri&&(n.w.copyToClopboard(this.uri),I.P.showSuccess("Link copied"))}catch{I.P.showError("Failed to copy")}}}es.styles=en,ea([(0,o.wk)()],es.prototype,"isRetrying",void 0),ea([(0,o.wk)()],es.prototype,"uri",void 0),ea([(0,o.wk)()],es.prototype,"error",void 0),ea([(0,o.wk)()],es.prototype,"ready",void 0),ea([(0,o.wk)()],es.prototype,"showRetry",void 0),ea([(0,o.wk)()],es.prototype,"label",void 0),ea([(0,o.wk)()],es.prototype,"secondaryBtnLabel",void 0),ea([(0,o.wk)()],es.prototype,"secondaryLabel",void 0),ea([(0,o.wk)()],es.prototype,"isLoading",void 0),ea([(0,o.MZ)({type:Boolean})],es.prototype,"isMobile",void 0),ea([(0,o.MZ)()],es.prototype,"onRetry",void 0);let el=class extends es{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-browser: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onAutoConnect=this.onConnectProxy.bind(this),g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:f.I.state.view}})}async onConnectProxy(){try{this.error=!1;let{connectors:e}=h.a.state,t=e.find(e=>"ANNOUNCED"===e.type&&e.info?.rdns===this.wallet?.rdns||"INJECTED"===e.type||e.name===this.wallet?.name);if(t)await p.x.connectExternal(t,t.chain);else throw Error("w3m-connecting-wc-browser: No connector found");T.W.close(),g.E.sendEvent({type:"track",event:"CONNECT_SUCCESS",properties:{method:"browser",name:this.wallet?.name||"Unknown",view:f.I.state.view,walletRank:this.wallet?.order}})}catch(e){e instanceof A.A&&e.originalName===E.RQ.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?g.E.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):g.E.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),this.error=!0}}};el=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-browser")],el);let ec=class extends es{constructor(){if(super(),!this.wallet)throw Error("w3m-connecting-wc-desktop: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.onRender=this.onRenderProxy.bind(this),g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"desktop",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:f.I.state.view}})}onRenderProxy(){!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onConnectProxy(){if(this.wallet?.desktop_link&&this.uri)try{this.error=!1;let{desktop_link:e,name:t}=this.wallet,{redirect:i,href:r}=n.w.formatNativeUrl(e,this.uri);p.x.setWcLinking({name:t,href:r}),p.x.setRecentWallet(this.wallet),n.w.openHref(i,"_blank")}catch{this.error=!0}}};ec=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-desktop")],ec);var ed=i(22763),eu=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eh=class extends es{constructor(){if(super(),this.btnLabelTimeout=void 0,this.redirectDeeplink=void 0,this.redirectUniversalLink=void 0,this.target=void 0,this.preferUniversalLinks=a.H.state.experimental_preferUniversalLinks,this.isLoading=!0,this.onConnect=()=>{if(this.wallet?.mobile_link&&this.uri)try{this.error=!1;let{mobile_link:e,link_mode:t,name:i}=this.wallet,{redirect:r,redirectUniversalLink:o,href:a}=n.w.formatNativeUrl(e,this.uri,t);this.redirectDeeplink=r,this.redirectUniversalLink=o,this.target=n.w.isIframe()?"_top":"_self",p.x.setWcLinking({name:i,href:a}),p.x.setRecentWallet(this.wallet),this.preferUniversalLinks&&this.redirectUniversalLink?n.w.openHref(this.redirectUniversalLink,this.target):n.w.openHref(this.redirectDeeplink,this.target)}catch(e){g.E.sendEvent({type:"track",event:"CONNECT_PROXY_ERROR",properties:{message:e instanceof Error?e.message:"Error parsing the deeplink",uri:this.uri,mobile_link:this.wallet.mobile_link,name:this.wallet.name}}),this.error=!0}},!this.wallet)throw Error("w3m-connecting-wc-mobile: No wallet provided");this.secondaryBtnLabel="Open",this.secondaryLabel=ed.oU.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.onHandleURI(),this.unsubscribe.push(p.x.subscribeKey("wcUri",()=>{this.onHandleURI()})),g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"mobile",displayIndex:this.wallet?.display_index,walletRank:this.wallet.order,view:f.I.state.view}})}disconnectedCallback(){super.disconnectedCallback(),clearTimeout(this.btnLabelTimeout)}onHandleURI(){this.isLoading=!this.uri,!this.ready&&this.uri&&(this.ready=!0,this.onConnect?.())}onTryAgain(){p.x.setWcError(!1),this.onConnect?.()}};eu([(0,o.wk)()],eh.prototype,"redirectDeeplink",void 0),eu([(0,o.wk)()],eh.prototype,"redirectUniversalLink",void 0),eu([(0,o.wk)()],eh.prototype,"target",void 0),eu([(0,o.wk)()],eh.prototype,"preferUniversalLinks",void 0),eu([(0,o.wk)()],eh.prototype,"isLoading",void 0),eh=eu([(0,c.EM)("w3m-connecting-wc-mobile")],eh),i(72243);var ep=i(76537);function eg(e,t,i){return e!==t&&(e-t<0?t-e:e-t)<=i+.1}let ef={generate({uri:e,size:t,logoSize:i,padding:o=8,dotColor:n="var(--apkt-colors-black)"}){let a=[],s=function(e,t){let i=Array.prototype.slice.call(ep.create(e,{errorCorrectionLevel:"Q"}).modules.data,0),r=Math.sqrt(i.length);return i.reduce((e,t,i)=>(i%r==0?e.push([t]):e[e.length-1].push(t))&&e,[])}(e,0),l=(t-2*o)/s.length,c=[{x:0,y:0},{x:1,y:0},{x:0,y:1}];c.forEach(({x:e,y:t})=>{let i=(s.length-7)*l*e+o,d=(s.length-7)*l*t+o;for(let e=0;e<c.length;e+=1){let t=l*(7-2*e);a.push((0,r.JW)`
            <rect
              fill=${2===e?"var(--apkt-colors-black)":"var(--apkt-colors-white)"}
              width=${0===e?t-10:t}
              rx= ${0===e?(t-10)*.45:.45*t}
              ry= ${0===e?(t-10)*.45:.45*t}
              stroke=${n}
              stroke-width=${0===e?10:0}
              height=${0===e?t-10:t}
              x= ${0===e?d+l*e+5:d+l*e}
              y= ${0===e?i+l*e+5:i+l*e}
            />
          `)}});let d=Math.floor((i+25)/l),u=s.length/2-d/2,h=s.length/2+d/2-1,p=[];s.forEach((e,t)=>{e.forEach((e,i)=>{!s[t][i]||t<7&&i<7||t>s.length-8&&i<7||t<7&&i>s.length-8||t>u&&t<h&&i>u&&i<h||p.push([t*l+l/2+o,i*l+l/2+o])})});let g={};return p.forEach(([e,t])=>{g[e]?g[e]?.push(t):g[e]=[t]}),Object.entries(g).map(([e,t])=>{let i=t.filter(e=>t.every(t=>!eg(e,t,l)));return[Number(e),i]}).forEach(([e,t])=>{t.forEach(t=>{a.push((0,r.JW)`<circle cx=${e} cy=${t} fill=${n} r=${l/2.5} />`)})}),Object.entries(g).filter(([e,t])=>t.length>1).map(([e,t])=>{let i=t.filter(e=>t.some(t=>eg(e,t,l)));return[Number(e),i]}).map(([e,t])=>{t.sort((e,t)=>e<t?-1:1);let i=[];for(let e of t){let t=i.find(t=>t.some(t=>eg(e,t,l)));t?t.push(e):i.push([e])}return[e,i.map(e=>[e[0],e[e.length-1]])]}).forEach(([e,t])=>{t.forEach(([t,i])=>{a.push((0,r.JW)`
              <line
                x1=${e}
                x2=${e}
                y1=${t}
                y2=${i}
                stroke=${n}
                stroke-width=${l/1.25}
                stroke-linecap="round"
              />
            `)})}),a}},ew=(0,P.AH)`
  :host {
    position: relative;
    user-select: none;
    display: block;
    overflow: hidden;
    aspect-ratio: 1 / 1;
    width: 100%;
    height: 100%;
    background-color: ${({colors:e})=>e.white};
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  :host {
    border-radius: ${({borderRadius:e})=>e[4]};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :host([data-clear='true']) > wui-icon {
    display: none;
  }

  svg:first-child,
  wui-image,
  wui-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    box-shadow: inset 0 0 0 4px ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[6]};
  }

  wui-image {
    width: 25%;
    height: 25%;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  wui-icon {
    width: 100%;
    height: 100%;
    color: #3396ff !important;
    transform: translateY(-50%) translateX(-50%) scale(0.25);
  }

  wui-icon > svg {
    width: inherit;
    height: inherit;
  }
`;var em=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eb=class extends r.WF{constructor(){super(...arguments),this.uri="",this.size=0,this.theme="dark",this.imageSrc=void 0,this.alt=void 0,this.arenaClear=void 0,this.farcaster=void 0}render(){return this.dataset.theme=this.theme,this.dataset.clear=String(this.arenaClear),this.style.cssText=`--local-size: ${this.size}px`,(0,r.qy)`<wui-flex
      alignItems="center"
      justifyContent="center"
      class="wui-qr-code"
      direction="column"
      gap="4"
      width="100%"
      style="height: 100%"
    >
      ${this.templateVisual()} ${this.templateSvg()}
    </wui-flex>`}templateSvg(){return(0,r.JW)`
      <svg height=${this.size} width=${this.size}>
        ${ef.generate({uri:this.uri,size:this.size,logoSize:this.arenaClear?0:this.size/4})}
      </svg>
    `}templateVisual(){return this.imageSrc?(0,r.qy)`<wui-image src=${this.imageSrc} alt=${this.alt??"logo"}></wui-image>`:this.farcaster?(0,r.qy)`<wui-icon
        class="farcaster"
        size="inherit"
        color="inherit"
        name="farcaster"
      ></wui-icon>`:(0,r.qy)`<wui-icon size="inherit" color="inherit" name="walletConnect"></wui-icon>`}};eb.styles=[W.W5,ew],em([(0,o.MZ)()],eb.prototype,"uri",void 0),em([(0,o.MZ)({type:Number})],eb.prototype,"size",void 0),em([(0,o.MZ)()],eb.prototype,"theme",void 0),em([(0,o.MZ)()],eb.prototype,"imageSrc",void 0),em([(0,o.MZ)()],eb.prototype,"alt",void 0),em([(0,o.MZ)({type:Boolean})],eb.prototype,"arenaClear",void 0),em([(0,o.MZ)({type:Boolean})],eb.prototype,"farcaster",void 0),eb=em([(0,S.E)("wui-qr-code")],eb);let ey=(0,P.AH)`
  :host {
    display: block;
    background: linear-gradient(
      90deg,
      ${({tokens:e})=>e.theme.foregroundSecondary} 0%,
      ${({tokens:e})=>e.theme.foregroundTertiary} 50%,
      ${({tokens:e})=>e.theme.foregroundSecondary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1s ease-in-out infinite;
    border-radius: ${({borderRadius:e})=>e[2]};
  }

  :host([data-rounded='true']) {
    border-radius: ${({borderRadius:e})=>e[16]};
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`;var ev=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ex=class extends r.WF{constructor(){super(...arguments),this.width="",this.height="",this.variant="default",this.rounded=!1}render(){return this.style.cssText=`
      width: ${this.width};
      height: ${this.height};
    `,this.dataset.rounded=this.rounded?"true":"false",(0,r.qy)`<slot></slot>`}};ex.styles=[ey],ev([(0,o.MZ)()],ex.prototype,"width",void 0),ev([(0,o.MZ)()],ex.prototype,"height",void 0),ev([(0,o.MZ)()],ex.prototype,"variant",void 0),ev([(0,o.MZ)({type:Boolean})],ex.prototype,"rounded",void 0),ex=ev([(0,S.E)("wui-shimmer")],ex),i(97720);let e$=(0,c.AH)`
  wui-shimmer {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: ${({borderRadius:e})=>e[4]};
  }

  wui-qr-code {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-out-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;var ek=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eC=class extends es{constructor(){super(),this.basic=!1,this.forceUpdate=()=>{this.requestUpdate()},window.addEventListener("resize",this.forceUpdate)}firstUpdated(){this.basic||g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet?.name??"WalletConnect",platform:"qrcode",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:f.I.state.view}})}disconnectedCallback(){super.disconnectedCallback(),this.unsubscribe?.forEach(e=>e()),window.removeEventListener("resize",this.forceUpdate)}render(){return this.onRenderProxy(),(0,r.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["0","5","5","5"]}
        gap="5"
      >
        <wui-shimmer width="100%"> ${this.qrCodeTemplate()} </wui-shimmer>
        <wui-text variant="lg-medium" color="primary"> Scan this QR Code with your phone </wui-text>
        ${this.copyTemplate()}
      </wui-flex>
      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}onRenderProxy(){!this.ready&&this.uri&&(this.timeout=setTimeout(()=>{this.ready=!0},200))}qrCodeTemplate(){if(!this.uri||!this.ready)return null;let e=this.getBoundingClientRect().width-40,t=this.wallet?this.wallet.name:void 0;p.x.setWcLinking(void 0),p.x.setRecentWallet(this.wallet);let i=this.uri;if(this.wallet?.mobile_link){let{redirect:e}=n.w.formatNativeUrl(this.wallet?.mobile_link,this.uri,null);i=e}return(0,r.qy)` <wui-qr-code
      size=${e}
      theme=${F.W.state.themeMode}
      uri=${i}
      imageSrc=${(0,d.J)(y.$.getWalletImage(this.wallet))}
      color=${(0,d.J)(F.W.state.themeVariables["--w3m-qr-color"])}
      alt=${(0,d.J)(t)}
      data-testid="wui-qr-code"
    ></wui-qr-code>`}copyTemplate(){let e=!this.uri||!this.ready;return(0,r.qy)`<wui-button
      .disabled=${e}
      @click=${this.onCopyUri}
      variant="neutral-secondary"
      size="sm"
      data-testid="copy-wc2-uri"
    >
      Copy link
      <wui-icon size="sm" color="inherit" name="copy" slot="iconRight"></wui-icon>
    </wui-button>`}};eC.styles=e$,ek([(0,o.MZ)({type:Boolean})],eC.prototype,"basic",void 0),eC=ek([(0,c.EM)("w3m-connecting-wc-qrcode")],eC);let eE=class extends r.WF{constructor(){if(super(),this.wallet=f.I.state.data?.wallet,!this.wallet)throw Error("w3m-connecting-wc-unsupported: No wallet provided");g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"browser",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:f.I.state.view}})}render(){return(0,r.qy)`
      <wui-flex
        flexDirection="column"
        alignItems="center"
        .padding=${["10","5","5","5"]}
        gap="5"
      >
        <wui-wallet-image
          size="lg"
          imageSrc=${(0,d.J)(y.$.getWalletImage(this.wallet))}
        ></wui-wallet-image>

        <wui-text variant="md-regular" color="primary">Not Detected</wui-text>
      </wui-flex>

      <w3m-mobile-download-links .wallet=${this.wallet}></w3m-mobile-download-links>
    `}};eE=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-connecting-wc-unsupported")],eE);var eR=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eI=class extends es{constructor(){if(super(),this.isLoading=!0,!this.wallet)throw Error("w3m-connecting-wc-web: No wallet provided");this.onConnect=this.onConnectProxy.bind(this),this.secondaryBtnLabel="Open",this.secondaryLabel=ed.oU.CONNECT_LABELS.MOBILE,this.secondaryBtnIcon="externalLink",this.updateLoadingState(),this.unsubscribe.push(p.x.subscribeKey("wcUri",()=>{this.updateLoadingState()})),g.E.sendEvent({type:"track",event:"SELECT_WALLET",properties:{name:this.wallet.name,platform:"web",displayIndex:this.wallet?.display_index,walletRank:this.wallet?.order,view:f.I.state.view}})}updateLoadingState(){this.isLoading=!this.uri}onConnectProxy(){if(this.wallet?.webapp_link&&this.uri)try{this.error=!1;let{webapp_link:e,name:t}=this.wallet,{redirect:i,href:r}=n.w.formatUniversalUrl(e,this.uri);p.x.setWcLinking({name:t,href:r}),p.x.setRecentWallet(this.wallet),n.w.openHref(i,"_blank")}catch{this.error=!0}}};eR([(0,o.wk)()],eI.prototype,"isLoading",void 0),eI=eR([(0,c.EM)("w3m-connecting-wc-web")],eI);let eT=(0,c.AH)`
  :host([data-mobile-fullscreen='true']) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :host([data-mobile-fullscreen='true']) wui-ux-by-reown {
    margin-top: auto;
  }
`;var eA=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eM=class extends r.WF{constructor(){super(),this.wallet=f.I.state.data?.wallet,this.unsubscribe=[],this.platform=void 0,this.platforms=[],this.isSiwxEnabled=!!a.H.state.siwx,this.remoteFeatures=a.H.state.remoteFeatures,this.displayBranding=!0,this.basic=!1,this.determinePlatforms(),this.initializeConnection(),this.unsubscribe.push(a.H.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){return a.H.state.enableMobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,r.qy)`
      ${this.headerTemplate()}
      <div class="platform-container">${this.platformTemplate()}</div>
      ${this.reownBrandingTemplate()}
    `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding&&this.displayBranding?(0,r.qy)`<wui-ux-by-reown></wui-ux-by-reown>`:null}async initializeConnection(e=!1){if("browser"!==this.platform&&(!a.H.state.manualWCControl||e))try{let{wcPairingExpiry:t,status:i}=p.x.state,{redirectView:r}=f.I.state.data??{};if(e||a.H.state.enableEmbedded||n.w.isPairingExpired(t)||"connecting"===i){let e=p.x.getConnections(R.W.state.activeChain),t=this.remoteFeatures?.multiWallet,i=e.length>0;await p.x.connectWalletConnect({cache:"never"}),this.isSiwxEnabled||(i&&t?(f.I.replace("ProfileWallets"),I.P.showSuccess("New Wallet Added")):r?f.I.replace(r):T.W.close())}}catch(e){if(e instanceof Error&&e.message.includes("An error occurred when attempting to switch chain")&&!a.H.state.enableNetworkSwitch&&R.W.state.activeChain){R.W.setActiveCaipNetwork(M.R.getUnsupportedNetwork(`${R.W.state.activeChain}:${R.W.state.activeCaipNetwork?.id}`)),R.W.showUnsupportedChainUI();return}e instanceof A.A&&e.originalName===E.RQ.PROVIDER_RPC_ERROR_NAME.USER_REJECTED_REQUEST?g.E.sendEvent({type:"track",event:"USER_REJECTED",properties:{message:e.message}}):g.E.sendEvent({type:"track",event:"CONNECT_ERROR",properties:{message:e?.message??"Unknown"}}),p.x.setWcError(!0),I.P.showError(e.message??"Connection error"),p.x.resetWcConnection(),f.I.goBack()}}determinePlatforms(){if(!this.wallet){this.platforms.push("qrcode"),this.platform="qrcode";return}if(this.platform)return;let{mobile_link:e,desktop_link:t,webapp_link:i,injected:r,rdns:o}=this.wallet,s=r?.map(({injected_id:e})=>e).filter(Boolean),l=[...o?[o]:s??[]],c=!a.H.state.isUniversalProvider&&l.length,d=p.x.checkInstalled(l),u=c&&d,h=t&&!n.w.isMobile();u&&!R.W.state.noAdapters&&this.platforms.push("browser"),e&&this.platforms.push(n.w.isMobile()?"mobile":"qrcode"),i&&this.platforms.push("web"),h&&this.platforms.push("desktop"),u||!c||R.W.state.noAdapters||this.platforms.push("unsupported"),this.platform=this.platforms[0]}platformTemplate(){switch(this.platform){case"browser":return(0,r.qy)`<w3m-connecting-wc-browser></w3m-connecting-wc-browser>`;case"web":return(0,r.qy)`<w3m-connecting-wc-web></w3m-connecting-wc-web>`;case"desktop":return(0,r.qy)`
          <w3m-connecting-wc-desktop .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-desktop>
        `;case"mobile":return(0,r.qy)`
          <w3m-connecting-wc-mobile isMobile .onRetry=${()=>this.initializeConnection(!0)}>
          </w3m-connecting-wc-mobile>
        `;case"qrcode":return(0,r.qy)`<w3m-connecting-wc-qrcode ?basic=${this.basic}></w3m-connecting-wc-qrcode>`;default:return(0,r.qy)`<w3m-connecting-wc-unsupported></w3m-connecting-wc-unsupported>`}}headerTemplate(){return this.platforms.length>1?(0,r.qy)`
      <w3m-connecting-header
        .platforms=${this.platforms}
        .onSelectPlatfrom=${this.onSelectPlatform.bind(this)}
      >
      </w3m-connecting-header>
    `:null}async onSelectPlatform(e){let t=this.shadowRoot?.querySelector("div");t&&(await t.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.platform=e,t.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}};eM.styles=eT,eA([(0,o.wk)()],eM.prototype,"platform",void 0),eA([(0,o.wk)()],eM.prototype,"platforms",void 0),eA([(0,o.wk)()],eM.prototype,"isSiwxEnabled",void 0),eA([(0,o.wk)()],eM.prototype,"remoteFeatures",void 0),eA([(0,o.MZ)({type:Boolean})],eM.prototype,"displayBranding",void 0),eA([(0,o.MZ)({type:Boolean})],eM.prototype,"basic",void 0),eM=eA([(0,c.EM)("w3m-connecting-wc-view")],eM);var eW=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eS=class extends r.WF{constructor(){super(),this.unsubscribe=[],this.isMobile=n.w.isMobile(),this.remoteFeatures=a.H.state.remoteFeatures,this.unsubscribe.push(a.H.subscribeKey("remoteFeatures",e=>this.remoteFeatures=e))}disconnectedCallback(){this.unsubscribe.forEach(e=>e())}render(){if(this.isMobile){let{featured:e,recommended:t}=s.N.state,{customWallets:i}=a.H.state,o=l.i.getRecentWallets(),n=e.length||t.length||i?.length||o.length;return(0,r.qy)`<wui-flex flexDirection="column" gap="2" .margin=${["1","3","3","3"]}>
        ${n?(0,r.qy)`<w3m-connector-list></w3m-connector-list>`:null}
        <w3m-all-wallets-widget></w3m-all-wallets-widget>
      </wui-flex>`}return(0,r.qy)`<wui-flex flexDirection="column" .padding=${["0","0","4","0"]}>
        <w3m-connecting-wc-view ?basic=${!0} .displayBranding=${!1}></w3m-connecting-wc-view>
        <wui-flex flexDirection="column" .padding=${["0","3","0","3"]}>
          <w3m-all-wallets-widget></w3m-all-wallets-widget>
        </wui-flex>
      </wui-flex>
      ${this.reownBrandingTemplate()} `}reownBrandingTemplate(){return this.remoteFeatures?.reownBranding?(0,r.qy)` <wui-flex flexDirection="column" .padding=${["1","0","1","0"]}>
      <wui-ux-by-reown></wui-ux-by-reown>
    </wui-flex>`:null}};eW([(0,o.wk)()],eS.prototype,"isMobile",void 0),eW([(0,o.wk)()],eS.prototype,"remoteFeatures",void 0),eS=eW([(0,c.EM)("w3m-connecting-wc-basic-view")],eS);var eP=i(25814);let{I:eN}=eP.ge,eB=e=>void 0===e.strings;var eL=i(48922);let eO=(e,t)=>{let i=e._$AN;if(void 0===i)return!1;for(let e of i)e._$AO?.(t,!1),eO(e,t);return!0},ej=e=>{let t,i;do{if(void 0===(t=e._$AM))break;(i=t._$AN).delete(e),e=t}while(0===i?.size)},ez=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(void 0===i)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),e_(t)}};function eq(e){void 0!==this._$AN?(ej(this),this._$AM=e,ez(this)):this._$AM=e}function eD(e,t=!1,i=0){let r=this._$AH,o=this._$AN;if(void 0!==o&&0!==o.size){if(t){if(Array.isArray(r))for(let e=i;e<r.length;e++)eO(r[e],!1),ej(r[e]);else null!=r&&(eO(r,!1),ej(r))}else eO(this,e)}}let e_=e=>{e.type==eL.OA.CHILD&&(e._$AP??=eD,e._$AQ??=eq)};class eU extends eL.WL{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),ez(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(eO(this,e),ej(this))}setValue(e){if(eB(this._$Ct))this._$Ct._$AI(e,this);else{let t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}let eF=()=>new eZ;class eZ{}let eH=new WeakMap,eJ=(0,eL.u$)(class extends eU{render(e){return eP.s6}update(e,[t]){let i=t!==this.G;return i&&void 0!==this.G&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),eP.s6}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){let t=this.ht??globalThis,i=eH.get(t);void 0===i&&(i=new WeakMap,eH.set(t,i)),void 0!==i.get(this.G)&&this.G.call(this.ht,void 0),i.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?eH.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),eK=(0,P.AH)`
  :host {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  label {
    position: relative;
    display: inline-block;
    user-select: none;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  input {
    width: 0;
    height: 0;
    opacity: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: ${({colors:e})=>e.neutrals300};
    border-radius: ${({borderRadius:e})=>e.round};
    border: 1px solid transparent;
    will-change: border;
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      border ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      box-shadow ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      width ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      height ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]},
      transform ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      opacity ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, color, border, box-shadow, width, height, transform, opacity;
  }

  span:before {
    content: '';
    position: absolute;
    background-color: ${({colors:e})=>e.white};
    border-radius: 50%;
  }

  /* -- Sizes --------------------------------------------------------- */
  label[data-size='lg'] {
    width: 48px;
    height: 32px;
  }

  label[data-size='md'] {
    width: 40px;
    height: 28px;
  }

  label[data-size='sm'] {
    width: 32px;
    height: 22px;
  }

  label[data-size='lg'] > span:before {
    height: 24px;
    width: 24px;
    left: 4px;
    top: 3px;
  }

  label[data-size='md'] > span:before {
    height: 20px;
    width: 20px;
    left: 4px;
    top: 3px;
  }

  label[data-size='sm'] > span:before {
    height: 16px;
    width: 16px;
    left: 3px;
    top: 2px;
  }

  /* -- Focus states --------------------------------------------------- */
  input:focus-visible:not(:checked) + span,
  input:focus:not(:checked) + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    background-color: ${({tokens:e})=>e.theme.textTertiary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  input:focus-visible:checked + span,
  input:focus:checked + span {
    border: 1px solid ${({tokens:e})=>e.core.iconAccentPrimary};
    box-shadow: 0px 0px 0px 4px rgba(9, 136, 240, 0.2);
  }

  /* -- Checked states --------------------------------------------------- */
  input:checked + span {
    background-color: ${({tokens:e})=>e.core.iconAccentPrimary};
  }

  label[data-size='lg'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='md'] > input:checked + span:before {
    transform: translateX(calc(100% - 9px));
  }

  label[data-size='sm'] > input:checked + span:before {
    transform: translateX(calc(100% - 7px));
  }

  /* -- Hover states ------------------------------------------------------- */
  label:hover > input:not(:checked):not(:disabled) + span {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  label:hover > input:checked:not(:disabled) + span {
    background-color: ${({colors:e})=>e.accent080};
  }

  /* -- Disabled state --------------------------------------------------- */
  label:has(input:disabled) {
    pointer-events: none;
    user-select: none;
  }

  input:not(:checked):disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:checked:disabled + span {
    background-color: ${({colors:e})=>e.neutrals700};
  }

  input:not(:checked):disabled + span::before {
    background-color: ${({colors:e})=>e.neutrals400};
  }

  input:checked:disabled + span::before {
    background-color: ${({tokens:e})=>e.theme.textTertiary};
  }
`;var eV=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eY=class extends r.WF{constructor(){super(...arguments),this.inputElementRef=eF(),this.checked=!1,this.disabled=!1,this.size="md"}render(){return(0,r.qy)`
      <label data-size=${this.size}>
        <input
          ${eJ(this.inputElementRef)}
          type="checkbox"
          ?checked=${this.checked}
          ?disabled=${this.disabled}
          @change=${this.dispatchChangeEvent.bind(this)}
        />
        <span></span>
      </label>
    `}dispatchChangeEvent(){this.dispatchEvent(new CustomEvent("switchChange",{detail:this.inputElementRef.value?.checked,bubbles:!0,composed:!0}))}};eY.styles=[W.W5,W.fD,eK],eV([(0,o.MZ)({type:Boolean})],eY.prototype,"checked",void 0),eV([(0,o.MZ)({type:Boolean})],eY.prototype,"disabled",void 0),eV([(0,o.MZ)()],eY.prototype,"size",void 0),eY=eV([(0,S.E)("wui-toggle")],eY);let eG=(0,P.AH)`
  :host {
    height: auto;
  }

  :host > wui-flex {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    column-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["2"]} ${({spacing:e})=>e["3"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e["4"]};
    box-shadow: inset 0 0 0 1px ${({tokens:e})=>e.theme.foregroundPrimary};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color;
    cursor: pointer;
  }

  wui-switch {
    pointer-events: none;
  }
`;var eQ=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let eX=class extends r.WF{constructor(){super(...arguments),this.checked=!1}render(){return(0,r.qy)`
      <wui-flex>
        <wui-icon size="xl" name="walletConnectBrown"></wui-icon>
        <wui-toggle
          ?checked=${this.checked}
          size="sm"
          @switchChange=${this.handleToggleChange.bind(this)}
        ></wui-toggle>
      </wui-flex>
    `}handleToggleChange(e){e.stopPropagation(),this.checked=e.detail,this.dispatchSwitchEvent()}dispatchSwitchEvent(){this.dispatchEvent(new CustomEvent("certifiedSwitchChange",{detail:this.checked,bubbles:!0,composed:!0}))}};eX.styles=[W.W5,W.fD,eG],eQ([(0,o.MZ)({type:Boolean})],eX.prototype,"checked",void 0),eX=eQ([(0,S.E)("wui-certified-switch")],eX);let e0=(0,P.AH)`
  :host {
    position: relative;
    width: 100%;
    display: inline-flex;
    flex-direction: column;
    gap: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.textPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  .wui-input-text-container {
    position: relative;
    display: flex;
  }

  input {
    width: 100%;
    border-radius: ${({borderRadius:e})=>e[4]};
    color: inherit;
    background: transparent;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
    caret-color: ${({tokens:e})=>e.core.textAccentPrimary};
    padding: ${({spacing:e})=>e[3]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[3]} ${({spacing:e})=>e[10]};
    font-size: ${({textSize:e})=>e.large};
    line-height: ${({typography:e})=>e["lg-regular"].lineHeight};
    letter-spacing: ${({typography:e})=>e["lg-regular"].letterSpacing};
    font-weight: ${({fontWeight:e})=>e.regular};
    font-family: ${({fontFamily:e})=>e.regular};
  }

  input[data-size='lg'] {
    padding: ${({spacing:e})=>e[4]} ${({spacing:e})=>e[3]}
      ${({spacing:e})=>e[4]} ${({spacing:e})=>e[10]};
  }

  @media (hover: hover) and (pointer: fine) {
    input:hover:enabled {
      border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    }
  }

  input:disabled {
    cursor: unset;
    border: 1px solid ${({tokens:e})=>e.theme.borderPrimary};
  }

  input::placeholder {
    color: ${({tokens:e})=>e.theme.textSecondary};
  }

  input:focus:enabled {
    border: 1px solid ${({tokens:e})=>e.theme.borderSecondary};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    -webkit-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    -moz-box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
    box-shadow: 0px 0px 0px 4px ${({tokens:e})=>e.core.foregroundAccent040};
  }

  div.wui-input-text-container:has(input:disabled) {
    opacity: 0.5;
  }

  wui-icon.wui-input-text-left-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
    left: ${({spacing:e})=>e[4]};
    color: ${({tokens:e})=>e.theme.iconDefault};
  }

  button.wui-input-text-submit-button {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    border-radius: ${({borderRadius:e})=>e[2]};
    color: ${({tokens:e})=>e.core.textAccentPrimary};
  }

  button.wui-input-text-submit-button:disabled {
    opacity: 1;
  }

  button.wui-input-text-submit-button.loading wui-icon {
    animation: spin 1s linear infinite;
  }

  button.wui-input-text-submit-button:hover {
    background: ${({tokens:e})=>e.core.foregroundAccent010};
  }

  input:has(+ .wui-input-text-submit-button) {
    padding-right: ${({spacing:e})=>e[12]};
  }

  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='search']::-webkit-search-decoration,
  input[type='search']::-webkit-search-cancel-button,
  input[type='search']::-webkit-search-results-button,
  input[type='search']::-webkit-search-results-decoration {
    -webkit-appearance: none;
  }

  /* -- Keyframes --------------------------------------------------- */
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;var e1=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e3=class extends r.WF{constructor(){super(...arguments),this.inputElementRef=eF(),this.disabled=!1,this.loading=!1,this.placeholder="",this.type="text",this.value="",this.size="md"}render(){return(0,r.qy)` <div class="wui-input-text-container">
        ${this.templateLeftIcon()}
        <input
          data-size=${this.size}
          ${eJ(this.inputElementRef)}
          data-testid="wui-input-text"
          type=${this.type}
          enterkeyhint=${(0,d.J)(this.enterKeyHint)}
          ?disabled=${this.disabled}
          placeholder=${this.placeholder}
          @input=${this.dispatchInputChangeEvent.bind(this)}
          @keydown=${this.onKeyDown}
          .value=${this.value||""}
        />
        ${this.templateSubmitButton()}
        <slot class="wui-input-text-slot"></slot>
      </div>
      ${this.templateError()} ${this.templateWarning()}`}templateLeftIcon(){return this.icon?(0,r.qy)`<wui-icon
        class="wui-input-text-left-icon"
        size="md"
        data-size=${this.size}
        color="inherit"
        name=${this.icon}
      ></wui-icon>`:null}templateSubmitButton(){return this.onSubmit?(0,r.qy)`<button
        class="wui-input-text-submit-button ${this.loading?"loading":""}"
        @click=${this.onSubmit?.bind(this)}
        ?disabled=${this.disabled||this.loading}
      >
        ${this.loading?(0,r.qy)`<wui-icon name="spinner" size="md"></wui-icon>`:(0,r.qy)`<wui-icon name="chevronRight" size="md"></wui-icon>`}
      </button>`:null}templateError(){return this.errorText?(0,r.qy)`<wui-text variant="sm-regular" color="error">${this.errorText}</wui-text>`:null}templateWarning(){return this.warningText?(0,r.qy)`<wui-text variant="sm-regular" color="warning">${this.warningText}</wui-text>`:null}dispatchInputChangeEvent(){this.dispatchEvent(new CustomEvent("inputChange",{detail:this.inputElementRef.value?.value,bubbles:!0,composed:!0}))}};e3.styles=[W.W5,W.fD,e0],e1([(0,o.MZ)()],e3.prototype,"icon",void 0),e1([(0,o.MZ)({type:Boolean})],e3.prototype,"disabled",void 0),e1([(0,o.MZ)({type:Boolean})],e3.prototype,"loading",void 0),e1([(0,o.MZ)()],e3.prototype,"placeholder",void 0),e1([(0,o.MZ)()],e3.prototype,"type",void 0),e1([(0,o.MZ)()],e3.prototype,"value",void 0),e1([(0,o.MZ)()],e3.prototype,"errorText",void 0),e1([(0,o.MZ)()],e3.prototype,"warningText",void 0),e1([(0,o.MZ)()],e3.prototype,"onSubmit",void 0),e1([(0,o.MZ)()],e3.prototype,"size",void 0),e1([(0,o.MZ)({attribute:!1})],e3.prototype,"onKeyDown",void 0),e3=e1([(0,S.E)("wui-input-text")],e3);let e2=(0,P.AH)`
  :host {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  wui-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: ${({spacing:e})=>e[3]};
    color: ${({tokens:e})=>e.theme.iconDefault};
    cursor: pointer;
    padding: ${({spacing:e})=>e[2]};
    background-color: transparent;
    border-radius: ${({borderRadius:e})=>e[4]};
    transition: background-color ${({durations:e})=>e.lg}
      ${({easings:e})=>e["ease-out-power-2"]};
  }

  @media (hover: hover) {
    wui-icon:hover {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }
`;var e5=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e4=class extends r.WF{constructor(){super(...arguments),this.inputComponentRef=eF(),this.inputValue=""}render(){return(0,r.qy)`
      <wui-input-text
        ${eJ(this.inputComponentRef)}
        placeholder="Search wallet"
        icon="search"
        type="search"
        enterKeyHint="search"
        size="sm"
        @inputChange=${this.onInputChange}
      >
        ${this.inputValue?(0,r.qy)`<wui-icon
              @click=${this.clearValue}
              color="inherit"
              size="sm"
              name="close"
            ></wui-icon>`:null}
      </wui-input-text>
    `}onInputChange(e){this.inputValue=e.detail||""}clearValue(){let e=this.inputComponentRef.value,t=e?.inputElementRef.value;t&&(t.value="",this.inputValue="",t.focus(),t.dispatchEvent(new Event("input")))}};e4.styles=[W.W5,e2],e5([(0,o.MZ)()],e4.prototype,"inputValue",void 0),e4=e5([(0,S.E)("wui-search-bar")],e4);let e6=(0,r.JW)`<svg  viewBox="0 0 48 54" fill="none">
  <path
    d="M43.4605 10.7248L28.0485 1.61089C25.5438 0.129705 22.4562 0.129705 19.9515 1.61088L4.53951 10.7248C2.03626 12.2051 0.5 14.9365 0.5 17.886V36.1139C0.5 39.0635 2.03626 41.7949 4.53951 43.2752L19.9515 52.3891C22.4562 53.8703 25.5438 53.8703 28.0485 52.3891L43.4605 43.2752C45.9637 41.7949 47.5 39.0635 47.5 36.114V17.8861C47.5 14.9365 45.9637 12.2051 43.4605 10.7248Z"
  />
</svg>`,e8=(0,P.AH)`
  :host {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 104px;
    width: 104px;
    row-gap: ${({spacing:e})=>e[2]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: ${({borderRadius:e})=>e[5]};
    position: relative;
  }

  wui-shimmer[data-type='network'] {
    border: none;
    -webkit-clip-path: var(--apkt-path-network);
    clip-path: var(--apkt-path-network);
  }

  svg {
    position: absolute;
    width: 48px;
    height: 54px;
    z-index: 1;
  }

  svg > path {
    stroke: ${({tokens:e})=>e.theme.foregroundSecondary};
    stroke-width: 1px;
  }

  @media (max-width: 350px) {
    :host {
      width: 100%;
    }
  }
`;var e7=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let e9=class extends r.WF{constructor(){super(...arguments),this.type="wallet"}render(){return(0,r.qy)`
      ${this.shimmerTemplate()}
      <wui-shimmer width="80px" height="20px"></wui-shimmer>
    `}shimmerTemplate(){return"network"===this.type?(0,r.qy)` <wui-shimmer data-type=${this.type} width="48px" height="54px"></wui-shimmer>
        ${e6}`:(0,r.qy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}};e9.styles=[W.W5,W.fD,e8],e7([(0,o.MZ)()],e9.prototype,"type",void 0),e9=e7([(0,S.E)("wui-card-select-loader")],e9);var te=i(19723);let tt=(0,r.AH)`
  :host {
    display: grid;
    width: inherit;
    height: inherit;
  }
`;var ti=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let tr=class extends r.WF{render(){return this.style.cssText=`
      grid-template-rows: ${this.gridTemplateRows};
      grid-template-columns: ${this.gridTemplateColumns};
      justify-items: ${this.justifyItems};
      align-items: ${this.alignItems};
      justify-content: ${this.justifyContent};
      align-content: ${this.alignContent};
      column-gap: ${this.columnGap&&`var(--apkt-spacing-${this.columnGap})`};
      row-gap: ${this.rowGap&&`var(--apkt-spacing-${this.rowGap})`};
      gap: ${this.gap&&`var(--apkt-spacing-${this.gap})`};
      padding-top: ${this.padding&&te.Z.getSpacingStyles(this.padding,0)};
      padding-right: ${this.padding&&te.Z.getSpacingStyles(this.padding,1)};
      padding-bottom: ${this.padding&&te.Z.getSpacingStyles(this.padding,2)};
      padding-left: ${this.padding&&te.Z.getSpacingStyles(this.padding,3)};
      margin-top: ${this.margin&&te.Z.getSpacingStyles(this.margin,0)};
      margin-right: ${this.margin&&te.Z.getSpacingStyles(this.margin,1)};
      margin-bottom: ${this.margin&&te.Z.getSpacingStyles(this.margin,2)};
      margin-left: ${this.margin&&te.Z.getSpacingStyles(this.margin,3)};
    `,(0,r.qy)`<slot></slot>`}};tr.styles=[W.W5,tt],ti([(0,o.MZ)()],tr.prototype,"gridTemplateRows",void 0),ti([(0,o.MZ)()],tr.prototype,"gridTemplateColumns",void 0),ti([(0,o.MZ)()],tr.prototype,"justifyItems",void 0),ti([(0,o.MZ)()],tr.prototype,"alignItems",void 0),ti([(0,o.MZ)()],tr.prototype,"justifyContent",void 0),ti([(0,o.MZ)()],tr.prototype,"alignContent",void 0),ti([(0,o.MZ)()],tr.prototype,"columnGap",void 0),ti([(0,o.MZ)()],tr.prototype,"rowGap",void 0),ti([(0,o.MZ)()],tr.prototype,"gap",void 0),ti([(0,o.MZ)()],tr.prototype,"padding",void 0),ti([(0,o.MZ)()],tr.prototype,"margin",void 0),tr=ti([(0,S.E)("wui-grid")],tr);var to=i(24543);let tn=(0,c.AH)`
  button {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    width: 104px;
    row-gap: ${({spacing:e})=>e["2"]};
    padding: ${({spacing:e})=>e["3"]} ${({spacing:e})=>e["0"]};
    background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    border-radius: clamp(0px, ${({borderRadius:e})=>e["4"]}, 20px);
    transition:
      color ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-1"]},
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]},
      border-radius ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-1"]};
    will-change: background-color, color, border-radius;
    outline: none;
    border: none;
  }

  button > wui-flex > wui-text {
    color: ${({tokens:e})=>e.theme.textPrimary};
    max-width: 86px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    justify-content: center;
  }

  button > wui-flex > wui-text.certified {
    max-width: 66px;
  }

  @media (hover: hover) and (pointer: fine) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundSecondary};
    }
  }

  button:disabled > wui-flex > wui-text {
    color: ${({tokens:e})=>e.core.glass010};
  }

  [data-selected='true'] {
    background-color: ${({colors:e})=>e.accent020};
  }

  @media (hover: hover) and (pointer: fine) {
    [data-selected='true']:hover:enabled {
      background-color: ${({colors:e})=>e.accent010};
    }
  }

  [data-selected='true']:active:enabled {
    background-color: ${({colors:e})=>e.accent010};
  }

  @media (max-width: 350px) {
    button {
      width: 100%;
    }
  }
`;var ta=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ts=class extends r.WF{constructor(){super(),this.observer=new IntersectionObserver(()=>void 0),this.visible=!1,this.imageSrc=void 0,this.imageLoading=!1,this.isImpressed=!1,this.explorerId="",this.walletQuery="",this.certified=!1,this.displayIndex=0,this.wallet=void 0,this.observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting?(this.visible=!0,this.fetchImageSrc(),this.sendImpressionEvent()):this.visible=!1})},{threshold:.01})}firstUpdated(){this.observer.observe(this)}disconnectedCallback(){this.observer.disconnect()}render(){let e=this.wallet?.badge_type==="certified";return(0,r.qy)`
      <button>
        ${this.imageTemplate()}
        <wui-flex flexDirection="row" alignItems="center" justifyContent="center" gap="1">
          <wui-text
            variant="md-regular"
            color="inherit"
            class=${(0,d.J)(e?"certified":void 0)}
            >${this.wallet?.name}</wui-text
          >
          ${e?(0,r.qy)`<wui-icon size="sm" name="walletConnectBrown"></wui-icon>`:null}
        </wui-flex>
      </button>
    `}imageTemplate(){return(this.visible||this.imageSrc)&&!this.imageLoading?(0,r.qy)`
      <wui-wallet-image
        size="lg"
        imageSrc=${(0,d.J)(this.imageSrc)}
        name=${(0,d.J)(this.wallet?.name)}
        .installed=${this.wallet?.installed??!1}
        badgeSize="sm"
      >
      </wui-wallet-image>
    `:this.shimmerTemplate()}shimmerTemplate(){return(0,r.qy)`<wui-shimmer width="56px" height="56px"></wui-shimmer>`}async fetchImageSrc(){this.wallet&&(this.imageSrc=y.$.getWalletImage(this.wallet),this.imageSrc||(this.imageLoading=!0,this.imageSrc=await y.$.fetchWalletImage(this.wallet.image_id),this.imageLoading=!1))}sendImpressionEvent(){this.wallet&&!this.isImpressed&&(this.isImpressed=!0,g.E.sendWalletImpressionEvent({name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.explorerId,view:f.I.state.view,query:this.walletQuery,certified:this.certified,displayIndex:this.displayIndex}))}};ts.styles=tn,ta([(0,o.wk)()],ts.prototype,"visible",void 0),ta([(0,o.wk)()],ts.prototype,"imageSrc",void 0),ta([(0,o.wk)()],ts.prototype,"imageLoading",void 0),ta([(0,o.wk)()],ts.prototype,"isImpressed",void 0),ta([(0,o.MZ)()],ts.prototype,"explorerId",void 0),ta([(0,o.MZ)()],ts.prototype,"walletQuery",void 0),ta([(0,o.MZ)()],ts.prototype,"certified",void 0),ta([(0,o.MZ)()],ts.prototype,"displayIndex",void 0),ta([(0,o.MZ)({type:Object})],ts.prototype,"wallet",void 0),ts=ta([(0,c.EM)("w3m-all-wallets-list-item")],ts);let tl=(0,c.AH)`
  wui-grid {
    max-height: clamp(360px, 400px, 80vh);
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  w3m-all-wallets-list-item {
    opacity: 0;
    animation-duration: ${({durations:e})=>e.xl};
    animation-timing-function: ${({easings:e})=>e["ease-inout-power-2"]};
    animation-name: fade-in;
    animation-fill-mode: forwards;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  wui-loading-spinner {
    padding-top: ${({spacing:e})=>e["4"]};
    padding-bottom: ${({spacing:e})=>e["4"]};
    justify-content: center;
    grid-column: 1 / span 4;
  }
`;var tc=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let td="local-paginator",tu=class extends r.WF{constructor(){super(),this.unsubscribe=[],this.paginationObserver=void 0,this.loading=!s.N.state.wallets.length,this.wallets=s.N.state.wallets,this.recommended=s.N.state.recommended,this.featured=s.N.state.featured,this.filteredWallets=s.N.state.filteredWallets,this.mobileFullScreen=a.H.state.enableMobileFullScreen,this.unsubscribe.push(s.N.subscribeKey("wallets",e=>this.wallets=e),s.N.subscribeKey("recommended",e=>this.recommended=e),s.N.subscribeKey("featured",e=>this.featured=e),s.N.subscribeKey("filteredWallets",e=>this.filteredWallets=e))}firstUpdated(){this.initialFetch(),this.createPaginationObserver()}disconnectedCallback(){this.unsubscribe.forEach(e=>e()),this.paginationObserver?.disconnect()}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),(0,r.qy)`
      <wui-grid
        data-scroll=${!this.loading}
        .padding=${["0","3","3","3"]}
        gap="2"
        justifyContent="space-between"
      >
        ${this.loading?this.shimmerTemplate(16):this.walletsTemplate()}
        ${this.paginationLoaderTemplate()}
      </wui-grid>
    `}async initialFetch(){this.loading=!0;let e=this.shadowRoot?.querySelector("wui-grid");e&&(await s.N.fetchWalletsByPage({page:1}),await e.animate([{opacity:1},{opacity:0}],{duration:200,fill:"forwards",easing:"ease"}).finished,this.loading=!1,e.animate([{opacity:0},{opacity:1}],{duration:200,fill:"forwards",easing:"ease"}))}shimmerTemplate(e,t){return[...Array(e)].map(()=>(0,r.qy)`
        <wui-card-select-loader type="wallet" id=${(0,d.J)(t)}></wui-card-select-loader>
      `)}getWallets(){let e=[...this.featured,...this.recommended];this.filteredWallets?.length>0?e.push(...this.filteredWallets):e.push(...this.wallets);let t=n.w.uniqueBy(e,"id"),i=to.A.markWalletsAsInstalled(t);return to.A.markWalletsWithDisplayIndex(i)}walletsTemplate(){return this.getWallets().map((e,t)=>(0,r.qy)`
        <w3m-all-wallets-list-item
          data-testid="wallet-search-item-${e.id}"
          @click=${()=>this.onConnectWallet(e)}
          .wallet=${e}
          explorerId=${e.id}
          certified=${"certified"===this.badge}
          displayIndex=${t}
        ></w3m-all-wallets-list-item>
      `)}paginationLoaderTemplate(){let{wallets:e,recommended:t,featured:i,count:r,mobileFilteredOutWalletsLength:o}=s.N.state,n=window.innerWidth<352?3:4,a=e.length+t.length,l=Math.ceil(a/n)*n-a+n;return(l-=e.length?i.length%n:0,0===r&&i.length>0)?null:0===r||[...i,...e,...t].length<r-(o??0)?this.shimmerTemplate(l,td):null}createPaginationObserver(){let e=this.shadowRoot?.querySelector(`#${td}`);e&&(this.paginationObserver=new IntersectionObserver(([e])=>{if(e?.isIntersecting&&!this.loading){let{page:e,count:t,wallets:i}=s.N.state;i.length<t&&s.N.fetchWalletsByPage({page:e+1})}}),this.paginationObserver.observe(e))}onConnectWallet(e){h.a.selectWalletConnector(e)}};tu.styles=tl,tc([(0,o.wk)()],tu.prototype,"loading",void 0),tc([(0,o.wk)()],tu.prototype,"wallets",void 0),tc([(0,o.wk)()],tu.prototype,"recommended",void 0),tc([(0,o.wk)()],tu.prototype,"featured",void 0),tc([(0,o.wk)()],tu.prototype,"filteredWallets",void 0),tc([(0,o.wk)()],tu.prototype,"badge",void 0),tc([(0,o.wk)()],tu.prototype,"mobileFullScreen",void 0),tu=tc([(0,c.EM)("w3m-all-wallets-list")],tu);let th=(0,r.AH)`
  wui-grid,
  wui-loading-spinner,
  wui-flex {
    height: 360px;
  }

  wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  :host([data-mobile-fullscreen='true']) wui-grid {
    max-height: none;
    height: auto;
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;var tp=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let tg=class extends r.WF{constructor(){super(...arguments),this.prevQuery="",this.prevBadge=void 0,this.loading=!0,this.mobileFullScreen=a.H.state.enableMobileFullScreen,this.query=""}render(){return this.mobileFullScreen&&this.setAttribute("data-mobile-fullscreen","true"),this.onSearch(),this.loading?(0,r.qy)`<wui-loading-spinner color="accent-primary"></wui-loading-spinner>`:this.walletsTemplate()}async onSearch(){(this.query.trim()!==this.prevQuery.trim()||this.badge!==this.prevBadge)&&(this.prevQuery=this.query,this.prevBadge=this.badge,this.loading=!0,await s.N.searchWallet({search:this.query,badge:this.badge}),this.loading=!1)}walletsTemplate(){let{search:e}=s.N.state,t=to.A.markWalletsAsInstalled(e);return e.length?(0,r.qy)`
      <wui-grid
        data-testid="wallet-list"
        .padding=${["0","3","3","3"]}
        rowGap="4"
        columngap="2"
        justifyContent="space-between"
      >
        ${t.map((e,t)=>(0,r.qy)`
            <w3m-all-wallets-list-item
              @click=${()=>this.onConnectWallet(e)}
              .wallet=${e}
              data-testid="wallet-search-item-${e.id}"
              explorerId=${e.id}
              certified=${"certified"===this.badge}
              walletQuery=${this.query}
              displayIndex=${t}
            ></w3m-all-wallets-list-item>
          `)}
      </wui-grid>
    `:(0,r.qy)`
        <wui-flex
          data-testid="no-wallet-found"
          justifyContent="center"
          alignItems="center"
          gap="3"
          flexDirection="column"
        >
          <wui-icon-box size="lg" color="default" icon="wallet"></wui-icon-box>
          <wui-text data-testid="no-wallet-found-text" color="secondary" variant="md-medium">
            No Wallet found
          </wui-text>
        </wui-flex>
      `}onConnectWallet(e){h.a.selectWalletConnector(e)}};tg.styles=th,tp([(0,o.wk)()],tg.prototype,"loading",void 0),tp([(0,o.wk)()],tg.prototype,"mobileFullScreen",void 0),tp([(0,o.MZ)()],tg.prototype,"query",void 0),tp([(0,o.MZ)()],tg.prototype,"badge",void 0),tg=tp([(0,c.EM)("w3m-all-wallets-search")],tg);var tf=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let tw=class extends r.WF{constructor(){super(...arguments),this.search="",this.badge=void 0,this.onDebouncedSearch=n.w.debounce(e=>{this.search=e})}render(){let e=this.search.length>=2;return(0,r.qy)`
      <wui-flex .padding=${["1","3","3","3"]} gap="2" alignItems="center">
        <wui-search-bar @inputChange=${this.onInputChange.bind(this)}></wui-search-bar>
        <wui-certified-switch
          ?checked=${"certified"===this.badge}
          @certifiedSwitchChange=${this.onCertifiedSwitchChange.bind(this)}
          data-testid="wui-certified-switch"
        ></wui-certified-switch>
        ${this.qrButtonTemplate()}
      </wui-flex>
      ${e||this.badge?(0,r.qy)`<w3m-all-wallets-search
            query=${this.search}
            .badge=${this.badge}
          ></w3m-all-wallets-search>`:(0,r.qy)`<w3m-all-wallets-list .badge=${this.badge}></w3m-all-wallets-list>`}
    `}onInputChange(e){this.onDebouncedSearch(e.detail)}onCertifiedSwitchChange(e){e.detail?(this.badge="certified",I.P.showSvg("Only WalletConnect certified",{icon:"walletConnectBrown",iconColor:"accent-100"})):this.badge=void 0}qrButtonTemplate(){return n.w.isMobile()?(0,r.qy)`
        <wui-icon-box
          size="xl"
          iconSize="xl"
          color="accent-primary"
          icon="qrCode"
          border
          borderColor="wui-accent-glass-010"
          @click=${this.onWalletConnectQr.bind(this)}
        ></wui-icon-box>
      `:null}onWalletConnectQr(){f.I.push("ConnectingWalletConnect")}};tf([(0,o.wk)()],tw.prototype,"search",void 0),tf([(0,o.wk)()],tw.prototype,"badge",void 0),tw=tf([(0,c.EM)("w3m-all-wallets-view")],tw);let tm=(0,P.AH)`
  :host {
    width: 100%;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({spacing:e})=>e[3]};
    width: 100%;
    background-color: ${({tokens:e})=>e.theme.backgroundPrimary};
    border-radius: ${({borderRadius:e})=>e[4]};
    transition:
      background-color ${({durations:e})=>e.lg}
        ${({easings:e})=>e["ease-out-power-2"]},
      scale ${({durations:e})=>e.lg} ${({easings:e})=>e["ease-out-power-2"]};
    will-change: background-color, scale;
  }

  wui-text {
    text-transform: capitalize;
  }

  wui-image {
    color: ${({tokens:e})=>e.theme.textPrimary};
  }

  @media (hover: hover) {
    button:hover:enabled {
      background-color: ${({tokens:e})=>e.theme.foregroundPrimary};
    }
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;var tb=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a};let ty=class extends r.WF{constructor(){super(...arguments),this.imageSrc="google",this.loading=!1,this.disabled=!1,this.rightIcon=!0,this.rounded=!1,this.fullSize=!1}render(){return this.dataset.rounded=this.rounded?"true":"false",(0,r.qy)`
      <button
        ?disabled=${!!this.loading||!!this.disabled}
        data-loading=${this.loading}
        tabindex=${(0,d.J)(this.tabIdx)}
      >
        <wui-flex gap="2" alignItems="center">
          ${this.templateLeftIcon()}
          <wui-flex gap="1">
            <slot></slot>
          </wui-flex>
        </wui-flex>
        ${this.templateRightIcon()}
      </button>
    `}templateLeftIcon(){return this.icon?(0,r.qy)`<wui-image
        icon=${this.icon}
        iconColor=${(0,d.J)(this.iconColor)}
        ?boxed=${!0}
        ?rounded=${this.rounded}
      ></wui-image>`:(0,r.qy)`<wui-image
      ?boxed=${!0}
      ?rounded=${this.rounded}
      ?fullSize=${this.fullSize}
      src=${this.imageSrc}
    ></wui-image>`}templateRightIcon(){return this.rightIcon?this.loading?(0,r.qy)`<wui-loading-spinner size="md" color="accent-primary"></wui-loading-spinner>`:(0,r.qy)`<wui-icon name="chevronRight" size="lg" color="default"></wui-icon>`:null}};ty.styles=[W.W5,W.fD,tm],tb([(0,o.MZ)()],ty.prototype,"imageSrc",void 0),tb([(0,o.MZ)()],ty.prototype,"icon",void 0),tb([(0,o.MZ)()],ty.prototype,"iconColor",void 0),tb([(0,o.MZ)({type:Boolean})],ty.prototype,"loading",void 0),tb([(0,o.MZ)()],ty.prototype,"tabIdx",void 0),tb([(0,o.MZ)({type:Boolean})],ty.prototype,"disabled",void 0),tb([(0,o.MZ)({type:Boolean})],ty.prototype,"rightIcon",void 0),tb([(0,o.MZ)({type:Boolean})],ty.prototype,"rounded",void 0),tb([(0,o.MZ)({type:Boolean})],ty.prototype,"fullSize",void 0),ty=tb([(0,S.E)("wui-list-item")],ty);let tv=class extends r.WF{constructor(){super(...arguments),this.wallet=f.I.state.data?.wallet}render(){if(!this.wallet)throw Error("w3m-downloads-view");return(0,r.qy)`
      <wui-flex gap="2" flexDirection="column" .padding=${["3","3","4","3"]}>
        ${this.chromeTemplate()} ${this.iosTemplate()} ${this.androidTemplate()}
        ${this.homepageTemplate()}
      </wui-flex>
    `}chromeTemplate(){return this.wallet?.chrome_store?(0,r.qy)`<wui-list-item
      variant="icon"
      icon="chromeStore"
      iconVariant="square"
      @click=${this.onChromeStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Chrome Extension</wui-text>
    </wui-list-item>`:null}iosTemplate(){return this.wallet?.app_store?(0,r.qy)`<wui-list-item
      variant="icon"
      icon="appStore"
      iconVariant="square"
      @click=${this.onAppStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">iOS App</wui-text>
    </wui-list-item>`:null}androidTemplate(){return this.wallet?.play_store?(0,r.qy)`<wui-list-item
      variant="icon"
      icon="playStore"
      iconVariant="square"
      @click=${this.onPlayStore.bind(this)}
      chevron
    >
      <wui-text variant="md-medium" color="primary">Android App</wui-text>
    </wui-list-item>`:null}homepageTemplate(){return this.wallet?.homepage?(0,r.qy)`
      <wui-list-item
        variant="icon"
        icon="browser"
        iconVariant="square-blue"
        @click=${this.onHomePage.bind(this)}
        chevron
      >
        <wui-text variant="md-medium" color="primary">Website</wui-text>
      </wui-list-item>
    `:null}openStore(e){e.href&&this.wallet&&(g.E.sendEvent({type:"track",event:"GET_WALLET",properties:{name:this.wallet.name,walletRank:this.wallet.order,explorerId:this.wallet.id,type:e.type}}),n.w.openHref(e.href,"_blank"))}onChromeStore(){this.wallet?.chrome_store&&this.openStore({href:this.wallet.chrome_store,type:"chrome_store"})}onAppStore(){this.wallet?.app_store&&this.openStore({href:this.wallet.app_store,type:"app_store"})}onPlayStore(){this.wallet?.play_store&&this.openStore({href:this.wallet.play_store,type:"play_store"})}onHomePage(){this.wallet?.homepage&&this.openStore({href:this.wallet.homepage,type:"homepage"})}};tv=function(e,t,i,r){var o,n=arguments.length,a=n<3?t:null===r?r=Object.getOwnPropertyDescriptor(t,i):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(n<3?o(a):n>3?o(t,i,a):o(t,i))||a);return n>3&&a&&Object.defineProperty(t,i,a),a}([(0,c.EM)("w3m-downloads-view")],tv)}};