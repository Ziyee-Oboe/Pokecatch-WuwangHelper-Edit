// ==UserScript==
// @name         Poke'Catch 闪光蛋预测面板
// @name:en     Poke'Catch Shiny Egg Forecast
// @namespace    pcg-egg-forecast
// @version      0.2.1
// @description  纯计算，零网络请求。读取游戏存档的 trainerSeed + pension.laid，用游戏同款 53 位确定性哈希预测未来每颗蛋是否闪光、roll 值、亲代抽取、多久后是闪。
// @match        *://pokecatch-online.netlify.app/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

/* ============================================================================
 * 纯计算核心 — 从原插件 nursery-monitor.js 原封不动搬来
 * 依赖：零。只用 localStorage 读游戏存档。
 * ==========================================================================*/

(function () {
'use strict';

/* ---------- 中文名表（从 stab.js D.nm 自动提取，v1.49，649 只） ---------- */
var NAMES = {"1":"妙蛙种子","2":"妙蛙草","3":"妙蛙花","4":"小火龙","5":"火恐龙","6":"喷火龙","7":"杰尼龟","8":"卡咪龟","9":"水箭龟","10":"绿毛虫","11":"铁甲蛹","12":"巴大蝶","13":"独角虫","14":"铁壳蛹","15":"大针蜂","16":"波波","17":"比比鸟","18":"大比鸟","19":"小拉达","20":"拉达","21":"烈雀","22":"大嘴雀","23":"阿柏蛇","24":"阿柏怪","25":"皮卡丘","26":"雷丘","27":"穿山鼠","28":"穿山王","29":"尼多兰","30":"尼多娜","31":"尼多后","32":"尼多朗","33":"尼多力诺","34":"尼多王","35":"皮皮","36":"皮可西","37":"六尾","38":"九尾","39":"胖丁","40":"胖可丁","41":"超音蝠","42":"大嘴蝠","43":"走路草","44":"臭臭花","45":"霸王花","46":"派拉斯","47":"派拉斯特","48":"毛球","49":"摩鲁蛾","50":"地鼠","51":"三地鼠","52":"喵喵","53":"猫老大","54":"可达鸭","55":"哥达鸭","56":"猴怪","57":"火暴猴","58":"卡蒂狗","59":"风速狗","60":"蚊香蝌蚪","61":"蚊香君","62":"蚊香泳士","63":"凯西","64":"勇基拉","65":"胡地","66":"腕力","67":"豪力","68":"怪力","69":"喇叭芽","70":"口呆花","71":"大食花","72":"玛瑙水母","73":"毒刺水母","74":"小拳石","75":"隆隆石","76":"隆隆岩","77":"小火马","78":"烈焰马","79":"呆呆兽","80":"呆壳兽","81":"小磁怪","82":"三合一磁怪","83":"大葱鸭","84":"嘟嘟","85":"嘟嘟利","86":"小海狮","87":"白海狮","88":"臭泥","89":"臭臭泥","90":"大舌贝","91":"刺甲贝","92":"鬼斯","93":"鬼斯通","94":"耿鬼","95":"大岩蛇","96":"催眠貘","97":"引梦貘人","98":"大钳蟹","99":"巨钳蟹","100":"霹雳电球","101":"顽皮雷弹","102":"蛋蛋","103":"椰蛋树","104":"卡拉卡拉","105":"嘎啦嘎啦","106":"飞腿郎","107":"快拳郎","108":"大舌头","109":"瓦斯弹","110":"双弹瓦斯","111":"独角犀牛","112":"钻角犀兽","113":"吉利蛋","114":"蔓藤怪","115":"袋兽","116":"墨海马","117":"海刺龙","118":"角金鱼","119":"金鱼王","120":"海星星","121":"宝石海星","122":"魔墙人偶","123":"飞天螳螂","124":"迷唇姐","125":"电击兽","126":"鸭嘴火兽","127":"凯罗斯","128":"肯泰罗","129":"鲤鱼王","130":"暴鲤龙","131":"拉普拉斯","132":"百变怪","133":"伊布","134":"水伊布","135":"雷伊布","136":"火伊布","137":"多边兽","138":"菊石兽","139":"多刺菊石兽","140":"化石盔","141":"镰刀盔","142":"化石翼龙","143":"卡比兽","144":"急冻鸟","145":"闪电鸟","146":"火焰鸟","147":"迷你龙","148":"哈克龙","149":"快龙","150":"超梦","151":"梦幻","152":"菊草叶","153":"月桂叶","154":"大竺葵","155":"火球鼠","156":"火岩鼠","157":"火暴兽","158":"小锯鳄","159":"蓝鳄","160":"大力鳄","161":"尾立","162":"大尾立","163":"咕咕","164":"猫头夜鹰","165":"芭瓢虫","166":"安瓢虫","167":"圆丝蛛","168":"阿利多斯","169":"叉字蝠","170":"灯笼鱼","171":"电灯怪","172":"皮丘","173":"皮宝宝","174":"宝宝丁","175":"波克比","176":"波克基古","177":"天然雀","178":"天然鸟","179":"咩利羊","180":"茸茸羊","181":"电龙","182":"美丽花","183":"玛力露","184":"玛力露丽","185":"树才怪","186":"蚊香蛙皇","187":"毽子草","188":"毽子花","189":"毽子棉","190":"长尾怪手","191":"向日种子","192":"向日花怪","193":"蜻蜻蜓","194":"乌波","195":"沼王","196":"太阳伊布","197":"月亮伊布","198":"黑暗鸦","199":"呆呆王","200":"梦妖","201":"未知图腾","202":"果然翁","203":"麒麟奇","204":"榛果球","205":"佛烈托斯","206":"土龙弟弟","207":"天蝎","208":"大钢蛇","209":"布鲁","210":"布鲁皇","211":"千针鱼","212":"巨钳螳螂","213":"壶壶","214":"赫拉克罗斯","215":"狃拉","216":"熊宝宝","217":"圈圈熊","218":"熔岩虫","219":"熔岩蜗牛","220":"小山猪","221":"长毛猪","222":"太阳珊瑚","223":"铁炮鱼","224":"章鱼桶","225":"信使鸟","226":"巨翅飞鱼","227":"盔甲鸟","228":"戴鲁比","229":"黑鲁加","230":"刺龙王","231":"小小象","232":"顿甲","233":"多边兽２型","234":"惊角鹿","235":"图图犬","236":"无畏小子","237":"战舞郎","238":"迷唇娃","239":"电击怪","240":"鸭嘴宝宝","241":"大奶罐","242":"幸福蛋","243":"雷公","244":"炎帝","245":"水君","246":"幼基拉斯","247":"沙基拉斯","248":"班基拉斯","249":"洛奇亚","250":"凤王","251":"时拉比","252":"木守宫","253":"森林蜥蜴","254":"蜥蜴王","255":"火稚鸡","256":"力壮鸡","257":"火焰鸡","258":"水跃鱼","259":"沼跃鱼","260":"巨沼怪","261":"土狼犬","262":"大狼犬","263":"蛇纹熊","264":"直冲熊","265":"刺尾虫","266":"甲壳茧","267":"狩猎凤蝶","268":"盾甲茧","269":"毒粉蛾","270":"莲叶童子","271":"莲帽小童","272":"乐天河童","273":"橡实果","274":"长鼻叶","275":"狡猾天狗","276":"傲骨燕","277":"大王燕","278":"长翅鸥","279":"大嘴鸥","280":"拉鲁拉丝","281":"奇鲁莉安","282":"沙奈朵","283":"溜溜糖球","284":"雨翅蛾","285":"蘑蘑菇","286":"斗笠菇","287":"懒人獭","288":"过动猿","289":"请假王","290":"土居忍士","291":"铁面忍者","292":"脱壳忍者","293":"咕妞妞","294":"吼爆弹","295":"爆音怪","296":"幕下力士","297":"铁掌力士","298":"露力丽","299":"朝北鼻","300":"向尾喵","301":"优雅猫","302":"勾魂眼","303":"大嘴娃","304":"可可多拉","305":"可多拉","306":"波士可多拉","307":"玛沙那","308":"恰雷姆","309":"落雷兽","310":"雷电兽","311":"正电拍拍","312":"負电拍拍","313":"电萤虫","314":"甜甜萤","315":"毒蔷薇","316":"溶食兽","317":"吞食兽","318":"利牙鱼","319":"巨牙鲨","320":"吼吼鲸","321":"吼鲸王","322":"呆火驼","323":"喷火驼","324":"煤炭龟","325":"跳跳猪","326":"噗噗猪","327":"晃晃斑","328":"大颚蚁","329":"超音波幼虫","330":"沙漠蜻蜓","331":"刺球仙人掌","332":"梦歌仙人掌","333":"青绵鸟","334":"七夕青鸟","335":"猫鼬斩","336":"饭匙蛇","337":"月石","338":"太阳岩","339":"泥泥鳅","340":"鲶鱼王","341":"龙虾小兵","342":"铁螯龙虾","343":"天秤偶","344":"念力土偶","345":"触手百合","346":"摇篮百合","347":"太古羽虫","348":"太古盔甲","349":"丑丑鱼","350":"美纳斯","351":"飘浮泡泡","352":"变隐龙","353":"怨影娃娃","354":"诅咒娃娃","355":"夜巡灵","356":"彷徨夜灵","357":"热带龙","358":"风铃铃","359":"阿勃梭鲁","360":"小果然","361":"雪童子","362":"冰鬼护","363":"海豹球","364":"海魔狮","365":"帝牙海狮","366":"珍珠贝","367":"猎斑鱼","368":"樱花鱼","369":"古空棘鱼","370":"爱心鱼","371":"宝贝龙","372":"甲壳龙","373":"暴飞龙","374":"铁哑铃","375":"金属怪","376":"巨金怪","377":"雷吉洛克","378":"雷吉艾斯","379":"雷吉斯奇鲁","380":"拉帝亚斯","381":"拉帝欧斯","382":"盖欧卡","383":"固拉多","384":"烈空坐","385":"基拉祈","386":"代欧奇希斯","387":"草苗龟","388":"树林龟","389":"土台龟","390":"小火焰猴","391":"猛火猴","392":"烈焰猴","393":"波加曼","394":"波皇子","395":"帝王拿波","396":"姆克儿","397":"姆克鸟","398":"姆克鹰","399":"大牙狸","400":"大尾狸","401":"圆法师","402":"音箱蟀","403":"小猫怪","404":"勒克猫","405":"伦琴猫","406":"含羞苞","407":"罗丝雷朵","408":"头盖龙","409":"战槌龙","410":"盾甲龙","411":"护城龙","412":"结草儿","413":"结草贵妇","414":"绅士蛾","415":"三蜜蜂","416":"蜂女王","417":"帕奇利兹","418":"泳圈鼬","419":"浮潜鼬","420":"樱花宝","421":"樱花儿","422":"无壳海兔","423":"海兔兽","424":"双尾怪手","425":"飘飘球","426":"随风球","427":"卷卷耳","428":"长耳兔","429":"梦妖魔","430":"乌鸦头头","431":"魅力喵","432":"东施喵","433":"铃铛响","434":"臭鼬噗","435":"坦克臭鼬","436":"铜镜怪","437":"青铜钟","438":"盆才怪","439":"魔尼尼","440":"小福蛋","441":"聒噪鸟","442":"花岩怪","443":"圆陆鲨","444":"尖牙陆鲨","445":"烈咬陆鲨","446":"小卡比兽","447":"利欧路","448":"路卡利欧","449":"沙河马","450":"河马兽","451":"钳尾蝎","452":"龙王蝎","453":"不良蛙","454":"毒骷蛙","455":"尖牙笼","456":"荧光鱼","457":"霓虹鱼","458":"小球飞鱼","459":"雪笠怪","460":"暴雪王","461":"玛狃拉","462":"自爆磁怪","463":"大舌舔","464":"超甲狂犀","465":"巨蔓藤","466":"电击魔兽","467":"鸭嘴炎兽","468":"波克基斯","469":"远古巨蜓","470":"叶伊布","471":"冰伊布","472":"天蝎王","473":"象牙猪","474":"多边兽乙型","475":"艾路雷朵","476":"大朝北鼻","477":"黑夜魔灵","478":"雪妖女","479":"洛托姆","480":"由克希","481":"艾姆利多","482":"亚克诺姆","483":"帝牙卢卡","484":"帕路奇亚","485":"席多蓝恩","486":"雷吉奇卡斯","487":"骑拉帝纳","488":"克雷色利亚","489":"霏欧纳","490":"玛纳霏","491":"达克莱伊","492":"谢米","493":"阿尔宙斯","494":"比克提尼","495":"藤藤蛇","496":"青藤蛇","497":"君主蛇","498":"暖暖猪","499":"炒炒猪","500":"炎武王","501":"水水獭","502":"双刃丸","503":"大剑鬼","504":"探探鼠","505":"步哨鼠","506":"小约克","507":"哈约克","508":"长毛狗","509":"扒手猫","510":"酷豹","511":"花椰猴","512":"花椰猿","513":"爆香猴","514":"爆香猿","515":"冷水猴","516":"冷水猿","517":"食梦梦","518":"梦梦蚀","519":"豆豆鸽","520":"咕咕鸽","521":"高傲雉鸡","522":"斑斑马","523":"雷电斑马","524":"石丸子","525":"地幔岩","526":"庞岩怪","527":"滚滚蝙蝠","528":"心蝙蝠","529":"螺钉地鼠","530":"龙头地鼠","531":"差不多娃娃","532":"搬运小匠","533":"铁骨土人","534":"修建老匠","535":"圆蝌蚪","536":"蓝蟾蜍","537":"蟾蜍王","538":"投摔鬼","539":"打击鬼","540":"虫宝包","541":"宝包茧","542":"保姆虫","543":"百足蜈蚣","544":"车轮球","545":"蜈蚣王","546":"木棉球","547":"风妖精","548":"百合根娃娃","549":"裙儿小姐","550":"野蛮鲈鱼","551":"黑眼鳄","552":"混混鳄","553":"流氓鳄","554":"火红不倒翁","555":"达摩狒狒","556":"沙铃仙人掌","557":"石居蟹","558":"岩殿居蟹","559":"滑滑小子","560":"头巾混混","561":"象征鸟","562":"哭哭面具","563":"迭失棺","564":"原盖海龟","565":"肋骨海龟","566":"始祖小鸟","567":"始祖大鸟","568":"破破袋","569":"灰尘山","570":"索罗亚","571":"索罗亚克","572":"泡沫栗鼠","573":"奇诺栗鼠","574":"哥德宝宝","575":"哥德小童","576":"哥德小姐","577":"单卵细胞球","578":"双卵细胞球","579":"人造细胞卵","580":"鸭宝宝","581":"舞天鹅","582":"迷你冰","583":"多多冰","584":"双倍多多冰","585":"四季鹿","586":"萌芽鹿","587":"电飞鼠","588":"盖盖虫","589":"骑士蜗牛","590":"哎呀球菇","591":"败露球菇","592":"轻飘飘","593":"胖嘟嘟","594":"保姆曼波","595":"电电虫","596":"电蜘蛛","597":"种子铁球","598":"坚果哑铃","599":"齿轮儿","600":"齿轮组","601":"齿轮怪","602":"麻麻小鱼","603":"麻麻鳗","604":"麻麻鳗鱼王","605":"小灰怪","606":"大宇怪","607":"烛光灵","608":"灯火幽灵","609":"水晶灯火灵","610":"牙牙","611":"斧牙龙","612":"双斧战龙","613":"喷嚏熊","614":"冻原熊","615":"几何雪花","616":"小嘴蜗","617":"敏捷虫","618":"泥巴鱼","619":"功夫鼬","620":"师父鼬","621":"赤面龙","622":"泥偶小人","623":"泥偶巨人","624":"驹刀小兵","625":"劈斩司令","626":"爆炸头水牛","627":"毛头小鹰","628":"勇士雄鹰","629":"秃鹰丫头","630":"秃鹰娜","631":"熔蚁兽","632":"铁蚁","633":"单首龙","634":"双首暴龙","635":"三首恶龙","636":"燃烧虫","637":"火神蛾","638":"勾帕路翁","639":"代拉基翁","640":"毕力吉翁","641":"龙卷云","642":"雷电云","643":"莱希拉姆","644":"捷克罗姆","645":"土地云","646":"酋雷姆","647":"凯路迪欧","648":"美洛耶塔","649":"盖诺赛克特"};

function dexName(id) {
  var n = Number(id);
  var zh = NAMES[n] || NAMES[String(n)] || '';
  return zh || ('#' + n);
}

/* ---------- 常量（与游戏 app.17255d8d2e.js 一致） ---------- */
var K = {
  DITTO: 132,
  HATCH_MS: 240 * 60000,          // 孵化时间 = 4h
  EGG_MS: 240 * 60000,            // 生蛋周期 = 4h
  SHINY_RATE: 1 / 512,
  SHINY_PARENT_RATE: 1 / 16,      // sp:2 新档，≈6.25%
  SHINY_PARENT_RATE_OLD: 0.1,     // sp:1 旧档，10%
  SHINY_BERRY_MULT: 2,            // bx 吃靛莓果 ×2
  NO_EGG: [137, 442, 479, 47901, 47902, 47903, 47904, 47905, 556]
};

/* ---------- 五种蛋分类样式表 ----------
 * 颜色设计思路：
 *   - 裸闪（2、4）用温暖金/橙色渐变，"天生闪光"感
 *   - 吃果闪（3、5）用冷色蓝/紫，"靛莓果魔力"感，附加 🫐 标记
 *   - 闪光亲代（4、5）颜色饱和度更高，因为亲代池里有闪更难得
 *   - 普通（1）用中性灰，不强调
 */
var CATEGORY = {
  1: { key: 'normal',        name: '普通',           barBg: null,    text: null,    badge: null,           berry: false,  shiny: false },
  2: { key: 'plain-shiny',   name: '普通闪',         barBg: null,    text: null,    badge: '✦ 普通闪',     berry: false,  shiny: false },
  3: { key: 'plain-berry',   name: '吃果普通闪',     barBg: null,    text: null,    badge: '✦ 吃果普通闪', berry: true,   shiny: false },
  4: { key: 'shiny-shiny',   name: '亲代闪',         barBg: null,    text: null,    badge: '✦ 亲代闪',     berry: false,  shiny: true  },
  5: { key: 'shiny-berry',   name: '吃果亲代闪',     barBg: null,    text: null,    badge: '✦ 吃果亲代闪', berry: true,   shiny: true  }
};

/* ---------- 工具 ---------- */
function fmtDur(ms) {
  if (!isFinite(ms) || ms <= 0) return '就绪';
  var m = Math.ceil(ms / 60000);
  if (m < 60) return m + ' 分';
  var h = Math.floor(m / 60), mm = m % 60;
  if (h < 24) return h + 'h' + (mm ? ' ' + mm + 'm' : '');
  return Math.floor(h / 24) + 'd ' + (h % 24) + 'h';
}

/* ---------- 哈希 — 与游戏 Us(s) 逐位一致，别动 ---------- */
function eggHash(str) {
  var S = 1779033703 ^ ((24348 << 16) | 41597);
  var C = 3144134277 ^ ((15337 << 16) | 49222);
  for (var i = 0; i < str.length; i++) {
    var t = str.charCodeAt(i);
    S = Math.imul(S ^ t, 2654435761);
    C = Math.imul(C ^ t, 1597334677);
  }
  S = Math.imul(S ^ (S >>> 16), 2246822507) ^ Math.imul(C ^ (C >>> 13), 3266489909);
  C = Math.imul(C ^ (C >>> 16), 2246822507) ^ Math.imul(S ^ (S >>> 13), 3266489909);
  return (4294967296 * (2097151 & C) + (S >>> 0)) / 9007199254740992;
}

/* ---------- 训练家种子 ---------- */
function trainerSeed(save) {
  var t = (save && save.trainer) || null;
  if (!t) return ':';
  return (t.since == null ? '' : t.since) + ':' + (t.id == null ? '' : t.id);
}

/* ---------- 蛋 k 的 roll ---------- */
function eggKHash(k, save) {
  return eggHash(trainerSeed(save) + '|egg|' + k + '|0');
}

/* ============================================================================
 * nextShinyInfo — 核心预测函数，原封不动从 nursery-monitor.js 搬来
 * ==========================================================================*/
function nextShinyInfo(save) {
  try {
    var pen = save && save.pension;
    if (!pen) return null;
    var laid = Number.isFinite(pen.laid)
      ? pen.laid
      : ((+save.stats && +save.stats.hatched || 0) + (Array.isArray(pen.eggs) ? pen.eggs.length : 0));
    var goal = Number(pen.eggGoal) || 0;
    var bxNext = !!pen.bx;
    var base = K.SHINY_RATE;
    var parentRate = 1 / 16;
    var mult = 2;

    var pool = [];
    var hasDitto = false;
    try {
      var roster = Array.isArray(pen.mons) ? pen.mons : [];
      for (var pi = 0; pi < roster.length; pi++) {
        var pm = roster[pi] && roster[pi].mon;
        if (!pm) continue;
        var pid = Number(pm.id) || 0;
        if (pid === K.DITTO) { hasDitto = true; continue; }
        if (pm.noEgg || K.NO_EGG.indexOf(pid) >= 0) continue;
        pool.push({ uid: pm.uid, id: pid, shiny: !!pm.shiny, slot: pool.length + 1 });
      }
    } catch (e3) { /* ignore */ }

    function eta(i) { return goal > 0 ? i * goal : 0; }

    function scanFixed(threshold, count, limit, forceBx) {
      var out = [];
      var N0 = pool.length;
      for (var i = 0; i < (limit || 50000) && out.length < count; i++) {
        var th = threshold * (i === 0 && (bxNext || forceBx) ? mult : 1);
        if (eggKHash(laid + i, save) < th) {
          var row = { step: i, k: laid + i, etaMs: eta(i) };
          if (N0) {
            var ix = Math.floor(eggHash(trainerSeed(save) + '|egg|' + (laid + i) + '|1') * N0);
            var pp = pool[ix];
            row.parent = pp ? { id: pp.id, shiny: pp.shiny, slot: pp.slot } : null;
          }
          out.push(row);
        }
      }
      return out;
    }

    function scanPool(count, limit, forceBx) {
      var out = [];
      var N = pool.length;
      for (var i = 0; i < (limit || 20000) && out.length < count; i++) {
        var k = laid + i;
        var th = base;
        if (N) {
          var r1 = eggHash(trainerSeed(save) + '|egg|' + k + '|1');
          var idx = Math.floor(r1 * N);
          var par = pool[idx];
          if (par && par.shiny) th = Math.max(parentRate, base);
        }
        if (i === 0 && (bxNext || forceBx)) th = th * mult;
        if (eggKHash(k, save) < th) {
          var row = { step: i, k: k, etaMs: eta(i), threshold: th };
          if (N) {
            var idx2 = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * N);
            row.parent = pool[idx2] ? { id: pool[idx2].id, shiny: pool[idx2].shiny, slot: pool[idx2].slot } : null;
          }
          out.push(row);
        }
      }
      return out;
    }

    var nextInfo = (function () {
      var k = laid;
      var r0 = eggKHash(k, save);
      var th = base;
      var par = null;
      if (pool.length) {
        var idx = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * pool.length);
        par = pool[idx] || null;
        if (par && par.shiny) th = Math.max(parentRate, base);
      }
      return {
        k: k, roll: r0, threshold: th, thresholdBx: th * mult,
        parent: par ? { id: par.id, shiny: par.shiny, slot: par.slot } : null,
        plainShiny: r0 < th, bxShiny: r0 < th * mult, bxPending: bxNext
      };
    })();

    function scanFlip(th, limit) {
      var out = [];
      var NF = pool.length;
      for (var i = 0; i < 20000 && out.length < limit; i++) {
        var k = laid + i;
        var r = eggKHash(k, save);
        if (r >= th && r < th * mult) {
          var rowF = { step: i, k: k, etaMs: eta(i), threshold: th * mult };
          if (NF) {
            var ixF = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * NF);
            var ppF = pool[ixF];
            rowF.parent = ppF ? { id: ppF.id, shiny: ppF.shiny, slot: ppF.slot } : null;
          }
          out.push(rowF);
        }
      }
      return out;
    }

    /* 吃果才会闪（原版 flipList：逐颗按抽到的亲代是否闪光定阈值，roll 落在 [th, th×2)） */
    var flipList = (function () {
      var out = [];
      var max = 2000;
      var N = pool.length;
      for (var i = 0; i < max && out.length < 20; i++) {
        var k = laid + i;
        var th = base;
        var par = null;
        if (N) {
          var idx = Math.floor(eggHash(trainerSeed(save) + '|egg|' + k + '|1') * N);
          par = pool[idx] || null;
          if (par && par.shiny) th = Math.max(parentRate, base);
        }
        var r0 = eggKHash(k, save);
        if (r0 >= th && r0 < th * mult) {
          out.push({ step: i, k: k, etaMs: eta(i), threshold: th, parent: par ? { id: par.id, shiny: par.shiny, slot: par.slot } : null });
        }
      }
      return out;
    })();
    var flipShinyList = scanFlip(Math.max(parentRate, base), 10);
    var flipPlainList = scanFlip(base, 10);
    var poolList = scanPool(10, 20000);
    var berryPoolList = scanPool(10, 20000, true);
    var shinyList = scanFixed(Math.max(parentRate, base), 10, 20000);
    var plainList = scanFixed(base, 3, 50000);

    return {
      laid: laid, bx: bxNext, poolSize: pool.length, poolShiny: pool.filter(function (p) { return p.shiny; }).length,
      pool: pool, hasDitto: hasDitto, next: nextInfo,
      shinyList: shinyList, plainList: plainList,
      poolList: poolList, flipList: flipList, flipShinyList: flipShinyList, flipPlainList: flipPlainList,
      berryPoolList: berryPoolList,
      shiny: shinyList[0] || null, plain: plainList[0] || null, poolFirst: poolList[0] || null
    };
  } catch (e) { /* ignore */ }
  return null;
}

/* ---------- 30 天窗口扫描：把未来 720 颗蛋全部分类 ---------- */
var WINDOW_DAYS = 30;
function windowScan(save, days) {
  days = days || WINDOW_DAYS;
  var pen = save && save.pension;
  if (!pen) return null;
  var laid = Number.isFinite(pen.laid)
    ? pen.laid
    : ((+save.stats && +save.stats.hatched || 0) + (Array.isArray(pen.eggs) ? pen.eggs.length : 0));
  var goal = Math.max(Number(pen.eggGoal) || K.EGG_MS, 60000);  // 每颗蛋周期（ms），异常小值钳到 1 分钟防窗口炸开
  var bxNext = !!pen.bx;
  var base = K.SHINY_RATE;
  var parentRate = Math.max(K.SHINY_PARENT_RATE, base);
  var mult = 2;
  var ts = trainerSeed(save);

  /* 亲代池（和 nextShinyInfo 完全一致） */
  var pool = [];
  var hasDitto = false;
  try {
    var roster = Array.isArray(pen.mons) ? pen.mons : [];
    for (var pi = 0; pi < roster.length; pi++) {
      var pm = roster[pi] && roster[pi].mon;
      if (!pm) continue;
      var pid = Number(pm.id) || 0;
      if (pid === K.DITTO) { hasDitto = true; continue; }
      if (pm.noEgg || K.NO_EGG.indexOf(pid) >= 0) continue;
      pool.push({ uid: pm.uid, id: pid, shiny: !!pm.shiny, slot: pool.length + 1 });
    }
  } catch (e) { /* ignore */ }

  /* 窗口大小 */
  var totalMs = days * 86400000;
  var count = Math.floor(totalMs / goal) + 1;  // 30 天 ÷ 4h ≈ 180 颗

  /* 逐颗扫描 */
  var rows = [];
  var catBuckets = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (var i = 0; i < count; i++) {
    var k = laid + i;
    var roll = eggHash(ts + '|egg|' + k + '|0');
    var parent = null;
    var threshold = base;
    if (pool.length) {
      var idx = Math.floor(eggHash(ts + '|egg|' + k + '|1') * pool.length);
      parent = pool[idx] || null;
      if (parent && parent.shiny) threshold = parentRate;
    }
    // 第 0 颗（下一颗）吃果状态：bxNext 会让阈值 ×2
    if (i === 0 && bxNext) threshold = threshold * mult;

    /* 分类判定（原版 popup 口径：固定阈值带，不查亲代是否闪光——
       原版 scanFixed/scanFlip 均只看 roll 落在哪一段，亲代哈希仅用于展示名字） */
    var cat;
    if (roll < base) cat = 2;                        // 普通亲代裸闪（<1/512，必闪）
    else if (roll < base * mult) cat = 3;            // 普通亲代吃果（[1/512,1/256)，喂果必闪）
    else if (roll < parentRate) cat = 4;             // 闪光亲代（[1/256,1/16)，抽中闪光亲代即裸闪）
    else if (roll < parentRate * mult) cat = 5;      // 吃果闪光亲代（[1/16,1/8)，抽中闪光亲代+喂果才闪）
    else cat = 1;

    var row = {
      step: i, k: k, roll: roll, threshold: threshold,
      parent: parent ? { id: parent.id, shiny: parent.shiny, slot: parent.slot } : null,
      cat: cat, etaMs: i * goal,
      bxNote: (i === 0 && bxNext)
    };
    rows.push(row);
    catBuckets[cat].push(row);
  }

  return {
    laid: laid, bx: bxNext, pool: pool,
    poolSize: pool.length, poolShiny: pool.filter(function (p) { return p.shiny; }).length,
    totalScanned: rows.length, days: days,
    rows: rows, buckets: catBuckets,
    /* 便捷：nextShinyInfo 的 info.next 等价物 */
    next: (function () {
      var n0 = rows[0];
      return {
        k: n0.k, roll: n0.roll, threshold: n0.threshold,
        thresholdBx: (n0.parent && n0.parent.shiny ? parentRate : base) * mult,
        parent: n0.parent, cat: n0.cat,
        plainShiny: n0.roll < (n0.parent && n0.parent.shiny ? parentRate : base),
        bxShiny: n0.roll < (n0.parent && n0.parent.shiny ? parentRate : base) * mult,
        bxPending: bxNext
      };
    })()
  };
}

/* ---------- 存档读取（localStorage，零网络） ---------- */
var SAVE_KEY = 'gachamon-save-v1';
var saveCache = { at: 0, data: null };
function readSave(force) {
  if (!force && Date.now() - saveCache.at < 900) return saveCache.data;
  var data = null;
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch (e) { data = null; }
  saveCache = { at: Date.now(), data: data };
  return data;
}

/* ---------- 面板持久化（GM_setValue 替代 chrome.storage.local） ---------- */
function storeGet(key) {
  try { return GM_getValue(key, null); } catch (e) { return null; }
}
function storeSet(key, val) {
  try { GM_setValue(key, val); } catch (e) { /* ignore */ }
}

/* ============================================================================
 * 面板 UI — 独立浮窗，零游戏 DOM 依赖（不需要在培育屋页面）
 * ==========================================================================*/

/* ---------- 样式 ---------- */
GM_addStyle([
  '#pcg-efh { position: fixed; top: 80px; right: 16px; width: 340px; max-height: 85vh;',
  '  overflow: hidden; border-radius: 10px; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.15);',
  '  font-size: 12.5px; font-family: -apple-system,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;',
  '  color: #1b1f24; z-index: 99999; display: flex; flex-direction: column; }',
  '#pcg-efh.pcg-dark { background: #161a20; color: #e6e9ef; box-shadow: 0 4px 18px rgba(0,0,0,.5); }',
  '#pcg-efh.dragging { opacity: .85; user-select: none; }',
  '#pcg-efh .pcg-head { display: flex; align-items: center; gap: 6px; padding: 8px 10px;',
  '  border-bottom: 1px solid #e4e6ea; cursor: move; user-select: none; background: #fafbfc; }',
  '#pcg-efh.pcg-dark .pcg-head { border-color: #2a2f38; background: #0f1216; }',
  '#pcg-efh .pcg-head .pcg-title { font-weight: 700; font-size: 13px; flex: 1; }',
  '#pcg-efh .pcg-head button { background: transparent; border: none; cursor: pointer; padding: 2px 6px;',
  '  border-radius: 4px; color: inherit; font-size: 14px; line-height: 1; }',
  '#pcg-efh .pcg-head button:hover { background: rgba(0,0,0,.08); }',
  '#pcg-efh.pcg-dark .pcg-head button:hover { background: rgba(255,255,255,.1); }',
  '#pcg-efh .pcg-body { padding: 10px; overflow-y: auto; flex: 1; }',
  '#pcg-efh .pcg-body.folded { display: none; }',
  '#pcg-efh .pcg-sec { margin-bottom: 12px; padding: 8px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }',
  '#pcg-efh.pcg-dark .pcg-sec { background: #1c2128; border-color: #2a2f38; }',
  '#pcg-efh .pcg-sec.c2 { background: #fef9c3; border-color: #fde68a; }',
  '#pcg-efh.pcg-dark .pcg-sec.c2 { background: #422006; border-color: #92400e; }',
  '#pcg-efh .pcg-sec.c3 { background: #eef2ff; border-color: #c7d2fe; }',
  '#pcg-efh.pcg-dark .pcg-sec.c3 { background: #1e1b4b; border-color: #3730a3; }',
  '#pcg-efh .pcg-sec.c4 { background: #fff7ed; border-color: #fed7aa; }',
  '#pcg-efh.pcg-dark .pcg-sec.c4 { background: #431407; border-color: #9a3412; }',
  '#pcg-efh .pcg-sec.c5 { background: #faf5ff; border-color: #e9d5ff; }',
  '#pcg-efh.pcg-dark .pcg-sec.c5 { background: #3b0764; border-color: #6b21a8; }',
  '#pcg-efh .pcg-sec-title { font-size: 12px; font-weight: 700; letter-spacing: .04em; margin-bottom: 6px;',
  '  display: flex; align-items: center; gap: 6px; }',
  '#pcg-efh .pcg-sec-title .pcg-cat-count { font-size: 10.5px; padding: 1px 6px; border-radius: 10px; background: rgba(0,0,0,.08); color: inherit; }',
  '#pcg-efh.pcg-dark .pcg-sec-title .pcg-cat-count { background: rgba(255,255,255,.12); }',
  '#pcg-efh .pcg-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 6px; margin-bottom: 3px;',
  '  border-radius: 6px; background: rgba(255,255,255,.5); border: 1px solid transparent; transition: all .15s; }',
  '#pcg-efh.pcg-dark .pcg-row { background: rgba(255,255,255,.04); }',
  '#pcg-efh .pcg-row.c2 { background: linear-gradient(90deg,#fffbeb,#fef3c7); border-color: #fde68a; }',
  '#pcg-efh.pcg-dark .pcg-row.c2 { background: linear-gradient(90deg,#422006,#78350f); border-color: #92400e; }',
  '#pcg-efh .pcg-row.c3 { background: linear-gradient(90deg,#eef2ff,#e0e7ff); border-color: #c7d2fe; }',
  '#pcg-efh.pcg-dark .pcg-row.c3 { background: linear-gradient(90deg,#1e1b4b,#312e81); border-color: #3730a3; }',
  '#pcg-efh .pcg-row.c4 { background: linear-gradient(90deg,#fff7ed,#ffedd5); border-color: #fed7aa; }',
  '#pcg-efh.pcg-dark .pcg-row.c4 { background: linear-gradient(90deg,#431407,#7c2d12); border-color: #9a3412; }',
  '#pcg-efh .pcg-row.c5 { background: linear-gradient(90deg,#faf5ff,#f3e8ff); border-color: #e9d5ff; }',
  '#pcg-efh.pcg-dark .pcg-row.c5 { background: linear-gradient(90deg,#3b0764,#581c87); border-color: #6b21a8; }',
  '#pcg-efh.pcg-dark .pcg-row.c1 { background: rgba(255,255,255,.04); border-color: #2a2f38; }',
  '#pcg-efh .pcg-k { font-family: "SF Mono",Menlo,Consolas,monospace; font-size: 11px; color: #5a616b; font-weight: 500; }',
  '#pcg-efh.pcg-dark .pcg-k { color: #9aa3af; }',
  '#pcg-efh .pcg-val { font-variant-numeric: tabular-nums; font-weight: 600; }',
  '#pcg-efh.pcg-dark .pcg-val { color: #e6e9ef; }',
  '#pcg-efh .pcg-bar { height: 5px; background: #e4e6ea; border-radius: 3px; overflow: hidden; margin-top: 3px; }',
  '#pcg-efh.pcg-dark .pcg-bar { background: #2a2f38; }',
  '#pcg-efh .pcg-bar > div { height: 100%; border-radius: 3px; transition: width .3s; }',
  '#pcg-efh .pcg-row.c1 .pcg-bar > div { background: #cbd5e1; }',
  '#pcg-efh.pcg-dark .pcg-row.c1 .pcg-bar > div { background: #475569; }',
  '#pcg-efh .pcg-parent-badge { font-size: 11px; padding: 0 4px; border-radius: 3px; background: rgba(255,255,255,.7); color: #0369a1; margin-left: 4px; border: 1px solid #bae6fd; }',
  '#pcg-efh.pcg-dark .pcg-parent-badge { background: rgba(56,189,248,.15); color: #7dd3fc; border-color: #0c4a6e; }',
  '#pcg-efh .pcg-cat-badge { font-size: 10px; padding: 1px 5px; border-radius: 3px; margin-left: 6px; font-weight: 600; letter-spacing: .02em; }',
  '#pcg-efh .pcg-row.c2 .pcg-cat-badge { background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }',
  '#pcg-efh.pcg-dark .pcg-row.c2 .pcg-cat-badge { background: rgba(245,158,11,.15); color: #fcd34d; border-color: #92400e; }',
  '#pcg-efh .pcg-row.c3 .pcg-cat-badge { background: #e0e7ff; color: #3730a3; border: 1px solid #a5b4fc; }',
  '#pcg-efh.pcg-dark .pcg-row.c3 .pcg-cat-badge { background: rgba(99,102,241,.15); color: #a5b4fc; border-color: #3730a3; }',
  '#pcg-efh .pcg-row.c4 .pcg-cat-badge { background: #ffedd5; color: #9a3412; border: 1px solid #fdba74; }',
  '#pcg-efh.pcg-dark .pcg-row.c4 .pcg-cat-badge { background: rgba(234,88,12,.15); color: #fdba74; border-color: #9a3412; }',
  '#pcg-efh .pcg-row.c5 .pcg-cat-badge { background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; }',
  '#pcg-efh.pcg-dark .pcg-row.c5 .pcg-cat-badge { background: rgba(147,51,234,.15); color: #d8b4fe; border-color: #6b21a8; }',
  '#pcg-efh .pcg-footer { padding: 6px 10px; border-top: 1px solid #e4e6ea; font-size: 11px; color: #5a616b;',
  '  display: flex; justify-content: space-between; gap: 8px; background: #fafbfc; }',
  '#pcg-efh.pcg-dark .pcg-footer { border-color: #2a2f38; color: #9aa3af; background: #0f1216; }',
  '#pcg-efh .pcg-footer button { background: transparent; border: none; cursor: pointer; color: inherit; font-size: 11px; }',
  '#pcg-efh .pcg-footer button:hover { text-decoration: underline; }',
  '#pcg-efh .pcg-empty { color: #9aa3af; font-size: 12px; padding: 8px 0; text-align: center; }',
  '#pcg-efh .pcg-err { color: #dc2626; font-size: 12px; padding: 8px 0; text-align: center; }',
  '#pcg-efh .pcg-roll { font-family: "SF Mono",Menlo,Consolas,monospace; font-size: 10.5px; color: #5a616b; opacity: .85; }',
  '#pcg-efh.pcg-dark .pcg-roll { color: #9aa3af; }',
  '#pcg-efh .pcg-next-egg { padding: 10px; border-radius: 8px; border: 2px dashed #cbd5e1; margin-bottom: 12px; text-align: center; }',
  '#pcg-efh.pcg-dark .pcg-next-egg { border-color: #475569; }',
  '#pcg-efh .pcg-next-egg.c2 { border-style: solid; border-color: #f59e0b; background: linear-gradient(135deg,#fffbeb,#fef3c7); }',
  '#pcg-efh.pcg-dark .pcg-next-egg.c2 { border-color: #92400e; background: linear-gradient(135deg,#451a03,#78350f); box-shadow: 0 0 12px rgba(245,158,11,.15); }',
  '#pcg-efh .pcg-next-egg.c3 { border-style: solid; border-color: #6366f1; background: linear-gradient(135deg,#eef2ff,#e0e7ff); }',
  '#pcg-efh.pcg-dark .pcg-next-egg.c3 { border-color: #3730a3; background: linear-gradient(135deg,#1e1b4b,#312e81); box-shadow: 0 0 12px rgba(99,102,241,.15); }',
  '#pcg-efh .pcg-next-egg.c4 { border-style: solid; border-color: #ea580c; background: linear-gradient(135deg,#fff7ed,#ffedd5); box-shadow: 0 0 12px rgba(249,115,22,.2); }',
  '#pcg-efh.pcg-dark .pcg-next-egg.c4 { border-color: #9a3412; background: linear-gradient(135deg,#431407,#7c2d12); box-shadow: 0 0 12px rgba(234,88,12,.25); }',
  '#pcg-efh .pcg-next-egg.c5 { border-style: solid; border-color: #9333ea; background: linear-gradient(135deg,#faf5ff,#f3e8ff); box-shadow: 0 0 12px rgba(168,85,247,.2); }',
  '#pcg-efh.pcg-dark .pcg-next-egg.c5 { border-color: #6b21a8; background: linear-gradient(135deg,#3b0764,#581c87); box-shadow: 0 0 12px rgba(147,51,234,.25); }',
  '#pcg-efh .pcg-next-egg h3 { font-size: 14px; margin: 0 0 4px; font-weight: 800; }',
  '#pcg-efh.pcg-dark .pcg-next-egg h3 { color: inherit; }',
  '#pcg-efh .pcg-next-egg .pcg-next-cat { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; margin-bottom: 4px; }',
  '#pcg-efh .pcg-next-egg.c2 .pcg-next-cat { background: #f59e0b; color: #fff; }',
  '#pcg-efh .pcg-next-egg.c3 .pcg-next-cat { background: #6366f1; color: #fff; }',
  '#pcg-efh .pcg-next-egg.c4 .pcg-next-cat { background: #ea580c; color: #fff; }',
  '#pcg-efh .pcg-next-egg.c5 .pcg-next-cat { background: #9333ea; color: #fff; }',
  '#pcg-efh .pcg-tag { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 10px; font-size: 10.5px; font-weight: 600; }',
  '#pcg-efh .pcg-tag.t-s { background: #fef3c7; color: #92400e; }',
  '#pcg-efh .pcg-tag.t-f { background: #ffedd5; color: #9a3412; }',
  '#pcg-efh .pcg-tag.t-p { background: #e2e8f0; color: #334155; }',
  '#pcg-efh.pcg-dark .pcg-tag.t-s { background: #78350f; color: #fde68a; }',
  '#pcg-efh.pcg-dark .pcg-tag.t-f { background: #7c2d12; color: #fdba74; }',
  '#pcg-efh.pcg-dark .pcg-tag.t-p { background: #334155; color: #cbd5e1; }',
  '#pcg-efh .pcg-shiny-badge { display: inline-block; margin-left: 6px; padding: 1px 6px; border-radius: 10px; font-size: 10.5px; font-weight: 700; background: linear-gradient(135deg,#fef3c7,#fde68a); color: #92400e; border: 1px solid #fcd34d; }',
  '#pcg-efh.pcg-dark .pcg-shiny-badge { background: linear-gradient(135deg,#78350f,#92400e); color: #fde68a; border-color: #b45309; }',
  '#pcg-efh .pcg-warn { color: #b45309; }',
  '#pcg-efh.pcg-dark .pcg-warn { color: #fbbf24; }',
  '#pcg-efh .pcg-dist-bar { display: flex; gap: 3px; margin: 4px 0 8px; }',
  '#pcg-efh .pcg-dist-seg { flex: 1; height: 14px; border-radius: 3px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #fff; font-weight: 700; opacity: .9; }',
  '#pcg-efh .pcg-dist-c1 { background: #cbd5e1; }',
  '#pcg-efh.pcg-dark .pcg-dist-c1 { background: #334155; }',
  '#pcg-efh .pcg-dist-c2 { background: linear-gradient(90deg,#fbbf24,#f59e0b); }',
  '#pcg-efh .pcg-dist-c3 { background: linear-gradient(90deg,#818cf8,#6366f1); }',
  '#pcg-efh .pcg-dist-c4 { background: linear-gradient(90deg,#fb923c,#ea580c); }',
  '#pcg-efh .pcg-dist-c5 { background: linear-gradient(90deg,#c084fc,#9333ea); }',
  '#pcg-efh .pcg-prog-list { display: flex; flex-wrap: wrap; gap: 4px; }',
  '#pcg-efh .pcg-prog { font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; background: #fef3c7; color: #92400e; border: 1px solid #fcd34d; }',
  '#pcg-efh.pcg-dark .pcg-prog { background: rgba(245,158,11,.12); color: #fcd34d; border-color: #78350f; }',
  '#pcg-efh .pcg-prog.pcg-prog-shiny { background: #ffedd5; color: #9a3412; border-color: #fdba74; }',
  '#pcg-efh.pcg-dark .pcg-prog.pcg-prog-shiny { background: rgba(234,88,12,.15); color: #fdba74; border-color: #7c2d12; }'
].join('\n'));

/* ---------- 创建面板 ---------- */
function createPanel() {
  var el = document.createElement('div');
  el.id = 'pcg-efh';
  el.innerHTML = [
    '<div class="pcg-head" id="pcg-efh-head">',
    '  <span class="pcg-title">闪光蛋预测</span>',
    '  <button id="pcg-efh-fold" title="折叠/展开">▾</button>',
    '  <button id="pcg-efh-theme" title="主题">◐</button>',
    '  <button id="pcg-efh-close" title="关闭">✕</button>',
    '</div>',
    '<div class="pcg-body" id="pcg-efh-body"></div>',
    '<div class="pcg-footer">',
    '  <span id="pcg-efh-stat">—</span>',
    '  <button id="pcg-efh-refresh">刷新</button>',
    '</div>'
  ].join('');
  document.documentElement.appendChild(el);

  /* 折叠状态 */
  var folded = storeGet('folded');
  if (folded) {
    el.classList.add('folded');
    el.querySelector('.pcg-body').classList.add('folded');
    el.querySelector('#pcg-efh-fold').textContent = '▴';
  }

  /* 主题 */
  var theme = storeGet('theme');
  if (!theme) theme = (matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  if (theme === 'dark') el.classList.add('pcg-dark');

  /* 位置 */
  var pos = storeGet('pos');
  if (pos && typeof pos.left === 'number') {
    el.style.left = pos.left + 'px';
    el.style.top = pos.top + 'px';
    el.style.right = 'auto';
  }

  /* 事件绑定 */
  el.querySelector('#pcg-efh-fold').addEventListener('click', function () {
    el.querySelector('.pcg-body').classList.toggle('folded');
    var f = el.querySelector('.pcg-body').classList.contains('folded');
    storeSet('folded', f);
    el.querySelector('#pcg-efh-fold').textContent = f ? '▴' : '▾';
  });
  el.querySelector('#pcg-efh-theme').addEventListener('click', function () {
    el.classList.toggle('pcg-dark');
    storeSet('theme', el.classList.contains('pcg-dark') ? 'dark' : 'light');
  });
  el.querySelector('#pcg-efh-close').addEventListener('click', function () {
    el.remove();
    storeSet('closed', Date.now());
  });
  el.querySelector('#pcg-efh-refresh').addEventListener('click', function () { saveCache.at = 0; paint(); });

  /* 拖动 */
  (function drag() {
    var head = el.querySelector('#pcg-efh-head');
    var offX = 0, offY = 0, dragging = false;
    head.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      dragging = true;
      el.classList.add('dragging');
      var rect = el.getBoundingClientRect();
      offX = e.clientX - rect.left;
      offY = e.clientY - rect.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var x = Math.max(4, Math.min(window.innerWidth - el.offsetWidth - 4, e.clientX - offX));
      var y = Math.max(4, Math.min(window.innerHeight - 4, e.clientY - offY));
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.right = 'auto';
    });
    document.addEventListener('mouseup', function () {
      if (dragging) {
        dragging = false;
        el.classList.remove('dragging');
        storeSet('pos', { left: parseInt(el.style.left), top: parseInt(el.style.top) });
      }
    });
  })();

  return el;
}

/* ---------- 渲染一行（纯文字，无进度条，roll 在 title 里） ---------- */
function renderRow(row) {
  var cat = row.cat || 1;
  var c = CATEGORY[cat];
  var parentStr = row.parent
    ? ('<span class="pcg-parent-badge">' + (row.parent.shiny ? '✦' : '') + dexName(row.parent.id) + '·槽' + row.parent.slot + '</span>')
    : '';
  var etaStr = row.etaMs > 0 ? fmtDur(row.etaMs) : '（下一颗）';
  var badge = c.badge ? '<span class="pcg-cat-badge">' + c.badge + '</span>' : '';
  var rollStr = row.roll != null ? (row.roll < 0.01 ? row.roll.toFixed(5) : row.roll.toFixed(4)) : '';
  var effectiveTh = row.parent && row.parent.shiny ? (1/16) : (1/512);
  var title = 'roll=' + rollStr + ' · threshold=' + effectiveTh.toFixed(4) + ' · k=' + row.k;
  return '' +
    '<div class="pcg-row c' + cat + '" title="' + title + '">' +
    '  <div>' +
    '    <span class="pcg-k">k=' + row.k + '</span>' + parentStr + badge +
    '  </div>' +
    '  <div class="pcg-val">+' + row.step + ' · ' + etaStr + '</div>' +
    '</div>';
}

/* ---------- 计算缓存：重扫描很贵（原版口径扫 15 万次哈希），3 秒内重绘直接复用 ---------- */
var calcCache = { at: 0, info: null, win: null };
function calcBoth(save) {
  var now = Date.now();
  if (calcCache.info && now - calcCache.at < 3000) {
    return { info: calcCache.info, win: calcCache.win };
  }
  var info = nextShinyInfo(save);            // 原版口径：最近的闪（三类清单）
  var win = windowScan(save, WINDOW_DAYS);   // 窗口扫描：蛋列表
  calcCache = { at: now, info: info, win: win };
  return { info: info, win: win };
}

/* ---------- 三类命中合并，按 k 升序（原版 popup 同款：限额 10/10/3） ---------- */
function mergeHits(info, cap) {
  var groups = [
    [info.shinyList, '闪光亲代'],
    [info.flipShinyList, '吃果闪光亲代'],
    [info.plainList, '普通亲代']
  ];
  var caps = [10, 10, 3];
  var out = [];
  for (var g = 0; g < groups.length; g++) {
    var arr = groups[g][0] || [];
    for (var i = 0; i < arr.length && i < caps[g]; i++) {
      if (arr[i] && Number.isFinite(arr[i].k)) out.push({ row: arr[i], cat: groups[g][1] });
    }
  }
  out.sort(function (a, b) { return a.row.k - b.row.k; });
  return cap ? out.slice(0, cap) : out;
}

function catTag(cat) {
  var cls = cat === '闪光亲代' ? 't-s' : cat === '吃果闪光亲代' ? 't-f' : 't-p';
  var label = cat === '闪光亲代' ? '✦ 亲代闪'
            : cat === '吃果闪光亲代' ? '✦ 吃果亲代闪'
            : cat === '普通亲代' ? '✦ 普通闪'
            : cat;
  return '<i class="pcg-tag ' + cls + '">' + label + '</i>';
}

/* ---------- 主渲染 ---------- */
function paint() {
  var panel = document.getElementById('pcg-efh');
  if (!panel) return;
  var body = panel.querySelector('.pcg-body');
  var footer = panel.querySelector('#pcg-efh-stat');

  var save = readSave();
  if (!save) {
    body.innerHTML = '<div class="pcg-err">读不到游戏存档，请先打开游戏页并登录</div>';
    footer.textContent = '未连接';
    return;
  }

  var calc = calcBoth(save);
  var info = calc.info, win = calc.win;
  if (!info || !win) {
    body.innerHTML = '<div class="pcg-err">存档 pension 字段缺失</div>';
    footer.textContent = '存档不兼容';
    return;
  }

  var laid = info.laid;
  var nx = info.next;
  var html = '';

  /* ---- 块一：亲代池（移到最前） ---- */
  var effectiveThreshold = win.poolShiny > 0 ? '1/16' : '1/512';
  html += '<div class="pcg-sec">';
  html += '<div class="pcg-sec-title"><span>亲代池 (' + win.poolSize + ' 只 · ' + effectiveThreshold + ' 档)';
  if (win.poolShiny > 0) html += ' <span style="font-weight:400;opacity:.75;">含 ' + win.poolShiny + ' 只闪</span>';
  html += '</span></div>';
  if (win.pool.length) {
    html += '<div class="pcg-prog-list">';
    for (var pi = 0; pi < win.pool.length; pi++) {
      var pp = win.pool[pi];
      var isShiny = pp.shiny;
      html += '<span class="pcg-prog' + (isShiny ? ' pcg-prog-shiny' : '') + '">'
            + (isShiny ? '✦ ' : '') + dexName(pp.id) + '</span>';
    }
    html += '</div>';
  } else {
    html += '<div class="pcg-empty">没有可繁殖亲代（百变怪不算）</div>';
  }
  /* 下一颗小卡片（和后续命中同 pcg-row 样式，追加在亲代池末尾） */
  if (nx) {
    var nxWho = nx.parent
      ? ((nx.parent.shiny ? '✦ ' : '') + '槽' + nx.parent.slot + ' ' + dexName(nx.parent.id))
      : '无亲代';
    var nxCatText = CATEGORY[nx.cat] ? CATEGORY[nx.cat].name : '普通';
    html += '<div class="pcg-row c' + nx.cat + '">';
    html += '<div><span class="pcg-k">下一颗 · k=' + nx.k + '</span>';
    html += '<span class="pcg-parent-badge">' + nxWho + '</span>';
    if (CATEGORY[nx.cat] && CATEGORY[nx.cat].badge) {
      html += '<span class="pcg-cat-badge">' + CATEGORY[nx.cat].badge + '</span>';
    }
    html += '</div><div class="pcg-val">(' + nxCatText + ')</div></div>';
  }
  html += '</div>';

  /* ---- 块二：最近的闪（后续命中 + 元信息，不再有下一颗大卡片） ---- */
  var hits = mergeHits(info);
  html += '<div class="pcg-sec"><div class="pcg-sec-title"><span>✦ 最近的闪</span></div>';

  /* 后续命中（原版 cap 10/10/3 合并后按 k 升序取前 5） */
  var pick = hits.length ? hits[0] : null;
  if (pick) {
    var rest = hits.slice(0, 5);
    for (var ri = 0; ri < rest.length; ri++) {
      var it = rest[ri].row;
      var st2 = Math.max(0, it.k - laid);
      var who2 = it.parent
        ? ((it.parent.shiny ? '✦ ' : '') + '槽' + it.parent.slot + ' ' + dexName(it.parent.id))
        : '无亲代';
      var prefix = st2 === 0 ? '下一颗' : '再过 ' + st2 + ' 颗';
      var rowRoll = it.roll != null ? (it.roll < 0.01 ? it.roll.toFixed(5) : it.roll.toFixed(4)) : '';
      var rowTh = it.parent && it.parent.shiny ? '1/16' : '1/512';
      html += '<div class="pcg-row c4" title="roll=' + rowRoll + ' · threshold=' + rowTh + ' · k=' + it.k + '">';
      html += '<div><span class="pcg-k">' + prefix + ' · k=' + it.k + '</span>' +
        '<span class="pcg-parent-badge">' + who2 + '</span>' + catTag(rest[ri].cat) + '</div>' +
        '<div class="pcg-val">' + (it.etaMs > 0 ? fmtDur(it.etaMs) : '—') + '</div></div>';
    }
  } else {
    html += '<div class="pcg-empty">扫描范围内暂无命中</div>';
  }

  /* 元信息行（去掉 roll 显示） */
  if (nx) {
    var stTxt;
    if (nx.plainShiny) stTxt = '<span class="pcg-shiny-badge">✦ 本颗即闪</span>';
    else if (info.bx && nx.bxShiny) stTxt = '<span class="pcg-shiny-badge">✦ 已喂果，这颗会闪</span>';
    else if (nx.bxShiny) stTxt = '<span class="pcg-tag t-f">✦ 喂果才闪</span>';
    else stTxt = '<span style="opacity:.6">不闪</span>';
    var bits = [];
    bits.push('百变怪 ' + (info.hasDitto === false ? '✗ 无' : '✓ 0号位'));
    if (info.bx) bits.push('已吃果 ×2');
    if (info.poolShiny > 0) bits.push('亲代池含 ' + info.poolShiny + ' 闪');
    html += '<div class="pcg-row" style="background:rgba(255,255,255,.3);"><div>' + bits.join(' · ') + '</div>' +
      '<div>' + stTxt + '</div></div>';
  }
  html += '</div>';

  /* ---- 块三：蛋列表 ---- */
  var bare = win.buckets[2].length + win.buckets[4].length;
  var berry = win.buckets[3].length + win.buckets[5].length;
  html += '<div class="pcg-sec">';
  html += '<div class="pcg-sec-title"><span>蛋列表（近 ' + win.days + ' 天）</span>';
  html += '<span class="pcg-cat-count">裸闪 ' + bare + ' · 吃果 ' + berry + '</span></div>';

  /* 全量分布条 */
  html += '<div class="pcg-dist-bar">';
  var allDist = [1, 2, 3, 4, 5].map(function (c) {
    var n = win.buckets[c].length;
    return '<span class="pcg-dist-seg pcg-dist-c' + c + '"'
         + ' title="' + CATEGORY[c].name + '：' + n + '">' + (n > 0 ? n : '') + '</span>';
  }).join('');
  html += allDist + '</div>';

  /* 明细：最近 30 颗（renderRow 已简化为纯文字，无 bar 无 roll） */
  var showRows = win.rows.slice(0, 30);
  for (var ai = 0; ai < showRows.length; ai++) {
    html += renderRow(showRows[ai]);
  }
  html += '<div class="pcg-empty">统计为近 ' + win.days + ' 天全部 ' + win.totalScanned + ' 颗 · 吃果类需喂靛莓果才成立</div>';
  html += '</div>';

  body.innerHTML = html;
  footer.textContent = 'laid=' + info.laid + ' · 近' + win.days + '天：裸闪 ' + bare + ' / 吃果 ' + berry + ' · 明细30颗';
}

/* ---------- 启动 ---------- */
if (storeGet('closed') && Date.now() - storeGet('closed') < 60 * 60 * 1000) {
  /* 用户 1 小时内刚关过，先不自动弹出 */
  // 但还是启动计算循环，让用户手动刷新时能看到
}

var panel = createPanel();
paint();
setInterval(paint, 1000);

})();
