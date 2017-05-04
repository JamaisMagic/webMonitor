var fs = require('fs');
var mWebPage = require('webpage');

var mPage = null;
var mFileContent = fs.read('./static/source/url_obj.txt');
var mData = JSON.parse(mFileContent);
var mLogText = '';
var mCount = 0;

var mViewport = '<meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no"/>';
var mViewportExp = /<[\d\w\s\-"=\/,\.]*width=device-width[\d\w\s\-"=\/,\.]*>/;

init();

function run() {
    var urlObj = mData.shift();
    var url = urlObj.src_url || '';
    mCount += 1;
    console.log('Run begin: ' + 'index: ' + mCount + ' id:' + urlObj.id + ' url:' + url + '\n');

    if (url && !isExist(urlObj.id, url)) {
        render(url);
    } else {
        next();
    }

    function render(renderUrl) {
        mPage.onNavigationRequested = function(navUrl, type, willNavigate, main) {
            navUrl = navUrl || '';
            if (main && navUrl.split('#')[0] != renderUrl.split('#')[0]) {
                renderUrl = navUrl;
                url = navUrl;
                var info = new Date() + ' status_redirect' + ' id:' + urlObj.id + ' url:' + renderUrl + '\n';
                console.log('Redirect: ' + 'index: ' + mCount + ' id:' + urlObj.id + ' url:' + renderUrl + '\n');
                mLogText += info;
                mPage.close();
                setTimeout(function() {
                    createPage();
                    render(renderUrl);
                }, 1); //Note the setTimeout here
            }
        };

        mPage.open(renderUrl, function(status) {
            var info = new Date() + ' status:' + status + ' id:' + urlObj.id + ' url:' + renderUrl + '\n';
            console.log(info);
            if (status == 'success') {
                mPage.render(makeRenderPath(urlObj.id, url), {quality: '10'});
            } else {
                mLogText += info;
            }

            next();
        });
    }
}

function next() {
    if (mData.length > 0) {
        run();
    } else {
        fs.write('./static/log/shot_log.log', mLogText, 'a+');
        mPage.close();
        phantom.exit();
    }
}

function createPage() {
    mPage = mWebPage.create();
    mPage.viewportSize = {
        width: 360,
        height: 640
    };
    mPage.clipRect = {
        top: 0,
        left: 0,
        width: 360,
        height: 640
    };
    mPage.settings.resourceTimeout = 30000;
    mPage.settings.userAgent = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36';
}

function init() {
    createPage();

    if (mData && mData.length > 0) {
        run();
    } else {
        console.log('No Data');
    }
}

function makeRenderPath(urlId, urlUrl) {
    return './static/screenshots/' + urlId + '_' +  encodeURIComponent(urlUrl) + '.jpg';
}

function isExist(urlId, urlUrl) {
    var path = makeRenderPath(urlId, urlUrl);
    return fs.exists(path);
}


