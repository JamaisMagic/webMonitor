var fs = require('fs');
var mWebPage = require('webpage');

var mPage = null;
var mFileContent = fs.read('./static/source/url_obj.txt');
var mData = JSON.parse(mFileContent);
var mLogText = '';
var mCount = 0;

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
        mPage.onResourceTimeout = function(obj) {
            var info = new Date() + 'ResourceTimeout' + ' url id:' + urlObj.id + ' url url:' + renderUrl + ' err id: ' + obj.id + ' err url:' + obj.url + ' errorCode:' + obj.errorCode + ' errorStr:' + obj.errorString + '\n';
            console.log(info);
            if (renderUrl == obj.url) {
                mLogText += info;
                mPage.close();
                setTimeout(function() {
                    createPage();
                    next();
                }, 16);
            } else {
                mPage.render(makeRenderPath(urlObj.id, url), {quality: '10'});
                next();
            }
        };
        mPage.open(renderUrl)
            .then(function(status) {
                var info = new Date() + ' status:' + status + ' id:' + urlObj.id + ' url:' + renderUrl + '\n';
                console.log(info);
                if (status == 'success') {
                    mPage.render(makeRenderPath(urlObj.id, url), {quality: '10'});
                } else {
                    mLogText += info;
                }

                next();
            })
    }
}

function next() {
    if (mData.length > 0) {
        run();
    } else {
        fs.write('./static/log/shot_log.log', mLogText, 'a');
        mPage.close();
        slimer.exit();
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
    mPage.settings.resourceTimeout = 10000;
    mPage.settings.userAgent = 'Mozilla/5.0 (Linux; Android 5.0; SM-G900P Build/LRX21T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36';
}

function init() {
    createPage();

    if (mData && mData.length > 0) {
        run();
    } else {
        console.log('No Data\n');
    }
}

function makeRenderPath(urlId, urlUrl) {
    return './static/screenshots/' + urlId + '_' +  encodeURIComponent(urlUrl) + '.jpg';
}

function isExist(urlId, urlUrl) {
    var path = makeRenderPath(urlId, urlUrl);
    return fs.exists(path);
}


