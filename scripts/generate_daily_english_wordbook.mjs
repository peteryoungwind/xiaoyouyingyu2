import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'doc/generated');

const generatedAt = '2026-06-08';
const scene = '日常英语';
const status = 'PUBLISHED';

const beginnerSingles = `
morning	noun	早晨；上午	daily time
afternoon	noun	下午	daily time
evening	noun	傍晚；晚上	daily time
night	noun	夜晚	daily time
today	noun/adverb	今天	daily time
tomorrow	noun/adverb	明天	daily time
yesterday	noun/adverb	昨天	daily time
weekend	noun	周末	daily time
weekday	noun	工作日	daily time
minute	noun	分钟	daily time
hour	noun	小时	daily time
day	noun	一天；白天	daily time
week	noun	星期	daily time
month	noun	月份	daily time
year	noun	年	daily time
breakfast	noun	早餐	food
lunch	noun	午餐	food
dinner	noun	晚餐	food
meal	noun	一餐；饭	food
snack	noun	零食；小吃	food
rice	noun	米饭	food
noodles	noun	面条	food
bread	noun	面包	food
egg	noun	鸡蛋	food
milk	noun	牛奶	food
coffee	noun	咖啡	food
tea	noun	茶	food
water	noun	水	food
juice	noun	果汁	food
soup	noun	汤	food
vegetable	noun	蔬菜	food
fruit	noun	水果	food
meat	noun	肉	food
fish	noun	鱼	food
chicken	noun	鸡肉	food
beef	noun	牛肉	food
pork	noun	猪肉	food
salad	noun	沙拉	food
dessert	noun	甜点	food
kitchen	noun	厨房	home
bedroom	noun	卧室	home
bathroom	noun	浴室；洗手间	home
living room	noun phrase	客厅	home
door	noun	门	home
window	noun	窗户	home
floor	noun	地板；楼层	home
wall	noun	墙	home
table	noun	桌子	home
chair	noun	椅子	home
bed	noun	床	home
sofa	noun	沙发	home
lamp	noun	灯	home
key	noun	钥匙	home
bag	noun	包	home
phone	noun	手机；电话	communication
charger	noun	充电器	home
wallet	noun	钱包	home
umbrella	noun	雨伞	daily items
towel	noun	毛巾	home
soap	noun	肥皂	home
toothbrush	noun	牙刷	home
toothpaste	noun	牙膏	home
clothes	noun	衣服	clothes
shirt	noun	衬衫	clothes
T-shirt	noun	T恤	clothes
pants	noun	裤子	clothes
dress	noun	连衣裙	clothes
skirt	noun	裙子	clothes
jacket	noun	夹克；外套	clothes
coat	noun	大衣	clothes
sweater	noun	毛衣	clothes
shoes	noun	鞋	clothes
socks	noun	袜子	clothes
hat	noun	帽子	clothes
glasses	noun	眼镜	clothes
watch	noun	手表	clothes
family	noun	家人；家庭	people
parent	noun	父母一方	people
mother	noun	母亲	people
father	noun	父亲	people
child	noun	孩子	people
son	noun	儿子	people
daughter	noun	女儿	people
brother	noun	兄弟	people
sister	noun	姐妹	people
friend	noun	朋友	people
neighbor	noun	邻居	people
classmate	noun	同学	people
coworker	noun	同事	people
teacher	noun	老师	people
student	noun	学生	people
doctor	noun	医生	people
nurse	noun	护士	people
driver	noun	司机	people
shop assistant	noun phrase	店员	people
home	noun	家	places
school	noun	学校	places
office	noun	办公室	places
shop	noun	商店	places
supermarket	noun	超市	places
market	noun	市场	places
restaurant	noun	餐馆	places
cafe	noun	咖啡馆	places
bank	noun	银行	places
hospital	noun	医院	places
pharmacy	noun	药店	places
station	noun	车站	places
airport	noun	机场	places
park	noun	公园	places
street	noun	街道	places
road	noun	道路	places
bus	noun	公交车	transport
taxi	noun	出租车	transport
subway	noun	地铁	transport
train	noun	火车	transport
bike	noun	自行车	transport
car	noun	汽车	transport
ticket	noun	票	transport
seat	noun	座位	transport
map	noun	地图	transport
address	noun	地址	transport
weather	noun	天气	weather
sun	noun	太阳	weather
rain	noun	雨	weather
snow	noun	雪	weather
wind	noun	风	weather
cloud	noun	云	weather
temperature	noun	温度	weather
money	noun	钱	money
cash	noun	现金	money
card	noun	卡片；银行卡	money
price	noun	价格	money
bill	noun	账单	money
receipt	noun	收据	money
sale	noun	促销；特价	money
size	noun	尺码；大小	shopping
color	noun	颜色	shopping
choice	noun	选择	shopping
question	noun	问题	communication
answer	noun	答案	communication
message	noun	消息	communication
email	noun	电子邮件	communication
call	noun/verb	电话；打电话	communication
voice	noun	声音	communication
photo	noun	照片	communication
video	noun	视频	communication
idea	noun	想法	communication
plan	noun	计划	communication
problem	noun	问题	daily life
help	noun/verb	帮助	daily life
work	noun/verb	工作	work and study
job	noun	工作；职位	work and study
meeting	noun	会议	work and study
homework	noun	家庭作业	work and study
lesson	noun	课程	work and study
book	noun	书	work and study
notebook	noun	笔记本	work and study
pen	noun	钢笔；笔	work and study
computer	noun	电脑	work and study
screen	noun	屏幕	work and study
website	noun	网站	work and study
app	noun	应用程序	work and study
music	noun	音乐	leisure
movie	noun	电影	leisure
game	noun	游戏	leisure
sport	noun	运动	leisure
walk	noun/verb	散步；走路	leisure
trip	noun	旅行	leisure
holiday	noun	假期	leisure
party	noun	聚会	leisure
gift	noun	礼物	leisure
happy	adjective	开心的	feelings
sad	adjective	难过的	feelings
tired	adjective	累的	feelings
busy	adjective	忙的	feelings
free	adjective	有空的；免费的	feelings
hungry	adjective	饿的	feelings
thirsty	adjective	渴的	feelings
sleepy	adjective	困的	feelings
sick	adjective	生病的	health
healthy	adjective	健康的	health
hot	adjective	热的	weather
cold	adjective	冷的	weather
warm	adjective	暖和的	weather
cool	adjective	凉爽的	weather
clean	adjective	干净的	home
dirty	adjective	脏的	home
new	adjective	新的	general
old	adjective	旧的；老的	general
good	adjective	好的	general
bad	adjective	坏的；不好的	general
easy	adjective	容易的	general
difficult	adjective	困难的	general
early	adjective/adverb	早的；早地	daily time
late	adjective/adverb	晚的；迟到的	daily time
near	adjective/preposition	近的；在附近	places
far	adjective/adverb	远的	places
cheap	adjective	便宜的	shopping
expensive	adjective	贵的	shopping
big	adjective	大的	general
small	adjective	小的	general
fast	adjective/adverb	快的；快速地	general
slow	adjective/adverb	慢的；缓慢地	general
quiet	adjective	安静的	general
noisy	adjective	吵闹的	general
ready	adjective	准备好的	daily life
busy day	noun phrase	忙碌的一天	daily life
free time	noun phrase	空闲时间	daily life
good idea	noun phrase	好主意	communication
bad weather	noun phrase	坏天气	weather
favorite food	noun phrase	最喜欢的食物	food
daily habit	noun phrase	日常习惯	daily life
phone number	noun phrase	电话号码	communication
bus stop	noun phrase	公交站	transport
train station	noun phrase	火车站	transport
shopping list	noun phrase	购物清单	shopping
water bottle	noun phrase	水瓶	daily items
bedtime	noun	就寝时间	daily routine
morning routine	noun phrase	晨间惯例	daily routine
evening routine	noun phrase	晚间惯例	daily routine
`;

const beginnerVerbs = `
be	verb	是；成为	general
have	verb	有；吃；喝	general
do	verb	做	general
go	verb	去	transport
come	verb	来	transport
get	verb	得到；到达	general
make	verb	制作；使得	general
take	verb	拿；乘坐；花费	general
give	verb	给	general
use	verb	使用	general
need	verb	需要	general
want	verb	想要	general
like	verb	喜欢	feelings
love	verb	喜爱	feelings
know	verb	知道	general
think	verb	认为；思考	communication
feel	verb	感觉	feelings
say	verb	说	communication
tell	verb	告诉	communication
ask	verb	问	communication
answer	verb	回答	communication
talk	verb	谈话	communication
speak	verb	说话	communication
listen	verb	听	communication
hear	verb	听见	communication
see	verb	看见	general
watch	verb	观看	leisure
look	verb	看	general
read	verb	阅读	work and study
write	verb	写	work and study
learn	verb	学习	work and study
study	verb	学习	work and study
work	verb	工作	work and study
start	verb	开始	general
finish	verb	完成	general
stop	verb	停止	general
open	verb	打开	general
close	verb	关闭	general
turn	verb	转动；转向	general
move	verb	移动	general
wait	verb	等待	daily life
try	verb	尝试	general
help	verb	帮助	daily life
find	verb	找到	general
keep	verb	保持；保留	general
leave	verb	离开；留下	transport
bring	verb	带来	general
buy	verb	购买	shopping
pay	verb	付款	money
cost	verb	花费	money
sell	verb	出售	shopping
order	verb	点餐；订购	food
cook	verb	做饭	food
eat	verb	吃	food
drink	verb	喝	food
wash	verb	洗	home
clean	verb	打扫	home
wear	verb	穿	clothes
change	verb	更换；改变	general
sleep	verb	睡觉	health
rest	verb	休息	health
exercise	verb	锻炼	health
walk	verb	走路；散步	transport
run	verb	跑	health
drive	verb	开车	transport
ride	verb	骑	transport
call	verb	打电话	communication
text	verb	发短信	communication
send	verb	发送	communication
check	verb	检查；查看	daily life
show	verb	展示	communication
meet	verb	见面	people
visit	verb	拜访；参观	people
enjoy	verb	享受；喜欢	feelings
remember	verb	记得	general
forget	verb	忘记	general
choose	verb	选择	shopping
carry	verb	携带	general
`;

const beginnerPhrases = `
wake up	verb phrase	醒来	daily routine
get up	verb phrase	起床	daily routine
brush my teeth	verb phrase	刷牙	daily routine
wash my face	verb phrase	洗脸	daily routine
take a shower	verb phrase	洗澡	daily routine
get dressed	verb phrase	穿好衣服	daily routine
make the bed	verb phrase	整理床铺	daily routine
have breakfast	verb phrase	吃早餐	food
have lunch	verb phrase	吃午餐	food
have dinner	verb phrase	吃晚餐	food
drink water	verb phrase	喝水	food
make coffee	verb phrase	煮咖啡	food
make tea	verb phrase	泡茶	food
cook rice	verb phrase	煮饭	food
make soup	verb phrase	做汤	food
wash dishes	verb phrase	洗碗	home
clean the room	verb phrase	打扫房间	home
take out the trash	verb phrase	倒垃圾	home
do laundry	verb phrase	洗衣服	home
fold clothes	verb phrase	叠衣服	home
turn on the light	verb phrase	开灯	home
turn off the light	verb phrase	关灯	home
open the door	verb phrase	开门	home
close the window	verb phrase	关窗	home
lock the door	verb phrase	锁门	home
find my keys	verb phrase	找钥匙	home
charge my phone	verb phrase	给手机充电	home
check my phone	verb phrase	看手机	communication
send a message	verb phrase	发消息	communication
make a call	verb phrase	打电话	communication
answer the phone	verb phrase	接电话	communication
take a photo	verb phrase	拍照	communication
watch a video	verb phrase	看视频	leisure
listen to music	verb phrase	听音乐	leisure
read a book	verb phrase	读书	work and study
write a note	verb phrase	写便条	work and study
do homework	verb phrase	做作业	work and study
go to school	verb phrase	去学校	work and study
go to work	verb phrase	去上班	work and study
leave home	verb phrase	离开家	transport
come back home	verb phrase	回家	transport
take a bus	verb phrase	坐公交	transport
take the subway	verb phrase	坐地铁	transport
call a taxi	verb phrase	叫出租车	transport
ride a bike	verb phrase	骑自行车	transport
drive a car	verb phrase	开车	transport
buy a ticket	verb phrase	买票	transport
ask for directions	verb phrase	问路	transport
turn left	verb phrase	左转	transport
turn right	verb phrase	右转	transport
go straight	verb phrase	直走	transport
cross the street	verb phrase	过马路	transport
wait in line	verb phrase	排队等候	daily life
buy groceries	verb phrase	买日用品和食品	shopping
make a shopping list	verb phrase	列购物清单	shopping
try it on	verb phrase	试穿	shopping
pay by card	verb phrase	刷卡付款	money
pay in cash	verb phrase	现金付款	money
ask the price	verb phrase	询问价格	shopping
keep the receipt	verb phrase	保留收据	shopping
order food	verb phrase	点餐	food
book a table	verb phrase	订桌	food
ask for the bill	verb phrase	要账单	food
split the bill	verb phrase	平摊账单	food
meet a friend	verb phrase	见朋友	people
visit my parents	verb phrase	看望父母	people
say hello	verb phrase	打招呼	communication
say goodbye	verb phrase	道别	communication
say sorry	verb phrase	道歉	communication
say thank you	verb phrase	说谢谢	communication
ask a question	verb phrase	问问题	communication
give an answer	verb phrase	给出答案	communication
make a plan	verb phrase	制定计划	daily life
change plans	verb phrase	改变计划	daily life
take a break	verb phrase	休息一下	health
go for a walk	verb phrase	去散步	health
do exercise	verb phrase	做运动	health
feel better	verb phrase	感觉好些	health
feel sick	verb phrase	感觉不舒服	health
see a doctor	verb phrase	看医生	health
take medicine	verb phrase	吃药	health
go to bed	verb phrase	上床睡觉	daily routine
fall asleep	verb phrase	睡着	health
stay at home	verb phrase	待在家	home
`;

const beginnerGeneratedPatterns = [
  ['talk about', '谈论', ['weather|天气', 'family|家人', 'work|工作', 'school|学校', 'food|食物', 'weekend plans|周末计划', 'daily habits|日常习惯', 'free time|空闲时间']],
  ['ask about', '询问', ['the price|价格', 'the time|时间', 'the address|地址', 'the menu|菜单', 'the schedule|日程', 'the weather|天气', 'the homework|作业', 'the plan|计划']],
  ['look for', '寻找', ['my phone|我的手机', 'my keys|我的钥匙', 'a seat|座位', 'a shop|商店', 'a restaurant|餐馆', 'a bus stop|公交站', 'a charger|充电器', 'my wallet|我的钱包']],
  ['get', '获得；变得；到达', ['ready|准备好', 'home|到家', 'there|到那里', 'tired|累', 'hungry|饿', 'better|好转', 'a ticket|一张票', 'some rest|一些休息']],
  ['make', '制作；安排', ['breakfast|早餐', 'a plan|计划', 'a call|电话', 'a choice|选择', 'a list|清单', 'a mistake|错误', 'friends|朋友', 'time|时间']],
  ['take', '拿；进行；花费', ['a seat|座位', 'a photo|照片', 'a bus|公交车', 'a taxi|出租车', 'a break|休息', 'notes|笔记', 'an umbrella|雨伞', 'my bag|我的包']],
  ['have', '有；吃；经历', ['time|时间', 'fun|乐趣', 'a problem|问题', 'a question|问题', 'a cold|感冒', 'a meeting|会议', 'a good day|美好的一天', 'a small bag|一个小包']],
  ['need', '需要', ['help|帮助', 'more time|更多时间', 'some water|一些水', 'a new phone|一部新手机', 'a clean towel|干净毛巾', 'a quiet place|安静的地方', 'a taxi|出租车', 'a doctor|医生']],
  ['enjoy', '喜欢；享受', ['the meal|这顿饭', 'the movie|这部电影', 'the music|这首音乐', 'the weekend|周末', 'the walk|散步', 'the party|聚会', 'the lesson|课程', 'the trip|旅行']],
  ['help with', '帮忙做', ['homework|作业', 'cooking|做饭', 'cleaning|打扫', 'shopping|购物', 'the bags|这些包', 'the dishes|洗碗', 'the plan|计划', 'the kids|孩子们']],
  ['go to', '去', ['the park|公园', 'the bank|银行', 'the pharmacy|药店', 'the hospital|医院', 'the supermarket|超市', 'the station|车站', 'the office|办公室', 'the restaurant|餐馆']],
  ['come to', '来到', ['my home|我家', 'the party|聚会', 'the meeting|会议', 'school|学校', 'work|工作地点', 'the station|车站', 'the shop|商店', 'the cafe|咖啡馆']],
  ['check', '查看；确认', ['the time|时间', 'the weather|天气', 'the message|消息', 'the address|地址', 'the price|价格', 'the bill|账单', 'the list|清单', 'the door|门']],
  ['open', '打开', ['the app|应用', 'the window|窗户', 'the fridge|冰箱', 'the bag|包', 'the box|盒子', 'the book|书', 'the email|邮件', 'the map|地图']],
  ['close', '关闭', ['the app|应用', 'the door|门', 'the window|窗户', 'the bag|包', 'the box|盒子', 'the book|书', 'the shop|商店', 'the fridge|冰箱']],
  ['bring', '带来', ['my phone|手机', 'some water|一些水', 'an umbrella|雨伞', 'a jacket|夹克', 'my bag|包', 'the tickets|票', 'a gift|礼物', 'some snacks|零食']],
  ['choose', '选择', ['a seat|座位', 'a color|颜色', 'a size|尺码', 'a dish|菜品', 'a movie|电影', 'a route|路线', 'a time|时间', 'a gift|礼物']],
  ['remember to', '记得去', ['call me|给我打电话', 'bring your card|带银行卡', 'lock the door|锁门', 'take your medicine|吃药', 'charge your phone|给手机充电', 'buy milk|买牛奶', 'check the time|看时间', 'send the message|发消息']],
  ['forget to', '忘记去', ['bring my keys|带钥匙', 'buy eggs|买鸡蛋', 'call back|回电话', 'take an umbrella|带伞', 'pay the bill|付账', 'check the address|确认地址', 'close the window|关窗', 'set an alarm|设闹钟']],
  ['wait for', '等待', ['the bus|公交车', 'a friend|朋友', 'the food|食物', 'the train|火车', 'the call|电话', 'the answer|答案', 'the elevator|电梯', 'the rain to stop|雨停']],
];

const advancedExpressions = `
run errands	verb phrase	办杂事；跑腿	daily life
sort out	verb phrase	整理好；解决	daily life
tidy up	verb phrase	收拾整齐	home
freshen up	verb phrase	梳洗一下；清爽一下	daily routine
stock up on	verb phrase	囤一些；补充	shopping
cut down on	verb phrase	减少	health
keep track of	verb phrase	记录；跟踪	daily life
stick to a routine	verb phrase	坚持作息	daily routine
fit something in	verb phrase	抽时间安排某事	daily life
catch up on	verb phrase	补上；赶做	daily life
wind down	verb phrase	放松下来	health
sleep in	verb phrase	睡懒觉	health
stay up late	verb phrase	熬夜	health
get around to	verb phrase	终于抽时间做	daily life
put something off	verb phrase	推迟某事	daily life
drop by	verb phrase	顺路拜访	people
come over	verb phrase	来家里；过来	people
head out	verb phrase	出门	transport
head back	verb phrase	返回	transport
get stuck in traffic	verb phrase	堵在路上	transport
miss the train	verb phrase	错过火车	transport
catch the last bus	verb phrase	赶上末班车	transport
give someone a lift	verb phrase	开车捎某人	transport
get a ride	verb phrase	搭车	transport
take a shortcut	verb phrase	抄近路	transport
take the long way	verb phrase	绕远路	transport
pick someone up	verb phrase	接某人	transport
drop someone off	verb phrase	送某人下车	transport
check in	verb phrase	办理入住；报平安	travel
check out	verb phrase	退房；查看	travel
pack light	verb phrase	轻装出行	travel
travel light	verb phrase	轻装旅行	travel
make a reservation	verb phrase	预约；预订	food
grab a bite	verb phrase	随便吃点	food
eat out	verb phrase	外出就餐	food
order takeout	verb phrase	点外卖	food
heat up leftovers	verb phrase	热剩饭	food
go grocery shopping	verb phrase	去买食品杂货	shopping
compare prices	verb phrase	比较价格	shopping
return an item	verb phrase	退货	shopping
ask for a refund	verb phrase	要求退款	shopping
get a discount	verb phrase	得到折扣	shopping
be on sale	verb phrase	打折出售	shopping
sell out	verb phrase	售罄	shopping
try something on	verb phrase	试穿某物	shopping
fit well	verb phrase	很合身	clothes
go with	verb phrase	搭配；选择	clothes
dress up	verb phrase	打扮	clothes
dress casually	verb phrase	穿得休闲	clothes
layer up	verb phrase	多穿几层	clothes
bundle up	verb phrase	穿暖和	weather
cool down	verb phrase	凉快下来；冷静	weather
warm up	verb phrase	暖和起来；热身	weather
pour down	verb phrase	下大雨	weather
clear up	verb phrase	天气转晴	weather
get chilly	verb phrase	变冷	weather
be under the weather	verb phrase	身体不舒服	health
come down with	verb phrase	患上；染上	health
shake off a cold	verb phrase	摆脱感冒	health
get back on my feet	verb phrase	恢复健康	health
take it easy	verb phrase	放轻松；别太累	health
burn out	verb phrase	累垮；筋疲力尽	health
feel worn out	verb phrase	感到筋疲力尽	feelings
feel refreshed	verb phrase	感到精神恢复	feelings
feel overwhelmed	verb phrase	感到压力很大	feelings
cheer someone up	verb phrase	让某人开心起来	feelings
let someone down	verb phrase	让某人失望	feelings
calm down	verb phrase	冷静下来	feelings
open up	verb phrase	敞开心扉	communication
bring up	verb phrase	提起；提出	communication
point out	verb phrase	指出	communication
clear things up	verb phrase	把事情说清楚	communication
keep someone posted	verb phrase	随时告知某人	communication
get back to someone	verb phrase	稍后回复某人	communication
touch base	verb phrase	简单沟通一下	communication
have a quick word	verb phrase	简短聊一下	communication
small talk	noun phrase	闲聊	communication
catch up with someone	verb phrase	和某人叙旧	people
make up with someone	verb phrase	与某人和好	people
hang out	verb phrase	闲逛；一起玩	leisure
come along	verb phrase	一起来	people
show up	verb phrase	出现；到场	people
turn up	verb phrase	出现；音量调大	people
back out	verb phrase	退出；反悔	daily life
join in	verb phrase	加入	people
keep in touch	verb phrase	保持联系	people
lose touch	verb phrase	失去联系	people
make room for	verb phrase	为某事腾出空间	daily life
clear my schedule	verb phrase	清空日程	daily life
move things around	verb phrase	调整安排	daily life
work around	verb phrase	绕开；灵活处理	daily life
plan ahead	verb phrase	提前计划	daily life
play it by ear	verb phrase	到时候再看	daily life
be pressed for time	verb phrase	时间紧	daily life
be short on time	verb phrase	时间不够	daily life
be in a rush	verb phrase	很赶时间	daily life
take my time	verb phrase	慢慢来	daily life
make the most of	verb phrase	充分利用	daily life
make do with	verb phrase	凑合用	daily life
get by	verb phrase	勉强应付	daily life
work out	verb phrase	顺利解决；锻炼	daily life
come in handy	verb phrase	派上用场	daily life
be worth it	verb phrase	值得	daily life
be up to someone	verb phrase	由某人决定	daily life
be up for something	verb phrase	愿意做某事	leisure
be into something	verb phrase	喜欢某事	leisure
be out of something	verb phrase	用完某物	shopping
be about to	verb phrase	正要	daily life
end up	verb phrase	最终	daily life
turn out	verb phrase	结果是	daily life
come up	verb phrase	出现；被提到	daily life
deal with	verb phrase	处理	daily life
look into	verb phrase	调查；了解	daily life
figure out	verb phrase	弄明白	daily life
think it over	verb phrase	仔细考虑	communication
make up my mind	verb phrase	下定决心	communication
change my mind	verb phrase	改变主意	communication
rule out	verb phrase	排除	communication
bring along	verb phrase	随身带上	transport
leave something behind	verb phrase	把某物落下	daily life
run out of	verb phrase	用完	shopping
top up	verb phrase	充值；加满	money
pay someone back	verb phrase	还钱给某人	money
split the cost	verb phrase	分摊费用	money
save up for	verb phrase	攒钱买	money
live within my means	verb phrase	量入为出	money
stretch my budget	verb phrase	把预算用得更久	money
`;

const advancedSingles = `
routine	noun	例行安排；日常惯例	daily routine
ritual	noun	固定习惯；仪式感行为	daily routine
errand	noun	杂事；跑腿的事	daily life
chore	noun	家务	home
clutter	noun	杂物；凌乱	home
leftovers	noun	剩饭剩菜	food
ingredient	noun	食材	food
portion	noun	一份；分量	food
craving	noun	强烈想吃的欲望	food
appetite	noun	胃口	food
nutrition	noun	营养	health
hydration	noun	补水；水分摄入	health
appointment	noun	预约	health
prescription	noun	处方	health
symptom	noun	症状	health
allergy	noun	过敏	health
fatigue	noun	疲劳	health
recovery	noun	恢复	health
commute	noun/verb	通勤	transport
fare	noun	车费	transport
route	noun	路线	transport
transfer	noun/verb	换乘	transport
platform	noun	站台	transport
departure	noun	出发	transport
arrival	noun	到达	transport
delay	noun/verb	延误；推迟	transport
detour	noun	绕行路线	transport
reservation	noun	预订	food
queue	noun/verb	队伍；排队	daily life
refund	noun/verb	退款	shopping
exchange	noun/verb	换货；交换	shopping
warranty	noun	保修	shopping
bargain	noun	便宜货；划算交易	shopping
receipt	noun	收据	shopping
budget	noun	预算	money
expense	noun	开销	money
savings	noun	储蓄	money
balance	noun	余额；平衡	money
payment	noun	付款	money
deposit	noun	押金；存款	money
installment	noun	分期付款	money
subscription	noun	订阅	money
preference	noun	偏好	daily life
option	noun	选择；选项	daily life
alternative	noun	替代选择	daily life
priority	noun	优先事项	daily life
schedule	noun	日程	daily life
availability	noun	可用时间	daily life
flexibility	noun	灵活性	daily life
convenience	noun	便利	daily life
privacy	noun	隐私	daily life
boundary	noun	界限	people
misunderstanding	noun	误会	communication
clarification	noun	澄清	communication
suggestion	noun	建议	communication
recommendation	noun	推荐	communication
compliment	noun	称赞	communication
complaint	noun	抱怨；投诉	communication
apology	noun	道歉	communication
excuse	noun	理由；借口	communication
mood	noun	心情	feelings
stress	noun	压力	feelings
relief	noun	轻松；宽慰	feelings
confidence	noun	信心	feelings
patience	noun	耐心	feelings
motivation	noun	动力	feelings
distraction	noun	分心的事物	daily life
focus	noun/verb	专注	daily life
habit	noun	习惯	daily life
pace	noun	节奏；速度	daily life
comfort	noun	舒适	home
atmosphere	noun	氛围	home
maintenance	noun	维护；保养	home
appliance	noun	家用电器	home
furniture	noun	家具	home
storage	noun	储物空间	home
laundry	noun	洗衣物；洗衣	home
`;

const advancedGeneratedPatterns = [
  ['keep an eye on', '留意；照看', ['my budget|我的预算', 'the weather|天气', 'the time|时间', 'my phone battery|手机电量', 'the kids|孩子们', 'the soup|汤', 'the delivery|配送', 'the schedule|日程']],
  ['make time for', '为……腾出时间', ['exercise|锻炼', 'breakfast|早餐', 'family|家人', 'reading|阅读', 'rest|休息', 'friends|朋友', 'my hobbies|我的爱好', 'a quick walk|短暂散步']],
  ['cut back on', '减少', ['coffee|咖啡', 'snacks|零食', 'screen time|看屏幕时间', 'takeout|外卖', 'sugar|糖', 'late nights|熬夜', 'spending|花销', 'online shopping|网购']],
  ['catch up on', '补上；赶做', ['sleep|睡眠', 'housework|家务', 'emails|邮件', 'messages|消息', 'reading|阅读', 'the news|新闻', 'homework|作业', 'laundry|洗衣']],
  ['be careful with', '小心对待', ['money|钱', 'personal information|个人信息', 'hot water|热水', 'the knife|刀', 'the glass|玻璃杯', 'online payments|网上付款', 'the schedule|日程', 'my words|说话方式']],
  ['get used to', '习惯于', ['a new routine|新的作息', 'the weather|天气', 'living alone|独自生活', 'cooking at home|在家做饭', 'public transport|公共交通', 'a smaller room|更小的房间', 'early mornings|早起', 'the neighborhood|这个街区']],
  ['come up with', '想出', ['a plan|计划', 'a solution|解决办法', 'a better idea|更好的想法', 'a quick answer|快速回答', 'a new recipe|新菜谱', 'a weekend plan|周末计划', 'a polite excuse|礼貌理由', 'a backup option|备用选择']],
  ['make sure', '确保', ['the door is locked|门锁好了', 'my phone is charged|手机有电', 'the bill is paid|账单已付', 'the address is right|地址正确', 'the food is fresh|食物新鲜', 'the time works|时间合适', 'everyone is ready|大家都准备好了', 'I have enough cash|我有足够现金']],
  ['keep things', '保持事情……', ['simple|简单', 'tidy|整洁', 'quiet|安静', 'organized|有条理', 'flexible|灵活', 'private|私密', 'affordable|负担得起', 'under control|可控']],
  ['take care of', '处理；照顾', ['the bills|账单', 'the plants|植物', 'the pets|宠物', 'my health|健康', 'the booking|预订', 'the laundry|洗衣', 'small repairs|小维修', 'the paperwork|文件手续']],
  ['be in the mood for', '有心情想要', ['coffee|咖啡', 'a walk|散步', 'a movie|电影', 'something light|清淡的东西', 'a quiet night|安静的夜晚', 'spicy food|辣的食物', 'a chat|聊天', 'music|音乐']],
  ['look forward to', '期待', ['the weekend|周末', 'the trip|旅行', 'dinner|晚餐', 'seeing my friends|见朋友', 'a day off|休息日', 'the party|聚会', 'trying the food|尝试食物', 'moving in|搬进去']],
  ['get the hang of', '掌握窍门', ['cooking|做饭', 'using the app|使用应用', 'taking the subway|坐地铁', 'ordering online|网上下单', 'speaking English|说英语', 'planning my day|规划一天', 'saving money|省钱', 'keeping the room tidy|保持房间整洁']],
  ['make a habit of', '养成……的习惯', ['drinking water|喝水', 'checking the weather|看天气', 'writing things down|把事情记下来', 'walking after dinner|晚饭后散步', 'cleaning as I go|边用边清理', 'sleeping earlier|早点睡', 'reading labels|看标签', 'saving receipts|保存收据']],
  ['be tempted to', '忍不住想', ['buy it|买它', 'order takeout|点外卖', 'skip breakfast|不吃早餐', 'stay up late|熬夜', 'take a taxi|打车', 'cancel the plan|取消计划', 'eat dessert|吃甜点', 'check my phone|看手机']],
  ['go out of my way to', '特意费心去', ['help a friend|帮朋友', 'save money|省钱', 'be polite|保持礼貌', 'avoid waste|避免浪费', 'make guests comfortable|让客人舒服', 'keep my promise|守信用', 'find a good deal|找划算价格', 'arrive on time|准时到']],
  ['stay on top of', '及时掌握；不落下', ['my bills|账单', 'housework|家务', 'messages|消息', 'appointments|预约', 'my schedule|日程', 'spending|花销', 'laundry|洗衣', 'homework|作业']],
  ['make room in my day for', '在一天中腾出时间给', ['exercise|锻炼', 'a proper meal|好好吃饭', 'a phone call|电话', 'a short break|短暂休息', 'reading|阅读', 'family time|陪家人', 'meal prep|备餐', 'quiet time|安静时间']],
  ['be running low on', '快用完', ['milk|牛奶', 'cash|现金', 'phone battery|手机电量', 'shampoo|洗发水', 'rice|米', 'coffee|咖啡', 'medicine|药', 'clean towels|干净毛巾']],
  ['work something into', '把某事安排进', ['my schedule|日程', 'the morning|早上', 'the weekend|周末', 'my routine|日常作息', 'a busy day|忙碌的一天', 'the trip|旅行', 'our plan|我们的计划', 'the evening|晚上']],
  ['set aside', '留出；预留', ['some money|一些钱', 'ten minutes|十分钟', 'a quiet corner|安静角落', 'time for breakfast|早餐时间', 'a clean towel|干净毛巾', 'a spare key|备用钥匙', 'money for rent|房租钱', 'time to rest|休息时间']],
  ['talk someone through', '耐心给某人讲解', ['the steps|步骤', 'the app|应用', 'the plan|计划', 'the route|路线', 'the recipe|食谱', 'the problem|问题', 'the payment process|付款流程', 'the schedule|日程']],
  ['smooth things over', '缓和关系；把事情圆过去', ['with a friend|和朋友', 'after a misunderstanding|误会之后', 'at dinner|吃饭时', 'with my neighbor|和邻居', 'after being late|迟到后', 'with my family|和家人', 'after a small mistake|小错误后', 'on the phone|电话里']],
  ['make a point of', '特意坚持做', ['being early|早点到', 'checking the bill|核对账单', 'saying thank you|说谢谢', 'drinking water|喝水', 'calling my parents|给父母打电话', 'keeping receipts|保留收据', 'locking the door|锁门', 'reading before bed|睡前阅读']],
  ['get caught up in', '被卷入；沉浸于', ['traffic|交通堵塞', 'small talk|闲聊', 'housework|家务', 'a long call|长电话', 'a busy day|忙碌的一天', 'online shopping|网购', 'a family discussion|家庭讨论', 'the details|细节']],
  ['leave enough time for', '为……留足时间', ['breakfast|早餐', 'the commute|通勤', 'parking|停车', 'packing|打包', 'a shower|洗澡', 'the transfer|换乘', 'payment|付款', 'goodbyes|道别']],
  ['keep my options open for', '为……保留选择空间', ['dinner|晚餐', 'the weekend|周末', 'transportation|交通方式', 'a backup plan|备用计划', 'shopping|购物', 'where to eat|去哪吃', 'how to get there|怎么去', 'the evening|晚上']],
  ['make peace with', '接受；与……和解', ['a small room|小房间', 'a busy schedule|忙碌日程', 'bad weather|坏天气', 'a longer commute|更长通勤', 'a simple meal|简单一餐', 'a tight budget|紧预算', 'a changed plan|改变的计划', 'an early start|早起']],
  ['take the pressure off', '减轻压力', ['my morning|我的早晨', 'the plan|计划', 'the conversation|谈话', 'dinner time|晚餐时间', 'the budget|预算', 'the weekend|周末', 'my family|家人', 'the trip|旅行']],
  ['be mindful of', '留心；顾及', ['noise|噪音', 'other people|他人', 'my spending|花销', 'food waste|食物浪费', 'personal space|个人空间', 'the time|时间', 'my tone|语气', 'the weather|天气']],
  ['do without', '没有……也将就', ['coffee|咖啡', 'a car|车', 'cash|现金', 'takeout|外卖', 'a big room|大房间', 'new clothes|新衣服', 'a dryer|烘干机', 'extra help|额外帮助']],
  ['go easy on', '少用；温和对待', ['salt|盐', 'sugar|糖', 'spending|花钱', 'screen time|看屏幕时间', 'myself|自己', 'the spicy sauce|辣酱', 'coffee|咖啡', 'criticism|批评']],
  ['make sense of', '弄懂；理清', ['the bill|账单', 'the instructions|说明', 'the map|地图', 'the schedule|日程', 'the message|消息', 'the menu|菜单', 'the rules|规则', 'the problem|问题']],
  ['set up', '设置；安排', ['an alarm|闹钟', 'a payment|付款', 'a meeting|会议', 'a new phone|新手机', 'the table|餐桌', 'a reminder|提醒', 'a delivery address|配送地址', 'a budget|预算']],
  ['keep something within', '把某事控制在……以内', ['budget|预算', 'walking distance|步行距离', 'ten minutes|十分钟', 'a simple routine|简单作息', 'a small bag|小包', 'reasonable limits|合理范围', 'a quiet tone|平和语气', 'the plan|计划内']],
  ['be better off', '最好；更适合', ['taking the bus|坐公交', 'staying home|待在家', 'ordering early|早点下单', 'calling first|先打电话', 'saving the money|把钱省下', 'leaving now|现在出发', 'choosing a simple meal|选简单一餐', 'wearing a jacket|穿夹克']],
  ['get around', '出行；四处走动', ['by bike|骑车', 'by subway|坐地铁', 'without a car|不开车', 'on foot|步行', 'in a new city|在新城市', 'with a map|拿着地图', 'on weekends|周末', 'during rush hour|高峰期']],
  ['hold off on', '暂缓', ['buying it|购买', 'making a decision|做决定', 'calling back|回电话', 'ordering food|点餐', 'booking the ticket|订票', 'paying the bill|付账', 'changing plans|改计划', 'sending the message|发消息']],
  ['follow through with', '坚持完成', ['the plan|计划', 'the appointment|预约', 'my routine|作息', 'the promise|承诺', 'the payment|付款', 'the workout|锻炼', 'the cleanup|清理', 'the call|电话']],
  ['draw the line at', '把界限划在', ['spending too much|花太多钱', 'staying up all night|通宵熬夜', 'sharing private details|分享隐私', 'eating too late|太晚吃饭', 'working on weekends|周末工作', 'loud noise|太吵', 'buying unnecessary things|买不必要的东西', 'changing plans again|再次改计划']],
  ['strike a balance between', '在……之间取得平衡', ['work and rest|工作和休息', 'saving and spending|存钱和花钱', 'family and friends|家人和朋友', 'plans and flexibility|计划和灵活性', 'healthy food and treats|健康食物和小奖励', 'privacy and sharing|隐私和分享', 'speed and quality|速度和质量', 'quiet time and social time|独处和社交']],
];

function parseTsv(tsv) {
  return tsv
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [word, partOfSpeech, definitionZh, category] = line.split('\t');
      return { word, partOfSpeech, definitionZh, category };
    });
}

function generatedFromPatterns(patterns, partOfSpeech = 'verb phrase') {
  return patterns.flatMap(([verb, verbZh, objects]) =>
    objects.map((raw) => {
      const [object, objectZh] = raw.split('|');
      return {
        word: `${verb} ${object}`,
        partOfSpeech,
        definitionZh: `${verbZh}${objectZh}`,
        category: 'daily expression',
      };
    }),
  );
}

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function startsWithVowelSound(value) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('hour')) return true;
  return /^[aeiou]/i.test(trimmed);
}

function articleFor(value) {
  if (/^(the|my|your|our|some|a|an)\s/i.test(value)) return value;
  const noArticle = new Set([
    'today', 'tomorrow', 'yesterday', 'rice', 'bread', 'milk', 'coffee', 'tea', 'water', 'juice',
    'soup', 'meat', 'fish', 'chicken', 'beef', 'pork', 'staff', 'cash', 'money', 'homework',
    'music', 'weather', 'rain', 'snow', 'wind', 'help', 'work', 'fun', 'time',
  ]);
  const theNouns = new Set(['morning', 'afternoon', 'evening', 'night', 'weekend', 'weekday', 'sun']);
  const normalized = value.trim().toLowerCase();
  if (theNouns.has(normalized)) return `the ${value}`;
  if (noArticle.has(normalized) || value.endsWith('s') || value.includes(' ')) return value;
  return `${startsWithVowelSound(value) ? 'an' : 'a'} ${value}`;
}

function zhCore(definitionZh) {
  return definitionZh.replace(/（.*?）/g, '').split(/[；;，,]/)[0].trim();
}

function isVerbLike(partOfSpeech) {
  return partOfSpeech.includes('verb') || partOfSpeech.includes('phrase');
}

function isAdjectiveLike(partOfSpeech) {
  return partOfSpeech.includes('adjective');
}

function isAdverbLike(partOfSpeech) {
  return partOfSpeech.includes('adverb');
}

function definitionEn(word, difficulty, category) {
  if (difficulty === 'BEGINNER') {
    return `A high-frequency daily English item used when talking about ${category || word} in simple everyday situations.`;
  }
  return `A natural daily English item used to talk about ${category || word} with more fluent and precise expression.`;
}

function commonPatterns(raw, difficulty) {
  const { word, partOfSpeech } = raw;
  if (isAdverbLike(partOfSpeech)) {
    return `${word}; later ${word}; by ${word}; from ${word}`;
  }
  if (partOfSpeech.includes('noun') && !partOfSpeech.includes('verb')) {
    const item = articleFor(word);
    return `talk about ${item}; need ${item}; look for ${item}; use ${item}`;
  }
  if (isAdjectiveLike(partOfSpeech) && !partOfSpeech.includes('verb')) {
    return `feel ${word}; look ${word}; get ${word}; stay ${word}`;
  }
  if (word.startsWith('be ')) {
    return `${word}; I might ${word}; try to ${word}; don't ${word}`;
  }
  if (difficulty === 'ADVANCED') {
    const phrase = completeVerbPhrase(word);
    return `${phrase}; try to ${phrase}; remember to ${phrase}; find a way to ${phrase}`;
  }
  return `${word}; I usually ${word}; need to ${word}; let's ${word}`;
}

function exampleEn(raw) {
  const { word, partOfSpeech, category } = raw;
  if (isAdverbLike(partOfSpeech)) {
    return `I have a simple plan for ${word}.`;
  }
  if (partOfSpeech.includes('noun') && !partOfSpeech.includes('verb')) {
    return `We talked about ${articleFor(word)} during our everyday conversation.`;
  }
  if (isAdjectiveLike(partOfSpeech) && !partOfSpeech.includes('verb')) {
    return `I felt ${word} after a long day.`;
  }
  if (word.startsWith('be ')) {
    return `I try to ${word} when I talk with people.`;
  }
  if (category === 'weather') {
    return `We may need to ${word} if the weather changes.`;
  }
  if (partOfSpeech.includes('verb phrase')) {
    return `I need to ${completeVerbPhrase(word)} today.`;
  }
  return `I need to ${word} today.`;
}

function exampleZh(raw) {
  const { word, partOfSpeech, definitionZh } = raw;
  const core = zhCore(definitionZh);
  if (isAdverbLike(partOfSpeech)) {
    return `我对${core}有一个简单安排。`;
  }
  if (partOfSpeech.includes('noun') && !partOfSpeech.includes('verb')) {
    return `我们在日常聊天中提到了${core}。`;
  }
  if (isAdjectiveLike(partOfSpeech) && !partOfSpeech.includes('verb')) {
    return `忙了一天后，我感觉很${core}。`;
  }
  if (word.startsWith('be ')) {
    return `和别人交流时，我会尽量${core}。`;
  }
  return `今天我需要${core}。`;
}

function completeVerbPhrase(phrase) {
  const replacements = [
    [/something/g, 'a small task'],
    [/someone/g, 'my friend'],
  ];
  let text = phrase;
  replacements.forEach(([pattern, value]) => {
    text = text.replace(pattern, value);
  });

  const completions = [
    [/stock up on$/i, 'groceries'],
    [/cut down on$/i, 'coffee'],
    [/keep track of$/i, 'my spending'],
    [/catch up on$/i, 'sleep'],
    [/get around to$/i, 'cleaning my room'],
    [/come down with$/i, 'a cold'],
    [/get back to$/i, 'my friend'],
    [/touch base$/i, 'with my friend'],
    [/bring up$/i, 'the plan'],
    [/point out$/i, 'the problem'],
    [/open up$/i, 'to my friend'],
    [/join in$/i, 'the conversation'],
    [/back out$/i, 'of the plan'],
    [/work around$/i, 'the problem'],
    [/look into$/i, 'the issue'],
    [/rule out$/i, 'that option'],
    [/bring along$/i, 'an umbrella'],
    [/top up$/i, 'my phone balance'],
    [/pay someone back$/i, 'my friend back'],
    [/save up for$/i, 'a new phone'],
  ];
  for (const [pattern, object] of completions) {
    if (pattern.test(text)) {
      return text.replace(pattern, (match) => `${match} ${object}`);
    }
  }
  return text;
}

function makeEntry(raw, difficulty, sortOrder) {
  const diffZh = difficulty === 'BEGINNER' ? '初级' : '进阶';
  return {
    word: raw.word,
    phonetic: '',
    partOfSpeech: raw.partOfSpeech,
    definitionZh: `${raw.definitionZh}（${diffZh}日常英语）`,
    definitionEn: definitionEn(raw.word, difficulty, raw.category),
    commonPatterns: commonPatterns(raw, difficulty),
    exampleEn: exampleEn(raw),
    exampleZh: exampleZh(raw),
    difficulty,
    status,
    sourceScene: scene,
    sourceTopicId: null,
    sourceTopicTitle: scene,
    sortOrder,
  };
}

function takeUnique(items, limit, seen = new Set()) {
  const result = [];
  for (const item of items) {
    const key = normalize(item.word);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length === limit) break;
  }
  return result;
}

function buildWords(rawItems, difficulty, count, globalSeen, startOrder) {
  const selected = takeUnique(rawItems, count, globalSeen);
  if (selected.length !== count) {
    throw new Error(`Expected ${count} ${difficulty} items, got ${selected.length}`);
  }
  return selected.map((item, index) => makeEntry(item, difficulty, startOrder + index));
}

function validate(words) {
  const required = [
    'word',
    'partOfSpeech',
    'definitionZh',
    'definitionEn',
    'commonPatterns',
    'exampleEn',
    'exampleZh',
    'difficulty',
    'status',
    'sourceScene',
    'sourceTopicTitle',
  ];
  const lengthLimits = {
    word: 120,
    phonetic: 120,
    definitionZh: 1000,
    definitionEn: 1000,
    commonPatterns: 1200,
    exampleEn: 1200,
    exampleZh: 1200,
    sourceScene: 500,
    sourceTopicTitle: 300,
  };
  const normalized = words.map((word) => normalize(word.word));
  const duplicates = [...new Set(normalized.filter((word, index, array) => array.indexOf(word) !== index))];
  const missing = [];
  const tooLong = [];

  words.forEach((word, index) => {
    required.forEach((field) => {
      if (word[field] === null || word[field] === undefined || String(word[field]).trim() === '') {
        missing.push({ index, word: word.word, field });
      }
    });
    Object.entries(lengthLimits).forEach(([field, limit]) => {
      const value = word[field];
      if (value !== null && value !== undefined && String(value).length > limit) {
        tooLong.push({ index, word: word.word, field, length: String(value).length, limit });
      }
    });
  });

  const counts = {
    total: words.length,
    beginner: words.filter((word) => word.difficulty === 'BEGINNER').length,
    advanced: words.filter((word) => word.difficulty === 'ADVANCED').length,
    published: words.filter((word) => word.status === 'PUBLISHED').length,
    duplicates: duplicates.length,
    missingRequiredFields: missing.length,
    tooLongFields: tooLong.length,
  };

  if (
    counts.total !== 1000 ||
    counts.beginner !== 500 ||
    counts.advanced !== 500 ||
    counts.published !== 1000 ||
    duplicates.length ||
    missing.length ||
    tooLong.length
  ) {
    throw new Error(JSON.stringify({ counts, duplicates, missing: missing.slice(0, 20), tooLong: tooLong.slice(0, 20) }, null, 2));
  }

  return counts;
}

function markdownTable(rows) {
  return [
    '| 难度 | 单词/短语 | 词性 | 中文释义 | 常用搭配/句型 | 例句 |',
    '|---|---|---|---|---|---|',
    ...rows.map((word) =>
      [
        word.difficulty,
        word.word,
        word.partOfSpeech,
        word.definitionZh.replaceAll('|', '/'),
        word.commonPatterns.replaceAll('|', '/'),
        word.exampleEn.replaceAll('|', '/'),
      ].join(' | '),
    ).map((row) => `| ${row} |`),
  ].join('\n');
}

const globalSeen = new Set();
const beginnerRaw = [
  ...parseTsv(beginnerSingles),
  ...parseTsv(beginnerVerbs),
  ...parseTsv(beginnerPhrases),
  ...generatedFromPatterns(beginnerGeneratedPatterns),
];
const advancedRaw = [
  ...parseTsv(advancedExpressions),
  ...parseTsv(advancedSingles),
  ...generatedFromPatterns(advancedGeneratedPatterns),
];

const beginnerWords = buildWords(beginnerRaw, 'BEGINNER', 500, globalSeen, 0);
const advancedWords = buildWords(advancedRaw, 'ADVANCED', 500, globalSeen, beginnerWords.length);
const words = [...beginnerWords, ...advancedWords];
const counts = validate(words);

const data = {
  generatedAt,
  source: 'Codex generated draft following PC admin word-book generation structure',
  wordBook: {
    name: scene,
    description:
      '围绕日常问候、居家生活、饮食购物、交通出行、健康情绪、社交沟通、学习工作和休闲安排整理的日常英语单词本。包含初级 500 个、进阶 500 个，状态为已发布。',
    scene,
    status,
  },
  importPolicy: {
    createNewWordBook: true,
    wordStatus: status,
    generateAudioAfterInsert: false,
    phoneticPolicy: 'phonetic 字段暂留空，避免使用未经校验的机器音标；确认入库后可用系统发音/词典流程补全。',
  },
  counts,
  words,
};

const sampleBeginner = beginnerWords.slice(0, 30);
const sampleAdvanced = advancedWords.slice(0, 30);
const markdown = `# 日常英语单词本生成草稿

- 生成日期：${generatedAt}
- 单词本名称：${scene}
- 单词本状态：PUBLISHED（已发布）
- 生成规模：初级 500 个，进阶 500 个，共 1000 个
- 入库源数据：\`doc/generated/daily-english-wordbook.json\`
- 音标策略：\`phonetic\` 字段暂留空，避免使用未经校验的机器音标；确认入库后可用系统发音/词典流程补全。
- 音频策略：入库时音频字段留空，\`audio_status\` 为 \`PENDING\`，后续可走系统现有 TTS 补全流程。

## 数据结构

每个单词项包含：

\`word\`、\`phonetic\`、\`partOfSpeech\`、\`definitionZh\`、\`definitionEn\`、\`commonPatterns\`、\`exampleEn\`、\`exampleZh\`、\`difficulty\`、\`status\`、\`sourceScene\`、\`sourceTopicId\`、\`sourceTopicTitle\`、\`sortOrder\`。

## 校验结果

- 总数：${counts.total}
- 初级：${counts.beginner}
- 进阶：${counts.advanced}
- 已发布词条：${counts.published}
- 重复单词/短语：${counts.duplicates}
- 必填字段缺失：${counts.missingRequiredFields}
- 字段超长：${counts.tooLongFields}

## 初级样例（前 30 条）

${markdownTable(sampleBeginner)}

## 进阶样例（前 30 条）

${markdownTable(sampleAdvanced)}

## 完整数据

完整 1000 条数据请审阅 JSON：\`doc/generated/daily-english-wordbook.json\`。确认后我会按该文件新建 \`PUBLISHED\` 单词本并批量插入数据库。
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'daily-english-wordbook.json'), JSON.stringify(data, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'daily-english-wordbook.md'), markdown);

console.log(JSON.stringify({ outputDir: outDir, counts }, null, 2));
