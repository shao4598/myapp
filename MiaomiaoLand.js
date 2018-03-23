/**
 * Created by Chloe on 2017/4/16.
 */
var express=require('express'); // 将 Express 作为一个模块引入
var bodyParser=require('body-parser');// express处理表单，激活body-parser插件(ajax 请求的配置项)，使app.post方法可用，使req.body可用。
const path = require('path');
var handlebars=require('express3-handlebars').create({
    defaultLayout:'main', //默认布局
    helpers:{
        section:function(name,options){  //用helper定义section。调用→ {{#section 'head'}}
            if(!this._sections) this._sections={};
            this._sections[name]=options.fn(this);
            return null;
        }
    }
});// 设置 handlebars 视图引擎
var formidable = require('formidable');//上传文件,需要引用中间件Formidable
var jqupload = require('jquery-file-upload-middleware');//jquery上传文件。和formidable并不冲突，可单独用。
var credentials=require('./credentials.js'); // cookie凭证外化。"./"代表当前文件所在的文件夹

var app=express();
app.engine('handlebars',handlebars.engine);
app.set('view engine','handlebars');
app.use(bodyParser.urlencoded({extended:false})); // parse application/x-www-form-urlencoded
app.use(bodyParser.json({ type: 'application/*+json' })); // 接受 json 或者可以转换为json的数据格式
app.use(express.static('public'));// static中间件指派静态资源目录
app.use(function (req,res,next) {
    //console.log(res.locals.partials);
    if(!res.locals.partials) res.locals.partials={}; //res.locals:对于任何视图可用,会将上下文传递给每一个视图。不想让个别的视图干扰指定的上下文，于是将所有的局部文件上下文都放在 partials 对象中。
    res.locals.partials.weather=getWeatherData(); // 给res.locals.partials对象添加了weather属性。调用→ {{#each partials.weather.locations}}
    next();
    //console.log(res.locals.partials);
});// 定义局部文件
function getWeatherData(){
    return{
        locations:[
            {
                name:'上海',
                weatherUrl:'http://www.weather.com.cn/weather/101020100.shtml',
                iconUrl:'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
                weather:'多云',
                temp:'29/23℃'
            },
            {
                name:'台北',
                weatherUrl:'http://www.weather.com.cn/weather1d/101340101.shtml#input',
                iconUrl:'http://icons-ak.wxug.com/i/c/k/rain.gif',
                weather:'雨',
                temp:'32/26℃'
            },
            {
                name:'哈尔滨',
                weatherUrl:'http://www.weather.com.cn/weather1d/101050101.shtml#input',
                iconUrl:'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
                weather:'晴转多云',
                temp:'21/10℃'
            }
        ]
    }
}
app.use('/upload',function (req,res,next) {
    var now=Date.now();
    jqupload.fileHandler({
        uploadDir:function () {
            return __dirname +'/public/uploads/'+now;
        },
        uploadUrl:function () {
            return '/uploads/'+now;
        }
    })(req,res,next);
});
app.use(require('cookie-parser')(credentials.cookieSecret));//外部凭证（此例子含cookie加密需要的secret）
app.use(require('express-session')({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: { secure: true }
}));

// 页面渲染
app.get('/',function(req,res){
    res.render('home');
});
app.get('/about',function(req,res){
    var randomFortune=fortuneCookies[Math.floor(Math.random()*fortuneCookies.length)];
    res.render('about',{fortune:randomFortune});
});
var fortuneCookies=[
    '唧唧复唧唧',
    '木兰当户织',
    '不闻机杼声',
    '惟闻女叹息'
];
app.get('/headers',function (req,res) {
    res.set('Content-Type','text/plain');
    var s='';
    for(var name in req.headers){
        s += name+':'+req.headers[name]+'\n';
    }
    res.send(s);
});//设置/headers路径显示请求报头信息
app.get('/home',function (req,res) {
    res.render('home',{title:'扯犊子？', style:'<b>miao</b>'});
});//将上下文传递给视图
app.get('/no-layout',function (req,res) {
    res.render('no-layout',{layout:null});
});//没有布局的视图渲染
app.get('/clothes',function (req,res) {
    res.render('clothes',{
        sales:{name:'T恤',num:'5件',price:'共计560元'},
        brand:[
            {name:'优衣库',packages:'共6件'},
            {name:'海澜之家',packages:'共1件'}
        ],
        specialsUrl:'http://www.heilanhome.com',
        trade:['T恤','鞋鞋','袜子'],
        test:['111','222'],
        copyrightYear:2017
    });
});//块级表达式
app.get('/news',function (req,res) {
    res.render('news',{
        brand:[
            {title:'除了PPT被吐槽，关于人工智能陆奇还说了什么',link:'http://www.tmtpost.com/2625860.html',thumbSrc:'images/news01.jpg',description:'百度集团总裁、COO陆奇表示，“百度已经不再是一家互联网公司，而是一家人工智能公司，整个公司一切以AI为先，一切以AI思维来指导创新，AI是百度的核心能力。”'},
            {title:'继卓伟被封号后，“鸡汤女王”咪蒙疑似被禁言',link:'http://www.tmtpost.com/2625820.html',thumbSrc:'images/news02.jpg',description:'有媒体报道称，此前称粉丝破千万的微信公众号咪蒙被禁言，禁言前最后发布的头条推送为《嫖娼简史》，目前该篇文章因内容违规已经无法显示。'},
            {title:'阿里盘前大涨10%或登顶中国市值最大公司',link:'http://finance.sina.com.cn/stock/usstock/c/2017-06-08/doc-ifyfzhac0564370.shtml',thumbSrc:'images/news03.jpg',description:'英国《金融时报》敏锐捕捉现场细节报道：当武卫宣布阿里预测阿里巴巴集团2018财年（2017年4月至2018年3月）收入增长45%-49%时，现场投资者发出一阵欢呼声“WOW”。这个数字远远超出市场36%-38%的分析预测'},
            {title:'京东每天减少北京五环内90万次老百姓出行需求',link:'http://finance.people.com.cn/n1/2017/0608/c1004-29327244.html#liuyan',thumbSrc:'images/news04.jpg',description:'京东目前每天在北京市五环内配送超过45万单，而传统商城购物模式下需要老百姓耗费90万次出行，京东高效的电商模式在为老百姓带来便利的同时，降低了城市交通、服务等方面的负荷。京东还将在五年之内把全国五万辆配送车更换为电动车，在北京市三年之内就可完成替换，为首都环境保护做出自己的贡献。'},
            {title:'西班牙马德里华人餐饮、超市进入送货2.0时代',link:'http://www.chinanews.com/hr/2017/06-08/8245376.shtml',thumbSrc:'images/news05.jpg',description:'华人群体已经是西班牙马德里最重要的移民群体之一，而华人餐厅、商店更是随处可见。近几年，马德里市中心出现不少中餐厅，虽然部分新开的中餐厅凭借着更加新潮的理念，在餐饮服务中加入桌游等活动，吸引了大量年轻的中国食客，但是加入到西班牙本土送餐软件服务的地道中餐厅数量并不多，能够外出送餐的餐厅更是屈指可数。'}
        ]
    });
});
app.get('/jquerytest',function (req,res) {
    res.render('jquerytest');
});
app.get('/nursery-rhyme',function (req,res) {
    res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme',function (req,res) {
    res.json({
        animal:'squirrel',
        bodyPart:'tail',
        adjective:'bushy',
        noun:'heck'
    });
});
app.get('/ajax',function (req,res) {
    res.render('ajax');
});
app.get('/demo',function (req,res) {
    var result='';
    var array=[
        {
            name:'MiaoMiao',
            age:'3',
            sex:'girl'
        },
        {
            name:'jianjian',
            age:'27',
            sex:'boy'
        },
        {
            name:'xiongji',
            age:'8',
            sex:'boy'
        }
    ];

    for(var i in array){
        if(array[i].age==req.query.age){ //req.query(get方法)接收浏览器发送过来的数据; req.body(post方法)接收浏览器发送过来的数据
            result=array[i].name;
        }
    }
    res.send(result);
});
app.get('/formDemo',function (req,res) { //路径为formDemo时，渲染formDemo页。
    res.render('formDemo');
});
app.post('/formDemo',function (req,res) { //为formDemo页添加post方法，并在完成数据提交后，重新加载formDemo页。
    console.log(req.body.color);//req.query(get方法)接收浏览器发送过来的数据; req.body(post方法)接收浏览器发送过来的数据
    res.render('formDemo');
});
app.get('/newsletter',function (req,res) {
    res.render('newsletter',{csrf:'CSRF token goes here'});
});
//newsletter.handlebars提交表单到precess.handlebars，提交成功后重定向至thank-you.handlebars
//重定向的跳转页面和action提交到其它页面是两件事，他们没有关联，只是根据不同业务需求采用不同方法罢了。
//服务端的html提交：不同于ajax提交，html提交是input type[submit]在底层完成的，过程不可见。如果采用ajax提交，就不需要form表单和input type[submit]了，他们做的是一样的事。可见ajax对html标签的限制性小了许多。
// app.post('/process',function (req,res) {
//     console.log('Form (from queryString):'+req.query.form);
//     console.log('CSRF token (from hidden form field):'+req.body._csrf);
//     console.log('Name (from visible form field):'+req.body.name);
//     console.log('Email (from visible form field):'+req.body.email);
//     res.redirect(303,'/thank-you');
// });
//服务端的ajax提交，是指接收到客户端ajax提交后，服务端如何响应。如果缺少这一部分，则'服务器瓦特了'。
app.post('/process',function (req,res) {
    if(req.xhr || req.accepts('json,html')==='json'){//ajax提交: ajax是默认就是不支持重定向的，它是局部刷新，不重新加载页面。
        console.log('Form (from queryString):'+req.query.form);
        console.log('Name (from visible form field):'+req.body.name);
        console.log('Email (from visible form field):'+req.body.email);
        // 如果发生错误，应该发送 { error: 'error description' }
        res.send({success:true});//{success:true}传入给客户端$.ajax中的形参data。它是个普通的对象，写成{value:1}也是可以的，随着更换if中的条件就可以了。
    }else{//form提交
        console.log(222);
        // 如果发生错误，应该重定向到错误页面
        res.redirect(303,'/thank-you'); //重定向可以解耦，因为提交逻辑和提交成功样式是无逻辑上的关联的
    }
});
app.get('/thank-you',function (req,res) {
    res.render('thank-you');
});
app.get('/vacation-photo',function(req,res){
    var now = new Date();
    res.render('vacation-photo',{
        year: now.getFullYear(),
        month: now.getMonth()
    });
});
app.post('/vacation-photo/:year/:month', function(req, res){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files){
        if(err) return res.redirect(303, '/error');
        console.log('received fields:');
        console.log(fields);
        console.log('received files:');
        console.log(files);
        console.log(files.photo.path);
        res.redirect(303, '/thank-you');
    });
});
app.get('/jqueryUploads',function (req,res) {
    res.render('jqueryUploads');
});
app.get('/setCookies',function (req,res) {
    // res.cookie('monster','nom nom'); //删除：res.clearCookie('monster');
    // res.cookie('signed_monster','nom nom',{signed:true}); //signed-cookie
    req.session.userName='Anonymous';
	req.session.pwd='xcvxcv123';
    var colorScheme=req.session.colorScheme || 'dark';
	console.log(req.session.pwd);
	console.log(req.session);
    res.render('setCookies');
});

app.use(function (req,res,next) {
    res.status(404); //http状态码为404
    res.render('404'); //渲染404.handlebars页面。可简写为res.status(404).render('404')
}); // 404 catch-all 处理器（中间件)
app.use(function (err,req,res,next) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});// 500 错误处理器（中间件)
var server = app.listen(5000,function(){
    var host=server.address().address;
    var port=server.address().port;
    console.log('http is ok http://%s:%s',host,port);
}); //设置5000端口



