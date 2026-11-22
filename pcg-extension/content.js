/* ===== 地下预测内核：晶洞序列 + 探险结果预览（只读计算，来自参考版） ===== */
/* v1.20.1: atomic isolated helper initialization */
if(!window.PCG_EGG_RULES){
/* Rules extracted from app.c0081498f2.js, build b05c8cc201. Pure calculations. */
(function(root){
  'use strict';
  var R={source:'app.c0081498f2.js',BASE:1/512,PARENT:1/16,OLD_PARENT:.1,
    BERRY:'belue-berry',BERRY_MULT:2,HATCH_MS:360*60000,
    NO_EGG:[137,442,479,47901,47902,47903,47904,47905,556],LAYS:{490:489,489:489}};
  R.eggRate=function(e){e=e||{};var p=e.sp?(+e.sp===2?R.PARENT:R.OLD_PARENT):0;
    return (p?Math.max(p,R.BASE):R.BASE)*(e.bx?R.BERRY_MULT:1);};
  R.nextK=function(s){var p=s && s.pension || {};return Number.isFinite(p.laid)?p.laid:
    (+s?.stats?.hatched||0)+(Array.isArray(p.eggs)?p.eggs.length:0);};
  R.plainRate=function(s,k,nextK){return R.BASE*(k===nextK && s?.pension?.bx?R.BERRY_MULT:1);};
  R.label=function(rate){return rate===R.BASE?'1/512':rate===R.BASE*2?'1/256':String(Math.round(rate*100000)/1000)+'%';};
  R.supported=function(cfg){return !!cfg && cfg.SHINY_RATE===R.BASE && cfg.SHINY_PARENT_RATE===R.PARENT &&
    cfg.SHINY_PARENT_RATE_OLD===R.OLD_PARENT && cfg.SHINY_BERRY===R.BERRY && cfg.SHINY_BERRY_MULT===R.BERRY_MULT;};
  root.PCG_EGG_RULES=R;
  if(typeof module!=='undefined' && module.exports)module.exports=R;
})(typeof window!=='undefined'?window:globalThis);

}
if(!window.PCG_UNDER_DATA){
/* Current official game data, extracted from app.c0081498f2.js. */
(function(root){
  'use strict';
  root.PCG_UNDER_DATA = {"source":"app.c0081498f2.js","build":"b05c8cc201","verifiedBundles":["app.c0081498f2.js","app.17255d8d2e.js","app.ac708615ae.js"],"checked":"2026-11-16","regions":[{"key":"kanto","dex":[1,151],"ids":[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151],"open":true,"first":0,"doneAfter":13,"championBadge":"Maître"},{"key":"johto","dex":[152,251],"ids":[152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251],"open":false,"first":14,"doneAfter":29,"championBadge":"Maître Johto"},{"key":"hoenn","dex":[252,386],"ids":[252,253,254,255,256,257,258,259,260,261,262,263,264,265,266,267,268,269,270,271,272,273,274,275,276,277,278,279,280,281,282,283,284,285,286,287,288,289,290,291,292,293,294,295,296,297,298,299,300,301,302,303,304,305,306,307,308,309,310,311,312,313,314,315,316,317,318,319,320,321,322,323,324,325,326,327,328,329,330,331,332,333,334,335,336,337,338,339,340,341,342,343,344,345,346,347,348,349,350,351,352,353,354,355,356,357,358,359,360,361,362,363,364,365,366,367,368,369,370,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386],"open":false,"first":31,"doneAfter":47,"championBadge":"Maître Hoenn"},{"key":"sinnoh","dex":[387,493],"ids":[387,388,389,390,391,392,393,394,395,396,397,398,399,400,401,402,403,404,405,406,407,408,409,410,411,412,413,414,415,416,417,418,419,420,421,422,423,424,425,426,427,428,429,430,431,432,433,434,435,436,437,438,439,440,441,442,443,444,445,446,447,448,449,450,451,452,453,454,455,456,457,458,459,460,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,480,481,482,483,484,485,486,487,488,489,490,491,492,493],"open":false,"first":48,"doneAfter":64,"championBadge":"Maître Sinnoh"},{"key":"unova","dex":[494,649],"ids":[494,495,496,497,498,499,500,501,502,503,504,505,506,507,508,509,510,511,512,513,514,515,516,517,518,519,520,521,522,523,524,525,526,527,528,529,530,531,532,533,534,535,536,537,538,539,540,541,542,543,544,545,546,547,548,549,550,551,552,553,554,555,556,557,558,559,560,561,562,563,564,565,566,567,568,569,570,571,572,573,574,575,576,577,578,579,580,581,582,583,584,585,586,587,588,589,590,591,592,593,594,595,596,597,598,599,600,601,602,603,604,605,606,607,608,609,610,611,612,613,614,615,616,617,618,619,620,621,622,623,624,625,626,627,628,629,630,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649],"open":false,"first":66,"doneAfter":82,"championBadge":"Maître Unys"}],"species":[{"id":1,"types":["grass","poison"],"tier":2,"canLay":true,"baseForm":1,"eggForm":null},{"id":2,"types":["grass","poison"],"tier":2,"canLay":true,"from":1,"baseForm":2,"eggForm":null},{"id":3,"types":["grass","poison"],"tier":2,"canLay":true,"from":2,"baseForm":3,"eggForm":null},{"id":4,"types":["fire"],"tier":2,"canLay":true,"baseForm":4,"eggForm":null},{"id":5,"types":["fire"],"tier":2,"canLay":true,"from":4,"baseForm":5,"eggForm":null},{"id":6,"types":["fire","flying"],"tier":2,"canLay":true,"from":5,"baseForm":6,"eggForm":null},{"id":7,"types":["water"],"tier":2,"canLay":true,"baseForm":7,"eggForm":null},{"id":8,"types":["water"],"tier":2,"canLay":true,"from":7,"baseForm":8,"eggForm":null},{"id":9,"types":["water"],"tier":2,"canLay":true,"from":8,"baseForm":9,"eggForm":null},{"id":10,"types":["bug"],"tier":0,"canLay":true,"baseForm":10,"eggForm":null},{"id":11,"types":["bug"],"tier":1,"canLay":true,"from":10,"baseForm":11,"eggForm":null},{"id":12,"types":["bug","flying"],"tier":2,"canLay":true,"from":11,"baseForm":12,"eggForm":null},{"id":13,"types":["bug","poison"],"tier":0,"canLay":true,"baseForm":13,"eggForm":null},{"id":14,"types":["bug","poison"],"tier":1,"canLay":true,"from":13,"baseForm":14,"eggForm":null},{"id":15,"types":["bug","poison"],"tier":2,"canLay":true,"from":14,"baseForm":15,"eggForm":null},{"id":16,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":16,"eggForm":null},{"id":17,"types":["normal","flying"],"tier":1,"canLay":true,"from":16,"baseForm":17,"eggForm":null},{"id":18,"types":["normal","flying"],"tier":2,"canLay":true,"from":17,"baseForm":18,"eggForm":null},{"id":19,"types":["normal"],"tier":0,"canLay":true,"baseForm":19,"eggForm":null},{"id":20,"types":["normal"],"tier":1,"canLay":true,"from":19,"baseForm":20,"eggForm":null},{"id":21,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":21,"eggForm":null},{"id":22,"types":["normal","flying"],"tier":1,"canLay":true,"from":21,"baseForm":22,"eggForm":null},{"id":23,"types":["poison"],"tier":0,"canLay":true,"baseForm":23,"eggForm":null},{"id":24,"types":["poison"],"tier":1,"canLay":true,"from":23,"baseForm":24,"eggForm":null},{"id":25,"types":["electric"],"tier":0,"canLay":true,"from":172,"baseForm":25,"eggForm":null},{"id":26,"types":["electric"],"tier":1,"canLay":true,"from":25,"baseForm":26,"eggForm":null},{"id":27,"types":["ground"],"tier":0,"canLay":true,"baseForm":27,"eggForm":null},{"id":28,"types":["ground"],"tier":1,"canLay":true,"from":27,"baseForm":28,"eggForm":null},{"id":29,"types":["poison"],"tier":0,"canLay":true,"baseForm":29,"eggForm":null},{"id":30,"types":["poison"],"tier":1,"canLay":true,"from":29,"baseForm":30,"eggForm":null},{"id":31,"types":["poison","ground"],"tier":2,"canLay":true,"from":30,"baseForm":31,"eggForm":null},{"id":32,"types":["poison"],"tier":0,"canLay":true,"baseForm":32,"eggForm":null},{"id":33,"types":["poison"],"tier":1,"canLay":true,"from":32,"baseForm":33,"eggForm":null},{"id":34,"types":["poison","ground"],"tier":2,"canLay":true,"from":33,"baseForm":34,"eggForm":null},{"id":35,"types":["fairy"],"tier":0,"canLay":true,"from":173,"baseForm":35,"eggForm":null},{"id":36,"types":["fairy"],"tier":2,"canLay":true,"from":35,"baseForm":36,"eggForm":null},{"id":37,"types":["fire"],"tier":0,"canLay":true,"baseForm":37,"eggForm":null},{"id":38,"types":["fire"],"tier":2,"canLay":true,"from":37,"baseForm":38,"eggForm":null},{"id":39,"types":["normal","fairy"],"tier":0,"canLay":true,"from":174,"baseForm":39,"eggForm":null},{"id":40,"types":["normal","fairy"],"tier":1,"canLay":true,"from":39,"baseForm":40,"eggForm":null},{"id":41,"types":["poison","flying"],"tier":0,"canLay":true,"baseForm":41,"eggForm":null},{"id":42,"types":["poison","flying"],"tier":1,"canLay":true,"from":41,"baseForm":42,"eggForm":null},{"id":43,"types":["grass","poison"],"tier":0,"canLay":true,"baseForm":43,"eggForm":null},{"id":44,"types":["grass","poison"],"tier":1,"canLay":true,"from":43,"baseForm":44,"eggForm":null},{"id":45,"types":["grass","poison"],"tier":2,"canLay":true,"from":44,"baseForm":45,"eggForm":null},{"id":46,"types":["bug","grass"],"tier":0,"canLay":true,"baseForm":46,"eggForm":null},{"id":47,"types":["bug","grass"],"tier":1,"canLay":true,"from":46,"baseForm":47,"eggForm":null},{"id":48,"types":["bug","poison"],"tier":0,"canLay":true,"baseForm":48,"eggForm":null},{"id":49,"types":["bug","poison"],"tier":1,"canLay":true,"from":48,"baseForm":49,"eggForm":null},{"id":50,"types":["ground"],"tier":0,"canLay":true,"baseForm":50,"eggForm":null},{"id":51,"types":["ground"],"tier":1,"canLay":true,"from":50,"baseForm":51,"eggForm":null},{"id":52,"types":["normal"],"tier":0,"canLay":true,"baseForm":52,"eggForm":null},{"id":53,"types":["normal"],"tier":1,"canLay":true,"from":52,"baseForm":53,"eggForm":null},{"id":54,"types":["water"],"tier":0,"canLay":true,"baseForm":54,"eggForm":null},{"id":55,"types":["water"],"tier":2,"canLay":true,"from":54,"baseForm":55,"eggForm":null},{"id":56,"types":["fighting"],"tier":0,"canLay":true,"baseForm":56,"eggForm":null},{"id":57,"types":["fighting"],"tier":1,"canLay":true,"from":56,"baseForm":57,"eggForm":null},{"id":58,"types":["fire"],"tier":0,"canLay":true,"baseForm":58,"eggForm":null},{"id":59,"types":["fire"],"tier":2,"canLay":true,"from":58,"baseForm":59,"eggForm":null},{"id":60,"types":["water"],"tier":0,"canLay":true,"baseForm":60,"eggForm":null},{"id":61,"types":["water"],"tier":1,"canLay":true,"from":60,"baseForm":61,"eggForm":null},{"id":62,"types":["water","fighting"],"tier":2,"canLay":true,"from":61,"baseForm":62,"eggForm":null},{"id":63,"types":["psychic"],"tier":0,"canLay":true,"baseForm":63,"eggForm":null},{"id":64,"types":["psychic"],"tier":1,"canLay":true,"from":63,"baseForm":64,"eggForm":null},{"id":65,"types":["psychic"],"tier":2,"canLay":true,"from":64,"baseForm":65,"eggForm":null},{"id":66,"types":["fighting"],"tier":0,"canLay":true,"baseForm":66,"eggForm":null},{"id":67,"types":["fighting"],"tier":1,"canLay":true,"from":66,"baseForm":67,"eggForm":null},{"id":68,"types":["fighting"],"tier":2,"canLay":true,"from":67,"baseForm":68,"eggForm":null},{"id":69,"types":["grass","poison"],"tier":0,"canLay":true,"baseForm":69,"eggForm":null},{"id":70,"types":["grass","poison"],"tier":1,"canLay":true,"from":69,"baseForm":70,"eggForm":null},{"id":71,"types":["grass","poison"],"tier":2,"canLay":true,"from":70,"baseForm":71,"eggForm":null},{"id":72,"types":["water","poison"],"tier":0,"canLay":true,"baseForm":72,"eggForm":null},{"id":73,"types":["water","poison"],"tier":2,"canLay":true,"from":72,"baseForm":73,"eggForm":null},{"id":74,"types":["rock","ground"],"tier":0,"canLay":true,"baseForm":74,"eggForm":null},{"id":75,"types":["rock","ground"],"tier":1,"canLay":true,"from":74,"baseForm":75,"eggForm":null},{"id":76,"types":["rock","ground"],"tier":2,"canLay":true,"from":75,"baseForm":76,"eggForm":null},{"id":77,"types":["fire"],"tier":0,"canLay":true,"baseForm":77,"eggForm":null},{"id":78,"types":["fire"],"tier":2,"canLay":true,"from":77,"baseForm":78,"eggForm":null},{"id":79,"types":["water","psychic"],"tier":0,"canLay":true,"baseForm":79,"eggForm":null},{"id":80,"types":["water","psychic"],"tier":1,"canLay":true,"from":79,"baseForm":80,"eggForm":null},{"id":81,"types":["electric","steel"],"tier":0,"canLay":true,"baseForm":81,"eggForm":null},{"id":82,"types":["electric","steel"],"tier":1,"canLay":true,"from":81,"baseForm":82,"eggForm":null},{"id":83,"types":["normal","flying"],"tier":2,"canLay":true,"baseForm":83,"eggForm":null},{"id":84,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":84,"eggForm":null},{"id":85,"types":["normal","flying"],"tier":2,"canLay":true,"from":84,"baseForm":85,"eggForm":null},{"id":86,"types":["water"],"tier":0,"canLay":true,"baseForm":86,"eggForm":null},{"id":87,"types":["water","ice"],"tier":1,"canLay":true,"from":86,"baseForm":87,"eggForm":null},{"id":88,"types":["poison"],"tier":0,"canLay":true,"baseForm":88,"eggForm":null},{"id":89,"types":["poison"],"tier":2,"canLay":true,"from":88,"baseForm":89,"eggForm":null},{"id":90,"types":["water"],"tier":0,"canLay":true,"baseForm":90,"eggForm":null},{"id":91,"types":["water","ice"],"tier":2,"canLay":true,"from":90,"baseForm":91,"eggForm":null},{"id":92,"types":["ghost","poison"],"tier":0,"canLay":true,"baseForm":92,"eggForm":null},{"id":93,"types":["ghost","poison"],"tier":1,"canLay":true,"from":92,"baseForm":93,"eggForm":null},{"id":94,"types":["ghost","poison"],"tier":2,"canLay":true,"from":93,"baseForm":94,"eggForm":null},{"id":95,"types":["rock","ground"],"tier":2,"canLay":true,"baseForm":95,"eggForm":null},{"id":96,"types":["psychic"],"tier":0,"canLay":true,"baseForm":96,"eggForm":null},{"id":97,"types":["psychic"],"tier":1,"canLay":true,"from":96,"baseForm":97,"eggForm":null},{"id":98,"types":["water"],"tier":0,"canLay":true,"baseForm":98,"eggForm":null},{"id":99,"types":["water"],"tier":1,"canLay":true,"from":98,"baseForm":99,"eggForm":null},{"id":100,"types":["electric"],"tier":0,"canLay":true,"baseForm":100,"eggForm":null},{"id":101,"types":["electric"],"tier":1,"canLay":true,"from":100,"baseForm":101,"eggForm":null},{"id":102,"types":["grass","psychic"],"tier":1,"canLay":true,"baseForm":102,"eggForm":null},{"id":103,"types":["grass","psychic"],"tier":2,"canLay":true,"from":102,"baseForm":103,"eggForm":null},{"id":104,"types":["ground"],"tier":0,"canLay":true,"baseForm":104,"eggForm":null},{"id":105,"types":["ground"],"tier":1,"canLay":true,"from":104,"baseForm":105,"eggForm":null},{"id":106,"types":["fighting"],"tier":2,"canLay":true,"from":236,"baseForm":106,"eggForm":null},{"id":107,"types":["fighting"],"tier":2,"canLay":true,"from":236,"baseForm":107,"eggForm":null},{"id":108,"types":["normal"],"tier":2,"canLay":true,"baseForm":108,"eggForm":null},{"id":109,"types":["poison"],"tier":0,"canLay":true,"baseForm":109,"eggForm":null},{"id":110,"types":["poison"],"tier":1,"canLay":true,"from":109,"baseForm":110,"eggForm":null},{"id":111,"types":["ground","rock"],"tier":1,"canLay":true,"baseForm":111,"eggForm":null},{"id":112,"types":["ground","rock"],"tier":1,"canLay":true,"from":111,"baseForm":112,"eggForm":null},{"id":113,"types":["normal"],"tier":2,"canLay":true,"from":440,"baseForm":113,"eggForm":null},{"id":114,"types":["grass"],"tier":2,"canLay":true,"baseForm":114,"eggForm":null},{"id":115,"types":["normal"],"tier":2,"canLay":true,"baseForm":115,"eggForm":null},{"id":116,"types":["water"],"tier":0,"canLay":true,"baseForm":116,"eggForm":null},{"id":117,"types":["water"],"tier":1,"canLay":true,"from":116,"baseForm":117,"eggForm":null},{"id":118,"types":["water"],"tier":0,"canLay":true,"baseForm":118,"eggForm":null},{"id":119,"types":["water"],"tier":1,"canLay":true,"from":118,"baseForm":119,"eggForm":null},{"id":120,"types":["water"],"tier":0,"canLay":true,"baseForm":120,"eggForm":null},{"id":121,"types":["water","psychic"],"tier":2,"canLay":true,"from":120,"baseForm":121,"eggForm":null},{"id":122,"types":["psychic","fairy"],"tier":2,"canLay":true,"from":439,"baseForm":122,"eggForm":null},{"id":123,"types":["bug","flying"],"tier":2,"canLay":true,"baseForm":123,"eggForm":null},{"id":124,"types":["ice","psychic"],"tier":2,"canLay":true,"from":238,"baseForm":124,"eggForm":null},{"id":125,"types":["electric"],"tier":2,"canLay":true,"from":239,"baseForm":125,"eggForm":null},{"id":126,"types":["fire"],"tier":2,"canLay":true,"from":240,"baseForm":126,"eggForm":null},{"id":127,"types":["bug"],"tier":2,"canLay":true,"baseForm":127,"eggForm":null},{"id":128,"types":["normal"],"tier":2,"canLay":true,"baseForm":128,"eggForm":null},{"id":129,"types":["water"],"tier":0,"canLay":true,"baseForm":129,"eggForm":null},{"id":130,"types":["water","flying"],"tier":2,"canLay":true,"from":129,"baseForm":130,"eggForm":null},{"id":131,"types":["water","ice"],"tier":2,"canLay":true,"baseForm":131,"eggForm":null},{"id":132,"types":["normal"],"tier":2,"canLay":false,"baseForm":132,"eggForm":null},{"id":133,"types":["normal"],"tier":2,"canLay":true,"baseForm":133,"eggForm":null},{"id":134,"types":["water"],"tier":2,"canLay":true,"from":133,"baseForm":134,"eggForm":null},{"id":135,"types":["electric"],"tier":2,"canLay":true,"from":133,"baseForm":135,"eggForm":null},{"id":136,"types":["fire"],"tier":2,"canLay":true,"from":133,"baseForm":136,"eggForm":null},{"id":137,"types":["normal"],"tier":2,"canLay":false,"baseForm":137,"eggForm":null},{"id":138,"types":["rock","water"],"tier":2,"canLay":true,"baseForm":138,"eggForm":null},{"id":139,"types":["rock","water"],"tier":2,"canLay":true,"from":138,"baseForm":139,"eggForm":null},{"id":140,"types":["rock","water"],"tier":2,"canLay":true,"baseForm":140,"eggForm":null},{"id":141,"types":["rock","water"],"tier":2,"canLay":true,"from":140,"baseForm":141,"eggForm":null},{"id":142,"types":["rock","flying"],"tier":2,"canLay":true,"baseForm":142,"eggForm":null},{"id":143,"types":["normal"],"tier":2,"canLay":true,"from":446,"baseForm":143,"eggForm":null},{"id":144,"types":["ice","flying"],"tier":3,"canLay":false,"baseForm":144,"eggForm":null},{"id":145,"types":["electric","flying"],"tier":3,"canLay":false,"baseForm":145,"eggForm":null},{"id":146,"types":["fire","flying"],"tier":3,"canLay":false,"baseForm":146,"eggForm":null},{"id":147,"types":["dragon"],"tier":2,"canLay":true,"baseForm":147,"eggForm":null},{"id":148,"types":["dragon"],"tier":2,"canLay":true,"from":147,"baseForm":148,"eggForm":null},{"id":149,"types":["dragon","flying"],"tier":2,"canLay":true,"from":148,"baseForm":149,"eggForm":null},{"id":150,"types":["psychic"],"tier":3,"canLay":false,"baseForm":150,"eggForm":null},{"id":151,"types":["psychic"],"tier":3,"canLay":false,"baseForm":151,"eggForm":null},{"id":152,"types":["grass"],"tier":2,"canLay":true,"baseForm":152,"eggForm":null},{"id":153,"types":["grass"],"tier":2,"canLay":true,"from":152,"baseForm":153,"eggForm":null},{"id":154,"types":["grass"],"tier":2,"canLay":true,"from":153,"baseForm":154,"eggForm":null},{"id":155,"types":["fire"],"tier":2,"canLay":true,"baseForm":155,"eggForm":null},{"id":156,"types":["fire"],"tier":2,"canLay":true,"from":155,"baseForm":156,"eggForm":null},{"id":157,"types":["fire"],"tier":2,"canLay":true,"from":156,"baseForm":157,"eggForm":null},{"id":158,"types":["water"],"tier":2,"canLay":true,"baseForm":158,"eggForm":null},{"id":159,"types":["water"],"tier":2,"canLay":true,"from":158,"baseForm":159,"eggForm":null},{"id":160,"types":["water"],"tier":2,"canLay":true,"from":159,"baseForm":160,"eggForm":null},{"id":161,"types":["normal"],"tier":0,"canLay":true,"baseForm":161,"eggForm":null},{"id":162,"types":["normal"],"tier":1,"canLay":true,"from":161,"baseForm":162,"eggForm":null},{"id":163,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":163,"eggForm":null},{"id":164,"types":["normal","flying"],"tier":1,"canLay":true,"from":163,"baseForm":164,"eggForm":null},{"id":165,"types":["bug","flying"],"tier":0,"canLay":true,"baseForm":165,"eggForm":null},{"id":166,"types":["bug","flying"],"tier":1,"canLay":true,"from":165,"baseForm":166,"eggForm":null},{"id":167,"types":["bug","poison"],"tier":0,"canLay":true,"baseForm":167,"eggForm":null},{"id":168,"types":["bug","poison"],"tier":1,"canLay":true,"from":167,"baseForm":168,"eggForm":null},{"id":169,"types":["poison","flying"],"tier":2,"canLay":true,"from":42,"baseForm":169,"eggForm":null},{"id":170,"types":["water","electric"],"tier":0,"canLay":true,"baseForm":170,"eggForm":null},{"id":171,"types":["water","electric"],"tier":1,"canLay":true,"from":170,"baseForm":171,"eggForm":null},{"id":172,"types":["electric"],"tier":0,"canLay":true,"baseForm":172,"eggForm":null},{"id":173,"types":["fairy"],"tier":0,"canLay":true,"baseForm":173,"eggForm":null},{"id":174,"types":["normal","fairy"],"tier":0,"canLay":true,"baseForm":174,"eggForm":null},{"id":175,"types":["fairy"],"tier":0,"canLay":true,"baseForm":175,"eggForm":null},{"id":176,"types":["fairy","flying"],"tier":1,"canLay":true,"from":175,"baseForm":176,"eggForm":null},{"id":177,"types":["psychic","flying"],"tier":0,"canLay":true,"baseForm":177,"eggForm":null},{"id":178,"types":["psychic","flying"],"tier":1,"canLay":true,"from":177,"baseForm":178,"eggForm":null},{"id":179,"types":["electric"],"tier":0,"canLay":true,"baseForm":179,"eggForm":null},{"id":180,"types":["electric"],"tier":1,"canLay":true,"from":179,"baseForm":180,"eggForm":null},{"id":181,"types":["electric"],"tier":2,"canLay":true,"from":180,"baseForm":181,"eggForm":null},{"id":182,"types":["grass"],"tier":2,"canLay":true,"from":44,"baseForm":182,"eggForm":null},{"id":183,"types":["water","fairy"],"tier":0,"canLay":true,"from":298,"baseForm":183,"eggForm":null},{"id":184,"types":["water","fairy"],"tier":1,"canLay":true,"from":183,"baseForm":184,"eggForm":null},{"id":185,"types":["rock"],"tier":1,"canLay":true,"from":438,"baseForm":185,"eggForm":null},{"id":186,"types":["water"],"tier":2,"canLay":true,"from":61,"baseForm":186,"eggForm":null},{"id":187,"types":["grass","flying"],"tier":0,"canLay":true,"baseForm":187,"eggForm":null},{"id":188,"types":["grass","flying"],"tier":1,"canLay":true,"from":187,"baseForm":188,"eggForm":null},{"id":189,"types":["grass","flying"],"tier":2,"canLay":true,"from":188,"baseForm":189,"eggForm":null},{"id":190,"types":["normal"],"tier":2,"canLay":true,"baseForm":190,"eggForm":null},{"id":191,"types":["grass"],"tier":0,"canLay":true,"baseForm":191,"eggForm":null},{"id":192,"types":["grass"],"tier":1,"canLay":true,"from":191,"baseForm":192,"eggForm":null},{"id":193,"types":["bug","flying"],"tier":1,"canLay":true,"baseForm":193,"eggForm":null},{"id":194,"types":["water","ground"],"tier":0,"canLay":true,"baseForm":194,"eggForm":null},{"id":195,"types":["water","ground"],"tier":1,"canLay":true,"from":194,"baseForm":195,"eggForm":null},{"id":196,"types":["psychic"],"tier":2,"canLay":true,"from":133,"baseForm":196,"eggForm":null},{"id":197,"types":["dark"],"tier":2,"canLay":true,"from":133,"baseForm":197,"eggForm":null},{"id":198,"types":["dark","flying"],"tier":2,"canLay":true,"baseForm":198,"eggForm":null},{"id":199,"types":["water","psychic"],"tier":1,"canLay":true,"from":79,"baseForm":199,"eggForm":null},{"id":200,"types":["ghost"],"tier":2,"canLay":true,"baseForm":200,"eggForm":null},{"id":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":201,"eggForm":null},{"id":202,"types":["psychic"],"tier":2,"canLay":true,"from":360,"baseForm":202,"eggForm":null},{"id":203,"types":["normal","psychic"],"tier":1,"canLay":true,"baseForm":203,"eggForm":null},{"id":204,"types":["bug"],"tier":0,"canLay":true,"baseForm":204,"eggForm":null},{"id":205,"types":["bug","steel"],"tier":1,"canLay":true,"from":204,"baseForm":205,"eggForm":null},{"id":206,"types":["normal"],"tier":0,"canLay":true,"baseForm":206,"eggForm":null},{"id":207,"types":["ground","flying"],"tier":1,"canLay":true,"baseForm":207,"eggForm":null},{"id":208,"types":["steel","ground"],"tier":2,"canLay":true,"from":95,"baseForm":208,"eggForm":null},{"id":209,"types":["fairy"],"tier":0,"canLay":true,"baseForm":209,"eggForm":null},{"id":210,"types":["fairy"],"tier":1,"canLay":true,"from":209,"baseForm":210,"eggForm":null},{"id":211,"types":["water","poison"],"tier":2,"canLay":true,"baseForm":211,"eggForm":null},{"id":212,"types":["bug","steel"],"tier":2,"canLay":true,"from":123,"baseForm":212,"eggForm":null},{"id":213,"types":["bug","rock"],"tier":2,"canLay":true,"baseForm":213,"eggForm":null},{"id":214,"types":["bug","fighting"],"tier":2,"canLay":true,"baseForm":214,"eggForm":null},{"id":215,"types":["dark","ice"],"tier":1,"canLay":true,"baseForm":215,"eggForm":null},{"id":216,"types":["normal"],"tier":1,"canLay":true,"baseForm":216,"eggForm":null},{"id":217,"types":["normal"],"tier":2,"canLay":true,"from":216,"baseForm":217,"eggForm":null},{"id":218,"types":["fire"],"tier":0,"canLay":true,"baseForm":218,"eggForm":null},{"id":219,"types":["fire","rock"],"tier":1,"canLay":true,"from":218,"baseForm":219,"eggForm":null},{"id":220,"types":["ice","ground"],"tier":0,"canLay":true,"baseForm":220,"eggForm":null},{"id":221,"types":["ice","ground"],"tier":1,"canLay":true,"from":220,"baseForm":221,"eggForm":null},{"id":222,"types":["water","rock"],"tier":1,"canLay":true,"baseForm":222,"eggForm":null},{"id":223,"types":["water"],"tier":0,"canLay":true,"baseForm":223,"eggForm":null},{"id":224,"types":["water"],"tier":1,"canLay":true,"from":223,"baseForm":224,"eggForm":null},{"id":225,"types":["ice","flying"],"tier":2,"canLay":true,"baseForm":225,"eggForm":null},{"id":226,"types":["water","flying"],"tier":2,"canLay":true,"from":458,"baseForm":226,"eggForm":null},{"id":227,"types":["steel","flying"],"tier":2,"canLay":true,"baseForm":227,"eggForm":null},{"id":228,"types":["dark","fire"],"tier":1,"canLay":true,"baseForm":228,"eggForm":null},{"id":229,"types":["dark","fire"],"tier":2,"canLay":true,"from":228,"baseForm":229,"eggForm":null},{"id":230,"types":["water","dragon"],"tier":2,"canLay":true,"from":117,"baseForm":230,"eggForm":null},{"id":231,"types":["ground"],"tier":1,"canLay":true,"baseForm":231,"eggForm":null},{"id":232,"types":["ground"],"tier":2,"canLay":true,"from":231,"baseForm":232,"eggForm":null},{"id":233,"types":["normal"],"tier":2,"canLay":false,"from":137,"baseForm":233,"eggForm":null},{"id":234,"types":["normal"],"tier":2,"canLay":true,"baseForm":234,"eggForm":null},{"id":235,"types":["normal"],"tier":2,"canLay":true,"baseForm":235,"eggForm":null},{"id":236,"types":["fighting"],"tier":1,"canLay":true,"baseForm":236,"eggForm":null},{"id":237,"types":["fighting"],"tier":2,"canLay":true,"from":236,"baseForm":237,"eggForm":null},{"id":238,"types":["ice","psychic"],"tier":2,"canLay":true,"baseForm":238,"eggForm":null},{"id":239,"types":["electric"],"tier":2,"canLay":true,"baseForm":239,"eggForm":null},{"id":240,"types":["fire"],"tier":2,"canLay":true,"baseForm":240,"eggForm":null},{"id":241,"types":["normal"],"tier":2,"canLay":true,"baseForm":241,"eggForm":null},{"id":242,"types":["normal"],"tier":2,"canLay":true,"from":113,"baseForm":242,"eggForm":null},{"id":243,"types":["electric"],"tier":3,"canLay":false,"baseForm":243,"eggForm":null},{"id":244,"types":["fire"],"tier":3,"canLay":false,"baseForm":244,"eggForm":null},{"id":245,"types":["water"],"tier":3,"canLay":false,"baseForm":245,"eggForm":null},{"id":246,"types":["rock","ground"],"tier":2,"canLay":true,"baseForm":246,"eggForm":null},{"id":247,"types":["rock","ground"],"tier":2,"canLay":true,"from":246,"baseForm":247,"eggForm":null},{"id":248,"types":["rock","dark"],"tier":2,"canLay":true,"from":247,"baseForm":248,"eggForm":null},{"id":249,"types":["psychic","flying"],"tier":3,"canLay":false,"baseForm":249,"eggForm":null},{"id":250,"types":["fire","flying"],"tier":3,"canLay":false,"baseForm":250,"eggForm":null},{"id":251,"types":["psychic","grass"],"tier":3,"canLay":false,"baseForm":251,"eggForm":null},{"id":252,"types":["grass"],"tier":2,"canLay":true,"baseForm":252,"eggForm":null},{"id":253,"types":["grass"],"tier":2,"canLay":true,"from":252,"baseForm":253,"eggForm":null},{"id":254,"types":["grass"],"tier":2,"canLay":true,"from":253,"baseForm":254,"eggForm":null},{"id":255,"types":["fire"],"tier":2,"canLay":true,"baseForm":255,"eggForm":null},{"id":256,"types":["fire","fighting"],"tier":2,"canLay":true,"from":255,"baseForm":256,"eggForm":null},{"id":257,"types":["fire","fighting"],"tier":2,"canLay":true,"from":256,"baseForm":257,"eggForm":null},{"id":258,"types":["water"],"tier":2,"canLay":true,"baseForm":258,"eggForm":null},{"id":259,"types":["water","ground"],"tier":2,"canLay":true,"from":258,"baseForm":259,"eggForm":null},{"id":260,"types":["water","ground"],"tier":2,"canLay":true,"from":259,"baseForm":260,"eggForm":null},{"id":261,"types":["dark"],"tier":0,"canLay":true,"baseForm":261,"eggForm":null},{"id":262,"types":["dark"],"tier":1,"canLay":true,"from":261,"baseForm":262,"eggForm":null},{"id":263,"types":["normal"],"tier":0,"canLay":true,"baseForm":263,"eggForm":null},{"id":264,"types":["normal"],"tier":1,"canLay":true,"from":263,"baseForm":264,"eggForm":null},{"id":265,"types":["bug"],"tier":0,"canLay":true,"baseForm":265,"eggForm":null},{"id":266,"types":["bug"],"tier":1,"canLay":true,"from":265,"baseForm":266,"eggForm":null},{"id":267,"types":["bug","flying"],"tier":2,"canLay":true,"from":266,"baseForm":267,"eggForm":null},{"id":268,"types":["bug"],"tier":1,"canLay":true,"from":265,"baseForm":268,"eggForm":null},{"id":269,"types":["bug","poison"],"tier":2,"canLay":true,"from":268,"baseForm":269,"eggForm":null},{"id":270,"types":["water","grass"],"tier":0,"canLay":true,"baseForm":270,"eggForm":null},{"id":271,"types":["water","grass"],"tier":1,"canLay":true,"from":270,"baseForm":271,"eggForm":null},{"id":272,"types":["water","grass"],"tier":2,"canLay":true,"from":271,"baseForm":272,"eggForm":null},{"id":273,"types":["grass"],"tier":0,"canLay":true,"baseForm":273,"eggForm":null},{"id":274,"types":["grass","dark"],"tier":1,"canLay":true,"from":273,"baseForm":274,"eggForm":null},{"id":275,"types":["grass","dark"],"tier":2,"canLay":true,"from":274,"baseForm":275,"eggForm":null},{"id":276,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":276,"eggForm":null},{"id":277,"types":["normal","flying"],"tier":2,"canLay":true,"from":276,"baseForm":277,"eggForm":null},{"id":278,"types":["water","flying"],"tier":0,"canLay":true,"baseForm":278,"eggForm":null},{"id":279,"types":["water","flying"],"tier":2,"canLay":true,"from":278,"baseForm":279,"eggForm":null},{"id":280,"types":["psychic","fairy"],"tier":0,"canLay":true,"baseForm":280,"eggForm":null},{"id":281,"types":["psychic","fairy"],"tier":1,"canLay":true,"from":280,"baseForm":281,"eggForm":null},{"id":282,"types":["psychic","fairy"],"tier":2,"canLay":true,"from":281,"baseForm":282,"eggForm":null},{"id":283,"types":["bug","water"],"tier":1,"canLay":true,"baseForm":283,"eggForm":null},{"id":284,"types":["bug","flying"],"tier":1,"canLay":true,"from":283,"baseForm":284,"eggForm":null},{"id":285,"types":["grass"],"tier":0,"canLay":true,"baseForm":285,"eggForm":null},{"id":286,"types":["grass","fighting"],"tier":1,"canLay":true,"from":285,"baseForm":286,"eggForm":null},{"id":287,"types":["normal"],"tier":0,"canLay":true,"baseForm":287,"eggForm":null},{"id":288,"types":["normal"],"tier":1,"canLay":true,"from":287,"baseForm":288,"eggForm":null},{"id":289,"types":["normal"],"tier":2,"canLay":true,"from":288,"baseForm":289,"eggForm":null},{"id":290,"types":["bug","ground"],"tier":0,"canLay":true,"baseForm":290,"eggForm":null},{"id":291,"types":["bug","flying"],"tier":1,"canLay":true,"from":290,"baseForm":291,"eggForm":null},{"id":292,"types":["bug","ghost"],"tier":2,"canLay":true,"from":290,"baseForm":292,"eggForm":null},{"id":293,"types":["normal"],"tier":0,"canLay":true,"baseForm":293,"eggForm":null},{"id":294,"types":["normal"],"tier":1,"canLay":true,"from":293,"baseForm":294,"eggForm":null},{"id":295,"types":["normal"],"tier":2,"canLay":true,"from":294,"baseForm":295,"eggForm":null},{"id":296,"types":["fighting"],"tier":0,"canLay":true,"baseForm":296,"eggForm":null},{"id":297,"types":["fighting"],"tier":1,"canLay":true,"from":296,"baseForm":297,"eggForm":null},{"id":298,"types":["normal","fairy"],"tier":0,"canLay":true,"baseForm":298,"eggForm":null},{"id":299,"types":["rock"],"tier":0,"canLay":true,"baseForm":299,"eggForm":null},{"id":300,"types":["normal"],"tier":0,"canLay":true,"baseForm":300,"eggForm":null},{"id":301,"types":["normal"],"tier":1,"canLay":true,"from":300,"baseForm":301,"eggForm":null},{"id":302,"types":["dark","ghost"],"tier":2,"canLay":true,"baseForm":302,"eggForm":null},{"id":303,"types":["steel","fairy"],"tier":2,"canLay":true,"baseForm":303,"eggForm":null},{"id":304,"types":["steel","rock"],"tier":0,"canLay":true,"baseForm":304,"eggForm":null},{"id":305,"types":["steel","rock"],"tier":1,"canLay":true,"from":304,"baseForm":305,"eggForm":null},{"id":306,"types":["steel","rock"],"tier":2,"canLay":true,"from":305,"baseForm":306,"eggForm":null},{"id":307,"types":["fighting","psychic"],"tier":0,"canLay":true,"baseForm":307,"eggForm":null},{"id":308,"types":["fighting","psychic"],"tier":1,"canLay":true,"from":307,"baseForm":308,"eggForm":null},{"id":309,"types":["electric"],"tier":1,"canLay":true,"baseForm":309,"eggForm":null},{"id":310,"types":["electric"],"tier":2,"canLay":true,"from":309,"baseForm":310,"eggForm":null},{"id":311,"types":["electric"],"tier":0,"canLay":true,"baseForm":311,"eggForm":null},{"id":312,"types":["electric"],"tier":0,"canLay":true,"baseForm":312,"eggForm":null},{"id":313,"types":["bug"],"tier":0,"canLay":true,"baseForm":313,"eggForm":null},{"id":314,"types":["bug"],"tier":0,"canLay":true,"baseForm":314,"eggForm":null},{"id":315,"types":["grass","poison"],"tier":0,"canLay":true,"from":406,"baseForm":315,"eggForm":null},{"id":316,"types":["poison"],"tier":0,"canLay":true,"baseForm":316,"eggForm":null},{"id":317,"types":["poison"],"tier":1,"canLay":true,"from":316,"baseForm":317,"eggForm":null},{"id":318,"types":["water","dark"],"tier":0,"canLay":true,"baseForm":318,"eggForm":null},{"id":319,"types":["water","dark"],"tier":1,"canLay":true,"from":318,"baseForm":319,"eggForm":null},{"id":320,"types":["water"],"tier":0,"canLay":true,"baseForm":320,"eggForm":null},{"id":321,"types":["water"],"tier":2,"canLay":true,"from":320,"baseForm":321,"eggForm":null},{"id":322,"types":["fire","ground"],"tier":0,"canLay":true,"baseForm":322,"eggForm":null},{"id":323,"types":["fire","ground"],"tier":1,"canLay":true,"from":322,"baseForm":323,"eggForm":null},{"id":324,"types":["fire"],"tier":1,"canLay":true,"baseForm":324,"eggForm":null},{"id":325,"types":["psychic"],"tier":0,"canLay":true,"baseForm":325,"eggForm":null},{"id":326,"types":["psychic"],"tier":1,"canLay":true,"from":325,"baseForm":326,"eggForm":null},{"id":327,"types":["normal"],"tier":0,"canLay":true,"baseForm":327,"eggForm":null},{"id":328,"types":["ground"],"tier":0,"canLay":true,"baseForm":328,"eggForm":null},{"id":329,"types":["ground","dragon"],"tier":1,"canLay":true,"from":328,"baseForm":329,"eggForm":null},{"id":330,"types":["ground","dragon"],"tier":2,"canLay":true,"from":329,"baseForm":330,"eggForm":null},{"id":331,"types":["grass"],"tier":0,"canLay":true,"baseForm":331,"eggForm":null},{"id":332,"types":["grass","dark"],"tier":1,"canLay":true,"from":331,"baseForm":332,"eggForm":null},{"id":333,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":333,"eggForm":null},{"id":334,"types":["dragon","flying"],"tier":2,"canLay":true,"from":333,"baseForm":334,"eggForm":null},{"id":335,"types":["normal"],"tier":1,"canLay":true,"baseForm":335,"eggForm":null},{"id":336,"types":["poison"],"tier":1,"canLay":true,"baseForm":336,"eggForm":null},{"id":337,"types":["rock","psychic"],"tier":2,"canLay":true,"baseForm":337,"eggForm":null},{"id":338,"types":["rock","psychic"],"tier":2,"canLay":true,"baseForm":338,"eggForm":null},{"id":339,"types":["water","ground"],"tier":0,"canLay":true,"baseForm":339,"eggForm":null},{"id":340,"types":["water","ground"],"tier":1,"canLay":true,"from":339,"baseForm":340,"eggForm":null},{"id":341,"types":["water"],"tier":0,"canLay":true,"baseForm":341,"eggForm":null},{"id":342,"types":["water","dark"],"tier":1,"canLay":true,"from":341,"baseForm":342,"eggForm":null},{"id":343,"types":["ground","psychic"],"tier":0,"canLay":true,"baseForm":343,"eggForm":null},{"id":344,"types":["ground","psychic"],"tier":2,"canLay":true,"from":343,"baseForm":344,"eggForm":null},{"id":345,"types":["rock","grass"],"tier":2,"canLay":true,"baseForm":345,"eggForm":null},{"id":346,"types":["rock","grass"],"tier":2,"canLay":true,"from":345,"baseForm":346,"eggForm":null},{"id":347,"types":["rock","bug"],"tier":2,"canLay":true,"baseForm":347,"eggForm":null},{"id":348,"types":["rock","bug"],"tier":2,"canLay":true,"from":347,"baseForm":348,"eggForm":null},{"id":349,"types":["water"],"tier":1,"canLay":true,"baseForm":349,"eggForm":null},{"id":350,"types":["water"],"tier":2,"canLay":true,"from":349,"baseForm":350,"eggForm":null},{"id":351,"types":["normal"],"tier":2,"canLay":true,"baseForm":351,"eggForm":null},{"id":352,"types":["normal"],"tier":0,"canLay":true,"baseForm":352,"eggForm":null},{"id":353,"types":["ghost"],"tier":0,"canLay":true,"baseForm":353,"eggForm":null},{"id":354,"types":["ghost"],"tier":2,"canLay":true,"from":353,"baseForm":354,"eggForm":null},{"id":355,"types":["ghost"],"tier":0,"canLay":true,"baseForm":355,"eggForm":null},{"id":356,"types":["ghost"],"tier":1,"canLay":true,"from":355,"baseForm":356,"eggForm":null},{"id":357,"types":["grass","flying"],"tier":1,"canLay":true,"baseForm":357,"eggForm":null},{"id":358,"types":["psychic"],"tier":2,"canLay":true,"from":433,"baseForm":358,"eggForm":null},{"id":359,"types":["dark"],"tier":2,"canLay":true,"baseForm":359,"eggForm":null},{"id":360,"types":["psychic"],"tier":0,"canLay":true,"baseForm":360,"eggForm":null},{"id":361,"types":["ice"],"tier":0,"canLay":true,"baseForm":361,"eggForm":null},{"id":362,"types":["ice"],"tier":1,"canLay":true,"from":361,"baseForm":362,"eggForm":null},{"id":363,"types":["ice","water"],"tier":0,"canLay":true,"baseForm":363,"eggForm":null},{"id":364,"types":["ice","water"],"tier":1,"canLay":true,"from":363,"baseForm":364,"eggForm":null},{"id":365,"types":["ice","water"],"tier":2,"canLay":true,"from":364,"baseForm":365,"eggForm":null},{"id":366,"types":["water"],"tier":0,"canLay":true,"baseForm":366,"eggForm":null},{"id":367,"types":["water"],"tier":1,"canLay":true,"from":366,"baseForm":367,"eggForm":null},{"id":368,"types":["water"],"tier":1,"canLay":true,"from":366,"baseForm":368,"eggForm":null},{"id":369,"types":["water","rock"],"tier":2,"canLay":true,"baseForm":369,"eggForm":null},{"id":370,"types":["water"],"tier":0,"canLay":true,"baseForm":370,"eggForm":null},{"id":371,"types":["dragon"],"tier":2,"canLay":true,"baseForm":371,"eggForm":null},{"id":372,"types":["dragon"],"tier":2,"canLay":true,"from":371,"baseForm":372,"eggForm":null},{"id":373,"types":["dragon","flying"],"tier":2,"canLay":true,"from":372,"baseForm":373,"eggForm":null},{"id":374,"types":["steel","psychic"],"tier":2,"canLay":true,"baseForm":374,"eggForm":null},{"id":375,"types":["steel","psychic"],"tier":2,"canLay":true,"from":374,"baseForm":375,"eggForm":null},{"id":376,"types":["steel","psychic"],"tier":2,"canLay":true,"from":375,"baseForm":376,"eggForm":null},{"id":377,"types":["rock"],"tier":3,"canLay":false,"baseForm":377,"eggForm":null},{"id":378,"types":["ice"],"tier":3,"canLay":false,"baseForm":378,"eggForm":null},{"id":379,"types":["steel"],"tier":3,"canLay":false,"baseForm":379,"eggForm":null},{"id":380,"types":["dragon","psychic"],"tier":3,"canLay":false,"baseForm":380,"eggForm":null},{"id":381,"types":["dragon","psychic"],"tier":3,"canLay":false,"baseForm":381,"eggForm":null},{"id":382,"types":["water"],"tier":3,"canLay":false,"baseForm":382,"eggForm":null},{"id":383,"types":["ground"],"tier":3,"canLay":false,"baseForm":383,"eggForm":null},{"id":384,"types":["dragon","flying"],"tier":3,"canLay":false,"baseForm":384,"eggForm":null},{"id":385,"types":["steel","psychic"],"tier":3,"canLay":false,"baseForm":385,"eggForm":null},{"id":386,"types":["psychic"],"tier":3,"canLay":false,"baseForm":386,"eggForm":null},{"id":387,"types":["grass"],"tier":2,"canLay":true,"baseForm":387,"eggForm":null},{"id":388,"types":["grass"],"tier":2,"canLay":true,"from":387,"baseForm":388,"eggForm":null},{"id":389,"types":["grass","ground"],"tier":2,"canLay":true,"from":388,"baseForm":389,"eggForm":null},{"id":390,"types":["fire"],"tier":2,"canLay":true,"baseForm":390,"eggForm":null},{"id":391,"types":["fire","fighting"],"tier":2,"canLay":true,"from":390,"baseForm":391,"eggForm":null},{"id":392,"types":["fire","fighting"],"tier":2,"canLay":true,"from":391,"baseForm":392,"eggForm":null},{"id":393,"types":["water"],"tier":2,"canLay":true,"baseForm":393,"eggForm":null},{"id":394,"types":["water"],"tier":2,"canLay":true,"from":393,"baseForm":394,"eggForm":null},{"id":395,"types":["water","steel"],"tier":2,"canLay":true,"from":394,"baseForm":395,"eggForm":null},{"id":396,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":396,"eggForm":null},{"id":397,"types":["normal","flying"],"tier":1,"canLay":true,"from":396,"baseForm":397,"eggForm":null},{"id":398,"types":["normal","flying"],"tier":2,"canLay":true,"from":397,"baseForm":398,"eggForm":null},{"id":399,"types":["normal"],"tier":0,"canLay":true,"baseForm":399,"eggForm":null},{"id":400,"types":["normal","water"],"tier":1,"canLay":true,"from":399,"baseForm":400,"eggForm":null},{"id":401,"types":["bug"],"tier":0,"canLay":true,"baseForm":401,"eggForm":null},{"id":402,"types":["bug"],"tier":2,"canLay":true,"from":401,"baseForm":402,"eggForm":null},{"id":403,"types":["electric"],"tier":0,"canLay":true,"baseForm":403,"eggForm":null},{"id":404,"types":["electric"],"tier":1,"canLay":true,"from":403,"baseForm":404,"eggForm":null},{"id":405,"types":["electric"],"tier":2,"canLay":true,"from":404,"baseForm":405,"eggForm":null},{"id":406,"types":["grass","poison"],"tier":0,"canLay":true,"baseForm":406,"eggForm":null},{"id":407,"types":["grass","poison"],"tier":2,"canLay":true,"from":315,"baseForm":407,"eggForm":null},{"id":408,"types":["rock"],"tier":2,"canLay":true,"baseForm":408,"eggForm":null},{"id":409,"types":["rock"],"tier":2,"canLay":true,"from":408,"baseForm":409,"eggForm":null},{"id":410,"types":["rock","steel"],"tier":2,"canLay":true,"baseForm":410,"eggForm":null},{"id":411,"types":["rock","steel"],"tier":2,"canLay":true,"from":410,"baseForm":411,"eggForm":null},{"id":412,"types":["bug"],"tier":1,"canLay":true,"baseForm":412,"eggForm":null},{"id":413,"types":["bug","grass"],"tier":2,"canLay":true,"from":412,"baseForm":413,"eggForm":null},{"id":414,"types":["bug","flying"],"tier":2,"canLay":true,"from":412,"baseForm":414,"eggForm":null},{"id":415,"types":["bug","flying"],"tier":1,"canLay":true,"baseForm":415,"eggForm":null},{"id":416,"types":["bug","flying"],"tier":2,"canLay":true,"from":415,"baseForm":416,"eggForm":null},{"id":417,"types":["electric"],"tier":0,"canLay":true,"baseForm":417,"eggForm":null},{"id":418,"types":["water"],"tier":0,"canLay":true,"baseForm":418,"eggForm":null},{"id":419,"types":["water"],"tier":1,"canLay":true,"from":418,"baseForm":419,"eggForm":null},{"id":420,"types":["grass"],"tier":0,"canLay":true,"baseForm":420,"eggForm":null},{"id":421,"types":["grass"],"tier":1,"canLay":true,"from":420,"baseForm":421,"eggForm":null},{"id":422,"types":["water"],"tier":0,"canLay":true,"baseForm":422,"eggForm":null},{"id":423,"types":["water","ground"],"tier":1,"canLay":true,"from":422,"baseForm":423,"eggForm":null},{"id":424,"types":["normal"],"tier":2,"canLay":true,"from":190,"baseForm":424,"eggForm":null},{"id":425,"types":["ghost","flying"],"tier":0,"canLay":true,"baseForm":425,"eggForm":null},{"id":426,"types":["ghost","flying"],"tier":1,"canLay":true,"from":425,"baseForm":426,"eggForm":null},{"id":427,"types":["normal"],"tier":0,"canLay":true,"baseForm":427,"eggForm":null},{"id":428,"types":["normal"],"tier":1,"canLay":true,"from":427,"baseForm":428,"eggForm":null},{"id":429,"types":["ghost"],"tier":2,"canLay":true,"from":200,"baseForm":429,"eggForm":null},{"id":430,"types":["dark","flying"],"tier":2,"canLay":true,"from":198,"baseForm":430,"eggForm":null},{"id":431,"types":["normal"],"tier":0,"canLay":true,"baseForm":431,"eggForm":null},{"id":432,"types":["normal"],"tier":1,"canLay":true,"from":431,"baseForm":432,"eggForm":null},{"id":433,"types":["psychic"],"tier":1,"canLay":true,"baseForm":433,"eggForm":null},{"id":434,"types":["poison","dark"],"tier":0,"canLay":true,"baseForm":434,"eggForm":null},{"id":435,"types":["poison","dark"],"tier":1,"canLay":true,"from":434,"baseForm":435,"eggForm":null},{"id":436,"types":["steel","psychic"],"tier":0,"canLay":true,"baseForm":436,"eggForm":null},{"id":437,"types":["steel","psychic"],"tier":2,"canLay":true,"from":436,"baseForm":437,"eggForm":null},{"id":438,"types":["rock"],"tier":0,"canLay":true,"baseForm":438,"eggForm":null},{"id":439,"types":["psychic","fairy"],"tier":0,"canLay":true,"baseForm":439,"eggForm":null},{"id":440,"types":["normal"],"tier":0,"canLay":true,"baseForm":440,"eggForm":null},{"id":441,"types":["normal","flying"],"tier":2,"canLay":true,"baseForm":441,"eggForm":null},{"id":442,"types":["ghost","dark"],"tier":1,"canLay":false,"baseForm":442,"eggForm":null},{"id":443,"types":["dragon","ground"],"tier":2,"canLay":true,"baseForm":443,"eggForm":null},{"id":444,"types":["dragon","ground"],"tier":2,"canLay":true,"from":443,"baseForm":444,"eggForm":null},{"id":445,"types":["dragon","ground"],"tier":2,"canLay":true,"from":444,"baseForm":445,"eggForm":null},{"id":446,"types":["normal"],"tier":1,"canLay":true,"baseForm":446,"eggForm":null},{"id":447,"types":["fighting"],"tier":1,"canLay":true,"baseForm":447,"eggForm":null},{"id":448,"types":["fighting","steel"],"tier":2,"canLay":true,"from":447,"baseForm":448,"eggForm":null},{"id":449,"types":["ground"],"tier":0,"canLay":true,"baseForm":449,"eggForm":null},{"id":450,"types":["ground"],"tier":2,"canLay":true,"from":449,"baseForm":450,"eggForm":null},{"id":451,"types":["poison","bug"],"tier":1,"canLay":true,"baseForm":451,"eggForm":null},{"id":452,"types":["poison","dark"],"tier":2,"canLay":true,"from":451,"baseForm":452,"eggForm":null},{"id":453,"types":["poison","fighting"],"tier":0,"canLay":true,"baseForm":453,"eggForm":null},{"id":454,"types":["poison","fighting"],"tier":1,"canLay":true,"from":453,"baseForm":454,"eggForm":null},{"id":455,"types":["grass"],"tier":1,"canLay":true,"baseForm":455,"eggForm":null},{"id":456,"types":["water"],"tier":0,"canLay":true,"baseForm":456,"eggForm":null},{"id":457,"types":["water"],"tier":1,"canLay":true,"from":456,"baseForm":457,"eggForm":null},{"id":458,"types":["water","flying"],"tier":2,"canLay":true,"baseForm":458,"eggForm":null},{"id":459,"types":["grass","ice"],"tier":1,"canLay":true,"baseForm":459,"eggForm":null},{"id":460,"types":["grass","ice"],"tier":1,"canLay":true,"from":459,"baseForm":460,"eggForm":null},{"id":461,"types":["dark","ice"],"tier":2,"canLay":true,"from":215,"baseForm":461,"eggForm":null},{"id":462,"types":["electric","steel"],"tier":2,"canLay":true,"from":82,"baseForm":462,"eggForm":null},{"id":463,"types":["normal"],"tier":2,"canLay":true,"from":108,"baseForm":463,"eggForm":null},{"id":464,"types":["ground","rock"],"tier":2,"canLay":true,"from":112,"baseForm":464,"eggForm":null},{"id":465,"types":["grass"],"tier":2,"canLay":true,"from":114,"baseForm":465,"eggForm":null},{"id":466,"types":["electric"],"tier":2,"canLay":true,"from":125,"baseForm":466,"eggForm":null},{"id":467,"types":["fire"],"tier":2,"canLay":true,"from":126,"baseForm":467,"eggForm":null},{"id":468,"types":["fairy","flying"],"tier":2,"canLay":true,"from":176,"baseForm":468,"eggForm":null},{"id":469,"types":["bug","flying"],"tier":2,"canLay":true,"from":193,"baseForm":469,"eggForm":null},{"id":470,"types":["grass"],"tier":2,"canLay":true,"from":133,"baseForm":470,"eggForm":null},{"id":471,"types":["ice"],"tier":2,"canLay":true,"from":133,"baseForm":471,"eggForm":null},{"id":472,"types":["ground","flying"],"tier":2,"canLay":true,"from":207,"baseForm":472,"eggForm":null},{"id":473,"types":["ice","ground"],"tier":2,"canLay":true,"from":221,"baseForm":473,"eggForm":null},{"id":474,"types":["normal"],"tier":2,"canLay":false,"from":233,"baseForm":474,"eggForm":null},{"id":475,"types":["psychic","fighting"],"tier":2,"canLay":true,"from":281,"baseForm":475,"eggForm":null},{"id":476,"types":["rock","steel"],"tier":2,"canLay":true,"from":299,"baseForm":476,"eggForm":null},{"id":477,"types":["ghost"],"tier":2,"canLay":true,"from":356,"baseForm":477,"eggForm":null},{"id":478,"types":["ice","ghost"],"tier":1,"canLay":true,"from":361,"baseForm":478,"eggForm":null},{"id":479,"types":["electric","ghost"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":480,"types":["psychic"],"tier":3,"canLay":false,"baseForm":480,"eggForm":null},{"id":481,"types":["psychic"],"tier":3,"canLay":false,"baseForm":481,"eggForm":null},{"id":482,"types":["psychic"],"tier":3,"canLay":false,"baseForm":482,"eggForm":null},{"id":483,"types":["steel","dragon"],"tier":3,"canLay":false,"baseForm":483,"eggForm":null},{"id":484,"types":["water","dragon"],"tier":3,"canLay":false,"baseForm":484,"eggForm":null},{"id":485,"types":["fire","steel"],"tier":3,"canLay":false,"baseForm":485,"eggForm":null},{"id":486,"types":["normal"],"tier":3,"canLay":false,"baseForm":486,"eggForm":null},{"id":487,"types":["ghost","dragon"],"tier":3,"canLay":false,"baseForm":487,"eggForm":null},{"id":488,"types":["psychic"],"tier":3,"canLay":false,"baseForm":488,"eggForm":null},{"id":489,"types":["water"],"tier":3,"canLay":true,"baseForm":489,"eggForm":null},{"id":490,"types":["water"],"tier":3,"canLay":true,"baseForm":490,"eggForm":null},{"id":491,"types":["dark"],"tier":3,"canLay":false,"baseForm":491,"eggForm":null},{"id":492,"types":["grass"],"tier":3,"canLay":false,"baseForm":492,"eggForm":null},{"id":493,"types":["normal"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":494,"types":["psychic","fire"],"tier":3,"canLay":false,"baseForm":494,"eggForm":null},{"id":495,"types":["grass"],"tier":2,"canLay":true,"baseForm":495,"eggForm":null},{"id":496,"types":["grass"],"tier":2,"canLay":true,"from":495,"baseForm":496,"eggForm":null},{"id":497,"types":["grass"],"tier":2,"canLay":true,"from":496,"baseForm":497,"eggForm":null},{"id":498,"types":["fire"],"tier":2,"canLay":true,"baseForm":498,"eggForm":null},{"id":499,"types":["fire","fighting"],"tier":2,"canLay":true,"from":498,"baseForm":499,"eggForm":null},{"id":500,"types":["fire","fighting"],"tier":2,"canLay":true,"from":499,"baseForm":500,"eggForm":null},{"id":501,"types":["water"],"tier":2,"canLay":true,"baseForm":501,"eggForm":null},{"id":502,"types":["water"],"tier":2,"canLay":true,"from":501,"baseForm":502,"eggForm":null},{"id":503,"types":["water"],"tier":2,"canLay":true,"from":502,"baseForm":503,"eggForm":null},{"id":504,"types":["normal"],"tier":0,"canLay":true,"baseForm":504,"eggForm":null},{"id":505,"types":["normal"],"tier":1,"canLay":true,"from":504,"baseForm":505,"eggForm":null},{"id":506,"types":["normal"],"tier":0,"canLay":true,"baseForm":506,"eggForm":null},{"id":507,"types":["normal"],"tier":1,"canLay":true,"from":506,"baseForm":507,"eggForm":null},{"id":508,"types":["normal"],"tier":2,"canLay":true,"from":507,"baseForm":508,"eggForm":null},{"id":509,"types":["dark"],"tier":0,"canLay":true,"baseForm":509,"eggForm":null},{"id":510,"types":["dark"],"tier":1,"canLay":true,"from":509,"baseForm":510,"eggForm":null},{"id":511,"types":["grass"],"tier":0,"canLay":true,"baseForm":511,"eggForm":null},{"id":512,"types":["grass"],"tier":1,"canLay":true,"from":511,"baseForm":512,"eggForm":null},{"id":513,"types":["fire"],"tier":0,"canLay":true,"baseForm":513,"eggForm":null},{"id":514,"types":["fire"],"tier":1,"canLay":true,"from":513,"baseForm":514,"eggForm":null},{"id":515,"types":["water"],"tier":0,"canLay":true,"baseForm":515,"eggForm":null},{"id":516,"types":["water"],"tier":1,"canLay":true,"from":515,"baseForm":516,"eggForm":null},{"id":517,"types":["psychic"],"tier":0,"canLay":true,"baseForm":517,"eggForm":null},{"id":518,"types":["psychic"],"tier":1,"canLay":true,"from":517,"baseForm":518,"eggForm":null},{"id":519,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":519,"eggForm":null},{"id":520,"types":["normal","flying"],"tier":1,"canLay":true,"from":519,"baseForm":520,"eggForm":null},{"id":521,"types":["normal","flying"],"tier":2,"canLay":true,"from":520,"baseForm":521,"eggForm":null},{"id":522,"types":["electric"],"tier":0,"canLay":true,"baseForm":522,"eggForm":null},{"id":523,"types":["electric"],"tier":1,"canLay":true,"from":522,"baseForm":523,"eggForm":null},{"id":524,"types":["rock"],"tier":0,"canLay":true,"baseForm":524,"eggForm":null},{"id":525,"types":["rock"],"tier":1,"canLay":true,"from":524,"baseForm":525,"eggForm":null},{"id":526,"types":["rock"],"tier":2,"canLay":true,"from":525,"baseForm":526,"eggForm":null},{"id":527,"types":["psychic","flying"],"tier":0,"canLay":true,"baseForm":527,"eggForm":null},{"id":528,"types":["psychic","flying"],"tier":2,"canLay":true,"from":527,"baseForm":528,"eggForm":null},{"id":529,"types":["ground"],"tier":1,"canLay":true,"baseForm":529,"eggForm":null},{"id":530,"types":["ground","steel"],"tier":2,"canLay":true,"from":529,"baseForm":530,"eggForm":null},{"id":531,"types":["normal"],"tier":0,"canLay":true,"baseForm":531,"eggForm":null},{"id":532,"types":["fighting"],"tier":0,"canLay":true,"baseForm":532,"eggForm":null},{"id":533,"types":["fighting"],"tier":1,"canLay":true,"from":532,"baseForm":533,"eggForm":null},{"id":534,"types":["fighting"],"tier":2,"canLay":true,"from":533,"baseForm":534,"eggForm":null},{"id":535,"types":["water"],"tier":0,"canLay":true,"baseForm":535,"eggForm":null},{"id":536,"types":["water","ground"],"tier":1,"canLay":true,"from":535,"baseForm":536,"eggForm":null},{"id":537,"types":["water","ground"],"tier":2,"canLay":true,"from":536,"baseForm":537,"eggForm":null},{"id":538,"types":["fighting"],"tier":2,"canLay":true,"baseForm":538,"eggForm":null},{"id":539,"types":["fighting"],"tier":2,"canLay":true,"baseForm":539,"eggForm":null},{"id":540,"types":["bug","grass"],"tier":0,"canLay":true,"baseForm":540,"eggForm":null},{"id":541,"types":["bug","grass"],"tier":1,"canLay":true,"from":540,"baseForm":541,"eggForm":null},{"id":542,"types":["bug","grass"],"tier":2,"canLay":true,"from":541,"baseForm":542,"eggForm":null},{"id":543,"types":["bug","poison"],"tier":0,"canLay":true,"baseForm":543,"eggForm":null},{"id":544,"types":["bug","poison"],"tier":1,"canLay":true,"from":543,"baseForm":544,"eggForm":null},{"id":545,"types":["bug","poison"],"tier":2,"canLay":true,"from":544,"baseForm":545,"eggForm":null},{"id":546,"types":["grass","fairy"],"tier":0,"canLay":true,"baseForm":546,"eggForm":null},{"id":547,"types":["grass","fairy"],"tier":1,"canLay":true,"from":546,"baseForm":547,"eggForm":null},{"id":548,"types":["grass"],"tier":0,"canLay":true,"baseForm":548,"eggForm":null},{"id":549,"types":["grass"],"tier":1,"canLay":true,"from":548,"baseForm":549,"eggForm":null},{"id":550,"types":["water"],"tier":2,"canLay":true,"baseForm":550,"eggForm":null},{"id":551,"types":["ground","dark"],"tier":0,"canLay":true,"baseForm":551,"eggForm":null},{"id":552,"types":["ground","dark"],"tier":1,"canLay":true,"from":551,"baseForm":552,"eggForm":null},{"id":553,"types":["ground","dark"],"tier":2,"canLay":true,"from":552,"baseForm":553,"eggForm":null},{"id":554,"types":["fire"],"tier":1,"canLay":true,"baseForm":554,"eggForm":null},{"id":555,"types":["fire"],"tier":1,"canLay":true,"from":554,"baseForm":555,"eggForm":null},{"id":556,"types":["grass"],"tier":1,"canLay":false,"baseForm":556,"eggForm":null},{"id":557,"types":["bug","rock"],"tier":0,"canLay":true,"baseForm":557,"eggForm":null},{"id":558,"types":["bug","rock"],"tier":1,"canLay":true,"from":557,"baseForm":558,"eggForm":null},{"id":559,"types":["dark","fighting"],"tier":0,"canLay":true,"baseForm":559,"eggForm":null},{"id":560,"types":["dark","fighting"],"tier":1,"canLay":true,"from":559,"baseForm":560,"eggForm":null},{"id":561,"types":["psychic","flying"],"tier":2,"canLay":true,"baseForm":561,"eggForm":null},{"id":562,"types":["ghost"],"tier":0,"canLay":true,"baseForm":562,"eggForm":null},{"id":563,"types":["ghost"],"tier":1,"canLay":true,"from":562,"baseForm":563,"eggForm":null},{"id":564,"types":["water","rock"],"tier":2,"canLay":true,"baseForm":564,"eggForm":null},{"id":565,"types":["water","rock"],"tier":2,"canLay":true,"from":564,"baseForm":565,"eggForm":null},{"id":566,"types":["rock","flying"],"tier":2,"canLay":true,"baseForm":566,"eggForm":null},{"id":567,"types":["rock","flying"],"tier":2,"canLay":true,"from":566,"baseForm":567,"eggForm":null},{"id":568,"types":["poison"],"tier":0,"canLay":true,"baseForm":568,"eggForm":null},{"id":569,"types":["poison"],"tier":1,"canLay":true,"from":568,"baseForm":569,"eggForm":null},{"id":570,"types":["dark"],"tier":1,"canLay":true,"baseForm":570,"eggForm":null},{"id":571,"types":["dark"],"tier":2,"canLay":true,"from":570,"baseForm":571,"eggForm":null},{"id":572,"types":["normal"],"tier":0,"canLay":true,"baseForm":572,"eggForm":null},{"id":573,"types":["normal"],"tier":1,"canLay":true,"from":572,"baseForm":573,"eggForm":null},{"id":574,"types":["psychic"],"tier":0,"canLay":true,"baseForm":574,"eggForm":null},{"id":575,"types":["psychic"],"tier":1,"canLay":true,"from":574,"baseForm":575,"eggForm":null},{"id":576,"types":["psychic"],"tier":2,"canLay":true,"from":575,"baseForm":576,"eggForm":null},{"id":577,"types":["psychic"],"tier":0,"canLay":true,"baseForm":577,"eggForm":null},{"id":578,"types":["psychic"],"tier":1,"canLay":true,"from":577,"baseForm":578,"eggForm":null},{"id":579,"types":["psychic"],"tier":2,"canLay":true,"from":578,"baseForm":579,"eggForm":null},{"id":580,"types":["water","flying"],"tier":0,"canLay":true,"baseForm":580,"eggForm":null},{"id":581,"types":["water","flying"],"tier":2,"canLay":true,"from":580,"baseForm":581,"eggForm":null},{"id":582,"types":["ice"],"tier":0,"canLay":true,"baseForm":582,"eggForm":null},{"id":583,"types":["ice"],"tier":1,"canLay":true,"from":582,"baseForm":583,"eggForm":null},{"id":584,"types":["ice"],"tier":2,"canLay":true,"from":583,"baseForm":584,"eggForm":null},{"id":585,"types":["normal","grass"],"tier":0,"canLay":true,"baseForm":585,"eggForm":null},{"id":586,"types":["normal","grass"],"tier":1,"canLay":true,"from":585,"baseForm":586,"eggForm":null},{"id":587,"types":["electric","flying"],"tier":0,"canLay":true,"baseForm":587,"eggForm":null},{"id":588,"types":["bug"],"tier":0,"canLay":true,"baseForm":588,"eggForm":null},{"id":589,"types":["bug","steel"],"tier":1,"canLay":true,"from":588,"baseForm":589,"eggForm":null},{"id":590,"types":["grass","poison"],"tier":0,"canLay":true,"baseForm":590,"eggForm":null},{"id":591,"types":["grass","poison"],"tier":1,"canLay":true,"from":590,"baseForm":591,"eggForm":null},{"id":592,"types":["water","ghost"],"tier":0,"canLay":true,"baseForm":592,"eggForm":null},{"id":593,"types":["water","ghost"],"tier":1,"canLay":true,"from":592,"baseForm":593,"eggForm":null},{"id":594,"types":["water"],"tier":1,"canLay":true,"baseForm":594,"eggForm":null},{"id":595,"types":["bug","electric"],"tier":0,"canLay":true,"baseForm":595,"eggForm":null},{"id":596,"types":["bug","electric"],"tier":1,"canLay":true,"from":595,"baseForm":596,"eggForm":null},{"id":597,"types":["grass","steel"],"tier":0,"canLay":true,"baseForm":597,"eggForm":null},{"id":598,"types":["grass","steel"],"tier":1,"canLay":true,"from":597,"baseForm":598,"eggForm":null},{"id":599,"types":["steel"],"tier":0,"canLay":true,"baseForm":599,"eggForm":null},{"id":600,"types":["steel"],"tier":1,"canLay":true,"from":599,"baseForm":600,"eggForm":null},{"id":601,"types":["steel"],"tier":2,"canLay":true,"from":600,"baseForm":601,"eggForm":null},{"id":602,"types":["electric"],"tier":0,"canLay":true,"baseForm":602,"eggForm":null},{"id":603,"types":["electric"],"tier":1,"canLay":true,"from":602,"baseForm":603,"eggForm":null},{"id":604,"types":["electric"],"tier":2,"canLay":true,"from":603,"baseForm":604,"eggForm":null},{"id":605,"types":["psychic"],"tier":0,"canLay":true,"baseForm":605,"eggForm":null},{"id":606,"types":["psychic"],"tier":1,"canLay":true,"from":605,"baseForm":606,"eggForm":null},{"id":607,"types":["ghost","fire"],"tier":0,"canLay":true,"baseForm":607,"eggForm":null},{"id":608,"types":["ghost","fire"],"tier":1,"canLay":true,"from":607,"baseForm":608,"eggForm":null},{"id":609,"types":["ghost","fire"],"tier":2,"canLay":true,"from":608,"baseForm":609,"eggForm":null},{"id":610,"types":["dragon"],"tier":1,"canLay":true,"baseForm":610,"eggForm":null},{"id":611,"types":["dragon"],"tier":1,"canLay":true,"from":610,"baseForm":611,"eggForm":null},{"id":612,"types":["dragon"],"tier":2,"canLay":true,"from":611,"baseForm":612,"eggForm":null},{"id":613,"types":["ice"],"tier":1,"canLay":true,"baseForm":613,"eggForm":null},{"id":614,"types":["ice"],"tier":2,"canLay":true,"from":613,"baseForm":614,"eggForm":null},{"id":615,"types":["ice"],"tier":2,"canLay":true,"baseForm":615,"eggForm":null},{"id":616,"types":["bug"],"tier":0,"canLay":true,"baseForm":616,"eggForm":null},{"id":617,"types":["bug"],"tier":1,"canLay":true,"from":616,"baseForm":617,"eggForm":null},{"id":618,"types":["ground","electric"],"tier":1,"canLay":true,"baseForm":618,"eggForm":null},{"id":619,"types":["fighting"],"tier":0,"canLay":true,"baseForm":619,"eggForm":null},{"id":620,"types":["fighting"],"tier":2,"canLay":true,"from":619,"baseForm":620,"eggForm":null},{"id":621,"types":["dragon"],"tier":2,"canLay":true,"baseForm":621,"eggForm":null},{"id":622,"types":["ground","ghost"],"tier":0,"canLay":true,"baseForm":622,"eggForm":null},{"id":623,"types":["ground","ghost"],"tier":1,"canLay":true,"from":622,"baseForm":623,"eggForm":null},{"id":624,"types":["dark","steel"],"tier":1,"canLay":true,"baseForm":624,"eggForm":null},{"id":625,"types":["dark","steel"],"tier":2,"canLay":true,"from":624,"baseForm":625,"eggForm":null},{"id":626,"types":["normal"],"tier":2,"canLay":true,"baseForm":626,"eggForm":null},{"id":627,"types":["normal","flying"],"tier":0,"canLay":true,"baseForm":627,"eggForm":null},{"id":628,"types":["normal","flying"],"tier":2,"canLay":true,"from":627,"baseForm":628,"eggForm":null},{"id":629,"types":["dark","flying"],"tier":0,"canLay":true,"baseForm":629,"eggForm":null},{"id":630,"types":["dark","flying"],"tier":2,"canLay":true,"from":629,"baseForm":630,"eggForm":null},{"id":631,"types":["fire"],"tier":1,"canLay":true,"baseForm":631,"eggForm":null},{"id":632,"types":["bug","steel"],"tier":1,"canLay":true,"baseForm":632,"eggForm":null},{"id":633,"types":["dark","dragon"],"tier":2,"canLay":true,"baseForm":633,"eggForm":null},{"id":634,"types":["dark","dragon"],"tier":2,"canLay":true,"from":633,"baseForm":634,"eggForm":null},{"id":635,"types":["dark","dragon"],"tier":2,"canLay":true,"from":634,"baseForm":635,"eggForm":null},{"id":636,"types":["bug","fire"],"tier":2,"canLay":true,"baseForm":636,"eggForm":null},{"id":637,"types":["bug","fire"],"tier":2,"canLay":true,"from":636,"baseForm":637,"eggForm":null},{"id":638,"types":["steel","fighting"],"tier":3,"canLay":false,"baseForm":638,"eggForm":null},{"id":639,"types":["rock","fighting"],"tier":3,"canLay":false,"baseForm":639,"eggForm":null},{"id":640,"types":["grass","fighting"],"tier":3,"canLay":false,"baseForm":640,"eggForm":null},{"id":641,"types":["flying"],"tier":3,"canLay":false,"baseForm":641,"eggForm":null},{"id":642,"types":["electric","flying"],"tier":3,"canLay":false,"baseForm":642,"eggForm":null},{"id":643,"types":["dragon","fire"],"tier":3,"canLay":false,"baseForm":643,"eggForm":null},{"id":644,"types":["dragon","electric"],"tier":3,"canLay":false,"baseForm":644,"eggForm":null},{"id":645,"types":["ground","flying"],"tier":3,"canLay":false,"baseForm":645,"eggForm":null},{"id":646,"types":["dragon","ice"],"tier":3,"canLay":false,"baseForm":646,"eggForm":null},{"id":647,"types":["water","fighting"],"tier":3,"canLay":false,"baseForm":647,"eggForm":null},{"id":648,"types":["normal","psychic"],"tier":3,"canLay":false,"baseForm":648,"eggForm":null},{"id":649,"types":["bug","steel"],"tier":3,"canLay":false,"baseForm":649,"eggForm":null},{"id":20101,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20101,"eggForm":null},{"id":20102,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20102,"eggForm":null},{"id":20103,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20103,"eggForm":null},{"id":20104,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20104,"eggForm":null},{"id":20105,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20105,"eggForm":null},{"id":20106,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20106,"eggForm":null},{"id":20107,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20107,"eggForm":null},{"id":20108,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20108,"eggForm":null},{"id":20109,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20109,"eggForm":null},{"id":20110,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20110,"eggForm":null},{"id":20111,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20111,"eggForm":null},{"id":20112,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20112,"eggForm":null},{"id":20113,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20113,"eggForm":null},{"id":20114,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20114,"eggForm":null},{"id":20115,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20115,"eggForm":null},{"id":20116,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20116,"eggForm":null},{"id":20117,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20117,"eggForm":null},{"id":20118,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20118,"eggForm":null},{"id":20119,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20119,"eggForm":null},{"id":20120,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20120,"eggForm":null},{"id":20121,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20121,"eggForm":null},{"id":20122,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20122,"eggForm":null},{"id":20123,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20123,"eggForm":null},{"id":20124,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20124,"eggForm":null},{"id":20125,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20125,"eggForm":null},{"id":20126,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20126,"eggForm":null},{"id":20127,"num":201,"types":["psychic"],"tier":0,"canLay":true,"baseForm":20127,"eggForm":null},{"id":90025,"num":25,"types":["electric"],"tier":4,"canLay":false,"baseForm":90025,"eggForm":null},{"id":35101,"num":351,"types":["fire"],"tier":2,"canLay":true,"baseForm":351,"eggForm":null},{"id":35102,"num":351,"types":["water"],"tier":2,"canLay":true,"baseForm":351,"eggForm":null},{"id":35103,"num":351,"types":["ice"],"tier":2,"canLay":true,"baseForm":351,"eggForm":null},{"id":38601,"num":386,"types":["psychic"],"tier":3,"canLay":false,"baseForm":386,"eggForm":null},{"id":38602,"num":386,"types":["psychic"],"tier":3,"canLay":false,"baseForm":386,"eggForm":null},{"id":38603,"num":386,"types":["psychic"],"tier":3,"canLay":false,"baseForm":386,"eggForm":null},{"id":41201,"num":412,"types":["bug"],"tier":1,"canLay":true,"baseForm":412,"eggForm":41201},{"id":41202,"num":412,"types":["bug"],"tier":1,"canLay":true,"baseForm":412,"eggForm":41202},{"id":41301,"num":413,"types":["bug","ground"],"tier":2,"canLay":true,"from":41201,"baseForm":413,"eggForm":41201},{"id":41302,"num":413,"types":["bug","steel"],"tier":2,"canLay":true,"from":41202,"baseForm":413,"eggForm":41202},{"id":42201,"num":422,"types":["water"],"tier":0,"canLay":true,"baseForm":422,"eggForm":null},{"id":42301,"num":423,"types":["water","ground"],"tier":1,"canLay":true,"from":42201,"baseForm":423,"eggForm":null},{"id":47901,"num":479,"types":["electric","fire"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":47902,"num":479,"types":["electric","water"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":47903,"num":479,"types":["electric","ice"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":47904,"num":479,"types":["electric","flying"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":47905,"num":479,"types":["electric","grass"],"tier":2,"canLay":false,"baseForm":479,"eggForm":null},{"id":48701,"num":487,"types":["ghost","dragon"],"tier":3,"canLay":false,"baseForm":487,"eggForm":null},{"id":49201,"num":492,"types":["grass","flying"],"tier":3,"canLay":false,"baseForm":492,"eggForm":null},{"id":49301,"num":493,"types":["fire"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49302,"num":493,"types":["water"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49303,"num":493,"types":["grass"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49304,"num":493,"types":["electric"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49305,"num":493,"types":["ice"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49306,"num":493,"types":["fighting"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49307,"num":493,"types":["poison"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49308,"num":493,"types":["ground"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49309,"num":493,"types":["flying"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49310,"num":493,"types":["psychic"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49311,"num":493,"types":["bug"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49312,"num":493,"types":["rock"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49313,"num":493,"types":["ghost"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49314,"num":493,"types":["dragon"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49315,"num":493,"types":["dark"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":49316,"num":493,"types":["steel"],"tier":3,"canLay":false,"baseForm":493,"eggForm":null},{"id":64601,"num":646,"types":["dragon","ice"],"tier":3,"canLay":false,"baseForm":646,"eggForm":null},{"id":64602,"num":646,"types":["dragon","ice"],"tier":3,"canLay":false,"baseForm":646,"eggForm":null},{"id":64101,"num":641,"types":["flying"],"tier":3,"canLay":false,"baseForm":641,"eggForm":null},{"id":64201,"num":642,"types":["electric","flying"],"tier":3,"canLay":false,"baseForm":642,"eggForm":null},{"id":64501,"num":645,"types":["ground","flying"],"tier":3,"canLay":false,"baseForm":645,"eggForm":null},{"id":64801,"num":648,"types":["normal","fighting"],"tier":3,"canLay":false,"baseForm":648,"eggForm":null},{"id":64901,"num":649,"types":["bug","steel"],"tier":3,"canLay":false,"baseForm":649,"eggForm":null},{"id":64902,"num":649,"types":["bug","steel"],"tier":3,"canLay":false,"baseForm":649,"eggForm":null},{"id":64903,"num":649,"types":["bug","steel"],"tier":3,"canLay":false,"baseForm":649,"eggForm":null},{"id":64904,"num":649,"types":["bug","steel"],"tier":3,"canLay":false,"baseForm":649,"eggForm":null}],"plateForms":[49301,49302,49303,49304,49305,49306,49307,49308,49309,49310,49311,49312,49313,49314,49315,49316],"underground":{"OPEN_BADGE":"Forêt","TEAM":3,"PER_DAY":8,"PER_BOUGHT":[1,1,2],"SLOTS":1,"SLOT_BUY":[150,500,1000],"LV0":30,"STEP":0.7,"OVER":0.007,"FLOORS":300,"CAMP":0.17,"GUARD_EVERY":10,"GUARD_MULT":2,"GUARD_POOL":10,"STEP_MS":2800,"FLOOR_EXTRA":0.83,"WALL_MS":45000,"WALL_SLOW":[1.8,1.8,1.2,1],"START_FLOORS":[25,50,75,100],"SCENE":"sinnoh-souterrains-sinnoh","PLACE":"Souterrains","THEMES":[{"key":"flooded","name":"Inondés","types":["water","grass","electric"]},{"key":"volcanic","name":"Volcaniques","types":["fire","rock","ground"]},{"key":"crystal","name":"Cristaux","types":["ice","psychic","steel"]},{"key":"dark","name":"Obscurs","types":["ghost","dark","poison"]},{"key":"ancient","name":"Anciens","types":["dragon","fighting"]},{"key":"galleries","name":"Galeries","types":["normal","bug","flying"]}],"LOOT":{"BANDS":[1,25,50,75,100,150],"MONEY":[150,300,450,600,800,1000],"FIGHT":[100,150,200,250,300,350],"SHARDS":[1,1,1,1,2,2],"GUARD_SHARDS":[1,1,1,1,2,3],"GUARD_MULT":3,"WALL_ROLLS":2,"GUARD_ROLLS":2,"PLATE_THEME":4,"ITEMS":[{"id":"money","kind":"money","w":[800,770,735,715,665,630]},{"id":"shards","kind":"shards","w":[20,20,20,20,20,20]},{"id":"rare-candy","kind":"item","guard":true,"w":[2,2,6,6,12,12]},{"id":"exp-candy-s","kind":"item","guard":true,"w":[30,15,5,0,0,0]},{"id":"exp-candy-m","kind":"item","guard":true,"w":[0,15,15,10,5,0]},{"id":"exp-candy-xl","kind":"item","guard":true,"w":[0,0,10,15,15,15]},{"id":"exp-candy-big","kind":"item","guard":true,"w":[0,0,0,0,10,15]},{"id":"stone","kind":"item","of":["fire-stone","water-stone","thunder-stone","leaf-stone","moon-stone"],"guard":true,"w":[3,3,1.5,1.5,0.5,0.5]},{"id":"stone2","kind":"item","of":["sun-stone","shiny-stone","dusk-stone","dawn-stone","ice-stone"],"guard":true,"w":[0,2,2,2,0.7,0.7]},{"id":"evo-item","kind":"item","of":["kings-rock","metal-coat","dragon-scale","prism-scale","deep-sea-tooth","deep-sea-scale"],"guard":true,"w":[0,0,0.25,0.75,1,1]},{"id":"evo-item-sinnoh","kind":"item","of":["oval-stone","protector","electirizer","magmarizer","reaper-cloth","razor-claw","razor-fang"],"guard":true,"w":[0,0.3,1.4,2.6,3,3]},{"id":"berry","kind":"item","of":["razz-berry","pinap-berry","lansat-berry"],"guard":true,"w":[8,8,8,4,4,2]},{"id":"berry2","kind":"item","of":["golden-razz-berry","nanab-berry","enigma-berry"],"guard":true,"w":[0,0,5,5,10,10]},{"id":"starf-berry","kind":"item","guard":true,"w":[0,0,0,0.5,2,3]},{"id":"geode0","kind":"geode","tier":0,"guard":true,"w":[3.2,2.8,2,2,1,1]},{"id":"geode1","kind":"geode","tier":1,"guard":true,"w":[0.6,2,2.8,3.2,2.8,2.8]},{"id":"geode2","kind":"geode","tier":2,"guard":true,"w":[0,0,1,1.6,2.8,3.4]},{"id":"geode3","kind":"geode","tier":3,"guard":true,"w":[0,0,0,0,0.9,2.4]},{"id":"fossil","kind":"fossil","guard":true,"w":[0,0,0,2,3,4]},{"id":"plate","kind":"plate","guard":true,"w":[0,0.15,0.6,0.6,1.2,1.2]}],"GEODES":["Géode commune","Géode peu commune","Géode rare","Géode légendaire"],"PLATES":{"fire":"Plaque Flamme","water":"Plaque Hydro","grass":"Plaque Herbe","electric":"Plaque Volt","ice":"Plaque Glace","fighting":"Plaque Poing","poison":"Plaque Toxique","ground":"Plaque Terre","flying":"Plaque Ciel","psychic":"Plaque Esprit","bug":"Plaque Insecte","rock":"Plaque Roc","ghost":"Plaque Fantôme","dragon":"Plaque Draco","dark":"Plaque Ombre","steel":"Plaque Fer"},"FOSSILS":{"kanto":[[138,30],[140,30],[142,30]],"hoenn":[[345,38],[347,38]],"sinnoh":[[408,15],[410,15]],"unova":[[564,25],[566,25]]},"FOSSIL_AFTER":["unova"]},"GEODE_UP":[0.1,0.06,0.03],"GEM_SHARDS":[1,2,5,15],"GEM_PRICE":[100,170,340,1000],"OFFER":8,"OFFER_HOURS":3,"REROLL":5000,"RANK_MAX":5,"RANK_STAT":1.15,"RANK_XP":1.5,"MILESTONES":[{"floor":100,"geode":3,"look":"roark"},{"floor":150,"frame":"vein"},{"floor":200,"geode":3,"look":"byron"}]},"evolutionItems":{"thunder-stone":["kanto","sinnoh","unova"],"moon-stone":["kanto","hoenn","unova"],"fire-stone":["kanto","unova"],"soothe-bell":["johto","kanto","hoenn","sinnoh","unova"],"leaf-stone":["kanto","sinnoh","hoenn","unova"],"sun-stone":["johto","unova"],"water-stone":["kanto","hoenn","unova"],"kings-rock":["johto"],"link-cable":["kanto","unova"],"metal-coat":["johto"],"protector":["sinnoh"],"dragon-scale":["johto"],"electirizer":["sinnoh"],"magmarizer":["sinnoh"],"ice-stone":["sinnoh"],"shiny-stone":["sinnoh","unova"],"dusk-stone":["sinnoh","unova"],"razor-fang":["sinnoh"],"razor-claw":["sinnoh"],"dawn-stone":["sinnoh"],"shed-shell":["hoenn"],"prism-scale":["hoenn"],"reaper-cloth":["sinnoh"],"deep-sea-tooth":["hoenn"],"deep-sea-scale":["hoenn"],"oval-stone":["kanto"]}};
  if(typeof module!=='undefined' && module.exports)module.exports=root.PCG_UNDER_DATA;
})(typeof window!=='undefined'?window:globalThis);

}
if(!window.PCG_UNDERGROUND){
/* Poke'Catch 助手 v1.20.0 —— 晶洞 / 探险 / 化石闪光预测。
 * 本计算模块只读；显式启用的召回由独立 MAIN bridge 调游戏原接口。
 * 固定随机数与宝石池顺序对齐 app.c0081498f2.js。
 * 数据表随版本固定；游戏换版会标为「待复核」，不宣称预测已验证。
 */
(function (root) {
  'use strict';
  var DATA = root.PCG_UNDER_DATA;
  if (!DATA) return;
  var K = DATA.underground, SPECIES = {};
  DATA.species.forEach(function (m) { SPECIES[m.id] = m; });
  var TYPES = {normal:'一般',fire:'火',water:'水',electric:'电',grass:'草',ice:'冰',
    fighting:'格斗',poison:'毒',ground:'地面',flying:'飞行',psychic:'超能力',
    bug:'虫',rock:'岩石',ghost:'幽灵',dragon:'龙',dark:'恶',steel:'钢',fairy:'妖精'};
  var TIERS = ['普通', '较少见', '稀有', '传说'];
  function arr(a) { return Array.isArray(a) ? a : []; }
  function number(n, fallback) { return typeof n === 'number' && isFinite(n) ? n : fallback; }
  function own(o, k) { return Object.prototype.hasOwnProperty.call(o || {}, k); }
  function ownedMons(s) {
    return arr(s.mons).concat(arr(s.pension && s.pension.mons).map(function (m) { return m && m.mon; }),
      arr(s.under && s.under.slots).reduce(function (all, slot) { return all.concat(arr(slot && slot.mons)); }, []))
      .filter(Boolean);
  }
  function regionOpen(s, r) { return r.open || arr(s.travel && s.travel.to).indexOf(r.key) >= 0; }
  function regionUnlocked(s, r) {
    return r && regionOpen(s, r) && number(s.adv && s.adv.unlocked, 0) >= r.first;
  }
  function regionDone(s, r) {
    return r.doneAfter != null && (number(s.adv && s.adv.unlocked, 0) > r.doneAfter ||
      !!r.championBadge && arr(s.adv && s.adv.badges).indexOf(r.championBadge) >= 0);
  }
  function gemKinds(s) {
    var regions = DATA.regions.filter(function (r) { return regionDone(s, r); });
    if (!regions.length) regions = DATA.regions.filter(function (r) { return regionUnlocked(s, r); });
    var ids = [], seen = {}, pools = [[], [], [], []];
    regions.forEach(function (r) {
      var idsInRegion=r.ids || Array.from({length:r.dex[1]-r.dex[0]+1},function(_,i){return r.dex[0]+i;});
      idsInRegion.forEach(function(id){if (SPECIES[id] && !seen[id]) {
        seen[id] = true; ids.push(id);
      }});
    });
    // Array order is significant: preserve the game's regional Pokédex iteration.
    ids.forEach(function (id) { var m = SPECIES[id]; if (m.tier >= 0 && m.tier <= 3) pools[m.tier].push(id); });
    ownedMons(s).forEach(function (m) {
      if (DATA.plateForms.indexOf(m.id) >= 0 && !seen[m.id]) { seen[m.id] = true; pools[3].push(m.id); }
    });
    return pools.map(function (pool) {
      var keys = [], have = {};
      pool.forEach(function (id) {
        var m = SPECIES[id];
        m.types.forEach(function (type) {
          var key = type + ':' + Math.max(0, Math.min(3, m.tier));
          if (!have[key]) { have[key] = true; keys.push(key); }
        });
      });
      return keys;
    });
  }
  function hash(text) {
    var i = 1779033703 ^ (24348 << 16 | 41597);
    var k = 3144134277 ^ (15337 << 16 | 49222);
    for (var p = 0; p < text.length; p++) {
      var ch = text.charCodeAt(p);
      i = Math.imul(i ^ ch, 2654435761); k = Math.imul(k ^ ch, 1597334677);
    }
    i = Math.imul(i ^ i >>> 16, 2246822507) ^ Math.imul(k ^ k >>> 13, 3266489909);
    k = Math.imul(k ^ k >>> 16, 2246822507) ^ Math.imul(i ^ i >>> 13, 3266489909);
    return (4294967296 * (2097151 & k) + (i >>> 0)) / 9007199254740992;
  }
  function fixedRoll(s, context, index, sub) {
    var trainer = s.trainer || {};
    return hash(String(trainer.since == null ? '' : trainer.since) + ':' +
      String(trainer.id == null ? '' : trainer.id) + '|' + context + '|' + index + '|' + (sub || 0));
  }
  function accountKey(s) {
    var t = s && s.trainer;
    return t && t.since != null && t.id != null ? String(hash(String(t.since)+':'+String(t.id))) : '';
  }
  function fossilRate(s, reg, rates) {
    if (rates && typeof rates[reg] === 'number' && rates[reg] >= 0 && rates[reg] <= 1) return rates[reg];
    reg = reg === 'kanto2' ? 'johto' : reg;
    var region = DATA.regions.find(function (r) { return r.key === reg; }) || DATA.regions[0];
    var complete = true;
    var regionIds=region.ids || Array.from({length:region.dex[1]-region.dex[0]+1},function(_,i){return region.dex[0]+i;});
    for (var i=0;i<regionIds.length;i++) if (!(s.dex || {})[regionIds[i]]) { complete = false; break; }
    return (complete ? 2 : 1) / 2048; // v1.29: 官方基础闪率 1/2048（旧 1/4096 已过时）；完成图鉴 ×2 = 1/1024
  }
  var FOSSIL_CACHE = new Map();
  function fossilForecast(s, slot, checked, rates) {
    if (!accountKey(s)) return {ready:false, why:'未读到训练师标识', items:[], hits:[]};
    var items = [];
    checked.loot.forEach(function (drops, floorIndex) { drops.forEach(function (e) {
      if (e.k === 'fossil') items.push({index:items.length, id:e.id, lv:e.lv, reg:e.reg,
        dropFloor:floorIndex+1, rate:fossilRate(s,e.reg,rates)});
    }); });
    var context = 'fossil:' + (slot.id == null ? slot.start : slot.id);
    var key = JSON.stringify([accountKey(s),context,checked.floors,items]);
    if (FOSSIL_CACHE.has(key)) return FOSSIL_CACHE.get(key);
    var hits = [], byFloor = {};
    items = items.map(function (f) {
      var result = Object.assign({},f,{shinyFloors:[]});
      for (var floor = f.dropFloor; floor <= checked.floors; floor++) {
        if (fixedRoll(s,context,floor,f.index) < f.rate) {
          result.shinyFloors.push(floor);
          if (!byFloor[floor]) { byFloor[floor] = {floor:floor, fossils:[]}; hits.push(byFloor[floor]); }
          byFloor[floor].fossils.push(f.index);
        }
      }
      return result;
    });
    hits.sort(function (a,b) { return a.floor-b.floor; });
    var out = {ready:true, items:items, hits:hits};
    if (FOSSIL_CACHE.size >= 16) FOSSIL_CACHE.delete(FOSSIL_CACHE.keys().next().value);
    FOSSIL_CACHE.set(key,out);
    return out;
  }
  function fossilSignature(s, slot, floor, rates) {
    var checked = sanitizeRun(s,slot), fossils = fossilForecast(s,slot,checked,rates);
    return JSON.stringify([accountKey(s),slot.id,slot.start,slot.bay,floor,
      fossils.items.filter(function (f) { return f.dropFloor <= floor; }).map(function (f) {
        return [f.index,f.id,f.lv,f.reg,f.dropFloor,f.rate,f.shinyFloors.indexOf(floor)>=0];
      })]);
  }
  function gemName(key) {
    var parts = String(key).split(':');
    return (TIERS[+parts[1]] || '') + '·' + (TYPES[parts[0]] || parts[0]) + '宝石';
  }
  function predictOne(s, tier, index, pools) {
    var to = tier;
    while (to < 3 && fixedRoll(s, 'geode' + tier, index, to) < K.GEODE_UP[to]) to++;
    var poolTier = to;
    while (poolTier > 0 && !pools[poolTier].length) poolTier--;
    if (!pools[poolTier].length) return null; // Game does not consume or advance the counter.
    var key = pools[poolTier][Math.floor(fixedRoll(s, 'geode' + tier, index, 9) * pools[poolTier].length)];
    return {index: index, from: tier, to: to, poolTier: poolTier, key: key, name: gemName(key),
      isNew: !((s.under && s.under.gems || {})[key])};
  }
  function predictGeodes(s, horizon) {
    var trainer = s.trainer;
    if (!trainer || trainer.id == null || trainer.since == null) return {ready:false, why:'尚未读到训练师标识'};
    horizon = Math.max(1, Math.min(200, Math.floor(number(horizon, 48))));
    var pools = gemKinds(s), under = s.under || {}, results = [];
    for (var tier = 0; tier < 4; tier++) {
      var opened = under.opened && under.opened[tier];
      if (opened == null) opened = 0;
      var inventory = number(under.geodes && under.geodes[tier], 0);
      if (!Number.isSafeInteger(opened) || opened < 0 || !Number.isSafeInteger(opened + horizon)) {
        results.push({tier:tier, inventory:inventory, ready:false, why:'开启计数异常，未进行预测', rows:[]}); continue;
      }
      var rows = [], simulatedGems = Object.assign({}, under.gems || {}), nextUpgrade = null;
      for (var offset = 0; offset < horizon; offset++) {
        var row = predictOne(s, tier, opened + offset, pools);
        if (!row) break;
        row.offset = offset + 1; row.inStock = offset < inventory;
        row.isNew = !simulatedGems[row.key]; simulatedGems[row.key] = (simulatedGems[row.key] || 0) + 1;
        if (row.to > tier && nextUpgrade == null) nextUpgrade = row.offset;
        rows.push(row);
      }
      results.push({tier:tier, opened:opened, inventory:inventory, ready:!!rows.length,
        why:rows.length ? '' : '当前可用宝石池为空，游戏也不会消耗晶洞', rows:rows, nextUpgrade:nextUpgrade});
    }
    return {ready:true, horizon:horizon, pools:pools, tiers:results,
      poolSignature:JSON.stringify(pools), source:DATA.source};
  }
  function band(floor) {
    var n = 0; K.LOOT.BANDS.forEach(function (f, i) { if (floor >= f) n = i; }); return n;
  }
  function itemAllowed(s, id) {
    if (!id) return false;
    if (/-stone$/.test(id) && !/^(fire|water|thunder|leaf|moon)-/.test(id)) {
      return regionUnlocked(s, DATA.regions.find(function (r) { return r.key === (id === 'sun-stone' ? 'johto' : 'sinnoh'); }));
    }
    var targets = (DATA.evolutionItems || {})[id];
    return !targets || !targets.length || targets.some(function (key) {
      return regionUnlocked(s, DATA.regions.find(function (r) { return r.key === key; }));
    });
  }
  // Match collection's structural and per-floor drop limits. Plate availability is
  // explicitly provisional: the live World Boss state may change before collection.
  function sanitizeRun(s, slot) {
    var res = slot.res || {}, from = Math.max(1, Math.floor(number(slot.from, 1))), times = arr(res.at);
    var floors = Math.max(0, Math.min(Math.floor(number(res.floors, 0)), K.FLOORS, times.length));
    var minStep = Math.floor(K.FLOOR_EXTRA + K.WALL_MS * Math.min.apply(Math, K.WALL_SLOW) / K.STEP_MS);
    for (var f = from; f <= floors; f++) {
      if (!(times[f-1] - (f > from ? times[f-2] : 0) >= minStep)) { floors = f-1; break; }
    }
    var items = {};
    K.LOOT.ITEMS.filter(function (r) { return r.kind === 'item'; }).forEach(function (r) {
      (r.of || [r.id]).forEach(function (id) { if (itemAllowed(s, id)) items[id] = true; });
    });
    var fossils = [];
    Object.keys(K.LOOT.FOSSILS).forEach(function (key) {
      if (!regionUnlocked(s, DATA.regions.find(function (r) { return r.key === key; }))) return;
      K.LOOT.FOSSILS[key].forEach(function (m) {
        if((K.LOOT.FOSSIL_AFTER || []).indexOf(key)>=0){
          var known=DATA.species.some(function(mon){
            if(!(s.dex || {})[mon.id])return false;
            var id=mon.baseForm || mon.id,seen={};
            while(SPECIES[id] && !seen[id]){if(id===m[0])return true;seen[id]=true;id=SPECIES[id].from;}
            return false;
          });
          if(!known)return;
        }
        fossils.push(m[0] + ':' + m[1] + ':' + key);
      });
    });
    var removed = 0;
    var loot = arr(res.loot).slice(0, floors).map(function (entries, i) {
      var floor = i+1, b = band(floor), guardFloor = K.GUARD_EVERY && floor % K.GUARD_EVERY === 0;
      if (floor < from || !Array.isArray(entries)) return [];
      var normalBase = false, guardBase = false, normalRolls = 0, guardRolls = 0;
      return entries.filter(function (e) {
        if (!e || typeof e !== 'object') { removed++; return false; }
        var guard = !!e.guard;
        if (guard && !guardFloor) { removed++; return false; }
        if (!guard && !normalBase && e.k === 'money' && e.n === K.LOOT.FIGHT[b]) { normalBase = true; return true; }
        if (guard && !guardBase && e.k === 'shards' && e.n === K.LOOT.GUARD_SHARDS[b]) { guardBase = true; return true; }
        if (guard ? guardRolls >= K.LOOT.GUARD_ROLLS : normalRolls >= K.LOOT.WALL_ROLLS) { removed++; return false; }
        var mult = guard ? K.LOOT.GUARD_MULT : 1;
        var ok = e.k === 'money' ? e.n === K.LOOT.MONEY[b]*mult :
          e.k === 'shards' ? e.n === K.LOOT.SHARDS[b]*mult :
          e.k === 'item' ? !!items[e.id] :
          e.k === 'geode' ? Number.isInteger(e.t) && e.t >= 0 && e.t <= 3 :
          e.k === 'plate' ? own(K.LOOT.PLATES, e.type) && Number.isInteger(e.t) && e.t >= 0 && e.t <= 3 :
          e.k === 'fossil' && fossils.indexOf(e.id+':'+e.lv+':'+e.reg) >= 0;
        if (ok) { if (guard) guardRolls++; else normalRolls++; } else removed++;
        return ok;
      }).map(function (e) { return Object.assign({}, e); });
    });
    return {floors:floors, loot:loot, removed:removed, from:from};
  }
  function aggregate(s, loot, through) {
    var sum = {money:0, shards:0, items:{}, geodes:[0,0,0,0], plates:[], fossils:[], converted:0};
    var plates = Object.assign({}, s.under && s.under.plates || {}), owned = ownedMons(s);
    arr(loot).slice(0, through).forEach(function (entries) { arr(entries).forEach(function (e) {
      if (e.k === 'money') sum.money += e.n;
      else if (e.k === 'shards') sum.shards += e.n;
      else if (e.k === 'item') sum.items[e.id] = (sum.items[e.id] || 0)+1;
      else if (e.k === 'geode') sum.geodes[e.t]++;
      else if (e.k === 'fossil') sum.fossils.push({id:e.id, lv:e.lv, reg:e.reg});
      else if (e.k === 'plate') {
        var ownsForm = owned.some(function (m) {
          return DATA.plateForms.indexOf(m.id) >= 0 && SPECIES[m.id].types[0] === e.type;
        });
        if (plates[e.type] || ownsForm) { sum.geodes[e.t]++; sum.converted++; }
        else { plates[e.type] = 1; sum.plates.push(e.type); }
      }
    }); });
    return sum;
  }
  function expedition(s, slot, now, rates) {
    if (!slot || typeof slot !== 'object' || !slot.res || !Array.isArray(slot.res.at) ||
        !Array.isArray(slot.res.loot) || !isFinite(slot.start) || !isFinite(slot.end)) {
      return {id:String(slot && slot.id || ''), bay:number(slot && slot.bay, 0), ready:false, why:'本次探险记录不完整，无法预览'};
    }
    var checked = sanitizeRun(s, slot), res = slot.res, at = slot.recalled == null ? now : slot.recalled;
    var elapsed = (at-slot.start)/K.STEP_MS, current = 0;
    for (; current < res.at.length && res.at[current] <= elapsed; current++) { /* exact progress rule */ }
    var done = at >= slot.end || slot.recalled != null;
    if (done && slot.recalled == null) current = res.floors;
    current = Math.max(0, Math.min(current, checked.floors));
    var rows = [];
    for (var i = checked.from-1; i < checked.floors; i++) rows.push({
      floor:i+1, at:slot.start + res.at[i]*K.STEP_MS,
      loot:checked.loot[i] || [], foe:res.foes && res.foes[i], guard:res.gfoes && res.gfoes[i+1] || null
    });
    var milestones = K.MILESTONES.filter(function (m) {
      return current >= m.floor && !(s.under && s.under.miles || {})[m.floor];
    });
    var finalMilestones = K.MILESTONES.filter(function (m) {
      return checked.floors >= m.floor && !(s.under && s.under.miles || {})[m.floor];
    });
    var team = arr(slot.mons).map(function (m) {
      return {id:m.id, uid:m.uid, shiny:!!m.shiny,
        xp:current && res.xp && res.xp[m.uid] ? res.xp[m.uid][current-1] || 0 : 0,
        finalXp:checked.floors && res.xp && res.xp[m.uid] ? res.xp[m.uid][checked.floors-1] || 0 : 0};
    });
    return {ready:true, id:String(slot.id || slot.start), bay:number(slot.bay,0), theme:slot.theme,
      start:slot.start, end:slot.end, from:checked.from, current:current, finalFloor:checked.floors,
      done:done, recalled:slot.recalled != null, lost:res.lost || null, rows:rows, team:team,
      completed:aggregate(s, checked.loot, current), total:aggregate(s, checked.loot, checked.floors),
      milestones:milestones, finalMilestones:finalMilestones,
      fossilForecast:fossilForecast(s,slot,checked,rates),
      filtered:checked.removed, truncated:checked.floors !== res.floors};
  }
  function build(s, now, live) {
    if (!s || typeof s !== 'object') return {ready:false, why:'还没读到游戏存档', now:now};
    var geodes;
    try{geodes=predictGeodes(s,48);}catch(e){geodes={ready:false,why:'晶洞数据校验失败：'+e.message};}
    return {ready:true, now:now, source:DATA.source, checked:DATA.checked,
      geodes:geodes, expeditions:arr(s.under && s.under.slots).slice(0,8).map(function (slot) {
        try{return expedition(s,slot,now,live && live.rates);}catch(e){return {ready:false,id:String(slot && slot.id || ''),bay:number(slot && slot.bay,0),why:'本趟探险数据校验失败：'+e.message};}
      })};
  }
  function currentBundle() {
    try {
      var entries = root.performance && root.performance.getEntriesByType('resource') || [];
      for (var i = entries.length-1; i >= 0; i--) {
        var match = /\/bundle\/(app\.[a-f0-9]+\.js)(?:[?#]|$)/.exec(entries[i].name);
        if (match) return match[1];
      }
      var scripts = root.document && root.document.scripts || [];
      for (var j=scripts.length-1;j>=0;j--) {
        var scriptMatch=/\/bundle\/(app\.[a-f0-9]+\.js)(?:[?#]|$)/.exec(scripts[j].src || '');
        if(scriptMatch)return scriptMatch[1];
      }
    } catch (e) { /* unavailable outside game */ }
    return '';
  }
  function state() {
    var live = root.PCG_UNDER_CONTROL && root.PCG_UNDER_CONTROL.live();
    // Prefer the original Game.S bridge. Preview no longer depends on a stale or
    // wrapped localStorage snapshot, or on the nursery module's polling state.
    if(live && live.ok && live.fresh && live.forecast && live.forecast.ready) {
      var control=Object.assign({},live);delete control.forecast;
      return Object.assign({},live.forecast,{clock:'game',liveSource:live.source,readSource:'game',
        versionStatus:(DATA.verifiedBundles||[DATA.source]).indexOf(live.source)>=0?'matched':live.source?'changed':'unknown',control:control});
    }
    var s = root.PCG_SAVE && root.PCG_SAVE.read(), now = Date.now(), clock = 'local';
    if (live && live.account !== accountKey(s)) live = null;
    if (live && live.ok && live.fresh) { now = live.now; clock = 'game'; }
    // Recompute all summaries at the same recalled timestamp, rather than merely
    // overwriting the displayed floor while leaving XP and loot totals stale.
    if(s && live && live.ok && live.fresh && s.under) {
      s=Object.assign({},s,{under:Object.assign({},s.under,{slots:arr(s.under.slots).map(function(slot){
        var actual=(live.runs || []).find(function(r){return r.id===String(slot.id==null?slot.start:slot.id) && r.start===slot.start;});
        return actual && actual.recalled ? Object.assign({},slot,{recalled:actual.recalledAt}) : slot;
      })})});
    }
    var result = build(s, now, live), source = currentBundle();
    result.clock = clock; result.liveSource = source;
    result.readSource='storage';
    result.versionStatus = !source ? 'unknown' : (DATA.verifiedBundles||[DATA.source]).indexOf(source)>=0 ? 'matched' : 'changed';
    result.control = live || {ok:false, fresh:false, why:'等待实时检测桥；更新扩展后请刷新游戏页', plans:[], runs:[]};
    return result;
  }
  root.PCG_UNDERGROUND = {state:state, build:build, gemKinds:gemKinds, predictGeodes:predictGeodes,
    predictOne:predictOne, fixedRoll:fixedRoll, hash:hash, expedition:expedition,
    sanitizeRun:sanitizeRun, aggregate:aggregate, gemName:gemName, TYPES:TYPES, TIERS:TIERS,
    accountKey:accountKey, fossilRate:fossilRate, fossilForecast:fossilForecast,
    fossilSignature:fossilSignature, currentBundle:currentBundle};
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PCG_UNDERGROUND;
})(typeof window !== 'undefined' ? window : globalThis);

}
if(!window.PCG_UNDER_CONTROL){
/* Isolated world relay. Plans live only in the current game's MAIN world. */
(function(root){
  'use strict';
  var pending=new Map(), cached=null, received=0, seq=0;
  function accept(live){if(live && typeof live==='object'){cached=live;received=Date.now();}}
  root.document.addEventListener('pcg-under-live',function(ev){try{accept(JSON.parse(ev.detail));}catch(e){/* ignore malformed */}});
  root.document.addEventListener('pcg-under-result',function(ev){
    var r;try{r=JSON.parse(ev.detail);}catch(e){return;}
    var p=pending.get(r.rid);if(!p)return;
    pending.delete(r.rid);clearTimeout(p.timer);accept(r.live);p.resolve(r);
  });
  function request(cmd,args){return new Promise(function(resolve){
    if(pending.size>=16){resolve({ok:false,text:'请求过多，请稍后重试'});return;}
    var rid='under-'+Date.now()+'-'+(++seq), req=Object.assign({},args || {},{cmd:cmd,rid:rid});
    var timer=setTimeout(function(){pending.delete(rid);resolve({ok:false,text:'实时接口未响应，请更新扩展并刷新游戏页'});},4000);
    pending.set(rid,{resolve:resolve,timer:timer});
    root.dispatchEvent(new CustomEvent('pcg-cmd',{detail:'underctl:'+JSON.stringify(req)}));
  });}
  root.PCG_UNDER_CONTROL={request:request,live:function(){return cached?Object.assign({},cached,{fresh:Date.now()-received<=3000}):null;}};
})(window);

}


/* Poke'Catch 防掉线助手 —— 内容脚本（隔离世界）
 *
 * 负责：静音保活、反挂机、断线自愈、自动喂食、地下通道、传说追踪、
 *       异色团体战、刷钱、伤害统计、战斗属性提示、收藏，以及把状态交给 popup 显示。
 * 数据边界：只读浏览器本地存档与页面 DOM、模拟点击操作界面；
 *           不修改存档、不拦截或伪造网络请求、不上传任何数据。
 */
(function () {
  'use strict';

  var GAME_HOST_RE = /(^|\.)pokecatch-online\.(netlify\.app|pages\.dev)$/i;
  if (!GAME_HOST_RE.test(location.hostname)) return;
  if (window.__PCG_CONTENT__) return;
  window.__PCG_CONTENT__ = true;

  // 配置唯一来源：defaults.js（版本、默认设置、消息类型、存档键、关键选择器）
  var CFG = window.PCG_CONFIG || null;
  /* 第八十九批：手机浏览器（Kiwi 等）上 chrome.storage.sync 可能不存在，
   * 统一走 defaults.js 给的兼容层（有 sync 用 sync，没有退回 local）。 */
  var SYNC = window.PCG_STORE || (chrome.storage && chrome.storage.sync) ||
    (chrome.storage && chrome.storage.local) ||
    { get: function (d, cb) { if (cb) cb({}); }, set: function (o, cb) { if (cb) cb(); },
      remove: function (k, cb) { if (cb) cb(); } };
  var VERSION = (CFG && CFG.VERSION) || (function () {
    try { return chrome.runtime.getManifest().version; } catch (e) { return '0'; }
  })();
  var MSG = (CFG && CFG.MSG) || {};

  // 默认设置只有一份，来自 defaults.js（background 不再自己写默认值）
  var DEFAULT_SETTINGS = Object.assign({}, (CFG && CFG.DEFAULTS) || {});

  var settings = Object.assign({}, DEFAULT_SETTINGS);

  // 「检查间隔」的默认值搬过两次：60 秒 → 300 秒 → 600 秒（1.9.60 起 10 分钟）。
  // 传进来的必须是**存储里的原始对象**（合并过默认值的对象会让标记永远成立）。
  // ugSecV >= 3 表示玩家自己动过这个数字，之后就不再碰。
  function ugSecMigrate(raw) {
    var v = raw || {};
    if (Number(v.ugSecV) >= 3) return 0;
    var sec = Number(v.ugCheckSec);
    var fixed = (!sec || sec === 60 || sec === 300) ? 600 : 0;
    if (!fixed) {
      v.ugSecV = 3;   // 玩家自己改过的数字：只打标记，不动它
      try { SYNC.set({ ugSecV: 3 }); } catch (e) { /* ignore */ }
    }
    return fixed;
  }

  var S = {
    startedAt: Date.now(),
    hookReady: false,
    wsOpen: 0,
    wsTotal: 0,
    lastCloseAt: 0,
    lastMsgAt: 0,
    lastCloseCode: 0,
    lastCloseClean: true,
    downSince: 0,
    downWhy: '',
    manualAt: 0,
    nextRetryAt: 0,
    reconnectTries: 0,
    reconnects: 0,
    reloads: 0,
    reloadHistory: [],
    lastReloadAt: 0,
    reloadBlocked: false,
    bootFailAt: 0,
    lastBootRetryAt: 0,
    bootRetries: 0,
    noAppSince: 0,
    lastRealInputAt: Date.now(),
    gestureSeen: false,          // 第四十四批：页面被真实点过 / 按过键（决定能不能建音频）
    lastFakeActivityAt: 0,
    connected: false,
    spoofOn: false,
    fbTicks: 0,
    hiddenSecs: 0,
    feedables: [],
    feedCount: 0,
    lastFeedAt: 0,
    feedAt: {},
    feedTry: {},
    feedFail: {},
    feedCooldown: {},
    events: []
  };

  /* 统一日志入口。
   * 现存 50 多处 log('xxx') 保持不变，这里按前缀自动补模块和级别，
   * 交给 logger.js 做去重、持久化和全局异常记录。 */
  function log(msg) {
    var text = String(msg == null ? '' : msg);
    if (!text) return;

    var mod = 'core';
    if (/^地下通道/.test(text)) mod = 'ug';
    else if (/^传说追踪|^开异色连战/.test(text)) mod = 'leg';
    else if (/^团体战|^异色团体战|^开异色/.test(text)) mod = 'raid';
    else if (/^伤害统计|^世界BOSS/.test(text)) mod = 'dmg';
    else if (/^弹窗|^标题页|^游戏提示/.test(text)) mod = 'ui';
    else if (/^自动喂食/.test(text)) mod = 'feed';
    else if (/^联盟刷钱|^刷钱|^自动重刷|^收益/.test(text)) mod = 'farm';
    else if (/^收藏/.test(text)) mod = 'fav';
    else if (/^战斗属性/.test(text)) mod = 'battle';
    else if (/^图鉴捕捉|^图鉴补全|^指定捕捉/.test(text)) mod = 'dex';
    else if (/^培育屋/.test(text)) mod = 'nursery';
    else if (/^黑市扫货|^黑市/.test(text)) mod = 'market';
    else if (/^稀有道具刷取|^道具刷取/.test(text)) mod = 'item';
    else if (/^树果刷取/.test(text)) mod = 'berry';
    else if (/^闪光守卫/.test(text)) mod = 'shiny';
    else if (/^连接|^第 \d+ 次尝试重连|^自动刷新|^10 分钟内|^游戏加载失败/.test(text)) mod = 'conn';

    var level = 'info';
    if (/失败|没生效|出错|没有响应|暂停|打败|已断开|刷不了/.test(text)) level = 'warn';
    else if (/已恢复|已启动|已挂到|战利品到手|补了 1 个|次数刷新了|点了/.test(text)) level = 'ok';

    var logger = window.PCG_LOG;
    if (logger && typeof logger.push === 'function') {
      logger.push(level, mod, text);
      S.events = logger.list().slice(-40);
      return;
    }
    S.events.push({ t: Date.now(), m: text, level: level, mod: mod, n: 1 });
    if (S.events.length > 40) S.events.splice(0, S.events.length - 40);
  }

  // 主循环里原来被静默吞掉的异常，至少留下一条可查的 error
  function logErr(mod, e) {
    var text = (e && e.message) || String(e || '未知错误');
    if (window.PCG_LOG) window.PCG_LOG.push('error', mod, text);
    else log('出错：' + mod + ' ' + text);
  }

  function sendToPage(cmd) {
    var ok = false;
    try {
      window.dispatchEvent(new CustomEvent('pcg-cmd', { detail: String(cmd) }));
      ok = true;
    } catch (e) { /* ignore */ }
    if (!ok) {
      try {
        document.dispatchEvent(new CustomEvent('pcg-cmd', { detail: String(cmd) }));
      } catch (e2) { /* ignore */ }
    }
  }

  /* ---------------- 第十二批：一键「保留重复」 ----------------
   * 隔离世界只转发命令，真正调游戏开关的是 MAIN world 的 keep-dup.js。
   * 这里不读也不写游戏存档，连 localStorage 都不碰。 */
  var KD_PENDING = {};
  var KD_SEQ = 0;
  function kdOnResult(ev) {
    var res = null;
    try { res = JSON.parse(String((ev && ev.detail) || '')); } catch (e) { return; }
    if (!res || !res.rid) return;
    var cb = KD_PENDING[res.rid];
    if (!cb) return;                       // 两个通道都派发时，第二次直接忽略
    delete KD_PENDING[res.rid];
    cb(res);
  }
  document.addEventListener('pcg-keepdup-result', kdOnResult);
  window.addEventListener('pcg-keepdup-result', kdOnResult);

  function keepDupAsk(kind) {
    return new Promise(function (resolve) {
      var rid = String(++KD_SEQ) + '-' + Date.now();
      var timer = setTimeout(function () {
        delete KD_PENDING[rid];
        resolve({ ok: false, text: '游戏页没回应：刷新一次游戏页再点（扩展重载后旧页面要刷新）' });
      }, 4500);
      KD_PENDING[rid] = function (res) {
        clearTimeout(timer);
        resolve(res);
      };
      sendToPage('keepdup:' + kind + ':' + rid);
    });
  }

  /* ---------------- 读取页面脚本上报的状态 ---------------- */
  function readPageState() {
    var raw = null;
    try {
      raw = document.documentElement.getAttribute('data-pcg');
    } catch (e) {
      return null;
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /* ---------------- 静音保活 ----------------
   * 第四十四批：以前是「插件一启动就 new AudioContext()」。可 Chrome / Edge 有
   * 自动播放策略：页面**没被用户点过**之前建 AudioContext 会被拦，控制台就刷
   *   The AudioContext was not allowed to start. It must be resumed (or created)
   *   after a user gesture on the page.
   * 而且拦下来的 ctx 一直挂着 suspended：保活没生效，resume() 的 promise 还会
   * 变成 Uncaught (in promise)。所以改成「先有真实点击，再建 ctx」：
   *   没有手势 → 只挂一个一次性钩子等着，绝不建 ctx；
   *   第一次真实点击 / 按键 → 建 ctx（这时就是 running）；
   *   已经建了但被挂起 → 只在有手势时才 resume，promise 一律 catch。
   */
  /* 只有这几种事件能给页面「用户激活」（mousemove / wheel 不算，判了也建不出音频）
   * —— 既用来等第一次点击，也用来判断「页面被操作过」。 */
  var AUDIO_GESTURES = ['pointerdown', 'mousedown', 'keydown', 'touchstart', 'click'];
  var audioCtx = null;
  var audioOsc = null;
  var audioWant = false;      // 用户开着「静音保活」
  var audioArmed = false;     // 已经挂上「等第一次点击」的钩子
  var audioHook = null;       // 那个一次性钩子，关保活时要摘掉
  var audioSaid = '';         // 同一句状态只写一次，别刷屏

  function audioLog(text) {
    if (audioSaid === text) return;
    audioSaid = text;
    log(text);
  }

  /* 页面有没有被真实操作过（有手势）。navigator.userActivation 老浏览器没有，
   * 这时退回自己记的 trusted 输入事件（下面 INPUT_EVENTS 那段会写 S.gestureSeen）。 */
  function audioGesture() {
    try {
      if (navigator.userActivation && navigator.userActivation.hasBeenActive) return true;
    } catch (e) { /* ignore */ }
    return !!S.gestureSeen;
  }

  function tryResumeAudio() {
    if (!audioCtx) return;
    try {
      if (audioCtx.state !== 'suspended') return;
      // 没有手势就别碰：resume() 只会被拒，再往控制台丢一条自动播放报错
      if (!audioGesture()) return;
      var p = audioCtx.resume();
      if (p && typeof p.catch === 'function') p.catch(function () { /* 这次没算数，下次再试 */ });
    } catch (e) { /* ignore */ }
  }

  /* 真正建 AudioContext —— 只在「已经有手势」的时候调用 */
  function buildAudio() {
    if (audioCtx) return true;
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) { audioLog('静音保活：这个浏览器没有 AudioContext，跳过'); return false; }
      audioCtx = new Ctx();
      var gain = audioCtx.createGain();
      // 25Hz + 极小音量：人耳基本听不到，但足够让浏览器认为“这个标签页在放声音”，
      // 从而不对它做后台节流 / 冻结（这是保活的关键）。
      gain.gain.value = 0.01;
      audioOsc = audioCtx.createOscillator();
      audioOsc.type = 'sine';
      audioOsc.frequency.value = 25;
      audioOsc.connect(gain);
      gain.connect(audioCtx.destination);
      audioOsc.start();
      audioCtx.onstatechange = function () {
        if (!audioCtx || audioCtx.state !== 'suspended') return;
        if (audioGesture()) tryResumeAudio();
        else audioLog('静音保活被浏览器挂起，点一下游戏画面就恢复');
      };
      tryResumeAudio();
      if (audioCtx.state === 'running') audioLog('静音保活已启动（后台不被节流）');
      else audioLog('静音保活已就绪，点一下游戏画面就生效');
      return true;
    } catch (e) {
      audioCtx = null;
      audioOsc = null;
      audioLog('静音保活启动失败（浏览器限制自动播放，点一下页面即可）');
      return false;
    }
  }

  /* 等第一次真实操作，点一下（鼠标 / 触摸 / 按键）就把音频建起来 */
  function unhookAudio() {
    var fn = audioHook;
    if (!fn) return;
    audioHook = null;
    audioArmed = false;
    for (var i = 0; i < AUDIO_GESTURES.length; i++) {
      try { window.removeEventListener(AUDIO_GESTURES[i], fn, true); } catch (e) { /* ignore */ }
    }
  }

  function armAudio() {
    if (audioArmed || !audioWant || audioCtx) return;
    audioArmed = true;
    var once = function () {
      unhookAudio();
      if (!audioWant) return;
      buildAudio();
    };
    audioHook = once;
    for (var i = 0; i < AUDIO_GESTURES.length; i++) {
      try {
        window.addEventListener(AUDIO_GESTURES[i], once, { capture: true, passive: true });
      } catch (e) { /* ignore */ }
    }
    audioLog('静音保活：等你点一下游戏画面（浏览器不允许没点过就放声音）');
  }

  function startKeepAlive() {
    audioWant = true;
    if (audioCtx) { tryResumeAudio(); return; }
    // 有手势就直接建；没有就先等着，绝不提前建（那就是用户看到的那串报错）
    if (audioGesture()) buildAudio();
    else armAudio();
  }

  function stopKeepAlive() {
    audioWant = false;
    unhookAudio();
    try { if (audioOsc) audioOsc.stop(); } catch (e) { /* ignore */ }
    try { if (audioCtx) audioCtx.close(); } catch (e) { /* ignore */ }
    audioOsc = null;
    audioCtx = null;
    audioSaid = '';
  }

  /* 每 10 秒巡一次：手势来了就补建 / 被挂起就拉起来。
   * 没手势时什么都不做 —— 这是「不再刷自动播放报错」的关键。 */
  function keepAliveTick() {
    if (!audioWant) return;
    if (!audioGesture()) return;
    if (!audioCtx) buildAudio();
    else tryResumeAudio();
  }

  /* ---------------- 反挂机：模拟少量鼠标移动 ---------------- */
  var activityTimer = null;

  function isTyping() {
    var el = document.activeElement;
    if (!el) return false;
    var tag = String(el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!el.isContentEditable;
  }

  function dispatchActivity() {
    try {
      var w = Math.max(1, window.innerWidth);
      var h = Math.max(1, window.innerHeight);
      var x = Math.round(w * (0.35 + Math.random() * 0.3));
      var y = Math.round(h * (0.35 + Math.random() * 0.3));
      var target = document.elementFromPoint(x, y) || document.body || document.documentElement;
      var opts = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y
      };
      target.dispatchEvent(new MouseEvent('mousemove', opts));
      if (Math.random() < 0.35) {
        var PE = window.PointerEvent;
        if (PE) {
          target.dispatchEvent(new PE('pointermove', {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', isPrimary: true
          }));
        }
      }
      S.lastFakeActivityAt = Date.now();
    } catch (e) { /* ignore */ }
  }

  function maybeActivity() {
    if (!settings.antiIdle) return;
    if (document.hidden) return;
    if (Date.now() - S.lastRealInputAt < 60000) return; // 你刚动过，不打扰
    if (isTyping()) return;                             // 正在输入，别抢焦点
    dispatchActivity();
  }

  function scheduleActivity() {
    if (activityTimer) clearTimeout(activityTimer);
    var delay = 20000 + Math.random() * 20000;
    activityTimer = setTimeout(function () {
      maybeActivity();
      scheduleActivity();
    }, delay);
  }

  var INPUT_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'pointerdown'];
  for (var i = 0; i < INPUT_EVENTS.length; i++) {
    (function (type) {
      window.addEventListener(type, function (ev) {
        if (ev && ev.isTrusted) {
          S.lastRealInputAt = Date.now();
          /* 第四十四批：只认能给「用户激活」的事件。鼠标划过 / 滚轮不算 ——
           * 拿它们去建 AudioContext 一样会被浏览器拦下来。 */
          if (AUDIO_GESTURES.indexOf(type) >= 0) S.gestureSeen = true;
        }
        // 有激活就补建音频 / 把它从挂起里拉起来；没激活就什么都别做
        if (audioWant && !audioCtx) { if (audioGesture()) buildAudio(); }
        else tryResumeAudio();
      }, { passive: true, capture: true });
    })(INPUT_EVENTS[i]);
  }

  /* ---------------- 自动喂食：效果到期（1 小时）后自动补一个 ---------------- */
  // 游戏的 7 种“效果果实”，同族效果互斥（换一种会顶掉另一种，还会弹确认框）。
  // 家族名取自游戏 config.BUFF_BERRIES，顺序/键名与游戏一致。
  var FEED_FAMILY = {
    'razz-berry': 'capture',
    'golden-razz-berry': 'capture',
    'nanab-berry': 'rare',
    'enigma-berry': 'dex',
    'pinap-berry': 'xp',
    'lansat-berry': 'money',
    'starf-berry': 'shiny'
  };

  function familyOf(key) {
    return FEED_FAMILY[key] || ('solo:' + key);
  }

  // 当前正在生效的效果（按家族）：读 #buff-stack 上游戏自己渲染的药丸，1 秒刷新一次
  function activeFamilyMap() {
    var map = {};
    var stack = document.getElementById('buff-stack');
    if (!stack) return map;
    var pills = stack.querySelectorAll('.buff-pill[data-k]');
    for (var i = 0; i < pills.length; i++) {
      var k = pills[i].getAttribute('data-k');
      if (k) map[familyOf(k)] = true;
    }
    return map;
  }

  // 背包里可喂的果实（游戏把 buff 果实渲染成 .bag-cell.berry）
  function scanFeedables() {
    var list = [];
    var panel = document.getElementById('bag-panel');
    if (!panel) return list;
    var cells = panel.querySelectorAll('.bag-cell');
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      if (!cell.classList || !cell.classList.contains('berry')) continue;
      var key = cell.getAttribute('data-k');
      if (!key) continue;

      var qty = 0;
      var qtyEl = cell.querySelector('.bag-qty');
      if (qtyEl) {
        var digits = String(qtyEl.textContent || '').replace(/[^\d]/g, '');
        qty = digits ? parseInt(digits, 10) : 0;
      }

      var timerEl = cell.querySelector('.bag-timer');
      var img = cell.querySelector('img');
      list.push({
        key: key,
        name: cell.getAttribute('aria-label') || key,
        qty: qty,
        left: timerEl ? String(timerEl.textContent || '').trim() : '',
        active: cell.classList.contains('on'),
        icon: img ? String(img.src || '') : ''
      });
    }
    return list;
  }

  function qtyOf(key) {
    var cell = document.querySelector('#bag-panel .bag-cell[data-k="' + key + '"]');
    if (!cell) return null;
    var qtyEl = cell.querySelector('.bag-qty');
    if (!qtyEl) return null;
    var digits = String(qtyEl.textContent || '').replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : null;
  }

  function doFeed(item, now) {
    var cell = document.querySelector('#bag-panel .bag-cell[data-k="' + item.key + '"]');
    if (!cell) {
      log('自动喂食：找不到「' + item.name + '」的格子');
      return;
    }
    S.feedAt[item.key] = now;
    S.feedTry[item.key] = { at: now, qty: item.qty };
    try {
      cell.click();   // 走游戏自己的 onclick → useBuffBerry，和手点完全一样
      S.feedCount++;
      S.lastFeedAt = now;
      log('自动喂食：' + item.name + '（效果到期，补了 1 个）');
      notifyBackground(true);
    } catch (e) {
      log('自动喂食：点击「' + item.name + '」失败');
    }
  }

  // 12 秒后回看这次点击有没有真的生效，连续 3 次没动静就暂停该物品 10 分钟
  function checkFeedResults(now) {
    Object.keys(S.feedTry).forEach(function (key) {
      var t = S.feedTry[key];
      if (!t || now - t.at < 12000) return;
      delete S.feedTry[key];

      var qty = qtyOf(key);
      if (qty === null) { S.feedFail[key] = 0; return; }   // 格子没了（吃完了/切了界面），不算失败
      if (qty >= t.qty) {
        S.feedFail[key] = (S.feedFail[key] || 0) + 1;
        if (S.feedFail[key] >= 3) {
          S.feedFail[key] = 0;
          S.feedCooldown[key] = now + 600000;
          log('自动喂食：' + key + ' 连续 3 次没生效，暂停 10 分钟');
        }
      } else {
        S.feedFail[key] = 0;
      }
    });
  }

  /* 第七批：开始追踪 / 捕捉时自动开启「蔓莓果」自动喂食；
   * 第十九批再加「谜芝果」（enigma-berry，从未捕获过的宝可梦出现率 ×3）。
   * 两者在游戏的 BUFF_BERRIES 里分属 capture / dex 两个家族，可以同时生效。
   * 第一百一十九批：按玩家要求删掉「自动喂食总开关」，没有任何总闸。
   * 调用方（传说追踪 legAutoFeed / 图鉴捕捉 dexAutoFeed）自己把关，只有玩家
   * 显式勾了对应开关才会走到这里；这里只负责把两种果子补进候选，
   * 最终喂不喂由 feedItems 里每格自己的开关决定，默认全部不勾。 */
  function ensureRazzFeed(why) {
    var items = Object.assign({}, settings.feedItems || {});
    var added = [];
    if (!items['razz-berry']) { items['razz-berry'] = true; added.push('蔓莓果'); }
    if (!items['enigma-berry']) { items['enigma-berry'] = true; added.push('谜芝果'); }
    if (!added.length) return false;
    settings.feedItems = items;
    try {
      SYNC.set({ feedItems: items }, function () {
        void chrome.runtime.lastError;
      });
    } catch (e) { /* ignore */ }
    log('自动喂食：' + why + '，已把「' + added.join(' + ') + '」加入候选');
    return true;
  }

  function feedTick(now) {
    S.feedables = scanFeedables();
    /* 第一百一十九批：删掉总闸。喂不喂完全由 feedItems 里每格开关决定，
       一个都没勾时下面的循环自然一个都不喂，不需要额外的总开关。 */
    checkFeedResults(now);
    if (!S.feedables.length) return;

    var wanted = settings.feedItems || {};
    if (modalVisible()) return;   // 有弹窗挡着先别点

    var activeFam = activeFamilyMap();

    for (var i = 0; i < S.feedables.length; i++) {
      var it = S.feedables[i];
      if (!wanted[it.key]) continue;
      if (it.qty <= 0) continue;
      if (activeFam[familyOf(it.key)]) continue;                    // 同类效果还在，别浪费
      if (now < (S.feedCooldown[it.key] || 0)) continue;
      if (now - (S.feedAt[it.key] || 0) < 20000) continue;          // 20 秒内不重复
      doFeed(it, now);
      return;                                                       // 一次只喂一个
    }
  }

  /* ---------------- 地下通道：一键派 3 只 + 自动领奖 ---------------- */
  // 游戏流程（对着 bundle 逐条核对）：
  //   空位 .ug-slot.plus → 打开 #evt-pick 选队窗口（只认 pointerdown/pointerup）
  //   #evt-team 里要有 3 个 .slot.filled，`En route` 按钮才不是 disabled
  //   地下列表默认按等级降序（underground 传 noBoss:true，"best" 排序被禁用）
  //   探险完成 [data-ug-take] 领奖，[data-ug-big] 是结算弹窗
  var UG = {
    busy: false,
    state: 'idle',
    note: '',
    why: '还没开启，点「一键派遣」开始',
    armed: false,
    sends: 0,
    takes: 0,
    fails: 0,
    lastCycleAt: 0,
    lastActionAt: 0,
    backoffUntil: 0,
    nextCheckAt: 0,
    doneEnd: 0,             // 已经为哪一批「到点」跑过一趟了（避免重复跳）
    modalSince: 0,
    doneDay: '',           // 今天的次数用完了（巴黎日期），到换天才恢复
    pickUntil: 0           // 第一百一十批：正在按主题重选队伍，配队窗桥先别抢排序
  };

  var UG_PID = 700;
  var UG_SAVE_KEY = (CFG && CFG.SAVE_KEY) || 'gachamon-save-v1';

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // 轮询等待条件成立，比固定 sleep 稳得多
  async function waitFor(fn, ms) {
    var end = Date.now() + (ms || 2000);
    for (;;) {
      var v = null;
      try { v = fn(); } catch (e) { v = null; }
      if (v) return v;
      if (Date.now() > end) return null;
      await sleep(100);
    }
  }

  function ugNote(text) {
    UG.note = text;
    log('地下通道：' + text);
  }

  function ugWhy(text) { UG.why = text; }

  function ugFail(text) {
    UG.fails++;
    UG.backoffUntil = Date.now() + Math.min(30 * 60 * 1000, 60000 * UG.fails);
    ugWhy(text);
    ugNote(text);
  }

  function ugTab() {
    return document.querySelector('#tabs [data-screen="underground"]');
  }

  // 探险进行中隔多久去看一次（弹窗里可改，10~600 秒，默认 10 分钟）
  function ugCheckMs() {
    var n = parseInt(settings.ugCheckSec, 10);
    if (!isFinite(n) || n <= 0) n = 600;
    return Math.max(10, Math.min(600, n)) * 1000;
  }

  function ugTabLocked(tab) {
    return !tab || tab.disabled || !!tab.classList.contains('locked') ||
      tab.getAttribute('aria-disabled') === 'true';
  }

  // HH:MM，日志里用得着
  function ugClock(ms) {
    var d = new Date(Number(ms) || 0);
    var h = d.getHours();
    var m = d.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function ugActive() {
    var s = document.getElementById('screen-underground');
    return !!s && s.classList.contains('active');
  }

  function activeScreenName() {
    var el = document.querySelector('.screen.active');
    if (!el || !el.id) return '';
    return el.id.indexOf('screen-') === 0 ? el.id.slice(7) : el.id;
  }

  // 只把真正显示出来的弹窗当障碍（关掉的弹窗节点可能还留着）
  function modalVisible() {
    var root = document.getElementById('modal-root');
    if (!root) return false;
    var mods = root.querySelectorAll('.modal');
    for (var i = 0; i < mods.length; i++) {
      var el = mods[i];
      if (el.getClientRects && el.getClientRects().length) return true;
    }
    return false;
  }

  function ugDialogOpen() {
    if (document.querySelector('#evt-pick.open')) return true;   // 自己开着选队窗口就别插一手
    if (!modalVisible()) { UG.modalSince = 0; return false; }
    if (!UG.modalSince) UG.modalSince = Date.now();
    // 有些弹窗关不掉（比如「有新版本」），挡超过 5 分钟就不再干等
    return Date.now() - UG.modalSince < 5 * 60 * 1000;
  }

  // 地下通道没解锁时 #ug-root 里只有一句 pg-empty
  function ugLocked() {
    var root = document.getElementById('ug-root');
    if (!root) return true;
    if (root.querySelector('.ug-slot') || root.querySelector('.ug-bay')) return false;
    return !!root.querySelector('.pg-empty');
  }

  // 存档里的队伍数据，读不到就返回 null（缓存 2 秒，别每次挑人都解析一遍）
  var ugSaveCache = { at: 0, data: null };

  function ugSave() {
    var SAVE = window.PCG_SAVE || null;
    if (SAVE) return SAVE.read();
    if (Date.now() - ugSaveCache.at < 2000) return ugSaveCache.data;
    var data = null;
    try {
      var raw = localStorage.getItem(UG_SAVE_KEY);
      if (raw) data = JSON.parse(raw);
    } catch (e) { data = null; }
    ugSaveCache = { at: Date.now(), data: data };
    return data;
  }

  // 出战队伍：优先用游戏自己打的「É」标记（.ot-team），再补队伍卡和存档
  function ugParty() {
    var set = {};
    if (!settings.ugSkipParty) return set;

    var marked = document.querySelectorAll('#evt-pick .pc-cell .ot-team');
    for (var i = 0; i < marked.length; i++) {
      var cell = marked[i].closest ? marked[i].closest('.pc-cell[data-uid]') : null;
      if (cell) set[cell.getAttribute('data-uid')] = 1;
    }

    var cards = document.querySelectorAll('#adv-team .tcard[data-uid]');
    for (var k = 0; k < cards.length; k++) {
      var uid = cards[k].getAttribute('data-uid');
      if (uid) set[uid] = 1;
    }

    var save = ugSave();
    if (save) {
      var lists = [save.team, save.road];
      for (var n = 0; n < lists.length; n++) {
        var arr = lists[n];
        if (arr && arr.length) {
          for (var m = 0; m < arr.length; m++) if (arr[m]) set[String(arr[m])] = 1;
        }
      }
    }
    return set;
  }

  function ugFilled(picker) {
    return picker ? picker.querySelectorAll('#evt-team .slot.filled').length : 0;
  }

  // 列表是按等级降序排的，所以「第一个合格的」就是等级最高的
  function ugCandidate(picker, requireTheme, skip) {
    var party = ugParty();
    var inTeam = {};
    var filled = picker.querySelectorAll('#evt-team .slot.filled[data-uid]');
    for (var i = 0; i < filled.length; i++) {
      var u = filled[i].getAttribute('data-uid');
      if (u) inTeam[u] = 1;
    }

    var cells = picker.querySelectorAll('#evt-pc .pc-cell[data-uid]');
    for (var j = 0; j < cells.length; j++) {
      var c = cells[j];
      var uid = c.getAttribute('data-uid');
      if (!uid || inTeam[uid]) continue;
      if (skip && skip[uid]) continue;
      if (c.classList.contains('evt-lock')) continue;      // 今天已经去过 / 已在别的队伍
      if (party[uid]) continue;                            // 在出战队伍里
      if (c.querySelector('.ot-team')) continue;           // 游戏标的「在你的队伍里」
      if (requireTheme && !c.classList.contains('eff-up')) continue;  // 不是主题属性
      return c;
    }
    return null;
  }

  // 选队窗口只认 pointerdown/pointerup（element.click() 无效），
  // 并且它用一个全局 E 记住当前按下的是哪一格，pointerId 必须对上。
  function ugTap(el) {
    if (!el) return false;
    var pid = ++UG_PID;
    try {
      var r = el.getBoundingClientRect();
      var x = Math.round(r.left + r.width / 2) || 1;
      var y = Math.round(r.top + r.height / 2) || 1;
      var base = {
        bubbles: true, cancelable: true, composed: true,
        pointerId: pid, pointerType: 'mouse', isPrimary: true,
        clientX: x, clientY: y, button: 0
      };
      el.dispatchEvent(new PointerEvent('pointerdown', Object.assign({}, base, { buttons: 1 })));
      el.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, base, { buttons: 0 })));
      return true;
    } catch (e) {
      try { el.click(); return true; } catch (e2) { return false; }
    }
  }

  // 每点一只都确认它真的进了队伍；游戏不收的（同种、区域限制）跳过换下一只
  // skip0：调用方刚从队伍里换掉的 uid，别马上又选回来
  async function ugPickInto(picker, want, requireTheme, skip0) {
    var added = 0;
    var skip = skip0 || {};
    var tries = 0;
    while (added < want && tries++ < 26) {
      var cell = ugCandidate(picker, requireTheme, skip);
      if (!cell) break;
      var uid = cell.getAttribute('data-uid') || '';
      var before = ugFilled(picker);
      ugTap(cell);
      var grew = await waitFor(function () {
        return ugFilled(picker) > before ? true : null;
      }, 2000);
      if (grew) added++;
      else if (uid) skip[uid] = 1;
      else break;
    }
    return added;
  }

  /* 点一下「已选」的队伍格子＝把它退回 PC（游戏 pointerup 的 dt() 会 splice 掉）。
     和 ugTap() 往队伍里加人用的是同一套 pointerdown/pointerup，只是方向反过来。 */
  async function ugDropFromTeam(picker, uid) {
    var slot = picker.querySelector('#evt-team .slot.filled[data-uid="' + uid + '"]');
    if (!slot) return false;
    var before = ugFilled(picker);
    ugTap(slot);
    var less = await waitFor(function () {
      return ugFilled(picker) < before ? true : null;
    }, 1500);
    return !!less;
  }

  /* 第一百一十批 + v1.45 修复：按「当前」探险主题重选一整队。
     游戏每派出去一次就会重抽该槽位的主题（under.next[bay]），可槽位里上次
     选好却没派出去的宝可梦不会自动清掉。
     ★ v1.45 根因：游戏「优化」按钮是幂等的——它算出当前主题最优阵容 U 后，
       若 U.join()===Se.join()（满员且它认为"已是针对本主题的最强"）就直接
       return、一个人都不换；旧版在「有优化按钮」时不清空旧队伍就点它，于是
       满员槽位把上一个主题的队伍原样派了出去，且 waitFor(filled>=3) 因本来就
       满员而立即通过，插件毫无察觉。
     ★ 修复：把「清空」提到最前面、无条件执行——
       ① 先把已选的旧队伍整队退回 PC（满员尤其关键）；
       ② 队伍空了，游戏「优化」的 Se 为空、U.join()!==Se.join()，必定按当前主题重算填入；
          waitFor(filled>=3) 也才会真正等到新队伍进来；
       ③ 没有优化按钮 / 主题达标成员不足 3 只时，按 .eff-up + 等级兜底补齐；
       ④ 最后把当前出战队伍成员换掉（插件自己的规矩，游戏优化不认）。 */
  async function ugRebuildTeam(picker) {
    var i, u;
    var old = [];
    var before = picker.querySelectorAll('#evt-team .slot.filled[data-uid]');
    for (i = 0; i < before.length; i++) old.push(before[i].getAttribute('data-uid'));
    var replaced = 0;

    // ① 无条件先把旧队伍整队清空退回 PC（这是"满员时重新选"的关键一步）
    for (var g = 0; g < 4 && ugFilled(picker) > 0; g++) {
      var filled = picker.querySelectorAll('#evt-team .slot.filled[data-uid]');
      if (!filled.length) break;
      u = filled[0].getAttribute('data-uid');
      if (!u || !await ugDropFromTeam(picker, u)) break;
      replaced++;
    }

    // 等级降序：优化不可用时当兜底挑选顺序
    var sort = picker.querySelector('#evt-sort');
    if (sort && sort.value !== 'level') {
      sort.value = 'level';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(350);
    }

    // ② 队伍已空 → 点游戏「优化」必定按当前主题重算并填入最优阵容
    var opt = picker.querySelector('#evt-opt');
    if (opt) {
      try { opt.click(); } catch (e) { opt = null; }
      if (opt) await waitFor(function () { return ugFilled(picker) >= 3 ? true : null; }, 2500);
    }

    // ③ 优化不可用 / 主题达标成员不足 3 只 → 按 .eff-up + 等级兜底补齐
    if (ugFilled(picker) < 3) {
      var eff = picker.querySelector('#evt-eff');
      var hasEff = !!eff && !eff.hidden;
      if (hasEff && !eff.classList.contains('on')) { eff.click(); await sleep(350); }
      await ugPickInto(picker, 3 - ugFilled(picker), true);
      if (hasEff && eff.classList.contains('on')) { eff.click(); await sleep(350); }
    }
    // 主题成员实在凑不满也别卡住：放宽到任意可选宝可梦，按等级补齐
    if (ugFilled(picker) < 3) await ugPickInto(picker, 3 - ugFilled(picker), false);

    // ④ 「不派当前出战队伍」是插件自己的规矩，游戏的「优化」不认，这里补一遍
    var party = ugParty();
    var skip = {};
    for (var pass = 0; pass < 4; pass++) {
      var bad = '';
      var slots = picker.querySelectorAll('#evt-team .slot.filled[data-uid]');
      for (i = 0; i < slots.length; i++) {
        u = slots[i].getAttribute('data-uid');
        if (u && party[u]) { bad = u; break; }
      }
      if (!bad) break;
      skip[bad] = 1;
      if (!await ugDropFromTeam(picker, bad)) break;
      replaced++;
    }
    if (ugFilled(picker) < 3) await ugPickInto(picker, 3 - ugFilled(picker), true, skip);
    if (ugFilled(picker) < 3) await ugPickInto(picker, 3 - ugFilled(picker), false, skip);
    return replaced;
  }

  function ugClosePicker() {
    var picker = document.querySelector('#evt-pick.open');
    if (!picker) return;
    var x = picker.querySelector('[data-evt-close]');
    if (x) { x.click(); return; }
    picker.classList.remove('open');
  }

  // ---- 槽位（bay）状态 ----
  // 地下通道一共 4 个槽位：1 个初始 + 3 个用「碎片」买（150 / 500 / 1000）。
  // 界面上每个槽位就是一个 .ug-bay[data-bay="0..3"]，还有一坨状态类：
  //   .ug-bay.locked.ug-buybay → 还没买（只画「下一个能买的」）
  //   .ug-bay.idle             → 可派人：.ug-slot.plus 空位 / .ug-slot.full 已选
  //   .ug-bay.run              → 探险中，.ug-fl 写着当前层数
  //   .ug-bay.done / .ug-bay.ko → 跑完了，[data-ug-take] 是领奖
  var UG_PRICES = [150, 500, 1000];

  function ugBays() {
    var root = document.querySelector('#ug-root');
    if (!root) return [];
    var host = root.querySelector('[data-ug-bays]') || root;
    return Array.prototype.slice.call(host.querySelectorAll('.ug-bay'));
  }

  // 探险主题：游戏的 .ug-scene 上挂着 t-<key>，右上角小条写着本地化主题名
  var UG_THEMES = {
    flooded:   { name: '水淹', icon: '🌊', color: '#3b8fe0', types: ['water', 'grass', 'electric'] },
    volcanic:  { name: '火山', icon: '🌋', color: '#ff7a3a', types: ['fire', 'rock', 'ground'] },
    crystal:   { name: '水晶', icon: '💎', color: '#7fd4ff', types: ['ice', 'psychic', 'steel'] },
    dark:      { name: '幽暗', icon: '🌑', color: '#8a6ad8', types: ['ghost', 'dark', 'poison'] },
    ancient:   { name: '远古', icon: '🏛️', color: '#c9a24a', types: ['dragon', 'fighting'] },
    galleries: { name: '坑道', icon: '⛏️', color: '#c08a4a', types: ['normal', 'bug', 'flying'] }
  };

  function ugThemeMeta(key) {
    var m = UG_THEMES[key];
    if (!m) return null;
    return { key: key, name: m.name, icon: m.icon, color: m.color, types: m.types.slice(0) };
  }

  // 从一个槽位卡片上读探险主题（跑着/跑完/空闲都挂着场景类，空槽位也有主题）
  function ugThemeOf(bay) {
    if (!bay) return null;
    var key = '', i;
    var scene = bay.querySelector('.ug-scene');
    var cls = scene ? String(scene.className || '').split(/\s+/) : [];
    for (i = 0; i < cls.length; i++) {
      if (cls[i].indexOf('t-') === 0 && cls[i].length > 2) { key = cls[i].slice(2); break; }
    }
    var meta = ugThemeMeta(key);
    var name = '';
    var pill = bay.querySelector('[data-p="theme"]');
    if (pill) name = String(pill.textContent || '').replace(/\s+/g, ' ').trim();
    if (!meta && !name) return null;
    if (meta) { if (name) meta.name = name; return meta; }
    return { key: key, name: name, icon: '', color: '', types: [] };
  }

  function ugBayInfo(bay) {
    if (!bay) return { kind: 'none', bay: -1 };

    var idx = parseInt(bay.getAttribute('data-bay'), 10);
    if (!isFinite(idx)) idx = -1;

    if (bay.classList.contains('locked')) {
      var buy = bay.querySelector('[data-ug-buyslot]');
      return {
        kind: 'locked',
        bay: idx,
        cost: buy ? String(buy.textContent || '').trim() : '',
        can: !!buy && !buy.disabled
      };
    }

    if (bay.classList.contains('run')) {
      var fl = bay.querySelector('.ug-fl');
      var txt = fl ? String(fl.textContent || '').trim() : '';
      var m = txt.match(/(\d+)/);
      return { kind: 'running', bay: idx, floor: m ? parseInt(m[1], 10) : 0, floorText: txt };
    }

    if (bay.classList.contains('done') || bay.classList.contains('ko')) {
      return { kind: 'done', bay: idx, ko: bay.classList.contains('ko') };
    }

    var plus = bay.querySelectorAll('.ug-slot.plus').length;
    var full = bay.querySelectorAll('.ug-slot.full').length;
    if (plus > 0) return { kind: 'empty', bay: idx, plus: plus, full: full };

    var go = bay.querySelector('[data-ug-go]');
    if (go && !go.disabled) return { kind: 'ready', bay: idx, full: full };
    return { kind: 'blocked', bay: idx, why: go ? String(go.getAttribute('title') || '') : '' };
  }

  // 买槽位那一格的价格只有数字（图标 + 数字），补个单位好读
  function ugCostText(raw, idx) {
    var t = String(raw || '').replace(/\s+/g, ' ').trim();
    var fallback = String(UG_PRICES[Math.max(0, Math.min(UG_PRICES.length - 1, idx - 1))]);
    if (!t) return fallback + ' 碎片';
    if (!/[^\d\s]/.test(t)) return t + ' 碎片';
    return t;
  }

  // 今天的次数用完了、奖励也都领完了 → 自动关掉，等刷新再开
  function ugCheckDayDone() {
    var info = ugSlotsInfo();
    if (!info || info.left < 0) return false;            // 读不到数字就不动手
    if (info.left > 0) {
      if (settings.ugDoneDay) {
        settings.ugDoneDay = '';
        UG.doneDay = '';
        try { SYNC.set({ ugDoneDay: '' }); } catch (e) { /* ignore */ }
        log('地下通道：次数刷新了，可以重新开始');
      }
      return false;
    }
    // 还有队伍在外面 / 还有奖励没领 → 先别关，等它回来收完
    for (var i = 0; i < info.slots.length; i++) {
      var k = info.slots[i].kind;
      if (k === 'running' || k === 'done' || k === 'ready') return false;
    }

    var day = raidDayId();
    UG.doneDay = day;
    if (settings.ugDoneDay !== day) {
      settings.ugDoneDay = day;
      try { SYNC.set({ ugDoneDay: day }); } catch (e) { /* ignore */ }
    }
    ugOff('今天的探险次数用完了（' + info.perDay + ' / ' + info.perDay + '），自动关掉，明天刷新后再开');
    return true;
  }

  function ugOff(text) {
    var changed = settings.autoUnderground || settings.ugArmed || UG.armed;
    settings.autoUnderground = false;
    settings.ugArmed = false;
    UG.armed = false;
    UG.state = 'idle';
    UG.why = text;
    if (changed) {
      log('地下通道：' + text);
      try { SYNC.set({ autoUnderground: false, ugArmed: false }); } catch (e) { /* ignore */ }
    }
  }

  // 4 个槽位的完整状态，界面上读不到就退回存档
  // 存档里每个槽位都有 start / end（毫秒时间戳），界面上的倒计时读不出准值，
  // 所以「什么时候回来」统一从存档取
  function ugEndMap() {
    var map = {};
    var save = ugSave();
    var list = (save && save.under && save.under.slots) || [];
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s || !isFinite(s.bay)) continue;
      map[s.bay] = { start: Number(s.start) || 0, end: Number(s.end) || 0, team: (s.team || []).length };
    }
    return map;
  }

  // 最近一批什么时候回来（毫秒时间戳，0 = 没有在跑的）。5 秒缓存，别每次都翻存档
  var UG_DUE = { at: 0, end: 0 };
  function ugNextEnd() {
    var now = Date.now();
    if (now - UG_DUE.at < 5000) return UG_DUE.end;
    var map = ugEndMap();
    var best = 0;
    for (var k in map) {
      if (!map.hasOwnProperty(k)) continue;
      var e = Number(map[k].end) || 0;
      if (e && (!best || e < best)) best = e;
    }
    UG_DUE.at = now;
    UG_DUE.end = best;
    return best;
  }

  // 槽位到点就别等「检查间隔」了：回来时间过后 1 分钟，自己跳过去收一趟。
  // 一批只跳一次（UG.doneEnd 记是哪一批）；没有队伍在跑就把标记清掉。
  function ugDueTrip(now) {
    var due = ugNextEnd();
    if (!due) {
      if (UG.doneEnd) UG.doneEnd = 0;
      return false;
    }
    if (now >= due + 60000 && UG.doneEnd !== due) {
      UG.doneEnd = due;
      UG.nextCheckAt = 0;
      log('地下通道：有队伍到点了（' + ugClock(due) + ' 回来），过去收一下');
      return true;
    }
    return false;
  }

  function ugSlotsInfo() {
    /* v1.21：游戏真实每日次数 = PER_DAY(8) + 已买槽位的 PER_BOUGHT[1,1,2] 奖励之和。
     * 旧版写死 8，玩家开了槽位后次数变多却仍显示 /8。这里按存档 extra 复算真实上限。
     * 游戏公式：ne() = PER_DAY + PER_BOUGHT.reduce((a,b,i)=>a+(i<extra?b:0), 0) */
    var PER_DAY = 8, PER_BOUGHT = [1, 1, 2];
    var sv = ugSave();
    var buyN = Math.max(0, Math.min(3, parseInt(sv && sv.under && sv.under.extra, 10) || 0));
    var realPerDay = PER_DAY;
    for (var bi = 0; bi < buyN; bi++) realPerDay += PER_BOUGHT[bi];
    var out = { perDay: realPerDay, left: -1, slots: [], source: 'none', busy: 0, nextEnd: 0 };
    var idx, i;
    var ends = ugEndMap();

    // 「剩/总」就写在 [data-ug-sum] 的 <b> 里，跟语言无关
    var sum = document.querySelector('#ug-root [data-ug-sum] b');
    if (sum) {
      var mm = String(sum.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
      if (mm) {
        out.left = parseInt(mm[1], 10);
        out.perDay = parseInt(mm[2], 10);
        /* v1.21：DOM 读到的是游戏真实总数；若它小于按槽位算出的值，说明存档
         * 里 extra 更新更及时，用较大的真实值，避免又退回 /8。 */
        if (out.perDay < realPerDay) out.perDay = realPerDay;
      }
    }

    var bays = ugBays();
    if (bays.length) {
      out.source = 'dom';
      var byIdx = {};
      var buy = null;                       // 界面上「买下一个槽位」那一格，没有 data-bay
      for (i = 0; i < bays.length; i++) {
        var info = ugBayInfo(bays[i]);
        info.theme = ugThemeOf(bays[i]);
        if (info.bay >= 0) byIdx[info.bay] = info;
        else if (info.kind === 'locked') buy = info;
      }
      var max = 0;
      for (var k in byIdx) if (byIdx.hasOwnProperty(k)) max = Math.max(max, parseInt(k, 10) + 1);
      for (idx = 0; idx < max; idx++) {
        var one = byIdx[idx] || { kind: 'unknown', bay: idx };
        var em = ends[idx];
        if (em && (one.kind === 'running' || one.kind === 'done')) {
          one.start = em.start;
          one.end = em.end;
          one.team = em.team;
        }
        if (one.end) out.nextEnd = (!out.nextEnd || one.end < out.nextEnd) ? one.end : out.nextEnd;
        if (one.kind === 'running' || one.kind === 'done' || one.kind === 'empty' || one.kind === 'ready') out.busy++;
        out.slots.push(one);
      }
      // 还没买的槽位：界面只画「下一个能买的」，剩下两个的价格是固定档位
      for (idx = max; idx < 4; idx++) {
        var isNext = idx === max;
        out.slots.push({
          kind: 'locked',
          bay: idx,
          cost: (isNext && buy) ? ugCostText(buy.cost, idx) : ugCostText('', idx),
          can: !!(isNext && buy && buy.can),
          next: isNext
        });
      }
      return out;
    }

    // 界面还没渲染过（没打开过地下通道页）→ 用存档里的数据
    var save = ugSave();
    var under = save && save.under;
    if (!under) return out;

    out.source = 'save';
    var extra = Math.max(0, Math.min(3, parseInt(under.extra, 10) || 0));
    var max2 = Math.max(1 + extra, (under.slots || []).length);
    for (idx = 0; idx < 4; idx++) {
      var run = null;
      var list = under.slots || [];
      for (i = 0; i < list.length; i++) if (list[i] && list[i].bay === idx) run = list[i];
      if (idx < max2) {
        if (run) {
          var re2 = Number(run.end) || 0;
          if (re2) out.nextEnd = (!out.nextEnd || re2 < out.nextEnd) ? re2 : out.nextEnd;
          out.slots.push({
            kind: 'running', bay: idx, floor: 0, floorText: '',
            start: Number(run.start) || 0, end: re2, team: (run.team || []).length,
            theme: run.theme ? ugThemeMeta(run.theme) : null
          });
          out.busy++;
        }
        else out.slots.push({ kind: 'empty', bay: idx, plus: 3, full: 0 });
      } else {
        out.slots.push({
          kind: 'locked',
          bay: idx,
          cost: ugCostText('', idx),
          can: false,
          next: idx === max2
        });
      }
    }
    if (out.left < 0 && isFinite(under.sent)) {
      out.left = Math.max(0, out.perDay - under.sent);
    }
    return out;
  }

  /* ---- 起点层数（游戏新加的筛选） ----
     游戏把每个槽位选的起点存在 localStorage['pc-ug-from']（{槽位号: 层数}），
     界面上是空槽位卡片里的 <select data-ug-from="槽位号">，选项就是已经解锁的层
     （第 N 层要 best >= N-1+SKIP_PAY 才出现）。弹窗里的档位是写死的，
     插件只负责在派队前把这一格改到玩家选的层；没解锁就退到已解锁的最高层。 */
  var UG_FROM = { list: [], cur: 0, seenAt: 0 };

  function ugFromSel(bay) {
    var scope = bay || document.querySelector('#ug-root');
    if (!scope) return null;
    return scope.querySelector('select[data-ug-from]');
  }

  function ugFromScan() {
    var sels = document.querySelectorAll('#ug-root select[data-ug-from]');
    if (!sels.length) return UG_FROM;
    var list = [], i, j, v;
    for (i = 0; i < sels.length; i++) {
      var opts = sels[i].options || [];
      for (j = 0; j < opts.length; j++) {
        v = parseInt(opts[j].value, 10);
        if (v > 0 && list.indexOf(v) < 0) list.push(v);
      }
    }
    list.sort(function (a, b) { return a - b; });
    UG_FROM.list = list;
    UG_FROM.cur = parseInt(sels[0].value, 10) || 0;
    UG_FROM.seenAt = Date.now();
    return UG_FROM;
  }

  // 0 = 跟随游戏；>=1 才是插件要改的层数
  function ugFromWant() {
    var n = parseInt(settings.ugFrom, 10);
    if (!isFinite(n) || n < 1) return 0;
    return n;
  }

  // 把这一格的起点改到玩家要的层数；这个层还没解锁就按已解锁的最高层派
  function ugApplyFrom(bay) {
    var want = ugFromWant();
    if (!want) return false;
    var sel = ugFromSel(bay);
    if (!sel) return false;
    var best = 0, has = false, i, v;
    for (i = 0; i < sel.options.length; i++) {
      v = parseInt(sel.options[i].value, 10);
      if (!(v > 0)) continue;
      if (v > best) best = v;
      if (v === want) has = true;
    }
    if (!best) return false;
    var target = has ? want : best;           // 没解锁 → 退到已解锁的最高层
    if (parseInt(sel.value, 10) === target) return false;
    sel.value = String(target);
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    log(has
      ? '地下通道：起点改成第 ' + target + ' 层'
      : '地下通道：第 ' + want + ' 层还没解锁，按已解锁的第 ' + target + ' 层派');
    return true;
  }

  async function ugDeployBay(bay) {
    var info = ugBayInfo(bay);
    /* 第一百一十批：empty（有空位）和 ready（3 只已选好）都要走这里。
       旧版对 ready 直接点 [data-ug-go]，把上一次主题留下的队伍原样派出去；
       游戏每派出一次就会重抽这个槽位的主题，于是总跟当前主题对不上。 */
    if (!bay || (info.kind !== 'empty' && info.kind !== 'ready')) {
      return { ok: false, step: '这个槽位不用派' };
    }

    var theme = ugThemeOf(bay);
    var slot = bay.querySelector('.ug-slot.plus') || bay.querySelector('.ug-slot.full');
    if (!slot) return { ok: false, step: '没有可点的队伍格子' };

    // 地下通道和配队窗共用 #evt-pick：这一段别让「收藏 / 自定义排序」桥插进来，
    // 否则游戏「优化」算出来的主题阵容会被仓库顺序覆盖掉。
    UG.pickUntil = Date.now() + 30000;
    try { evtNeutral(); } catch (e) { /* ignore */ }

    // 先把这一格的起点改好（游戏会重渲染整块，节点得重新拿）
    if (ugApplyFrom(bay)) {
      await sleep(280);
      var again = document.querySelector('#ug-root .ug-bay[data-bay="' + info.bay + '"]');
      if (again) {
        bay = again;
        info = ugBayInfo(bay);
        slot = again.querySelector('.ug-slot.plus') || again.querySelector('.ug-slot.full');
      }
      if (!slot || (info.kind !== 'empty' && info.kind !== 'ready')) {
        UG.pickUntil = 0;
        return { ok: false, step: '这个槽位不用派' };
      }
    }

    var idx = info.bay;
    var plusBefore = bay.querySelectorAll('.ug-slot.plus').length;
    var hadFilled = bay.querySelectorAll('.ug-slot.full').length;

    slot.click();
    var picker = await waitFor(function () {
      return document.querySelector('#evt-pick.open');
    }, 2500);
    if (!picker) {
      UG.pickUntil = 0;
      UG.backoffUntil = Date.now() + 15000;
      return { ok: false, step: '选队窗口没打开' };
    }

    await waitFor(function () {
      return picker.querySelectorAll('#evt-pc .pc-cell[data-uid]').length ? true : null;
    }, 3000);

    // 等级降序：只在「优化」按钮不可用、要自己挑人的旧版里当兜底排序
    var sort = picker.querySelector('#evt-sort');
    if (sort && sort.value !== 'level') {
      sort.value = 'level';
      sort.dispatchEvent(new Event('change', { bubbles: true }));
      await sleep(350);
    }

    // 按当前主题重选一整队（已选好的旧成员会被替换掉，不再直接出发）
    var replaced = await ugRebuildTeam(picker);

    var filled = ugFilled(picker);
    var go = picker.querySelector('#evt-go .mp-go');
    if (!go || go.disabled || filled < 3) {
      var reason = go ? String(go.getAttribute('title') || '') : '';
      ugClosePicker();
      UG.pickUntil = 0;
      await sleep(200);
      return { ok: false, step: '只凑到 ' + filled + '/3 只' + (reason ? '（' + reason + '）' : '') };
    }

    go.click();
    var sent = await waitFor(function () {
      var b = document.querySelector('#ug-root .ug-bay[data-bay="' + idx + '"]');
      if (!b) return null;
      if (b.classList.contains('run') || b.classList.contains('done') || b.classList.contains('ko')) return true;
      return b.querySelectorAll('.ug-slot.plus').length < plusBefore ? true : null;
    }, 4000);

    if (!sent) {
      ugClosePicker();
      UG.pickUntil = 0;
      return { ok: false, step: '点了出发但没派出去（可能今天次数用完了）' };
    }

    UG.pickUntil = 0;
    UG.sends++;
    UG.fails = 0;
    UG.backoffUntil = 0;
    UG.lastActionAt = Date.now();
    return {
      ok: true,
      slot: idx + 1,
      step: '槽位 ' + (idx + 1) + ' 按' +
        (theme && theme.name ? '「' + theme.name + '」' : '当前') + '主题派出 3 只' +
        (hadFilled ? '（原已选 ' + hadFilled + ' 只，重选替换 ' + replaced + ' 只）' : '')
    };
  }

  // 把所有可派遣的槽位一次派满（有 4 个槽位就是 4 队、12 只）
  async function ugDeployAll() {
    var sent = [];
    var fails = [];

    for (var guard = 0; guard < 6; guard++) {
      var bays = ugBays();
      var target = null;
      for (var i = 0; i < bays.length; i++) {
        var info = ugBayInfo(bays[i]);
        if (info.kind === 'empty' || info.kind === 'ready') { target = bays[i]; break; }
      }
      if (!target) break;

      var r = await ugDeployBay(target);
      if (!r.ok) { fails.push(r.step); break; }
      sent.push(r.slot || 0);
      await sleep(700);
    }

    if (sent.length) {
      return {
        ok: true,
        text: '派出 ' + sent.length + ' 个槽位（槽位 ' + sent.join('、') + '，共 ' + (sent.length * 3) + ' 只）'
      };
    }
    var whyFail = fails.length ? fails[0] : '没有可派遣的槽位';
    return { ok: false, text: whyFail };
  }

  async function ugWork(force) {
    // 结算弹窗开着就先关掉
    var big = document.querySelector('#ug-root [data-ug-big]:not([hidden])');
    if (big && big.children && big.children.length) {
      var brief = String(big.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      big.click();
      await sleep(400);
      ugNote('收下探险奖励' + (brief ? '：' + brief : ''));
      return { act: 'took', step: '关闭了结算弹窗' };
    }

    // 有奖可领
    var take = document.querySelector('#ug-root [data-ug-take]');
    if (take) {
      take.click();
      UG.takes++;
      UG.fails = 0;
      UG.lastActionAt = Date.now();
      var ov = await waitFor(function () {
        return document.querySelector('#ug-root [data-ug-big]:not([hidden])');
      }, 2500);
      var txt = '';
      if (ov && ov.children && ov.children.length) {
        txt = String(ov.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        ov.click();
        await sleep(400);
      }
      var act = '领到一次探险奖励' + (txt ? '：' + txt : '');
      ugNote(act);
      return { act: 'took', step: act };
    }

    if (ugLocked()) {
      ugWhy('地下通道还没解锁');
      return { act: 'none', step: '地下通道还没解锁' };
    }

    var bays = ugBays();
    var i, info;

    /* 第一百一十批：删掉「3 只已经选好 → 直接按出发」这条旁路。
       槽位里可能留着上一个主题选好的队伍；游戏每派出去一次就重抽主题，
       原样派出必然与当前主题不符。ready 和 empty 一律交给 ugDeployBay()
       打开选队窗按当前主题重选完再出发。 */
    var emptyBay = null;
    var running = 0;
    for (i = 0; i < bays.length; i++) {
      info = ugBayInfo(bays[i]);
      if ((info.kind === 'empty' || info.kind === 'ready') && !emptyBay) emptyBay = bays[i];
      if (info.kind === 'running') running++;
    }
    // 界面还没渲染出来时退回全局找空位
    if (!bays.length) {
      var anyPlus = document.querySelector('#ug-root .ug-slot.plus');
      if (anyPlus && anyPlus.closest) emptyBay = anyPlus.closest('.ug-bay');
    }

    if (!emptyBay) {
      UG.state = running ? 'running' : 'idle';
      ugWhy(running ? ('探险进行中（' + running + ' / ' + Math.max(running, bays.length) + ' 个槽位）') : '没有可派遣的槽位');
      return { act: 'none', step: '没有可派遣的槽位' };
    }

    if (!force && Date.now() - UG.lastActionAt < 8000) {
      ugWhy('刚操作过，等一下');
      return { act: 'none', step: '刚操作过，等一下' };
    }

    var r = await ugDeployBay(emptyBay);
    if (!r.ok) {
      ugFail(r.step);
      return { act: 'error', step: r.step };
    }
    UG.state = 'idle';
    ugWhy('待命');
    ugNote(r.step);
    return { act: 'sent', step: r.step };
  }

  // 点侧栏（桌面用 #side，窄屏用 #tabs）。raidTab() 也走这个顺序
  function clickScreen(name) {
    var tab = document.querySelector('#side [data-screen="' + name + '"]') ||
      document.querySelector('#tabs [data-screen="' + name + '"]');
    if (!tab) return false;
    try { tab.click(); } catch (e) { return false; }
    return true;
  }

  /* 第五批：全局闪光战斗守卫。所有会切地图 / 切章节的自动化在动手前都要问一句；
   * 守卫自己在捕获阶段也拦下自动化发起的切图点击（玩家手点的不拦）。 */
  function shinyBlocked() {
    try {
      return !!(window.PCG_SHINY_GUARD &&
        typeof window.PCG_SHINY_GUARD.blocked === 'function' &&
        window.PCG_SHINY_GUARD.blocked());
    } catch (e) { return false; }
  }

  /* ---------------- 页面租约（切页仲裁） ----------------
   * 地下通道一次要切页、等动画、再切回来（十几秒），这期间异色团体战 / 传说追踪
   * 都别抢页面，不然互相把对方拽走。
   *
   * 第七十五批：这里升成带优先级的单槽租约，专门管「谁在切页」——
   *   · 培育屋监测（切到培育屋页取蛋 / 催蛋 / 再切回冒险页）和地下通道（切到
   *     地下通道页领奖派遣 / 再切回原页面）是**高优先级（2）**：
   *     它们一动，图鉴捕捉 / 传说追踪 / 稀有道具 / 树果 / 联盟刷钱 / 定点循环
   *     这六个自动化任务立刻停手等它办完，谁也不许趁这几秒把页面拽走；
   *   · 那六个自动化是**低优先级（1）**：它们自己的切图租约顶不掉高优先级，
   *     高优先级占着的时候它们只会排队。
   * 另外给高优先级加了「喊话」（screenWant）：真正动手前先喊一声「我要用页面了」，
   * 六个任务看到就先把手里那一趟收尾，不用等它把页面抢过去才发现。
   * 喊话和租约都带过期时间（模块崩了也不会把别人永久卡死）。 */
  var SCREEN = { owner: '', until: 0, prio: 0, since: 0 };
  var SCREEN_PRIO = { nursery: 2, ug: 2 };
  var PROJ_NAME = {
    nursery: '培育屋监测', ug: '地下通道',
    dex: '图鉴捕捉', leg: '传说追踪', item: '稀有道具刷取',
    berry: '树果刷取', farm: '联盟刷钱', orb: '定点循环',
    market: '黑市', raid: '异色团体战'
  };
  var PAGE_WANT = { owner: '', until: 0 };

  /* 占页面：返回 false 表示「别人（更高优先级）还占着，这一拍没抢到」。
   * 没有优先级参数时按 owner 自动取（培育屋 / 地下通道 = 2，其余 = 1）。
   * 第七十九批：两个高优先级之间改成「先来先办」—— 培育屋取蛋和图鉴 / 树果那些不一样，
   * 它一趟要连点几十下（取蛋 + 催蛋），中途被打断就白跑。所以同优先级时，对方刚占上
   * 的 20 秒内先让一让；再等不到就直接接管，绝不会永久卡住谁。 */
  function screenHold(owner, ms, prio) {
    var t = Date.now();
    var p = typeof prio === 'number' ? prio : (SCREEN_PRIO[owner] || 1);
    if (SCREEN.owner && SCREEN.owner !== owner && t < SCREEN.until) {
      if ((SCREEN.prio || 0) > p) return false;
      if (p >= 2 && (SCREEN.prio || 0) >= 2 && t - (SCREEN.since || 0) < 20000) return false;
    }
    if (SCREEN.owner !== owner) SCREEN.since = t;
    SCREEN.owner = owner;
    SCREEN.until = t + (ms || 120000);
    SCREEN.prio = p;
    return true;
  }

  function screenFree(owner) {
    if (!owner || SCREEN.owner === owner) {
      SCREEN.owner = '';
      SCREEN.until = 0;
      SCREEN.prio = 0;
      SCREEN.since = 0;
    }
    if (!owner || PAGE_WANT.owner === owner) {
      PAGE_WANT.owner = '';
      PAGE_WANT.until = 0;
    }
  }

  /* 高优先级喊话：培育屋 / 地下通道动手前先喊一声，让六个自动化先收手。
   * 默认 25 秒后自动过期（比最慢的那个循环 2.5 秒宽裕很多，模块崩了也不会卡住别人）。 */
  function screenWant(owner, ms) {
    PAGE_WANT.owner = owner;
    PAGE_WANT.until = Date.now() + (ms || 25000);
  }

  /* 别人占着页面（租约），或者别人已经喊话要用页面 —— 都算「这一拍别动」。 */
  function screenBusy(me, now) {
    var t = now || Date.now();
    if (SCREEN.owner && SCREEN.owner !== me && t < SCREEN.until) return true;
    if (PAGE_WANT.owner && PAGE_WANT.owner !== me && t < PAGE_WANT.until) return true;
    return false;
  }

  /* 谁占着页面 / 谁在喊话（给状态栏写「让路给谁」用；自己是占用人时不算） */
  function screenWho(me) {
    var t = Date.now();
    if (SCREEN.owner && SCREEN.owner !== me && t < SCREEN.until) return PROJ_NAME[SCREEN.owner] || SCREEN.owner;
    if (PAGE_WANT.owner && PAGE_WANT.owner !== me && t < PAGE_WANT.until) return PROJ_NAME[PAGE_WANT.owner] || PAGE_WANT.owner;
    return '';
  }

  /* 培育屋监测正在切页 / 正在培育屋页上取蛋催蛋 —— 六个自动化看到就全停 */
  function nurseryBusy() {
    var t = Date.now();
    return (SCREEN.owner === 'nursery' && t < SCREEN.until) ||
      (PAGE_WANT.owner === 'nursery' && t < PAGE_WANT.until);
  }

  // 需要动手时切到地下通道页，办完再切回去
  async function ugWithScreen(fn) {
    var tab = ugTab();
    if (!tab) return { ok: false, text: '游戏还没加载完，等两秒再点' };
    if (ugTabLocked(tab)) {
      ugWhy('地下通道还没解锁');
      return { ok: false, text: '地下通道还没解锁' };
    }

    var switched = false;
    var prev = '';
    /* 第七十五批：先喊话再占页面。哪怕已经停在地下通道页也要占 ——
     * 下面这会点按钮、等动画、再切回去，这几秒六个自动化一律不许动页面。
     * 第七十九批：培育屋正在取蛋 / 催蛋时（同优先级、刚开始占）先让一让，
     * 别把页面从它手里当场拽走；让不到就接管，不会卡死。 */
    screenWant('ug', 25000);
    if (!screenHold('ug', 180000)) {
      screenFree('ug');                       // 连「我要用页面了」一起撤回
      UG.backoffUntil = Date.now() + 20000;
      ugWhy('培育屋正在取蛋 / 催蛋，等它办完再来');
      return { ok: false, text: '培育屋正在用页面，等一下再来' };
    }
    try {
      if (!ugActive()) {
        prev = activeScreenName();
        tab.click();
        await sleep(1500);
        if (!ugActive()) {
          UG.backoffUntil = Date.now() + 10 * 60 * 1000;
          ugWhy('切不到地下通道页');
          ugNote('切不到地下通道页，10 分钟后再试');
          return { ok: false, text: '切不到地下通道页' };
        }
        await sleep(500);
        switched = true;
      }

      return await fn();
    } finally {
      if (switched && prev && prev !== 'underground') {
        if (clickScreen(prev)) {
          await sleep(250);
          // 回到团体战页时必须落在「异色团体战」那一层，不然数据读不到
          if (prev === 'raid' && !document.querySelector('#screen-raid .rc-card[data-rc]')) {
            var chromaBtn = document.querySelector('#screen-raid [data-raid-page="chroma"]');
            if (chromaBtn) {
              try { chromaBtn.click(); } catch (e) { /* ignore */ }
              await sleep(200);
            }
          }
        } else {
          var back = document.querySelector('#tabs [data-screen="' + prev + '"]');
          if (back) back.click();
        }
        await sleep(150);
      }
      screenFree('ug');     // 交还页面，团体战 / 传说追踪可以接着切了
    }
  }

  // 探险结束的结算弹窗：游戏里长这样（className 就带 ug-back）
  //   <div class="modal dexcard-modal oc-modal ug-back">
  //     <div class="modal-actions"><button class="btn gold">Super ! / 太棒了！</button></div>
  // 战利品在弹出时就已经进背包了，这颗按钮只是「知道了」，所以可以直接点掉。
  var UGREP = { seenAt: 0, at: 0, tries: 0 };

  // 结算弹窗里的战利品清单：<div class="ug-back-li"><span>名字</span><b>×N</b></div>
  // 主战利品、里程碑、化石各有一块 .ug-back-loot，全都要读
  function ugLootText(box) {
    var rows = box.querySelectorAll('.ug-back-loot .ug-back-li');
    var out = [], i;
    for (i = 0; i < rows.length; i++) {
      var nm = rows[i].querySelector('span');
      var ct = rows[i].querySelector('b');
      var name = nm ? String(nm.textContent || '').trim() : '';
      if (!name) continue;
      var num = ct ? String(ct.textContent || '').trim() : '';
      var one = name + (num ? ' ' + num : '');
      if (out.indexOf(one) < 0) out.push(one);
    }
    var txt = out.join('、');
    if (txt.length > 120) txt = txt.slice(0, 118) + '…';
    return txt;
  }

  /* 第五十五批：「战利品弹窗自动关掉」只有在地下通道功能启动时才生效。
   * 没点过「一键派遣」（自动开关 / 武装标记三者都是 false）时，结算框完全留给玩家自己点。 */
  function ugRunning() {
    return !!(settings.autoUnderground || settings.ugArmed || UG.armed);
  }

  function ugReportTick(now) {
    if (!settings.ugAutoClose || !ugRunning()) return;

    var box = document.querySelector('.ug-back');
    if (!box) {
      if (UGREP.seenAt) { UGREP.seenAt = 0; UGREP.at = 0; UGREP.tries = 0; }
      return;
    }
    if (!UGREP.seenAt) { UGREP.seenAt = now; return; }   // 刚弹出来，先让奖励动画放一下
    if (now - UGREP.seenAt < 1200) return;
    if (UGREP.tries >= 6) return;
    if (now - UGREP.at < 1500) return;

    var btn = box.querySelector('.modal-actions .btn') ||
      box.querySelector('.modal-actions button') ||
      box.querySelector('button.btn.gold');
    if (!btn || btn.disabled) return;

    UGREP.at = now;
    UGREP.tries++;
    try { btn.click(); } catch (e) { /* ignore */ }

    var loot = ugLootText(box);
    if (loot) {
      log('地下通道战利品：' + loot);
    } else {
      var txt = (btn.textContent || '').trim().slice(0, 12);
      log('地下通道：战利品到手，关掉结算弹窗' + (txt ? '（' + txt + '）' : ''));
    }
    ugNote('战利品已收，结算弹窗自动关掉了');
  }

  /* 第七十九批：跨天自动恢复。
   * 昨天的探险次数用完后 ugCheckDayDone() 会调 ugOff()，把 autoUnderground / ugArmed
   * 一起写成 false —— 那是持久化在 chrome.storage.sync 里的，于是「长期离线，第二天
   * 重进游戏」时地下通道一动也不动：不去领奖、也不派遣，要玩家手点一次「一键派遣」。
   * 这里按「ugDoneDay 还是过去的日期」判定它不是玩家手动停的，自动重新武装。
   * 玩家手动点「停止自动派遣」时 ugStop() 会把 ugDoneDay 清掉，所以不会被误恢复。 */
  function ugResumeIfNewDay() {
    var day = raidDayId();
    var d = String(settings.ugDoneDay || '');
    if (!d || d === day) return false;
    settings.ugDoneDay = '';
    settings.autoUnderground = true;
    settings.ugArmed = true;
    UG.armed = true;
    UG.doneDay = '';
    UG.nextCheckAt = 0;
    UG.backoffUntil = 0;
    UG.lastCycleAt = 0;
    try {
      SYNC.set({ ugDoneDay: '', autoUnderground: true, ugArmed: true });
    } catch (e) { /* ignore */ }
    ugWhy('新的一天，次数刷新了，自动接着领奖 + 派遣');
    log('地下通道：换天了（' + d + ' → ' + day + '），次数已刷新，自动恢复领奖 + 派遣');
    return true;
  }

  async function ugCycle() {
    if (UG.busy) return;
    if (!settings.autoUnderground) {
      /* 先看是不是「昨天次数用完自动关的」——是就自己打开，继续领奖派遣 */
      if (ugResumeIfNewDay()) return;
      if (!UG.armed && !UG.sends && !UG.takes) ugWhy('还没开启，点「一键派遣」开始');
      else ugWhy('自动已关闭');
      return;
    }
    if (!ugTab()) { ugWhy('游戏还没加载完'); return; }
    if (ugDialogOpen()) { ugWhy('有弹窗挡着，等你关掉'); return; }

    // 正在和要追的那只神兽打：别这时候把页面拽走
    if (settings.legendaryId) {
      var lid = legTargetId();
      if (lid && legFoe(lid)) { ugWhy('正在抓神兽，等这场打完'); return; }
    }

    var now = Date.now();
    if (now < UG.backoffUntil) {
      ugWhy('退避中，约 ' + Math.max(1, Math.ceil((UG.backoffUntil - now) / 60000)) + ' 分钟后重试');
      return;
    }
    if (now - UG.lastCycleAt < 3500) return;

    // 有队伍到点了就跳过去收一趟，不等「检查间隔」
    ugDueTrip(now);

    // 其它时候用「检查间隔」（默认 10 分钟）
    if (now < UG.nextCheckAt) return;

    UG.lastCycleAt = now;
    UG.busy = true;
    try {
      var res = null;
      var acts = { took: 0, sent: 0 };
      await ugWithScreen(async function () {
        UG.state = 'working';
        var startedAt = Date.now();
        // 地下通道优先：这一轮先把该干的活干完——收探险奖励，再把还有空位/有次数的槽位全部派出去。
        // 整个过程 UG.busy 一直是 true，传说追踪和异色团体战看到它就会排队等。
        for (var step = 0; step < 8; step++) {
          var r = await ugWork(true);
          res = r;
          if (r.act === 'took') acts.took++;
          else if (r.act === 'sent') acts.sent++;
          if (r.act !== 'took' && r.act !== 'sent') break;
          if (Date.now() - startedAt > 45000) break;   // 最多忙 45 秒，别一直占着
          await sleep(500);
        }
        ugCheckDayDone();
        return { ok: true };
      });
      if (acts.took || acts.sent) {
        log('地下通道：' +
          (acts.took ? '收了 ' + acts.took + ' 次奖励' : '') +
          (acts.took && acts.sent ? '，' : '') +
          (acts.sent ? '派出 ' + acts.sent + ' 个槽位' : ''));
      }
      if (res && res.act === 'none') {
        UG.nextCheckAt = Date.now() + ugCheckMs();
      }
    } catch (e) {
      log('地下通道：' + ((e && e.message) || e));
    } finally {
      UG.state = 'idle';
      UG.busy = false;
    }
  }

  // 弹窗里的「一键派遣」：把所有空槽位一次派满，并把自动模式打开
  // 停止自动派遣：把开关和武装都清掉，已经派出去的队伍照旧跑
  function ugStop() {
    var was = !!(settings.autoUnderground || settings.ugArmed || UG.armed);
    ugOff('已停止自动派遣（要重新开始就点「一键派遣」）');
    /* 第七十九批：手动停止 → 清掉「次数用完」的日期标记，免得第二天被
     * ugResumeIfNewDay() 当成「昨天自动关的」又自己打开。 */
    settings.ugDoneDay = '';
    UG.doneDay = '';
    try { SYNC.set({ ugDoneDay: '' }); } catch (e) { /* ignore */ }
    return was
      ? { ok: true, text: '已停止自动派遣' }
      : { ok: false, text: '本来就没在自动派遣' };
  }

  async function ugManual() {
    if (UG.busy) return { ok: false, text: '正在自动处理，稍等一下再点' };

    // 今天的次数已经用完（并且奖励都领过）→ 到刷新前都开不了
    var day = raidDayId();
    if ((UG.doneDay && UG.doneDay === day) || (settings.ugDoneDay && settings.ugDoneDay === day)) {
      UG.doneDay = day;
      ugOff('今天的探险次数用完了，等刷新后再开');
      return { ok: false, text: '今天的探险次数已经用完了，等刷新（巴黎 0 点）后再开' };
    }

    if (!settings.autoUnderground) {
      settings.autoUnderground = true;
      try { SYNC.set({ autoUnderground: true }); } catch (e) { /* ignore */ }
    }

    UG.busy = true;
    UG.lastCycleAt = Date.now();
    UG.armed = true;
    if (!settings.ugArmed) {
      settings.ugArmed = true;
      try { SYNC.set({ ugArmed: true }); } catch (e) { /* ignore */ }
    }
    try {
      var r = await ugWithScreen(async function () {
        var out = await ugDeployAll();
        ugCheckDayDone();            // 派不出去 + 没奖励 = 今天用完了，顺手关掉
        return out;
      });
      if (!r || typeof r.text !== 'string') return { ok: false, text: '没反应，稍后再点' };
      // 派完发现今天的次数已经用完 → 就按「用完了」回话，别显示「没有空槽位」
      if (UG.doneDay && UG.doneDay === raidDayId()) {
        return { ok: false, text: '今天的探险次数已经用完了，等刷新（巴黎 0 点）后再开' };
      }
      if (r.ok === false) ugWhy(r.text);
      else { ugWhy('待命'); ugNote(r.text); }
      return { ok: r.ok !== false, text: r.text };
    } catch (e) {
      var msg = '出错了：' + ((e && e.message) || e);
      ugWhy(msg);
      return { ok: false, text: msg };
    } finally {
      UG.busy = false;
      UG.state = 'idle';
    }
  }

  /* ---------------- 断线自愈 ---------------- */
  function requestReconnect(now) {
    S.reconnectTries++;
    S.reconnects++;
    var delay = Math.min(60000, 8000 + S.reconnectTries * 6000);
    S.nextRetryAt = now + delay;
    // 第一次温柔地催一下（online 事件），后面更狠一点（关掉假在线的 socket）
    sendToPage(S.reconnectTries >= 2 ? 'reconnect-hard' : 'reconnect');
    log('第 ' + S.reconnectTries + ' 次尝试重连');
  }

  // 刷新记录存 sessionStorage：页面一刷新内存就没了，网络真断的时候会变成每分钟刷一次
  function reloadHistory() {
    var now = Date.now();
    var out = [];
    try {
      var v = JSON.parse(sessionStorage.getItem('pcgReloads') || '[]');
      if (Array.isArray(v)) out = v.filter(function (t) { return typeof t === 'number'; });
    } catch (e) { out = []; }
    out = out.filter(function (t) { return now - t < 1800000; });
    return out;
  }

  function saveReloadHistory(hist) {
    try { sessionStorage.setItem('pcgReloads', JSON.stringify(hist.slice(-6))); } catch (e) { /* ignore */ }
  }

  function reloadGame(reason) {
    var now = Date.now();
    var hist = reloadHistory();
    S.reloadHistory = hist;
    if (hist.length >= 2) {
      if (!S.reloadBlocked) {
        S.reloadBlocked = true;
        log('30 分钟内已自动刷新 2 次，暂停自动刷新，请手动检查网络');
      }
      return;
    }
    if (S.lastReloadAt && now - S.lastReloadAt < 20000) return;
    hist.push(now);
    saveReloadHistory(hist);
    S.reloadHistory = hist;
    S.lastReloadAt = now;
    S.reloads++;
    log('自动刷新页面（' + reason + '）');
    notifyBackground(true);
    try { location.reload(); } catch (e) { /* ignore */ }
  }

  // 1000 / 1001 / 1005 = 干净关闭：游戏自己把实时连接收掉了
  //   1000 正常关闭；1001 页面/客户端要走；1005 关闭时没带状态码（Supabase 的
  //   removeChannel 常见）。这三种都不是网络掉了，不能拿来当断线证据。
  function cleanClose() {
    return S.lastCloseAt > 0 &&
      (S.lastCloseCode === 1000 || S.lastCloseCode === 1001 || S.lastCloseCode === 1005);
  }

  function handleSockets(now) {
    var connected = S.wsOpen > 0;
    if (connected) {
      if (S.downSince) log('连接已恢复');
      S.downSince = 0;
      S.nextRetryAt = 0;
      S.reconnectTries = 0;
      S.connected = true;
      return;
    }

    // 游戏按需开实时连接（进交换页、有待处理的好友请求时才连），离开那些页面它会
    // 自己 removeChannel 把连接关掉（关闭码 1000）。这是游戏自己的决定，不是掉线；
    // 以前把「连接数为 0」一律当掉线，于是 60 秒 / 3 分钟一到就整页刷新，
    // 表现就是「游戏总是莫名自己刷新重启」。
    if (cleanClose()) {
      if (S.downSince) log('实时连接是游戏自己关掉的，不算断线');
      S.downSince = 0;
      S.nextRetryAt = 0;
      S.reconnectTries = 0;
      S.connected = true;
      return;
    }

    S.connected = false;
    if (!S.downSince) {
      S.downSince = now;
      S.downWhy = S.lastCloseCode
        ? ('关闭码 ' + S.lastCloseCode + (S.lastCloseClean ? ' · 正常关闭' : ' · 异常断开'))
        : '还没连上过';
      log('连接断开，开始自愈（' + S.downWhy + '）');
    }
    var down = now - S.downSince;

    // 不设次数上限：以前 8 次就停手，只能靠刷新页面兜底；现在刷新更矜持，
    // 就让催促一直慢慢来（间隔封顶 60 秒），真断网时它自己会停。
    if (settings.autoReconnect && down >= 8000 && now >= S.nextRetryAt) {
      requestReconnect(now);
    }

    // 点「立即重连」以后 9 秒还没回来：光催游戏是催不动的，直接整页刷新
    // 手动点「立即重连」：这是用户自己要求的，等 15 秒再刷，别刚催就重启
    if (settings.autoReload && S.manualAt && now - S.manualAt >= 15000) {
      S.manualAt = 0;
      reloadGame('点了立即重连，15 秒还没连上');
      return;
    }

    // 什么时候值得整页刷新：
    //   1. 异常断开（1000 以外 / 不是干净关闭）挂了 60 秒；
    //   2. 不管什么原因，整整 3 分钟没有一条连接 —— 正常游戏不会这样；
    //   3. 8 次重连都试完还没好。
    // 刚打开页面 90 秒内不刷新：游戏自己还在加载（慢网络下加载一两分钟很正常）
    if (now - (S.startedAt || now) < 90000) return;

    // 只剩异常关闭（1006 这种）才值得考虑整页刷新；干净关闭已经在上面拦掉了。
    // 而且还要第二条证据：游戏真的一个请求都发不出去（网络层面也断了），
    // 否则说明游戏只是不用那条实时连接，页面对它来说完全正常，刷新纯属添乱。
    var abnormal = S.lastCloseAt > 0 && !cleanClose();
    var netAgo = S.lastNetAt ? now - S.lastNetAt : Infinity;
    var why = '';
    if (abnormal && S.reconnectTries >= 2 && down >= 180000 && netAgo >= 180000) {
      why = S.lastNetAt
        ? '断线 ' + Math.round(down / 1000) + ' 秒，而且 ' + Math.round(netAgo / 1000) + ' 秒没有一个请求成功'
        : '断线 ' + Math.round(down / 1000) + ' 秒，页面也一直没能成功请求';
    }
    if (settings.autoReload && why) reloadGame(why);
  }

  function handleBootFail(now) {
    var box = document.getElementById('boot-fail');
    if (!box) { S.bootFailAt = 0; return; }
    if (!S.bootFailAt) S.bootFailAt = now;
    if (!settings.autoRetryBoot) return;
    if (now - S.bootFailAt < 6000) return;                       // 先给它自己恢复的机会
    if (S.lastBootRetryAt && now - S.lastBootRetryAt < 30000) return;
    var btn = box.querySelector('button');
    if (!btn) return;
    S.lastBootRetryAt = now;
    S.bootRetries++;
    log('游戏加载失败，自动点了一次重试');
    try { btn.click(); } catch (e) { /* ignore */ }
  }

  function handleMissingApp(now) {
    var app = document.getElementById('app');
    if (app) { S.noAppSince = 0; return; }
    if (!S.noAppSince) S.noAppSince = now;
    if (!settings.autoReload) return;
    if (document.readyState !== 'complete') return;   // 还在加载就先别打断它
    if (now - S.noAppSince < 30000) return;
    if (document.getElementById('boot-fail')) return; // 已经在走 boot 失败的重试
    reloadGame('游戏外壳 30 秒未加载');
  }

  /* ---------------- 传说宝可梦追踪 ---------------- */
  var LEG = {
    busy: false,
    armed: false,                                   // 点了「立即前往」才开始，光选不算
    target: 0,
    status: 'idle',
    why: '还没选神兽',
    ch: null,
    until: 0,
    caught: [],
    inBattle: false,
    afterFight: false,
    lastCycleAt: 0,
    lastNudgeAt: 0,
    lastMapAt: 0,
    attempt: null,                                  // 当前这次追击 {ch, at}
    doneFor: 0,                                     // 已经计入"成功"的那只
    // 战绩按「哪只神兽」分开记，换一只就从零开始
    statsById: {},                                  // { [id]: { tries, win, lose, since } }
    stats: { tries: 0, win: 0, lose: 0, since: Date.now() }
  };

  // 取某只神兽的战绩（没有就建一份）
  function legStatsOf(id) {
    var key = String(id || 0);
    if (!key || key === '0') return LEG.stats;
    var s = LEG.statsById[key];
    if (!s) {
      s = { tries: 0, win: 0, lose: 0, since: Date.now() };
      LEG.statsById[key] = s;
    }
    return s;
  }

  // 当前正在追的那只的战绩（面板显示用）
  function legStatsNow() {
    var id = legTargetId();
    return id ? legStatsOf(id) : { tries: 0, win: 0, lose: 0, since: Date.now() };
  }

  // 游戏 ROAMING.GROUPS 里的六只游走神兽
  var LEG_MONS = [
    { id: 243, name: '雷公', group: 'johto', types: ['electric'] },
    { id: 244, name: '炎帝', group: 'johto', types: ['fire'] },
    { id: 245, name: '水君', group: 'johto', types: ['water'] },
    { id: 380, name: '拉帝亚斯', group: 'hoenn', types: ['dragon', 'psychic'] },
    { id: 381, name: '拉帝欧斯', group: 'hoenn', types: ['dragon', 'psychic'] },
    { id: 481, name: '艾姆利多', group: 'sinnoh', types: ['psychic'] },
    { id: 641, name: '龙卷云', group: 'unova', types: ['flying'] },
    { id: 642, name: '雷电云', group: 'unova', types: ['electric', 'flying'] }
  ];
  var LEG_BADGE = { johto: 'Maître Johto', hoenn: 'Maître Hoenn', sinnoh: 'Maître Sinnoh', unova: 'Maître Unys' };
  var LEG_REGION_ZH = { johto: '城都', hoenn: '丰缘', sinnoh: '神奥', kanto: '关都', unova: '合众' };

  // 各地区的第一个章节（STORY.CHAPTERS：关都 0-13 / 城都 14-30 / 丰缘 31-47 / 神奥 48-65）
  var LEG_REGION_FIRST = { kanto: 0, johto: 14, hoenn: 31, sinnoh: 48, unova: 66 };
  var LEG_REGION_LAST = { kanto: 13, johto: 30, hoenn: 47, sinnoh: 65, unova: 83 };

  // 「城都 第 7 章」这种叫法
  function legChLabel(region, ch) {
    if (typeof ch !== 'number' || ch < 0) return '—';
    var first = LEG_REGION_FIRST[region] || 0;
    var n = ch - first + 1;
    if (n < 1) return '第 ' + (ch + 1) + ' 章';
    return (LEG_REGION_ZH[region] || region) + ' 第 ' + n + ' 章';
  }

  // 同一地区里挑一个「现在没有神兽」的章节，用来绕一下再回来重开
  function legNeutralCh(region, avoidCh) {
    var st = legRead();
    if (!st) return -1;

    var first = LEG_REGION_FIRST[region];
    var last = LEG_REGION_LAST[region];
    if (typeof first !== 'number' || typeof last !== 'number') return -1;

    var busy = {};
    Object.keys(st.at).forEach(function (k) {
      var slot = st.at[k];
      if (slot && typeof slot.ch === 'number') busy[slot.ch] = 1;
    });

    var best = -1;
    for (var ch = first; ch <= last; ch++) {
      if (ch === avoidCh || busy[ch]) continue;
      if (st.unlocked >= 0 && ch > st.unlocked) continue;
      if (best < 0 || Math.abs(ch - avoidCh) < Math.abs(best - avoidCh)) best = ch;
    }
    return best;
  }

  function legTargetId() {
    var n = parseInt(settings.legendaryId, 10);
    return isFinite(n) && n > 0 ? n : 0;
  }

  function legGroupOf(id) {
    for (var i = 0; i < LEG_MONS.length; i++) {
      if (LEG_MONS[i].id === id) return LEG_MONS[i].group;
    }
    return '';
  }

  // 场上有没有人（快速信号：只看 DOM）
  function legDomBattle() {
    if (document.querySelector('#enemy-slot .enemy')) return true;
    var hud = document.getElementById('enemy-hud');
    return !!(hud && !hud.hidden);
  }

  // 从图片地址里认精灵编号（普通立绘和神兽原画的路径规则不一样）
  function legIdFromSrc(src) {
    if (!src) return 0;
    var clean = String(src).split('?')[0].split('#')[0];
    var file = clean.substring(clean.lastIndexOf('/') + 1);
    var m = /^(\d+)/.exec(file);
    if (m) return Number(m[1]);
    m = /(\d+)\.(?:png|webp|jpe?g|gif)/i.exec(clean);
    return m ? Number(m[1]) : 0;
  }

  // 场上有没有这只神兽；有就返回它的血条百分比
  function legFoe(id) {
    var cards = document.querySelectorAll('#enemy-slot .enemy');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      if (card.classList.contains('fxclone')) continue;
      var img = card.querySelector('img');
      var fid = legIdFromSrc(img && (img.getAttribute('src') || img.getAttribute('data-src')));
      if (fid !== id) continue;
      var bar = card.querySelector('.hp > div');
      var hp = bar && bar.style.width ? parseFloat(bar.style.width) : 100;
      return { hp: isFinite(hp) ? hp : 100 };
    }
    return legSaveFoe(id);
  }

  // 备用：直接看存档里这一场仗的敌人（只在正打着、且卡片认不出来时才用）
  function legSaveFoe(id) {
    if (!legDomBattle()) return null;

    // 卡片上明确写着是别人 → 别听存档的
    var cards = document.querySelectorAll('#enemy-slot .enemy');
    for (var c = 0; c < cards.length; c++) {
      var cimg = cards[c].querySelector('img');
      var cid = legIdFromSrc(cimg && (cimg.getAttribute('src') || cimg.getAttribute('data-src')));
      if (cid && cid !== id) return null;
    }

    var save = ugSave();
    var b = save && save.adv && save.adv.battle;
    if (!b) return null;
    var foes = b.enemies || b.foes || [];
    for (var i = 0; i < foes.length; i++) {
      var f = foes[i];
      if (!f || Number(f.id) !== id) continue;
      var hp = Number(f.hp);
      var max = Number(f.maxHp) || Number(f.hpMax) || 0;
      var pct = max > 0 ? (hp / max) * 100 : (hp > 0 ? 60 : 0);
      return { hp: Math.max(0, Math.min(100, pct)) };
    }
    return null;
  }

  function legScreenActive(name) {
    var el = document.getElementById('screen-' + name);
    return !!(el && el.classList.contains('active'));
  }

  function legClock(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var m = Math.floor(s / 60);
    return m + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
  }

  // 从存档读游走状态：roam.at = {id:{ch,until}}，roam.caught = [id...]
  function legRead() {
    var save = ugSave();
    if (!save) return null;
    var roam = save.roam || {};
    var adv = save.adv || {};
    var stats = save.stats || {};
    return {
      at: roam.at || {},
      caught: (roam.caught || []).map(Number),
      badges: adv.badges || [],
      chapter: typeof adv.chapter === 'number' ? adv.chapter : null,
      unlocked: typeof adv.unlocked === 'number' ? adv.unlocked : -1,
      deaths: adv.deaths || {},
      dex: save.dex || {},
      wins: Number(stats.wins) || 0,
      battles: Number(stats.battles) || 0
    };
  }

  // 开打时记一份战绩快照，打完对比
  function legSnap(ch) {
    var st = legRead();
    if (!st) return { wins: 0, deaths: 0, battles: 0 };
    return {
      wins: st.wins,
      battles: st.battles,
      deaths: ch == null ? 0 : (Number(st.deaths[ch]) || 0)
    };
  }

  /* 神兽这一场的记录：开打 → 打完 */
  var LEGW = { id: 0, hp: 100, ko: false, ch: null, snap: null, endedAt: 0 };

  function legFightStart(id) {
    LEGW.id = id;
    LEGW.hp = 100;
    LEGW.ko = false;
    LEGW.ch = LEG.ch;
    LEGW.snap = legSnap(LEG.ch);
    LEGW.endedAt = 0;
  }

  // 打完结算：血条归零 / 存档 wins+1 = 打赢；本章 deaths+1 或 battles+1 没赢 = 被打输
  function legFightEnd() {
    var st = legRead();
    var snap = LEGW.snap || { wins: 0, battles: 0, deaths: 0 };
    var won = LEGW.ko;
    if (st && st.wins > snap.wins) won = true;

    var lost = false;
    if (!won && st && LEGW.ch != null) {
      if ((Number(st.deaths[LEGW.ch]) || 0) > snap.deaths) lost = true;
    }
    if (!won && !lost && st && snap.battles > 0 && st.battles > snap.battles) lost = true;

    if (won || lost) {
      var st2 = legStatsOf(LEGW.id || legTargetId());
      if (won) st2.win++;
      else st2.lose++;
      if (lost) {
        log('传说追踪：被 ' + legNameOf(LEGW.id || legTargetId()) + ' 打败了（第 ' + st2.lose + ' 次），切走再切回来重开');
      }
    }

    if (lost && typeof LEGW.ch === 'number') {
      LEG.dSnapCh = LEGW.ch;      // 这次已经算过了，别再被「阵亡数涨了」重复触发
      LEG.dSnapN = Number((st && st.deaths ? st.deaths[LEGW.ch] : 0)) || 0;
    }

    LEGW.id = 0;
    LEGW.hp = 100;
    LEGW.ko = false;
    LEGW.snap = null;
    LEGW.endedAt = 0;

    // 打完立刻回地图看它在哪
    LEG.afterFight = true;
    LEG.lastCycleAt = 0;
  }

  // 本章的阵亡数涨了 = 刚打输一场。这条只看存档里的计数，
  // 不会被「敌人卡片没删掉」那种假象骗到，是「输了要重开」最可靠的信号。
  function legDeathsBump(st) {
    var ch = (typeof LEG.ch === 'number' && LEG.ch >= 0) ? LEG.ch
      : (st && typeof st.chapter === 'number' ? st.chapter : -1);
    if (ch < 0) return false;
    var n = Number((st && st.deaths ? st.deaths[ch] : 0)) || 0;
    if (LEG.dSnapCh !== ch) {
      LEG.dSnapCh = ch;
      LEG.dSnapN = n;
      return false;
    }
    if (n <= (LEG.dSnapN || 0)) {
      LEG.dSnapN = n;
      return false;
    }
    LEG.dSnapN = n;
    return true;
  }

  // 这一场到底还在不在打：以存档 adv.battle 为准。
  // 打完以后游戏不会把敌人卡片从 DOM 里删掉，只看卡片会一直以为「还在打」。
  function legBattleLive(id) {
    var save = null;
    try { save = ugSave(); } catch (e) { save = null; }
    var b = save && save.adv && save.adv.battle;
    if (b) {
      var foes = b.enemies || b.foes || [];
      if (foes.length) {
        for (var i = 0; i < foes.length; i++) {
          var f = foes[i];
          if (f && Number(f.id) === id && Number(f.hp) > 0) return true;
        }
        return false;   // 存档里这一场没有它（或它已经倒了）
      }
    }
    if (!legDomBattle()) return false;
    var foe = legFoe(id);
    return !!(foe && foe.hp > 0.5);
  }

  function legNameOf(id) {
    for (var i = 0; i < LEG_MONS.length; i++) {
      if (LEG_MONS[i].id === id) return LEG_MONS[i].name;
    }
    return '神兽';
  }

  // 400ms 看一眼：神兽在场就盯血条，离场就结算
  function legWatch() {
    var id = legTargetId();
    if (!id) {
      if (LEGW.id) { LEGW.id = 0; LEGW.endedAt = 0; LEGW.snap = null; }
      return;
    }

    var live = legBattleLive(id);
    var foe = live ? legFoe(id) : null;

    if (live) {
      if (!LEGW.id) legFightStart(id);
      else if (foe && foe.hp < LEGW.hp) LEGW.hp = foe.hp;
      if (foe && foe.hp <= 1) LEGW.ko = true;
      LEGW.endedAt = 0;
      return;
    }

    if (!LEGW.id) return;

    if (!LEGW.endedAt) {
      LEGW.endedAt = Date.now();
      if (LEGW.hp <= 1) LEGW.ko = true;
      return;
    }

    // 留 2 秒给存档写入，再结算
    if (Date.now() - LEGW.endedAt > 2000) legFightEnd();
  }

  function legPicks() {
    var st = legRead();
    var caught = st ? st.caught : [];
    var badges = st ? st.badges : [];
    var at = st ? st.at : {};
    var dex = st ? st.dex : {};
    return LEG_MONS.map(function (m) {
      var slot = at[m.id] || at[String(m.id)];
      var ch = slot && typeof slot.ch === 'number' ? slot.ch : -1;
      var first = LEG_REGION_FIRST[m.group] || 0;
      var local = ch >= 0 ? ch - first + 1 : 0;
      return {
        id: m.id,
        name: m.name,
        types: (m.types || []).slice(),
        region: m.group,
        regionLabel: LEG_REGION_ZH[m.group] || m.group,
        locked: badges.indexOf(LEG_BADGE[m.group]) < 0,
        caught: caught.indexOf(m.id) >= 0,
        got: caught.indexOf(m.id) >= 0 || !!dex[m.id],
        where: local > 0 ? local : 0,                 // 该地区的第几章
        until: slot ? (Number(slot.until) || 0) : 0,  // 它换下一个地方的时刻
        ch: ch
      };
    });
  }

  function legMapTab() {
    return document.querySelector('#tabs [data-screen="map"]');
  }

  function legShowAdventure() {
    var tab = document.querySelector('#tabs [data-screen="adventure"]');
    var scr = document.getElementById('screen-adventure');
    if (tab && scr && !scr.classList.contains('active')) tab.click();
  }

  // 切到地图（已经在地图就不动）
  async function legOpenMap() {
    var mapTab = legMapTab();
    if (!mapTab) return false;
    if (!legScreenActive('map')) {
      mapTab.click();
      await sleep(900);
    }
    return true;
  }

  // 地图上切到某个地区的章节列表（已解锁的地区点卡片就切过去了）
  async function legShowRegion(region) {
    if (!await legOpenMap()) return false;
    if (document.querySelector('.rg.open[data-rg="' + region + '"].active')) return true;

    var card = null;
    for (var i = 0; i < 5; i++) {
      card = document.querySelector('.rg.open[data-rg="' + region + '"]');
      if (card) break;
      await sleep(400);
    }
    if (!card) return false;

    card.click();
    await sleep(1000);
    return true;
  }

  // 在当前地区里点开某一章 → 出发 / 继续
  async function legHop(ch, region) {
    if (!await legOpenMap()) return false;
    var row = await legFindRow(ch);
    if (!row && region && await legShowRegion(region)) row = await legFindRow(ch);
    if (!row) return false;
    row.click();
    await sleep(700);
    var go = await legFindGo(ch);
    if (!go) return false;
    go.click();
    await sleep(700);
    return true;
  }

  // 切到地图 → 选中那一章 → 点「出发 / 继续」；不在目标地区就先过去
  async function legGo(ch, id) {
    // 第五批：闪光战斗没结算完，绝不切图（守卫同时会在捕获阶段兜底拦点击）
    if (shinyBlocked()) { LEG.why = '闪光战斗还没结束，暂不切图'; return false; }
    if (!await legOpenMap()) return false;

    var region = legGroupOf(id);
    var row = await legFindRow(ch);

    // 1) 先在地图上切地区（已解锁的地区：点地区卡片）
    if (!row && region) {
      if (await legShowRegion(region)) row = await legFindRow(ch);
      if (row) LEG.why = '已切到' + (LEG_REGION_ZH[region] || region) + '，进' + legChLabel(region, ch);
    }

    // 2) 还不行，多半是从没去过的地区：走「Partir pour X」卡片 + 确认弹窗
    if (!row && region) {
      LEG.status = 'travel';
      LEG.why = '前往' + (LEG_REGION_ZH[region] || region) + '地区';
      var ok = await legGoRegion(region);
      if (!ok) {
        LEG.why = '进不去' + (LEG_REGION_ZH[region] || region) + '地区，可能还没解锁';
        return false;
      }
      await sleep(1200);
      await legOpenMap();
      row = await legFindRow(ch);
    }

    if (!row) return false;

    row.click();
    await sleep(700);

    var go = await legFindGo(ch);
    if (!go) return false;

    go.click();
    await sleep(700);
    return true;
  }

  async function legFindRow(ch) {
    var row = null;
    for (var i = 0; i < 6; i++) {
      row = document.querySelector('.mp-row[data-ch="' + ch + '"]') ||
        document.querySelector('#screen-map .mp-row[data-ch="' + ch + '"]');
      if (row) return row;
      await sleep(400);
    }
    return null;
  }

  async function legFindGo(ch) {
    var go = null;
    for (var j = 0; j < 6; j++) {
      go = document.querySelector('.mp-go[data-go="' + ch + '"]:not([disabled])') ||
        document.querySelector('#screen-map .mp-go[data-go="' + ch + '"]:not([disabled])');
      if (go) return go;
      await sleep(400);
    }
    return null;
  }

  // 回神兽那一章 + 同一地区的绕行章节（只在本地区里找没神兽的章）
  function legRestartPlan(ch, id) {
    var region = legGroupOf(id) || 'kanto';
    var neutral = legNeutralCh(region, ch);
    /* 第七批：找不到本地区中立章时，交给通用切图引擎挑一个最近的中立章，
     * 而不是一律绕回关都第 1 章；这套引擎现在所有切图功能共用。
     * 第二十三批：引擎同样只在本地区里挑，并且避开正有神兽的章节。 */
    if (neutral < 0) {
      var CYCLE = window.PCG_MAP_CYCLE || null;
      var st = legRead();
      if (CYCLE && typeof CYCLE.neutralChapter === 'function') {
        neutral = CYCLE.neutralChapter(ch, st
          ? { adv: { unlocked: st.unlocked, chapter: ch }, roam: { at: (st.at || {}) } }
          : null);
      }
    }
    if (neutral >= 0 && neutral !== ch) {
      return { hop: neutral, region: region, label: legChLabel(region, neutral) };
    }
    /* 本地区只有它这一章（或者别的章都被神兽占着）：不绕了，直接重进这一章。
     * 绝不跨地区——跨地区切图还要过「出发去某地区」的确认弹窗，又慢又容易点歪。 */
    return { hop: -1, region: region, label: '' };
  }

  // 游戏只在「换章节」时才重开一轮 —— 所以先绕去本地区别的章节，再回神兽那一章
  // v1.32：人已经在神兽那一章时，优先点游戏新增的「重新挑战」按钮直接重开一轮
  // （一次点击 = 重建本章节点），按钮不可用再走老的绕章逻辑。
  async function legRestart(ch, id) {
    var CYCLE = window.PCG_MAP_CYCLE || null;
    var st0 = legRead();
    if (CYCLE && typeof CYCLE.restart === 'function' && st0 && st0.chapter === ch) {
      var restarted = false;
      try {
        restarted = await CYCLE.restart(ch, {
          owner: 'leg',
          save: { adv: { chapter: st0.chapter, unlocked: st0.unlocked }, roam: { at: st0.at } },
          force: true
        });
      } catch (e) { restarted = false; }
      if (restarted) {
        LEG.status = 'moving';
        LEG.why = '点了本章「重新挑战」，重开一轮';
        return true;
      }
    }
    var plan = legRestartPlan(ch, id);
    var back = true;

    if (plan.hop >= 0) {
      LEG.status = 'moving';
      LEG.why = '先绕去' + plan.label + '（那边没神兽），再回' + legChLabel(legGroupOf(id), ch) + '重开一轮';
      back = await legHop(plan.hop, plan.region);
      await sleep(700);
      if (!back) {
        LEG.why = '绕不过去' + plan.label + '，直接重进目标章节';
      }
    } else {
      LEG.status = 'moving';
      LEG.why = '本地区没有能绕的章节，直接重进' + legChLabel(legGroupOf(id), ch);
    }
    return await legGo(ch, id);
  }

  // 跨地区：地图上的「出发去某地区」入口 + 确认弹窗
  async function legGoRegion(region) {
    var el = null;
    for (var i = 0; i < 5; i++) {
      el = document.querySelector('.rg[data-depart="' + region + '"]') ||
        document.querySelector('#screen-map .rg[data-depart="' + region + '"]');
      if (el) break;
      await sleep(400);
    }
    if (!el) return false;

    el.click();
    await sleep(800);

    var modal = document.querySelector('.dp-modal') ||
      document.querySelector('#modal-root .modal') ||
      document.querySelector('.modal');
    if (!modal) return false;

    var btn = modal.querySelector('.btn.primary') || modal.querySelector('button.primary');
    if (!btn) return false;

    btn.click();
    await sleep(1600);
    return true;
  }

  async function legCycle() {
    var id = legTargetId();
    if (!id) {
      LEG.status = 'idle';
      LEG.armed = false;
      LEG.target = 0;
      LEG.why = '还没选神兽';
      return;
    }
    if (LEG.busy) return;

    // 地下通道正在检查 / 领奖 / 派队：它优先，等它把有次数的槽位全派完再继续
    if (UG.busy) {
      LEG.why = '地下通道在检查/领奖/派队，等它办完';
      return;
    }

    // 换了一只 → 一切归零，等「立即前往」重新开跑
    if (LEG.target !== id) {
      LEG.target = id;
      LEG.armed = !!settings.legArmed;   // 网页重载后靠存储恢复；换一只就得重新点「立即前往」
      LEG.afterFight = false;
      LEG.attempt = null;
      LEG.doneFor = 0;
      LEGW.id = 0;
      LEGW.hp = 100;
      LEGW.ko = false;
      LEGW.snap = null;
      LEGW.endedAt = 0;
    }

    if (!LEG.armed) {
      LEG.status = 'idle';
      LEG.why = '选好了，点「立即前往」开始追踪';
      return;
    }

    // 这只已经抓到 / 地区还没解锁 → 追踪就地停掉，别白跑
    var mine = null;
    var pk = legPicks();
    for (var pj = 0; pj < pk.length; pj++) if (pk[pj].id === id) { mine = pk[pj]; break; }
    if (mine && (mine.got || mine.locked)) {
      LEG.status = mine.got ? 'done' : 'lost';
      LEG.armed = false;
      LEG.why = mine.got
        ? (mine.name + ' 图鉴里已经有了，追踪关掉')
        : (mine.name + ' 还没解锁，先通关这个地区的联盟');
      settings.legendaryId = '';
      settings.legArmed = false;
      if (lastLegendId) lastLegendId = '';
      try { SYNC.set({ legendaryId: '', legArmed: false }); } catch (e) { /* ignore */ }
      return;
    }

    var now = Date.now();
    if (now - LEG.lastCycleAt < 15000) return;
    LEG.lastCycleAt = now;

    // 地下通道正在切页/派遣：这几秒别抢页面，等它回来
    if (screenBusy('leg', now)) {
      LEG.why = (screenWho('leg') || '别的功能') + '在切页，等它办完';
      return;
    }
    // 第三十批：黑市扫货同样有「优先切页」待遇，它喊话了就先等一轮
    if (marketWants()) {
      LEG.why = '黑市扫货正在切页买东西，等它办完';
      return;
    }

    var st = legRead();
    if (!st) { LEG.why = '还没读到存档'; return; }
    LEG.caught = st.caught;

    var got = st.caught.indexOf(id) >= 0 || !!st.dex[id];
    if (got) {
      LEG.doneFor = id;
      LEG.attempt = null;
      LEG.status = 'done';
      LEG.why = '图鉴里已经有了，不用再追';
      return;
    }

    // 先看有没有打输：输了就立刻作废「在战斗中」，走切走再切回来的流程
    var justLost = legDeathsBump(st);
    if (justLost) {
      if (LEGW.id) {
        legFightEnd();            // 认得这一场：它把这次算进「被击败」并挂上 afterFight
      } else if (legFoe(id)) {
        var lst = legStatsOf(id);
        lst.lose++;
        log('传说追踪：被 ' + legNameOf(id) + ' 打败了（第 ' + lst.lose + ' 次），切走再切回来重开');
      } else {
        log('传说追踪：这一章打输了，切走再切回来重开');
      }
      LEG.afterFight = true;
      LEG.attempt = null;
      LEG.inBattle = false;
      LEG.failAt = 0;
      LEGW.id = 0;
      LEGW.endedAt = 0;
      LEGW.snap = null;
    }

    // 只有它本人站在场上时才停手；别的野生/训练家对战照常推进，不停
    LEG.inBattle = justLost ? false : legBattleLive(id);
    if (LEG.inBattle) {
      LEG.status = 'fighting';
      LEG.why = '正在和它战斗，这轮打完再去追';
      return;
    }

    var slot = st.at[id] || st.at[String(id)];
    if (!slot || typeof slot.ch !== 'number') {
      // 存档里没有：可能是游戏还没跑过 Roaming.update()，去地图点一下让它刷新
      if (now - LEG.lastMapAt > 60000) {
        LEG.lastMapAt = now;
        var mt = legMapTab();
        if (mt) {
          mt.click();
          await sleep(1000);
          var st2 = legRead();
          if (st2) {
            st = st2;
            LEG.caught = st2.caught;
            slot = st.at[id] || st.at[String(id)];
          }
        }
      }
      if (!slot || typeof slot.ch !== 'number') {
        LEG.status = 'lost';
        LEG.why = '现在没在野外（可能已经抓到了，或者还没轮到它出现）';
        return;
      }
    }

    // 它换章了、我们还没抓到 → 清掉当前这次追击（战绩只算击败/被击败）
    if (LEG.attempt && LEG.attempt.ch !== slot.ch) LEG.attempt = null;

    LEG.ch = slot.ch;
    LEG.until = Number(slot.until) || 0;

    var forceSearch = LEG.afterFight;
    LEG.afterFight = false;

    if (LEG.until && LEG.until <= now) {
      LEG.afterFight = true;   // 还没定位到新位置：下一轮继续（否则「重开」会被丢掉）
      // 刚打完 / 刚过期：去地图点一下，让它重新抽位置
      if (forceSearch && now - LEG.lastMapAt > 5000) {
        LEG.lastMapAt = now;
        var mt2 = legMapTab();
        if (mt2) {
          mt2.click();
          await sleep(1000);
        }
        LEG.status = 'moving';
        LEG.why = '它刚换了地方，在地图上找新位置';
        return;
      }
      LEG.status = 'moving';
      LEG.why = '正在换地方，等一下';
      return;
    }

    LEG.busy = true;
    try {
      var chLabel = legChLabel(legGroupOf(id), slot.ch);
      if (st.chapter !== slot.ch || forceSearch) {
        var moved = st.chapter !== slot.ch;
        LEG.status = 'moving';
        LEG.why = moved
          ? ('前往' + chLabel)
          : ('先绕去本地区别的章节，再回' + chLabel + '重开一轮');
        var ok = moved ? await legGo(slot.ch, id) : await legRestart(slot.ch, id);
        LEG.lastNudgeAt = Date.now();
        LEG.status = ok ? 'running' : 'fail';
        if (ok) {
          LEG.failAt = 0;
          LEG.attempt = { ch: slot.ch, at: Date.now() };
          legStatsOf(legTargetId()).tries++;
          LEG.why = chLabel + ' 挑战中';
        } else {
          // 切走再切回来没成功（地图没点动、地区没切过去…）：15 秒后接着重试
          LEG.afterFight = forceSearch || LEG.afterFight;
          LEG.failAt = (LEG.failAt || 0) + 1;
          // 进不去地区这类原因要留着，别被「重试」盖掉
          if (LEG.why.indexOf('进不去') !== 0) {
            LEG.why = '切走再切回来没成功，下一轮重试（第 ' + LEG.failAt + ' 次）';
          }
        }
      } else {
        LEG.status = 'running';
        LEG.why = chLabel + ' 挑战中';
        legShowAdventure();
        // 一轮跑完还停在同一章时，隔 3 分钟再重开一轮
        if (now - LEG.lastNudgeAt > 180000) {
          LEG.lastNudgeAt = now;
          var ok2 = await legRestart(slot.ch, id);
          if (ok2) {
            LEG.attempt = { ch: slot.ch, at: Date.now() };
            legStatsOf(legTargetId()).tries++;
          }
        }
      }
    } catch (e) {
      LEG.status = 'fail';
      LEG.why = '出错：' + ((e && e.message) || e);
    } finally {
      LEG.busy = false;
    }
  }

  // 手动「立即前往」：把追踪状态全清掉，从本地区别的章节绕一圈再回来
  // 停止追踪：清掉选中的那只，躲开「互斥」那套判断
  function legStop() {
    var was = !!(settings.legendaryId || LEG.armed || LEG.target || settings.legArmed);
    settings.legendaryId = '';
    settings.legArmed = false;
    LEG.armed = false;
    LEG.target = 0;
    LEG.status = 'idle';
    LEG.why = '已停止追踪（要重新开始就在列表里选一只，再点「立即前往」）';
    LEG.afterFight = false;
    LEG.attempt = null;
    lastLegendId = false;
    try { SYNC.set({ legendaryId: '', legArmed: false }); } catch (e) { /* ignore */ }
    if (was) log('传说追踪：已停止');
    return was ? { ok: true, text: '已停止追踪' } : { ok: false, text: '本来就没在追' };
  }

  async function legManual() {
    var id = legTargetId();
    if (!id) return { ok: false, text: '先在列表里选一只神兽' };
    // 已经抓到 / 这个地区的联盟还没通关 → 不给追
    var picks = legPicks();
    for (var pi = 0; pi < picks.length; pi++) {
      if (picks[pi].id !== id) continue;
      if (picks[pi].got) return { ok: false, text: picks[pi].name + ' 图鉴里已经有了' };
      if (picks[pi].locked) return { ok: false, text: picks[pi].name + ' 还没解锁，先通关这个地区的联盟' };
      break;
    }
    if (legFoe(id)) return { ok: false, text: '正在和它战斗，等这场打完再点' };
    if (LEG.busy) return { ok: false, text: '正在执行上一轮，稍等几秒' };

    LEG.afterFight = false;
    LEG.attempt = null;
    LEG.doneFor = 0;
    LEG.lastCycleAt = 0;
    LEG.lastNudgeAt = 0;
    LEG.lastMapAt = 0;
    LEG.target = id;
    LEGW.id = 0;
    LEGW.hp = 100;
    LEGW.ko = false;
    LEGW.snap = null;
    LEGW.endedAt = 0;

    LEG.busy = true;
    LEG.armed = true;          // 从这一刻起才开始真的追
    /* 第二十五批：卡片互斥，先把联盟刷钱 / 两个刷取 / 图鉴停掉，
     * 免得 applySettings 里「刷钱优先」的老规则又把刚点起来的追踪关掉 */
    exclusiveStopOthers('leg');
    settings.legArmed = true;
    LEG.failAt = 0;
    try { SYNC.set({ legArmed: true }); } catch (e) { /* ignore */ }
    try {
      var st = legRead();
      var slot = st && (st.at[id] || st.at[String(id)]);

      if (!slot) {
        // 存档里没有：先去地图点一下，让它重新抽位置
        await legOpenMap();
        await sleep(1000);
        st = legRead();
        slot = st && (st.at[id] || st.at[String(id)]);
      }

      if (!slot || typeof slot.ch !== 'number') {
        LEG.status = 'lost';
        LEG.why = '现在没在野外，可能还没轮到它出现';
        return { ok: false, text: LEG.why };
      }

      var region = legGroupOf(id) || 'kanto';
      var label = legChLabel(region, slot.ch);

      LEG.ch = slot.ch;
      LEG.until = Number(slot.until) || 0;

      LEG.status = 'moving';
      var plan = legRestartPlan(slot.ch, id);
      LEG.why = '先绕去' + plan.label + '（那边没神兽）';
      var okBack = await legHop(plan.hop, plan.region);
      await sleep(700);

      LEG.why = '前往' + label;
      var ok = await legGo(slot.ch, id);

      LEG.lastNudgeAt = Date.now();
      LEG.lastCycleAt = Date.now();

      if (ok || okBack) {
        LEG.status = 'running';
        LEG.attempt = { ch: slot.ch, at: Date.now() };
        legStatsOf(legTargetId()).tries++;
        LEG.why = label + ' 挑战中';
        return { ok: true, text: '已开始：' + plan.label + ' → ' + label };
      }

      LEG.status = 'fail';
      LEG.why = '进不去' + label + '，可能还没解锁';
      return { ok: false, text: LEG.why };
    } catch (e) {
      LEG.status = 'fail';
      LEG.why = '出错：' + ((e && e.message) || e);
      return { ok: false, text: LEG.why };
    } finally {
      LEG.busy = false;
    }
  }

  /* ---------------- 首页「继续」---------------- */
  // 刷新/自动刷新后游戏会停在标题页，标题下面那颗 .ti-go 就是「继续 / Nouvelle partie」。
  // 有存档时它一定写着「继续」（游戏里 he() ? Continuer : Nouvelle partie），所以
  // 只要不是新游戏字样就点，语言换了也不怕。
  var TITLE = { box: null, at: 0, tries: 0 };

  var TITLE_GO = /继续|繼續|continue|continuer|continuar|fortsetzen|weiter|계속|つづけ|続ける|続き|продолж/i;
  var TITLE_NEW = /nouvelle|new game|新游戏|新遊戲|nueva partida|neues spiel|새로|はじめから|nuova partita|новая игра/i;

  function titleSaveMons() {
    var save = ugSave();
    if (!save) return 0;
    return (save.mons || []).length;
  }

  function titleTick(now) {
    if (!settings.autoContinue) return;

    var box = document.querySelector('.title-fx');
    if (!box) {
      if (TITLE.box) { TITLE.box = null; TITLE.tries = 0; }
      return;
    }
    if (TITLE.box !== box) { TITLE.box = box; TITLE.tries = 0; TITLE.at = 0; }
    if (TITLE.tries >= 8) return;          // 点过 8 次还在？那就交给玩家
    if (now - TITLE.at < 1500) return;     // 点完等它淡出，别连点

    var btn = box.querySelector('.ti-go') || document.querySelector('.title-fx .ti-go');
    if (!btn || btn.disabled) return;

    var txt = (btn.textContent || '').trim();
    if (TITLE_NEW.test(txt)) return;                        // 「新游戏」绝对不碰
    if (!TITLE_GO.test(txt) && titleSaveMons() === 0) return; // 认不出的语言：有存档才敢点

    TITLE.at = now;
    TITLE.tries++;
    try { btn.click(); } catch (e) { /* ignore */ }
    log('标题页：点了「' + txt + '」（第 ' + TITLE.tries + ' 次）');
  }

  /* ---------------- 游戏内弹窗（第一百批：沉浸通关模式） ----------------
   * 目标只有一个：**挂机时画面上不许有任何东西卡着不动**。所以下面这些都走完：
   * 1) 单按钮的「继续 / OK / 太棒了！」—— 点掉就关
   * 2) 化石 / 道具二选一（ItemFX.choose）：先点第一个，再点确认
   * 3) 演出上的「跳过」（.fx-skip）：道馆徽章 / 进化 / 孵蛋 / 博士开场，一律快进到底
   * 4) 送礼弹窗（.hatch-fx.gift）：单只收下、**二选一 / 三选一也自动选第一只**
   *    （博士的御三家、格斗道场 106/107、送的伊布、幻影之塔化石那一类）
   * 5) 送礼 / 交换动画（LinkFx .lk-fx）：它等的是 pointerdown，click() 不管用
   * 6) 其余任何 #modal-root 里的框：能点金按钮就点金按钮，只有一颗就点它，
   *    「取消 + 确定」两颗就点确定；**破坏性确认（.btn.danger / 放生 / 删档 / 覆盖）绝对不点**，
   *    退到只剩 ghost/danger 时按 Esc = 取消，把框关掉但不做任何破坏性操作。
   */
  var MODAL = { at: 0, lastEl: null, lastAt: 0, tries: 0, key: '', upAt: 0, upClicks: 0 };

  var MODAL_OK = /^(继续|繼續|continue|continuer|continuar|weiter|ok|okay|d'accord|entendu|compris|super !|super|太棒了！|太棒了|bon !|très bien|entendu !|好|好的|确定|確定|知道了|明白|关闭|關閉)$/i;

  /* 破坏性文案：只要按钮上写着这些，绝不代点（放生 / 删档 / 卖东西 / 花钱买） */
  var MODAL_BAD = /(放生|放走|釋放|释放|删除|刪除|删档|覆蓋|覆盖|出售|卖出|賣出|购买|購買|丢弃|丟棄|relâch|relach|supprim|effac|écras|ecras|vend|achet|libér|liber|release|delete|overwrite|sell|buy)/i;

  function modalPress(el, how, tag, now) {
    if (!el) return false;
    if (el === MODAL.lastEl && now - MODAL.lastAt < 2200) return false;
    MODAL.lastEl = el;
    MODAL.lastAt = now;
    MODAL.at = now;
    MODAL.tries++;

    try {
      if (how === 'tap') {
        var r = el.getBoundingClientRect();
        el.dispatchEvent(new PointerEvent('pointerdown', {
          bubbles: true, cancelable: true, composed: true,
          pointerId: 1, pointerType: 'mouse', isPrimary: true,
          clientX: r.left + r.width / 2, clientY: r.top + r.height / 2
        }));
      } else {
        el.click();
      }
    } catch (e) { /* ignore */ }

    var t = (el.textContent || '').trim().slice(0, 14);
    log('弹窗：' + tag + (t ? '「' + t + '」' : ''));
    return true;
  }

  /* 送礼面板（.hatch-fx.gift）：第一百批起**二选一 / 三选一也照走**。
   * 游戏自己的交互是两条路：
   *   · 多只（博士的御三家、格斗道场 106/107）→ 等玩家点一只 `ready` 的球，
   *     点完 `.gift-go`（Valider，文案变成「选择X」）才可点；
   *   · 单只（送的伊布、卡比兽那种）→ 游戏自己就把那唯一一只选好了，
   *     `.gift-go` 一直是灰的，只等面板上的一次 `pointerdown`（`.gift-tap`）推过去。
   * 老版本只认「单只自动收」，单只那条又点不到 `.gift-tap`，结果整个面板卡在那里、
   * 挂机全停 —— 这批两条路都走完。 */
  function giftTick(now) {
    var gift = document.querySelector('.hatch-fx.gift');
    if (!gift) return false;

    // 1) 已经选中一只（.gift-go 变亮）→ 点「收下 / 选择X」
    var ggo = gift.querySelector('.gift-go');
    if (ggo && !ggo.disabled) { modalPress(ggo, 'click', '收下', now); return true; }

    // 2) 多只那种：挑第一个已经 ready 的球（选第一个就是「跳过」，不替玩家纠结）
    var balls = gift.querySelectorAll('.gift-ball');
    /* 第一百二十批：合众（第五世代 494-649）的新宝可梦让玩家自己选 ——
     * 御三家 / 道场的三选一是玩家的个人选择，插件一律不动，只认出来后原位等待。 */
    var hasUnova = false;
    for (var u = 0; u < balls.length; u++) {
      var uid = parseInt(balls[u].getAttribute('data-id'), 10);
      if (uid >= 494 && uid <= 649) { hasUnova = true; break; }
    }
    if (hasUnova) return true;   // 识别到合众新宝可梦：让玩家自己挑，插件不点
    for (var i = 0; i < balls.length; i++) {
      var b = balls[i];
      if (!b.classList || !b.classList.contains('ready')) continue;
      if (b.classList.contains('on')) continue;          // 游戏自己已经选好了，别再点同一只
      modalPress(b, 'click', '选第一只', now);
      return true;
    }

    // 3) 单只那种 / 已经选好：靠 pointerdown 推进（click 不管用）
    var tap = gift.querySelector('.gift-tap');
    if (tap) { modalPress(tap, 'tap', '继续', now); return true; }
    return true;
  }

  /* ==================== 第一百二十批：游戏版本更新自动重启 ====================
   * 「沉浸通关模式」(autoModal) 默认关，而游戏发版时弹出的「有新版本，请重新载入」
   * 会把挂机画面整块卡住。这个 tick 不受 autoModal 限制，也不要求弹窗在
   * #modal-root.open 里 —— 全页找 .up-modal，点「重新载入」，点了没消失就自己刷。
   * 另有探针兜底：bundle 指纹变了但游戏没弹框时，页面稳定一会儿后重启一次。
   * 按 build + sessionStorage 去重，绝不会循环刷新。 */
  var VER_UP = { at: 0, clicks: 0, boot: 0, doneBuild: '' };
  function versionReload(reason, build) {
    var key = 'pcgVerReloadV1_' + String(build || 'nobuild').slice(0, 24);
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) { /* ignore */ }
    log('游戏版本更新，自动重启：' + reason);
    try { location.reload(); } catch (e2) { /* ignore */ }
  }
  function versionUpdateTick(now) {
    if (!VER_UP.boot) VER_UP.boot = now;
    var probe = (window.PCG_PROBE && typeof window.PCG_PROBE.result === 'function')
      ? window.PCG_PROBE.result() : null;
    var build = (probe && probe.build) || '';
    var up = document.querySelector('.up-modal');
    if (!up && !(probe && probe.buildChanged)) return;
    if (now - VER_UP.at < 4000) return;

    /* 探针发现 bundle 换了但游戏还没弹框：等页面稳定 20 秒再重启，
     * 避免刚打开游戏（本地指纹还是旧的）就误刷一次。 */
    if (!up) {
      if (!(probe && probe.buildChanged)) return;
      if (now - VER_UP.boot < 20000) return;
      if (VER_UP.doneBuild === (build || 'probe')) return;
      VER_UP.at = now;
      VER_UP.doneBuild = build || 'probe';
      versionReload('检测到游戏已更新（bundle ' + String(build).slice(0, 12) + '）', build);
      return;
    }

    VER_UP.at = now;
    var btn = up.querySelector('.modal-actions .btn.primary') ||
      up.querySelector('.modal-actions .btn');
    if (btn && !btn.disabled) {
      VER_UP.clicks++;
      log('游戏提示有新版本，点「重新载入」（第 ' + VER_UP.clicks + ' 次）');
      try { btn.click(); } catch (e) { /* ignore */ }
    }
    if (build) VER_UP.doneBuild = build;
    if (VER_UP.clicks >= 2) {
      setTimeout(function () {
        try {
          if (document.querySelector('.up-modal'))
            versionReload('版本更新框点了没反应', VER_UP.doneBuild);
        } catch (e) { /* ignore */ }
      }, 3000);
    }
  }

  function modalTick(now) {
    if (!settings.autoModal) return;
    if (now - MODAL.at < 900) return;      // 一步一步来

    // 图鉴卡这种「#modal-root 里的弹窗」优先处理：赠送演出淡出时两个可能同时在，
    // 老版本先点 .lk-fx 会把 24 次机会耗光，图鉴卡永远轮不到。
    var modRoot = document.querySelector('#modal-root.open');
    var open = modRoot ||
      document.querySelector('.berry-fx.item-choice') ||
      document.querySelector('.hatch-fx.gift') ||
      document.querySelector('.lk-fx');

    // 换了一个弹窗 → 重新计数
    var key = open ? (open.className || 'x') : '';
    if (key !== MODAL.key) { MODAL.key = key; MODAL.tries = 0; MODAL.lastEl = null; }
    if (!open) return;
    if (MODAL.tries >= 40) return;         // 卡住了就别再骚扰

    // 1) 二选一：普通道具选第一个；化石（Choisis un fossile / 选择化石）选第二块。
    //    第一百二十批玩家要求：化石默认选第二块。
    var choice = modRoot ? null : document.querySelector('.berry-fx.item-choice');
    if (choice) {
      var go = choice.querySelector('.ic-go');
      var goTxt = go ? String(go.textContent || '') : '';
      var isFossil = /fossile|fossil|化石/i.test(goTxt);
      if (!isFossil) {
        var items0 = choice.querySelectorAll('.ic-item');
        for (var fi = 0; fi < items0.length; fi++) {
          var lab0 = String(items0[fi].getAttribute('aria-label') || '');
          if (/fossile|fossil|化石/.test(lab0)) { isFossil = true; break; }
        }
      }
      if (go && !go.disabled) { modalPress(go, 'click', '确认', now); return; }
      var items = choice.querySelectorAll('.ic-item');
      if (isFossil && items.length > 1) {
        modalPress(items[1], 'click', '选第二块化石', now);
      } else if (items.length) {
        modalPress(items[0], 'click', '选第一个', now);
      }
      return;
    }

    // 2) 演出上的「跳过」（Passer ⏭）：道馆徽章 / 进化 / 孵蛋 / 博士开场 / 传送演出
    //    全项目就这一个组件，点它等于把整段演出快进到底 —— 挂机时不该陪它演完
    if (!modRoot) {
      var skipEl = document.querySelector('.fx-skip:not([data-gone])');
      if (skipEl && !skipEl.disabled) { modalPress(skipEl, 'click', '跳过演出', now); return; }
    }

    // 3) 送礼弹窗（二选一 / 三选一也自动选第一个，见 giftTick）
    if (!modRoot && giftTick(now)) return;

    // 4) 送礼 / 交换动画（.lk-fx）：先点「跳过」（.fx-skip），再靠 pointerdown 推进
    var lk = modRoot ? null : document.querySelector('.lk-fx');
    if (lk) {
      var sk = lk.querySelector('.fx-skip');
      if (sk && !sk.disabled && !sk.dataset.gone) { modalPress(sk, 'click', '跳过演出', now); return; }
      modalPress(lk, 'tap', '继续', now);
      return;
    }

    // 5) #modal-root 里的弹窗
    var root = modRoot;
    if (!root) return;

    // 地下通道的战利品结算框（.ug-back）有自己的开关和 1.2 秒节奏，这里不抢
    if (root.querySelector('.ug-back')) return;

    // 交换（Échanges）里「选自己那只 / 选想要的那只」的挑选窗也是 .dexcard-modal，
    // 但它唯一的按钮是 ghost 的「返回（Retour）」——点掉就等于取消玩家的投稿，
    // 这种「玩家在挑东西」的窗口一律不碰
    if (root.querySelector('.ot-dlg, .ot-pickdlg, .ot-grid')) return;

    // 4a) 版本更新弹窗统一交给 versionUpdateTick()（不受 autoModal 限制），见下方

    // 4b)「欢迎回来！」（离线期间发生了什么）：点右上角 ✕ 关掉
    var welX = root.querySelector('.dc-x');
    if (welX) {
      var welBox = welX.closest ? welX.closest('.modal') : null;
      var welHead = welBox && welBox.querySelector('.dc-head h2');
      var welTxt = welHead ? String(welHead.textContent || '') : '';
      if (/bon retour|welcome back|欢迎回来|歡迎回來|おかえり|다시 오신/i.test(welTxt)) {
        modalPress(welX, 'click', '关掉欢迎回来', now);
        return;
      }
    }

    /* 4c) 第一百批「沉浸通关模式」：剩下的框统统走完，一个都不留给挂机去等。
     * 选按钮的优先级（都不碰破坏性按钮）：
     *   ① .btn.gold —— 游戏把「太棒了！/ 继续 / 确定」这类主操作统一刷成金色
     *   ② 唯一一颗非 ghost 的按钮（solo 那种通知框）
     *   ③ 「取消 + 确定」两颗 → 点不是 ghost 的那颗
     *
     * 一个关键分界：**有没有 ✕（`closable`）**。游戏里 `showDexCard(id, {actions:[…]})`
     * 传了 actions 的卡是「关不掉的」（没有 ✕、点外面也关不了、Esc 也无效）——
     * 那种就是新宝可梦那张「太棒了！」卡，必须替玩家点掉，否则挂机永远停在这儿。
     * 反过来有 ✕ 的框是**玩家自己点开的**（图鉴卡 / 商店 / 石板…），
     * 那种只替他把「确定」点掉，绝不按 ✕ / Esc 去关他正在看的东西。 */
    var acts = root.querySelectorAll('.modal-actions .btn');
    var danger = false;
    var gold = null;
    var live = [];
    for (var ai = 0; ai < acts.length; ai++) {
      var a = acts[ai];
      var ac = a.classList || { contains: function () { return false; } };
      if (ac.contains('danger')) danger = true;
      if (a.disabled) continue;
      if (ac.contains('ghost')) continue;
      if (MODAL_BAD.test(String(a.textContent || ''))) { danger = true; continue; }
      if (ac.contains('gold') && !gold) gold = a;
      live.push(a);
    }
    var pickBtn = gold || (live.length === 1 ? live[0] : null);
    var closable = !!root.querySelector('.dc-x');
    var isDex = !!(root.querySelector('.dexcard-modal'));
    if (pickBtn) {
      var ptxt = String(pickBtn.textContent || '').trim();
      /* 图鉴卡：只有「关不掉」的那张才动手（＝拿到新宝可梦，等的是「太棒了！」） */
      if (isDex && closable) return;
      if (isDex || MODAL_OK.test(ptxt) || (live.length === 1 && !danger)) {
        modalPress(pickBtn, 'click', isDex ? '太棒了' : '关闭', now);
        return;
      }
    }

    /* 一颗都点不了：只有「关不掉」的框才强制关掉。
     * 有 ✕ 的框是玩家自己在用的（图鉴卡 / 商店 / 石板…），不替他关。 */
    if (closable) return;

    /* 关不掉的框里只剩 ghost / danger：按 Esc（游戏里 Esc = 取消 / 关闭）。
     * 放生 / 删档 / 覆盖那种确认框就走到这里 —— 框关掉了、不再挡着挂机，
     * 但「确定」一下都没点过，什么都不会被删。 */
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      MODAL.at = now;
      log(danger ? '弹窗：只给破坏性按钮，按 Esc 取消（不代点）' : '弹窗：没有可点的按钮，按 Esc 关掉');
    } catch (e) { /* ignore */ }
  }

  /* ---------------- 异色团体战：自动连战 ---------------- */
  // 团体战页是 #screen-raid，每个地区一张卡：
  //   .rc-card[data-rc="kanto|johto|hoenn|sinnoh"]
  //   卡片 class 上带状态：done（今天已捕获）/ run（进行中）/ lock（联盟没通关）
  //   [data-raid-go] 是「团体战」按钮；没组队/没选队友时，游戏自己会先弹
  //   组队窗（#evt-pick，和地下通道同一个组件，里面 #evt-opt 是「一键优化」）
  //   或者盟友窗（.raid-dlg，.raid-pick 从上到下先是好友、再是训练家）
  // 所以连战不需要自己拼队伍：反复点 [data-raid-go]，游戏会一路带你走
  //   → 优化队伍 → 选队友 → 开打；打完回团体战页看结果，没抓到就再来一次。
  var RAID_NAMES = { kanto: '关都', johto: '城都', hoenn: '丰缘', sinnoh: '神奥', unova: '合众' };

  var RAID = {
    at: 0,
    busy: false,
    phase: 'idle',
    key: '',
    tries: 0,
    fights: 0,
    fightAt: 0,
    awayAt: 0,
    returnAt: 0,
    idleAt: 0,
    wasOn: false,
    inRun: false,
    inRunAt: 0,
    runAt: 0,
    fightSeenAt: 0,
    runEndAt: 0,
    gaveUpAt: 0,
    lastGoAt: 0,
    runKey: '',
    runTries: 0,
    endLogged: 0,      // 「这一轮结束了」这条日志只报一次（用 lastGoAt 当记号）
    paints: 0,         // 今天已经逼游戏重画过几次异色页（最多 3 次，防止来回点）
    optDone: {},       // 今天已经「一键最优」过的地区（{kanto:1}）—— 每只 boss 只开一次组队窗
    optAt: 0,          // 上一次点卡片上「队伍」按钮的时间
    optTries: 0,       // 这一次点了几次「队伍」按钮（防止点不开死循环）
    forcePaint: false, // 刚换天：让游戏把异色页重画一次，别信昨天剩下的 ✓
    cardsAt: 0,
    doneKeys: {},
    doneIds: {},
    day: '',
    why: '还没开启',
    note: '',
    stats: { go: 0, caught: 0 },
    cards: [],
    seen: {}
  };

  var RAID_OPT = { at: 0, done: false, key: '' };

  function raidScreenActive() {
    var el = document.getElementById('screen-raid');
    return !!el && el.classList.contains('active');
  }

  function raidTab() {
    return document.querySelector('#side [data-screen="raid"]') ||
      document.querySelector('#tabs [data-screen="raid"]');
  }

  function raidText(el) {
    return el ? String(el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  }

  // 每个地区「打过几次」「大师球进度」都记下来：卡片一变成「已捕获」，游戏就不画这两个了
  var RAID_KEEP = { dayEnd: 0, tries: {}, pity: {} };
  var RAID_KEEP_AT = 0;
  var RAID_KEEP_READY = false;

  // 每天几点刷新：巴黎时间 0 点（游戏自己的日期就是按巴黎算的）
  function raidResetSec() {
    try {
      var fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Paris', hour12: false,
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      var p = {};
      fmt.formatToParts(new Date()).forEach(function (x) {
        if (x.type !== 'literal') p[x.type] = x.value;
      });
      var h = Number(p.hour) % 24, mi = Number(p.minute), s = Number(p.second);
      var left = 86400 - (h * 3600 + mi * 60 + s);
      return left > 0 ? left : 86400;
    } catch (e) {
      return -1;
    }
  }

  function raidKeepLoad() {
    if (RAID_KEEP_READY) return;
    RAID_KEEP_READY = true;
    try {
      chrome.storage.local.get('pcgRaid', function (o) {
        var v = o && o.pcgRaid;
        if (v && typeof v === 'object') {
          RAID_KEEP = {
            dayEnd: Number(v.dayEnd) || 0,
            tries: v.tries && typeof v.tries === 'object' ? v.tries : {},
            pity: v.pity && typeof v.pity === 'object' ? v.pity : {}
          };
        }
      });
    } catch (e) { /* ignore */ }
  }

  function raidKeepDay() {
    var end = Date.now() + Math.max(0, raidResetSec()) * 1000;
    if (end && RAID_KEEP.dayEnd && Date.now() > RAID_KEEP.dayEnd) {
      RAID_KEEP.tries = {};
      RAID_KEEP.pity = {};
      RAID_KEEP.dayEnd = end;
      raidKeepSave(true);
      return;
    }
    if (end) RAID_KEEP.dayEnd = end;
  }

  function raidKeepSave(force) {
    var now = Date.now();
    if (!force && now - RAID_KEEP_AT < 5000) return;
    RAID_KEEP_AT = now;
    try {
      chrome.storage.local.set({ pcgRaid: RAID_KEEP }, function () { void chrome.runtime.lastError; });
    } catch (e) { /* ignore */ }
  }

  // 「12 / 200」或「Prête ! / 就绪！」都认；数字优先
  function raidPityOf(card) {
    var box = card.querySelector('.rc-pity');
    if (!box) return null;
    var b = box.querySelector('b');
    var txt = raidText(b) || raidText(box);
    var m = /(\d+)\s*\/\s*(\d+)/.exec(txt);
    if (m) return { n: Number(m[1]), max: Number(m[2]), ready: box.classList.contains('ready'), text: txt };
    if (box.classList.contains('ready')) return { n: 200, max: 200, ready: true, text: txt };
    var one = /(\d+)/.exec(txt);
    if (one) return { n: Number(one[1]), max: 200, ready: false, text: txt };
    return { n: 0, max: 200, ready: false, text: txt };
  }

  // 卡片上的「进行中 · 第5次挑战」里的 5
  function raidTriesOf(card, key) {
    var st = raidText(card.querySelector('.st'));
    var m = /(\d+)/.exec(st);
    if (m && /[·•]/.test(st)) return Number(m[1]);
    return 0;
  }

  function raidCards() {
    raidKeepLoad();
    raidKeepDay();
    var list = [];
    var cards = document.querySelectorAll('#screen-raid .rc-card[data-rc]');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var key = card.getAttribute('data-rc') || '';
      var name = raidText(card.querySelector('h3'));
      var running = card.classList.contains('run');
      var n = raidTriesOf(card, key);
      var pity = raidPityOf(card);
      var saved = (key && RAID_KEEP.pity[key]) || null;

      if (running && n > 0 && key) {
        if (RAID_KEEP.tries[key] !== n) {
          RAID_KEEP.tries[key] = n;
          raidKeepSave();
        }
      }
      if (pity && key) {
        if (!saved || saved.n !== pity.n || saved.ready !== pity.ready) {
          RAID_KEEP.pity[key] = { n: pity.n, max: pity.max, ready: pity.ready };
          raidKeepSave();
        }
      }

      list.push({
        key: key,
        region: RAID_NAMES[key] || raidText(card.querySelector('.reg')) || key,
        name: name,
        done: card.classList.contains('done'),
        running: running,
        locked: card.classList.contains('lock'),
        lockMsg: raidText(card.querySelector('.lockmsg')),
        status: raidText(card.querySelector('.st')),
        pity: pity || saved || null,
        tries: n || (key && RAID_KEEP.tries[key]) || 0,
        go: card.querySelector('[data-raid-go]')
      });
    }
    return list;
  }

  // 给弹窗用的精简卡片数据
  function raidCardsOut() {
    var src = RAID.cards.length ? RAID.cards : raidCards();
    return src.map(function (c) {
      var pity = c.pity || (c.key && RAID_KEEP.pity[c.key]) || null;
      return {
        key: c.key,
        region: c.region,
        name: c.name,
        done: c.done,
        running: c.running,
        locked: c.locked,
        lockMsg: c.lockMsg,
        status: c.status,
        tries: c.tries || (c.key && RAID_KEEP.tries[c.key]) || 0,
        pity: pity ? { n: pity.n, max: pity.max, ready: !!pity.ready } : null
      };
    });
  }

  /* --- 4 个地区的异色 + 自己的进度 -----------------------------------
     1.9.55 起游戏每天只把「今天抽到的那个地区」画在团体战页上，别的地区连卡片都没有，
     所以两头一起读：
       · #screen-raid 上的 .rc-card：今天能打的地区（状态 / 保底 / 是否已捕获）
       · 抽签动画 .rd-fx 里的 .rd-card：4 个地区轮流出现，正好把今天的四只都看一眼
     读到什么记什么，存在 localStorage["pcgRaidBoss"] 里，换天自动作废。
     进度全部来自存档 save.raids（done / tried / pity / clears），不猜。 */
  var RAID_REGS = [
    { key: 'kanto', dex: [1, 151] },
    { key: 'johto', dex: [152, 251] },
    { key: 'hoenn', dex: [252, 386] },
    { key: 'sinnoh', dex: [387, 493] },
    { key: 'unova', dex: [494, 649] }
  ];
  // 1.9.57：「异色团体战」回到 1.9.55 之前——面板整块藏起来了。
  // 想重新放出来：这里改 true，再把 popup.html 里异色团体战那节的 hidden 去掉。
  var RAID_PANEL = false;
  var RAID_BOSS_LS = 'pcgRaidBoss';
  var RAID_BOSS = { day: '', win: '', map: {} };

  function raidDayKey() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
    } catch (e) { return ''; }
  }

  function raidRegByKey(key) {
    for (var i = 0; i < RAID_REGS.length; i++) if (RAID_REGS[i].key === key) return RAID_REGS[i];
    return null;
  }

  function raidRegByZh(zh) {
    var t = String(zh || '');
    for (var i = 0; i < RAID_REGS.length; i++) {
      var nm = RAID_NAMES[RAID_REGS[i].key];
      if (nm && t.indexOf(nm) >= 0) return RAID_REGS[i];
    }
    return null;
  }

  // 精灵图地址里带图鉴号（assets/pokemon/art/shiny/42.gif）；拿不到就退回 page-hook 打的标记
  function raidPixId(img) {
    if (!img || !img.getAttribute) return 0;
    var t = parseInt(img.getAttribute('data-pcg-id'), 10);
    if (t > 0) return t;
    var src = img.getAttribute('src') || '';
    var m = /\/(\d+)\.(?:gif|png|webp)/.exec(src);
    return m ? Number(m[1]) : 0;
  }

  function raidBossLoad() {
    var day = raidDayKey();
    var raw = null;
    try { raw = JSON.parse(localStorage.getItem(RAID_BOSS_LS) || 'null'); } catch (e) { raw = null; }
    if (raw && raw.day === day && raw.map && typeof raw.map === 'object') {
      RAID_BOSS = { day: day, win: raw.win || '', map: raw.map };
      return;
    }
    RAID_BOSS = { day: day, win: '', map: {} };
  }

  function raidBossSave() {
    try { localStorage.setItem(RAID_BOSS_LS, JSON.stringify(RAID_BOSS)); } catch (e) { /* ignore */ }
  }

  // 抽签动画 + 团体战页，看到就记（这两个画面都是转瞬即逝，单独跑 500ms 一次）
  function raidHarvest() {
    var fx = document.querySelector('.rd-fx');
    var page = document.getElementById('screen-raid');
    if (!fx && !page) return;
    if (RAID_BOSS.day !== raidDayKey()) raidBossLoad();
    var changed = false;
    var cards, reg, id, i;
    if (fx) {
      cards = fx.querySelectorAll('.rd-card');
      for (i = 0; i < cards.length; i++) {
        reg = raidRegByZh(raidText(cards[i].querySelector('.nm')));
        if (!reg) continue;
        if (cards[i].classList.contains('win') && RAID_BOSS.win !== reg.key) { RAID_BOSS.win = reg.key; changed = true; }
        id = raidPixId(cards[i].querySelector('.rd-bob img'));
        if (id > 0 && RAID_BOSS.map[reg.key] !== id) { RAID_BOSS.map[reg.key] = id; changed = true; }
      }
    }
    if (page) {
      cards = page.querySelectorAll('.rc-card');
      for (i = 0; i < cards.length; i++) {
        reg = raidRegByKey(cards[i].getAttribute('data-rc') || '') || raidRegByZh(raidText(cards[i].querySelector('.reg')));
        if (!reg) continue;
        id = raidPixId(cards[i].querySelector('.boss img'));
        if (id > 0 && RAID_BOSS.map[reg.key] !== id) { RAID_BOSS.map[reg.key] = id; changed = true; }
      }
    }
    if (changed) raidBossSave();
  }

  // 收藏那边的实时存档写法，这里也照用：不吃 2 秒缓存
  function raidSaveNow() {
    var SAVE = window.PCG_SAVE || null;
    if (SAVE) return SAVE.read(true);
    try { return JSON.parse(localStorage.getItem(UG_SAVE_KEY) || 'null'); } catch (e) { return null; }
  }

  // 面板要的 4 个地区：状态来自游戏页面，进度来自存档
  function raidBoard() {
    raidBossLoad();
    var day = RAID_BOSS.day || raidDayKey();
    // 页面上的卡片走现成的 raidCards()：它已经处理了保底读不到时的回退
    var cards = raidCards();
    var seen = {};
    var i;
    for (i = 0; i < cards.length; i++) {
      if (!cards[i].key) continue;
      seen[cards[i].key] = {
        locked: !!cards[i].locked,
        catchable: !cards[i].locked,
        running: !!cards[i].running,
        status: cards[i].status || '',
        lockMsg: cards[i].lockMsg || '',
        pity: cards[i].pity || null,
        tries: cards[i].tries || 0
      };
    }
    var save = raidSaveNow();
    var rd = (save && save.raids) || {};
    var doneMap = rd.done || {};
    var triedMap = rd.tried || {};
    var pityMap = rd.pity || {};
    var out = [];
    var caught = 0;
    var openKeys = [];
    for (var j = 0; j < RAID_REGS.length; j++) {
      var r = RAID_REGS[j];
      var s = seen[r.key] || null;
      if (s && s.catchable) openKeys.push(r.key);
      var doneToday = !!doneMap[r.key + '|' + day];
      if (doneToday) caught++;
      var p = (s && s.pity) || pityMap[r.key] || null;
      out.push({
        key: r.key,
        region: RAID_NAMES[r.key] || r.key,
        boss: RAID_BOSS.map[r.key] || 0,
        onPage: !!s,
        catchable: s ? s.catchable : false,
        locked: s ? s.locked : false,
        lockMsg: s ? s.lockMsg : '',
        running: s ? s.running : false,
        done: doneToday,
        status: s ? s.status : '',
        tries: triedMap[r.key + '|' + day] || (s ? s.tries : 0),
        pity: p ? { n: p.n || 0, max: p.max || 0, ready: !!p.ready } : null
      });
    }
    return {
      day: day,
      drawn: RAID_BOSS.win || (openKeys.length === 1 ? openKeys[0] : ''),
      open: openKeys.length,
      caught: caught,
      total: RAID_REGS.length,
      cleared: rd.clears || 0,
      regions: out
    };
  }

  // 盟友窗：第一个 .raid-pick 就是「最上面那个好友」；没有好友时游戏只画训练家
  function raidPickAlly() {
    var dlg = document.querySelector('.raid-dlg');
    if (!dlg) return false;
    var picks = dlg.querySelectorAll('.raid-pick');
    if (!picks.length) return false;
    try { picks[0].click(); } catch (e) { /* ignore */ }
    RAID.why = '选了最上面的队友';
    return true;
  }

  // 组队窗：先点「一键最优」，再关掉
  // 游戏自己的逻辑（bundle 里的 H()）只在队伍为空时才弹这个窗，
  // 昨天留下的队伍会直接开打 —— 所以插件自己点卡片上的「队伍」按钮把它打开。
  function raidTeamPicker(now) {
    var pick = document.querySelector('#evt-pick.open');
    if (!pick) { RAID_OPT.done = false; return false; }

    // 地下通道派遣也用同一个组队窗（#evt-pick）：不在团体战页就别去动它，
    // 不然会把正在派遣的队伍一键优化掉、还顺手关掉
    if (!raidScreenActive()) { RAID_OPT.done = false; return false; }

    if (!RAID_OPT.done) {
      var opt = pick.querySelector('#evt-opt');
      // 没有「优化」按钮（比如别的功能的组队窗）：当作已处理，下一步把它关掉，
      // 不然会卡在这个窗上永远出不来
      if (!opt) {
        RAID_OPT.done = true;
        RAID_OPT.at = now;
        return true;
      }
      if (now - RAID_OPT.at > 900) {
        RAID_OPT.at = now;
        RAID_OPT.done = true;
        try { opt.click(); } catch (e) { /* ignore */ }
        RAID.why = '队伍一键最优';
      }
      return true;
    }

    var x = pick.querySelector('[data-evt-close]');
    if (x) {
      try { x.click(); } catch (e) { /* ignore */ }
      RAID.why = '队伍优化好了，关掉组队窗';
      RAID_OPT.done = false;
      RAID_OPT.at = now;
      if (RAID_OPT.key) {
        RAID.optDone[RAID_OPT.key] = 1;
        RAID.optTries = 0;
        RAID.optAt = 0;
        RAID_OPT.key = '';
      }
    }
    return true;
  }

  function raidMarkCaught(cards) {
    // 只认「今天插件自己点下去过」的那一轮。
    // 换天那一秒页面可能还挂着昨天的 ✓，照单全收会把今天的地区全锁死
    // （doneKeys 一锁就是一整天，卡片后来更新了也解不开）。
    var goToday = !!RAID.lastGoAt && raidDayOf(RAID.lastGoAt) === raidDayId();
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (!c.done || RAID.seen[c.key]) continue;
      RAID.seen[c.key] = 1;
      if (!goToday) continue;
      if (RAID.stats.go > 0) {
        RAID.stats.caught++;
        RAID.note = '捕获成功：' + c.region + ' · ' + c.name;
        log('团体战：' + RAID.note);
      }
      // 记住：这个地区今天抓到了；这一轮的事件 id 也别再当成「还在打」
      RAID.doneKeys[c.key] = 1;
      var sv = ugSave();
      var ev = sv && sv.adv && sv.adv.event;
      if (ev && ev.id != null) RAID.doneIds[ev.id] = 1;
      if (RAID.runKey === c.key) { RAID.runKey = ''; RAID.runTries = 0; }
    }
  }

  // 某个时间戳在巴黎是几号（判断「这个动作是不是今天做的」用）
  function raidDayOf(ts) {
    if (!ts) return '';
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(ts));
    } catch (e) {
      return '';
    }
  }

  // 巴黎日期（游戏换天就是按这个走）
  function raidDayId() {
    try {
      var fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit'
      });
      return fmt.format(new Date());
    } catch (e) {
      return '';
    }
  }

  // 团体战页有两层：home（世界 boss）和 chroma（异色）。卡片只在 chroma 上
  function raidOnChroma() {
    return !!document.querySelector('#screen-raid .rc-card[data-rc]');
  }

  function raidOpenChroma(now) {
    var b = document.querySelector('#screen-raid [data-raid-page="chroma"]');
    if (!b) return false;
    try { b.click(); } catch (e) { /* ignore */ }
    RAID.at = now;
    RAID.phase = 'back';
    RAID.why = '切到异色团体战';
    return true;
  }

  function raidNewDay(now) {
    var day = raidDayId();
    if (!day) return false;
    if (!RAID.day) { RAID.day = day; return false; }
    if (RAID.day === day) return false;

    RAID.day = day;
    RAID.seen = {};
    RAID.doneKeys = {};
    // 昨天那一轮打完以后游戏不会清 adv.event，换天时必须当成「没有在打」，
    // 不然新的一天一进来就以为还在战斗
    RAID.inRun = false;
    RAID.gaveUpAt = now || Date.now();
    RAID.endLogged = 0;
    RAID.fightSeenAt = 0;
    RAID.runAt = 0;
    RAID.runEndAt = 0;
    RAID.forcePaint = true;
    RAID.stats.go = 0;
    RAID.paints = 0;
    RAID.optDone = {};
    RAID.optTries = 0;
    RAID.optAt = 0;
    RAID.doneIds = {};
    RAID.key = '';
    RAID.runKey = '';
    RAID.runTries = 0;
    RAID.tries = 0;
    RAID.fights = 0;
    RAID.cards = [];
    RAID.stats.caught = 0;
    RAID.note = '新的一轮开始：团体战刷新了';
    RAID.returnAt = 0;
    RAID.idleAt = 0;
    RAID.awayAt = 0;
    log('团体战：换天了，自动开新一轮');
    return true;
  }

  // 这一轮团体战还在不在跑：存档里 adv.event 有东西就说明冒险还没结束
  // （异色团体战是一整轮多波；游戏打完**不会**自己退回团体战页，得我们自己切回去）
  function raidInRun() {
    if (RAID.gaveUpAt) return false;
    var save = ugSave();
    var adv = save && save.adv;
    var ev = adv && adv.event;
    if (!ev) return false;
    if (ev.id != null && RAID.doneIds[ev.id]) return false;   // 抓完的那一轮，游戏还留着 event
    return true;
  }

  // 只看存档里有没有这一轮（不管超时）
  function raidRunAlive() {
    var save = ugSave();
    var adv = save && save.adv;
    return !!(adv && adv.event);
  }

  function raidTick(now) {
    if (!settings.autoRaid) {
      RAID.phase = 'idle';
      RAID.why = '自动连战已关闭';
      RAID.wasOn = false;
      return;
    }

    // 刚打开开关：立刻去异色团体战页
    if (!RAID.wasOn) {
      RAID.wasOn = true;
      RAID.returnAt = 0;
      RAID.idleAt = 0;
      RAID.awayAt = 0;
      RAID.day = RAID.day || raidDayId();
    }

    raidNewDay(now);

    if (RAID.busy) return;
    if (now - RAID.at < 2000) return;

    // 地下通道正在检查 / 领奖 / 派队：它优先，等它把有次数的槽位全派完再继续
    if (UG.busy) {
      RAID.why = '地下通道在检查/领奖/派队，等它办完';
      return;
    }

    // 地下通道正在切页/派遣：让它先办完，别把页面抢回来
    if (screenBusy('raid', now)) {
      RAID.why = (screenWho('raid') || '别的功能') + '在切页，等它办完';
      return;
    }

    // 第三十批：黑市扫货也是优先切页的那一类，它喊话了就先等一轮
    if (marketWants()) {
      RAID.why = '黑市扫货正在切页买东西，等它办完';
      return;
    }

    // 传说追踪在跑的时候别抢冒险页
    if (settings.legendaryId && LEG.armed) {
      RAID.why = '传说追踪开着，先停掉它再连战';
      return;
    }

    if (raidPickAlly()) { RAID.at = now; return; }
    if (raidTeamPicker(now)) { RAID.at = now; return; }

    // 注意：这里**不再**因为「屏幕上有敌人在打」就停下来。
    // 只有「传说追踪的那只神兽」值得等（在 legCycle 里判），别的一律不算，
    // 不然你在外面随便打一场野生，连战就卡在「战斗中（第 0 场）」不动了。

    // 异色团体战是一整轮「多波」冒险（野生→训练家→野生→训练家→治疗→boss）。
    // 关键：游戏**打完不会自己退回团体战页**，会一直停在冒险页。
    // 所以插件在战斗真正打起来之后，主动切回异色团体战页——那一页的卡片
    // 正好写着「▶ 进行中 · 第N次挑战」，数据一直在读，也不会把这一轮弄丢。
    var onScreen = raidScreenActive();
    // 一轮大概 1 分钟；挂了 4 分钟还没结束，就当作卡住了，重新点一次试试
    if (raidRunAlive() && RAID.runAt && now - RAID.runAt > 240000 && !RAID.gaveUpAt) {
      RAID.gaveUpAt = now;
      RAID.why = '这一轮 4 分钟还没结束，当作卡住了，重新点一次';
    }
    if (!raidRunAlive()) RAID.gaveUpAt = 0;
    var inRun = raidInRun();
    // 打完以后游戏不会把敌人从 DOM 里删掉，所以这个判断只在前 5 分钟内算数，
    // 而且一旦判定「这一轮结束了」就不再理它（否则每秒都会把 inRun 顶回来）
    var fighting = legDomBattle() && !RAID.gaveUpAt &&
      !!RAID.lastGoAt && now - RAID.lastGoAt < 300000;

    if (inRun || fighting) {
      if (!RAID.fightSeenAt) RAID.fightSeenAt = now;
      if (!RAID.inRun && RAID.phase === 'go') RAID.fights++;   // 这一轮真的开打了
      RAID.inRun = true;
      RAID.inRunAt = now;
      if (!RAID.runAt) RAID.runAt = now;
      RAID.phase = 'run';
      RAID.returnAt = RAID.fightSeenAt + 4000;    // 打起来 4 秒后就可以切回去了
    } else {
      if (RAID.inRun) RAID.runEndAt = now + 3000;  // 这一轮刚结束，缓 3 秒再开下一轮
      RAID.inRun = false;
      RAID.fightSeenAt = 0;
      RAID.runAt = 0;
    }

    // 不在团体战页
    if (!onScreen) {
      // 这一轮还在打 → 主动切回异色页（不等它打完，游戏自己不会回）
      if (RAID.inRun && now >= RAID.returnAt) {
        var rtab = raidTab();
        if (rtab && !rtab.classList.contains('locked')) {
          try { rtab.click(); } catch (e) { /* ignore */ }
          RAID.at = now;
          RAID.phase = 'run';
          RAID.why = '这一轮打起来了，切回异色团体战页盯着数据';
          return;
        }
      }
      if (now < RAID.returnAt) {
        RAID.phase = RAID.idleAt ? 'idle' : 'run';
        if (RAID.idleAt) {
          var leftSec = Math.max(0, Math.round((RAID.returnAt - now) / 1000));
          RAID.why = '今天全抓完了，等刷新（还有 ' + Math.floor(leftSec / 3600) + ' 小时 ' +
            Math.floor((leftSec % 3600) / 60) + ' 分）';
        } else {
          RAID.why = RAID.inRun ? '战斗中，等两秒就切回异色页' : '这一轮刚打完，缓一下';
        }
        return;
      }
      // 闲着没事的时候，你正在玩就先不去抢页面
      if (RAID.idleAt && now - (S.lastRealInputAt || 0) < 60000) {
        RAID.why = '你在玩，等会儿再回团体战页看看';
        return;
      }
      var tab = raidTab();
      if (!tab) { RAID.why = '找不到团体战这个标签'; return; }
      if (tab.classList.contains('locked')) {
        RAID.why = '团体战页还锁着，先通关主线再来';
        return;
      }
      try { tab.click(); } catch (e) { /* ignore */ }
      RAID.at = now;
      RAID.phase = 'back';
      RAID.why = '切回团体战页';
      return;
    }

    // 在团体战页但停在 home：点进「异色团体战」
    if (!raidOnChroma()) {
      if (raidOpenChroma(now)) return;
      RAID.phase = 'idle';
      RAID.why = '异色团体战页是空的（没登录账号，或者还在加载）';
      return;
    }

    RAID.cards = raidCards();
    RAID.cardsAt = now;

    // 刚换天：卡片上的 ✓ 可能是昨天残留的，切一次 home→chroma 逼游戏重画
    if (RAID.forcePaint) {
      RAID.forcePaint = false;
      var hb = document.querySelector('#screen-raid [data-raid-page="home"]');
      if (hb) {
        try { hb.click(); } catch (e) { /* ignore */ }
        RAID.at = now;
        RAID.phase = 'back';
        RAID.why = '换天了，让异色页重画一次';
        RAID.returnAt = 0;
        RAID.idleAt = 0;
        return;
      }
    }

    raidMarkCaught(RAID.cards);

    // 异色页上的卡片才是实时状态：「▶ 进行中 · 第N次挑战」+ .run
    //   有 .run 且没有 .done → 这一轮还在打
    //   次数往上走了          → 上一轮结束了，游戏已经在等下一次挑战
    //   一张都没有 .run       → 这一轮结束了；抓完以后游戏不会清 adv.event，别被它拖住
    var runCard = null;
    for (var ri = 0; ri < RAID.cards.length; ri++) {
      var rc = RAID.cards[ri];
      if (rc.running && !rc.done) { runCard = rc; break; }
    }
    if (runCard) {
      if (RAID.runKey !== runCard.key) {
        RAID.runKey = runCard.key;
        RAID.runTries = runCard.tries || 0;
      } else if (runCard.tries && RAID.runTries && runCard.tries > RAID.runTries) {
        RAID.runKey = '';
        RAID.runTries = 0;
        RAID.runEndAt = now + 1500;
        runCard = null;
      }
    } else {
      RAID.runKey = '';
      RAID.runTries = 0;
    }

    // 卡片已经不显示进行中了，但存档里 adv.event 还留着 → 以卡片为准
    if (!runCard && RAID.inRun && now - RAID.lastGoAt > 20000 &&
        RAID.lastGoAt && RAID.endLogged !== RAID.lastGoAt) {
      RAID.endLogged = RAID.lastGoAt;
      RAID.inRun = false;
      RAID.gaveUpAt = now;
      log('团体战：这一轮结束了（卡片上已经没有「进行中」）');
    }

    if (runCard) {
      RAID.phase = 'run';
      RAID.inRunAt = now;
      RAID.why = '团体战第 ' + (runCard.tries || 1) + ' 次挑战在打，在异色页盯着数据';
      return;
    }
    if (now < RAID.runEndAt) {
      RAID.phase = 'back';
      RAID.why = '这一轮刚打完，缓一下再开下一轮';
      return;
    }

    var next = null;
    for (var i = 0; i < RAID.cards.length; i++) {
      var c = RAID.cards[i];
      if (c.done || c.locked || RAID.doneKeys[c.key]) continue;
      next = c;
      break;
    }

    if (!next) {
      var goTodayNow = !!RAID.lastGoAt && raidDayOf(RAID.lastGoAt) === raidDayId();
      if (RAID.cards.length && !goTodayNow && (RAID.paints || 0) < 3) {
        RAID.paints = (RAID.paints || 0) + 1;
        RAID.forcePaint = true;
        RAID.at = now;
        RAID.phase = 'back';
        RAID.why = '一个能打的都没有，先让异色页重画一次再看看';
        RAID.returnAt = 0;
        RAID.idleAt = 0;
        return;
      }

      RAID.phase = 'idle';
      RAID.key = '';
      RAID.tries = 0;
      var locked = 0;
      for (var k = 0; k < RAID.cards.length; k++) if (RAID.cards[k].locked) locked++;
      RAID.why = RAID.cards.length
        ? ('今天全抓完了（' + RAID.cards.length + ' 个地区，' + locked + ' 个没解锁），等刷新')
        : '打开一次异色团体战页就能读到地区';
      RAID.idleAt = now;
      // 别睡过头：刷新之后马上回来接着打
      var toReset = raidResetSec() * 1000;
      RAID.returnAt = now + Math.min(600000, Math.max(5000, toReset + 5000));
      return;
    }
    RAID.idleAt = 0;

    if (RAID.key !== next.key) {
      RAID.key = next.key;
      RAID.tries = 0;
      RAID.fights = 0;
    }
    if (RAID.tries >= 200) {
      RAID.why = next.region + ' 点了 200 次还没开打，先停一下看看';
      return;
    }
    if (!next.go || next.go.disabled) {
      RAID.why = next.region + ' 的团体战按钮点不了' + (next.status ? '（' + next.status + '）' : '');
      return;
    }

    // 无论如何都先点一次「一键最优」。
    // 游戏只在队伍是空的时候才弹组队窗（bundle: if(!mine(T).length) I(T)），
    // 而队伍会一直存着——昨天打过、今天还是那六只，游戏就直接开打了，
    // 插件连「优化」按钮都见不着。所以这里自己点卡片上的「队伍」按钮。
    if (!RAID.optDone[next.key] && RAID.optTries < 3) {
      var editBtn = document.querySelector(
        '#screen-raid .rc-card[data-rc="' + next.key + '"] [data-raid-edit]'
      );
      if (editBtn && (!RAID.optAt || now - RAID.optAt > 1200)) {
        RAID.optAt = now;
        RAID.optTries++;
        RAID_OPT.key = next.key;
        RAID_OPT.done = false;
        try { editBtn.click(); } catch (e) { /* ignore */ }
        RAID.at = now;
        RAID.phase = 'team';
        RAID.why = next.region + ' 开打前先点一次「一键最优」';
        return;
      }
    }

    RAID.at = now;
    // 注意：optDone 不清空 —— 同一个地区今天只开一次组队窗，
    // 不然每打一轮都弹一次队伍界面，选同伴的时候特别烦
    RAID.optTries = 0;
    RAID.optAt = 0;
    RAID.tries++;
    RAID.stats.go++;
    RAID.phase = 'go';
    RAID.fightSeenAt = 0;
    RAID.gaveUpAt = 0;
    RAID.lastGoAt = now;
    RAID.runKey = '';
    RAID.runTries = 0;
    RAID.returnAt = now + 8000;        // 刚点下去，等它把这一轮真正开起来
    try { next.go.click(); } catch (e) { /* ignore */ }
    RAID.why = '开打 ' + next.region + ' · ' + next.name;
  }

  // 弹窗上的「开始连战」：打开自动、切到团体战页、立刻走一步
  // 停止连战：关掉开关，已经开打的那一轮不受影响
  function raidStop() {
    var was = !!settings.autoRaid;
    settings.autoRaid = false;
    RAID.wasOn = false;
    RAID.phase = 'idle';
    RAID.why = '已停止连战（要重新开始就点「开始连战」）';
    RAID.returnAt = 0;
    RAID.idleAt = 0;
    lastAutoRaid = false;
    try { SYNC.set({ autoRaid: false }); } catch (e) { /* ignore */ }
    if (was) log('异色团体战：已停止连战');
    return was ? { ok: true, text: '已停止连战' } : { ok: false, text: '本来就没在连战' };
  }

  async function raidManual() {
    // 两个都要占冒险页：开连战就把传说追踪停掉
    if (settings.legendaryId) {
      settings.legendaryId = '';
      try { SYNC.set({ legendaryId: '' }); } catch (e) { /* ignore */ }
      log('开异色连战：传说追踪已自动停掉');
    }

    if (!settings.autoRaid) {
      settings.autoRaid = true;
      try { SYNC.set({ autoRaid: true }); } catch (e) { /* ignore */ }
    }

    var tab = raidTab();
    if (tab && !raidScreenActive()) {
      if (tab.classList.contains('locked')) return { ok: false, text: '团体战页还锁着，先通关主线' };
      try { tab.click(); } catch (e) { /* ignore */ }
      await sleep(700);
    }
    // 停在 home 的话点进「异色团体战」
    if (raidScreenActive() && !raidOnChroma()) {
      raidOpenChroma(Date.now());
      await sleep(700);
    }

    // 已经捕获的地区先记成「不用再报」，统计从这次开始算
    var before = raidCards();
    RAID.seen = {};
    for (var i = 0; i < before.length; i++) if (before[i].done) RAID.seen[before[i].key] = 1;
    RAID.cards = before;
    RAID.tries = 0;
    RAID.key = '';
    RAID.stats.go = 0;
    RAID.stats.caught = 0;
    RAID.paints = 0;
    RAID.endLogged = 0;
    RAID.forcePaint = false;
    RAID.optDone = {};
    RAID.optTries = 0;
    RAID.optAt = 0;
    RAID_OPT.key = '';
    RAID_OPT.done = false;
    RAID.note = '';
    RAID.at = 0;
    RAID.awayAt = 0;
    RAID.returnAt = 0;
    RAID.idleAt = 0;
    RAID.wasOn = true;
    RAID.day = raidDayId();

    raidTick(Date.now());

    var cards = RAID.cards.length ? RAID.cards : raidCards();
    var live = 0, locked = 0, done = 0;
    for (var k = 0; k < cards.length; k++) {
      if (cards[k].locked) locked++;
      else if (cards[k].done) done++;
      else live++;
    }
    if (!cards.length) return { ok: false, text: '读不到团体战：先在游戏里打开一次异色团体战页' };

    return {
      ok: true,
      text: '连战开始了：' + live + ' 个能打、' + done + ' 个已捕获、' + locked + ' 个没解锁'
    };
  }

  /* ---------------- 主循环：每秒一次 ---------------- */
  /* ---------------- 本系威力：宝可梦详情页，属性徽章下面加排名 ----------------
   *
   * 数据在 stab.js（PCG_STAB）：rank[属性] = [[宝可梦 id, 招式, 攻击种族值], ...]
   * 数值 = 威力 × 攻击种族值 × 本系 1.5 × 命中率，和弹窗里那张榜同一套算法。
   * 位置：.dexcard-modal 的 .dc-id 里，.badges（属性徽章）下面一行；
   *      每条就用游戏自己的 .type 徽章样式，颜色和属性徽章一模一样。
   */
  var STAB = { at: 0, css: false, nm: null };

  function stabStyle() {
    if (STAB.css) return;
    STAB.css = true;
    try {
      var st = document.createElement('style');
      st.id = 'pcg-stab-css';
      st.textContent =
        /* v1.23：不再自成一栏，直接并进属性徽章那一行的空位。.pcg-stab 只做行内容器，
         * 用 inline-flex 紧跟在 .badges 后面（同一行），并复用 .type 徽章的几何尺寸，
         * 因此高度和属性徽章一致、不额外占一整行。 */
        '.pcg-stab{display:inline-flex;flex-wrap:wrap;gap:6px;margin:0 0 0 6px;vertical-align:middle;}' +
        // 几何尺寸借游戏自己的 .type：同样的字号、行高、上下内边距，所以高度和属性徽章一模一样，
        // 只把左右内边距放宽，宽度保持原样；文字改黑色。
        '.pcg-stab .pcg-chip{padding:2px 12px!important;color:#111114!important;' +
        'text-shadow:none!important;font-weight:800;' +
        'box-shadow:inset 0 -2px rgba(0,0,0,.22)!important;cursor:help;}' +
        '.pcg-stab .pcg-chip b{font-weight:800;}' +
        '.pcg-stab .pcg-chip i{font-style:normal;font-weight:700;margin-left:6px;}';
      (document.head || document.documentElement).appendChild(st);
    } catch (e) { /* ignore */ }
  }

  // 详情页现在是哪只：优先读右上角「N° 006」里的图鉴号，读不到再用名字反查
  function stabIdOf(root) {
    if (!root) return 0;
    var num = root.querySelector('.dc-sum b');
    if (num) {
      var n = parseInt(String(num.textContent || '').replace(/[^0-9]/g, ''), 10);
      if (n >= 1 && n <= 649) return n;
    }
    var h = root.querySelector('h2');
    var name = h ? String(h.textContent || '').trim() : '';
    if (!name) return 0;
    if (!STAB.nm) {
      var D = (typeof window !== 'undefined') && window.PCG_STAB;
      var map = {};
      if (D && D.nm) {
        for (var k in D.nm) { if (!map[D.nm[k]]) map[D.nm[k]] = Number(k); }
      }
      STAB.nm = map;
    }
    return STAB.nm[name] || 0;
  }

  /* 第一百一十七批：阿尔宙斯吃了石板、进化成某个属性形态后，弹窗右上角依旧写
   * 「N°493」（游戏对形态宝可梦显示的是基础图鉴号），stabIdOf() 只会读到 493，
   * D.mon(493) 于是只命中 rank.normal —— 格斗 / 火 / 水…… 阿尔宙斯一律被算成
   * 「一般系第 4 名」。stab.js 里已经给 16 个石板形态造了 49301..49316 的 id，
   * 并在 D.arceus.byType 里存了「属性 → 形态 id」。这里读弹窗那排属性徽章的
   * data-type，把基础号换成真实形态 id 再交给 D.mon()，芯片就会显示对应属性
   * （如格斗·制裁光砾）的名次与战力。一般系原形态 / 读不到徽章 / 非阿尔宙斯
   * 一律原样返回，其它宝可梦完全不受影响。 */
  function stabFormId(id, badges, D) {
    if (id !== 493 || !badges || !D || !D.arceus || !D.arceus.byType) return id;
    var list = badges.querySelectorAll ? badges.querySelectorAll(':scope > .type[data-type]') : null;
    if (!list || !list.length) return id;
    for (var z = 0; z < list.length; z++) {
      var ty = String(list[z].getAttribute('data-type') || '').trim();
      if (!ty || ty === 'normal') continue;       // 一般系徽章不是石板形态
      var fid = D.arceus.byType[ty];
      if (fid) return fid;                        // 命中 16 个石板形态之一
    }
    return id;
  }

  function stabTick(now) {
    if (now - STAB.at < 500) return;
    STAB.at = now;

    var D = (typeof window !== 'undefined') && window.PCG_STAB;
    if (!D) return;

    var heads = document.querySelectorAll('.dexcard-modal .dc-id');
    for (var i = 0; i < heads.length; i++) {
      var head = heads[i];
      var badges = head.querySelector('.badges');
      if (!badges) continue;

      var modal = head.closest ? head.closest('.dexcard-modal') : null;
      /* 第一百一十七批：阿尔宙斯按弹窗真实属性徽章认石板形态（见 stabFormId） */
      var id = stabFormId(stabIdOf(modal || head), badges, D);
      var rows = id ? D.mon(id) : [];
      var box = head.querySelector('.pcg-stab');

      // 顺序跟上面那排属性徽章一致，颜色一一对得上
      if (rows.length > 1) {
        var seq = [];
        var bs = badges.querySelectorAll(':scope > .type[data-type]');
        for (var z = 0; z < bs.length; z++) seq.push(bs[z].getAttribute('data-type'));
        if (seq.length) {
          rows = rows.slice().sort(function (x, y) {
            var ix = seq.indexOf(x.type), iy = seq.indexOf(y.type);
            if (ix < 0) ix = 99;
            if (iy < 0) iy = 99;
            return ix - iy;
          });
        }
      }

      if (!rows.length) {
        if (box && box.parentNode) box.parentNode.removeChild(box);
        continue;
      }

      var sig = '';
      for (var r = 0; r < rows.length; r++) {
        sig += rows[r].type + rows[r].rank + Math.round(rows[r].val) + '|';
      }
      if (box && box.getAttribute('data-sig') === sig) continue;

      if (!box) {
        stabStyle();
        box = document.createElement('div');
        box.className = 'pcg-stab';
      }
      box.setAttribute('data-sig', sig);
      box.textContent = '';

      for (var q = 0; q < rows.length; q++) {
        var row = rows[q];
        var chip = document.createElement('span');
        chip.className = 'type pcg-chip';
        chip.setAttribute('data-type', row.type);
        try {
          chip.style.setProperty('--c', D.color[row.type] || '#666');
          chip.style.background = 'var(--c)';
        } catch (e) { /* ignore */ }

        var rk = document.createElement('b');
        rk.textContent = '第' + row.rank + '名';
        var val = document.createElement('i');
        val.textContent = '战力 ' + Math.round(row.val);
        chip.appendChild(rk);
        chip.appendChild(val);

        chip.title = (D.tzh[row.type] || row.type) + ' 本系第 ' + row.rank + ' 名：' +
          (row.cat === 'phys' ? '物理' : '特殊') + ' ' + row.name +
          ' 威力 ' + row.pw + ' × ' + (row.cat === 'phys' ? '攻击' : '特攻') + ' ' + row.stat + '（Lv100）' +
          ' × 本系 1.5 × 命中 ' + Math.round(row.acc) + '% = ' + Math.round(row.val);
        box.appendChild(chip);
      }

      /* v1.23：并进属性徽章那一行（.badges）右侧的空位，不再单独占一整行 */
      if (!box.parentNode) badges.appendChild(box);
    }
  }

  /* ---------------- 伤害统计（所有对战） ---------------- */
  // 数据全部来自游戏自己画在页面上的东西，插件不碰游戏逻辑：
  //   #battle-log 里带 <b> 的那一行  → 这一下用的是哪一招（用 500 条招式中文字名白名单筛）
  //   #arena-fx 里新出现的飘字       → 这一下打了多少（暴击会有 ! ）
  //   #team-rail .tr-row.acting      → 这一下是谁打的
  //   飘字离敌人近还是离自己人近     → 我方输出 / 我方掉血
  //   #enemy-slot 空了 2 秒          → 这一场结束
  // 世界BOSS（阿尔宙斯反击）没有逐只伤害的飘字，只能读它自己的结算面板。

  var DMG = {
    host: null, pnl: null, tabsEl: null, subEl: null, rowsEl: null, footEl: null,
    built: false, shown: false, sig: '', css: false,
    tab: 'total', fold: true, x: null, y: null, uiAt: 0,
    placeAt: 0, dockKey: '', resizeB: false,
    fight: null, meta: {}, roster: {}, order: [], lastMove: '', lastMoveAt: 0,
    lastAtk: '', emptyAt: 0,
    mvpUid: '', mvpLock: false, round: {}, sortUids: [],
    dots: {}, dotsFoe: '',
    fx: null, fxObs: null, logEl: null, logObs: null, logSig: '',
    wbEl: null, wbDur: 0, wbT0: 0, wbSpilled: false
  };
  var DMG_UI_KEY = 'pcgDmgUi';
  var DMG_KEEP_MS = 15000;   // 一场打完后面板再留 15 秒，方便看结果

  function dmgFmt(n) {
    n = Math.round(Number(n) || 0);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, '') + 'k';
    return String(n);
  }

  function dmgEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function dmgClock(txt) {
    var m = /(\d+)\s*:\s*(\d+)/.exec(String(txt || ''));
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    var n = /(\d+)/.exec(String(txt || ''));
    return n ? Number(n[1]) : 0;
  }

  function dmgStab() {
    return (typeof window !== 'undefined' && window.PCG_STAB) || null;
  }

  // 招式是不是真的招式：只在白名单里才认，KO/换人/捕获那些 <b> 自然被挡掉
  function dmgMoveOf(name) {
    var D = dmgStab();
    if (!D || !D.mt) return null;
    return D.mt[name] || null;
  }

  function dmgIdOf(src) {
    var m = /\/pokemon\/(\d+)\.png/.exec(String(src || ''));
    return m ? Number(m[1]) : 0;
  }

  function dmgNameOf(id, title) {
    var D = dmgStab();
    if (id && D && D.nm && D.nm[id]) return D.nm[id];
    var t = String(title || '').split(/[—–]/)[0].replace(/<[^>]*>/g, '').trim();
    return t || (id ? ('#' + id) : '？');
  }

  function dmgArenaRect() {
    var a = document.getElementById('arena');
    return a ? a.getBoundingClientRect() : null;
  }

  function dmgLive() {
    return (DMG.fight && DMG.fight.on) ? DMG.fight : null;
  }

  function dmgStart(kind) {
    DMG.fight = {
      on: true, kind: kind || 'battle', t0: Date.now(), endAt: 0,
      /* 第一百一十六批：takenBy 按 uid 拆开记每只宝可梦挨了多少打，
       * takenUnknown 收留「归不到人」的那几下，两者 + taken 总量互相对得上。 */
      total: 0, taken: 0, takenBy: {}, takenUnknown: 0, rows: {}, acted: {}
    };
    DMG.lastMove = ''; DMG.lastMoveAt = 0; DMG.emptyAt = 0; DMG.lastAtk = '';
    DMG.mvpUid = ''; DMG.mvpLock = false; DMG.round = {}; DMG.sortUids = []; DMG.sig = '';
    DMG.dots = {}; DMG.dotsFoe = '';
  }

  function dmgStop(now) {
    var F = DMG.fight;
    if (!F || !F.on) return;
    F.on = false;
    F.endAt = now || Date.now();
  }

  /* ---- 采集 ---- */

  function dmgRosterRefresh() {
    var rows = document.querySelectorAll('#team-rail .tr-row[data-uid]');
    if (!rows.length) return;
    var order = [], died = false;
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var uid = r.getAttribute('data-uid');
      if (!uid) continue;
      var img = r.querySelector('img');
      var src = (img && (img.currentSrc || img.getAttribute('src'))) || '';
      var id = dmgIdOf(src);
      var lvEl = r.querySelector('.tr-lv');
      var lv = lvEl ? (String(lvEl.textContent || '').match(/\d+/) || [''])[0] : '';
      var ko = r.classList.contains('ko');
      var old = DMG.meta[uid];
      if (old && old.ko !== ko) { died = true; DMG.sig = ''; }
      DMG.meta[uid] = {
        uid: uid, name: dmgNameOf(id, r.getAttribute('title')), lv: lv, src: src,
        ko: ko, act: r.classList.contains('active')
      };
      DMG.roster[uid] = 1;
      order.push(uid);
    }
    if (order.length) DMG.order = order;
    var F = DMG.fight;
    if (F) {
      for (var k in F.rows) {
        var m = DMG.meta[k];
        if (m) { F.rows[k].name = m.name; F.rows[k].lv = m.lv; F.rows[k].src = m.src; }
      }
    }
    // 有人倒下就不再占这一轮的出手位，顺手补一次轮次判定
    if (died && DMG.round && Object.keys(DMG.round).length) dmgRoundCheck();
  }

  function dmgAmount(txt) {
    var m = /(\d[\d,]*)/.exec(String(txt || ''));
    return m ? Number(m[1].replace(/,/g, '')) : 0;
  }

  function dmgPos(el) {
    var x = parseFloat(el.style.left), y = parseFloat(el.style.top);
    if (isFinite(x) && isFinite(y)) return { x: x, y: y };
    var r = el.getBoundingClientRect();
    var a = document.getElementById('arena-fx');
    var o = (a && a.getBoundingClientRect()) || { left: 0, top: 0 };
    return { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height / 2 };
  }

  function dmgCenter(el, origin) {
    var node = el.querySelector('.wrap > img') || el.querySelector('.wrap') || el;
    var r = node.getBoundingClientRect();
    return { x: r.left - origin.left + r.width / 2, y: r.top - origin.top + r.height / 2 };
  }

  // 飘字落在敌人身上 = 我们打出去的；落在自己人身上 = 我们挨的打
  function dmgSide(pos) {
    var a = document.getElementById('arena-fx');
    var origin = (a && a.getBoundingClientRect()) || { left: 0, top: 0 };
    var best = '', bestD = Infinity, i;
    var foes = document.querySelectorAll('#enemy-slot .enemy');
    for (i = 0; i < foes.length; i++) {
      var c = dmgCenter(foes[i], origin);
      var d = Math.abs(c.x - pos.x) + Math.abs(c.y - pos.y);
      if (d < bestD) { bestD = d; best = 'foe'; }
    }
    var allies = document.querySelectorAll('#ally-slots .ally[data-uid]');
    for (i = 0; i < allies.length; i++) {
      var c2 = dmgCenter(allies[i], origin);
      var d2 = Math.abs(c2.x - pos.x) + Math.abs(c2.y - pos.y);
      if (d2 < bestD) { bestD = d2; best = 'ally'; }
    }
    return best;
  }

  function dmgAttacker() {
    var row = document.querySelector('#team-rail .tr-row.acting');
    var uid = row && row.getAttribute('data-uid');
    if (uid) DMG.lastAtk = uid;
    return DMG.lastAtk || '';
  }

  // 出过手就先建一条（哪怕这一下打空、伤害记 0），招式页才会「一个个显示上去」
  function dmgTouch(uid) {
    var F = DMG.fight;
    if (!F || !uid) return null;
    var r = F.rows[uid];
    if (!r) {
      var meta = DMG.meta[uid] || {};
      r = F.rows[uid] = {
        uid: uid, name: meta.name || ('#' + uid), lv: meta.lv || '', src: meta.src || '',
        dmg: 0, hits: 0, max: 0, moves: {}
      };
    }
    return r;
  }

  function dmgAdd(uid, amount, moveName) {
    var F = dmgLive();
    if (!F || !uid) return;
    var r = dmgTouch(uid);
    if (!r) return;
    r.dmg += amount;
    r.hits++;
    if (amount > r.max) r.max = amount;
    F.total += amount;
    if (moveName) {
      var mv = r.moves[moveName];
      if (!mv) mv = r.moves[moveName] = { n: moveName, d: 0, h: 0, max: 0 };
      mv.d += amount;
      mv.h++;
      if (amount > mv.max) mv.max = amount;
    }
  }

  /* 第一百一十六批：承伤要按「哪只我方」拆开记。
   * dmgSide() 只回答落在敌人还是自己人身上；这里再用同一套几何找出离飘字最近的
   * 那张 ally 卡片，用它的 data-uid 把这一下归到具体宝可梦。 */
  function dmgVictimUid(pos) {
    var a = document.getElementById('arena-fx');
    var origin = (a && a.getBoundingClientRect()) || { left: 0, top: 0 };
    var ns = document.querySelectorAll('#ally-slots .ally[data-uid]'), i;
    var best = '', bestD = Infinity;
    for (i = 0; i < ns.length; i++) {
      var u = ns[i].getAttribute('data-uid');
      if (!u) continue;
      var c = dmgCenter(ns[i], origin);
      var d = Math.abs(c.x - pos.x) + Math.abs(c.y - pos.y);
      if (d < bestD) { bestD = d; best = u; }
    }
    return best;
  }

  /* 一次承伤记到某只宝可梦头上；归不到人时只进 takenUnknown，不硬塞给别人。 */
  function dmgTakenAdd(uid, amount) {
    var F = dmgLive();
    if (!F || !amount || amount <= 0) return;
    if (!F.takenBy) F.takenBy = {};
    if (!uid) { F.takenUnknown = (F.takenUnknown || 0) + amount; return; }
    var t = F.takenBy[uid];
    if (!t) t = F.takenBy[uid] = { dmg: 0, hits: 0, max: 0 };
    t.dmg += amount;
    t.hits++;
    if (amount > t.max) t.max = amount;
  }

  /* 实时血量：游戏自己把「当前 HP / 最大 HP」画成队伍栏那条 .tr-hp i 的宽度，
   * 战斗画面里每只 ally 的 .mini-hp .hp > div 是同一份值。直接读百分比，不猜数值、
   * 也不读存档（战斗中存档未必同步），免得血条跟游戏对不上。 */
  function dmgHpOf(uid) {
    if (!uid) return null;
    var w = NaN, bar = null;
    try {
      var row = document.querySelector('#team-rail .tr-row[data-uid="' + uid + '"]');
      bar = row ? row.querySelector('.tr-hp i') : null;
      if (bar) w = parseFloat(bar.style.width);
      if (!isFinite(w)) {
        var ally = document.querySelector('#ally-slots .ally[data-uid="' + uid + '"]');
        var b2 = ally ? ally.querySelector('.mini-hp .hp > div') : null;
        if (b2) w = parseFloat(b2.style.width);
      }
    } catch (e) { w = NaN; }
    if (!isFinite(w)) return null;
    return Math.max(0, Math.min(100, w));
  }

  // 当前站在场上的我方（#ally-slots 里挂着的那几只）
  function dmgOnField() {
    var out = {}, ns = document.querySelectorAll('#ally-slots .ally[data-uid]'), i;
    for (i = 0; i < ns.length; i++) {
      var u = ns[i].getAttribute('data-uid');
      if (u) out[u] = 1;
    }
    return out;
  }

  // 出手轮次：同一轮里所有上过场的宝可梦都动过手，才允许 MVP 换人
  function dmgParticipants() {
    var F = DMG.fight, out = [], seen = {}, k, field;
    if (!F) return out;
    function add(u) {
      var m = DMG.meta[u];
      if (!u || (m && m.ko)) return;          // 倒下的不占出手位（本轮记 0）
      if (seen[u]) return;
      seen[u] = 1; out.push(u);
    }
    field = dmgOnField();
    for (k in field) add(k);                  // 现在站在场上的
    if (!out.length) {
      // 场上没人（切人/渲染空档）时退回队伍里还活着的
      for (k in DMG.meta) if (DMG.meta[k].act) add(k);
      if (!out.length) for (k in F.acted) add(k);
    }
    return out;
  }

  function dmgRoundCheck() {
    var F = DMG.fight;
    if (!F || !F.on) return false;
    var ps = dmgParticipants(), all = ps.length > 0, i;
    for (i = 0; i < ps.length; i++) if (!DMG.round[ps[i]]) { all = false; break; }
    if (!all) return false;
    // 这一轮所有人出手都看过了，才重排名次、换 MVP
    var list = dmgList(), order = [];
    for (i = 0; i < list.length; i++) order.push(list[i].uid);
    var meta = DMG.meta, j;
    for (j = 0; j < DMG.order.length; j++) {              // 一只都没打过的排在后面
      if (order.indexOf(DMG.order[j]) < 0) order.push(DMG.order[j]);
    }
    DMG.sortUids = order;
    DMG.mvpUid = '';
    for (i = 0; i < order.length; i++) {
      var m = meta[order[i]], r = F.rows[order[i]];
      if (r && r.dmg > 0 && (!m || !m.ko)) { DMG.mvpUid = order[i]; break; }
    }
    DMG.mvpLock = true;
    DMG.round = {};
    DMG.sig = '';
    return true;
  }

  function dmgRoundStep(uid) {
    var F = DMG.fight;
    if (!F || !F.on || !uid) return;
    F.acted[uid] = 1;
    DMG.round[uid] = 1;
    dmgTouch(uid);                                        // 出过手就先上榜（打空记 0）
    dmgRoundCheck();
  }

  // 状态飘字的颜色 → 状态种类（只认中毒 / 灼烧，其余状态的飘字不算伤害）
  function dmgColorKind(color) {
    var c = String(color || '').toLowerCase().replace(/\s+/g, '');
    var m = /^rgba?\((\d+),(\d+),(\d+)/.exec(c), r, g, b;
    if (m) { r = Number(m[1]); g = Number(m[2]); b = Number(m[3]); }
    else {
      m = /^#([0-9a-f]{6})$/.exec(c);
      if (!m) return '';
      r = parseInt(m[1].slice(0, 2), 16);
      g = parseInt(m[1].slice(2, 4), 16);
      b = parseInt(m[1].slice(4, 6), 16);
    }
    if (r === 255 && g === 106 && b === 42) return 'burn';    // #ff6a2a
    if (r === 240 && g === 112 && b === 58) return 'burn';    // #f0703a（备用色）
    if (r === 182 && g === 90 && b === 214) return 'poison';  // #b65ad6
    return '';
  }

  function dmgFoeUid() {
    var e = document.querySelector('#enemy-slot .enemy[data-uid]');
    return (e && e.getAttribute('data-uid')) || '';
  }

  // 中毒 / 灼烧这类持续伤害：上状态那一刻记住出手的人和他用的招式，
  // 之后每回合跳的 -N 都记给那个人——哪怕它已经倒下、或者已经换回背包
  function dmgOnStatus(el) {
    var F = dmgLive();
    if (!F) return;
    var kind = dmgColorKind(el.style && el.style.color);
    if (!kind) return;
    var txt = String(el.textContent || '').trim();
    var pos = dmgPos(el);
    var side = dmgSide(pos);
    var foe = dmgFoeUid();
    if (DMG.dotsFoe && foe && foe !== DMG.dotsFoe) DMG.dots = {};   // 换敌人了，上一只的毒/火作废
    if (foe) DMG.dotsFoe = foe;
    if (txt.charAt(0) === '-') {                       // 掉血飘字："-120"
      var amt = dmgAmount(txt);
      if (!(amt > 0)) return;
      if (side === 'ally') {                          // 我们中的毒，不算输出
        F.taken += amt;
        /* 第一百一十六批：中毒 / 灼烧掉的血也算这只宝可梦的承伤 */
        dmgTakenAdd(dmgVictimUid(pos), amt);
        return;
      }
      if (side !== 'foe') return;
      var st = DMG.dots[kind];
      if (st && st.uid) {
        st.acc = (st.acc || 0) + amt;                  // 这次上状态的毒伤累计
        dmgAdd(st.uid, amt, st.move);                  // 挂在原主身上；这不算它这一轮出手
        // 招式的「最高伤害」按累计涨：每跳一次就在这一跳之前的数上再加，直到毒/火结束；
        // 下一次施放同一个招时 acc 从 0 重新累加，涨过旧记录才顶掉它
        if (st.move) {
          var rr = DMG.fight.rows[st.uid];
          var mv0 = rr && rr.moves[st.move];
          if (mv0 && st.acc > mv0.max) mv0.max = st.acc;
          if (mv0) {
            // 每一跳的数值也单独留一份，面板上按状态属性色标出来（最多记 12 跳）
            if (!mv0.ticks) mv0.ticks = [];
            if (mv0.ticks.length < 12) mv0.ticks.push(amt);
            mv0.dot = kind;
          }
        }
      }
      return;
    }
    // 剩下的是「刚中状态」的标签飘字（BRÛ / PSN）
    if (side !== 'foe') return;
    var who = dmgAttacker();
    if (!who) return;
    var mv = (Date.now() - DMG.lastMoveAt < 2500) ? DMG.lastMove : '';
    DMG.dots[kind] = { uid: who, move: mv, acc: 0 };     // 新的一次上状态：累计从头开始
    var r = dmgTouch(who);
    if (r && mv && !r.moves[mv]) r.moves[mv] = { n: mv, d: 0, h: 1, max: 0, dot: kind, ticks: [] };
    dmgRoundStep(who);                                 // 放状态招也算出过手
  }

  function dmgOnFloat(el) {
    if (!settings.dmgOn) return;
    var cls = ' ' + String(el.className || '') + ' ';
    if (cls.indexOf(' dmg ') < 0) return;
    if (cls.indexOf(' st-float ') >= 0) { dmgOnStatus(el); return; }   // 状态飘字：上状态 / 中毒灼烧掉血
    if (/ (money|heal) /.test(cls)) return;
    if (!dmgLive()) return;
    var amt = dmgAmount(el.textContent);
    var pos = dmgPos(el);
    var side = dmgSide(pos);
    if (side === 'ally') {                                // 我们挨打，不算输出
      if (amt > 0) {
        DMG.fight.taken += amt;
        /* 第一百一十六批：按飘字落点归到具体哪只我方，承伤页才能逐只排名 */
        dmgTakenAdd(dmgVictimUid(pos), amt);
      }
      return;
    }
    var who = dmgAttacker();
    if (!who) return;                                     // 归不到人就先不算，宁缺毋滥
    // 先记账再判轮次：这一下如果正好是本轮最后一手，也得算进名次
    if (amt > 0) {
      var mv = (Date.now() - DMG.lastMoveAt < 2500) ? DMG.lastMove : '';
      dmgAdd(who, amt, mv);
    } else {
      // 打空了：伤害记 0，但招式名还是记下来
      var mv2 = (Date.now() - DMG.lastMoveAt < 3000) ? DMG.lastMove : '';
      if (mv2) {
        var rr = dmgTouch(who);
        if (rr && !rr.moves[mv2]) rr.moves[mv2] = { n: mv2, d: 0, h: 1, max: 0 };
      }
    }
    dmgRoundStep(who);                                    // 打空了也算出过手（记 0）
  }

  function dmgReadLog() {
    var lg = DMG.logEl;
    if (!lg) return;
    // 游戏是 `#battle-log.innerHTML = 这一行`，整行覆盖写，直接读整个容器最稳
    var html = String(lg.innerHTML || '');
    if (html === DMG.logSig) return;
    DMG.logSig = html;
    var m = /<b[^>]*>([^<]*)<\/b>/.exec(html);
    if (!m) return;
    var name = m[1].trim();
    if (!name || !dmgMoveOf(name)) return;                // KO / 换人 / 捕获 的 <b> 不要
    DMG.lastMove = name;
    DMG.lastMoveAt = Date.now();
  }

  function dmgBind() {
    if (!settings.dmgOn) return;
    var fx = document.getElementById('arena-fx');
    if (fx && fx !== DMG.fx) {
      if (DMG.fxObs) DMG.fxObs.disconnect();
      DMG.fx = fx;
      DMG.fxObs = new MutationObserver(function (recs) {
        for (var i = 0; i < recs.length; i++) {
          var add = recs[i].addedNodes;
          for (var j = 0; j < add.length; j++) {
            var n = add[j];
            if (n && n.nodeType === 1) dmgOnFloat(n);
          }
        }
      });
      DMG.fxObs.observe(fx, { childList: true });
    }
    var lg = document.getElementById('battle-log');
    if (lg && lg !== DMG.logEl) {
      if (DMG.logObs) DMG.logObs.disconnect();
      DMG.logEl = lg;
      DMG.logSig = '';
      DMG.logObs = new MutationObserver(function () { dmgReadLog(); });
      DMG.logObs.observe(lg, { childList: true, characterData: true, subtree: true });
    }
  }

  /* ---- 汇总 ---- */

  // 面板上「每段伤害」那一行：把每一次跳的数值单独列出来，按状态属性色上色
  //（中毒 → 毒属性色，灼烧 → 火属性色）。数值相同的只写一遍，最多列 4 个。
  function dmgTicks(b, D, fallback) {
    if (!b || !b.ticks || !b.ticks.length) return '';
    var key = (b.dot === 'burn') ? 'fire' : (b.dot || '');
    var col = (key && D && D.color && D.color[key]) || fallback || '#8b93a7';
    var uniq = [], i;
    for (i = 0; i < b.ticks.length; i++) {
      if (uniq.indexOf(b.ticks[i]) < 0) uniq.push(b.ticks[i]);
    }
    var parts = [], shown = uniq.slice(0, 4);
    for (i = 0; i < shown.length; i++) {
      parts.push('<i style="color:' + col + '">' + dmgFmt(shown[i]) + '</i>');
    }
    if (uniq.length > shown.length) parts.push('<span class="sp">…</span>');
    return '<b class="dotv">每段伤害' + parts.join('<span class="sp">·</span>') + '</b>';
  }

  // 招式榜看「单次打得最狠」的那一招，平手才比累计
  function dmgMoveTop(r) {
    var best = null, k;
    for (k in r.moves) {
      var mv = r.moves[k];
      if (!best || mv.max > best.max || (mv.max === best.max && mv.d > best.d)) best = mv;
    }
    if (best) {
      var t = dmgMoveOf(best.n) || [-1, 0];
      best.ti = t[0];
      best.cat = t[1];
    }
    return best;
  }

  function dmgList() {
    var F = DMG.fight;
    if (!F) return [];
    var out = [], k;
    for (k in F.rows) {
      var r = F.rows[k], m = DMG.meta[k] || {};
      out.push({
        uid: r.uid, name: r.name, lv: r.lv, src: r.src, dmg: r.dmg, hits: r.hits,
        dead: !!m.ko, best: dmgMoveTop(r)
      });
    }
    out.sort(function (a, b) { return b.dmg - a.dmg; });
    return out;
  }

  // 总伤害页：固定 6 只，但名次只在「所有上场的一起出过一轮手」后重排
  function dmgRowList() {
    var F = DMG.fight, out = [], seen = {}, i, k;
    var base = DMG.order.slice(0);
    if (DMG.sortUids.length) {                        // 上一轮定下的名次优先
      for (i = 0; i < DMG.sortUids.length; i++) {
        if (base.indexOf(DMG.sortUids[i]) < 0) base.push(DMG.sortUids[i]);
      }
      var sorted = DMG.sortUids.slice(0), rest = [];
      for (i = 0; i < base.length; i++) if (sorted.indexOf(base[i]) < 0) rest.push(base[i]);
      base = sorted.concat(rest);
    }
    for (i = 0; i < base.length; i++) {
      var uid = base[i];
      if (!uid || seen[uid]) continue;
      seen[uid] = 1;
      var m = DMG.meta[uid] || {}, r = F && F.rows[uid];
      out.push({
        uid: uid,
        name: m.name || (r && r.name) || ('#' + uid),
        lv: m.lv || (r && r.lv) || '',
        src: m.src || (r && r.src) || '',
        dmg: r ? r.dmg : 0,
        dead: !!m.ko,
        best: r ? dmgMoveTop(r) : null
      });
    }
    if (F) {
      for (k in F.rows) {
        if (seen[k]) continue;
        var rr = F.rows[k];
        out.push({
          uid: k, name: rr.name, lv: rr.lv, src: rr.src,
          dmg: rr.dmg, dead: false, best: dmgMoveTop(rr)
        });
      }
    }
    return out;
  }

  /* 第一百一十六批：承伤页 —— 跟「总伤害」页一样把队伍全列出来，
   * 只是名次按「挨了多少打」从高到低排（sort 稳定，平手保持队伍顺序），
   * 每行再带上游戏自己画的实时 HP 百分比，供血条用。 */
  function dmgTakenRows() {
    var F = DMG.fight, out = [], seen = {}, i, k;
    if (!F) return out;
    var by = F.takenBy || {};
    var base = DMG.order.slice(0);
    for (k in by) if (base.indexOf(k) < 0) base.push(k);
    for (i = 0; i < base.length; i++) {
      var uid = base[i];
      if (!uid || seen[uid]) continue;
      seen[uid] = 1;
      var m = DMG.meta[uid] || {}, r = F.rows[uid], t = by[uid] || {};
      out.push({
        uid: uid,
        name: m.name || (r && r.name) || ('#' + uid),
        lv: m.lv || (r && r.lv) || '',
        src: m.src || (r && r.src) || '',
        dmg: t.dmg || 0,
        hits: t.hits || 0,
        max: t.max || 0,
        dead: !!m.ko,
        hp: dmgHpOf(uid),
        best: null
      });
    }
    out.sort(function (a, b) { return b.dmg - a.dmg; });
    return out;
  }

  // 招式页：出过手才上榜（一个个显示上去），按单次最高伤害排
  function dmgMoveRows() {
    var F = DMG.fight, out = [], k;
    if (!F) return out;
    for (k in F.rows) {
      if (!F.acted[k]) continue;
      var r = F.rows[k], m = DMG.meta[k] || {};
      out.push({
        uid: k,
        name: m.name || r.name,
        lv: m.lv || r.lv,
        src: m.src || r.src,
        dmg: r.dmg,
        dead: !!m.ko,
        best: dmgMoveTop(r)
      });
    }
    var rank = {};
    for (var i = 0; i < DMG.order.length; i++) rank[DMG.order[i]] = i;
    out.sort(function (a, b) {
      var am = a.best ? a.best.max : 0, bm = b.best ? b.best.max : 0;
      if (bm !== am) return bm - am;
      var ad = a.best ? a.best.d : 0, bd = b.best ? b.best.d : 0;
      if (bd !== ad) return bd - ad;
      return (rank[a.uid] || 0) - (rank[b.uid] || 0);
    });
    return out;
  }

  // 总伤害的 MVP：一整轮全都出过手才评一次，中途不换人
  function dmgMvp() {
    if (!DMG.mvpLock || !DMG.mvpUid) return null;
    var list = dmgList(), i;
    for (i = 0; i < list.length; i++) {
      if (list[i].uid === DMG.mvpUid && list[i].dmg > 0 && !list[i].dead) return list[i];
    }
    for (i = 0; i < list.length; i++) if (!list[i].dead && list[i].dmg > 0) return list[i];
    return null;
  }

  // 招式页的 MVP：单次伤害最高的那一只
  function dmgMoveMvp(rows) {
    var best = null, i;
    for (i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (!r.best || !(r.best.max > 0)) continue;
      if (!best || r.best.max > best.best.max) best = r;
    }
    return best;
  }

  /* ---- 面板 ---- */

  /* 配色走 theme.js 下发的 --pcg-* 变量（写在 host 的 inline style 上），
   * Shadow DOM 和普通 DOM 两条降级路径都能继承；每个 var() 带深色兜底。 */
  function dmgCss() {
    return [
      '.pnl{width:306px;max-width:calc(100vw - 18px);box-sizing:border-box;background:linear-gradient(180deg,var(--pcg-pnl-bg1,#191c26),var(--pcg-pnl-bg2,#12141c) 62%);',
      'border:1px solid var(--pcg-pnl-border,#303748);border-radius:12px;box-shadow:0 12px 30px var(--pcg-pnl-shadow,rgba(0,0,0,.55));',
      'color:var(--pcg-pnl-text,#e8ecf4);font:12px/1.35 "Microsoft YaHei","PingFang SC",system-ui,sans-serif;',
      'overflow:hidden;user-select:none}',
      '.hd{display:flex;align-items:center;gap:6px;padding:7px 8px 6px;background:var(--pcg-hd-bg,rgba(255,255,255,.03));',
      'border-bottom:1px solid var(--pcg-hd-line,#262c3a);cursor:move}',
      '.tabs{display:flex;gap:2px;background:var(--pcg-tabs-bg,#0d0f16);border-radius:7px;padding:2px;flex:0 0 auto}',
      '.tb{border:0;background:transparent;color:var(--pcg-lv-text,#8b93a7);font:700 10.5px/1 inherit;padding:4px 6px;',
      'border-radius:5px;cursor:pointer;font-family:inherit}',
      '.tb.on{background:var(--pcg-tb-on-bg,#2b3242);color:var(--pcg-gold,#ffd76a)}',
      '.sub{flex:1 1 auto;min-width:0;text-align:right;font-weight:700;font-size:11px;color:var(--pcg-sub-text,#cfd7e8);',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.sub b{color:var(--pcg-gold,#ffd76a)}',
      '.fold{flex:0 0 20px;width:20px;height:20px;border:0;border-radius:5px;background:var(--pcg-fold-bg,#222838);color:var(--pcg-fold-text,#9aa4b8);',
      'cursor:pointer;font:700 13px/1 inherit;padding:0}',
      '.rows{max-height:min(236px,calc(100vh - 260px));overflow-y:auto;padding:4px 6px 6px}',
      '.rw{display:flex;align-items:center;gap:7px;padding:4px 5px;border-radius:8px}',
      '.rw+.rw{margin-top:2px}',
      '.rw.top{background:linear-gradient(90deg,var(--pcg-row-top1,rgba(255,203,5,.15)),var(--pcg-row-top2,rgba(255,203,5,.02)))}',
      '.rw.idle{opacity:.42}',
      '.rw.dead{opacity:.45}',
      '.rw.dead .spr{filter:grayscale(1)}',
      '.spr{width:28px;height:28px;flex:0 0 28px;object-fit:contain;image-rendering:pixelated}',
      '.spr.no{background:var(--pcg-spr-no,#1e232f);border-radius:6px}',
      '.mid{flex:1 1 auto;min-width:0}',
      '.l1{display:flex;align-items:center;gap:5px;min-width:0}',
      '.nm{font-weight:700;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.lv{color:var(--pcg-lv-text,#8b93a7);font-size:10px;flex:0 0 auto}',
      '.mvp{flex:0 0 auto;font:900 8.5px/1 inherit;letter-spacing:.1em;padding:2px 5px 1px;border-radius:4px;',
      'color:#3a2a00;font-style:italic;transform:skewX(-10deg);',
      'background:linear-gradient(180deg,#fff7bd,#ffd23f 52%,#e39600);',
      'box-shadow:0 0 9px rgba(255,203,5,.75),inset 0 1px 0 rgba(255,255,255,.85);',
      'text-shadow:0 1px 0 rgba(255,255,255,.6)}',
      '.mv{display:flex;align-items:center;gap:4px;margin-top:1px;min-width:0}',
      '.mvn{font-size:10.5px;color:var(--pcg-mvn-text,#c3cbdc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.mvn.dim{color:var(--pcg-mvn-dim,#6b7488)}',
      '.chip{flex:0 0 auto;font:700 9px/1 inherit;padding:2px 4px;border-radius:4px;color:#111}',
      '.bar{height:4px;border-radius:3px;background:var(--pcg-bar-bg,#232a38);margin-top:5px;overflow:hidden}',
      '.bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#4f8cff,#7fb0ff)}',
      '.rw.top .bar i{background:linear-gradient(90deg,var(--pcg-gold,#ffd76a),#ffb300)}',
      /* 第一百一十六批：承伤页的实时 HP 血条。绿 / 黄 / 红三档跟游戏血量配色一致，
       * 读不到 HP 时给一条灰底空条，不假装满血。 */
      '.hpbar{height:6px;border-radius:3px;background:var(--pcg-bar-bg,#232a38);margin-top:5px;overflow:hidden;',
      'box-shadow:inset 0 1px 2px rgba(0,0,0,.35)}',
      '.hpbar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#2fbf6b,#63d99a)}',
      '.hpbar i.mid{background:linear-gradient(90deg,#e8a700,#ffd05a)}',
      '.hpbar i.low{background:linear-gradient(90deg,#d63a45,#ff7b84)}',
      '.hpbar i.none{background:var(--pcg-num-dim,#4d5567)}',
      '.hpline{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:2px;',
      'font-size:9px;color:var(--pcg-lv-text,#8b93a7)}',
      '.hpline b{font-weight:800;color:var(--pcg-pnl-text,#e8ecf4)}',
      '.hpline b.mid{color:#ffd05a}',
      '.hpline b.low{color:#ff7b84}',
      '.rk{flex:0 0 auto;font:800 9px/1 inherit;padding:2px 4px;border-radius:4px;',
      'background:var(--pcg-tb-on-bg,#2b3242);color:var(--pcg-lv-text,#8b93a7)}',
      '.rw.top .rk{background:linear-gradient(180deg,#fff7bd,#ffd23f);color:#3a2a00}',
      '.num{flex:0 0 96px;display:flex;flex-direction:column;align-items:flex-end;text-align:right}',
      '.num b{font:800 13px/1.1 inherit;color:var(--pcg-gold,#ffd76a);letter-spacing:.2px}',
      '.num b.dim{color:var(--pcg-num-dim,#4d5567);font-weight:700}',
      '.num b.hi{font:700 9px/1.2 inherit;color:var(--pcg-lv-text,#8b93a7);letter-spacing:0;white-space:nowrap}',
      '.num b.hi i{font:800 13px/1 inherit;font-style:normal;margin-left:2px;color:var(--pcg-gold,#ffd76a)}',
      '.num b.hi.dim{color:var(--pcg-num-dim,#4d5567)}',
      '.num b.hi.dim i{color:var(--pcg-num-dim,#4d5567)}',
      '.num b.dotv{font:700 9.5px/1.35 inherit;color:var(--pcg-lv-text,#8b93a7);letter-spacing:0;white-space:nowrap;',
      'max-width:100%;overflow:hidden;text-overflow:ellipsis}',
      '.num b.dotv i{font-style:normal;font-weight:800;margin-left:1px}',
      '.num b.dotv .sp{color:var(--pcg-num-sep,#3f4657);margin:0 2px}',
      '.num span{font-size:9px;color:var(--pcg-lv-text,#8b93a7);margin-top:1px;line-height:1.2}',
      '.ft{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 9px 7px;',
      'border-top:1px solid var(--pcg-hd-line,#262c3a);color:var(--pcg-lv-text,#8b93a7);font-size:10px}',
      '.ft b{color:var(--pcg-pnl-text,#e8ecf4)}',
      '.dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--pcg-dot,#3ddc84);',
      'margin-right:5px;vertical-align:middle}',
      '.empty{padding:16px 8px;text-align:center;color:var(--pcg-mvn-dim,#6b7488);font-size:11px}',
      '.pnl.folded .rows,.pnl.folded .ft{display:none}',
      /* 第八十九批：触摸屏（Kiwi 等手机浏览器）上把折叠键和切页键放大，
       * 手指点得准；行高也放宽一档，桌面上这条 media 不命中。 */
      '@media (pointer:coarse){',
      '.pnl{width:auto;min-width:280px;max-width:calc(100vw - 12px);font-size:12.5px}',
      /* 顶栏要能拖动：告诉浏览器这里的手势别拿去滚页面 */
      '.hd{padding:9px 9px 8px;touch-action:none}',
      '.tb{font-size:11.5px;padding:6px 8px}',
      '.fold{flex:0 0 26px;width:26px;height:26px;border-radius:7px;font-size:14px}',
      '.rows{max-height:min(260px,calc(100vh - 300px));padding:5px 7px 7px}',
      '.rw{padding:5px 6px}',
      '.nm{font-size:12px}',
      '.num{flex:0 0 92px}.num b{font-size:13.5px}',
      '.ft{font-size:10.5px}',
      '}'
    ].join('');
  }

  function dmgSaveUi() {
    try {
      chrome.storage.local.set({ pcgDmgUi: { x: DMG.x, y: DMG.y, tab: DMG.tab, fold: DMG.fold } });
    } catch (e) { /* ignore */ }
  }

  function dmgLoadUi() {
    if (DMG.uiAt) return;
    DMG.uiAt = Date.now();
    try {
      chrome.storage.local.get(DMG_UI_KEY, function (o) {
        var v = (o && o[DMG_UI_KEY]) || {};
        if (typeof v.x === 'number' && typeof v.y === 'number') { DMG.x = v.x; DMG.y = v.y; }
        if (v.tab === 'move' || v.tab === 'total' || v.tab === 'taken') DMG.tab = v.tab;
        /* 第一百二十批：默认收起。只有玩家自己展开过（存档里存过 boolean）才沿用，
         * 没有存档 / 存档里没这个字段时保持默认收起，别被 !!undefined 覆盖成展开。 */
        if (typeof v.fold === 'boolean') DMG.fold = v.fold;
        if (DMG.built) { dmgPlace(); dmgFold(); dmgPaint(Date.now()); }
      });
    } catch (e) { /* ignore */ }
  }

  // 右栏那张「此处出没」卡片：面板默认贴在它正下方
  function dmgZoneCard() {
    var zl = document.getElementById('zone-panel');
    if (!zl) return null;
    var cards = zl.querySelectorAll('.zone-box');
    var i, r;
    for (i = 0; i < cards.length; i++) {
      r = cards[i].getBoundingClientRect();
      if (r.width > 150 && r.height > 24) return cards[i];
    }
    r = zl.getBoundingClientRect();
    return (r.width > 150 && r.height > 24) ? zl : null;
  }

  // 没有右栏（比如地图/其它页面）时退回战斗画面：.arena 优先，其次 #arena
  function dmgArenaEl() {
    var list = document.querySelectorAll('.arena, #arena');
    for (var i = 0; i < list.length; i++) {
      var r = list[i].getBoundingClientRect();
      if (r.width > 240 && r.height > 140) return list[i];
    }
    return null;
  }

  // 画面底部被游戏自己的东西占掉多少：战斗日志、自动/加速按钮那一排
  function dmgBottomBar(ar) {
    var bar = 10, i, r;
    var ls = document.querySelectorAll('.battle-log');
    for (i = 0; i < ls.length; i++) {
      r = ls[i].getBoundingClientRect();
      if (r.height > 0 && r.top > ar.top && r.top < ar.bottom) bar = Math.max(bar, ar.bottom - r.top);
    }
    var cs = document.querySelectorAll('.adv-controls');
    for (i = 0; i < cs.length; i++) {
      r = cs[i].getBoundingClientRect();
      if (r.height > 0 && r.top > ar.top && r.top < ar.bottom) bar = Math.max(bar, ar.bottom - r.top);
    }
    return Math.min(bar + 8, ar.height * 0.5);
  }

  // 默认位：右栏「此处出没」卡片正下方；没有右栏就退回战斗画面右下角；被拖过就按拖到的位置（并夹在视口内）
  function dmgPlace() {
    var h = DMG.host;
    if (!h) return;
    var vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
    var left, top, docked = false;
    if (DMG.x != null && DMG.y != null) {
      left = DMG.x; top = DMG.y;
    } else {
      var card = dmgZoneCard();
      var cr = card ? card.getBoundingClientRect() : null;
      if (cr && cr.width > 200 && cr.width < 420 && cr.height > 20) {
        // 贴着卡片下沿、和卡片同宽；卡片本身跟着页面滚，所以这里用它的实时位置
        DMG.pnl.style.width = Math.round(cr.width) + 'px';
        left = cr.left;
        top = cr.bottom + 8;
        docked = true;
      } else {
        DMG.pnl.style.width = '';
        var a = dmgArenaEl();
        if (a) {
          var w = (DMG.pnl && DMG.pnl.offsetWidth) || 306;
          var ph = (DMG.pnl && DMG.pnl.offsetHeight) || 250;
          var r = a.getBoundingClientRect();
          left = r.right - w - 10;
          top = r.bottom - dmgBottomBar(r) - ph;
          if (top < r.top + 6) top = r.top + 6;
          if (left < r.left + 6) left = r.left + 6;
        } else {
          var w2 = (DMG.pnl && DMG.pnl.offsetWidth) || 306;
          var ph2 = (DMG.pnl && DMG.pnl.offsetHeight) || 250;
          left = vw - w2 - 12;
          top = vh - ph2 - 12;
        }
      }
    }
    left = Math.max(4, Math.min(Math.max(4, vw - 60), left));
    top = Math.max(4, Math.min(Math.max(4, vh - 44), top));
    h.style.left = Math.round(left) + 'px';
    h.style.right = 'auto';
    h.style.top = Math.round(top) + 'px';
    // 面板不能比视口还长：贴着卡片时按剩余高度收一收列表（不够就只留一两行，绝不压到卡片上）
    if (DMG.rowsEl) {
      var room = vh - top - 12 - 70;
      DMG.rowsEl.style.maxHeight = Math.round(Math.max(40, Math.min(236, room))) + 'px';
    }
    return docked;
  }

  function dmgPlaceSoon() {
    var now = Date.now();
    if (now - DMG.placeAt < 120) return;
    DMG.placeAt = now;
    dmgPlace();
  }

  function dmgFold() {
    if (DMG.pnl) DMG.pnl.classList.toggle('folded', !!DMG.fold);
    if (DMG.host) DMG.host.setAttribute('data-fold', DMG.fold ? '1' : '0');
  }

  function dmgMake() {
    if (DMG.built && DMG.host && DMG.host.isConnected) return true;
    if (!document.body) return false;
    var host = document.createElement('div');
    host.id = 'pcg-dmg-host';
    host.style.cssText = 'position:fixed;z-index:2147483000;display:none;';
    // 外观：把当前主题的配色变量挂到 host 上，Shadow DOM 内的样式就能跟着浏览器明暗走
    try { if (window.PCG_THEME) window.PCG_THEME.applyHost(host); } catch (e) { /* ignore */ }
    var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
    if (root === host) {
      var st = document.createElement('style');
      st.textContent = dmgCss();
      host.appendChild(st);
    } else {
      var st2 = document.createElement('style');
      st2.textContent = dmgCss();
      root.appendChild(st2);
    }
    var pnl = document.createElement('div');
    pnl.className = 'pnl';
    pnl.innerHTML =
      '<div class="hd">' +
        '<span class="tabs"><button class="tb" data-t="move" type="button">招式伤害</button>' +
        '<button class="tb" data-t="total" type="button">总伤害</button>' +
        '<button class="tb" data-t="taken" type="button">承伤</button></span>' +
        '<span class="sub"></span>' +
        '<button class="fold" type="button" title="收起">–</button>' +
      '</div>' +
      '<div class="rows"></div>' +
      '<div class="ft"></div>';
    root.appendChild(pnl);
    document.body.appendChild(host);

    DMG.host = host;
    DMG.pnl = pnl;
    DMG.tabsEl = pnl.querySelector('.tabs');
    DMG.subEl = pnl.querySelector('.sub');
    DMG.rowsEl = pnl.querySelector('.rows');
    DMG.footEl = pnl.querySelector('.ft');
    DMG.built = true;

    DMG.tabsEl.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('.tb') : null;
      if (!b) return;
      var t = b.getAttribute('data-t');
      if (t !== 'move' && t !== 'total' && t !== 'taken') return;
      DMG.tab = t;
      dmgSaveUi();
      DMG.sig = '';
      dmgPaint(Date.now());
    });
    pnl.querySelector('.fold').addEventListener('click', function () {
      DMG.fold = !DMG.fold;
      dmgFold();
      if (DMG.x == null) { DMG.placeAt = 0; dmgPlaceSoon(); }
      dmgSaveUi();
    });

    var hd = pnl.querySelector('.hd');
    hd.addEventListener('dblclick', function (e) {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      // 双击标题栏：忘掉手动拖的位置，回到「此处出没」卡片下面
      DMG.x = null; DMG.y = null; DMG.placeAt = 0; DMG.dockKey = '';
      dmgPlace();
      dmgSaveUi();
    });
    /* 第八十九批：拖动改成 pointer 事件优先（触摸屏上 mousedown 要等手指抬起才补发，
     * 手机上拖面板会变成「划一下页面」），老浏览器退回 mouse。 */
    var dragEv = window.PointerEvent
      ? { down: 'pointerdown', move: 'pointermove', up: 'pointerup' }
      : { down: 'mousedown', move: 'mousemove', up: 'mouseup' };
    hd.addEventListener(dragEv.down, function (e) {
      if (e.target && e.target.closest && e.target.closest('button')) return;
      if (e.button != null && e.button !== 0) return;
      var r = host.getBoundingClientRect();
      var dx = e.clientX - r.left, dy = e.clientY - r.top;
      function mv(ev) {
        DMG.x = Math.max(0, Math.min(window.innerWidth - 80, ev.clientX - dx));
        DMG.y = Math.max(0, Math.min(window.innerHeight - 30, ev.clientY - dy));
        dmgPlace();
      }
      function up() {
        document.removeEventListener(dragEv.move, mv, true);
        document.removeEventListener(dragEv.up, up, true);
        dmgSaveUi();
      }
      document.addEventListener(dragEv.move, mv, true);
      document.addEventListener(dragEv.up, up, true);
      e.preventDefault();
    });

    dmgPlace();
    dmgFold();
    dmgLoadUi();

    // 窗口尺寸一变就重新贴回默认位（卡片下面 / 战斗画面右下角）
    if (!DMG.resizeB) {
      DMG.resizeB = true;
      window.addEventListener('resize', function () {
        DMG.dockKey = '';
        DMG.placeAt = 0;
        if (DMG.shown) dmgPlaceSoon();
      });
      window.addEventListener('scroll', function () {
        if (DMG.shown && DMG.x == null) dmgPlaceSoon();
      }, true);
    }
    return true;
  }

  function dmgPaint(now) {
    var F = DMG.fight;
    if (!F || !DMG.built) return;
    var moveTab = (DMG.tab === 'move');
    var takenTab = (DMG.tab === 'taken');
    var rows = takenTab ? dmgTakenRows() : (moveTab ? dmgMoveRows() : dmgRowList());
    var total = F.total;
    var takenTotal = F.taken || 0;
    var shownTotal = takenTab ? takenTotal : total;   // 占比的分母：承伤页用总承伤
    var sec = Math.max(0, Math.round(((F.on ? now : (F.endAt || now)) - F.t0) / 1000));
    var mv = dmgMvp();
    var mm = moveTab ? dmgMoveMvp(rows) : null;

    var tb = DMG.pnl.querySelectorAll('.tb');
    for (var i = 0; i < tb.length; i++) {
      tb[i].classList.toggle('on', tb[i].getAttribute('data-t') === DMG.tab);
    }
    DMG.subEl.innerHTML = takenTab
      ? ((rows.length && rows[0].dmg > 0)
        ? ('承伤最多 <b>' + dmgEsc(rows[0].name) + '</b> · ' + dmgFmt(rows[0].dmg))
        : '还没挨打')
      : (moveTab
        ? ((mm && mm.best) ? ('MVP <b>' + dmgEsc(mm.best.n) + '</b> · ' + dmgFmt(mm.best.max)) : '还没出手')
        : (mv ? ('MVP <b>' + dmgEsc(mv.name) + '</b> · ' + dmgFmt(mv.dmg)) : '等这一轮打完'));

    var topDmg = 0, j;
    for (j = 0; j < rows.length; j++) if (rows[j].dmg > topDmg) topDmg = rows[j].dmg;

    var html = '';
    if (!rows.length) {
      html = '<div class="empty">' + (moveTab ? '还没出手' : '等这一场开打…') + '</div>';
    } else {
      for (j = 0; j < rows.length; j++) {
        var r = rows[j], b = r.best, mid, num;
        var isMvp = takenTab ? false
          : (moveTab ? !!(mm && mm.uid === r.uid) : !!(mv && mv.uid === r.uid));
        var isTop = takenTab ? (j === 0 && r.dmg > 0)
          : (isMvp && (moveTab ? !!(b && b.max > 0) : r.dmg > 0));
        var pct = shownTotal > 0 ? Math.round(r.dmg / shownTotal * 1000) / 10 : 0;
        var w = topDmg > 0 ? Math.max(r.dmg > 0 ? 3 : 0, Math.min(100, r.dmg / topDmg * 100)) : 0;
        var head = '<div class="l1">' +
          (takenTab ? '<span class="rk">#' + (j + 1) + '</span>' : '') +
          '<span class="nm">' + dmgEsc(r.name) + '</span>' +
          (r.lv ? '<span class="lv">Lv.' + dmgEsc(r.lv) + '</span>' : '') +
          (!moveTab && !takenTab && isTop ? '<b class="mvp">MVP</b>' : '') + '</div>';
        if (takenTab) {
          /* 第一百一十六批：血条画的是游戏实时 HP，不是承伤占比；
           * 读不到 HP 时给灰底空条，不假装满血。 */
          var hp = r.hp;
          var hpW = (hp == null) ? 0 : Math.max(0, Math.min(100, hp));
          var hpCls = (hp == null) ? 'none' : (hpW <= 25 ? 'low' : (hpW <= 50 ? 'mid' : ''));
          var hpTxt = (hp == null) ? '—' : (Math.round(hpW) + '%');
          mid = head +
            '<div class="hpbar"><i class="' + hpCls + '" style="width:' + hpW.toFixed(1) + '%"></i></div>' +
            '<div class="hpline"><span>实时 HP</span><b class="' + hpCls + '">' + hpTxt + '</b></div>';
          num = '<b>' + dmgFmt(r.dmg) + '</b><span>承伤 ' + pct + '%</span>';
        } else if (moveTab) {
          if (b) {
            var D = dmgStab();
            var tname = (b.ti >= 0 && D && D.order) ? D.order[b.ti] : '';
            var col = (tname && D.color && D.color[tname]) || '#5b6478';
            var tzh = (tname && D.tzh && D.tzh[tname]) || '';
            var mpct = total > 0 ? Math.round(b.d / total * 1000) / 10 : 0;
            mid = head + '<div class="mv">' +
              (tzh ? '<span class="chip" style="background:' + col + '">' + dmgEsc(tzh) + '</span>' : '') +
              '<span class="mvn' + (b.max > 0 ? '' : ' dim') + '">' + dmgEsc(b.n) + '</span>' +
              (isTop ? '<b class="mvp">MVP</b>' : '') + '</div>';
            num = dmgTicks(b, D, col) +
              '<b class="hi' + (b.max > 0 ? '' : ' dim') + '">最高伤害<i>' + dmgFmt(b.max) + '</i></b>' +
              '<span>招式占总伤害' + mpct + '%</span>';
          } else {
            mid = head + '<div class="mv"><span class="mvn dim">' +
              (r.dead ? '已经倒下' : (r.hits ? '没记到招式名' : '打空了')) + '</span></div>';
            num = '<b class="dim">—</b><span>—</span>';
          }
        } else {
          mid = head + '<div class="bar"><i style="width:' + w.toFixed(1) + '%"></i></div>';
          num = '<b>' + dmgFmt(r.dmg) + '</b><span>' + pct + '%</span>';
        }
        var cls = 'rw' + (isTop ? ' top' : '') + (r.dead ? ' dead' : (r.dmg > 0 ? '' : ' idle'));
        html += '<div class="' + cls + '"' + (r.dead ? ' title="已经倒下"' : '') + '>' +
          (r.src ? '<img class="spr" src="' + dmgEsc(r.src) + '" alt="">' : '<span class="spr no"></span>') +
          '<div class="mid">' + mid + '</div>' +
          '<div class="num">' + num + '</div></div>';
      }
    }
    if (html !== DMG.sig) { DMG.rowsEl.innerHTML = html; DMG.sig = html; }

    DMG.footEl.innerHTML = '<span><i class="dot"></i>本场 <b>' + sec + '</b> 秒</span>' +
      '<span>本场' + (takenTab ? '总承伤' : '总伤害') + ' <b>' +
      dmgFmt(takenTab ? takenTotal : total) + '</b></span>';
  }

  function dmgShow(now) {
    if (!dmgMake()) return;
    if (!DMG.shown) {
      DMG.host.style.display = '';
      DMG.shown = true;
      DMG.dockKey = '';
    }
    // 卡片/画面动了就重新贴（拖过的不动）
    if (DMG.x == null) {
      var card = dmgZoneCard();
      var cr = card ? card.getBoundingClientRect() : null;
      var key;
      if (cr && cr.width > 200 && cr.width < 420) {
        key = ['c', Math.round(cr.left), Math.round(cr.bottom), Math.round(cr.width),
          window.innerWidth, window.innerHeight].join(',');
      } else {
        var a = dmgArenaEl();
        key = a ? ['a', Math.round(a.getBoundingClientRect().right),
          Math.round(a.getBoundingClientRect().bottom), window.innerWidth, window.innerHeight].join(',') : 'v';
      }
      if (key !== DMG.dockKey) { DMG.dockKey = key; DMG.placeAt = 0; dmgPlaceSoon(); }
    }
    dmgPaint(now);
  }

  function dmgHide() {
    if (DMG.host && DMG.shown) { DMG.host.style.display = 'none'; DMG.shown = false; }
  }

  /* ---- 世界BOSS：只有结算面板有逐只伤害 ---- */

  function dmgWbStyle() {
    if (DMG.css) return;
    DMG.css = true;
    var st = document.createElement('style');
    st.id = 'pcg-dmg-wb-css';
    st.textContent = [
      '.wb-dps-row.pcg-top{background:linear-gradient(90deg,rgba(255,203,5,.14),rgba(255,203,5,0))}',
      '.pcg-wb-mvp{display:inline-block;margin-left:5px;padding:1px 4px;border-radius:4px;',
      'font:900 8.5px/1.25 inherit;font-style:italic;letter-spacing:.1em;color:#3a2a00;transform:skewX(-10deg);',
      'background:linear-gradient(180deg,#fff7bd,#ffd23f 52%,#e39600);',
      'box-shadow:0 0 8px rgba(255,203,5,.7);text-shadow:0 1px 0 rgba(255,255,255,.6)}',
      '.pcg-wb-top{display:flex;align-items:center;gap:6px;margin:2px 0 4px;font-size:11px;color:#cfd7e8}',
      '.pcg-wb-top b{color:#ffd76a}',
      '.pcg-wb-top i{font-style:normal;color:#8b93a7}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  function dmgWbRows(box) {
    var rows = [], rws = box.querySelectorAll('.wb-dps-row');
    var total = 0;
    var tb = box.querySelector('.wb-rc-total b[data-n]');
    if (tb) total = Number(tb.getAttribute('data-n')) || 0;
    for (var i = 0; i < rws.length; i++) {
      var rw = rws[i];
      var nm = rw.querySelector('.nm span') || rw.querySelector('.nm');
      var nb = rw.querySelector('.num b[data-n]');
      var img = rw.querySelector('img');
      var sm = rw.querySelector('.nm small');
      var dmg = nb ? (Number(nb.getAttribute('data-n')) || 0) : 0;
      rows.push({
        row: rw,
        name: nm ? String(nm.textContent || '').trim() : '',
        dmg: dmg,
        lv: sm ? (String(sm.textContent || '').match(/\d+/) || [''])[0] : '',
        src: img ? (img.currentSrc || img.src || '') : ''
      });
      if (!tb) total += dmg;
    }
    return { rows: rows, total: total };
  }

  function dmgWbPaint(box) {
    var got = dmgWbRows(box);
    var rows = got.rows;
    if (!rows.length) return;
    dmgWbStyle();
    var top = rows[0], i;
    for (i = 1; i < rows.length; i++) if (rows[i].dmg > top.dmg) top = rows[i];

    for (i = 0; i < rows.length; i++) {
      var rw = rows[i].row;
      var isTop = (rw === top.row) && top.dmg > 0;
      rw.classList.toggle('pcg-top', isTop);
      var badge = rw.querySelector('.pcg-wb-mvp');
      if (isTop && !badge) {
        var sm = rw.querySelector('.nm small');
        var b = document.createElement('b');
        b.className = 'pcg-wb-mvp';
        b.textContent = 'MVP';
        if (sm && sm.parentNode) sm.parentNode.insertBefore(b, sm.nextSibling);
        else (rw.querySelector('.nm') || rw).appendChild(b);
      } else if (!isTop && badge) {
        badge.parentNode.removeChild(badge);
      }
    }

    var head = box.querySelector('.wb-rc-total');
    if (head && top.dmg > 0) {
      var chip = box.querySelector('.pcg-wb-top');
      if (!chip) {
        chip = document.createElement('div');
        chip.className = 'pcg-wb-top';
        head.insertAdjacentElement('afterend', chip);
      }
      var sec = DMG.wbDur ? ('<i>·</i> 本场 ' + DMG.wbDur + ' 秒') : '';
      var pct = got.total > 0 ? Math.round(top.dmg / got.total * 1000) / 10 : 0;
      var want = '<b>MVP ' + dmgEsc(top.name) + '</b><i>·</i> 总伤害 ' + dmgFmt(top.dmg) +
        '<i>·</i> 占 ' + pct + '%' + sec;
      if (chip.innerHTML !== want) chip.innerHTML = want;
    }
  }

  function dmgWbTick(now) {
    var view = document.querySelector('.wb-view');
    if (!view) {
      DMG.wbEl = null; DMG.wbDur = 0; DMG.wbT0 = 0; DMG.wbSpilled = false;
      return false;
    }
    var spill = view.querySelector('.wb-spill');
    if (spill && !spill.hidden) {
      if (!DMG.wbSpilled) { DMG.wbSpilled = true; DMG.wbDur = 0; DMG.wbT0 = now; }
      var t = spill.querySelector('.sp-t');
      if (t) {
        var s = dmgClock(t.textContent);
        if (s > DMG.wbDur) DMG.wbDur = s;
      }
    } else if (spill) {
      DMG.wbSpilled = false;
    }
    var box = view.querySelector('.wb-recap');
    if (!box) { DMG.wbEl = null; return true; }
    if (box !== DMG.wbEl) {
      DMG.wbEl = box;
      dmgWbRows(box);
    }
    dmgWbPaint(box);
    return true;
  }

  /* ---- 主循环 ---- */

  function dmgTick(now) {
    if (!settings.dmgOn) {
      dmgHide();
      if (DMG.fxObs) { DMG.fxObs.disconnect(); DMG.fxObs = null; DMG.fx = null; }
      if (DMG.logObs) { DMG.logObs.disconnect(); DMG.logObs = null; DMG.logEl = null; }
      return;
    }
    dmgBind();
    dmgRosterRefresh();

    var wb = dmgWbTick(now);
    if (wb) { dmgHide(); return; }

    var arena = dmgArenaRect();
    var foe = document.querySelector('#enemy-slot .enemy');
    var inBattle = !!(arena && arena.height > 0 && foe);
    var F = DMG.fight;
    if (inBattle) {
      if (!F || !F.on) dmgStart('battle');
      DMG.emptyAt = 0;
    } else if (F && F.on) {
      // 敌人被打倒、下一只还没上场时会短暂空一下，给 2 秒宽限
      if (!DMG.emptyAt) DMG.emptyAt = now;
      else if (now - DMG.emptyAt > 2000 || !arena || arena.height <= 0) dmgStop(now);
    }

    F = DMG.fight;
    if (!F) { dmgHide(); return; }
    if (F.on) { dmgShow(now); return; }
    if (F.total > 0 && (now - F.endAt) < DMG_KEEP_MS) { dmgShow(now); return; }
    dmgHide();
  }

  /* ---------------- 战斗属性提示：血条后面的属性牌 + 队伍头像的克制箭头 ---------------- */
  var TB = { at: 0, css: '', style: null, said: false, bad: 0, badSaid: false };

  function tbData() { return (typeof window !== 'undefined' && window.PCG_STAB) || null; }

  function tbTypes(id) {
    var D = tbData();
    if (!D || !D.ty || !id) return null;
    var t = D.ty[id];
    return (t && t.length) ? t : null;
  }

  // 精灵文件名里的图鉴号：assets/pokemon/25.png、assets/pokemon/art/shiny/still/25.png
  function tbPid(node) {
    if (!node || !node.querySelector) return 0;
    var img = node.querySelector('.wrap > img') || node.querySelector('img');
    if (!img) return 0;
    // page-hook 在页面里标好的（data URL 也能认出来），最可靠
    var tagged = Number(img.getAttribute('data-pcg-id'));
    if (tagged) return tagged;
    var src = img.getAttribute('data-src') || img.getAttribute('src') ||
      img.currentSrc || img.getAttribute('srcset') || '';
    if (!src || src.indexOf('data:') === 0) return 0;
    var m = null, re = /(\d+)[\w-]*\.png/g, x;   // 也认 assets/pokemon/145-gmax.png 这类形态
    while ((x = re.exec(src))) m = x;
    return m ? Number(m[1]) : 0;
  }

  // 精灵图没加载出来时，用存档里的 uid → 图鉴号兜一层（我方才有）
  function tbSaveId(uid) {
    if (!uid) return 0;
    var save = null;
    try { save = ugSave(); } catch (e) { save = null; }
    if (!save || !save.mons || !save.mons.length) return 0;
    for (var i = 0; i < save.mons.length; i++) {
      var m = save.mons[i];
      if (m && m.uid === uid && m.id) return Number(m.id) || 0;
    }
    return 0;
  }

  function tbMonId(node) {
    if (!node || !node.getAttribute) return 0;
    return tbPid(node) || tbSaveId(node.getAttribute('data-uid'));
  }

  // atkTypes 打 defTypes 能打出的最高倍率（属性招式里挑最划算的那个）
  function tbMult(atkTypes, defTypes) {
    var D = tbData();
    if (!D || !D.ch || !D.order || !atkTypes || !defTypes) return 0;
    var best = 0;
    for (var i = 0; i < atkTypes.length; i++) {
      var row = D.ch[atkTypes[i]];
      if (!row) continue;
      var prod = 1;
      for (var j = 0; j < defTypes.length; j++) {
        var k = D.order.indexOf(defTypes[j]);
        if (k < 0) continue;
        var c = row.charAt(k);
        prod *= (c === '2') ? 2 : (c === '5') ? 0.5 : (c === '0') ? 0 : 1;
      }
      if (prod > best) best = prod;
    }
    return best;
  }

  function tbChip(types) {
    var D = tbData();
    var out = '';
    for (var i = 0; i < types.length; i++) {
      var t = types[i];
      if (!D.color || !D.color[t]) continue;
      out += '<i style="background:' + D.color[t] + '">' + ((D.tzh && D.tzh[t]) || t) + '</i>';
    }
    return out;
  }

  // 血条后面挂属性牌；同一条血条只挂一次，换宝可梦才重建
  function tbBadge(node, types, key, side) {
    if (!node || !types) return;
    var wrap = node.querySelector('.wrap') || node;
    var sig = key + ':' + types.join(',') + ':' + side;
    var old = wrap.querySelector('.pcg-tb');
    if (old && old.getAttribute('data-sig') === sig) return;
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var el = document.createElement('span');
    el.className = 'pcg-tb ' + (side === 'left' ? 'tb-left' : 'tb-right');
    el.setAttribute('data-sig', sig);
    el.innerHTML = tbChip(types);
    wrap.appendChild(el);
  }

  // 头像右上角的绿/红箭头：dir 为空就清掉
  function tbArrow(row, dir) {
    if (!row || !row.querySelector) return;
    var old = row.querySelector('.pcg-tb-arrow');
    if (!dir) { if (old && old.parentNode) old.parentNode.removeChild(old); return; }
    if (old) {
      if (old.getAttribute('data-dir') === dir) return;
      old.parentNode.removeChild(old);
    }
    var el = document.createElement('i');
    el.className = 'pcg-tb-arrow ' + dir;
    el.setAttribute('data-dir', dir);
    el.textContent = (dir === 'up') ? '▲' : '▼';
    row.appendChild(el);
  }

  function tbCss() {
    return [
      '.pcg-tb{position:absolute;top:3%;display:flex;flex-direction:row;align-items:center;gap:3px;pointer-events:none;z-index:4}',
      '.pcg-tb.tb-left{right:71%;justify-content:flex-end}',   // 我方：血条左边
      '.pcg-tb.tb-right{left:71%}',                            // 敌方：血条右边
      '.pcg-tb i{font-style:normal;font-size:9px;line-height:1;padding:2px 3px;border-radius:3px;font-weight:800;color:#15171d;text-shadow:none;box-shadow:0 1px 0 rgba(0,0,0,.35);outline:1px solid rgba(0,0,0,.45);white-space:nowrap}',
      '.pcg-tb-arrow{position:absolute;top:0;right:1px;z-index:4;font-style:normal;font-size:11px;font-weight:900;line-height:1;pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.9)}',
      '.pcg-tb-arrow.up{color:#5fe07a}',
      '.pcg-tb-arrow.down{color:#ff6a6a}'
    ].join('\n');
  }

  function tbStyle(css) {
    if (!TB.style || !TB.style.parentNode) {
      TB.style = document.querySelector('style[data-pcg="tb"]');
      if (!TB.style) {
        TB.style = document.createElement('style');
        TB.style.setAttribute('data-pcg', 'tb');
        (document.head || document.documentElement).appendChild(TB.style);
      }
      TB.css = '';
    }
    if (TB.css !== css) { TB.style.textContent = css; TB.css = css; }
  }

  function tbTick(now) {
    if (settings.battleInfo === false) return;
    if (now - TB.at < 250) return;
    TB.at = now;
    var D = tbData();
    if (!D || !D.ty) return;
    var allies = document.querySelectorAll('#ally-slots .ally');
    var foes = document.querySelectorAll('#enemy-slot .enemy');
    if (!allies.length && !foes.length) return;
    tbStyle(tbCss());

    var multi = allies.length > 1 || foes.length > 1;   // 6 只同时上场：只标属性，不画箭头
    var i, t, id;

    var got = 0;
    for (i = 0; i < foes.length; i++) {
      id = Number(foes[i].getAttribute('data-id')) || tbMonId(foes[i]);
      t = tbTypes(id);
      if (t) { tbBadge(foes[i], t, 'f' + id, 'right'); got++; }
    }
    // 6 只同时上场：只标对方的属性，自己这边不上牌（也不画箭头）
    if (!multi) {
      for (i = 0; i < allies.length; i++) {
        id = tbMonId(allies[i]);
        t = tbTypes(id);
        if (t) { tbBadge(allies[i], t, 'a' + id, 'left'); got++; }
      }
    }
    if (got) {
      TB.bad = 0;
      if (!TB.said) { TB.said = true; log('战斗属性提示：已标出双方属性'); }
    } else if (!TB.badSaid) {
      TB.bad++;
      if (TB.bad >= 3) {
        TB.badSaid = true;
        var probe = (foes[0] || allies[0] || null);
        var pimg = probe ? (probe.querySelector('.wrap > img') || probe.querySelector('img')) : null;
        var raw = pimg ? String(pimg.getAttribute('src') || '') : '';
        log('战斗属性提示：认不出图鉴号（src=' + (raw ? raw.slice(0, 26) : '空') + '）');
      }
    }

    // 我方队伍头像：和场上那只对手比，谁更克制谁
    var foeTypes = null;
    if (!multi && foes.length === 1) {
      foeTypes = tbTypes(Number(foes[0].getAttribute('data-id')) || tbMonId(foes[0]));
    }
    var rows = document.querySelectorAll('#team-rail .tr-row');
    for (i = 0; i < rows.length; i++) {
      var myTypes = foeTypes ? tbTypes(tbMonId(rows[i])) : null;
      var dir = '';
      if (myTypes) {
        var mine = tbMult(myTypes, foeTypes);
        var theirs = tbMult(foeTypes, myTypes);
        if (mine > theirs) dir = 'up';
        else if (theirs > mine) dir = 'down';
      }
      tbArrow(rows[i], dir);
    }
  }

  /* ---------------- 培育屋：蛋里是不是异色 ---------------- */
  // v0.4.104：游戏把闪光判定从「uid 哈希」改成「训练家标识 + 蛋序号 k」的确定性哈希，
  // 判定细节见 nursery-monitor.js 的 eggIsShiny（要把整份存档传进去读 trainer.since/id）。
  // 这里只负责把判出来的 uid 变成 CSS 规则：在「蛋」后面用 ::after 挂两个金色艺术字，
  // 不往 DOM 里塞东西——游戏的 UI.morph 每次重画都会把塞进去的节点清掉，CSS 规则则一直有效。
  var EGG = { at: 0, sig: '', style: null, css: '' };

  function eggShinyUids() {
    var out = [];
    var save = ugSave();
    var eggs = save && save.pension && save.pension.eggs;
    if (!eggs || !eggs.length) return out;
    var N = window.PCG_NURSERY;
    var shinyOf = (N && typeof N.eggIsShiny === 'function')
      ? N.eggIsShiny
      : function (e) { return !!(e && e.shiny); };   // 模块缺席时退回旧口径
    for (var i = 0; i < eggs.length; i++) {
      var e = eggs[i];
      if (!shinyOf(e, save)) continue;
      var uid = String(e.uid == null ? '' : e.uid);
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(uid)) continue;   // 只会用在属性选择器里
      out.push(uid);
    }
    return out;
  }

  function eggCss(uids) {
    if (!uids.length) return '';
    /* 第三批「培育屋监测」接管了这段 CSS：闪光蛋除了「闪光」二字，
     * 还会补出中文名并加一圈金边（游戏没见过的蛋本来是 ???）。
     * 模块没加载 / 出错时原样退回旧实现，孵蛋闪光功能不会因此失效。 */
    try {
      if (window.PCG_NURSERY && typeof window.PCG_NURSERY.shinyCss === 'function') {
        return window.PCG_NURSERY.shinyCss(uids);
      }
    } catch (e) { /* 退回下面的旧实现 */ }
    var rule = ' .meta b::after{' +
      'content:"闪光";' +
      'display:inline-block;margin-left:6px;position:relative;top:-1px;' +
      'font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif;' +
      'font-style:italic;font-weight:900;font-size:13px;line-height:1;letter-spacing:2px;' +
      'background:linear-gradient(100deg,#fff8cf 0%,#ffdd6b 26%,#e9a51d 52%,#fff3b8 76%,#f2b93a 100%);' +
      '-webkit-background-clip:text;background-clip:text;' +
      'color:transparent;-webkit-text-fill-color:transparent;' +
      'filter:drop-shadow(0 1px 0 rgba(120,70,0,.6)) drop-shadow(0 0 6px rgba(255,201,72,.6));' +
      'transform:skewX(-8deg);' +
    '}';
    var out = [];
    for (var i = 0; i < uids.length; i++) {
      out.push('#pen-eggs .pen-egg[data-egg="' + uids[i] + '"]' + rule);
    }
    return out.join('\n');
  }

  function eggStyle(css) {
    if (!EGG.style) {
      EGG.style = document.createElement('style');
      EGG.style.setAttribute('data-pcg', 'egg-shiny');
      (document.head || document.documentElement).appendChild(EGG.style);
    }
    if (EGG.css === css) return;
    EGG.css = css;
    EGG.style.textContent = css;
  }

  function eggTick(now) {
    if (now - EGG.at < 1000) return;
    EGG.at = now;
    if (!document.getElementById('pen-eggs')) return;   // 培育屋没开着，省点事
    var uids = eggShinyUids();
    /* 签名里带上整段 CSS：切换「闪光蛋补名字」开关、蛋换了名字时也能立刻重画 */
    var css = '';
    try { css = eggCss(uids); } catch (e) { /* 下面会退回空串 */ }
    var sig = uids.join(',') + '|' + css;
    if (sig === EGG.sig) return;
    EGG.sig = sig;
    try { eggStyle(css); } catch (e) { /* ignore */ }
  }

  /* ---------------- 宝可梦收藏（仓库页） ---------------- */
  /* v1.39：detailUid = 最近一次点开详情的个体 uid（详情页收藏星用）。
   * 详情页 DOM 不带 uid（游戏把个体对象 qe 只用于渲染，不写进节点），
   * 所以只能靠「点格子的那一刻记下来」——游戏格子都有 data-uid。 */
  var FAV = { on: false, at: 0, map: null, sig: '', css: '', style: null, hit: null,
    detailUid: '', detailAt: 0 };
  var FAV_LS = 'pcgFavsBackup';   // 页面里再存一份，卸了插件再从装回来还能捡回收藏

  function favInit() {
    FAV.map = {};
    // 先读页面 localStorage 里那份备份：扩展被卸载 / 重装、chrome.storage 被清掉时靠它恢复
    try {
      var raw = localStorage.getItem(FAV_LS);
      if (raw) {
        var bak = JSON.parse(raw);
        if (bak && bak.map && typeof bak.map === 'object') FAV.map = bak.map;
      }
    } catch (e) { /* ignore */ }
    try {
      chrome.storage.local.get({ pcgFavs: {} }, function (o) {
        var got = (o && o.pcgFavs && typeof o.pcgFavs === 'object') ? o.pcgFavs : {};
        for (var k in got) { if (got.hasOwnProperty(k) && !FAV.map[k]) FAV.map[k] = got[k]; }
        FAV.sig = '';
        try { favPrune(); } catch (e) { /* ignore */ }
        favPersist();
        publishPcOrder(true);      // 收藏表读回来后立刻排一次自定义仓库
      });
    } catch (e) { /* ignore */ }
  }

  function favHas(uid) {
    return !!(uid && FAV.map && FAV.map[uid]);
  }

  function favPersist() {
    // 双写：chrome.storage（插件自己用）+ 页面 localStorage（重装插件后还能捡回来）
    var map = FAV.map || {};
    try {
      var o = {};
      o.pcgFavs = map;
      chrome.storage.local.set(o);
    } catch (e) { /* ignore */ }
    try {
      localStorage.setItem(FAV_LS, JSON.stringify({ v: 1, at: Date.now(), map: map }));
    } catch (e) { /* ignore */ }
  }

  // 记收藏时顺手把图鉴号记下来：万一这只以后被「重复合并」并掉 uid，
  // 还能按图鉴号把收藏认回去
  function favIdOf(uid) {
    if (!uid) return 0;
    try {
      var save = favSave();
      if (!save) return 0;
      var i;
      var list = save.mons || [];
      for (i = 0; i < list.length; i++) {
        if (list[i] && list[i].uid === uid) return Number(list[i].id) || 0;
      }
      var pen = (save.pension && save.pension.mons) || [];
      for (i = 0; i < pen.length; i++) {
        var m = pen[i] && pen[i].mon;
        if (m && m.uid === uid) return Number(m.id) || 0;
      }
    } catch (e) { /* ignore */ }
    return 0;
  }

  function favSet(uid, on) {
    if (!uid) return;
    if (!FAV.map) FAV.map = {};
    if (on) FAV.map[uid] = favIdOf(uid) || 1;
    else delete FAV.map[uid];
    FAV.sig = '';
    favPersist();
    publishPcOrder(true);          // 收藏一变，自定义仓库顺序立刻跟着变
  }

  /* ---------------- 第九批：仓库「自定义」排序 ----------------
   * 游戏 G.S.pcOrder 是「自定义」排序用的完整 uid 列表，pcSort 决定下拉框的值。
   * MAIN world 的 pc-sort-bridge.js 会把它注入存档；这里只负责算顺序并发布到
   * 页面 localStorage —— 两个 world 共享 localStorage，正好当传值通道。
   * 规则：收藏的一律置顶，收藏内部依次比「稀有度 → 能力（种族值总和）→ 等级」，
   *       其余保持最近获得的顺序；队伍里的那几只不在仓库里，不参与排序。 */
  var PC_ORDER_KEY = 'pcgPcOrderV1';
  var PC_ORDER = { at: 0, sig: '' };
  var PC_SORT = { done: false };

  /* 第十一批：所有带收藏星的功能共用同一条「收藏内部优先级」。
     收藏一律置顶，内部固定 稀有度 → 能力(种族值总和) → 等级 → 获得时间，
     不受下拉框选了哪种排序、也不受倒序影响。 */
  function favPriorityCmp(a, b) {
    return (favTier(Number(b.id)) - favTier(Number(a.id))) ||
           (favPower(Number(b.id)) - favPower(Number(a.id))) ||
           (Number(b.level) - Number(a.level)) ||
           (Number(b.caughtAt || 0) - Number(a.caughtAt || 0)) ||
           ((Number(a.id) || 0) - (Number(b.id) || 0));
  }

  function pcCmp(a, b) {
    var fa = favHas(a.uid) ? 1 : 0, fb = favHas(b.uid) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    if (fa) return favPriorityCmp(a, b);
    return (Number(b.caughtAt || 0) - Number(a.caughtAt || 0));
  }

  /* 第一百零二批：自定义顺序改成「玩家拖了算」。
     以前这里无条件按「收藏置顶 → 稀有度 → 能力 → 等级 → 获得时间」重排，
     而这份顺序每 2.5 秒就往游戏里发布一次（见 publishPcOrder）。于是玩家在仓库里
     把一只拖到鼠标指的那一格，下一拍就被这段重排改回去 —— 表现就是
     「自定义摆放摆不到鼠标指的位置」，而且看着像「按收藏把自定义位置改了」。
     现在：
       1. 存档里已经有 pcOrder（玩家拖过）→ 就照它来，一个都不动；
          存档里有、这次列表里没有的 uid（在队伍 / 地下通道）跳过；
          新抓的、还没进 pcOrder 的接在最后。
       2. 从没排过（新档 / 空表）→ 才用老口径生成一次，给个像样的初始形态。 */
  /* unknownFirst（第一百零四批）：游戏仓库的自定义比较器是
       (X.get(a.uid) ?? -1) - (X.get(b.uid) ?? -1) || b.caughtAt - a.caughtAt
     不在 pcOrder 里的 uid 拿到 -1，是排在**最前**的。配队弹窗跟着这份顺序走时
     也要用 -1；仓库自己那份仍用 1e9（新抓的接在最后，交给桥追加）。 */
  function pcCustomOrder(save, includeTeam, unknownFirst) {
    var all = (save && save.mons) || [];
    var team = includeTeam ? [] : ((save && save.team) || []);
    var list = [];
    var miss = unknownFirst ? -1 : 1e9;
    var i;
    for (i = 0; i < all.length; i++) {
      var m = all[i];
      if (!m || !m.uid || team.indexOf(m.uid) >= 0) continue;
      list.push(m);
    }
    var saved = (save && save.pcOrder) || [];
    if (saved.length) {
      var idx = {};
      for (i = 0; i < saved.length; i++) {
        var u = saved[i];
        if (u && idx[u] === undefined) idx[u] = i;
      }
      list.sort(function (a, b) {
        var ia = idx[a.uid], ib = idx[b.uid];
        ia = ia === undefined ? miss : ia;
        ib = ib === undefined ? miss : ib;
        if (ia !== ib) return ia - ib;
        return (Number(b.caughtAt) || 0) - (Number(a.caughtAt) || 0);
      });
    } else {
      list.sort(pcCmp);
    }
    var out = [];
    for (var j = 0; j < list.length; j++) out.push(list[j].uid);
    return out;
  }

  function publishPcOrder(force) {
    var now = Date.now();
    if (!force && now - PC_ORDER.at < 2500) return;
    var save = favSave();
    if (!save) return;
    var order = pcCustomOrder(save);
    if (!order.length) return;
    /* 第一百零六批：开关开（默认）时把 pin / favs 一并发布给 MAIN world 的排序桥。
     * 桥在「自定义」排序下据此把收藏整组提到 G.S.pcOrder 最前 —— 老档里玩家拖过之后
     * 存档已有 pcOrder，桥的「只补不改」会让 pcCmp() 的收藏置顶永远写不进去，
     * 这就是「自定义里收藏置顶在仓库不生效」的根因。 */
    var pin = settings.favOn !== false && settings.favPinOn !== false;
    var favs = Object.keys(FAV.map || {});
    var sig = favs.slice().sort().join(',') + '#' + (pin ? '1' : '0') + '#' + order.join('|');
    if (!force && sig === PC_ORDER.sig) { PC_ORDER.at = now; return; }
    PC_ORDER.sig = sig;
    PC_ORDER.at = now;
    try {
      localStorage.setItem(PC_ORDER_KEY, JSON.stringify({
        v: 1, at: now, sig: sig, order: order,
        pin: pin, favs: pin ? favs : null
      }));
    } catch (e) { /* 隐私模式下写不进就算了 */ }
    // 让游戏马上保存一次：桥会在 JSON.stringify(G.S) 时把新顺序注入内存，
    // 游戏自己的 onchange 再跟着 pt(!0) 重绘仓库，不用等下次周期保存。
    // 延后一帧，别和收藏星 / 收藏网格自己的重绘抢同一个节点。
    if (force) { try { setTimeout(pcRefresh, 60); } catch (e2) { /* ignore */ } }
  }

  function pcRefresh() {
    var sel = document.getElementById('pc-sort');
    if (!sel || sel.value !== 'custom') return;
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); }
    catch (e) { /* ignore */ }
  }

  // 兜底：万一游戏从云存档读回、没经过本地存档，也把下拉框拨回「自定义」。
  // 只在每页做一次；玩家当页手动改的排序不会被反复拽回来。
  function pcSortDefault() {
    if (PC_SORT.done) return;
    var sel = document.getElementById('pc-sort');
    if (!sel) return;
    PC_SORT.done = true;
    if (sel.value === 'custom') return;
    try { sel.value = 'custom'; } catch (e) { return; }
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); }
    catch (e2) { /* ignore */ }
  }

  /* 收藏视图必须读「此刻」的存档：ugSave() 有 2 秒缓存，刚换进队伍的宝可梦
   * 还会留在收藏列表里（看起来像队伍里的人被塞进了收藏仓库）。
   *
   * 第七十四批：但「此刻」不等于「每次调用都重新解析一遍」。
   * 这个存档是几 MB 的 JSON，PCG_SAVE.read(true) 每次都要 getItem + JSON.parse，
   * 一次十几到几十毫秒；而一拍 favTick 里 favLiftAll（自定义下的两个网格）/ favPaint /
   * publishPcOrder 会连着问四五次，在配队界面点一只宝可梦更是连着问七八次 ——
   * 这就是「点一只就要愣一下」的主因。
   *
   * 现在加一层 500ms 的短缓存：同一拍里只真正解析一次，相邻两拍（400ms）也能共用；
   * 跨过半秒一定重新读，换人 / 编队这种真实改动走 favSaveDrop() 立刻作废缓存。 */
  var FAV_SAVE = { at: 0, data: null };
  var FAV_SAVE_MS = 500;

  function favSaveDrop() {
    FAV_SAVE.at = 0;
    FAV_SAVE.data = null;
  }

  function favSave() {
    var now = Date.now();
    if (FAV_SAVE.at && now - FAV_SAVE.at < FAV_SAVE_MS) return FAV_SAVE.data;
    var data = null;
    var SAVE = window.PCG_SAVE || null;
    if (SAVE) data = SAVE.read(true);
    else {
      try {
        var raw = localStorage.getItem(UG_SAVE_KEY);
        if (raw) data = JSON.parse(raw);
      } catch (e) { data = null; }
    }
    FAV_SAVE.at = now;
    FAV_SAVE.data = data;
    return data;
  }

  // 进化不改 uid（游戏是 evolveMon(uid, 新图鉴号)），所以收藏天然跟着走。
  // 只有「重复的宝可梦被合并」时 uid 会被并掉：这时按图鉴号把收藏挪到留下来的那只。
  // 地下通道 / 大冒险 / 交换 / 队伍预设里的宝可梦也不在 save.mons 里，别把它们的收藏弄丢。
  function favPrune() {
    if (!FAV.map) return;
    var save = favSave();
    if (!save) return;
    var seen = {};
    var byUid = {};
    var byId = {};
    function add(mon) {
      if (!mon || !mon.uid) return;
      seen[mon.uid] = 1;
      if (mon.id) {
        byUid[mon.uid] = mon.id;
        if (!byId[mon.id]) byId[mon.id] = mon.uid;
      }
    }
    function grab(arr) {
      for (var j = 0; arr && j < arr.length; j++) {
        var v = arr[j];
        if (typeof v === 'string') seen[v] = 1;
        else add(v);
      }
    }
    var i;
    var list = save.mons || [];
    for (i = 0; i < list.length; i++) add(list[i]);
    var pen = (save.pension && save.pension.mons) || [];
    for (i = 0; i < pen.length; i++) add(pen[i] && pen[i].mon);
    var us = (save.under && save.under.slots) || [];
    for (i = 0; i < us.length; i++) grab(us[i] && us[i].mons);
    grab(save.road);
    add(save.tradeOut && save.tradeOut.mon);
    add(save.tradeIn && save.tradeIn.mon);
    add(save.buddy && save.buddy.mon);
    try { grab(save.link && save.link.stash && save.link.stash.team); } catch (e) { /* ignore */ }
    try {
      var sets = save.teamSets && save.teamSets.list;
      for (i = 0; sets && i < sets.length; i++) grab(sets[i]);
    } catch (e) { /* ignore */ }
    var changed = false;
    for (var k in FAV.map) {
      if (!FAV.map.hasOwnProperty(k)) continue;
      var rec = FAV.map[k];
      if (seen[k]) {
        var id = byUid[k];
        if (id && rec !== id) { FAV.map[k] = id; changed = true; }
        continue;
      }
      var back = (typeof rec === 'number' && rec > 0) ? byId[rec] : null;
      if (back && !FAV.map[back]) {
        delete FAV.map[k];
        FAV.map[back] = rec;
        changed = true;
        continue;
      }
      // 1 是老版本留下的「没记图鉴号」占位；除了它，有图鉴号就先留着，别误删
      if (typeof rec === 'number' && rec > 1) continue;
      delete FAV.map[k];
      changed = true;
    }
    if (changed) { FAV.sig = ''; favPersist(); }
  }

  function favEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function favCss() {
    /* 第七批：金色取自游戏 app.css :root，不再写死插件自己的黄色 */
    var GU = window.PCG_GAME_UI || null;
    var gold = GU && typeof GU.color === 'function' ? GU.color('gold') : '#ffd84a';
    return [
      /* 两个筛选按钮与游戏同款：chip btn small ghost + 游戏自己的 .chip.on 金色高亮。
         这里只管图标排版，不再自定义边框 / 文字颜色，避免和游戏其它筛选按钮长得不一样 */
      '.pcg-fav-chip .pcg-fav-ico{font-size:12px;line-height:1;color:inherit}',
      '.pcg-rank-chip .pcg-rank-ico{font-size:11px;line-height:1;color:inherit}',
      '.pcg-rank-chip .pcg-rank-n{font-size:11px;font-weight:800;color:inherit;opacity:.75}',
      '.pcg-rank-chip.off{opacity:.45;cursor:not-allowed}',
      /* 第一百一十九批：所有界面的收藏星统一挪到宝可梦立绘左下角并缩小，
         取消 hover 放大，避免点卡片时手一滑误触。队伍槽的更细则在下面覆盖。
         v1.43：去掉圆形外圈（背景/描边/阴影），只保留 ⭐ 本身；位置不变。 */
      '.pcg-star{position:absolute;top:auto;bottom:3px;right:auto;left:3px;z-index:6;display:flex;align-items:center;justify-content:center;width:18px;height:18px;font-style:normal;font-size:15px;line-height:1;color:var(--gold-soft,#ffe066);cursor:pointer;touch-action:manipulation;opacity:.95;filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));transition:opacity .12s ease}',
      '.pcg-star:hover{transform:none;opacity:1}',
      '.pcg-star.on{opacity:1}',
      /* v1.39：格子上的星是纯状态显示（点操作搬去详情页）——未收藏整颗隐藏，
       * 且不吃指针事件，点它会穿透到格子打开详情，方便在详情页里收藏。 */
      '.pcg-star.off{display:none!important}',
      '.pcg-star{pointer-events:none!important}',
      /* v1.41：详情页「收藏」按钮改成与游戏原生 .dc-buddy 完全同款的方角按钮，
         塞进 .dc-head 里、紧跟在「选择伙伴」皇冠球按钮后面。已收藏=金色实心星+金框，
         未收藏=灰度星，和伙伴按钮的 on/off 视觉语言一致。 */
      '.pcg-dc-fav{width:32px;height:32px;padding:0;overflow:hidden;display:grid;place-items:center;flex:none;border-radius:var(--r-sm,10px);background:var(--panel-2,#252a3d);border:2px solid var(--line,#333a52);cursor:pointer;touch-action:manipulation;user-select:none;transition:background var(--ease,.15s ease),border-color var(--ease,.15s ease)}',
      '.pcg-dc-fav img{width:32px;height:32px;max-width:none;margin:-2px;image-rendering:pixelated;display:block;transition:filter var(--ease,.15s ease),opacity var(--ease,.15s ease)}',
      '.pcg-dc-fav:not(.on) img{filter:grayscale(1);opacity:.45}',
      '.pcg-dc-fav:not(.on):hover img{opacity:.75}',
      '.pcg-dc-fav.on{border-color:var(--yellow,#ffcb05);background:color-mix(in srgb,var(--yellow,#ffcb05) 22%,var(--panel-2,#252a3d));box-shadow:0 0 0 2px color-mix(in srgb,var(--yellow,#ffcb05) 25%,transparent)}',
      /* v1.43：浅色主题同样只保留 ⭐，不再画圆形外圈 */
      ':root[data-theme="light"] .pcg-star,html[data-theme="light"] .pcg-star{color:#c97c05;filter:drop-shadow(0 1px 1px rgba(28,40,72,.3))}',
      ':root[data-theme="light"] .pcg-star.on,html[data-theme="light"] .pcg-star.on{color:#c97c05;opacity:1}',
      /* 星已挪到立绘左下角：右上角「可以进化 ▲」回到原位，不再给星让位 */
      '.pc-cell:has(.pcg-star) .pc-evo{right:2px!important}',
      '.slot.filled{position:relative}',
      /* 第一百一十八批：队伍界面收藏星移到立绘左下角并缩小；
         第一百一十九批：基类 .pcg-star 已统一改成左下角 18px（仓库 / 培育屋 /
         配队仓库网格等所有界面一起生效），这里只保留队伍槽 / 迷你队伍栏各自的
         尺寸微调，并继续取消 hover 放大，避免点卡片时误触。 */
      '.slot.filled .pcg-star{top:auto;bottom:3px;left:3px;right:auto;width:18px;height:18px;font-size:15px;opacity:.95}',
      '.slot.filled .pcg-star:hover{transform:none;opacity:1}',
      '#team-mini .slot.filled .pcg-star{top:auto;bottom:2px;left:2px;right:auto;width:14px;height:14px;font-size:12px}',
      '.slot.filled .pcg-star+.pcg-star{display:none}',
      /* 队伍槽不重排，只给收藏的那几只一圈金边，和网格置顶用同一份收藏状态 */
      '.slot.filled.pcg-fav-slot{outline:1px solid rgba(255,203,5,.6);outline-offset:-2px}',
      ':root[data-theme="light"] .slot.filled.pcg-fav-slot,html[data-theme="light"] .slot.filled.pcg-fav-slot{outline-color:#d8a933}',
      '#pen-grid.pcg-fav-on .pc-cell[data-uid]:not(.pcg-fav){display:none!important}',
      '#evt-pc.pcg-fav-on .pc-cell[data-uid]:not(.pcg-fav){display:none!important}',
      /* 第九十六批：培育屋 / 配队弹窗里「可等阶」也是藏格子。
         两条 :not 规则会叠加，所以「只看收藏 + 可等阶」= 交集，跟仓库一致 */
      '#pen-grid.pcg-rank-on .pc-cell[data-uid]:not(.pcg-rank-ok){display:none!important}',
      '#evt-pc.pcg-rank-on .pc-cell[data-uid]:not(.pcg-rank-ok){display:none!important}',
      '#pc-grid.pcg-fav-on > *:not(.pcg-fav-wrap){display:none!important}',
      '.pcg-fav-wrap{grid-column:1/-1;display:block}',
      '.pcg-fav-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:8px;align-content:start}',
      '.pcg-fav-cell .sprbox{width:100%;flex:1 1 auto;height:auto;min-height:0;padding:2px 4px 0}',
      '.pcg-fav-cell .sprbox img{width:100%;height:100%;object-fit:contain;image-rendering:pixelated}',
      '.pcg-fav-cell .lvl{position:relative;z-index:2}',
      '.pcg-sh{width:10px;height:10px;margin-right:2px;vertical-align:-1px;object-fit:contain;image-rendering:pixelated;color:' + gold + '}',
      'span.pcg-sh{width:auto;height:auto}',
      '.pcg-tm{position:absolute;top:2px;left:2px;right:auto;z-index:6;padding:1px 4px;border-radius:6px;font-size:10px;font-weight:700;line-height:1.4;color:#3a2a00;background:rgba(240,180,41,.92);box-shadow:0 1px 3px rgba(0,0,0,.3)}',
      '.pcg-fav-note{grid-column:1/-1;padding:6px 2px;color:#c9a24a;font-size:11px;line-height:1.6}',
      '.pcg-fav-empty{grid-column:1/-1;padding:40px 12px;text-align:center;color:#8b93a7;font-size:13px;line-height:1.8}'
    ].join('\n');
  }

  function favStyle(css) {
    if (!FAV.style) {
      FAV.style = document.createElement('style');
      FAV.style.setAttribute('data-pcg', 'fav');
      (document.head || document.documentElement).appendChild(FAV.style);
    }
    if (FAV.style.textContent !== css) FAV.style.textContent = css;
  }

  /* ================= 第一百零二批：队伍卡的名字被切掉半行 =================
   * 游戏 `#team-slots` / `#team-mini` 的卡片结构是
   *     .slot[flex-direction:column] > .w(精灵) + .name + .lv + .xpbar
   * 卡片高度是定死的（aspect-ratio / 网格行高）。内容一高，`.name` 这个 flex 子项
   * 就被压扁（默认 flex-shrink:1），而它自己带 overflow:hidden ——
   * 于是汉字只剩下半截露在外面，就是「滚下去以后名字显示不全」。
   * 三件事一起做：
   *   1. flex:0 0 auto + min-height：谁也不许把它压扁；
   *   2. overflow:visible + 明确 line-height：盒子再矮也不许裁字；
   *   3. position:relative + z-index：精灵那一坨（.w / .sprbox）盖不到字上。
   * 独立一张 <style data-pcg="cards">：跟收藏总开关无关，谁的开关都关不掉它。 */
  var CARD_CSS = [
    '#team-slots .slot .name,#team-mini .slot .name{',
    'flex:0 0 auto!important;display:block!important;',
    'height:auto!important;min-height:1.45em!important;max-height:none!important;',
    'line-height:1.45!important;margin:0!important;padding:0 2px!important;',
    'overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;',
    'position:relative!important;z-index:5!important}'
  ].join('\n');
  var CARD_STYLE = null;
  function cardStyle() {
    if (!CARD_STYLE) {
      CARD_STYLE = document.createElement('style');
      CARD_STYLE.setAttribute('data-pcg', 'cards');
      (document.head || document.documentElement).appendChild(CARD_STYLE);
    }
    if (CARD_STYLE.textContent !== CARD_CSS) CARD_STYLE.textContent = CARD_CSS;
  }

  function favFold(s) {
    return String(s == null ? '' : s).toLowerCase().trim();
  }

  // 当前仓库页的筛选项：搜索框、属性/地区的「已选」小药丸、异色、可以进化、排序
  function favFilters() {
    var f = { q: '', types: [], regions: [], shiny: false, evo: false, sort: 'recent', desc: false };
    var s = document.getElementById('pc-search');
    if (s) f.q = favFold(s.value);
    var pills = document.querySelectorAll('#pc-active [data-clear]');
    for (var i = 0; i < pills.length; i++) {
      var p = String(pills[i].getAttribute('data-clear') || '').split(':');
      if (p[0] === 'type' && p[1]) f.types.push(p[1]);
      else if (p[0] === 'region' && p[1]) f.regions.push(p[1]);
    }
    var sh = document.getElementById('pc-shiny');
    if (sh) f.shiny = sh.classList.contains('on');
    var ev = document.getElementById('pc-evo');
    if (ev) f.evo = ev.classList.contains('on');
    var so = document.getElementById('pc-sort');
    if (so && so.value) f.sort = so.value;
    var di = document.getElementById('pc-dir');
    if (di) f.desc = String(di.textContent || '').indexOf('\u2191') >= 0;
    return f;
  }

  function favRegion(id) {
    var D = tbData();
    if (!D || !D.rg) return '';
    var n = Number(id) || 0;
    for (var k in D.rg) {
      if (!D.rg.hasOwnProperty(k)) continue;
      var r = D.rg[k];
      if (r && n >= r[0] && n <= r[1]) return k;
    }
    return '';
  }

  function favCanEvo(m) {
    var D = tbData();
    var id = Number(m && m.id) || 0;
    var list = (D && D.evo && D.evo[id]) || null;
    if (!list) return false;
    var lv = Number(m.level) || 0;
    for (var i = 0; i < list.length; i++) {
      var need = list[i][1];
      if (typeof need === 'number') { if (lv >= need) return true; }
      else return true;   // 道具进化：手上有没有那颗石头我们看不到，先按「能进化」算
    }
    return false;
  }

  function favMatch(m, f) {
    var D = tbData();
    var id = Number(m.id) || 0;
    if (f.q) {
      var nm = favFold((D && D.nm && D.nm[id]) || '');
      if (nm.indexOf(f.q) < 0 && String(id) !== f.q) return false;
    }
    if (f.shiny && !m.shiny) return false;
    if (f.types.length) {
      var ty = (D && D.ty && D.ty[id]) || [];
      var hit = false;
      for (var i = 0; i < ty.length; i++) {
        if (f.types.indexOf(ty[i]) >= 0) { hit = true; break; }
      }
      if (!hit) return false;
    }
    if (f.regions.length && f.regions.indexOf(favRegion(id)) < 0) return false;
    if (f.evo && !favCanEvo(m)) return false;
    return true;
  }

  // 稀有度分档（0 常见 → 4 唯一），和图鉴一致
  function favTier(id) {
    var D = tbData();
    var raw = (D && D.rr) ? D.rr[id] : null;
    var n = (raw != null) ? Number(raw) : -1;   // 0=常见 也要正确取到，不能用真值判断
    return isFinite(n) ? n : 0;
  }

  // 六项种族值之和（游戏里的「能力」排序就是比这个）
  function favPower(id) {
    var D = tbData();
    var bs = (D && D.bs && D.bs[id]) || null;
    if (!bs) return 0;
    var n = 0;
    for (var i = 0; i < bs.length; i++) n += Number(bs[i]) || 0;
    return n;
  }

  function favSort(list, f) {
    var D = tbData();
    var k = f.sort;
    var favs = [], rest = [], i;
    /* 第十一批：不管下拉选的是推荐 / 图鉴 / 名称 / 等级 / 稀有度 / 能力 / 自定义，
       所有带收藏星的视图都先按「收藏优先」分层；收藏段用统一优先级，
       其余段才按玩家选的排序走。倒序也只翻非收藏段，收藏永远在最前。 */
    for (i = 0; i < list.length; i++) {
      (favHas(list[i].uid) ? favs : rest).push(list[i]);
    }
    favs.sort(favPriorityCmp);
    rest.sort(function (a, b) {
      var da = Number(a.id) || 0, db = Number(b.id) || 0;
      if (k === 'dex') return (da - db) || (String(a.uid) < String(b.uid) ? -1 : 1);
      if (k === 'name') {
        var na = (D && D.nm && D.nm[a.id]) || '';
        var nb = (D && D.nm && D.nm[b.id]) || '';
        return na.localeCompare(nb, 'zh-Hans') || (da - db);
      }
      if (k === 'level') return (Number(b.level) - Number(a.level)) || (da - db);
      if (k === 'rarity') return (favTier(db) - favTier(da)) || (da - db);
      if (k === 'stats') return (favPower(db) - favPower(da)) || (Number(b.level) - Number(a.level)) || (da - db);
      // recent / custom：非收藏保持最近获得的顺序（游戏的 custom 也以它打底）
      return (Number(b.caughtAt) || 0) - (Number(a.caughtAt) || 0) || (da - db);
    });
    // 游戏在 custom 下忽略倒序（T.desc && Je!=="custom"），这里保持一致
    if (f.desc && k !== 'custom') rest.reverse();
    list.length = 0;
    for (i = 0; i < favs.length; i++) list.push(favs[i]);
    for (i = 0; i < rest.length; i++) list.push(rest[i]);
    return list;
  }

  function favCell(m) {
    var D = tbData();
    var id = Number(m.id) || 0;
    var lv = Number(m.level) || 0;
    var nm = (D && D.nm && D.nm[id]) || ('No.' + id);
    var src = 'assets/pokemon/' + (m.shiny ? 'shiny/' : '') + id + '.png';
    // 这里的格子可能是「收藏」视图，也可能是「可等阶」视图：星的状态必须逐只看，
    // 不能因为「在收藏视图里」就默认是已收藏（1.9.66 修）
    var on = favHas(m.uid);
    /* 闪光角标用游戏自己的 sparkle.svg；图标模块没加载时才退回文字 */
    var GU = window.PCG_GAME_UI || null;
    var shSrc = GU && typeof GU.icon === 'function' ? GU.icon('sparkle') : '';
    var shTag = m.shiny
      ? (shSrc ? '<img class="pcg-sh" alt="" src="' + shSrc + '">' : '<span class="pcg-sh">✦</span>')
      : '';
    return '<div class="pc-cell pcg-fav-cell" data-uid="' + favEsc(m.uid) + '" title="' + favEsc(nm + (lv ? ' Nv.' + lv : '')) + '">' +
      '<div class="sprbox"><img src="' + src + '" alt="" loading="lazy"></div>' +
      '<span class="lvl">' + shTag + (lv ? 'Nv.' + lv : '') + '</span>' +
      /* v1.39：星只作状态显示——收藏了显示 ⭐，没收藏不显示；点击操作搬到详情页 */
      '<i class="pcg-star' + (on ? ' on' : ' off') + '">' + (on ? '\u2B50' : '') + '</i>' +
      '</div>';
  }

  /* v1.39：格子上的星改成了「纯状态显示」——收藏了才在原位显示 ⭐，
   * 没收藏就不显示；收藏 / 取消收藏的操作统一搬到详情页立绘上。
   * 所以这里去掉 data-uid（点击处理不再认它）、设 pointer-events:none，
   * 未收藏的用 .off 隐藏。收藏状态仍靠 .pcg-star.on / .pcg-fav-slot 表达。 */
  function favStarOne(cell) {
    if (!cell || !cell.getAttribute) return;
    var uid = cell.getAttribute('data-uid') || '';
    var star = cell.querySelector('.pcg-star');
    if (!star) {
      star = document.createElement('i');
      star.className = 'pcg-star';
      cell.appendChild(star);
    }
    // 状态展示用，不再是可点的收藏开关：去掉 uid、去掉点击 title
    if (star.hasAttribute('data-uid')) star.removeAttribute('data-uid');
    if (star.hasAttribute('title')) star.removeAttribute('title');
    var on = favHas(uid);
    var cls = 'pcg-star' + (on ? ' on' : ' off');
    var txt = on ? '\u2B50' : '';   // ⭐ 收藏；未收藏留空并由 .off 隐藏
    if (star.className !== cls) star.className = cls;
    if (star.textContent !== txt) star.textContent = txt;
    // 队伍槽是固定出战位，不能重排；只把「已收藏」标记出来，和网格置顶同一套状态
    if (cell.classList.contains('slot') &&
        cell.classList.contains('pcg-fav-slot') !== on) {
      cell.classList.toggle('pcg-fav-slot', on);
    }
    favSlotRow(cell);
  }

  /* 配队窗的队伍卡：把名字挪到收藏星后面，两个一起在卡片最下面那行居中。
     游戏在紧凑布局里把 .slot .name 设成 display:none 了，所以这里自己搭一行。 */
  function favSlotRow(cell) {
    if (!cell || !cell.closest || !cell.closest('#evt-team')) return;
    var star = cell.querySelector('.pcg-star');
    var name = cell.querySelector('.name');
    if (!star || !name) return;
    var row = cell.querySelector('.pcg-slot-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'pcg-slot-row';
      cell.appendChild(row);
    }
    if (star.parentNode !== row || row.firstChild !== star) row.insertBefore(star, row.firstChild);
    if (name.parentNode !== row || star.nextSibling !== name) row.appendChild(name);
  }

  // ---------------- 「可等阶」筛选（仓库） ----------------
  // 游戏自己的规则（Underground.rankOf / rankUp）：等级满 100、等阶 < 5、
  // 手里 <属性:宝石档位> 的宝石够「当前等阶 + 1」颗，就能升一等。
  // 档位 = min(3, Game.tierIndex(图鉴号))，按 captureRate / 进化链 / 种族值算出来，
  // **不是** stab.js 的 D.rr（那是「图鉴稀有度」，完全不同的另一套口径）。
  /* 第一百零九批：以前拿 D.rr 拼宝石 key，线上 BUILD 0f9f344391 的
   * tierIndex 与它有 31 个图鉴号对不上（例：#342 铁螯龙虾游戏标「少见」= 1，
   * D.rr 却是 0）。结果插件拿囤得最多的「常见」宝石去判「可等阶」，
   * 一堆其实升不了的宝可梦全进了筛选列表（玩家看到的「可等阶 105」）。
   * 下表由线上 bundle 的 POKEDEX + EVOLUTIONS + TIER_MIN 复刻 tierIndex 生成：
   * 下标 = 图鉴号 - 1，字符 '0'~'3' = 宝石档位。游戏再改分档规则要重新生成。
   * 属性表 D.ty 与线上 DEX.types 逐项核对过 493/493 一致，继续沿用。 */
  var GEM_TIER = '2222222220120120120101010101012012020201010120101010102010201201201201202012020101202010202012201010112012220111222010102222222202222222222222233322233222222222010101012010000101012201120122011012221202101012012222112010110122212212222122222233322233322222222201010121201201202020121101012012012010001220120112000000101020110100120102112201010222221220020112200101201120222222333333333322222222201201020120222221221200101012010122011010200021222112021201101211222222222222222221233333333333333';
  function gemTier(id) {
    var n = Number(id) || 0;
    if (n >= 1 && n <= GEM_TIER.length) return Number(GEM_TIER.charAt(n - 1)) || 0;
    var D = window.PCG_STAB;              // 形态 / 新图鉴号：退回旧口径，至少有个数
    return Math.max(0, Math.min(3, Number(D && D.rr && D.rr[n]) || 0));
  }
  var RANK = { on: false, cnt: 0, map: {}, at: 0, why: '' };
  var RANK_MAX = 5;
  var RANK_LV = 100;

  function rankInfo() {
    var out = { map: {}, cnt: 0, lv: 0, gem: 0 };
    var st = window.PCG_STAB;
    var save = favSave();
    if (!st || !st.ty || !save) return out;   // 第一百零九批：档位改走 GEM_TIER，不再依赖 st.rr / st.order
    var gems = (save.under && save.under.gems) || {};
    var mons = save.mons || [];
    for (var i = 0; i < mons.length; i++) {
      var m = mons[i];
      if (!m || !m.uid) continue;
      var rank = Number(m.rank) || 0;
      if (rank >= RANK_MAX) continue;                   // 已经等阶 V，升不动了
      if ((Number(m.level) || 0) < RANK_LV) continue;    // 没到 100 级
      var tid = Number(m.id) || 0;
      var ty = st.ty[tid] || [];
      if (!ty.length) continue;
      var tier = gemTier(tid);            // 第一百零九批：与游戏 gemKeys 的 tierIndex 对齐
      var need = rank + 1;
      var best = 0;
      var bkey = '';
      for (var j = 0; j < ty.length; j++) {
        var key = ty[j] + ':' + tier;
        var have = Number(gems[key]) || 0;
        if (have > best) { best = have; bkey = key; }
      }
      if (best >= need) { out.map[m.uid] = { need: need, have: best, key: bkey }; out.cnt++; }
      else { out.lv++; if (best > 0) out.gem++; }
    }
    return out;
  }

  function rankChipIn(host) {
    /* 第一百一十批：不再绑「宝可梦收藏」开关，也不再强求 #pc-evo 一定在。
     * 游戏把筛选栏折进 .pc-more 后，锚点可能换了位置，甚至暂时还没渲染。 */
    if (!host) return null;
    var evo = host.querySelector('#pc-evo');
    var anchor = evo ||
      host.querySelector('#pc-shiny, #pc-evo-all, #pc-dir, .pc-more-btn') || null;
    var chip = host.querySelector('.pcg-rank-chip');
    if (chip) return chip;
    chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip btn small ghost pcg-rank-chip';
    chip.innerHTML = '<span class="pcg-rank-ico">⬆</span><span class="chip-l">可等阶</span><b class="pcg-rank-n">0</b>';
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (RANK.cnt <= 0) return;                        // 一颗都升不起，不给点
      RANK.on = !RANK.on;
      FAV.sig = '';
      favPaint();
      rankSync();
    });
    // 游戏的「可以进化」(#pc-evo) 常被折进 .pc-more 子容器里；找不到时
    // 退到同一条筛选栏上任意一枚现成的 chip / 按钮旁边，实在没有才追加到末尾。
    var parent = (anchor && anchor.parentNode) || host;
    if (parent && typeof parent.insertBefore === 'function') {
      parent.insertBefore(chip, (anchor && anchor.nextSibling) || null);
    } else {
      host.appendChild(chip);
    }
    return chip;
  }

  /* 第一百一十批：挑「可等阶」该挂在哪条筛选栏上。
   * 游戏 v0.4.10x 起页面里同时有好几条 .pc-filters（仓库 / 配队弹窗 / 交换 / 黑市），
   * 老写法 document.querySelector('.pc-filters') 只取第一条，且要求它里面必须有
   * #pc-evo —— 一旦取到配队弹窗或黑市那条，按钮就再也不注入（玩家看到「找不到了」）。 */
  function rankHost() {
    var all = document.querySelectorAll('.pc-filters');
    var i, el;
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (el.querySelector && el.querySelector('#pc-evo')) return el;
    }
    var team = document.querySelector('#screen-team .pc-filters');
    if (team) return team;
    for (i = 0; i < all.length; i++) {
      el = all[i];
      if (el.querySelector && el.querySelector('#pc-search, #pc-shiny, #pc-evo-all, #pc-dir, .pc-more-btn')) return el;
    }
    return all[0] || null;
  }

  function rankSync() {
    var chips = document.querySelectorAll('.pcg-rank-chip');
    var ok = RANK.cnt > 0;
    for (var i = 0; i < chips.length; i++) {
      var chip = chips[i];
      var n = chip.querySelector('.pcg-rank-n');
      if (n && n.textContent !== String(RANK.cnt)) n.textContent = String(RANK.cnt);
      var on = !!RANK.on && ok;
      if (chip.classList.contains('on') !== on) chip.classList.toggle('on', on);
      if (chip.classList.contains('off') !== !ok) chip.classList.toggle('off', !ok);
      chip.setAttribute('aria-disabled', ok ? 'false' : 'true');
      if (ok) chip.removeAttribute('disabled');
      else chip.setAttribute('disabled', 'disabled');
      var tip = ok
        ? (RANK.on ? '只看现在能升阶的；再点一下取消' : '只看现在能升阶的（等级 100、等阶没满、宝石够）')
        : (RANK.why || '现在一只都升不起：要么没有 100 级的，要么等阶宝石不够（rank+1 颗）');
      if (chip.title !== tip) chip.title = tip;
    }
  }

  function rankChipOut() {
    var chips = document.querySelectorAll('.pcg-rank-chip');
    for (var i = 0; i < chips.length; i++)
      if (chips[i].parentNode) chips[i].parentNode.removeChild(chips[i]);
  }

  function rankTick(now) {
    /* 第一百一十批：与「宝可梦收藏」开关解耦，宿主改由 rankHost() 挑。 */
    var host = rankHost();
    if (!host) return;
    if (now - RANK.at > 1000) {
      RANK.at = now;
      var info = rankInfo();
      RANK.map = info.map;
      RANK.cnt = info.cnt;
      RANK.why = info.cnt ? '' : (info.lv === 0
        ? '电脑里没有 100 级的宝可梦'
        : (info.gem ? '等阶宝石不够了：还差 rank+1 颗' : '等的都齐了，就是宝石不够'));
      if (RANK.on && RANK.cnt <= 0) {
        RANK.on = false;
        FAV.sig = '';
        log('可等阶：现在一只都升不起了，筛选已自动关掉');
        favPaint();
      }
    }
    rankChipIn(host);
    rankSync();
  }

  function favStars() {
    if (settings.favOn === false) return;
    var cells = document.querySelectorAll(
      '#pc-grid .pc-cell[data-uid], #pen-grid .pc-cell[data-uid], #evt-pc .pc-cell[data-uid], ' +
      '#team-slots .slot.filled[data-uid], #team-mini .slot.filled[data-uid], #evt-team .slot.filled[data-uid]'
    );
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].classList.contains('pcg-fav-cell')) continue;   // 自己画的格子已经带星
      favStarOne(cells[i]);
    }
  }

  /* ---------------- 第十一批：所有带收藏星的网格统一置顶 ----------------
   * 这一层在 DOM 上把收藏格子挪到最前，补「自定义」排序桥管不到的场景
   * （培育屋 / 配队弹窗不走 pcOrder）。第 105 批整层停用，第一百零六批按玩家要求
   * **恢复，但收窄到只在「自定义」排序下生效**：
   *   · 开关 favPinOn 默认开，关掉时这一层完全不跑；
   *   · 仓库 pc-grid 一律不碰（VGrid，见 favLiftGrid 里的注释），走 pcOrder 那条路；
   *   · 培育屋 pen-grid / 配队弹窗 evt-pc 只在对应下拉是 custom 时才动 DOM；
   *   · 其它排序（最近 / 等级 / 能力 …）与筛选按钮全部回归游戏自己处理。
   * 这样既让「自定义」里的收藏置顶在培育屋生效，又不再和拖拽落点 / 虚拟网格抢节点。 */
  var FAV_LIFT_GRIDS = ['pc-grid', 'pen-grid', 'evt-pc'];
  /* 第七十四批：at = 拖拽保护到期时间戳（0 = 没在拖）；x/y/down 用来分辨
   * 「点了一下」和「真的在拖格子」—— 只有后者才需要把置顶让开。 */
  var FAV_DRAG = { at: 0, x: 0, y: 0, down: 0 };
  var FAV_LIFT_T = 0;

  /* 点完立刻排一次置顶（游戏这一拍刚重绘完），120ms 后再补一次兜住它自己的重绘。
   * 合并成一发：连点也不会排出一堆定时器。
   * 第七十四批：进来先把存档缓存扔掉 —— 点击往往就是换人 / 编队，存档刚变过，
   * 不扔的话这一下会拿半秒前的旧档排序。 */
  function favLiftSoon(ms) {
    if (FAV_LIFT_T) return;
    FAV_LIFT_T = setTimeout(function () {
      FAV_LIFT_T = 0;
      try { favSaveDrop(); favLiftAll(); } catch (e) { /* ignore */ }
      try { setTimeout(favLiftAll, 120); } catch (e2) { /* ignore */ }
    }, ms || 40);
  }

  /* 第七十四批：uid → 宝可梦对象的索引表，按「存档对象是谁」缓存。
   * 同一拍里 favLiftGrid 会为仓库 / 培育屋 / 配队弹窗各要一次，
   * 原来每次都要把几千只遍历一遍重新建表；存档没换就复用同一张。 */
  var FAV_BOX = { save: null, box: null };

  function favLiftBox() {
    var save = favSave() || {};
    if (FAV_BOX.save === save && FAV_BOX.box) return FAV_BOX.box;
    var box = {};
    function put(m) { if (m && m.uid && !box[m.uid]) box[m.uid] = m; }
    var all = save.mons || [];
    for (var i = 0; i < all.length; i++) put(all[i]);
    var pn = (save.pension && save.pension.mons) || [];
    for (i = 0; i < pn.length; i++) put(pn[i] && pn[i].mon);
    var us = (save.under && save.under.slots) || [];
    for (i = 0; i < us.length; i++) {
      var ms = (us[i] && us[i].mons) || [];
      for (var j = 0; j < ms.length; j++) put(ms[j]);
    }
    FAV_BOX.save = save;
    FAV_BOX.box = box;
    return box;
  }

  function favLiftGrid(id) {
    var grid = document.getElementById(id);
    if (!grid) return;
    /* 第一百零二批：仓库那块网格一律不碰。
       它是虚拟网格 t.VGrid —— 格子靠 transform 摆位置，在这儿挪 DOM 节点画面不会动，
       但「第几个格子」的顺序被换掉了；游戏算拖拽落点时是
       querySelectorAll('#pc-grid .pc-cell') 按 DOM 顺序数格子的，
       于是玩家拖到第 5 格会落到别的地方（就是「摆不到鼠标指的位置」）。
       仓库的自定义顺序现在归玩家自己（见 pcCustomOrder），不再需要这一层置顶。
       培育屋 / 配队弹窗还是老样子：那里换人靠点，不靠落点索引。 */
    if (id === 'pc-grid') return;
    if (FAV_DRAG.at && Date.now() - FAV_DRAG.at < 700) return;   // 玩家正在拖格子，别抢节点
    var cells = [], i;
    for (i = 0; i < grid.children.length; i++) {
      var c = grid.children[i];
      if (c && c.classList && c.classList.contains('pc-cell') && c.getAttribute('data-uid')) cells.push(c);
    }
    if (cells.length < 2) return;
    var favs = [], rest = [];
    for (i = 0; i < cells.length; i++) {
      (favHas(cells[i].getAttribute('data-uid')) ? favs : rest).push(cells[i]);
    }
    if (!favs.length) return;                            // 一只收藏都没有，保持游戏原顺序
    var box = favLiftBox();
    favs.sort(function (a, b) {
      var ma = box[a.getAttribute('data-uid')] || { id: 0, level: 0, caughtAt: 0 };
      var mb = box[b.getAttribute('data-uid')] || { id: 0, level: 0, caughtAt: 0 };
      return favPriorityCmp(ma, mb);
    });
    var ok = true;
    for (i = 0; i < favs.length; i++) if (cells[i] !== favs[i]) { ok = false; break; }
    if (ok) return;                                      // 已经置顶且顺序正确，不动 DOM
    var tailAnchor = cells[cells.length - 1].nextSibling || null;
    var anchor = rest.length ? rest[0] : tailAnchor;
    var frag = document.createDocumentFragment();
    for (i = 0; i < favs.length; i++) frag.appendChild(favs[i]);
    try {
      if (anchor && anchor.parentNode === grid) grid.insertBefore(frag, anchor);
      else grid.appendChild(frag);
    } catch (e) { /* 游戏正好重绘，下一拍再来 */ }
  }

  /* 第一百零六批：开关默认开，但只在「自定义」排序下让收藏排前排。
     其它排序一律不挪节点，全交给游戏；关掉开关则两条路都不走。 */
  function favLiftAll() {
    if (settings.favOn === false || settings.favPinOn === false) return;
    for (var i = 0; i < FAV_LIFT_GRIDS.length; i++) {
      var id = FAV_LIFT_GRIDS[i];
      if (id === 'pc-grid') continue;          // 仓库走 pcOrder，别碰 VGrid 的 DOM
      if (!favCustomSort(id)) continue;        // 不是「自定义」就回归游戏自己的顺序
      try { favLiftGrid(id); } catch (e) { /* ignore */ }
    }
  }

  /* 这条筛选栏的排序下拉是不是「自定义」。下拉还没渲染时保守返回 false，
     等下一拍（400ms）DOM 出来再置顶，不去猜游戏当前用的是哪种排序。 */
  function favCustomSort(id) {
    var sel = document.getElementById(id === 'evt-pc' ? 'evt-sort' : 'pc-sort');
    return !!(sel && String(sel.value || '') === 'custom');
  }

  // 每一条筛选栏各放一颗：仓库/培育屋共用同一条（游戏切到培育屋页时会把 .pc-sticky
  // 整块搬到 #pen-grid 前面，见新 bundle 的 Screens.pension.enter），配队弹窗有自己的一条。
  // 只有这三处该有「☆ 收藏」：仓库、培育屋、配队弹窗。黑市 / 交换 / 图鉴里也有同名的
  // .pc-filters，但那里收藏没有意义（1.9.66 起按宿主白名单过滤）
  var FAV_CHIP_HOSTS = '#screen-team, #screen-pension, #evt-pick';
  function favChipHostOk(host) {
    return !!(host && host.closest && host.closest(FAV_CHIP_HOSTS));
  }

  /* 第一百零四批：仓库 / 培育屋的收藏按钮统一挪到「异色」按钮（#pc-shiny）前面。
   * 游戏这次更新把筛选栏折进了 .pc-more，#pc-type-btn 变成 .pc-more 的子节点，
   * 旧的「插在属性按钮前」因为 near.parentNode !== host 而退化成「插到最前」——
   * 就是玩家截图里收藏按钮孤零零蹲在搜索框左边的原因。
   * 配队弹窗（#evt-pick）的位置按玩家要求保持原样，不参与这条规则。 */
  function favChipPlace(host, chip) {
    var anchor = null;
    if (host.closest('#evt-pick')) {
      var eff = host.querySelector('#evt-eff');
      if (eff && eff.parentNode === host) anchor = eff;
    } else {
      /* v1.46：仓库里「整理」紧跟收藏右侧。收藏的锚点优先用整理按钮，
         否则两个 chip 会各自把「异色前」当成目标、每拍互相挤走（按钮抖动）。 */
      var tidy = host.querySelector('.pcg-tidy-chip');
      if (tidy && tidy.parentNode === host) anchor = tidy;
      else {
        var shiny = host.querySelector('#pc-shiny');
        if (shiny && shiny.parentNode === host) anchor = shiny;
        else {
          var type = host.querySelector('#pc-type-btn');
          if (type && type.parentNode === host) anchor = type;
        }
      }
    }
    if (!anchor) {
      /* 找不到锚点（老版本页面）：贴着筛选栏最前面，但别把自己当锚点 */
      if (chip.parentNode === host && host.firstElementChild === chip) return;
      try { host.insertBefore(chip, host.firstChild); } catch (e) { /* 游戏正在重绘 */ }
      return;
    }
    if (chip.parentNode === host && chip.nextElementSibling === anchor) return;  // 已在位
    if (anchor.parentNode === host) {
      try { host.insertBefore(chip, anchor); } catch (e2) { /* ignore */ }
    }
  }

  function favChipIn(host) {
    if (!host) return null;
    if (settings.favOn === false) return null;
    if (!favChipHostOk(host)) {
      var strays = host.querySelectorAll('.pcg-fav-chip');
      for (var si = 0; si < strays.length; si++)
        if (strays[si].parentNode) strays[si].parentNode.removeChild(strays[si]);
      return null;
    }
    var chip = host.querySelector('.pcg-fav-chip');
    if (chip) { favChipPlace(host, chip); return chip; }
    chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip btn small ghost pcg-fav-chip';
    chip.title = '只看收藏的宝可梦';
    chip.innerHTML = '<span class="pcg-fav-ico">☆</span><span class="chip-l">收藏</span>';
    chip.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      FAV.on = !FAV.on;
      FAV.sig = '';
      favPaint();
      favSyncChip();
    });
    favChipPlace(host, chip);
    return chip;
  }

  function favChips() {
    var hosts = document.querySelectorAll('.pc-filters');
    for (var i = 0; i < hosts.length; i++) favChipIn(hosts[i]);
  }

  function favSyncChip() {
    var chips = document.querySelectorAll('.pcg-fav-chip');
    var on = !!FAV.on;
    var txt = on ? '★' : '☆';
    for (var i = 0; i < chips.length; i++) {
      var chip = chips[i];
      if (chip.classList.contains('on') !== on) chip.classList.toggle('on', on);
      var ic = chip.querySelector('.pcg-fav-ico');
      if (ic && ic.textContent !== txt) ic.textContent = txt;
    }
  }

  /* ---------------- v1.44：仓库「一键整理」按钮 ----------------
   * 美术完全复用游戏原生 .chip.btn.small.ghost（和「收藏」按钮同款），只放在仓库，
   * 紧跟在收藏按钮右边。点一下把仓库里的宝可梦按 等级→稀有度→能力值 从高到低排一次，
   * 收藏的仍然最置顶，不与收藏功能冲突。
   * v1.46：优先级由「能力值→等级→稀有度」改为「等级→稀有度→能力值」。
   *
   * 排序要真正写进游戏的 G.S.pcOrder 才算数，而 MAIN world 的排序桥平时是「只补不改」，
   * 正常发布改不动已经拖过的顺序。这里给发布包带一个一次性的 replace token：桥见到新
   * token 就整体替换一次，之后照旧只补不改，玩家之后自己拖的位置不会被反复冲掉。 */
  var TIDY_HOST = '#screen-team';

  function tidyCmp(a, b) {
    var fa = favHas(a.uid) ? 1 : 0, fb = favHas(b.uid) ? 1 : 0;
    if (fa !== fb) return fb - fa;                              // 收藏最置顶
    /* v1.49：严格按「等级 → 稀有度 → 能力值」。等级是第一关键字，
       同一等级里才比稀有度，再比能力值（六项种族值总和）。
       等级兼容 level / lv / lvl 三种写法，取第一个有效值，避免取不到时
       第一层恒为 0 而退化成「稀有度优先」。 */
    var la = Number(a.level != null ? a.level : (a.lv != null ? a.lv : a.lvl)) || 0;
    var lb = Number(b.level != null ? b.level : (b.lv != null ? b.lv : b.lvl)) || 0;
    if (la !== lb) return lb - la;                              // 等级（高在前）
    var ta = favTier(Number(a.id)), tb = favTier(Number(b.id));
    if (ta !== tb) return tb - ta;                              // 稀有度（高在前）
    var pa = favPower(Number(a.id)), pb = favPower(Number(b.id));
    if (pa !== pb) return pb - pa;                              // 能力值（高在前）
    return (Number(b.caughtAt || 0) - Number(a.caughtAt || 0)) ||
           ((Number(a.id) || 0) - (Number(b.id) || 0));
  }

  // 强制把仓库重绘一遍（即使下拉当时不是 custom 也拨回 custom）
  function pcRefreshForce() {
    var sel = document.getElementById('pc-sort');
    if (!sel) return;
    try { sel.value = 'custom'; } catch (e) { return; }
    try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e2) { /* ignore */ }
  }

  function doTidy() {
    favSaveDrop();
    var save = favSave();
    if (!save) { log('一键整理：读不到存档，稍后再试'); return; }
    var all = save.mons || [], team = save.team || [], list = [], i;
    for (i = 0; i < all.length; i++) {
      var m = all[i];
      if (!m || !m.uid || team.indexOf(m.uid) >= 0) continue;   // 队伍里的不算仓库
      list.push(m);
    }
    if (!list.length) { log('一键整理：仓库里还没有宝可梦'); return; }
    list.sort(tidyCmp);
    var order = [];
    for (i = 0; i < list.length; i++) order.push(list[i].uid);

    var now = Date.now();
    var pin = settings.favOn !== false && settings.favPinOn !== false;
    var favs = Object.keys(FAV.map || {});
    var token = 't' + now + '-' + Math.floor(Math.random() * 1e6);
    var sig = 'tidy#' + order.join('|');
    PC_ORDER.sig = sig;
    PC_ORDER.at = now;
    try {
      localStorage.setItem(PC_ORDER_KEY, JSON.stringify({
        v: 1, at: now, sig: sig, order: order,
        pin: pin, favs: pin ? favs : null, replace: token
      }));
    } catch (e) { log('一键整理：写入顺序失败'); return; }
    // 让游戏保存 + 重绘时由桥把新顺序整体注入 G.S.pcOrder
    pcRefreshForce();
    log('仓库已整理：等级 → 稀有度 → 能力值（收藏最置顶），共 ' + order.length + ' 只');
  }

  function tidyChipIn(host) {
    if (!host) return null;
    if (!host.closest || !host.closest(TIDY_HOST)) {
      var strays = host.querySelectorAll('.pcg-tidy-chip');
      for (var si = 0; si < strays.length; si++)
        if (strays[si].parentNode) strays[si].parentNode.removeChild(strays[si]);
      return null;
    }
    var chip = host.querySelector('.pcg-tidy-chip');
    if (!chip) {
      chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip btn small ghost pcg-tidy-chip';
      chip.title = '一键整理仓库：按等级 → 稀有度 → 能力值排序，收藏最置顶';
      chip.innerHTML = '<span class="pcg-tidy-ico">⇅</span><span class="chip-l">整理</span>';
      chip.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        doTidy();
      });
    }
    // 紧跟在「收藏」按钮右边；没有收藏按钮时退到「异色」按钮前
    var fav = host.querySelector('.pcg-fav-chip');
    if (fav && fav.parentNode === host) {
      if (fav.nextElementSibling !== chip) host.insertBefore(chip, fav.nextElementSibling);
    } else {
      var shiny = host.querySelector('#pc-shiny');
      if (shiny && shiny.parentNode === host) host.insertBefore(chip, shiny);
      else host.appendChild(chip);
    }
    return chip;
  }

  function tidyChips() {
    var hosts = document.querySelectorAll('.pc-filters');
    for (var i = 0; i < hosts.length; i++) tidyChipIn(hosts[i]);
  }

  /* 培育屋 / 配队弹窗的网格是游戏自己画的（点格子就是换人 / 上阵），我们不接管，
     所以这里的「可等阶」只能靠打类 + CSS 隐藏，跟「只看收藏」走同一条路。
     第九十六批：这条路以前只认收藏 —— 仓库是自绘的（favPaint 重排 wrap），
     培育屋却是藏格子，而藏格子那段只看了 FAV.on，于是在培育屋点「可等阶」
     按钮会亮、数字也在，网格却一动不动（玩家说的「点了没反应」）。
     两个筛选同时开着就是交集：容器上两个类都在，两条 :not 规则叠加。 */
  var PENRANK = { on: false };
  function penRankPaint(on) {
    on = !!on;
    if (!on && !PENRANK.on) return;              // 本来就没开，别白跑一遍 DOM
    PENRANK.on = on;
    // 已经放进培育屋的那两只不归 rankInfo 管（它只扫仓库 mons），别把它们藏掉
    var keep = {};
    var save = favSave();
    var pn = (save && save.pension && save.pension.mons) || [];
    for (var i = 0; i < pn.length; i++) {
      var pm = pn[i] && pn[i].mon;
      if (pm && pm.uid) keep[pm.uid] = 1;
    }
    var hosts = ['pen-grid', 'evt-pc'];
    for (var hi = 0; hi < hosts.length; hi++) {
      var g = document.getElementById(hosts[hi]);
      if (!g || !g.classList) continue;
      if (g.classList.contains('pcg-rank-on') !== on) g.classList.toggle('pcg-rank-on', on);
      var cells = g.querySelectorAll('.pc-cell[data-uid]');
      for (var ci = 0; ci < cells.length; ci++) {
        var uid = cells[ci].getAttribute('data-uid') || '';
        var ok = !on || !!keep[uid] || !!RANK.map[uid];
        if (cells[ci].classList.contains('pcg-rank-ok') !== ok)
          cells[ci].classList.toggle('pcg-rank-ok', ok);
      }
    }
  }

  /* ================= 配队弹窗：换成仓库那套筛选（第一百零一批 / 第一百零三批） =================
   * 玩家要求「所有配队界面的筛选功能，换成仓库的筛选功能，并且一样默认筛选自定义」。
   * 配队弹窗（#evt-pick，活动队伍 / 对战塔 / 团体战 / 世界 BOSS / 糖果工厂 / 地下通道
   * 六种玩法共用）的筛选栏本来就是 .pc-filters，只是里面只有搜索 / 效果绝佳 / 4 项排序。
   *
   * 第一百零三批（玩家说「该功能并未实现」，离线跑真游戏实测确认）：
   *   · 排序下拉以前交给 MAIN world 的 evt-sort-bridge.js 去改，可那个桥在 document_start
   *     跑的时候 <body> 还不存在，它退到 document.documentElement 上挂 childList 观察器；
   *     游戏后来往 body 里塞 #evt-pick，<html> 的子节点根本没变 —— 回调一次都不来，
   *     于是下拉永远是游戏自己的「推荐 / 等级 / 最近 / 图鉴编号」。现在改成这里（隔离世界，
   *     本来就在每 400ms 的拍子里跑）直接改 #evt-sort：选项照仓库 #pc-sort 抄（含「等阶」），
   *     打开时拨到「自定义」。桥只留「排序前裁数组」那一件事。
   *   · 玩家要求把「地区 / 异色」两个按钮删掉（窄屏上搜索框都被挤成一条缝），现在只留属性。
   *   · 属性面板原本是 .pcg-evt-wrap 里的 absolute 面板，被 .evt-head{overflow:auto} 与
   *     .evt-pick{overflow:hidden} 裁到只剩 4px（看着像被仓库网格遮住了）。现在面板搬到
   *     document.body 上做 position:fixed 浮层，按按钮位置定位，z-index 压过整个弹窗。
   *
   * 为什么不在 DOM 上藏格子：那个网格是游戏的 t.VGrid（虚拟网格，只渲染看得见的行），
   * 藏掉的格子会留下空洞、拖拽落位和置顶位置也全错。这里改成把「不该显示的 uid」
   * 发布给桥（localStorage["pcgEvtPickV1"]），让它在游戏排完序、交给 VGrid 之前
   * 直接把数组裁掉 —— 布局 / 拖拽 / 拖到空位都不受影响，网格也就自然只剩筛过的那些。
   */
  var EVTF = { types: {}, open: null, sig: '', key: '' };
  var EVT_PICK_KEY = 'pcgEvtPickV1';

  /* 排序清单（第一百零四批）：玩家要求删掉「图鉴编号 / 名字 / 等阶 / 稀有度」四项，
     所有配队界面只留 最近 / 等级 / 能力 / 自定义。
     仓库 #pc-sort 仍是 8 项（那边不动），抄过来之后再按 EVT_SORT_DROP 裁掉这四项。 */
  var EVT_SORT_DROP = { dex: 1, name: 1, rank: 1, rarity: 1 };
  var EVT_SORT_LIST = [
    ['recent', '最近'], ['level', '等级'], ['stats', '能力'], ['custom', '自定义']
  ];
  var EVT_SORT = { sig: '', ready: false };


  /* 这一批自己的样式表：配队弹窗那排控件 + 仓库「属性」按钮上的图标。
     单独一张 <style data-pcg="evt">，不走 favCss —— 收藏总开关关掉的时候
     favCss 整张表都不上，可属性筛选和仓库那颗图标跟收藏没关系，得自己活着。 */
  var EVT_STYLE = { txt: '', el: null };
  function evtCss() {
    var css = [
      '.pcg-evt-wrap{position:relative;display:inline-flex;align-items:center}',
      /* v1.44：仓库「一键整理」按钮——完全复用游戏 .chip.btn.small.ghost 原生样式，
         这里只管那颗图标的排版（和收藏 chip 的 .pcg-fav-ico 同一写法） */
      '.pcg-tidy-chip .pcg-tidy-ico{font-size:12px;line-height:1;color:inherit}',
      '.pcg-evt-btn .pcg-evt-l{white-space:nowrap}',
      '.pcg-evt-btn .pcg-evt-n{font-size:11px;font-weight:800;line-height:1;color:inherit;opacity:.8}',
      '.pcg-evt-btn .pcg-evt-n:empty{display:none}',
      '.pcg-evt-btn .pcg-evt-care{font-style:normal;font-size:10px;line-height:1;opacity:.65}',
      /* 属性轮盘图标：仓库那颗按钮只能用伪元素画 —— 游戏每次重绘都会把它的 firstChild
         文字改回「属性 (n)」，往里插节点会被连 SVG 一起冲掉；弹窗里那颗用同一个画法，两边才是一对 */
      '.pcg-evt-wheel,#pc-type-btn::before{display:inline-block;width:10px;height:10px;border-radius:50%;'
        + 'flex:none;content:"";'
        + 'background:conic-gradient(from 210deg,#e5533d 0 33%,#4a8ff0 0 66%,#f2c33a 0);'
        + 'box-shadow:inset 0 0 0 1px rgba(0,0,0,.38)}',
      /* 面板本体交给游戏的 .type-pop（底色 / 圆角 / 三列网格 / 选中白框全是它的），
         但位置得自己说了算：它现在是挂在 body 上的浮层，不跟着 .evt-head{overflow:auto}
         与 .evt-pick{overflow:hidden} 一起被裁掉（第一百零三批：以前被裁到只剩 4px） */
      '.pcg-evt-pop{position:fixed!important;left:0;top:0;right:auto!important;bottom:auto!important;'
        + 'z-index:2147483000!important;max-height:min(56vh,340px);overflow:auto;'
        + 'box-sizing:border-box}',
      '.pcg-evt-pop[hidden]{display:none!important}',
      '.pcg-evt-pop button{line-height:1.2}',
      '.pcg-evt-pop .type{font-size:12px;padding:3px 6px}'
    ].join('\n');
    if (css === EVT_STYLE.txt) return;
    EVT_STYLE.txt = css;
    if (!EVT_STYLE.el) {
      EVT_STYLE.el = document.createElement('style');
      EVT_STYLE.el.setAttribute('data-pcg', 'evt');
      (document.head || document.documentElement).appendChild(EVT_STYLE.el);
    }
    if (EVT_STYLE.el.textContent !== css) EVT_STYLE.el.textContent = css;
  }

  function evtTypes() {
    var D = tbData();
    var out = [];
    if (!D || !D.order) return out;
    for (var i = 0; i < D.order.length; i++) {
      var k = D.order[i];
      out.push({
        k: k,
        zh: (D.tzh && D.tzh[k]) || k,
        c: (D.color && D.color[k]) || '#8b93a7'
      });
    }
    return out;
  }

  function evtOn() {
    var n = 0;
    for (var k in EVTF.types) if (EVTF.types.hasOwnProperty(k)) n++;
    return n;
  }

  function evtClear() {
    EVTF.types = {};
    EVTF.sig = '';
  }

  /* 面板里的按钮完全照游戏仓库那套来画：.type-pop > button > span.type
     —— 于是配色、选中态（.type-pop button.on 的白框）、网格排布全由游戏自己的 CSS 管，
     两边看起来才会一模一样。药丸里只有属性名，跟仓库面板一个样（不再塞图标：
     10px 下龙 / 飞行 / 冰那几个剪影认不出来，反而更花）。 */
  function evtPopHtml(kind) {
    var html = '', i;
    if (kind === 'type') {
      var ts = evtTypes();
      for (i = 0; i < ts.length; i++) {
        html += '<button type="button" data-v="' + favEsc(ts[i].k) + '">' +
          '<span class="type" data-type="' + favEsc(ts[i].k) + '"' +
          ' style="--tc:' + favEsc(ts[i].c) + ';background:var(--tc)">' +
          favEsc(ts[i].zh) + '</span></button>';
      }
    }
    return html;
  }

  function evtClosePops(host) {
    var st = host && host.__pcgEvt;
    if (st && st.type && st.type.pop) st.type.pop.hidden = true;
    // 面板挂在 body 上，别只认弹窗里的
    var loose = document.querySelectorAll('.pcg-evt-pop');
    for (var i = 0; i < loose.length; i++) loose[i].hidden = true;
  }

  /* 浮层的定位：贴着「属性」按钮的下沿弹出来，右边 / 下边贴到视口就翻回去 */
  function evtPlacePop(btn, pop) {
    if (!btn || !pop || pop.hidden) return;
    var b = btn.getBoundingClientRect();
    var vw = window.innerWidth || document.documentElement.clientWidth || 0;
    var vh = window.innerHeight || document.documentElement.clientHeight || 0;
    var w = pop.offsetWidth || 240;
    var h = pop.offsetHeight || 200;
    var left = b.left;
    if (left + w > vw - 6) left = Math.max(6, vw - w - 6);
    var top = b.bottom + 6;
    if (top + h > vh - 6) {
      // 下面放不下就翻到按钮上面；上面也放不下就贴着视口底
      top = b.top - h - 6;
      if (top < 6) top = Math.max(6, vh - h - 6);
    }
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  }

  /* 往配队弹窗的筛选栏里补控件（只留「属性」+ 清除）；只搭一次。
   * 第一百零三批：地区 / 异色两个按钮按玩家要求删掉了 —— 窄屏上那排本来就挤，
   * 搜索框被压成一条缝。属性面板改成挂在 body 上的 fixed 浮层，不再被弹窗裁掉。 */
  function evtMount(host) {
    if (!host) return null;
    if (host.__pcgEvt) return host.__pcgEvt;
    var st = { type: null, clear: null };
    host.__pcgEvt = st;

    function makeWrap(kind, label) {
      var wrap = document.createElement('span');
      wrap.className = 'pcg-evt-wrap pcg-evt-' + kind;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip btn small ghost pcg-evt-btn';
      // 属性那颗跟着仓库一起带上轮盘图标（仓库那边是伪元素，见 evtCss）
      btn.innerHTML = (kind === 'type' ? '<i class="pcg-evt-wheel"></i>' : '') +
        '<span class="pcg-evt-l">' + label + '</span>' +
        '<b class="pcg-evt-n"></b><i class="pcg-evt-care">▾</i>';
      var pop = document.createElement('div');
      // 挂着游戏的 type-pop 类，面板的底色 / 圆角 / 三列网格 / 选中白框全用游戏自己的样式
      pop.className = 'pcg-evt-pop type-pop pcg-evt-pop-' + kind;
      pop.hidden = true;
      pop.innerHTML = evtPopHtml(kind);
      btn.addEventListener('click', function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var willOpen = !!pop.hidden;
        evtClosePops(host);
        pop.hidden = !willOpen;
        if (willOpen) {
          if (!pop.parentNode) document.body.appendChild(pop);
          evtPlacePop(btn, pop);
        }
      });
      pop.addEventListener('click', function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        var b = (e.target && e.target.closest) ? e.target.closest('[data-v]') : null;
        if (!b) return;
        var v = b.getAttribute('data-v') || '';
        if (!v) return;
        if (EVTF.types[v]) delete EVTF.types[v]; else EVTF.types[v] = 1;
        EVTF.sig = '';
        evtSync(host);
        evtPublish(true);
      });
      wrap.appendChild(btn);
      return { wrap: wrap, btn: btn, pop: pop };
    }

    st.type = makeWrap('type', '属性');

    var cl = document.createElement('button');
    cl.type = 'button';
    cl.className = 'chip btn small ghost pcg-evt-clear';
    cl.textContent = '清除';
    cl.hidden = true;
    cl.addEventListener('click', function (e) {
      if (e) { e.preventDefault(); e.stopPropagation(); }
      evtClear();
      evtSync(host);
      evtPublish(true);
    });
    st.clear = cl;

    // 插到「效果绝佳」前面，顺序和仓库那条一致：搜索 · 收藏 · 属性 · 清除 · 效果绝佳 · 排序
    var anchor = host.querySelector('#evt-eff');
    var ref = (anchor && anchor.parentNode === host) ? anchor : null;
    var nodes = [st.type.wrap, st.clear];
    for (var i = 0; i < nodes.length; i++) host.insertBefore(nodes[i], ref);

    // 点别处收起下拉（面板在 body 上，判断时得把它也算进来）
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && (t.closest('.pcg-evt-wrap') || t.closest('.pcg-evt-pop'))) return;
      evtClosePops(host);
    });
    // 滚动 / 改窗口大小：面板跟着按钮走（弹窗里的网格是内部滚动的，用捕获阶段才收得到）
    window.addEventListener('resize', function () { evtPlacePop(st.type && st.type.btn, st.type && st.type.pop); }, true);
    document.addEventListener('scroll', function () { evtPlacePop(st.type && st.type.btn, st.type && st.type.pop); }, true);
    return st;
  }

  function evtSync(host) {
    var st = host && host.__pcgEvt;
    if (!st) return;
    var i;
    var tn = evtOn();

    (function syncBtn(btn, n) {
      if (!btn) return;
      var b = btn.querySelector('.pcg-evt-n');
      if (b && b.textContent !== (n ? String(n) : '')) b.textContent = n ? String(n) : '';
      var on = n > 0;
      if (btn.classList.contains('on') !== on) btn.classList.toggle('on', on);
    })(st.type && st.type.btn, tn);

    if (st.clear) {
      var any = evtOn() > 0;
      if (st.clear.hidden !== !any) st.clear.hidden = !any;
    }

    var pop = st.type && st.type.pop;
    if (pop) {
      var bs = pop.children;
      for (var j = 0; j < bs.length; j++) {
        var v = bs[j].getAttribute ? bs[j].getAttribute('data-v') : '';
        var on = !!(v && EVTF.types[v]);
        if (bs[j].classList.contains('on') !== on) bs[j].classList.toggle('on', on);
      }
    }
  }

  /* 这只宝可梦过不过当前的属性筛选（第一百零三批只剩属性一条；
     仓库里那套「地区 / 异色」在配队窗按玩家要求拿掉了） */
  function evtMatch(m) {
    var D = tbData();
    var id = Number(m && m.id) || 0;
    var anyType = false, k;
    for (k in EVTF.types) if (EVTF.types.hasOwnProperty(k)) { anyType = true; break; }
    if (!anyType) return true;
    var ty = (D && D.ty && D.ty[id]) || [];
    for (var i = 0; i < ty.length; i++) if (EVTF.types[ty[i]]) return true;
    return false;
  }

  /* 存档里所有「可能出现在网格里」的宝可梦（仓库 + 培育屋 + 地下通道 + 队伍） */
  function evtAllMons(save) {
    var out = [], seen = {}, i, j;
    function push(m) {
      if (!m || !m.uid || seen[m.uid]) return;
      seen[m.uid] = 1;
      out.push(m);
    }
    var box = (save && save.mons) || [];
    for (i = 0; i < box.length; i++) push(box[i]);
    var pn = (save && save.pension && save.pension.mons) || [];
    for (i = 0; i < pn.length; i++) push(pn[i] && pn[i].mon);
    var us = (save && save.under && save.under.slots) || [];
    for (i = 0; i < us.length; i++) {
      var ums = (us[i] && us[i].mons) || [];
      for (j = 0; j < ums.length; j++) push(ums[j]);
    }
    return out;
  }

  /* 游戏自己做不了的那几种排序，由这边算好顺序发布过去。
     游戏配队窗的排序表只有 best / level / recent / dex 四个比较器（见 evt-sort-bridge.js
     的注释），仓库下拉里另外那几个和「自定义」它拿到的是 undefined，会退化成字符串排序。
     第一百零四批删掉了 名字 / 等阶 / 稀有度 三个选项，但这里仍保留它们的分支：
     万一游戏重绘把旧选项放回来、或存档里残留旧值，排序依旧正确，不会退化成字符串序。 */
  var EVT_NEED_ORDER = { name: 1, rank: 1, rarity: 1, stats: 1, custom: 1 };

  function evtOrder(list, save, key) {
    var D = tbData();
    var arr = list.slice();
    if (key === 'custom') {
      /* 配队弹窗要连队伍里的那几只一起排，且不在 pcOrder 里的按游戏口径排最前 */
      var ord = pcCustomOrder(save, true, true) || [];
      var idx = {}, i;
      for (i = 0; i < ord.length; i++) if (idx[ord[i]] === undefined) idx[ord[i]] = i;
      arr.sort(function (a, b) {
        var ia = idx[a.uid], ib = idx[b.uid];
        ia = ia === undefined ? -1 : ia;
        ib = ib === undefined ? -1 : ib;
        if (ia !== ib) return ia - ib;
        return (Number(b.caughtAt) || 0) - (Number(a.caughtAt) || 0);
      });
    } else if (key === 'name') {
      /* 仓库那边用游戏自己的本地化名字 compare；内容脚本拿不到那个名字表，
         这里用图鉴的中文名，中文按拼音（'zh-Hans' 的 ICU 排序就是拼音序）。 */
      arr.sort(function (a, b) {
        var na = (D && D.nm && D.nm[a.id]) || '';
        var nb = (D && D.nm && D.nm[b.id]) || '';
        return na.localeCompare(nb, 'zh-Hans') || (Number(a.id) - Number(b.id)) ||
          (Number(b.level) || 0) - (Number(a.level) || 0);
      });
    } else if (key === 'rank') {
      /* 等阶：存档里就是 m.rank（0~5），和游戏 rankOf 一个意思；高的在前，同级比等级 */
      arr.sort(function (a, b) {
        return ((Number(b.rank) || 0) - (Number(a.rank) || 0)) ||
          (Number(b.level) || 0) - (Number(a.level) || 0) ||
          (Number(a.id) - Number(b.id));
      });
    } else if (key === 'rarity') {
      arr.sort(function (a, b) {
        return (favTier(Number(b.id)) - favTier(Number(a.id))) ||
          (Number(a.id) - Number(b.id));
      });
    } else if (key === 'stats') {
      arr.sort(function (a, b) {
        return (favPower(Number(b.id)) - favPower(Number(a.id))) ||
          (Number(b.level) || 0) - (Number(a.level) || 0) ||
          (Number(a.id) - Number(b.id));
      });
    } else {
      return null;
    }
    var uids = [];
    for (var j = 0; j < arr.length; j++) uids.push(arr[j].uid);
    return uids;
  }

  /* 发一条「什么都不筛、也不重排」的中性记录。
     关窗时必须发，不然上一次的 deny 名单会留在 localStorage 里，
     下次一打开会先按旧条件闪一下再刷新。 */
  function evtNeutral() {
    EVTF.sig = '';
    try {
      localStorage.setItem(EVT_PICK_KEY, JSON.stringify({
        v: 1, at: Date.now(), key: '', deny: null, order: null, stamp: ''
      }));
    } catch (e) { /* 隐私模式写不进就算了 */ }
  }

  /* 把「该藏谁 / 按什么顺序」发布给 MAIN world 的桥；变了才写，force 时立刻让游戏重绘一次 */
  function evtPublish(force) {
    if (EVTF.open === false) { evtNeutral(); return; }
    var save = favSave();
    if (!save) return;
    var list = evtAllMons(save);
    var deny = null;
    if (evtOn() > 0) {
      deny = [];
      for (var i = 0; i < list.length; i++) if (!evtMatch(list[i])) deny.push(list[i].uid);
    }
    var sel = document.getElementById('evt-sort');
    var key = sel ? String(sel.value || '') : '';
    var order = EVT_NEED_ORDER[key] ? evtOrder(list, save, key) : null;
    var sig = key + '#' + (deny ? deny.length + ':' + deny.join(',') : '-') +
      '#' + (order ? order.join(',') : '-');
    if (!force && sig === EVTF.sig) return;
    EVTF.sig = sig;
    EVTF.key = key;
    try {
      localStorage.setItem(EVT_PICK_KEY, JSON.stringify({
        v: 1, at: Date.now(), key: key,
        deny: deny, order: order, stamp: sig
      }));
    } catch (e2) { /* 隐私模式写不进就算了，桥会退回老口径 */ }
    if (force && sel) {
      // 让游戏立刻按新的名单重排一次（它自己的 onchange 就是 re-render 网格）
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); }
      catch (e3) { /* ignore */ }
    }
  }

  /* ---------- 排序下拉：换成仓库那套（第一百零三批） ----------
   * 以前这活儿交给 MAIN world 的 evt-sort-bridge.js：它靠监听 body 的子节点变化去等
   * #evt-pick 出现。可桥在 document_start 跑，那会儿 <body> 还没有，它退到了
   * document.documentElement 上 —— 游戏后来往 body 里塞弹窗，<html> 的子节点一个都没变，
   * 回调永远不来，下拉也就永远是游戏自己那四项（玩家看到的「该功能并未实现」）。
   * 现在由这里改：本来每 400ms 就有一拍，弹窗一开就把选项换成仓库的，并拨到「自定义」。 */
  function evtSortList() {
    var out = [], src = document.getElementById('pc-sort');
    if (src && src.options && src.options.length) {
      for (var i = 0; i < src.options.length; i++) {
        var v = String(src.options[i].value || '');
        var t = String(src.options[i].textContent || '').trim();
        if (!v || v === 'best' || EVT_SORT_DROP[v]) continue;   // 「推荐」+ 本次删掉的四项都不进配队下拉
        out.push([v, t || v]);
      }
    }
    if (!out.length) {
      for (var j = 0; j < EVT_SORT_LIST.length; j++) out.push(EVT_SORT_LIST[j].slice());
    }
    return out;
  }

  /* forceCustom：只在弹窗刚打开那一拍传 true。玩家自己换别的排序后不再拽回来。 */
  function evtSortSync(forceCustom) {
    var sel = document.getElementById('evt-sort');
    if (!sel) return;
    var want = evtSortList();
    var parts = [], i;
    for (i = 0; i < want.length; i++) parts.push(want[i][0] + ':' + want[i][1]);
    var sig = parts.join('|');

    if (sig !== EVT_SORT.sig) {
      EVT_SORT.sig = sig;
      // 游戏自己会 querySelector('option[value="best"]') 再拨 hidden，节点不能少；
      // 但仓库那套里没有「推荐」，所以留着节点、藏起来、禁掉。
      var best = sel.querySelector('option[value="best"]');
      try { sel.innerHTML = ''; } catch (e) { /* ignore */ }
      for (i = 0; i < want.length; i++) {
        var o = document.createElement('option');
        o.value = want[i][0];
        o.textContent = want[i][1];
        sel.appendChild(o);
      }
      if (!best) {
        best = document.createElement('option');
        best.value = 'best';
        best.textContent = '推荐';
      }
      best.hidden = true;
      best.disabled = true;
      sel.appendChild(best);
      EVT_SORT.ready = true;
    }

    var bn = sel.querySelector('option[value="best"]');   // 世界 BOSS 那套会把 hidden 拨回来
    if (bn && (!bn.hidden || !bn.disabled)) {
      bn.hidden = true;
      bn.disabled = true;
    }

    if (forceCustom && sel.value !== 'custom') {
      try { sel.value = 'custom'; } catch (e2) { return; }
      // 游戏自己的 onchange 就是 re-render 网格，派一发让它立刻按新清单排
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); }
      catch (e3) { /* ignore */ }
    }
  }

  /* 每一拍：弹窗开了就把控件搭上、把排序换成仓库那套、把筛选结果发布出去 */
  function evtPickTick() {
    var pick = document.getElementById('evt-pick');
    var open = !!(pick && pick.classList.contains('open'));
    var fresh = false;
    if (open !== EVTF.open) {
      EVTF.open = open;
      evtClear();                 // 每次打开都从「不筛」开始，别把上次的条件带进来
      EVT_SORT.sig = '';          // 下拉的 DOM 可能被游戏重画过，下一拍重新对一遍
      if (!open) { UG.pickUntil = 0; evtNeutral(); evtClosePops(pick); return; }
      fresh = true;               // 刚打开：把排序拨到「自定义」并立刻重排一次
    }
    if (!open) return;
    /* 第一百一十批：地下通道和配队窗共用 #evt-pick。派遣正在按当前主题重选时，
       别把「自定义 / 收藏」那套下拉和顺序套上来 —— 游戏的「优化」是按
       guardsOf(主题) 算的，被仓库顺序覆盖就又变成一套不符主题的队伍。
       pickUntil 是个短租约（30 秒），到点自动失效，不用手动清。 */
    if (Date.now() < UG.pickUntil) return;
    var host = pick.querySelector('.pc-filters');
    if (!host) return;
    try { evtMount(host); } catch (e) { return; }
    evtSync(host);
    evtSortSync(fresh);
    evtPublish(fresh);
  }

  /* 第一百零一批的独立一拍：样式表 + 配队弹窗那排控件。
     不挂在 favTick 里，是因为收藏总开关关掉时 favTick 会整段跳过，
     可「属性」和仓库那颗图标跟收藏开关没关系。 */
  var EVT_T = { at: 0 };
  function evtTick(now) {
    if (now - EVT_T.at < 400) return;
    EVT_T.at = now;
    try { evtCss(); } catch (e) { /* ignore */ }
    evtPickTick();
  }

  function favPaint() {
    var rankOn = RANK.on && RANK.cnt > 0;
    // 培育屋的网格是游戏自己的（换人就是点格子），我们不接管，只把非收藏的藏起来
    var pen = document.getElementById('pen-grid');
    if (pen) {
      pen.classList.toggle('pcg-fav-on', !!FAV.on);
      var pcs = pen.querySelectorAll('.pc-cell[data-uid]');
      for (var pj = 0; pj < pcs.length; pj++) {
        var pu = pcs[pj].getAttribute('data-uid') || '';
        var pw = !!FAV.on && favHas(pu);
        if (pcs[pj].classList.contains('pcg-fav') !== pw) pcs[pj].classList.toggle('pcg-fav', pw);
      }
    }
    // 配队弹窗（#evt-pick）：只把非收藏的格子藏起来，游戏自己的搜索 / 效果绝佳 / 排序照旧生效
    var evt = document.getElementById('evt-pc');
    if (evt) {
      evt.classList.toggle('pcg-fav-on', !!FAV.on);
      var ecs = evt.querySelectorAll('.pc-cell[data-uid]');
      for (var ei = 0; ei < ecs.length; ei++) {
        var eu = ecs[ei].getAttribute('data-uid') || '';
        var ew = !!FAV.on && favHas(eu);
        if (ecs[ei].classList.contains('pcg-fav') !== ew) ecs[ei].classList.toggle('pcg-fav', ew);
      }
    }
    // 「可等阶」在培育屋 / 配队弹窗里同样是藏格子（不接管游戏网格）
    penRankPaint(rankOn);
    var grid = document.getElementById('pc-grid');
    if (grid) {
      grid.classList.toggle('pcg-fav-on', !!(FAV.on || rankOn));
      var wrap0 = grid.querySelector('.pcg-fav-wrap');
      if (!FAV.on && !rankOn && wrap0 && wrap0.parentNode) wrap0.parentNode.removeChild(wrap0);
    }
    if (!grid || (!FAV.on && !rankOn)) return;
    var wrap = grid.querySelector('.pcg-fav-wrap');
    var f = favFilters();
    var save = favSave();
    var all = (save && save.mons) || [];
    var team = (save && save.team) || [];

    // 先把「可能装着宝可梦的地方」都收进来：仓库、培育屋（下面还有地下通道/大冒险，
    // 只用来判断 uid 还在不在，不参与列表）
    var box = {};
    var i;
    for (i = 0; i < all.length; i++) {
      var bm = all[i];
      if (bm && bm.uid && !box[bm.uid]) box[bm.uid] = bm;
    }
    var pn = (save && save.pension && save.pension.mons) || [];
    for (i = 0; i < pn.length; i++) {
      var pmon = pn[i] && pn[i].mon;
      if (pmon && pmon.uid && !box[pmon.uid]) box[pmon.uid] = pmon;
    }
    var us = (save && save.under && save.under.slots) || [];
    for (i = 0; i < us.length; i++) {
      var ums = (us[i] && us[i].mons) || [];
      for (var uj = 0; uj < ums.length; uj++) {
        var um = ums[uj];
        if (um && um.uid && !box[um.uid]) box[um.uid] = um;
      }
    }
    // 图鉴号 → 存档里的宝可梦（同一种可能有好几只，那就别乱认）
    var byId = {};
    for (var bk in box) {
      if (!box.hasOwnProperty(bk)) continue;
      var bid = Number(box[bk].id) || 0;
      if (!bid) continue;
      if (!byId[bid]) byId[bid] = [];
      byId[bid].push(box[bk]);
    }

    // 列表直接从「收藏记录」出：进化、合并、换设备之后 uid 可能对不上，
    // 但记录里存了图鉴号，仍能把那只宝可梦认回来（并顺手把记录挪到正确的 uid 上）
    var map = FAV.map || {};
    var keys = Object.keys(map).sort();
    var list = [];
    var used = {};
    var lost = 0;
    var moved = false;
    for (var ki = 0; FAV.on && ki < keys.length; ki++) {
      var k = keys[ki];
      var rec = Number(map[k]) || 0;
      var mon = box[k] || null;
      if (!mon && rec > 1) {
        var cand = byId[rec] || [];
        if (cand.length === 1) {
          mon = cand[0];
          delete map[k];
          map[mon.uid] = Number(mon.id) || rec;
          moved = true;
        }
      }
      if (!mon) { lost++; continue; }
      // 队伍里的那几只在上面的「队伍」栏里已经有了，收藏视图里不再多摆一份
      // （1.9.59 起：在配队界面点收藏后，仓库里不会再多出一只带「队伍中」的重复图标）
      if (team.indexOf(mon.uid) >= 0) continue;
      if (used[mon.uid]) continue;
      used[mon.uid] = 1;
      list.push(mon);
    }
    if (moved) { FAV.sig = ''; favPersist(); }
    // 只看「可等阶」时，直接从电脑里挑（队伍里的在上面队伍栏，这里不重复列）
    if (!FAV.on) {
      for (var bo in box) {
        if (!box.hasOwnProperty(bo)) continue;
        var bmo = box[bo];
        if (!bmo || !bmo.uid) continue;
        if (team.indexOf(bmo.uid) >= 0) continue;
        if (used[bmo.uid]) continue;
        used[bmo.uid] = 1;
        list.push(bmo);
      }
    }
    // 「可等阶」：只留现在就升得起的（100 级、等阶没满、宝石够 rank+1 颗）
    if (rankOn) {
      var rl = [];
      for (var rj = 0; rj < list.length; rj++) if (RANK.map[list[rj].uid]) rl.push(list[rj]);
      list = rl;
    }
    var fl = [];
    for (var fj = 0; fj < list.length; fj++) if (favMatch(list[fj], f)) fl.push(list[fj]);
    list = fl;
    favSort(list, f);

    var uids = [];
    for (var kk = 0; kk < list.length; kk++) uids.push(list[kk].uid);
    var sig = (FAV.on ? 'f' : '-') + (rankOn ? 'r' + RANK.cnt : '-') + '|' + f.q + '|' + f.types.join(',') + '|' + f.regions.join(',') + '|' + f.shiny + '|' + f.evo + '|' + f.sort + '|' + f.desc + '|' + lost + '|' + uids.join(',');
    if (sig === FAV.sig && wrap) return;

    var html = lost > 0
      ? '<div class="pcg-fav-note">\u6709 ' + lost + ' \u6761\u6536\u85cf\u8bb0\u5f55\u5bf9\u4e0d\u4e0a\u5b9d\u53ef\u68a6\uff08\u53ef\u80fd\u88ab\u653e\u751f\u6216\u5408\u5e76\u4e86\uff09\uff0c\u5148\u4fdd\u7559\u7740\uff0c\u4e0d\u4f1a\u5220\u6389</div>'
      : '';
    for (var j = 0; j < list.length; j++) html += favCell(list[j]);
    if (!list.length) {
      var rankEmpty = rankOn && !(f.q || f.types.length || f.regions.length || f.shiny || f.evo);
      if (rankEmpty) {
        html += '<div class="pcg-fav-empty">' + (FAV.on
          ? '收藏里现在没有能升阶的宝可梦'
          : '现在没有升得起等阶的宝可梦（要 100 级，宝石够当前等阶 + 1 颗）') + '</div>';
      } else {
      var filtered = f.q || f.types.length || f.regions.length || f.shiny || f.evo;
      html += '<div class="pcg-fav-empty">' + (filtered
        ? '\u6536\u85cf\u91cc\u6ca1\u6709\u7b26\u5408\u5f53\u524d\u7b5b\u9009\u7684\u5b9d\u53ef\u68a6'
        : '\u8fd8\u6ca1\u6536\u85cf\u4efb\u4f55\u5b9d\u53ef\u68a6\uff1a\u70b9\u5b9d\u53ef\u68a6\u5de6\u4e0a\u89d2\u7684 \u2606 \u5c31\u80fd\u6536\u85cf\u4e00\u53ea') + '</div>';
      }
    }
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'pcg-fav-wrap';
      wrap.innerHTML = '<div class="pcg-fav-grid"></div>';
      grid.appendChild(wrap);
    }
    var box2 = wrap.querySelector('.pcg-fav-grid');
    if (box2 && box2.innerHTML !== html) box2.innerHTML = html;
    FAV.sig = sig;
  }

  // 总开关关掉 / 一键清空之后，把游戏页上我们加的东西收干净
  var FAV_OFFED = false;
  function favOff() {
    var nodes = document.querySelectorAll('.pcg-star');
    for (var i = 0; i < nodes.length; i++) if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    nodes = document.querySelectorAll('.pcg-fav-chip');
    for (var j = 0; j < nodes.length; j++) if (nodes[j].parentNode) nodes[j].parentNode.removeChild(nodes[j]);
    nodes = document.querySelectorAll('.pcg-fav-wrap, .pcg-fav-note');
    for (var k = 0; k < nodes.length; k++) if (nodes[k].parentNode) nodes[k].parentNode.removeChild(nodes[k]);
    nodes = document.querySelectorAll('.pcg-fav-on');
    for (var m = 0; m < nodes.length; m++) nodes[m].classList.remove('pcg-fav-on');
    nodes = document.querySelectorAll('.pcg-fav');
    for (var n = 0; n < nodes.length; n++) nodes[n].classList.remove('pcg-fav');
    nodes = document.querySelectorAll('.pcg-rank-on');
    for (var r1 = 0; r1 < nodes.length; r1++) nodes[r1].classList.remove('pcg-rank-on');
    nodes = document.querySelectorAll('.pcg-rank-ok');
    for (var r2 = 0; r2 < nodes.length; r2++) nodes[r2].classList.remove('pcg-rank-ok');
    PENRANK.on = false;
    FAV.on = false;
    FAV.sig = '';
    FAV.hit = null;
    FAV_OFFED = true;
  }

  // 一键全部取消收藏：扩展里的收藏表、网页里的备份文件一起删
  function favClear() {
    FAV.map = {};
    FAV.sig = '';
    FAV.hit = null;
    try { localStorage.removeItem(FAV_LS); } catch (e) { /* ignore */ }
    try { chrome.storage.local.remove('pcgFavs'); } catch (e) { /* ignore */ }
    favOff();
    publishPcOrder(true);
    log('收藏已全部清空，本地备份文件也删了');
    return { ok: true, text: '收藏已清空（扩展里的表和网页里的备份都删了）' };
  }

  function favTick(now) {
    // v1.41：详情页标题栏里的收藏按钮——独立于收藏总开关，始终可用
    try { favDetailTick(now); } catch (eD) { /* ignore */ }
    // 队伍卡上那行名字的样式跟收藏开关无关，先挂上（幂等，内容没变就不写 DOM）
    try { cardStyle(); } catch (e0) { /* style 都挂不上就算了 */ }
    /* 第一百一十批：「可等阶」不再挂在「宝可梦收藏」开关下面 —— 以前关掉收藏
     * 就在这里提前 return，rankTick 根本不跑，仓库里那颗按钮跟着一起消失。
     * 现在无论收藏开关是开是关，都照常维护「可等阶」。 */
    try { rankTick(now); } catch (eRank) { /* ignore */ }
    // v1.44：仓库「一键整理」按钮——独立于收藏开关，仓库页始终维护
    try { tidyChips(); } catch (eTidy) { /* ignore */ }
    // 总开关关着：把星星和筛选按钮收掉，等重新打开再长回来
    if (settings.favOn === false) {
      if (now - FAV.at < 400) return;
      FAV.at = now;
      // 收藏星可以关，但「刷新后默认自定义」是仓库本身的设置，照常维护
      publishPcOrder(false);
      pcSortDefault();
      if (!FAV_OFFED) favOff();
      /* 收藏关了，但「可等阶」还可能开着：它自己的隐藏类照旧要刷 */
      if (RANK.on) { try { favPaint(); } catch (eP) { /* ignore */ } }
      return;
    }
    FAV_OFFED = false;
    if (now - FAV.at < 400) return;
    FAV.at = now;
    /* 第七十四批：这里不再每拍都把存档缓存扔掉 —— favSave() 自己带 500ms 窗口，
     * 相邻两拍共用同一份解析结果（存档几 MB，parse 一次几十毫秒）。
     * 真正改变了存档的操作（换人 / 编队）由 pointerup 那边 favSaveDrop() 立刻作废。 */
    // 新捕捉 / 进化 / 队伍变动都会改存档，定时重排一次自定义仓库顺序；
    // 收藏变化走 favSet() 里的 force 分支，不等这里。
    publishPcOrder(false);
    pcSortDefault();
    /* 第一百零六批：只在「自定义」排序 + 开关开时把收藏挪到最前（判断在 favLiftAll 里） */
    favLiftAll();
    var team = document.getElementById('screen-team');
    var pen = document.getElementById('screen-pension');
    var evt = document.getElementById('evt-pick');
    if (!team && !pen && !evt) return;
    var css = favCss();
    if (css !== FAV.css) { FAV.css = css; favStyle(css); }
    if (team || evt) {
      favChips();
      favSyncChip();
    }
    favStars();
    // 第一百一十批：rankTick() 已提到函数开头（与收藏开关解耦），这里不再重复调
    // PENRANK.on 也算：可等阶关掉的那一拍要把培育屋 / 配队弹窗上的隐藏类收干净
    if (FAV.on || RANK.on || PENRANK.on) favPaint();
  }

  /* ---------------- v1.47：一键进化确认弹窗——每只宝可梦显示立绘缩略图 ----------------
   * 游戏点「一键进化」(#pc-evo-all) 弹的是通用 .modal，正文只有一句「要让 N 只宝可梦进化吗？」，
   * 看不到到底是哪几只。这里在那个弹窗正文下方补一排立绘缩略图（含等级/新进化提示）。
   * 待进化名单用游戏自己的 sideMons().filter(levelEvolution) 通过 MAIN world 取（见 keep-dup.js
   * 的 evoinfo: 命令），与弹窗里的 N 完全一致；立绘走游戏 assets/pokemon[/shiny]/<id>.png。
   * 全程只读，不改游戏存档；原生「取消/进化」按钮原样保留。 */
  var EVO = { at: 0, sig: '', mons: null, lastAsk: 0 };

  function evoOnResult(ev) {
    var r = null;
    try { r = JSON.parse(String((ev && ev.detail) || '')); } catch (e) { return; }
    if (!r || !r.at) return;
    EVO.at = r.at;
    EVO.mons = (r.ok && Array.isArray(r.mons)) ? r.mons : [];
  }
  document.addEventListener('pcg-evo-result', evoOnResult);
  window.addEventListener('pcg-evo-result', evoOnResult);

  function evoAsk() {
    EVO.lastAsk = Date.now();
    try { window.dispatchEvent(new CustomEvent('pcg-cmd', { detail: 'evoinfo:{}' })); }
    catch (e) { /* ignore */ }
  }

  // 弹窗正文是不是「一键进化」确认：优先认中文，再兜法文/英文关键字
  function evoIsConfirm(text) {
    var t = String(text || '');
    if (!t) return false;
    if (/进化/.test(t) && /\d|只|多少|要|使|让/.test(t) && t.length < 80) return true;
    if (/[Ff]aire\s+[ée]voluer/.test(t) && t.length < 120) return true;
    if (/[Ee]volve\s+\d+\s+Pok/i.test(t) && t.length < 120) return true;
    return false;
  }

  function evoSpriteUrl(id, shiny) {
    var n = Number(id) || 0;
    if (!n) return '';
    // 相对路径，浏览器按游戏页面 base 解析——和 favCell 里已验证的写法一致
    return 'assets/pokemon/' + (shiny ? 'shiny/' : '') + n + '.png';
  }

  function evoInject(modal, mons) {
    var body = modal.querySelector('.modal-body');
    if (!body) return;
    if (body.querySelector('.pcg-evo-strip')) return;   // 已注入过
    if (!mons || !mons.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'pcg-evo-strip';
    wrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;' +
      'margin:12px 0 4px;max-height:168px;overflow:auto';

    for (var i = 0; i < mons.length; i++) {
      var m = mons[i];
      var tile = document.createElement('div');
      tile.className = 'pcg-evo-tile';
      tile.style.cssText = 'position:relative;width:56px;height:56px;flex:0 0 56px;' +
        'display:flex;align-items:center;justify-content:center;background:var(--panel-2,#252a3d);' +
        'border:1px solid var(--line,#333a52);border-radius:10px;overflow:hidden';
      var img = document.createElement('img');
      img.src = evoSpriteUrl(m.id, m.shiny);
      img.alt = '';
      img.style.cssText = 'width:52px;height:52px;object-fit:contain;image-rendering:pixelated';
      img.onerror = (function (node) {
        return function () { node.style.display = 'none'; };
      })(img);
      tile.appendChild(img);
      if (m.shiny) {
        var sh = document.createElement('span');
        sh.textContent = '✦';
        sh.style.cssText = 'position:absolute;top:0;right:2px;color:#ffd84a;font-size:12px;' +
          'text-shadow:0 1px 2px #000';
        tile.appendChild(sh);
      }
      var lv = document.createElement('span');
      lv.textContent = 'Lv.' + (m.level || 0);
      lv.style.cssText = 'position:absolute;bottom:0;left:0;right:0;text-align:center;' +
        'font-size:9px;line-height:12px;color:#fff;background:rgba(0,0,0,.55)';
      tile.appendChild(lv);
      tile.title = '#' + m.id + (m.to ? ' → #' + m.to : '') + (m.shiny ? ' · 异色' : '');
      wrap.appendChild(tile);
    }
    body.appendChild(wrap);
  }

  function evoDialogTick() {
    // 只认开着的 confirm 弹窗
    var modals = document.querySelectorAll('.modal.open, .modal[data-open], .modal');
    var target = null, targetText = '';
    for (var i = 0; i < modals.length; i++) {
      var md = modals[i];
      var body = md.querySelector('.modal-body');
      if (!body || body.offsetParent === null && !md.classList.contains('open')) continue;
      var txt = String(body.textContent || '');
      if (evoIsConfirm(txt)) { target = md; targetText = txt; break; }
    }
    if (!target) { EVO.sig = ''; return; }

    // 正文里的 N（用于确认是这一批）
    var numM = targetText.match(/(\d+)/);
    var expectN = numM ? parseInt(numM[1], 10) : 0;
    var sig = 'evo#' + expectN + '#' + (target.querySelector('.modal-actions') ? 'c' : 'n');
    if (EVO.sig === sig) return;             // 同一个弹窗，已经处理过
    EVO.sig = sig;

    // 请求一次名单（异步）；拿到后按 sig 再确认弹窗还在，避免串到别的弹窗
    EVO.mons = null;
    evoAsk();
    setTimeout(function (wantSig, wantN) {
      var arr = EVO.mons;
      if (!arr) return;                       // 没回包
      // 若游戏报的 N 与弹窗 N 不一致，以游戏名单为准（它才是真要进化的那批）
      if (expectN && arr.length !== expectN && arr.length) {
        // 仍按 arr 显示——它就是 levelEvolution 的确切结果
      }
      var modalNow = document.querySelector('.modal.open') || document.querySelector('.modal');
      if (!modalNow) return;
      var body2 = modalNow.querySelector('.modal-body');
      if (!body2 || !evoIsConfirm(body2.textContent)) return;
      evoInject(modalNow, arr);
    }, 260, sig, expectN);
  }

  /* ---------------- v1.41：详情页标题栏里的收藏按钮 ----------------
   * 游戏的个体详情页 .dexcard-modal 里，DOM 不写 uid（个体对象 qe 只用于渲染），
   * 所以「这只到底是哪只」靠点格子那一刻记下来：游戏格子都有 data-uid。
   * 点开详情 → 记下 uid → favDetailTick 在 .dc-head 里、紧跟 .dc-buddy 后面
   * 挂一颗与原生按钮同款的收藏星（v1.41 从立绘挪到标题栏）。
   * 图鉴详情（点图鉴条目，无 uid）不会记 uid，也就不显示星。 */
  function favRememberDetailUid(node) {
    var el = (node && node.closest) ? node : null;
    if (!el) return;
    // 点在已打开的详情页内部：别动来源（否则点弹窗里的按钮会把星弄没）
    if (el.closest('.dexcard-modal')) return;
    var holder = el.closest('.pc-cell[data-uid], .slot[data-uid], [data-uid]');
    if (holder && holder.getAttribute) {
      var uid = holder.getAttribute('data-uid') || '';
      if (uid) {
        FAV.detailUid = uid; FAV.detailAt = Date.now(); FAV.detailSrc = 'cell';
        return;
      }
    }
    // 点的是带 uid 的格子之外的东西（如图鉴条目）：这次开详情没有个体，
    // 清掉来源，避免拿上一只的 uid 冒充图鉴详情的收藏星
    FAV.detailSrc = '';
  }

  function favDetailTick(now) {
    if (now - (FAV.detailTickAt || 0) < 250) return;
    FAV.detailTickAt = now;
    var modals = document.querySelectorAll('.dexcard-modal');
    for (var i = 0; i < modals.length; i++) {
      var modal = modals[i];
      // v1.41：收藏按钮从立绘挪到标题栏 .dc-head，紧跟在 .dc-buddy（选择伙伴）后面
      var head = modal.querySelector('.dc-head');
      if (!head) continue;
      // 只认「点格子打开的个体详情」；图鉴页等没有 uid（detailSrc 非 cell）就清掉旧星。
      // 不设超时：详情页开着期间星一直在，避免看着看着突然消失。
      var fresh = FAV.detailSrc === 'cell' && !!FAV.detailUid;
      var old = modal.querySelector('.pcg-dc-fav');
      if (!fresh) { if (old && old.parentNode) old.parentNode.removeChild(old); continue; }
      var uid = FAV.detailUid;
      var on = favHas(uid);
      if (!old) {
        old = document.createElement('button');
        old.type = 'button';
        old.className = 'pcg-dc-fav';
        old.setAttribute('data-dc-uid', uid);
        // 原生金星图标（取不到图标模块时退回文字 ★）
        var GU = window.PCG_GAME_UI || null;
        var starSrc = GU && typeof GU.icon === 'function' ? GU.icon('favStar') : '';
        if (starSrc) {
          var img = document.createElement('img');
          img.src = starSrc; img.alt = '';
          old.appendChild(img);
        } else {
          old.textContent = '\u2605';   // ★ 图标模块没加载时的兜底
        }
        // 插到「选择伙伴」按钮后面；没有伙伴按钮就退而求其次放标题栏末尾
        var buddy = head.querySelector('.dc-buddy');
        if (buddy && buddy.parentNode === head) head.insertBefore(old, buddy.nextSibling);
        else head.appendChild(old);
      }
      if (old.getAttribute('data-dc-uid') !== uid) old.setAttribute('data-dc-uid', uid);
      var cls = 'pcg-dc-fav' + (on ? ' on' : '');
      if (old.className !== cls) old.className = cls;
      old.title = on ? '取消收藏' : '收藏';
    }
  }

  function favDetailToggle(node) {
    var star = (node && node.closest) ? node.closest('.pcg-dc-fav') : null;
    if (!star) return false;
    var uid = star.getAttribute('data-dc-uid') || FAV.detailUid;
    if (!uid) return false;
    favSet(uid, !favHas(uid));
    // 立刻刷新详情页这颗星 + 外层所有星
    FAV.detailAt = Date.now();
    FAV.detailTickAt = 0;
    try { favDetailTick(Date.now()); } catch (e) { /* ignore */ }
    if (FAV.on || RANK.on || PENRANK.on) { FAV.sig = ''; favPaint(); }
    favLiftSoon(0);
    return true;
  }

  // 收藏星必须在 capture 阶段拦 pointerdown：游戏在格子/网格上先接管指针，
  // 拖动逻辑会把后续 click 的目标重定向到格子本身（于是打开详情、星星点不动）
  function favStarOf(node) {
    return (node && node.closest) ? node.closest('.pcg-star') : null;
  }

  function favToggle(star) {
    var uid = star && star.getAttribute('data-uid');
    if (!uid) return false;
    favSet(uid, !favHas(uid));
    var cell = star.closest('.pc-cell, .slot');
    if (cell) favStarOne(cell);
    if (FAV.on || RANK.on || PENRANK.on) { FAV.sig = ''; favPaint(); }
    // 点完星立刻置顶；游戏随后可能重绘网格，favLiftSoon 里再补一次
    favLiftSoon(0);
    FAV.hit = { uid: uid, at: Date.now() };
    return true;
  }

  var FAV_LIFT_SEL = '#pc-grid, #pen-grid, #evt-pc';

  document.addEventListener('pointerdown', function (e) {
    // v1.39：详情页立绘上的收藏按钮
    if (favDetailToggle(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var star = favStarOf(e.target);
    if (star) {
      e.preventDefault();
      e.stopPropagation();
      favToggle(star);
      return;
    }
    // v1.39：点格子记下 uid —— 详情页没 uid，只能靠这一下记住「点开的是谁」
    favRememberDetailUid(e.target);
    // 只有落在三个带星网格里才可能是「拖格子」：记下按下位置，置顶先让一拍
    var g = (e.target && e.target.closest) ? e.target.closest(FAV_LIFT_SEL) : null;
    if (!g) return;
    FAV_DRAG.at = Date.now();
    FAV_DRAG.x = Number(e.clientX) || 0;
    FAV_DRAG.y = Number(e.clientY) || 0;
    FAV_DRAG.down = FAV_DRAG.at;
  }, true);

  /* 第七十四批：松手时分辨「点了一下」和「真的在拖格子」。
   * 原来任何 pointerdown 都会让收藏置顶停 700ms —— 在配队界面点一只宝可梦，
   * 置顶要等最久 700ms 再加下一拍，玩家看到的就是「点完愣一下才重新排好」。
   * 现在只在拖动超过 6px 时才让开，单纯点一下立刻解除保护并马上置顶。 */
  document.addEventListener('pointerup', function (e) {
    if (!FAV_DRAG.down) return;
    var moved = Math.abs((Number(e.clientX) || 0) - FAV_DRAG.x) +
                Math.abs((Number(e.clientY) || 0) - FAV_DRAG.y);
    FAV_DRAG.down = 0;
    if (moved > 6) return;         // 真拖拽：让 700ms 保护自然到期，游戏自己排
    FAV_DRAG.at = 0;               // 只是点了一下：立刻解除保护
    favLiftSoon(30);               // 游戏这一拍重绘完就置顶，120ms 后再补一次
  }, true);

  document.addEventListener('pointercancel', function () {
    FAV_DRAG.down = 0;             // 手势被系统接管（滚动等），让保护自然到期
  }, true);

  document.addEventListener('click', function (e) {
    // v1.39：详情页收藏星——pointerdown 已处理，这里再吞一次 click 防止穿透
    if ((e.target && e.target.closest) && e.target.closest('.pcg-dc-fav')) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    var star = favStarOf(e.target);
    if (star) {
      e.preventDefault();
      e.stopPropagation();
      if (FAV.hit && Date.now() - FAV.hit.at < 700) { FAV.hit = null; return; }   // pointerdown 已经收藏过了
      favToggle(star);
      return;
    }
    // 游戏把这一下的目标重定向到了格子：吞掉它，别打开详情 / 别放进寄养
    if (FAV.hit && Date.now() - FAV.hit.at < 700) {
      var cell = (e.target && e.target.closest) ? e.target.closest('.pc-cell') : null;
      if (cell && cell.getAttribute('data-uid') === FAV.hit.uid) {
        e.preventDefault();
        e.stopPropagation();
        FAV.hit = null;
      }
    }
  }, true);

  /* ---------------- 联盟刷钱：高收益章节自动重刷（1.9.68 / 第二十三批） ----------------
   * 游戏没有自动战斗，所以这一块只负责「导航」：盯着冒险页的时间轴，
   * 这一轮的训练家打完、当前节点走到馆主时，立刻回地图把同一章重开，
   * 下一轮马上能接着打，馆主那一场直接跳过。
   * 只在 adventure / map 两个页面上动手；地下通道忙的时候一律让路。
   *
   * 第二十三批：整块改成「联盟刷钱」，并且**只在本地区里刷**——
   *   · 目标章节 = 玩家当前所在地区（存档 adv.chapter 的地区）里的联盟章；
   *   · 联盟开着 → 就打联盟（4 天王那 4 关，训练家 1.8 倍赏金，最赚），跟通没通关无关；
   *   · 联盟还没开 → 才退回本地区最高章兜底；
   *   · 正被游走神兽占着的章节跳过（进去就要打神兽），往前退几章找替身；
   *   · 地图上找章节也只点本地区的卡片，绝不跨地区切章。
   *
   * 第四十二批：联盟那 5 章（4 天王 + 冠军）在地图上没有单章行，整块只有一行
   * 「Ligue Pokémon」（data-ch="L"），点进去只回「当前进度」那一关 —— 所以
   *   · 目标改成「现在进得去的那一关」：人在联盟里就是当前关，否则是第 1 关；
   *   · 进图改走联盟入口（点 L 行 → 详情里的「进入联盟」）；
   *   · 落地后再看存档实际章节，落到别关就改刷那一关，不在「进 28 → 落 26」之间空转。
   */
  var FARM_REGION = [
    { key: 'unova', name: '合众', league: 77, badge: 'Maître Unys' },
    { key: 'sinnoh', name: '神奥', league: 60, badge: 'Maître Sinnoh' },
    { key: 'hoenn', name: '丰缘', league: 43, badge: 'Maître Hoenn' },
    { key: 'johto', name: '城都', league: 25, badge: 'Maître Johto' },
    { key: 'kanto', name: '关都', league: 9, badge: 'Maître' }
  ];

  var FARM = {
    busy: false, lastAt: 0, phase: 'idle', why: '',
    ch: -1, label: '', mode: '', region: '', roamSkip: 0,
    runs: 0, total: 0, lastRun: 0, lastMs: 0, fights: 0,
    hist: [], startedAt: 0, runAt: 0, preMoney: 0, money: 0, enteredAt: 0,
    league0: 0, leagueCut: 0,   // 联盟模式：天王1 的内部章号 / 切走重开的截止章号
    firstCh: -1,               // 联盟重开时切回的本地区第一章
    lastMoney: 0,              // 上一秒的金钱（按场累加金币差用）
    leagueLeft: 0,              // 联盟模式：上次截止结算的时间戳（15 分钟冷却防虚增）
    fails: 0, nextAt: 0,   // 连续失败几次就先歇一会儿，别对着弹窗一直点
    blocked: {},           // 进图失败的章节 -> 黑名单到期时间（10 分钟内不再试它，改刷下一关）
    lastFailWhy: ''        // 最近一次进图失败的具体原因（面板休息文案里透传给玩家）
  };

  // 章节 → 地区（关都 0-13 / 城都 14-30 / 丰缘 31-47 / 神奥 48-65）
  function farmRegionOf(ch) {
    if (typeof ch !== 'number' || ch < 0) return '';
    for (var k in LEG_REGION_FIRST) {
      if (!Object.prototype.hasOwnProperty.call(LEG_REGION_FIRST, k)) continue;
      if (ch >= LEG_REGION_FIRST[k] && ch <= LEG_REGION_LAST[k]) return k;
    }
    return '';
  }
  function farmRegionCfg(key) {
    for (var i = 0; i < FARM_REGION.length; i++) {
      if (FARM_REGION[i].key === key) return FARM_REGION[i];
    }
    return null;
  }
  function farmModeOf(v) {
    return v === 'cleared' ? 'cleared' : (v === 'top3' ? 'top3' : 'uncleared');
  }

  function farmTarget() {
    var save = favSave();
    var adv = save && save.adv;
    if (!adv) return { ok: false, why: '还没读到存档，等一下' };
    var unlocked = Number(adv.unlocked) || 0;
    var mode = farmModeOf(settings.farmMode);
    var reg = farmRegionOf(Number(adv.chapter));
    if (!reg) return { ok: false, why: '还没读到当前地区，先回冒险页看一眼' };
    var tg = farmRegionCfg(reg);
    var first = LEG_REGION_FIRST[reg] || 0;
    if (!tg) return { ok: false, why: '这张地图上没有可刷的联盟章节' };
    if (unlocked < tg.league) {
      /* 联盟还没解锁（低进度号）：退回刷本地区已解锁的最高几章（老行为），
       * 等冠军之路通了再进联盟。这种情况下不走联盟的截止逻辑（普通章按章号走）。 */
      var top0 = Math.min(unlocked, LEG_REGION_LAST[reg] != null ? LEG_REGION_LAST[reg] : unlocked);
      var pool0 = [], seen0 = {}, i0, c0;
      for (i0 = 0; i0 <= 4; i0++) {
        c0 = top0 - i0;
        if (c0 < 0 || seen0[c0]) continue;
        seen0[c0] = 1; pool0.push(c0);
      }
      if (!pool0.length) return { ok: false, why: tg.name + '地区还没有解锁的章节' };
      return {
        ok: true, ch: pool0[0], region: reg, mode: mode,
        league0: 0, leagueCut: 0, label: tg.name + ' · 第 ' + (pool0[0] + 1) + ' 章',
        why: '联盟还没解锁，先刷已解锁的章节'
      };
    }

    /* 联盟的真实结构（对着游戏地图和参考实现核对过）：地图上只有一行 🏆 联盟
     * （data-ch="L"，联盟卡片没有 data-ch、按文字找），四个天王没有各自的地图行——
     * 进联盟后按顺序推进，内部章号 = tg.league .. tg.league+4
     * （城都：25 一树 / 26 阿桔 / 27 希巴 / 28 梨花 / 29 冠军，打输一场回到第 1 个训练家）。
     * 三种模式 = 打到哪个内部章号就切回本地区第一章重开（参考实现同款）：
     *   top3     ：kk=3，打到第 3 位（希巴）之后切走，第 4 关不打
     *   uncleared：kk=4，打完 4 个天王切走，永远不打冠军（未通关 1.8 倍赏金一直在）
     *   cleared  ：kk=5，连冠军一起打完，联盟完成回地图后再重开
     * 游走神兽只占常规章，不会进联盟，所以 L 目标不需要避让。 */
    var kk = mode === 'top3' ? 3 : (mode === 'uncleared' ? 4 : 5);
    var leagueCut = tg.league + kk;
    var label = tg.name + ' · 联盟' +
      (mode === 'top3' ? '前 3 关' : (mode === 'uncleared' ? '前 4 关（不打冠军）' : '（含冠军）'));
    return {
      ok: true, ch: 'L', region: reg, mode: mode,
      league0: tg.league, leagueCut: leagueCut, firstCh: first, kk: kk,
      label: label, why: ''
    };
  }

  // 冒险页时间轴：谁在打、打到第几个节点
  function farmNodes() {
    var tl = document.getElementById('timeline');
    if (!tl) return null;
    var all = tl.querySelectorAll('.tl-node');
    if (!all.length) return null;
    var cur = tl.querySelector('.tl-node.current');
    var type = 'end';
    if (cur) {
      if (cur.classList.contains('gym')) type = 'gym';
      else if (cur.classList.contains('fight')) type = 'fight';
      else if (cur.classList.contains('wild')) type = 'wild';
      else if (cur.classList.contains('heal')) type = 'heal';
      else type = 'other';
    }
    return {
      total: all.length,
      done: tl.querySelectorAll('.tl-node.done').length,
      fights: tl.querySelectorAll('.tl-node.fight.done').length,
      gymDone: tl.querySelectorAll('.tl-node.gym.done').length,   // 已打完的天王数
      gymTotal: tl.querySelectorAll('.tl-node.gym').length,       // 联盟里的天王总数（含冠军）
      type: type, at: !!cur
    };
  }

  function farmRowTitle(row) {
    try {
      var t = row.querySelector('.t b') || row.querySelector('.t');
      return t ? String(t.textContent || '').trim() : '';
    } catch (e) { return ''; }
  }

  // 地图上找到这一章：只在本地区的卡片里找，绝不点别的地区（不跨地区切章）
  async function farmFindRow(ch) {
    var sel = '.mp-row[data-ch="' + ch + '"]';
    var row = document.querySelector(sel);
    if (row) return row;
    var reg = (ch === 'L') ? (FARM.region || '') : farmRegionOf(ch);
    var card = reg
      ? (document.querySelector('.rg.open[data-rg="' + reg + '"]') ||
        document.querySelector('.rg[data-rg="' + reg + '"]'))
      : null;
    if (card && !card.classList.contains('locked')) {
      card.click();
      await sleep(700);
      row = document.querySelector(sel);
      if (row) return row;
    }
    for (var i = 0; i < 4; i++) {
      await sleep(400);
      row = document.querySelector(sel);
      if (row) return row;
    }
    return null;
  }

  // 进图 → 选章节 → 点出发
  async function farmEnter(ch) {
    /* 按需求：联盟刷钱不和闪光战斗守卫互斥（其它切图功能仍受守卫保护） */
    if (typeof ch === 'number' && ch < 0) {
      FARM.why = '重开目标还没算好，等下一轮自动纠正';
      return false;
    }
    if (activeScreenName() !== 'map') {
      if (!await legOpenMap()) { FARM.why = '地图页打不开'; return false; }
    }
    if (activeScreenName() !== 'map') { FARM.why = '地图页打不开'; return false; }
    var row = await farmFindRow(ch);
    if (!row && FARM.region) {
      /* 地图可能停在别的地区列表（从联盟切回来后地图不一定是目标章的地区）：
       * 先切到目标地区再找一次（参考实现同款兜底） */
      await legShowRegion(FARM.region);
      row = await farmFindRow(ch);
    }
    if (!row) {
      FARM.why = (ch === 'L') ? '地图上找不到联盟入口' : '地图上找不到第 ' + (ch + 1) + ' 章';
      return false;
    }
    var title = farmRowTitle(row);
    if (title) FARM.label = title;
    if (!row.classList.contains('sel')) { row.click(); await sleep(450); }
    var go = await legFindGo(ch);
    if (!go) {
      FARM.why = (ch === 'L') ? '联盟的出发按钮没找到或是灰的' : '第 ' + (ch + 1) + ' 章还没解锁';
      return false;
    }
    go.click();
    await sleep(800);
    if (activeScreenName() !== 'adventure') {
      FARM.why = '点了出发但没进章（游戏没响应或被拦）';
      return false;
    }
    return true;
  }

  async function farmGo(ch) {
    FARM.busy = true;
    screenHold('farm', 25000);
    try {
      if (!await farmEnter(ch)) {
        FARM.enteredAt = 0;
        var firstFail = FARM.fails === 0;
        var why = FARM.why || '点了但没进去';
        FARM.fails++;
        /* 只有「章节本身进不去」才拉黑 10 分钟改刷下一关；
         * 「找不到」有切地区兜底，多半是屏幕没切过去的临时失败，不拉黑；
         * 地图没打开这类临时性失败也不拉黑，下一轮原地再试 */
        if (/还没解锁|没进章/.test(why)) {
          FARM.blocked[ch] = Date.now() + 10 * 60000;
        }
        FARM.lastFailWhy = why;
        if (firstFail) {
          log('联盟刷钱：进 ' + (FARM.label || '第 ' + (ch + 1) + ' 章') + ' 失败——' + why);
        }
        if (FARM.fails >= 3) { FARM.nextAt = Date.now() + 20000; FARM.fails = 0; }
        return false;
      }
      FARM.fails = 0;
      var save = favSave() || {};
      FARM.money = Number(save.money) || 0;
      FARM.preMoney = FARM.money;
      FARM.lastMoney = FARM.money;
      FARM.runAt = Date.now();
      FARM.enteredAt = Date.now();
      if (!FARM.startedAt) FARM.startedAt = Date.now();
      return true;
    } finally {
      FARM.busy = false;
      screenFree('farm');
    }
  }

  async function farmFinish(st, thenCh) {
    var run = Math.max(0, (FARM.money || 0) - (FARM.preMoney || 0));
    FARM.runs++;
    FARM.lastRun = run;
    FARM.lastMs = FARM.runAt ? Date.now() - FARM.runAt : 0;
    FARM.hist.push({ money: run, fights: st.fights, ms: FARM.lastMs, at: Date.now() });
    if (FARM.hist.length > 10) FARM.hist.shift();
    log('联盟刷钱：第 ' + FARM.runs + ' 轮结束 +' + run + '（' + st.fights + ' 场训练家）');
    FARM.preMoney = FARM.money;              // 下一轮的记账基线
    FARM.phase = 'go';
    FARM.why = thenCh ? '切回本地区第一章，重开联盟' : '重开这一章';
    /* v1.32：游戏在「当前挑战章」详情新增了「重新挑战」按钮，点它直接重建本章
     * 节点 = 重开一轮。联盟打完游戏自己回地图，这时详情页通常还留着该按钮，
     * 点一次比重进一次联盟入口更快；按钮不在时照旧 farmGo 走地图出发流程。 */
    var targetCh = (typeof thenCh === 'number' && thenCh >= 0) ? thenCh : FARM.ch;
    var CYCLE = window.PCG_MAP_CYCLE || null;
    var restarted = false;
    if (CYCLE && typeof CYCLE.restart === 'function') {
      /* restart 只认数字章号：联盟 FARM.ch==='L' 时用当前存档章号（联盟段）定位，
       * 详情里的 mp-restart 由游戏自己判断是否渲染，点它就是重开联盟这一轮。 */
      var farmSave = favSave() || null;
      var restartCh = (typeof targetCh === 'number' && targetCh >= 0)
        ? targetCh
        : ((farmSave && farmSave.adv && farmSave.adv.chapter) || -1);
      try {
        restarted = await CYCLE.restart(restartCh, {
          owner: 'farm', force: true, save: farmSave
        });
      } catch (e) { restarted = false; }
    }
    if (restarted) {
      FARM.enteredAt = Date.now();
      FARM.runAt = Date.now();
      FARM.lastMoney = FARM.money;
      return;
    }
    farmGo(targetCh).catch(function (e) {
      FARM.why = '出错了：' + ((e && e.message) || e);
    });
  }

  function farmCycle() {
    if (!settings.autoFarm) {
      if (FARM.phase !== 'idle' || FARM.startedAt) {
        FARM.phase = 'idle';
        FARM.why = '';
        FARM.startedAt = 0;      // 停止后已跑时长归零（覆盖所有关闭路径）
        FARM.enteredAt = 0;
      }
      return;
    }
    if (FARM.busy) return;
    var now = Date.now();
    if (FARM.nextAt && now < FARM.nextAt) {
      FARM.phase = 'wait';
      FARM.why = '试了几次没进去（' + (FARM.lastFailWhy || '原因见最近事件') + '），歇 ' +
        Math.ceil((FARM.nextAt - now) / 1000) + ' 秒再试';
      return;
    }
    if (now - FARM.lastAt < 1200) return;
    FARM.lastAt = now;

    var tg = farmTarget();
    if (!tg.ok) {
      FARM.phase = 'lock';
      FARM.why = tg.why;
      FARM.ch = -1;
      return;
    }
    if (tg.ch !== FARM.ch || tg.mode !== FARM.mode || tg.region !== FARM.region) {
      FARM.ch = tg.ch;
      FARM.mode = tg.mode;
      FARM.region = tg.region || '';
      FARM.label = tg.label;
      FARM.runs = 0;
      FARM.total = 0;
      FARM.hist = [];
      /* startedAt 保留：已跑时间 = 本次开启后跑了多久，换目标（地区判定抖动）不清零，
       * 不然预计每小时收益永远凑不满出值门槛 */
      FARM.runAt = 0;
      FARM.blocked = {};
      FARM.league0 = tg.league0 || 0;
      FARM.leagueCut = tg.leagueCut || 0;
      FARM.firstCh = (typeof tg.firstCh === 'number') ? tg.firstCh : -1;
    }
    /* 联盟模式的关卡数据每轮都同步（在不在联盟里 / 截止位判定全靠它们，
     * 之前漏了赋值，league0 永远是 0，导致进联盟后每秒重复开地图） */
    FARM.league0 = tg.league0 || 0;
    FARM.leagueCut = tg.leagueCut || 0;
    /* firstCh 也每轮同步：联盟块每轮都带值（0 = 关都第一章，是合法目标，不能用 || 兜底）；
     * 存档哪一帧读歪算错地区，下一轮自动纠正，不会卡死在错误目标上 */
    if (typeof tg.firstCh === 'number') FARM.firstCh = tg.firstCh;
    if (UG.busy) {
      FARM.phase = 'wait';
      FARM.why = '地下通道在检查/领奖/派队，等它办完';
      return;
    }
    if (modalVisible()) {
      FARM.phase = 'wait';
      FARM.why = '有个弹窗挡着，先关掉它';
      return;
    }
    if (screenBusy('farm', now)) {
      FARM.phase = 'wait';
      FARM.why = (screenWho('farm') || '别的功能') + '在切页，等它办完';
      return;
    }

    /* 联盟打完（含冠军）游戏会自己回地图：这时结算这一轮，然后重进联盟 */
    if (FARM.ch === 'L' && FARM.enteredAt && activeScreenName() === 'map') {
      FARM.leagueLeft = 0;
      farmFinish({ fights: FARM.fights });
      return;
    }

    var scr = activeScreenName();
    if (scr !== 'adventure' && scr !== 'map') {
      FARM.phase = 'wait';
      FARM.why = '在等你回到冒险页（战斗里它不抢页面）';
      return;
    }

    var save = favSave() || {};
    var adv = save.adv || {};
    FARM.money = Number(save.money) || 0;
    /* 每打完一场就把金币差累加进累计收益（联盟在章内连打，按场结算） */
    if (FARM.lastMoney && FARM.money > FARM.lastMoney) {
      FARM.total += FARM.money - FARM.lastMoney;
    }
    FARM.lastMoney = FARM.money;
    var cur = Number(adv.chapter);
    /* 联盟模式：FARM.ch 是 'L'，内部章号在联盟段（league0..league0+4）就算已经在章里 */
    var inChapter = (FARM.ch === 'L')
      ? (FARM.league0 > 0 && cur >= FARM.league0 && cur <= FARM.league0 + 5)
      : (cur === FARM.ch);
    if (!adv.nodes || !adv.nodes.length || !inChapter) {
      FARM.phase = 'go';
      FARM.why = '进' + (FARM.label || ('第 ' + (FARM.ch + 1) + ' 章'));
      farmGo(FARM.ch).catch(function (e) {
        FARM.why = '出错了：' + ((e && e.message) || e);
      });
      return;
    }

    var st = farmNodes();
    if (!st) { FARM.phase = 'run'; FARM.why = '等这一章的时间轴出来'; return; }
    FARM.fights = st.fights;

    var league = FARM.ch === 'L';

    /* 联盟模式：天王战不算「一轮结束」——那是普通道馆章的结算点，
     * 用在联盟里就是「到天王面前就反复重开 + 虚增轮次」（视频里的 bug）。
     * 联盟每关有独立时间线（截图里「第4步/共6步」是梨花关内部的步骤），
     * gym.done 只数当前关的天王，跨关数不出「已打完几个天王」——
     * 截止信号用内部章号：打赢一个天王进下一关，adv.chapter 跟着 +1。
     * top3 = 进入第 4 关（league0+3）就切走；uncleared = 进入冠军关（league0+4）就切走。
     * leagueLeft 记录已结算过的章号：切走失败重试时不重复记轮次（防虚增）。 */
    if (FARM.ch === 'L' && FARM.leagueCut > 0) {
      var stage = Number(adv.chapter);
      if (stage < FARM.leagueCut) {
        FARM.leagueLeft = 0;                  // 还没到截止位：正常打（重开成功后也会走到这清零）
      } else {
        var inBattle = !!document.querySelector('#enemy-slot .enemy');
        if (inBattle) {
          FARM.phase = 'run';
          FARM.why = '这一站打赢了，等结算完就切走重开';
          return;
        }
        if (!FARM.leagueLeft) {
          FARM.leagueLeft = stage;
          FARM.phase = 'go';
          FARM.why = '到截止位了，切回本地区第一章重开联盟';
          farmFinish(st, FARM.firstCh);
          return;
        }
        /* 已结算过人却还在联盟里 = 上次切走没成：只重试切走，不再记轮次 */
        FARM.phase = 'go';
        FARM.why = '上次没切走，重试切回本地区第一章重开联盟';
        farmGo(FARM.firstCh).catch(function (e) {
          FARM.why = '出错了：' + ((e && e.message) || e);
        });
        return;
      }
    }

    var fresh = (now - FARM.enteredAt) < 2500;
    var over = st.type === 'gym' || st.type === 'end';
    /* 联盟章里 gym 节点是天王本人：走到他面前不算一轮结束（见上），
     * 联盟的轮次只在打完整条联盟回地图时结算 */
    if (league || !over || fresh || st.fights < 1) {
      FARM.phase = 'run';
      if (league && st.type === 'gym') {
        FARM.why = '挑战天王（第 ' + (Number(adv.chapter) - FARM.league0 + 1) + ' 个）';
      } else if (st.type === 'fight') FARM.why = '打训练家（已完成 ' + st.fights + ' 场）';
      else if (st.type === 'wild') FARM.why = '野外节点，等它过去';
      else if (st.type === 'heal') FARM.why = '在休息点回血';
      else if (over && fresh) FARM.why = '刚重开，等时间轴';
      else if (over) FARM.why = '这一轮还没打训练家，等一下';
      else FARM.why = '推进中（' + st.done + '/' + st.total + '）';
      return;
    }
    farmFinish(st);
  }

  function farmState() {
    var elapsed = FARM.startedAt ? Math.max(0, Date.now() - FARM.startedAt) : 0;
    var hours = elapsed / 3600000;
    var tg = farmTarget();   // 没在跑的时候也要能告诉面板「现在能不能开」
    return {
      on: !!settings.autoFarm,
      ready: !!tg.ok,
      lockWhy: tg.ok ? '' : tg.why,
      mode: farmModeOf(settings.farmMode),
      phase: FARM.phase,
      why: FARM.why,
      ch: FARM.ch,
      region: FARM.region || (tg.ok ? tg.region : ''),
      regionZh: LEG_REGION_ZH[FARM.region || (tg.ok ? tg.region : '')] ||
        (FARM.region || (tg.ok ? tg.region : '') || ''),
      roamSkip: FARM.roamSkip || 0,
      label: FARM.label,
      runs: FARM.runs,
      total: FARM.total,
      run: Math.max(0, (FARM.money || 0) - (FARM.preMoney || 0)),
      avg: FARM.runs ? Math.round(FARM.total / FARM.runs) : 0,
      perHour: hours > 0 ? Math.round(FARM.total / hours) : 0,   // 不设门槛：第一场钱到账就出值，早期波动交给玩家自己判断
      elapsed: elapsed,
      fights: FARM.fights,
      lastRun: FARM.lastRun,
      lastMs: FARM.lastMs,
      hist: FARM.hist.slice(-6)
    };
  }

  /* 培育屋取蛋差事读的联盟刷钱状态（只读快照）：让路判断 / uncleared 模式的位次闸 */
  window.PCG_FARM_STATE = function () {
    var save = favSave() || {};
    var adv = save.adv || {};
    return {
      on: !!settings.autoFarm,
      busy: !!FARM.busy,
      mode: farmModeOf(settings.farmMode),
      ch: (typeof adv.chapter === 'number') ? adv.chapter : -1,
      /* 第五十九批：在不在联盟局 / 截止位章号。培育屋那边靠它判断「这一趟会不会
       * 把天王节奏打断」，只在要跳过去的一侧拦。 */
      league: (FARM.ch === 'L'),
      cut: FARM.leagueCut || 0
    };
  };

  function farmStop() {
    settings.autoFarm = false;
    FARM.nextAt = 0;
    FARM.fails = 0;
    FARM.startedAt = 0;      // 已跑时长归零
    FARM.enteredAt = 0;
    FARM.preMoney = 0;
    FARM.lastMoney = 0;
    FARM.leagueLeft = 0;
    try { SYNC.set({ autoFarm: false }); } catch (e) { /* ignore */ }
    FARM.phase = 'idle';
    FARM.why = '';
    log('联盟刷钱：停了');
    return { ok: true, text: '已停止联盟刷钱' };
  }

  function farmStart() {
    var tg = farmTarget();
    if (!tg.ok) return { ok: false, text: tg.why };
    /* 第二十五批：卡片互斥，先让其它几个下来再开自己 */
    exclusiveStopOthers('farm');
    settings.autoFarm = true;
    settings.farmMode = tg.mode;
    try { SYNC.set({ autoFarm: true, farmMode: tg.mode }); } catch (e) { /* ignore */ }
    FARM.runs = 0;
    FARM.total = 0;
    FARM.hist = [];
    FARM.startedAt = 0;
    FARM.runAt = 0;
    FARM.phase = 'go';
    FARM.ch = tg.ch;
    FARM.region = tg.region || '';
    FARM.mode = tg.mode;
    FARM.label = tg.label;
    FARM.why = '进' + tg.label;
    log('联盟刷钱：开始，目标 ' + tg.label);
    return { ok: true, text: '开始联盟刷「' + tg.label + '」' };
  }

  /* ---------------- 第二十五批：传说追踪 / 联盟刷钱的游戏页内悬浮看板 ----------------
   * 外观跟「伤害统计面板」一套（样式收在 hud-panel.js 里统一维护）：
   * 功能启动才出现、停止立刻收起；参数栏里的「游戏页内悬浮看板」是默认开关，默认开。 */
  function hudMoney(n) {
    var v = Math.round(Number(n) || 0);
    if (v >= 10000) return (Math.round(v / 1000) / 10) + ' 万';
    return String(v);
  }

  function legHudSnap() {
    var id = legTargetId();
    var stats = legStatsNow();
    var picks = legPicks();
    var rows = [], i;
    for (i = 0; i < picks.length && rows.length < 3; i++) {
      var p = picks[i];
      if (id && p.id === id) continue;
      rows.push({
        nm: p.name,
        sub: p.got ? '已捕获' : (p.locked ? '未解锁' : ''),
        val: p.where ? ('第 ' + p.where + ' 章') : '—'
      });
    }
    return {
      star: LEG.armed ? '●' : '',
      cells: [
        ['追踪目标', id ? legNameOf(id) : '还没选', id ? 'gold' : ''],
        ['挑战', (stats.tries || 0) + ' 次'],
        ['击败', (stats.win || 0) + ' 次', 'gold'],
        ['被击败', (stats.lose || 0) + ' 次']
      ],
      rows: rows,
      empty: rows.length ? '' : '没有其它可追的神兽',
      foot: LEG.why || '等它刷新',
      footOn: LEG.status === 'chasing' || LEG.status === 'fight'
    };
  }

  /* 和弹窗面板的 fmtDuration 同款：悬浮窗「已跑时间」与插件内「已跑」显示一致 */
  function farmDur(ms) {
    if (!ms || ms < 0) return '—';
    var s = Math.floor(ms / 1000);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    if (h > 0) return h + ' 小时 ' + m + ' 分';
    if (m > 0) return m + ' 分 ' + sec + ' 秒';
    return sec + ' 秒';
  }

  function farmHudSnap() {
    var s = farmState();
    var hist = (s.hist || []).slice(-3).reverse();
    var list = hist.map(function (h) {
      return { nm: (h.fights || 0) + ' 场训练家', sub: '一轮', val: '+' + hudMoney(h.money) };
    });
    /* 已跑时间放状态行（foot）上方，数据源和插件内面板同一个（farmState.elapsed） */
    list.push({ nm: '已跑时间', sub: '', val: farmDur(s.elapsed) });
    return {
      star: settings.autoFarm ? '●' : '',
      cells: [
        ['轮次', s.runs || 0],
        ['累计收益', hudMoney(s.total), 'gold'],
        ['预计每小时收益', hudMoney(s.perHour)],
        ['本章训练家', (s.fights || 0) + ' 场']
      ],
      rows: list,
      empty: list.length ? '' : '还没打完第一轮',
      foot: (s.label || '还没选章') + ' · ' + (s.why || s.phase || ''),
      footOn: !!settings.autoFarm
    };
  }

  var UGHUD = { at: 0, info: null };
  function ugHudInfo() {          // 查一次 DOM 有点重，4 秒内复用上一次的结果
    var now = Date.now();
    if (UGHUD.info && now - UGHUD.at < 4000) return UGHUD.info;
    var info = null;
    try { info = ugSlotsInfo(); } catch (e) { info = null; }
    UGHUD.at = now;
    if (info) UGHUD.info = info;
    return UGHUD.info || { perDay: (function(){ var e=Math.max(0,Math.min(3,parseInt((ugSave()&&ugSave().under&&ugSave().under.extra),10)||0)); var p=8,b=[1,1,2]; for(var i=0;i<e;i++)p+=b[i]; return p; })(), left: -1, slots: [], busy: 0, nextEnd: 0, source: 'none' };
  }
  function ugLeftShort(end) {
    var left = (Number(end) || 0) - Date.now();
    if (!(Number(end) > 0)) return '';
    if (left <= 0) return '该回来了';
    var m = Math.round(left / 60000);
    if (m < 1) return '马上回来';
    if (m < 60) return m + ' 分';
    return Math.floor(m / 60) + ' 小时 ' + (m % 60) + ' 分';
  }
  function ugSlotWord(s) {
    if (!s) return '—';
    var k = s.kind;
    if (k === 'running') return s.floor ? ('探险中 · 第 ' + s.floor + ' 层') : '探险中';
    if (k === 'done') return s.ko ? '跑完了 · 全员倒下' : '跑完了';
    if (k === 'empty') return '空闲';
    if (k === 'ready') return '已选好 3 只';
    if (k === 'blocked') return '派不出去';
    if (k === 'locked') return '未解锁';
    return '—';
  }
  function ugSlotVal(s) {
    if (!s) return '';
    var k = s.kind;
    if (k === 'running') return ugLeftShort(s.end);
    if (k === 'done') return '可领';
    if (k === 'empty') return (s.full ? ('已选 ' + s.full + '/3') : '可派遣');
    if (k === 'ready') return '等出发';
    if (k === 'locked') return s.can ? (s.cost || '可买') : (s.cost || '');
    return '';
  }
  function ugHudSnap() {
    var info = ugHudInfo();
    var slots = info.slots || [];
    var rows = [], running = 0, i;
    for (i = 0; i < slots.length; i++) {
      if (slots[i] && slots[i].kind === 'running') running++;
      if (rows.length >= 4) continue;
      rows.push({
        nm: '槽位 ' + (slots[i].bay >= 0 ? (slots[i].bay + 1) : (i + 1)) + ' · ' + ugSlotWord(slots[i]),
        val: ugSlotVal(slots[i])
      });
    }
    return {
      star: UG.state === 'working' ? '◆' : (UG.armed ? '●' : ''),
      cells: [
        ['今日次数', info.left >= 0 ? (info.left + ' / ' + info.perDay) : '—', info.left > 0 ? 'gold' : ''],
        ['在跑槽位', running + (slots.length ? (' / ' + slots.length) : '')],
        ['累计派出', (UG.sends || 0) + ' 次'],
        ['累计领奖', (UG.takes || 0) + ' 次', 'gold']
      ],
      rows: rows,
      empty: rows.length ? '' : '打开一次地下通道页就能读到槽位',
      foot: UG.why || '等下一轮检查',
      footOn: UG.armed || UG.state === 'working'
    };
  }

  var hudAt = 0;
  function hudTick() {
    if (Date.now() - hudAt < 1500) return;
    hudAt = Date.now();
    var HUD = window.PCG_HUD;
    if (!HUD) return;
    try {
      /* 这几张看板各自看自己的开关：功能没在跑就收起，免得占着屏幕右下角。
       * 第三十四批起统规格——全部走 hud-panel.js 那一张卡（可拖动 / 可折叠），
       * 同时开着的按开启顺序往上叠，不会互相盖住。
       * 第五十一批：顶栏多一个 ×，点它就相当于点 popup 里那张卡的「停止」——
       * onClose 直接挂到同一套 stop 上，停完那块看板自然收起。 */
      var leg = HUD.panel('leg', '传说追踪', { onClose: function () { legStop(); } });
      if (settings.legHud !== false && settings.legendaryId && (LEG.armed || settings.legArmed)) {
        leg.set(legHudSnap()).show();
      } else {
        leg.hide();
      }
      var farm = HUD.panel('farm', '联盟刷钱', { onClose: function () { farmStop(); } });
      if (settings.farmHud !== false && settings.autoFarm) {
        farm.set(farmHudSnap()).show();
      } else {
        farm.hide();
      }
      /* 第三十四批：地下通道补上看板，「一键派遣」开着才出现 */
      var ug = HUD.panel('ug', '地下通道', { onClose: function () { ugStop(); } });
      if (settings.ugHud !== false &&
        (settings.autoUnderground || settings.ugArmed || UG.armed)) {
        ug.set(ugHudSnap()).show();
      } else {
        ug.hide();
      }
    } catch (e) { /* 看板出错不影响主流程 */ }
  }

  function tick() {
    var now = Date.now();
    var pg = readPageState();

    if (pg) {
      if (!S.hookReady) {
        S.hookReady = true;
        log('防掉线守护已挂到游戏页');
        sendToPage('spoof:' + (settings.keepVisible ? '1' : '0'));
      }
      S.wsOpen = Number(pg.open) || 0;
      S.wsTotal = Number(pg.total) || 0;
      S.netOk = Number(pg.netOk) || 0;
      S.lastNetAt = Number(pg.lastNetAt) || 0;
      S.lastCloseAt = Number(pg.lastCloseAt) || 0;
      S.lastMsgAt = Number(pg.lastMsgAt) || 0;
      S.spoofOn = Number(pg.spoof) === 1;
      S.fbTicks = Number(pg.fb) || 0;
      S.hiddenSecs = Number(pg.hid) || 0;
      if (pg.lastCloseCode !== undefined) S.lastCloseCode = Number(pg.lastCloseCode) || 0;
      if (pg.lastCloseClean !== undefined) S.lastCloseClean = Number(pg.lastCloseClean) ? true : false;

      // 页面确实在用 WebSocket 才做连接层面的判断；否则只做页面健康检查
      if (S.wsTotal > 0) handleSockets(now);
      else { S.downSince = 0; S.connected = true; }
    } else {
      S.hookReady = false;
    }

    handleBootFail(now);
    handleMissingApp(now);
    titleTick(now);
    modalTick(now);
    try { versionUpdateTick(now); } catch (e) { logErr('版本更新重启', e); }
    try { stabTick(now); } catch (e) { logErr('本系排名', e); }
    try { dmgTick(now); } catch (e) { logErr('伤害统计', e); }
    try { hudTick(); } catch (e) { logErr('hud', e); }
    try { eggTick(now); } catch (e) { logErr('培育屋', e); }
    try { tbTick(now); } catch (e) { logErr('战斗属性提示', e); }
    try { favTick(now); } catch (e) { logErr('收藏', e); }
    try { evtTick(now); } catch (e) { logErr('配队筛选', e); }
    ugReportTick(now);
    feedTick(now);
    ugCycle().catch(function () {});
    legCycle().catch(function () {});
    try { farmCycle(); } catch (e) {
      FARM.why = '出错了：' + ((e && e.message) || e);
      logErr('联盟刷钱', e);
    }
    try { raidTick(now); } catch (e) {
      RAID.why = '出错了：' + ((e && e.message) || e);
      logErr('异色团体战', e);
    }
    notifyBackground(false);
  }

  /* ---------------- 与后台 / popup 通信 ---------------- */
  var lastNotify = 0;
  var lastConnected = null;

  /* 每个模块各跑一次 state()，失败的单独兜住，不让一个模块拖垮整份回执。 */
  function moduleState(name) {
    try {
      var m = window[name];
      if (!m || typeof m.state !== 'function') return null;
      return m.state();
    } catch (e) {
      return { ready: false, phase: '模块状态异常',
        why: name + '：' + String((e && e.message) || e) };
    }
  }

  function buildState() {
    return {
      version: VERSION,
      url: location.href,
      startedAt: S.startedAt,
      hookReady: S.hookReady,
      connected: S.connected,
      spoofOn: S.spoofOn,
      fbTicks: S.fbTicks,
      hiddenSecs: S.hiddenSecs,
      wsOpen: S.wsOpen,
      wsTotal: S.wsTotal,
      netOk: S.netOk,
      lastNetAt: S.lastNetAt,
      lastCloseAt: S.lastCloseAt,
      downSince: S.downSince,
      conn: {
        downSec: S.downSince ? Math.max(0, Math.round((Date.now() - S.downSince) / 1000)) : 0,
        why: S.downWhy || '',
        code: S.lastCloseCode,
        clean: !!S.lastCloseClean,
        tries: S.reconnectTries,
        manual: !!S.manualAt,
        nextIn: S.nextRetryAt ? Math.max(0, Math.round((S.nextRetryAt - Date.now()) / 1000)) : 0
      },
      reconnects: S.reconnects,
      reloads: S.reloads,
      bootRetries: S.bootRetries,
      reloadBlocked: S.reloadBlocked,
      feedables: S.feedables,
      feedCount: S.feedCount,
      lastFeedAt: S.lastFeedAt,
      feedItems: settings.feedItems || {},
      ug: {
        on: !!settings.autoUnderground,
        state: UG.state,
        note: UG.note,
        why: UG.why,
        sends: UG.sends,
        takes: UG.takes,
        lastAt: UG.lastActionAt,
        waitSec: Math.max(0, Math.round((UG.backoffUntil - Date.now()) / 1000)),
        done: !!(UG.doneDay && UG.doneDay === raidDayId()),
        doneDay: UG.doneDay || settings.ugDoneDay || '',
        slots: ugSlotsInfo(),
        from: { list: ugFromScan().list.slice(0), cur: UG_FROM.cur, want: ugFromWant() }
      },
      farm: farmState(),
      leg: {
        target: legTargetId(),
        armed: !!LEG.armed,
        failAt: LEG.failAt || 0,
        status: LEG.status,
        why: LEG.why,
        ch: LEG.ch,
        left: LEG.until ? Math.max(0, Math.round((LEG.until - Date.now()) / 1000)) : 0,
        inBattle: !!LEG.inBattle,
        stats: (function () {
          var s = legStatsNow();
          return { tries: s.tries, win: s.win, lose: s.lose, since: s.since };
        })(),
        picks: legPicks()
      },
      raid: {
        on: !!settings.autoRaid,
        phase: RAID.phase,
        why: RAID.why,
        note: RAID.note,
        tries: RAID.tries,
        fights: RAID.fights,
        key: RAID.key,
        reset: raidResetSec(),
        stats: { go: RAID.stats.go, caught: RAID.stats.caught },
        cards: raidCardsOut(),
        board: RAID_PANEL ? raidBoard() : null
      },
      lastRealInputAt: S.lastRealInputAt,
      lastFakeActivityAt: S.lastFakeActivityAt,
      /* 第四十四批：静音保活的真实状态。
       * off = 没开；wait-gesture = 等着你点一下页面；running / suspended = 音频上下文状态 */
      keepAlive: !audioWant ? 'off' : (audioCtx ? audioCtx.state : 'wait-gesture'),
      gestureSeen: !!S.gestureSeen,
      events: S.events.slice(-20),
      log: (window.PCG_LOG ? window.PCG_LOG.list().slice(-60) : S.events.slice(-20)),
      probe: (window.PCG_PROBE && typeof window.PCG_PROBE.result === 'function'
        ? (function () {
          try { return window.PCG_PROBE.result(); }
          catch (e) { return null; }
        })() : null),
      // 第二批：图鉴捕捉的状态由 dex-hunter.js 自己维护，这里只透传给 popup
      dex: moduleState('PCG_DEX'),
      // 第六批：游戏图鉴页「未捕捉」筛选按钮的状态
      dexFilter: moduleState('PCG_DEX_FILTER'),
      // 第八十四批：图鉴详情卡「同家族跳转」
      dexJump: moduleState('PCG_DEX_JUMP'),
      // 第三批：培育屋监测的状态由 nursery-monitor.js 自己维护，这里只透传
      nursery: moduleState('PCG_NURSERY'),
      // 地下预测：晶洞序列 + 探险结果预览（内联内核 PCG_UNDERGROUND）
      underground: moduleState('PCG_UNDERGROUND'),
      // 第四批：黑市扫货的状态由 market-sniper.js 自己维护，这里只透传
      market: moduleState('PCG_MARKET'),
      // 第五批：闪光守卫 / 道具刷取 / 树果刷取同样由各自模块维护
      shiny: moduleState('PCG_SHINY_GUARD'),
      items: moduleState('PCG_ITEMS'),
      berries: moduleState('PCG_BERRIES'),
      extVersion: (function () {
        try { return chrome.runtime.getManifest().version; } catch (e) { return VERSION; }
      })(),
      settings: settings
    };
  }

  function notifyBackground(force) {
    var now = Date.now();
    if (!force && now - lastNotify < 5000 && S.connected === lastConnected) return;
    lastNotify = now;
    lastConnected = S.connected;
    try {
      chrome.runtime.sendMessage({
        type: 'pcg-status',
        status: { connected: S.connected, hookReady: S.hookReady, reconnects: S.reconnects, reloads: S.reloads }
      }, function () { void chrome.runtime.lastError; });
    } catch (e) { /* 后台没醒也正常 */ }
  }

  /* 第二十五批：几个模块（各自独立 IIFE）也要读全局开关（刷新后继续 / 看板默认值），
   * 统一从这里取，避免各自再读一遍 chrome.storage 拿到过期值。 */
  window.PCG_SETTINGS_GET = function (key, dflt) {
    if (!key) return settings;
    return settings[key] === undefined ? dflt : settings[key];
  };

  /* 第二批：图鉴捕捉和刷钱 / 神兽追踪 / 团体战连战都要占着冒险页 + 地图页，
   * 两边同时跑会互相把页面拽走。现在统一按「后开的赢」：谁点开始谁留下，
   * 其它几个自动停（第二十五批把六张卡片的互斥收拢到一处）。
   *
   * 第三十批：黑市扫货退出了这套互斥（改归「日常监测」），只剩五张卡片互斥；
   * 黑市改用下面 MARKET_WANT 那套「先说要用页面」的让路信号。 */
  var EXCLUSIVE_NAME = {
    dex: '图鉴捕捉', leg: '传说追踪', item: '稀有道具刷取',
    berry: '树果刷取', farm: '联盟刷钱',
    /* 第五十八批：定点循环（orb.js）也占着冒险页 + 地图页，一起进互斥名单 */
    orb: '定点循环'
  };
  function orbOn() {
    try {
      var O = window.PCG_ORB && window.PCG_ORB.state;
      return !!(O && O.armed);
    } catch (e) { return false; }
  }
  function exclusiveRunning(key) {
    try {
      if (key === 'dex') {
        return !!(window.PCG_DEX && typeof window.PCG_DEX.state === 'function' &&
          window.PCG_DEX.state().running);
      }
      if (key === 'item') return itemsOn();
      if (key === 'berry') return berriesOn();
      if (key === 'market') {
        return !!(window.PCG_MARKET && typeof window.PCG_MARKET.state === 'function' &&
          window.PCG_MARKET.state().armed);
      }
      if (key === 'farm') return !!settings.autoFarm;
      if (key === 'leg') return !!(settings.legendaryId && settings.legArmed);
      if (key === 'orb') return orbOn();
    } catch (e) { /* ignore */ }
    return false;
  }
  function exclusiveStopOne(key) {
    try {
      if (key === 'dex' && window.PCG_DEX) { window.PCG_DEX.stop('开了别的任务，先让路'); return; }
      if (key === 'item' && window.PCG_ITEMS) { window.PCG_ITEMS.stop('开了别的任务，先让路'); return; }
      if (key === 'berry' && window.PCG_BERRIES) { window.PCG_BERRIES.stop('开了别的任务，先让路'); return; }
      if (key === 'market' && window.PCG_MARKET) { window.PCG_MARKET.stop(); return; }
      if (key === 'farm') { farmStop(); return; }
      if (key === 'leg') { legStop(); return; }
      if (key === 'orb' && window.PCG_ORB && typeof window.PCG_ORB.stop === 'function') {
        window.PCG_ORB.stop('开了别的任务，先让路');
        return;
      }
    } catch (e) { /* ignore */ }
  }
  /* 启动前调用：把其它几个互斥任务停掉，返回停掉的名单 */
  function exclusiveStopOthers(key) {
    var killed = [];
    var all = ['dex', 'leg', 'item', 'berry', 'farm', 'orb'];
    for (var i = 0; i < all.length; i++) {
      var k = all[i];
      if (k === key || !exclusiveRunning(k)) continue;
      exclusiveStopOne(k);
      killed.push(EXCLUSIVE_NAME[k]);
    }
    if (killed.length) {
      log((EXCLUSIVE_NAME[key] || '任务') + '：已停掉 ' + killed.join(' / ') +
        '（五张卡片互斥，开一个会自动关掉其它）');
    }
    return killed;
  }

  function dexStopOthers() { return exclusiveStopOthers('dex'); }

  /* 第五十八批：orb.js 是独立 script，开跑时也走同一套「后开的赢」，
   * 直接把互斥收拢函数挂在 window 上给它用。 */
  window.PCG_EXCLUSIVE_STOP = exclusiveStopOthers;

  function dexOthersOn() {
    return !!(settings.autoFarm || settings.autoRaid ||
      (settings.legendaryId && settings.legArmed) || itemsOn() || berriesOn() ||
      marketWants() || orbOn());
  }

  function dexFail(e) {
    return { ok: false, text: '出错了：' + ((e && e.message) || e) };
  }

  function marketFail(e) {
    return { ok: false, text: '出错了：' + ((e && e.message) || e) };
  }

  /* ---------------- 第五批：道具刷取 / 树果刷取 ----------------
   * 两个刷取都要反复切章节占着冒险页 + 地图页，和刷钱 / 神兽 / 图鉴捕捉 /
   * 第二十五批一起归到统一互斥（exclusiveStopOthers）；
   * 第三十批黑市扫货已退出这套互斥，改用 MARKET_WANT 让路。 */
  function itemsOn() {
    try { return !!(window.PCG_ITEMS && window.PCG_ITEMS.state().running); }
    catch (e) { return false; }
  }
  function berriesOn() {
    try { return !!(window.PCG_BERRIES && window.PCG_BERRIES.state().running); }
    catch (e) { return false; }
  }
  function farmFail(e) {
    return { ok: false, text: '出错了：' + ((e && e.message) || e) };
  }
  function farmOthersOn() {
    /* 第三十批：黑市扫货不再是互斥卡，只在它「真的要用页面」的那几秒让路，
     * 不再因为它处于开启状态就一直空等。 */
    return !!(settings.autoFarm || settings.autoRaid ||
      (settings.legendaryId && settings.legArmed) ||
      (window.PCG_DEX && typeof window.PCG_DEX.state === 'function' && window.PCG_DEX.state().running) ||
      marketWants() || orbOn());
  }
  function farmStopOthers(kind) {
    return exclusiveStopOthers(kind === 'berry' ? 'berry' : 'item');
  }

  /* 第四批：黑市扫货只在「打开黑市页 → 点两道确认」的短短几秒里占页面。
   * 第三十批：它挪进「日常监测」，不再和别的任务互斥，所以这里什么都不停。 */
  function marketStopOthers() {
    return [];
  }

  /* 反过来：黑市也不再给别人让路（以前它会因为图鉴 / 刷钱 / 神兽在跑就一直等）。 */
  function marketOthersOn() {
    return false;
  }

  /* 第三十批：「我要用页面」信号——黑市扫货和地下通道是两件优先切页的事。
   * 黑市在真正去黑市页之前先喊一声（默认 20 秒后自动过期，模块崩了也不会一直卡着），
   * 图鉴 / 道具 / 树果 / 刷钱 / 神兽 / 团体战的循环看到 marketWants() 就主动让一轮。 */
  var MARKET_WANT = 0;
  function marketWants() { return MARKET_WANT > Date.now(); }

  try {
    chrome.runtime.onMessage.addListener(function (msg, sender, reply) {
      if (!msg || !msg.type) return;
      if (msg.type === 'pcg-under-control') {
        if (!window.PCG_UNDER_CONTROL) { reply({ ok: false, text: '请更新扩展并刷新游戏页' }); return true; }
        window.PCG_UNDER_CONTROL.request(msg.cmd, msg.args).then(reply).catch(function (e) { reply({ ok: false, text: String((e && e.message) || e) }); });
        return true;
      }
      if (msg.type === 'pcg-get-state') {
        // 永远给回执：哪怕 buildState 内部出错，也要让 popup 拿到最小状态。
        try { reply(buildState()); }
        catch (e) {
          try {
            reply({
              version: VERSION, url: location.href, connected: false,
              hookReady: S.hookReady, startedAt: S.startedAt,
              bootError: String((e && e.message) || e),
              extVersion: VERSION, settings: settings
            });
          } catch (e2) {
            reply({ version: VERSION, connected: false, bootError: 'reply failed' });
          }
        }
        return true;
      }
      if (msg.type === MSG.CLEAR_LOG || msg.type === 'pcg-clear-log') {
        try { if (window.PCG_LOG) window.PCG_LOG.clear(); } catch (e) { /* ignore */ }
        S.events = [];
        reply({ ok: true });
        return true;
      }
      if (msg.type === 'pcg-settings') {
        var keepArmed = !!settings.legArmed;
        settings = Object.assign({}, DEFAULT_SETTINGS, msg.settings || {});
        // 面板没带这个字段时保持原样（没打开游戏页就改别的开关，不能把「在追」冲掉）
        if (!msg.settings || msg.settings.legArmed == null) settings.legArmed = keepArmed;
        settings.feedItems = Object.assign({}, (msg.settings && msg.settings.feedItems) || {});
        applySettings();
        cfgBackupWrite();
        reply({ ok: true });
        return true;
      }
      if (msg.type === 'pcg-cfg-info') {
        reply({ ok: true, at: cfgBackupAt() });
        return true;
      }
      if (msg.type === 'pcg-cfg-restore') {
        var rbk = cfgRestoreFromBackup();
        if (!rbk || !Object.keys(rbk).length) {
          reply({ ok: false, text: '没有找到本地备份（先打开一次游戏页再试）' });
          return true;
        }
        settings = Object.assign({}, DEFAULT_SETTINGS, settings, rbk);
        settings.feedItems = Object.assign({}, settings.feedItems || {});
        try {
          SYNC.set(Object.assign({}, rbk), function () { void chrome.runtime.lastError; });
        } catch (eRs) { /* ignore */ }
        cfgBackupWrite();
        applySettings();
        reply({ ok: true, cfg: settings });
        return true;
      }
      if (msg.type === 'pcg-fav-clear') {
        reply(favClear());
        return true;
      }
      if (msg.type === 'pcg-keepdup') {
        keepDupAsk(msg.on ? 'on' : 'off').then(function (r) { reply(r); });
        return true;
      }
      if (msg.type === 'pcg-keepdup-status') {
        keepDupAsk('status').then(function (r) { reply(r); });
        return true;
      }
      if (msg.type === 'pcg-reconnect-now') {
        var nowMs = Date.now();
        S.downSince = S.downSince || nowMs;
        S.nextRetryAt = 0;
        S.reconnectTries = Math.max(S.reconnectTries, 2); // 手动点就用强一点的方式
        S.manualAt = nowMs;
        requestReconnect(nowMs);
        reply({
          ok: true,
          text: settings.autoReload
            ? '已催了一次；9 秒还没连上就整页刷新'
            : '已催了一次（自动刷新关着，9 秒没好就得自己按 F5）'
        });
        return true;
      }
      if (msg.type === 'pcg-leg-stop') {
        reply(legStop());
        return true;
      }
      if (msg.type === 'pcg-farm-stop') {
        reply(farmStop());
        return true;
      }
      if (msg.type === 'pcg-farm-now') {
        reply(farmStart());
        return true;
      }
      if (msg.type === 'pcg-raid-stop') {
        reply(raidStop());
        return true;
      }
      if (msg.type === 'pcg-ug-stop') {
        reply(ugStop());
        return true;
      }
      if (msg.type === 'pcg-ug-now') {
        ugManual().then(function (r) { reply(r); }, function (e) {
          reply({ ok: false, text: '出错了：' + ((e && e.message) || e) });
        });
        return true;   // 异步回复
      }
      if (msg.type === 'pcg-leg-now') {
        /* 第一百一十九批：传说追踪的「顺手喂两种果子」只由这个独立开关决定，
         * 默认关；没有总闸，没勾就绝不吃树果。 */
        if (settings.legAutoFeed) ensureRazzFeed('开始神兽追踪');
        legManual().then(function (r) {
          reply(r);
        }, function (e) {
          reply({ ok: false, text: '出错了：' + ((e && e.message) || e) });
        });
        return true;
      }
      if (msg.type === 'pcg-raid-now') {
        raidManual().then(function (r) { reply(r); }, function (e) {
          reply({ ok: false, text: '出错了：' + ((e && e.message) || e) });
        });
        return true;
      }
      /* ---------------- 第二批：图鉴补全 / 指定宝可梦捕捉 ---------------- */
      if (msg.type === MSG.DEX_SCAN || msg.type === 'pcg-dex-scan') {
        if (!window.PCG_DEX) { reply({ ok: false, text: '图鉴模块没加载，刷新一次游戏页' }); return true; }
        window.PCG_DEX.scan(msg.options || {}).then(function (r) { reply(r); }, function (e) { reply(dexFail(e)); });
        return true;
      }
      if (msg.type === MSG.DEX_START || msg.type === 'pcg-dex-start') {
        if (!window.PCG_DEX) { reply({ ok: false, text: '图鉴模块没加载，刷新一次游戏页' }); return true; }
        dexStopOthers();
        /* 第一百一十九批：dexAutoFeed 默认关，只有玩家显式勾上才动喂食设置；
         * 没有总闸，勾了也只是把果子加进候选，喂不喂看每格自己的开关。 */
        var feedOn = settings.dexAutoFeed === true;
        var razzOn = feedOn ? ensureRazzFeed('开始图鉴追踪') : false;
        window.PCG_DEX.start(msg.options || {}).then(function (r) {
          if (r && r.ok && razzOn) r.text += ' · 已把蔓莓果 + 谜芝果加入自动喂食候选';
          reply(r);
        }, function (e) { reply(dexFail(e)); });
        return true;
      }
      if (msg.type === MSG.DEX_STOP || msg.type === 'pcg-dex-stop') {
        reply(window.PCG_DEX ? window.PCG_DEX.stop() : { ok: false, text: '图鉴模块没加载' });
        return true;
      }
      if (msg.type === MSG.DEX_CONFIG || msg.type === 'pcg-dex-config') {
        if (!window.PCG_DEX) { reply({ ok: false, text: '图鉴模块没加载' }); return true; }
        reply({ ok: true, cfg: window.PCG_DEX.config(msg.cfg || {}) });
        return true;
      }
      /* ---------------- 第六批：游戏图鉴页「未捕捉」筛选 ---------------- */
      if (msg.type === MSG.DEX_FILTER || msg.type === 'pcg-dex-filter') {
        if (!window.PCG_DEX_FILTER) {
          reply({ ok: false, text: '图鉴筛选模块没加载，刷新一次游戏页' });
          return true;
        }
        var df = (msg.on == null)
          ? window.PCG_DEX_FILTER.toggle()
          : window.PCG_DEX_FILTER.set(!!msg.on);
        reply({ ok: true, filter: df });
        return true;
      }
      /* ---------------- 第八十四批：图鉴详情卡「同家族跳转」开关 ---------------- */
      if (msg.type === MSG.DEX_JUMP || msg.type === 'pcg-dex-jump') {
        if (!window.PCG_DEX_JUMP) {
          reply({ ok: false, text: '图鉴跳转模块没加载，刷新一次游戏页' });
          return true;
        }
        var dj = window.PCG_DEX_JUMP.set(msg.on !== false);
        reply({ ok: true, jump: dj });
        return true;
      }
      /* ---------------- 第三批：培育屋监测（只读 + 可选自动收蛋） ---------------- */
      if (msg.type === MSG.NURSERY_CONFIG || msg.type === 'pcg-nursery-config') {
        if (!window.PCG_NURSERY) { reply({ ok: false, text: '培育屋模块没加载，刷新一次游戏页' }); return true; }
        reply({ ok: true, cfg: window.PCG_NURSERY.config(msg.cfg || {}), state: window.PCG_NURSERY.state() });
        return true;
      }
      if (msg.type === MSG.NURSERY_REFRESH || msg.type === 'pcg-nursery-refresh') {
        if (!window.PCG_NURSERY) { reply({ ok: false, text: '培育屋模块没加载' }); return true; }
        reply(window.PCG_NURSERY.refresh());
        return true;
      }
      if (msg.type === MSG.NURSERY_CLEAR || msg.type === 'pcg-nursery-clear') {
        if (!window.PCG_NURSERY) { reply({ ok: false, text: '培育屋模块没加载' }); return true; }
        reply(window.PCG_NURSERY.clear());
        return true;
      }
      /* ---------------- 第四批：黑市扫货（意向表 + 自动购买） ---------------- */
      if (msg.type === MSG.MARKET_SCAN || msg.type === 'pcg-market-scan') {
        if (!window.PCG_MARKET) { reply({ ok: false, text: '黑市模块没加载，刷新一次游戏页' }); return true; }
        window.PCG_MARKET.scan(true).then(function (r) { reply(r); }, function (e) { reply(marketFail(e)); });
        return true;
      }
      if (msg.type === MSG.MARKET_START || msg.type === 'pcg-market-start') {
        if (!window.PCG_MARKET) { reply({ ok: false, text: '黑市模块没加载，刷新一次游戏页' }); return true; }
        marketStopOthers();
        reply(window.PCG_MARKET.start(msg.cfg || {}));
        return true;
      }
      if (msg.type === MSG.MARKET_STOP || msg.type === 'pcg-market-stop') {
        reply(window.PCG_MARKET ? window.PCG_MARKET.stop() : { ok: false, text: '黑市模块没加载' });
        return true;
      }
      if (msg.type === MSG.MARKET_CONFIG || msg.type === 'pcg-market-config') {
        if (!window.PCG_MARKET) { reply({ ok: false, text: '黑市模块没加载' }); return true; }
        reply({ ok: true, cfg: window.PCG_MARKET.config(msg.cfg || {}), state: window.PCG_MARKET.state() });
        return true;
      }
      if (msg.type === MSG.MARKET_RULES || msg.type === 'pcg-market-rules') {
        if (!window.PCG_MARKET) { reply({ ok: false, text: '黑市模块没加载' }); return true; }
        reply(window.PCG_MARKET.rules(msg.op || 'add', msg.payload || msg.rule || {}));
        return true;
      }
      if (msg.type === MSG.MARKET_CLEAR || msg.type === 'pcg-market-clear') {
        if (!window.PCG_MARKET) { reply({ ok: false, text: '黑市模块没加载' }); return true; }
        reply(window.PCG_MARKET.clear());
        return true;
      }
      /* ---------------- 第五批：闪光战斗守卫 ---------------- */
      if (msg.type === MSG.SHINY_CONFIG || msg.type === 'pcg-shiny-config') {
        if (!window.PCG_SHINY_GUARD) { reply({ ok: false, text: '闪光守卫没加载，刷新一次游戏页' }); return true; }
        reply({ ok: true, cfg: window.PCG_SHINY_GUARD.config(msg.cfg || {}),
          state: window.PCG_SHINY_GUARD.state() });
        return true;
      }
      if (msg.type === MSG.SHINY_CLEAR || msg.type === 'pcg-shiny-clear') {
        reply(window.PCG_SHINY_GUARD ? window.PCG_SHINY_GUARD.clear() : { ok: false, text: '闪光守卫没加载' });
        return true;
      }
      /* ---------------- 第五批：道具刷取 / 树果刷取 ----------------
       * 两个模块由 farm-engine.create(SPEC) 生成，API 完全同构，用一张表接完。 */
      var farmMsg = [
        ['ITEM_SCAN', 'PCG_ITEMS', 'item', 'scan'],
        ['ITEM_START', 'PCG_ITEMS', 'item', 'start'],
        ['ITEM_STOP', 'PCG_ITEMS', 'item', 'stop'],
        ['ITEM_CONFIG', 'PCG_ITEMS', 'item', 'config'],
        ['ITEM_CLEAR', 'PCG_ITEMS', 'item', 'clear'],
        ['BERRY_SCAN', 'PCG_BERRIES', 'berry', 'scan'],
        ['BERRY_START', 'PCG_BERRIES', 'berry', 'start'],
        ['BERRY_STOP', 'PCG_BERRIES', 'berry', 'stop'],
        ['BERRY_CONFIG', 'PCG_BERRIES', 'berry', 'config'],
        ['BERRY_CLEAR', 'PCG_BERRIES', 'berry', 'clear']
      ];
      for (var fi = 0; fi < farmMsg.length; fi++) {
        var fm = farmMsg[fi];
        if (msg.type !== MSG[fm[0]] && msg.type !== String(MSG[fm[0]])) continue;
        var mod = window[fm[1]];
        if (!mod) { reply({ ok: false, text: '刷取模块没加载，刷新一次游戏页' }); return true; }
        if (fm[3] === 'start') {
          farmStopOthers(fm[2]);
          reply(mod.start(msg.cfg || {}));
        } else if (fm[3] === 'config') {
          reply({ ok: true, cfg: mod.config(msg.cfg || {}), state: mod.state() });
        } else if (fm[3] === 'scan') {
          reply(mod.scan());
        } else {
          reply(mod[fm[3]]());
        }
        return true;
      }
    });
  } catch (e) { /* ignore */ }

  try {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (CFG_BOOTING) return;   /* 第一百二十批：启动判定完成前绝不覆盖页面本地备份 */
      if (area !== 'sync' && area !== 'local') return;
      var next = Object.assign({}, settings);
      var changed = false;
      Object.keys(changes).forEach(function (k) {
        if (k in DEFAULT_SETTINGS) {
          next[k] = changes[k].newValue;
          changed = true;
        } else if (k === 'feedItems') {
          next.feedItems = Object.assign({}, changes[k].newValue || {});
          changed = true;
        }
      });
      if (changed) {
        settings = Object.assign({}, DEFAULT_SETTINGS, next);
        applySettings();
        cfgBackupWrite();   /* 第一百一十九批：跨设备同步 / 页面改设置也同步备份到本地 */
      }
    });
  } catch (e) { /* ignore */ }

  /* 第八批：「页面自动化」里的闪光守卫 / 图鉴筛选两条开关是唯一数据源。
   * 每次应用设置（页面启动、popup 改开关、跨设备同步）都把状态推给两个模块，
   * 否则它们各自的本地缓存会把开关状态盖回去。 */
  function syncAutoToggles() {
    var wantGuard = settings.shinyGuardOn !== false;
    var wantDex = settings.dexFilterOn !== false;
    var wantJump = settings.dexJumpOn !== false;
    try {
      var g = window.PCG_SHINY_GUARD;
      if (g && typeof g.state === 'function' && typeof g.config === 'function') {
        if (!!(g.state() || {}).enabled !== wantGuard) g.config({ enabled: wantGuard });
      }
    } catch (e) { /* 模块还没加载，等启动兜底 */ }
    try {
      var f = window.PCG_DEX_FILTER;
      if (f && typeof f.state === 'function' && typeof f.set === 'function') {
        if (!!(f.state() || {}).on !== wantDex) f.set(wantDex);
      }
    } catch (e) { /* 模块还没加载，等启动兜底 */ }
    try {
      var j = window.PCG_DEX_JUMP;
      if (j && typeof j.state === 'function' && typeof j.set === 'function') {
        if (!!(j.state() || {}).on !== wantJump) j.set(wantJump);
      }
    } catch (e) { /* 模块还没加载，等启动兜底 */ }
  }

  /* ==================== 第一百一十九批：配置本地持久化 ====================
   * 症状：以前每次更新插件（重新解压 / 换目录）都要把所有开关重新设置一遍。
   * 根因：manifest 没写固定 key，unpacked 扩展的 ID 由「解压路径」决定，路径一变
   *       chrome.storage 就换了一片全新的命名空间，看起来像「设置被清空」。
   * 三层修复：
   *   ① manifest 固定 key → 扩展 ID 与解压路径无关（根治）；
   *   ② 全量设置双写到「游戏页面」的 localStorage：页面的 origin 是游戏站点，
   *      跟扩展 ID 完全无关，插件怎么更新都还在（原来只有收藏表这么做）；
   *   ③ 存储读出来是空的（换了 ID / 清了站点数据）时，自动从页面本地备份恢复。
   * 弹窗里另有「导出 / 导入 / 从本地备份恢复」三个手动入口。 */
  /* 第一百二十批：启动屏障。SYNC.get 回来并完成「空配置 → 本地备份恢复」之前，
   * 不许任何地方把默认值 / 迁移值写回存储，更不许写页面本地备份 ——
   * 否则「空配置」信号被冲掉、旧备份被默认值覆盖，重装后设置就永远丢。 */
  var CFG_BOOTING = true;
  /* 迁移会写进存储、但不代表玩家设置过的键：用来识别「被默认值污染的空配置」 */
  var CFG_MIGRATION_KEYS = {
    autoModal: 1, cfgV: 1, dexAutoFeed: 1, legAutoFeed: 1, feedItems: 1,
    ugCheckSec: 1, ugSecV: 1, dexHud: 1, legHud: 1, farmHud: 1,
    orbHud: 1, hudV: 1
  };
  function cfgOnlyMigrations(v) {
    var ks = Object.keys(v || {});
    for (var i = 0; i < ks.length; i++) if (!CFG_MIGRATION_KEYS[ks[i]]) return false;
    return true;
  }
  var CFG_LS = 'pcgSettingsBackupV1';
  /* 这些是「任务正在跑」的瞬时标记，不写进备份，免得恢复后自动把任务拉起来 */
  var CFG_SKIP = {
    legArmed: 1, orbArmed: 1, ugArmed: 1, autoFarm: 1, autoRaid: 1,
    autoUnderground: 1, ugDoneDay: 1
  };
  function cfgBackupRead() {
    var raw = '';
    try { raw = localStorage.getItem(CFG_LS) || ''; } catch (e) { return null; }
    if (!raw) return null;
    try {
      var o = JSON.parse(raw);
      return (o && o.cfg && typeof o.cfg === 'object' && !Array.isArray(o.cfg)) ? o : null;
    } catch (e2) { return null; }
  }
  function cfgBackupAt() {
    var b = cfgBackupRead();
    return b ? (Number(b.at) || 0) : 0;
  }
  function cfgBackupWrite() {
    if (CFG_BOOTING) return;   /* 第一百二十批：启动未完成，别把默认值写进本地备份 */
    var cfg = {};
    try {
      Object.keys(settings || {}).forEach(function (k) {
        if (CFG_SKIP[k]) return;
        cfg[k] = settings[k];
      });
      cfg.feedItems = Object.assign({}, settings.feedItems || {});
      localStorage.setItem(CFG_LS, JSON.stringify({ v: 1, at: Date.now(), cfg: cfg }));
    } catch (e) { /* 隐私模式 / 存储满了也不影响插件本身 */ }
  }
  function cfgRestoreFromBackup() {
    var b = cfgBackupRead();
    if (!b) return null;
    var cfg = {};
    Object.keys(b.cfg || {}).forEach(function (k) {
      if (CFG_SKIP[k]) return;
      cfg[k] = b.cfg[k];
    });
    return cfg;
  }

  function applySettings() {
    /* 第一百零八批：「沉浸通关模式」按玩家要求默认关。cfgV 4 一次性迁移：
     * 老存档里第 100 批强制打开的 autoModal 统一关掉一次，之后玩家自己打开不再被改回去。
     * 迁移放在 syncAutoToggles() 之前，保证这一拍推给模块的就是关掉后的值。 */
    if (!(Number(settings.cfgV) >= 4)) {
      settings.autoModal = false;
      settings.cfgV = 4;
      if (!CFG_BOOTING) { try { SYNC.set({ autoModal: false, cfgV: 4 }); } catch (e) { /* ignore */ } }
      log('「沉浸通关模式」已默认关闭：想让卡画面的框自动走完，去面板里手动打开');
    }
    /* 第一百一十八批：吃树果相关自动化全部默认关。cfgV 5 一次性迁移：
     * 老版本把 dexAutoFeed 强写成 true、并勾好了 razz/enigma 两种果子，
     * 升级后统一清一次；之后完全听玩家在面板上点的开关，不再被改回去。
     * 第一百一十九批：总闸 autoFeed 已删除，迁移里不再写这个键。 */
    if (!(Number(settings.cfgV) >= 5)) {
      settings.dexAutoFeed = false;
      settings.legAutoFeed = false;
      settings.feedItems = {};
      settings.cfgV = 5;
      if (!CFG_BOOTING) {
        try {
          SYNC.set({
            dexAutoFeed: false, legAutoFeed: false,
            feedItems: {}, cfgV: 5
          });
        } catch (e118) { /* ignore */ }
      }
      log('自动喂食已默认关闭：需要时到「自动喂食」卡片勾要喂的果实');
    }
    syncAutoToggles();

    // 传说追踪和异色团体战互斥：后打开的那个赢，另一个自动关
    var raidOn = !!settings.autoRaid;
    var legOn = !!settings.legendaryId && !!settings.legArmed;   // 只是选中不算，点了「立即前往」才算
    if (legOn && raidOn) {
      if (!lastLegendId) {
        settings.autoRaid = false;
        RAID.wasOn = false;
        try { SYNC.set({ autoRaid: false }); } catch (e) { /* ignore */ }
        log('开了传说追踪 → 异色团体战自动关掉（两个都要占冒险页）');
        raidOn = false;
      } else if (!lastAutoRaid) {
        settings.legendaryId = '';
        try { SYNC.set({ legendaryId: '' }); } catch (e) { /* ignore */ }
        log('开了异色团体战 → 传说追踪自动停掉（两个都要占冒险页）');
        legOn = false;
      } else {
        // 两个都是老状态里就开着：以传说追踪为准
        settings.autoRaid = false;
        RAID.wasOn = false;
        try { SYNC.set({ autoRaid: false }); } catch (e) { /* ignore */ }
        log('传说追踪和异色团体战同时开着，先关掉异色团体战');
        raidOn = false;
      }
    }
    lastAutoRaid = raidOn;
    lastLegendId = legOn;

    // 刷钱要一直占着冒险页 / 地图页，和传说追踪、异色团体战互斥（后打开的那个赢）
    if (settings.autoFarm && (raidOn || legOn)) {
      settings.autoRaid = false;
      settings.legendaryId = '';
      settings.legArmed = false;
      RAID.wasOn = false;
      lastAutoRaid = false;
      lastLegendId = false;
      try { SYNC.set({ autoRaid: false, legendaryId: '', legArmed: false }); } catch (e) { /* ignore */ }
      log('开了联盟刷钱 → 传说追踪 / 异色团体战自动停掉（都要占冒险页）');
    }
    if (settings.farmMode !== 'cleared') settings.farmMode = 'uncleared';

    // 默认的「检查间隔」搬过一次（60 → 300 → 600 秒）；玩家自己填过的不再动
    if (!(Number(settings.ugSecV) >= 3)) {
      var sec2 = Number(settings.ugCheckSec);
      if (!sec2 || sec2 === 60 || sec2 === 300) settings.ugCheckSec = 600;
      settings.ugSecV = 3;
      try { SYNC.set({ ugCheckSec: settings.ugCheckSec, ugSecV: 3 }); } catch (e) { /* ignore */ }
      log('地下通道：检查间隔默认改成 ' + Math.round(settings.ugCheckSec / 60) + ' 分钟（面板里可改）');
    }

    /* 第一百一十九批：已删除「自动喂食总开关」，这里也不再把任何喂食
     * 开关强行拉回 true —— 玩家没勾果实就一律不喂树果。 */

    // 今天的探险次数用完了：到刷新前不让开
    var ugDay = raidDayId();
    if (settings.ugDoneDay && ugDay && settings.ugDoneDay === ugDay) {
      UG.doneDay = ugDay;
      if (settings.autoUnderground || settings.ugArmed) {
        settings.autoUnderground = false;
        settings.ugArmed = false;
        UG.armed = false;
        UG.why = '今天的探险次数用完了，等刷新后再开';
        try { SYNC.set({ autoUnderground: false, ugArmed: false }); } catch (e) { /* ignore */ }
        log('地下通道：今天的次数已经用完，开关先关着，等刷新');
      }
    } else if (UG.doneDay && ugDay && UG.doneDay !== ugDay) {
      UG.doneDay = '';
      settings.ugDoneDay = '';
      try { SYNC.set({ ugDoneDay: '' }); } catch (e) { /* ignore */ }
      log('地下通道：换天了，次数刷新，可以重新开');
    }

    // 网页重载（游戏要求更新 / 自动刷新）以后，把之前开着的功能重新武装起来
    if (settings.autoUnderground && settings.ugArmed && !UG.armed) {
      UG.armed = true;
      log('地下通道：页面重载后自动恢复');
    }
    if (!settings.autoUnderground && (settings.ugArmed || UG.armed)) {
      UG.armed = false;
      settings.ugArmed = false;
      try { SYNC.set({ ugArmed: false }); } catch (e) { /* ignore */ }
    }

    if (settings.keepAlive) startKeepAlive(); else stopKeepAlive();
    sendToPage('spoof:' + (settings.keepVisible ? '1' : '0'));
    if (typeof lastKeepVisible === 'boolean' && lastKeepVisible !== !!settings.keepVisible) {
      log(settings.keepVisible ? '最小化保持在线：已开启' : '最小化保持在线：已关闭');
    }
    lastKeepVisible = !!settings.keepVisible;

    // 图鉴捕捉正在跑时，玩家又打开刷钱 / 神兽追踪 / 团体战连战：后开的赢，
    // 自动把图鉴捕捉停掉，免得两个自动化抢冒险页。
    if (window.PCG_DEX && window.PCG_DEX.state().running && dexOthersOn()) {
      window.PCG_DEX.stop('开了别的冒险页自动化，图鉴捕捉先停');
    }
    // 玩家又打开刷钱 / 神兽 / 团体战时，两个刷取同样按「后开的赢」让路
    if ((itemsOn() || berriesOn()) && farmOthersOn()) {
      if (itemsOn()) window.PCG_ITEMS.stop('开了别的冒险页自动化，道具刷取先停');
      if (berriesOn()) window.PCG_BERRIES.stop('开了别的冒险页自动化，树果刷取先停');
    }
    notifyBackground(true);
  }

  var lastKeepVisible = null;
  var lastAutoRaid = false;
  var lastLegendId = false;

  /* ---------------- 启动 ---------------- */
  var STORAGE_DEFAULTS = Object.assign({ feedItems: {} }, DEFAULT_SETTINGS);

  // 主题变了（popup 里手动切换 / 系统明暗切换）时，游戏页里的伤害统计面板一起换色
  try {
    if (window.PCG_THEME && window.PCG_THEME.onChange) {
      window.PCG_THEME.onChange(function () {
        try {
          if (DMG.host && window.PCG_THEME) window.PCG_THEME.applyHost(DMG.host);
        } catch (e) { /* ignore */ }
        /* 第二十五批：悬浮看板也跟着换色（下一轮 hudTick 用新配色重画） */
        hudAt = 0;
      });
    }
  } catch (e) { /* ignore */ }

  if (!CFG) log('出错：defaults.js 没有注入，检查 manifest 的脚本顺序');

  applySettings();   // 先用默认值把守护跑起来，读不到存储也不至于什么都不做
  try {
    // 注意：这里要看「存储里真实的值」，不能拿合并了默认值的对象来判断，
    // 否则 DEFAULT_SETTINGS 里的 ugSecV 会让迁移永远以为自己已经跑过了。
    SYNC.get(null, function (raw) {
      var v = raw || {};
      /* 第一百二十批：存储为空，或只剩迁移默认值（弹窗 / 旧版迁移抢先写过）
       * 都算「这次是重装」，一律从游戏页 localStorage 的全量备份恢复。
       * 旧版只判「完全为空」，弹窗 getSettings() 的迁移会先把默认值写进去，
       * 于是恢复分支永远不成立 —— 这就是「移除插件重装后设置没继承」的根因。 */
      var bk = cfgRestoreFromBackup();
      if ((!Object.keys(v).length || cfgOnlyMigrations(v)) && bk && Object.keys(bk).length) {
        v = Object.assign({}, bk);
        try { SYNC.set(v, function () { void chrome.runtime.lastError; }); } catch (eBk) { /* ignore */ }
        log('检测到插件更新后的空配置：已从本地备份恢复上次的设置');
      } else if (!Object.keys(v).length && (!bk || !Object.keys(bk).length)) {
        log('还没有本地配置备份：设置一次开关后就会自动备份，之后更新 / 重装不用再设');
      }
      var fixed = ugSecMigrate(v);
      settings = Object.assign({}, STORAGE_DEFAULTS, v);
      settings.feedItems = Object.assign({}, settings.feedItems || {});
      /* 第一百二十批：启动判定完成，解除屏障。这一行必须在恢复判定之后，
       * 否则默认值会把页面里那份旧备份覆盖掉，连手动恢复都救不回来。 */
      CFG_BOOTING = false;
      cfgBackupWrite();
      /* 第五十五批：六张任务卡的看板曾改成默认关。
       * 第六十三批：改回默认开，老存档（hudV < 3）只搬一次。 */
      if (!(Number(v.hudV) >= 3)) {
        settings.dexHud = true;
        settings.legHud = true;
        settings.farmHud = true;
        settings.orbHud = true;
        settings.hudV = 3;
        try {
          SYNC.set({
            dexHud: true, legHud: true, farmHud: true, orbHud: true, hudV: 3
          });
        } catch (e55) { /* ignore */ }
      }
      if (fixed) {
        settings.ugCheckSec = fixed;
        try { SYNC.set({ ugCheckSec: fixed, ugSecV: 3 }); } catch (e2) { /* ignore */ }
      }
      /* 第二十五批：页面自动化里「刷新页面后功能继续」是总开关。
       * 关着的时候，这一次页面加载不自动武装任何任务——把上次留在存储里的
       * 运行标记清掉，等玩家自己再点开始。 */
      if (v.resumeOn === false &&
          (v.autoFarm || v.autoRaid || v.autoUnderground || v.ugArmed || v.legArmed)) {
        settings.autoFarm = false;
        settings.autoRaid = false;
        settings.autoUnderground = false;
        settings.ugArmed = false;
        settings.legArmed = false;
        try {
          SYNC.set({
            autoFarm: false, autoRaid: false, autoUnderground: false,
            legArmed: false, ugArmed: false
          });
        } catch (e3) { /* ignore */ }
        log('「刷新页面后功能继续」是关着的：这次页面加载不自动接着跑');
      }
      applySettings();
      // 两个模块启动时也会异步回读自己的本地缓存，延迟再对一次，别把开关盖回去
      setTimeout(syncAutoToggles, 1600);
    });
  } catch (e) { /* 用默认值 */ }

  favInit();

  // 配队窗（#evt-pick，活动队伍 / 对战塔 / 团体战 / 世界BOSS / 糖果工厂 / 地下通道共用）：
  // 上面「6 张队伍卡 + 最常选用」两栏就吃掉大半屏，仓库只剩两行。
  // 而弹窗自己 .evt-pick{overflow:auto}、两栏又各自 overflow:auto，右边挂着两三根
  // 滚动条。这里把弹窗定高、两栏压紧到不用滚，所有滚动条一律藏掉，
  // 只留仓库网格当唯一的滚动区（滚轮 / 拖动照常），剩下的高度全给它。
  (function easyPickCss() {
    if (document.getElementById('pcg-evt-css')) return;
    var css = [
      // 弹窗定高，自己绝不滚
      '#evt-pick > .evt-pick{height:calc(100vh - 20px)!important;max-height:calc(100vh - 20px)!important;box-sizing:border-box!important;overflow:hidden!important;gap:6px!important;padding:10px!important}',
      '#evt-pick > .evt-pick > .evt-head{flex:0 0 auto!important;gap:6px!important;max-height:46vh!important;overflow:auto!important;overscroll-behavior:contain!important;scrollbar-width:none!important}',
      '#evt-pick > .evt-pick > .evt-head::-webkit-scrollbar{width:0!important;height:0!important}',
      '#evt-pick .evt-head .map-head{padding:4px 10px!important;min-height:0!important}',
      '#evt-pick .evt-head .map-head h2{font-size:15px!important}',
      '#evt-pick .evt-head .team-slots{gap:6px!important;padding:6px!important}',
      '#evt-pick .evt-head .team-slots .slot{min-height:0!important;height:104px!important;padding:4px 4px 2px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-end!important}',
      '#evt-pick .evt-head .team-slots .slot.empty{justify-content:center!important;gap:2px!important}',
      '#evt-pick .evt-head .team-slots .slot .w{zoom:1!important;position:relative!important;flex:1 1 auto!important;min-height:0!important;width:100%!important;margin-top:0!important}',
      '#evt-pick .evt-head .team-slots .slot .sprbox{position:absolute!important;inset:0!important;height:auto!important;width:100%!important;display:flex!important;align-items:flex-end!important;justify-content:center!important}',
      '#evt-pick .evt-head .team-slots .slot .sprbox img{height:100%!important;width:auto!important;max-width:100%!important;object-fit:contain!important;image-rendering:pixelated}',
      '#evt-pick .evt-head .team-slots .slot .name{font-size:12px!important;line-height:1.2!important;margin:1px 0 0!important;max-width:100%!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      '#evt-pick .evt-head .team-slots .slot .lv{font-size:10px!important;line-height:1.1!important}',
      '#evt-pick .evt-head .team-slots .slot .xpbar{display:none!important}',
      '#evt-pick .evt-head .team-slots .slot .slot-types{top:3px!important;left:3px!important;gap:2px!important;transform:scale(.78)!important;transform-origin:0 0!important}',
      '#evt-pick .evt-head .team-slots .slot .pcg-slot-row{display:flex!important;align-items:center!important;justify-content:center!important;gap:4px!important;width:100%!important;min-height:18px!important;margin-top:0!important;line-height:1.1!important}',
      '#evt-pick .evt-head .team-slots .slot .pcg-slot-row .pcg-star{position:static!important;left:auto!important;right:auto!important;top:auto!important;flex:0 0 auto!important;margin:0!important;width:18px!important;height:18px!important;font-size:11px!important}',
      '#evt-pick .evt-head .team-slots .slot .pcg-slot-row .name{display:block!important;font-size:12px!important;line-height:1.2!important;margin:0!important;max-width:calc(100% - 24px)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      // 最常选用：一条小横排就够，别占掉仓库的地方
      '#evt-pick .evt-head .rp-side{padding:4px 8px!important}',
      '#evt-pick .evt-head .rp-side h4{font-size:11px!important;margin:0 0 2px!important;line-height:1.2!important}',
      '#evt-pick .evt-head .rp-pks{gap:4px!important}',
      '#evt-pick .evt-head .rp-pks .rp-pk{padding:2px!important;gap:0!important}',
      // 用 zoom 整体等比缩放（精灵是内联尺寸 + translate，只改 --m 会把它裁成一条）
      '#evt-pick .evt-head .rp-pks .fr-mon{zoom:.6!important}',
      '#evt-pick .evt-head .rp-pks .rp-pk .mine{display:none!important}',
      '#evt-pick .evt-head .rp-pks .rp-pk small{font-size:10px!important;line-height:1.1!important}',
      // 仓库网格：唯一滚动区
      '#evt-pick #evt-pc{flex:1 1 0!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important;overscroll-behavior:contain!important;scrollbar-width:none!important}',
      '#evt-pick #evt-pc::-webkit-scrollbar{width:0!important;height:0!important;display:none!important}',
      // 底栏与提示别被压成两行
      '#evt-pick > .evt-pick > .evt-foot{flex:0 0 auto!important;font-size:var(--fs-caption)!important}',
      '#evt-pick > .evt-pick > .evt-hint{flex:0 0 auto!important;margin:0!important;font-size:var(--fs-caption)!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'pcg-evt-css';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  })();

  /* 第二批：把页面租约和「其它自动化在不在跑」借给先注入的 dex-hunter.js。
   * 桥在运行时才被取用，所以本文件初始化末尾再挂载完全来得及。 */
  /* 第七十五批：页面租约桥。培育屋监测（nursery-monitor.js，独立 IIFE）和定点循环
   * （orb.js，独立 script）都从这里借「谁在切页」这套仲裁：
   *   · 培育屋用 hold('nursery') / want('nursery') / free('nursery') 占页面；
   *   · 六个自动化用 busy(me) / who(me) 判断该不该停手。
   * 两边的优先级由 content.js 里的 SCREEN_PRIO 定，培育屋 / 地下通道是 2。 */
  window.PCG_SCREEN_HOST = {
    want: function (me, ms) { screenWant(me || 'nursery', ms); },
    hold: function (me, ms) { return screenHold(me || 'nursery', ms); },
    free: function (me) { screenFree(me || 'nursery'); },
    busy: function (me) { return screenBusy(me); },
    who: function (me) { return screenWho(me); }
  };

  window.PCG_DEX_HOST = {
    hold: function (ms) { return screenHold('dex', ms || 25000); },
    free: function () { screenFree('dex'); },
    /* 第七十五批：培育屋监测在培育屋页取蛋 / 地下通道在领奖派遣，六个自动化一律让路 */
    busy: function () { return !!(UG.busy || LEG.busy || RAID.busy || FARM.busy || nurseryBusy()); },
    screenBusy: function () { return screenBusy('dex'); },
    who: function () { return screenWho('dex'); },
    otherAuto: function () { return dexOthersOn(); }
  };

  /* 第四批：黑市扫货用同一套页面租约；额外借两个信号：
   * otherAuto 让它在刷钱 / 神兽 / 团体战 / 图鉴捕捉运行时主动让路，
   * idle 让它不在玩家刚操作过时把页面从冒险页拽走。 */
  /* 第五批：道具 / 树果刷取共用一套页面租约。owner 统一叫 farm，
   * 两个模块之间靠「后开的赢」互斥，不靠租约，避免自己把自己卡死。 */
  window.PCG_FARM_HOST = {
    hold: function (ms) { return screenHold('farm', ms || 30000); },
    free: function () { screenFree('farm'); },
    busy: function () { return !!(UG.busy || LEG.busy || RAID.busy || FARM.busy || nurseryBusy()); },
    screenBusy: function () { return screenBusy('farm'); },
    who: function () { return screenWho('farm'); },
    otherAuto: function () { return farmOthersOn(); }
  };

  window.PCG_MARKET_HOST = {
    hold: function (ms) { return screenHold('market', ms || 30000); },
    free: function () { screenFree('market'); },
    /* 第三十批：黑市只给地下通道让路（它比黑市更优先），别的任务不再拦它；
     * want / done 是「我要切页了」的喊话口，见上面的 MARKET_WANT。 */
    want: function (ms) { MARKET_WANT = Date.now() + (ms || 15000); },
    done: function () { MARKET_WANT = 0; },
    busy: function () { return !!(UG.busy || nurseryBusy()); },
    screenBusy: function () { return screenBusy('market'); },
    who: function () { return screenWho('market'); },
    otherAuto: function () { return marketOthersOn(); },
    idle: function (ms) { return Date.now() - (S.lastRealInputAt || 0) >= (ms || 0); }
  };

  setInterval(tick, 1000);
  setTimeout(tick, 200);
  setInterval(function () {
    try { legWatch(); } catch (e) { /* ignore */ }
  }, 400);
  // 飘字来得很快，用 400ms 的节奏盯着；同时兼管世界BOSS 结算面板
  setInterval(function () {
    try { dmgTick(Date.now()); } catch (e) { /* ignore */ }
  }, 400);

  // 战斗属性提示：不靠 1 秒一轮的 tick，换场瞬间也能立刻补上
  setInterval(function () {
    try { tbTick(Date.now()); } catch (e) { /* ignore */ }
  }, 400);

  // 收藏星 / 收藏筛选：切换页签、换筛选时立刻跟上
  setInterval(function () {
    try { favTick(Date.now()); } catch (e) { /* ignore */ }
  }, 400);
  // v1.47：一键进化确认弹窗的立绘缩略图（弹窗一闪而过，300ms 盯着）
  setInterval(function () {
    try { evoDialogTick(); } catch (e) { /* ignore */ }
  }, 300);
  // 4 个地区的异色：抽签动画和团体战页都是转瞬即逝，单独用 500ms 盯着记下来
  // 1.9.57 起面板又藏起来了，这段采样也一起停掉（RAID_PANEL 打开才跑）
  if (RAID_PANEL) {
    setInterval(function () {
      try { raidHarvest(); } catch (e) { /* ignore */ }
    }, 500);
  }
  setInterval(keepAliveTick, 10000);
  scheduleActivity();
  log('插件已启动');
})();
